// auth.js - Script mejorado para manejar autenticación y mensajería
const API_BASE_URL = 'http://localhost:3000/api';

// Función para manejar el registro
async function manejarRegistro(event) {
    event.preventDefault();
    const rol = document.getElementById('rol') ? document.getElementById('rol').value : 'alumno';
    const userData = {
        nombre: document.getElementById('nombre').value.trim(),
        fecha_nacimiento: document.getElementById('fecha_de_nacimiento').value,
        pasword: document.getElementById('pasword').value,
        numero_telefono: document.getElementById('numero_de_telefono').value.trim(),
        rol: rol
    };

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
            localStorage.setItem('pakua_token', result.data.token);
            localStorage.setItem('pakua_user', JSON.stringify({
                numeroUsuario: result.data.numeroUsuario,
                nombre: result.data.nombre,
                rol: result.data.rol
            }));

            mostrarMensaje(`¡Registro exitoso! Tu número de usuario es: ${result.data.numeroUsuario}`, 'success');
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
            localStorage.setItem('pakua_token', result.data.token);
            localStorage.setItem('pakua_user', JSON.stringify({
                numeroUsuario: result.data.numeroUsuario,
                nombre: result.data.nombre,
                rol: result.data.rol
            }));

            mostrarMensaje('¡Login exitoso!', 'success');
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
    window.location.href = '../index.html';
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

// FUNCIONES DE MENSAJERÍA

// Función para cargar lista de alumnos conectados
async function cargarAlumnos() {
    try {
        mostrarCargando(true);
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/alumnos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const listaAlumnos = document.getElementById('lista-alumnos');
            if (listaAlumnos) {
                listaAlumnos.innerHTML = '';

                if (result.data.length === 0) {
                    listaAlumnos.innerHTML = '<p class="text-center text-muted">No hay alumnos registrados</p>';
                    return;
                }

                // Crear tabla para mejor visualización
                const tabla = document.createElement('table');
                tabla.className = 'table table-striped table-hover';
                tabla.innerHTML = `
                    <thead class="table-dark">
                        <tr>
                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Teléfono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-alumnos-body"></tbody>
                `;

                const tbody = tabla.querySelector('#tabla-alumnos-body');

                result.data.forEach(alumno => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${alumno.nombre}</td>
                        <td>${alumno.numero_usuario}</td>
                        <td>${alumno.numero_telefono || 'N/A'}</td>
                        <td>
                            <button onclick="abrirEnvioMensaje(${alumno.id}, '${alumno.nombre.replace(/'/g, "\\'")}')" 
                                    class="btn btn-sm btn-primary me-2">
                                <i class="fas fa-envelope"></i> Mensaje
                            </button>
                            <button onclick="verHistorialMensajes(${alumno.id}, '${alumno.nombre.replace(/'/g, "\\'")}')" 
                                    class="btn btn-sm btn-info">
                                <i class="fas fa-history"></i> Historial
                            </button>
                        </td>
                    `;
                    tbody.appendChild(fila);
                });

                listaAlumnos.appendChild(tabla);
            }
        } else {
            mostrarMensaje(result.message || 'Error al cargar alumnos', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    } finally {
        mostrarCargando(false);
    }
}
// Añadir después de cargarAlumnos()
async function cargarMaestros() {
    try {
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/maestros`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error al cargar maestros:', error);
        return [];
    }
}
// Función para abrir modal de envío de mensaje
function abrirEnvioMensaje(alumnoId, nombreAlumno) {
    // Eliminar modal anterior si existe
    const modalAnterior = document.getElementById('mensajeModal');
    if (modalAnterior) {
        modalAnterior.remove();
    }

    const modalHTML = `
        <div class="modal fade" id="mensajeModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-envelope me-2"></i>
                            Enviar mensaje a ${nombreAlumno}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="mensaje-asunto" class="form-label">Asunto:</label>
                            <input type="text" id="mensaje-asunto" class="form-control" 
                                   placeholder="Ingresa el asunto del mensaje">
                        </div>
                        <div class="mb-3">
                            <label for="mensaje-texto" class="form-label">Mensaje:</label>
                            <textarea id="mensaje-texto" class="form-control" rows="6" 
                                      placeholder="Escribe tu mensaje aquí..."></textarea>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="mensaje-urgente">
                            <label class="form-check-label" for="mensaje-urgente">
                                Marcar como urgente
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="enviarMensaje(${alumnoId}, '${nombreAlumno}')">
                            <i class="fas fa-paper-plane me-1"></i>Enviar Mensaje
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const mensajeModal = new bootstrap.Modal(document.getElementById('mensajeModal'));
    mensajeModal.show();
}

// Función para enviar mensaje a alumno
// Función corregida para enviar mensajes
async function enviarMensaje(alumnoId, nombreAlumno) {
    const asunto = document.getElementById('mensaje-asunto').value.trim();
    const mensaje = document.getElementById('mensaje-texto').value.trim();
    const esUrgente = document.getElementById('mensaje-urgente').checked;

    if (!asunto) {
        mostrarMensaje('Debes escribir un asunto', 'error');
        return;
    }

    if (!mensaje) {
        mostrarMensaje('Debes escribir un mensaje', 'error');
        return;
    }

    try {
        mostrarCargando(true);
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/enviar-mensaje`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                alumnoId,
                asunto,
                mensaje,
                esUrgente // Corregido: esUrgente en lugar de esUrgent
            })
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje(`Mensaje enviado correctamente a ${nombreAlumno}`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('mensajeModal')).hide();
            document.getElementById('mensajeModal').remove();
        } else {
            mostrarMensaje(result.message || 'Error al enviar mensaje', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    } finally {
        mostrarCargando(false);
    }
}

