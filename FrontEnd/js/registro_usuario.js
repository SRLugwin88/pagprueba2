// js/registro_usuario.js
// Archivo unificado para el registro de usuario

// ===== VALIDACIONES PERSONALIZADAS =====
const validaciones = {
  // Validar formato de nombre completo
  validarNombreCompleto: function(nombre) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(nombre)) {
      return 'El nombre solo puede contener letras y espacios';
    }
    
    const palabras = nombre.trim().split(/\s+/);
    if (palabras.length < 2) {
      return 'Debe incluir al menos nombre y apellido';
    }
    
    if (nombre.length < 6) {
      return 'El nombre debe tener al menos 6 caracteres';
    }
    
    return null;
  },

  // Validar DNI
  validarDNI: function(dni) {
    if (!/^\d{7,8}$/.test(dni)) {
      return 'El DNI debe tener 7 u 8 dígitos';
    }
    return null;
  },

  // Validar email
  validarEmail: function(email) {
    const regex = /^[^\s@]+@[^\s@]+\.(com|com\.ar)$/;
    if (!regex.test(email)) {
      return 'El correo debe contener @ y terminar en .com o .com.ar';
    }
    return null;
  },

  // Validar contraseña
  validarContrasena: function(contrasena) {
    if (contrasena.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!/[A-Z]/.test(contrasena)) {
      return 'La contraseña debe tener al menos una mayúscula';
    }
    
    if (!/\d/.test(contrasena)) {
      return 'La contraseña debe tener al menos un número';
    }
    
    if (!/[_*]/.test(contrasena)) {
      return 'La contraseña debe tener al menos un carácter especial (_ o *)';
    }
    
    return null;
  },

  // Validar teléfono
  validarTelefono: function(telefono) {
    if (telefono && (telefono.length < 10 || telefono.length > 15)) {
      return 'El teléfono debe tener entre 10 y 15 dígitos';
    }
    return null;
  }
};

// ===== FUNCIONES DE UTILIDAD =====
const utils = {
  // Formatear nombre (primera letra mayúscula)
  formatearNombre: function(nombre) {
    return nombre.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  },

  // Limpiar y formatear DNI
  limpiarDNI: function(dni) {
    return dni.replace(/\D/g, '');
  }
};

// ===== FUNCIONES DE API =====
const api = {
  // Obtener departamentos
  obtenerDepartamentos: async function() {
    try {
      const response = await fetch('http://localhost:5001/departamento/getdepartamentos');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Manejar tanto el formato { departamentos: [] } como el array directo
      if (data.departamentos && Array.isArray(data.departamentos)) {
        return data.departamentos;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        throw new Error('Formato de respuesta inesperado del servidor');
      }
    } catch (error) {
      throw error;
    }
  },

  // Registrar usuario
  registrarUsuario: async function(datosUsuario) {
    try {
      const response = await fetch('http://localhost:5001/usuario/createUsuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosUsuario)
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Respuesta del servidor no es JSON válido');
      }
      
      return {
        success: response.ok,
        data: result,
        status: response.status
      };
    } catch (error) {
      throw new Error('Error de conexión con el servidor: ' + error.message);
    }
  }
};

// ===== FUNCIONES PRINCIPALES DEL FORMULARIO =====

// Cargar departamentos al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  cargarDepartamentos();
});

// Función para cargar departamentos desde el backend
async function cargarDepartamentos() {
  const select = document.getElementById('departamento');
  
  try {
    const departamentos = await api.obtenerDepartamentos();
    
    if (departamentos && departamentos.length > 0) {
      departamentos.forEach(depto => {
        const option = document.createElement('option');
        option.value = depto.nombre;
        option.textContent = depto.nombre;
        select.appendChild(option);
      });
    } else {
      agregarOpcionError(select, 'No hay departamentos disponibles');
    }
  } catch (error) {
    agregarOpcionError(select, 'Error al cargar departamentos');
  }
}

// Función auxiliar para agregar opciones de error
function agregarOpcionError(select, mensaje) {
  const option = document.createElement('option');
  option.value = '';
  option.textContent = mensaje;
  option.disabled = true;
  select.appendChild(option);
}

// Función para limpiar mensajes de error
function limpiarErrores() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(element => {
    element.style.display = 'none';
    element.textContent = '';
  });
}

// Función para mostrar errores
function mostrarError(campo, mensaje) {
  const errorElement = document.getElementById(`error-${campo}`);
  if (errorElement) {
    errorElement.textContent = mensaje;
    errorElement.style.display = 'block';
  }
}

// Función para mostrar mensaje de éxito
function mostrarExito(mensaje) {
  const successElement = document.getElementById('success-message');
  successElement.textContent = mensaje;
  successElement.style.display = 'block';
  
  // Ocultar después de 5 segundos
  setTimeout(() => {
    successElement.style.display = 'none';
  }, 5000);
}

