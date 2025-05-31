// maestro.js - Funcionalidades exclusivas para maestros
const API_BASE_URL = 'http://localhost:3000/api';

// Función para cargar lista de alumnos con contadores de mensajes
async function cargarAlumnos() {
    try {
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/alumnos-con-mensajes`, {
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
                    listaAlumnos.innerHTML = '<p>No hay alumnos registrados</p>';
                    return;
                }

                result.data.forEach(alumno => {
                    const item = document.createElement('div');
                    item.className = 'alumno-item mb-2 p-2 border rounded';
                    item.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <p class="mb-1"><strong>${alumno.nombre}</strong> (${alumno.numero_usuario})</p>
                                <small class="text-muted">
                                    Mensajes: ${alumno.total_mensajes || 0}
                                    ${alumno.mensajes_no_leidos > 0
                        ? `<span class="badge bg-danger ms-2">${alumno.mensajes_no_leidos} sin leer</span>`
                        : ''}
                                </small>
                            </div>
                            <div>
                                <button onclick="mostrarMensajesAlumno(${alumno.id})" class="btn btn-sm btn-info me-1">
                                    <i class="fas fa-history"></i>
                                </button>
                                <button onclick="abrirEnvioMensaje(${alumno.id})" class="btn btn-sm btn-primary">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    listaAlumnos.appendChild(item);
                });
            }
        } else {
            mostrarMensaje(result.message || 'Error al cargar alumnos', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    }
}

// Función para abrir modal de envío de mensaje
function abrirEnvioMensaje(alumnoId) {
    // Crear modal dinámico
    const modalHTML = `
        <div class="modal fade" id="mensajeModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Enviar mensaje</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <textarea id="mensaje-texto" class="form-control" rows="4" placeholder="Escribe tu mensaje aquí..."></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="enviarMensaje(${alumnoId})">Enviar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insertar modal en el documento
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mostrar modal
    const mensajeModal = new bootstrap.Modal(document.getElementById('mensajeModal'));
    mensajeModal.show();
}

// Función para enviar mensaje a alumno
async function enviarMensaje(alumnoId) {
    const mensaje = document.getElementById('mensaje-texto').value;

    if (!mensaje || mensaje.trim() === '') {
        mostrarMensaje('Debes escribir un mensaje', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/enviar-mensaje`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ alumnoId, mensaje: mensaje.trim() })
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje('Mensaje enviado correctamente', 'success');
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('mensajeModal')).hide();
            // Actualizar lista de alumnos
            setTimeout(cargarAlumnos, 1000);
        } else {
            mostrarMensaje(result.message || 'Error al enviar mensaje', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    }
}

// Función para mostrar modal con historial de mensajes
async function mostrarMensajesAlumno(alumnoId) {
    try {
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/mensajes/${alumnoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            // Crear modal
            const modalHTML = `
                <div class="modal fade" id="mensajesModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Historial de mensajes</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div id="historial-mensajes" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
                                    ${result.data.length === 0
                ? '<p>No hay mensajes</p>'
                : result.data.map(mensaje => `
                                            <div class="card mb-2 ${mensaje.leido ? 'bg-light' : 'bg-warning bg-opacity-10'}">
                                                <div class="card-body">
                                                    <div class="d-flex justify-content-between">
                                                        <h6 class="card-title">${mensaje.nombre_emisor}</h6>
                                                        <small>${new Date(mensaje.fecha_envio).toLocaleString()}</small>
                                                    </div>
                                                    <p class="card-text">${mensaje.mensaje}</p>
                                                    <small>${mensaje.leido ? 'Leído' : 'No leído'}</small>
                                                </div>
                                            </div>
                                        `).join('')}
                                </div>
                                <div class="mb-3">
                                    <textarea id="nuevo-mensaje-texto" class="form-control" rows="3" placeholder="Escribe un nuevo mensaje..."></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                                <button type="button" class="btn btn-primary" onclick="enviarNuevoMensaje(${alumnoId})">Enviar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Insertar modal
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Mostrar modal
            const mensajesModal = new bootstrap.Modal(document.getElementById('mensajesModal'));
            mensajesModal.show();
        } else {
            mostrarMensaje(result.message || 'Error al cargar mensajes', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    }
}

// Función para enviar nuevo mensaje desde el modal
async function enviarNuevoMensaje(alumnoId) {
    const mensaje = document.getElementById('nuevo-mensaje-texto').value;

    if (!mensaje || mensaje.trim() === '') {
        mostrarMensaje('Debes escribir un mensaje', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('pakua_token');
        const response = await fetch(`${API_BASE_URL}/enviar-mensaje`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ alumnoId, mensaje: mensaje.trim() })
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje('Mensaje enviado correctamente', 'success');
            // Cerrar y recargar modal para mostrar el nuevo mensaje
            setTimeout(() => {
                const modal = document.getElementById('mensajesModal');
                if (modal) {
                    bootstrap.Modal.getInstance(modal).hide();
                    modal.remove();
                }
                mostrarMensajesAlumno(alumnoId);
            }, 1000);
        } else {
            mostrarMensaje(result.message || 'Error al enviar mensaje', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión', 'error');
    }
}

// Exportar funciones para uso global
window.cargarAlumnos = cargarAlumnos;
window.abrirEnvioMensaje = abrirEnvioMensaje;
window.enviarMensaje = enviarMensaje;
window.mostrarMensajesAlumno = mostrarMensajesAlumno;
window.enviarNuevoMensaje = enviarNuevoMensaje;