// Función para ver historial de mensajes con un alumno
async function verHistorialMensajes(alumnoId, nombreAlumno) {
    try {
        mostrarCargando(true);
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/mensajes/${alumnoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            mostrarHistorialModal(result.data, nombreAlumno);
        } else {
            mostrarMensaje(result.message || 'Error al cargar mensajes', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    } finally {
        mostrarCargando(false);
    }
}

// Función para mostrar modal del historial
function mostrarHistorialModal(mensajes, nombreAlumno) {
    const modalAnterior = document.getElementById('historialModal');
    if (modalAnterior) {
        modalAnterior.remove();
    }

    let historialHTML = '';
    if (mensajes.length === 0) {
        historialHTML = '<p class="text-center text-muted">No hay mensajes enviados a este alumno</p>';
    } else {
        mensajes.forEach(msg => {
            const fecha = new Date(msg.fecha_envio).toLocaleString();
            const urgenteBadge = msg.es_urgente ? '<span class="badge bg-danger ms-2">Urgente</span>' : '';
            const leidoBadge = msg.leido ? '<span class="badge bg-success">Leído</span>' : '<span class="badge bg-warning">No leído</span>';

            historialHTML += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${msg.asunto}${urgenteBadge}</h6>
                        <small class="text-muted">${fecha}</small>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${msg.mensaje}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">De: ${msg.nombre_emisor}</small>
                            ${leidoBadge}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    const modalHTML = `
        <div class="modal fade" id="historialModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            Historial de mensajes - ${nombreAlumno}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" style="max-height: 500px; overflow-y: auto;">
                        ${historialHTML}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const historialModal = new bootstrap.Modal(document.getElementById('historialModal'));
    historialModal.show();
}

// Función para obtener mensajes del alumno (para la vista del alumno)
async function cargarMensajesAlumno() {
    try {
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/mis-mensajes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensajesAlumno(result.data);
        } else {
            console.error('Error al cargar mensajes:', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para mostrar mensajes en la vista del alumno
async function cargarMensajesAlumno() {
    try {
        mostrarCargando(true);
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/mis-mensajes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensajesAlumno(result.data);
        } else {
            mostrarMensaje(result.message || 'Error al cargar mensajes', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    } finally {
        mostrarCargando(false);
    }
}

// Función para mostrar mensajes en la vista del alumno
function mostrarMensajesAlumno(mensajes) {
    const contenedorMensajes = document.getElementById('mensajes-alumno');
    if (!contenedorMensajes) return;

    if (mensajes.length === 0) {
        contenedorMensajes.innerHTML = '<div class="alert alert-info text-center">No tienes mensajes</div>';
        return;
    }

    let mensajesHTML = '<h3 class="mb-4">Mis Mensajes</h3>';
    mensajes.forEach(msg => {
        const fecha = new Date(msg.fecha_envio).toLocaleString();
        const urgenteBadge = msg.es_urgente ?
            '<span class="badge bg-danger ms-2">Urgente</span>' : '';

        const leidoClass = msg.leido ? 'border-light' : 'border-primary';
        const nuevoBadge = !msg.leido ?
            '<span class="badge bg-primary ms-2">Nuevo</span>' : '';

        mensajesHTML += `
            <div class="card mb-3 ${leidoClass}">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0">${msg.asunto}${urgenteBadge}</h5>
                    </div>
                    <div>
                        <small class="text-muted">${fecha}</small>
                        ${nuevoBadge}
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${msg.mensaje}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">De: ${msg.maestro_nombre}</small>
                        ${!msg.leido ? `
                            <button onclick="marcarComoLeido(${msg.id})" 
                                    class="btn btn-sm btn-outline-primary">
                                Marcar como leído
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    contenedorMensajes.innerHTML = mensajesHTML;
}

// Función para marcar mensaje como leído
async function marcarComoLeido(mensajeId) {
    try {
        mostrarCargando(true);
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/marcar-leido/${mensajeId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            // Recargar mensajes después de marcar como leído
            cargarMensajesAlumno();
        } else {
            mostrarMensaje(result.message || 'Error al marcar mensaje', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    } finally {
        mostrarCargando(false);
    }
}

// Función para mostrar información del usuario
function mostrarInfoUsuario() {
    const userData = localStorage.getItem('pakua_user');
    if (userData) {
        const user = JSON.parse(userData);
        const isMaestro = user.rol === 'maestro';

        // Mostrar elementos de maestro si corresponde
        if (isMaestro) {
            const maestroElements = document.querySelectorAll('.maestro-only');
            maestroElements.forEach(el => {
                el.style.display = 'block';
            });
        } else {
            // Si es alumno, cargar sus mensajes
            cargarMensajesAlumno();
        }
    }
}

// Funciones auxiliares
function mostrarMensaje(mensaje, tipo = 'info') {
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

    setTimeout(() => {
        if (div.parentNode) {
            div.remove();
        }
    }, 3000);
}

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

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const formRegistro = document.querySelector('.form');
    if (formRegistro && window.location.pathname.includes('registro.html')) {
        formRegistro.addEventListener('submit', manejarRegistro);
    }

    if (formRegistro && window.location.pathname.includes('inicio-de-sesion.html')) {
        formRegistro.addEventListener('submit', manejarLogin);
    }

    if (window.location.pathname.includes('Pagina-principal.html')) {
        protegerPagina().then(isAuthenticated => {
            if (isAuthenticated) {
                mostrarInfoUsuario();
            }
        });
    }
});

// Exportar funciones
window.manejarRegistro = manejarRegistro;
window.manejarLogin = manejarLogin;
window.logout = logout;
window.protegerPagina = protegerPagina;
window.cargarAlumnos = cargarAlumnos;
window.abrirEnvioMensaje = abrirEnvioMensaje;
window.enviarMensaje = enviarMensaje;
window.verHistorialMensajes = verHistorialMensajes;
window.marcarComoLeido = marcarComoLeido;
window.protegerPagina = protegerPagina;
window.cargarMensajesAlumno = cargarMensajesAlumno;