// Validación de contraseñas
function validarContrasenas() {
  const contrasena = document.getElementById('contrasena').value;
  const confirmar = document.getElementById('confirmar_contrasena').value;
  
  if (contrasena !== confirmar) {
    mostrarError('confirmar_contrasena', 'Las contraseñas no coinciden');
    return false;
  }
  return true;
}

// ===== EVENT LISTENERS =====

// Validación en tiempo real de confirmación de contraseña
document.addEventListener('DOMContentLoaded', function() {
  const confirmarInput = document.getElementById('confirmar_contrasena');
  if (confirmarInput) {
    confirmarInput.addEventListener('input', function() {
      const contrasena = document.getElementById('contrasena').value;
      const confirmar = this.value;
      
      if (confirmar && contrasena !== confirmar) {
        mostrarError('confirmar_contrasena', 'Las contraseñas no coinciden');
      } else {
        document.getElementById('error-confirmar_contrasena').style.display = 'none';
      }
    });
  }

  // Validación de solo números para DNI y teléfono
  const dniInput = document.getElementById('dni');
  if (dniInput) {
    dniInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '');
    });
  }

  const telefonoInput = document.getElementById('telefono');
  if (telefonoInput) {
    telefonoInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '');
    });
  }

  // Manejo del envío del formulario
  const form = document.getElementById('registroForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      limpiarErrores();
      
      // Validar contraseñas
      if (!validarContrasenas()) {
        return;
      }

      // Recopilar datos del formulario
      const formData = new FormData(this);
      const datos = {
        nombre_completo: formData.get('nombre_completo'),
        dni: formData.get('dni'),
        email: formData.get('email'),
        contrasena: formData.get('contrasena'),
        departamento: formData.get('departamento'),
        rol_solicitado: formData.get('rol_solicitado'),
        direccion: formData.get('direccion') || null,
        telefono: formData.get('telefono') && formData.get('telefono').trim() !== '' ? formData.get('telefono') : null,
        estado: formData.get('estado') || 'Activo',
        es_responsable: formData.get('es_responsable') === 'on'
      };

      // Validar campos requeridos en el frontend
      const camposRequeridos = ['nombre_completo', 'dni', 'email', 'contrasena', 'departamento', 'rol_solicitado'];
      let erroresValidacion = false;

      camposRequeridos.forEach(campo => {
        if (!datos[campo] || datos[campo].toString().trim() === '') {
          mostrarError(campo, `${campo.replace('_', ' ')} es requerido`);
          erroresValidacion = true;
        }
      });

      // Usar las validaciones organizadas del objeto validaciones
      if (datos.nombre_completo) {
        const errorNombre = validaciones.validarNombreCompleto(datos.nombre_completo);
        if (errorNombre) {
          mostrarError('nombre_completo', errorNombre);
          erroresValidacion = true;
        }
      }

      if (datos.dni) {
        const errorDNI = validaciones.validarDNI(datos.dni);
        if (errorDNI) {
          mostrarError('dni', errorDNI);
          erroresValidacion = true;
        }
      }

      if (datos.email) {
        const errorEmail = validaciones.validarEmail(datos.email);
        if (errorEmail) {
          mostrarError('email', errorEmail);
          erroresValidacion = true;
        }
      }

      if (datos.contrasena) {
        const errorContrasena = validaciones.validarContrasena(datos.contrasena);
        if (errorContrasena) {
          mostrarError('contrasena', errorContrasena);
          erroresValidacion = true;
        }
      }

      if (datos.telefono) {
        const errorTelefono = validaciones.validarTelefono(datos.telefono);
        if (errorTelefono) {
          mostrarError('telefono', errorTelefono);
          erroresValidacion = true;
        }
      }

      if (erroresValidacion) {
        return;
      }

      try {
        // Usar la función de la API de utilidades
        const resultado = await api.registrarUsuario(datos);

        if (resultado.success) {
          mostrarExito(resultado.data.message || 'Usuario registrado exitosamente. Esperando aprobación.');
          
          // Limpiar formulario después de 2 segundos
          setTimeout(() => {
            this.reset();
            // Redireccionar al login después de 3 segundos más
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 3000);
          }, 2000);
          
        } else {
          // Mostrar errores específicos
          if (resultado.data.errors && Array.isArray(resultado.data.errors)) {
            resultado.data.errors.forEach(error => {
              const campo = error.path || error.param;
              if (campo) {
                mostrarError(campo, error.msg);
              }
            });
          } else if (resultado.data.message) {
            alert(resultado.data.message);
          } else {
            alert('Error del servidor: ' + JSON.stringify(resultado.data));
          }
        }

      } catch (error) {
        alert('Error de conexión. Por favor, intente nuevamente.');
      }
    });
  }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.RegistroUtils = {
    validaciones,
    utils,
    api
  };
}
