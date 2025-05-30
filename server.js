require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pakua_secret_key_2025';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configurar conexión a MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pakua_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let db;

// Crear pool de conexiones
async function initializeDatabase() {
    try {
        db = mysql.createPool(dbConfig);

        // Verificar conexión
        const connection = await db.getConnection();
        console.log('Conectado a la base de datos MySQL');
        connection.release();

        // Crear tabla de usuarios si no existe
        await createUsersTable();

    } catch (error) {
        console.error('Error al conectar con la base de datos:', error.message);
        process.exit(1);
    }
}

// Crear tabla de usuarios
async function createUsersTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                                 nombre VARCHAR(255) NOT NULL,
                fecha_nacimiento DATE NOT NULL,
                numero_telefono VARCHAR(20) NOT NULL,
                password VARCHAR(255) NOT NULL,
                numero_usuario INT UNIQUE NOT NULL,
                rol ENUM('alumno', 'maestro') NOT NULL DEFAULT 'alumno',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        await db.execute(createTableQuery);
        console.log('Tabla de usuarios creada/verificada');

    } catch (error) {
        console.error('Error al crear tabla:', error.message);
    }
}

// Función para generar número de usuario único
function generarNumeroUsuario() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Middleware para verificar token JWT
function verificarToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const tokenLimpio = token.replace('Bearer ', '');

    jwt.verify(tokenLimpio, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido' });
        }
        req.user = decoded;
        next();
    });
}

// RUTAS DE LA API

// Ruta de registro
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, fecha_nacimiento, pasword, numero_telefono, rol = 'alumno' } = req.body;

        // Validar campos requeridos
        if (!nombre || !fecha_nacimiento || !pasword || !numero_telefono) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar longitud de contraseña
        if (pasword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Generar número de usuario único
        let numeroUsuario;
        let numeroExiste = true;

        while (numeroExiste) {
            numeroUsuario = generarNumeroUsuario();
            const [rows] = await db.execute(
                'SELECT numero_usuario FROM users WHERE numero_usuario = ?',
                [numeroUsuario]
            );
            numeroExiste = rows.length > 0;
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(pasword, saltRounds);

        // Insertar usuario en la base de datos
        const [result] = await db.execute(
            'INSERT INTO users (nombre, fecha_nacimiento, numero_telefono, password, numero_usuario, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, fecha_nacimiento, numero_telefono, hashedPassword, numeroUsuario, rol]
        );

        // Crear token JWT
        const token = jwt.sign(
            {
                id: result.insertId,
                numeroUsuario: numeroUsuario,
                nombre: nombre,
                rol: rol
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                token: token,
                numeroUsuario: numeroUsuario,
                nombre: nombre,
                rol: rol
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);

        // Manejar error de número de usuario duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'El número de usuario ya existe'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta de login
app.post('/api/login', async (req, res) => {
    try {
        const { cuenta, pasword } = req.body;

        // Validar campos requeridos
        if (!cuenta || !pasword) {
            return res.status(400).json({
                success: false,
                message: 'Número de usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario por número de usuario
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE numero_usuario = ?',
            [cuenta]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Número de usuario o contraseña incorrectos'
            });
        }

        const user = rows[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(pasword, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Número de usuario o contraseña incorrectos'
            });
        }

        // Crear token JWT
        const token = jwt.sign(
            {
                id: user.id,
                numeroUsuario: user.numero_usuario,
                nombre: user.nombre,
                rol: user.rol
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token: token,
                numeroUsuario: user.numero_usuario,
                nombre: user.nombre,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta protegida para verificar autenticación
app.get('/api/verify', verificarToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        data: {
            id: req.user.id,
            numeroUsuario: req.user.numeroUsuario,
            nombre: req.user.nombre,
            rol: req.user.rol
        }
    });
});

// Ruta para obtener información del usuario autenticado
app.get('/api/user', verificarToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nombre, fecha_nacimiento, numero_telefono, numero_usuario, rol, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para logout
app.post('/api/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

// Ruta para enviar mensajes a alumnos (solo maestros)
app.post('/api/enviar-mensaje', verificarToken, async (req, res) => {
    try {
        // Verificar si es maestro
        if (req.user.rol !== 'maestro') {
            return res.status(403).json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        const { alumnoId, mensaje } = req.body;

        // Aquí iría la lógica para enviar el mensaje
        // (guardar en base de datos, enviar notificación, etc.)

        // Simulación de envío exitoso
        console.log(`Mensaje enviado a alumno ID ${alumnoId}: ${mensaje}`);

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente'
        });

    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para obtener lista de alumnos (solo maestros)
app.get('/api/alumnos', verificarToken, async (req, res) => {
    try {
        // Verificar si es maestro
        if (req.user.rol !== 'maestro') {
            return res.status(403).json({
                success: false,
                message: 'Acceso no autorizado'
            });
        }

        // Obtener lista de alumnos
        const [rows] = await db.execute(
            'SELECT id, nombre, numero_usuario FROM users WHERE rol = "alumno"'
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Inicializar base de datos y servidor
async function startServer() {
    await initializeDatabase();

    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\nCerrando servidor...');
    if (db) {
        await db.end();
        console.log('Pool de conexiones MySQL cerrado.');
    }
    process.exit(0);
});

// Iniciar el servidor
startServer().catch(error => {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
});