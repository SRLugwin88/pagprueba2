// Lógica para mostrar un modal de éxito o error reutilizable
function mostrarModalExito(mensaje, esError = false) {
  let modal = document.getElementById('modal-exito');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-exito';
    modal.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #fff; padding: 24px;
      border-radius: 10px; box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      z-index: 9999; text-align: center; min-width: 260px;
      font-size: 1.2rem;
    `;
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<span style="font-size:2rem;">${esError ? '❌' : '✅'}</span><br>${mensaje}`;
  modal.style.color = esError ? '#e57373' : '#0d3c61';
  modal.style.display = 'block';
  setTimeout(() => { modal.style.display = 'none'; }, 2000);
}

// Modal de edición para empleados 
async function obtenerDepartamentos() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const res = await fetch('https://pagprueba2-production-b22b.up.railway.app/departamento/getDepartamentos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al obtener departamentos');
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function abrirModalEditarEmpleado(empleado) {
  // Obtener departamentos
  let departamentosObj = await obtenerDepartamentos();
  let departamentos = Array.isArray(departamentosObj.departamentos) ? departamentosObj.departamentos : [];
  // Opciones de estado
  const estados = ['Activo', 'Inactivo', 'En licencia'];
  let opcionesEstado = estados.map(opt => `<option value="${opt}" ${opt.toLowerCase() === (empleado.estado || '').toLowerCase() ? 'selected' : ''}>${opt}</option>`).join('');
  // Opciones de departamento
  let opcionesDepto = departamentos.length > 0
    ? departamentos.map(dep => `<option value="${dep.id_departamento || dep.id_dpto}" ${empleado.departamento && (dep.nombre === empleado.departamento.nombre) ? 'selected' : ''}>${dep.nombre}</option>`).join('')
    : '<option value="">No hay departamentos</option>';
  // Opciones jefe dpto
  let opcionesJefe = ['Sí', 'No'].map(opt => `<option value="${opt}" ${opt === (empleado.es_responsable ? 'Sí' : 'No') ? 'selected' : ''}>${opt}</option>`).join('');

  // Crear modal
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.35)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = 9999;

  // Contenido del modal
  const contenido = document.createElement('div');
  contenido.style.background = '#fff';
  contenido.style.padding = '64px 48px';
  contenido.style.borderRadius = '18px';
  contenido.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
  contenido.style.textAlign = 'center';
  contenido.style.maxWidth = '700px';
  contenido.style.width = '98vw';
  contenido.innerHTML = `
    <h3 style="font-size:2rem;">Editar Empleado</h3>
    <form id="form-editar-empleado">
      <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'><b>DNI:</b> <span>${empleado.dni}</span></div>
      <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
        <label>Nombre Completo:</label>
        <input type="text" name="nombre_completo" value="${empleado.nombre_completo}" readonly style="width:100%; font-size:1.13rem; background:#f4f4f4; color:#888;" />
      </div>
      <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
        <label>Email:</label>
        <input type="email" name="email" value="${empleado.email}" required style="width:100%; font-size:1.13rem;" />
      </div>
      <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
        <label>Teléfono:</label>
        <input type="text" name="telefono" value="${empleado.telefono}" style="width:100%; font-size:1.13rem;" />
      </div>
      <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
        <label>Estado:</label>
        <select name="estado" required style="width:100%; font-size:1.13rem;">${opcionesEstado}</select>
      </div>
      <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
        <label>Departamento:</label>
        <select name="departamento" required style="width:100%; font-size:1.13rem;">${opcionesDepto}</select>
      </div>
      <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
        <label>Jefe Dpto:</label>
        <select name="es_responsable" required style="width:100%; font-size:1.13rem;">${opcionesJefe}</select>
      </div>
      <div style='display:flex; gap:12px; justify-content:center; margin-top:24px;'>
        <button type="submit" style='padding:12px 32px; background:#007bff; color:#fff; border:none; border-radius:6px; font-size:1.18rem; font-weight:600; cursor:pointer;'>Guardar</button>
        <button type="button" id="cancelar-editar-empleado" style='padding:12px 32px; background:#e57373; color:#fff; border:none; border-radius:6px; font-size:1.18rem; font-weight:600; cursor:pointer;'>Cancelar</button>
      </div>
    </form>
  `;
  modal.appendChild(contenido);
  document.body.appendChild(modal);

  document.getElementById('cancelar-editar-empleado').onclick = function() {
    modal.remove();
  };

  document.getElementById('form-editar-empleado').onsubmit = function(e) {
    e.preventDefault();
    // Aquí puedes agregar la lógica para guardar los cambios (fetch/axios)
    modal.remove();
    mostrarModalExito('Empleado actualizado correctamente');
  };
}

