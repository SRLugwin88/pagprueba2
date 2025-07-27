// Configuración de la API
const API_BASE_URL = 'http://localhost:5001';

// Variables globales
let usuariosData = [];
let filtroActual = 'Pendiente';

// Funciones para manejar modales
function mostrarModal(modalId, mensaje) {
  const modal = document.getElementById(modalId);
  
  if (modalId === 'modalExito') {
    document.getElementById('mensajeExito').textContent = mensaje;
  } else if (modalId === 'modalError') {
    document.getElementById('mensajeError').textContent = mensaje;
  } else if (modalId === 'modalConfirmacion') {
    document.getElementById('mensajeConfirmacion').textContent = mensaje;
  }
  
  modal.classList.remove('hidden');
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('hidden');
}

function mostrarExito(mensaje) {
  mostrarModal('modalExito', mensaje);
}

function mostrarError(mensaje) {
  mostrarModal('modalError', mensaje);
}

function mostrarConfirmacion(mensaje, callback) {
  mostrarModal('modalConfirmacion', mensaje);
  const btnConfirmar = document.getElementById('btnConfirmar');
  
  // Remover listeners anteriores
  btnConfirmar.onclick = null;
  
  // Agregar nuevo listener
  btnConfirmar.onclick = function() {
    cerrarModal('modalConfirmacion');
    if (callback) callback();
  };
}

