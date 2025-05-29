// auth.js - Script para manejar autenticación en el frontend
const API_BASE_URL = 'http://localhost:3000/api';

// Función para manejar el registro
async function manejarRegistro(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const userData = {
        nombre: document.getElementById('nombre').value.trim(),
        fecha_nacimiento: document.getElementById('fecha_de_nacimiento').value,
        pasword: document.getElementById('pasword').value,
        numero_telefono: document.getElementById('numero_de_telefono').value.trim()
    };

    // Validaciones básicas
    if (!userData.nombre || !userData.fecha_nacimiento || !userData.pasword || !userData.numero_telefono) {
        mostrarMensaje('Todos los campos son requeridos', 'error');
        return;
    }

    if (userData.pasword.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    try {
        mostrarCargando(true);

        const response = await fetch(`${API_BASE_URL}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (result.success) {
            // Guardar token y datos del usuario
            localStorage.setItem('pakua_token', result.data.token);
            localStorage.setItem('pakua_user', JSON.stringify({
                numeroUsuario: result.data.numeroUsuario,
                nombre: result.data.nombre
            }));

            mostrarMensaje(`¡Registro exitoso! Tu número de usuario es: ${result.data.numeroUsuario}`, 'success');

            // Redirigir a la página principal después de 2 segundos
            setTimeout(() => {
                window.location.href = 'Pagina-principal.html';
            }, 2000);

        } else {
            mostrarMensaje(result.message || 'Error en el registro', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
    } finally {
        mostrarCargando(false);
    }
}

// Función para manejar el login
async function manejarLogin(event) {
    event.preventDefault();

    const cuenta = document.getElementById('cuenta').value.trim();
    const pasword = document.getElementById('pasword').value;

    // Validaciones básicas
    if (!cuenta || !pasword) {
        mostrarMensaje('Número de usuario y contraseña son requeridos', 'error');
        return;
    }

    try {
        mostrarCargando(true);

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cuenta, pasword })
        });

        const result = await response.json();

        if (result.success) {
            // Guardar token y datos del usuario
            localStorage.setItem('pakua_token', result.data.token);
            localStorage.setItem('pakua_user', JSON.stringify({
                numeroUsuario: result.data.numeroUsuario,
                nombre: result.data.nombre
            }));

            mostrarMensaje('¡Login exitoso!', 'success');

            // Redirigir a la página principal
            setTimeout(() => {
                window.location.href = 'Pagina-principal.html';
            }, 1000);

        } else {
            mostrarMensaje(result.message || 'Error en el login', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
    } finally {
        mostrarCargando(false);
    }
}

// Función para verificar autenticación
async function verificarAutenticacion() {
    const token = localStorage.getItem('pakua_token');

    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error al verificar token:', error);
        return false;
    }
}

// Función para logout
function logout() {
    localStorage.removeItem('pakua_token');
    localStorage.removeItem('pakua_user');
    window.location.href = 'index.html';
}

// Función para proteger páginas que requieren autenticación
async function protegerPagina() {
    const isAuthenticated = await verificarAutenticacion();

    if (!isAuthenticated) {
        mostrarMensaje('Debes iniciar sesión para acceder a esta página', 'error');
        setTimeout(() => {
            window.location.href = 'inicio-de-sesion.html';
        }, 2000);
        return false;
    }

    return true;
}

// Función para mostrar información del usuario en la página principal
function mostrarInfoUsuario() {
    const userData = localStorage.getItem('pakua_user');

    if (userData) {
        const user = JSON.parse(userData);
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
            <h3>¡Bienvenido, ${user.nombre}!</h3>
            <p>Número de usuario: ${user.numeroUsuario}</p>
            <button onclick="logout()" class="btn btn-outline-danger btn-sm">Cerrar Sesión</button>
        `;
        welcomeMessage.style.cssText = `
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 10px;
            margin: 20px auto;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;

        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(welcomeMessage, main.firstChild);
        }
    }
}

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
    // Remover mensaje anterior si existe
    const mensajeAnterior = document.querySelector('.mensaje-sistema');
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }

    const div = document.createElement('div');
    div.className = 'mensaje-sistema';
    div.textContent = mensaje;

    const colores = {
        success: '#d4edda',
        error: '#f8d7da',
        info: '#d1ecf1'
    };

    const borderColors = {
        success: '#c3e6cb',
        error: '#f5c6cb',
        info: '#bee5eb'
    };

    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${colores[tipo]};
        border: 1px solid ${borderColors[tipo]};
        color: #333;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;

    document.body.appendChild(div);

    // Remover el mensaje después de 5 segundos
    setTimeout(() => {
        if (div.parentNode) {
            div.remove();
        }
    }, 5000);
}

// Función para mostrar/ocultar indicador de carga
function mostrarCargando(show) {
    let spinner = document.querySelector('.spinner-carga');

    if (show) {
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.className = 'spinner-carga';
            spinner.innerHTML = 'Cargando...';
            spinner.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 1001;
            `;
            document.body.appendChild(spinner);
        }
    } else {
        if (spinner) {
            spinner.remove();
        }
    }
}

// Event listeners cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Para la página de registro
    const formRegistro = document.querySelector('.form');
    if (formRegistro && window.location.pathname.includes('registro.html')) {
        formRegistro.addEventListener('submit', manejarRegistro);
    }

    // Para la página de login
    if (formRegistro && window.location.pathname.includes('inicio-de-sesion.html')) {
        formRegistro.addEventListener('submit', manejarLogin);
    }

    // Para la página principal - verificar autenticación
    if (window.location.pathname.includes('Pagina-principal.html')) {
        protegerPagina().then(isAuthenticated => {
            if (isAuthenticated) {
                mostrarInfoUsuario();
            }
        });
    }
});

// Exportar funciones para uso global
window.manejarRegistro = manejarRegistro;
window.manejarLogin = manejarLogin;
window.logout = logout;
window.protegerPagina = protegerPagina;