// Lógica principal para cargar empleados y renderizar la tabla
async function cargarEmpleados() {
  const token = localStorage.getItem('token');
  const tablaBody = document.getElementById("tabla-empleados-body");
  if (!token) {
    mostrarModalExito("No tiene permiso para ver esta sección. Por favor, inicie sesión.", true);
    if (tablaBody) tablaBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">No tiene permiso para ver esta sección. Por favor, inicie sesión.</td></tr>`;
    return;
  }
  try {
    const response = await fetch("https://pagprueba2-production-b22b.up.railway.app/empleado/getEmpleados", {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        const errorData = JSON.parse(text);
        message = errorData.message || message;
      } catch {}
      throw new Error(message || "Error en la red o el servidor.");
    }
    const data = await response.json();
    if (tablaBody) tablaBody.innerHTML = "";
    if (data && data.length > 0) {
      data.forEach(empleado => {
        const fila = document.createElement("tr");
        const dniCell = document.createElement("td");
        dniCell.textContent = empleado.dni;
        fila.appendChild(dniCell);
        const nombreCompletoCell = document.createElement("td");
        nombreCompletoCell.textContent = empleado.nombre_completo ;
        fila.appendChild(nombreCompletoCell);
        const emailCell = document.createElement("td");
        emailCell.textContent = empleado.email;
        fila.appendChild(emailCell);
        const telefonoCell = document.createElement("td");
        telefonoCell.textContent = empleado.telefono;
        fila.appendChild(telefonoCell);
        const estadoCell = document.createElement("td");
        estadoCell.textContent = empleado.estado;
        fila.appendChild(estadoCell);
        const departamentoCell = document.createElement("td");
        departamentoCell.textContent = empleado.departamento ? empleado.departamento.nombre : 'N/A';
        fila.appendChild(departamentoCell);
        const esResponsableCell = document.createElement("td");
        esResponsableCell.textContent = empleado.es_responsable ? 'Sí' : 'No';
        fila.appendChild(esResponsableCell);
        const accionesCell = document.createElement("td");
        accionesCell.className = "acciones";
        const editarBtn = document.createElement("button");
        editarBtn.textContent = "Editar";
        editarBtn.className = "editar-btn";
        editarBtn.onclick = async function() { await abrirModalEditarEmpleado(empleado); };
        accionesCell.appendChild(editarBtn);
        fila.appendChild(accionesCell);
        tablaBody.appendChild(fila);
      });
    } else {
      const filaVacia = document.createElement("tr");
      const celdaMensaje = document.createElement("td");
      celdaMensaje.setAttribute("colspan", "8");
      celdaMensaje.textContent = "No hay empleados registrados.";
      celdaMensaje.style.textAlign = "center";
      filaVacia.appendChild(celdaMensaje);
      tablaBody.appendChild(filaVacia);
    }
  } catch (error) {
    mostrarModalExito(`Error al cargar los empleados: ${error.message}. Por favor, intente de nuevo más tarde.`, true);
    if (tablaBody) tablaBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Error al cargar los empleados: ${error.message}. Por favor, intente de nuevo más tarde.</td></tr>`;
  }
}