// Función principal para cargar usuarios (usando endpoint notificacion)
async function cargarUsuarios(estado = 'Pendiente') {
    const loading = document.getElementById('loading');
    const content = document.getElementById('usuarios-content');
    try {
        loading.style.display = 'block';
        content.style.display = 'none';
        console.log('Cargando usuarios con estado:', estado);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No se encontró token de autorización');
            mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        // Usar endpoint notificacion pero lógica de usuario
        let url = `${API_BASE_URL}/notificacion`;
        if (estado && estado !== '') {
            url += `?estado=${encodeURIComponent(estado)}`;
        }
        console.log('URL de petición:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Respuesta del servidor:', response.status, response.statusText);
        if (!response.ok) {
            if (response.status === 401) {
                mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Datos recibidos:', data);
        usuariosData = data.notificaciones || [];
        filtroActual = estado;
        mostrarUsuarios();
        actualizarConteo(data.conteo || 0);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarError('Error al cargar los usuarios: ' + error.message);
    } finally {
        loading.style.display = 'none';
        content.style.display = 'block';
    }
}

// Función para mostrar los usuarios en el DOM
function mostrarUsuarios() {
    const container = document.getElementById('usuariosList');
    const noUsuarios = document.getElementById('noUsuarios');
    if (!usuariosData || usuariosData.length === 0) {
        container.innerHTML = '';
        noUsuarios.style.display = 'block';
        return;
    }
    noUsuarios.style.display = 'none';
    container.innerHTML = usuariosData.map(notificacion => {
        return crearTarjetaUsuario(notificacion);
    }).join('');
}

// Función para crear una tarjeta de usuario (usando datos de notificación)
function crearTarjetaUsuario(notificacion) {
    const remitente = notificacion.remitente;
    const empleado = remitente?.empleado;
    const departamento = empleado?.departamento;
    const decidido_por = notificacion.decidido_por?.empleado;
    const estado = remitente?.estado || 'Pendiente';
    const estadoLower = estado.toLowerCase();
    // Formatear fechas
    const fechaCreacion = notificacion.fecha_creacion ? 
        new Date(notificacion.fecha_creacion).toLocaleString('es-ES') : 'No disponible';
    const fechaDecision = notificacion.fecha_decision ? 
        new Date(notificacion.fecha_decision).toLocaleString('es-ES') : 'Pendiente';
    return `
        <div class="usuario-card ${estadoLower}" data-id="${notificacion.id_notificacion}">
            <div class="usuario-header">
                <div class="usuario-info">
                    <h3 class="empleado-nombre">${empleado?.nombre_completo || 'Sin nombre'}</h3>
                    <p class="empleado-detalles">
                        DNI: ${empleado?.dni || 'No disponible'} • 
                        Rol solicitado: ${empleado?.rol_solicitado || 'No especificado'}
                    </p>
                </div>
                <span class="estado-badge ${estadoLower}">${estado}</span>
            </div>
            <div class="usuario-body">
                <div class="info-group">
                    <span class="info-label">Departamento</span>
                    <span class="info-value">${departamento?.nombre || 'No asignado'}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Fecha de Solicitud</span>
                    <span class="info-value">${fechaCreacion}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Estado</span>
                    <span class="info-value">${estado}</span>
                </div>
                ${notificacion.fecha_decision ? `
                <div class="info-group">
                    <span class="info-label">Fecha de Decisión</span>
                    <span class="info-value">${fechaDecision}</span>
                </div>
                ` : ''}
                ${decidido_por ? `
                <div class="info-group">
                    <span class="info-label">Decidido Por</span>
                    <span class="info-value">${decidido_por.nombre_completo}</span>
                </div>
                ` : ''}
                <div class="info-group">
                    <span class="info-label">Notificación Leída</span>
                    <span class="info-value">${notificacion.leida ? 'Sí' : 'No'}</span>
                </div>
            </div>
            ${estado === 'Pendiente' ? `
            <div class="usuarios-actions">
                <button class="btn-aprobar" onclick="aprobarNotificacion(${notificacion.id_notificacion})">
                    Aprobar
                </button>
                <button class="btn-rechazar" onclick="rechazarNotificacion(${notificacion.id_notificacion})">
                    Rechazar
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

// Función para aprobar un usuario (usando endpoint notificacion)
async function aprobarNotificacion(idNotificacion) {
    mostrarConfirmacion('¿Está seguro de que desea aprobar este usuario?', () => {
        procesarAccionNotificacion(idNotificacion, 'aprobar');
    });
}

// Función para rechazar un usuario (usando endpoint notificacion)
async function rechazarNotificacion(idNotificacion) {
    mostrarConfirmacion('¿Está seguro de que desea rechazar este usuario?', () => {
        procesarAccionNotificacion(idNotificacion, 'rechazar');
    });
}

// Función para procesar acciones de aprobar/rechazar
async function procesarAccionNotificacion(idNotificacion, accion) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        // Deshabilitar botones mientras se procesa
        const card = document.querySelector(`[data-id="${idNotificacion}"]`);
        const botones = card.querySelectorAll('.btn-aprobar, .btn-rechazar');
        botones.forEach(btn => btn.disabled = true);

        console.log(`${accion} notificación:`, idNotificacion);

        const response = await fetch(`${API_BASE_URL}/notificacion/${accion}/${idNotificacion}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Resultado:', result);

        mostrarExito(`Usuario ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente.`);
        // Recargar usuarios para reflejar cambios después de cerrar el modal
        setTimeout(() => {
            cargarUsuarios(filtroActual);
        }, 1500);

    } catch (error) {
        console.error(`Error al ${accion} notificación:`, error);
        mostrarError(`Error al ${accion === 'aprobar' ? 'aprobar' : 'rechazar'} el usuario: ` + error.message);
        
        // Rehabilitar botones en caso de error
        const card = document.querySelector(`[data-id="${idNotificacion}"]`);
        if (card) {
            const botones = card.querySelectorAll('.btn-aprobar, .btn-rechazar');
            botones.forEach(btn => btn.disabled = false);
        }
    }
}

// Función para filtrar usuarios
function filtrarUsuarios() {
    const filtro = document.getElementById('filtroEstado').value;
    console.log('Filtrar por estado:', filtro);
    cargarUsuarios(filtro);
}

// Función para actualizar el conteo
function actualizarConteo(conteo) {
    const conteoElement = document.getElementById('conteoUsuarios');
    const estadoTexto = filtroActual || 'todas';
    conteoElement.textContent = `Total: ${conteo} usuarios (${estadoTexto})`;
}

// Función para refrescar usuarios
function refreshUsuarios() {
    console.log('Refrescando usuarios...');
    cargarUsuarios(filtroActual);
}

// Función para cerrar sesión
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Función para volver al menú principal
function volverMenu() {
  window.location.href = 'principal.html';
}

// Función para mostrar información del usuario en el header
function mostrarInfoUsuario() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.nombre_completo) {
    document.getElementById('user-info').style.display = 'flex';
    document.getElementById('bienvenida').textContent = `Bienvenido/a ! : ${user.nombre_completo}`;
  }
}

// Función para mostrar errores
function mostrarError(mensaje) {
    const container = document.getElementById('notificacionesList');
    const noNotificaciones = document.getElementById('noNotificaciones');
    
    container.innerHTML = `
        <div class="error-message" style="
            background-color: #f8d7da;
            color: #721c24;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #f5c6cb;
        ">
            <h3>Error al cargar notificaciones</h3>
            <p>${mensaje}</p>
            <button onclick="refreshNotificaciones()" style="
                background-color: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">Intentar nuevamente</button>
        </div>
    `;
    
    noNotificaciones.style.display = 'none';
    actualizarConteo(0);
}

// Función para verificar permisos del usuario
function verificarPermisos() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        mostrarError('No se encontró información del usuario.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }

    // Verificar si tiene permisos de Secretario o Administrador
    const rolesPermitidos = ['Secretario', 'Administrador'];
    if (!rolesPermitidos.includes(user.rol)) {
        mostrarError('No tiene permisos para acceder a esta sección.');
        setTimeout(() => {
            window.location.href = 'principal.html';
        }, 2000);
        return false;
    }

    return true;
}

// Función para remover foco de botones después de hacer clic
function removerFocoBotones() {
  document.addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON') {
      // Pequeño delay para permitir que se ejecute la acción del botón
      setTimeout(() => {
        event.target.blur();
      }, 100);
    }
  });
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de usuarios cargada');
    removerFocoBotones();
    mostrarInfoUsuario();
    if (!verificarPermisos()) {
        return;
    }
    document.getElementById('filtroEstado').value = 'Pendiente';
    cargarUsuarios('Pendiente');
    removerFocoBotones();
});

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', function(event) {
  const modales = ['modalExito', 'modalError', 'modalConfirmacion'];
  
  modales.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (event.target === modal) {
      cerrarModal(modalId);
    }
  });
});

// Exportar funciones para uso global
window.cargarUsuarios = cargarUsuarios;
window.filtrarUsuarios = filtrarUsuarios;
window.refreshUsuarios = refreshUsuarios;
window.aprobarNotificacion = aprobarNotificacion;
window.rechazarNotificacion = rechazarNotificacion;
window.logout = logout;
window.volverMenu = volverMenu;
window.cerrarModal = cerrarModal;
