// maestro.js - Funcionalidades exclusivas para maestros
const API_BASE_URL = 'http://localhost:3000/api';

// Función para cargar lista de alumnos
async function cargarAlumnos() {
    try {
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
                    listaAlumnos.innerHTML = '<p>No hay alumnos registrados</p>';
                    return;
                }

                result.data.forEach(alumno => {
                    const item = document.createElement('div');
                    item.className = 'alumno-item mb-2 p-2 border rounded';
                    item.innerHTML = `
                        <p class="mb-1"><strong>${alumno.nombre}</strong> (${alumno.numero_usuario})</p>
                        <button onclick="abrirEnvioMensaje(${alumno.id})" class="btn btn-sm btn-primary">
                            Enviar mensaje
                        </button>
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

    if (!mensaje) {
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
            body: JSON.stringify({ alumnoId, mensaje })
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje('Mensaje enviado correctamente', 'success');
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('mensajeModal')).hide();
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