

document.addEventListener("DOMContentLoaded", function () {
  const modalCrear = document.getElementById("modal-crear-departamento");
  const modalEditar = document.getElementById("modal-editar-departamento");
  const btnAbrirModalCrear = document.getElementById("btn-abrir-modal");
  const btnCancelarCrear = document.getElementById("btn-cancelar");
  const btnCancelarEditar = document.getElementById("btn-cancelar-editar");
  const formCrearDepartamento = document.getElementById("form-crear-departamento");
  const formEditarDepartamento = document.getElementById("form-editar-departamento");
  const tablaDepartamentos = document.getElementById("tabla-departamentos");

  // Obtener rol e id_rol de localStorage 
  const idRol = localStorage.getItem('id_rol');
  const rol = localStorage.getItem('rol');


  // Verificar que los elementos existen SOLO para departamentos
  if (!modalCrear || !modalEditar || !btnAbrirModalCrear || !btnCancelarCrear || !btnCancelarEditar || !formCrearDepartamento || !formEditarDepartamento || !tablaDepartamentos) {
    console.error("Error: Algunos elementos necesarios no existen en el DOM.");
    return;
  }

  // Control de permisos: ocultar botones y bloquear listeners para empleados (id_rol=3 o rol='Empleado')
  // Lógica robusta: solo muestra y habilita controles si el usuario NO es empleado
  const esEmpleado = (idRol === '3' || (rol && rol.toLowerCase() === 'empleado'));
  //  Elimina el botón de crear, el formulario/modal de creación y oculta el contenedor visual para empleados
  if (esEmpleado) {
    if (btnAbrirModalCrear) btnAbrirModalCrear.style.display = 'none';
    if (formCrearDepartamento) formCrearDepartamento.style.display = 'none';
    if (modalCrear) modalCrear.style.display = 'none';
    // Oculta cualquier contenedor visual relacionado si existe
    var contenedorCrear = document.getElementById('contenedor-crear-departamento');
    if (contenedorCrear) contenedorCrear.style.display = 'none';
  }


  // Abrir el modal para crear departamento (solo si NO es empleado y el botón existe)
  if (btnAbrirModalCrear && !esEmpleado) {
    btnAbrirModalCrear.addEventListener("click", () => {
      modalCrear.style.display = "flex";
    });
  }

  // Cerrar el modal de crear departamento
  btnCancelarCrear.addEventListener("click", () => {
    modalCrear.style.display = "none";
  });

  // Cerrar el modal de editar departamento
  btnCancelarEditar.addEventListener("click", () => {
    modalEditar.style.display = "none";
  });


  // Crear departamento: bloquear submit para empleados
  if (formCrearDepartamento && !esEmpleado) {
    formCrearDepartamento.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nombreDepartamento = document.getElementById("nombre-departamento").value.trim();
      if (!nombreDepartamento) {
        alert("Por favor, ingrese un nombre para el departamento.");
        return;
      }
      try {
        const res = await fetch("https://pagprueba2-production-b22b.up.railway.app/departamento/createdepartamento", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ nombre: nombreDepartamento })
        });
        if (!res.ok) throw new Error(await res.text());
        alert("Departamento creado exitosamente.");
        modalCrear.style.display = "none";
        formCrearDepartamento.reset();
        cargarDepartamentos(); // Actualizar la tabla después de crear
      } catch (err) {
        alert(`Error al crear el departamento: ${err.message}`);
      }
    });
  }


  // Editar departamento (solo si NO es empleado)
  if (!esEmpleado) {
    formEditarDepartamento.addEventListener("submit", async (event) => {
      event.preventDefault();
      const idDepartamento = document.getElementById("editar-id-departamento").value.trim();
      const nombreDepartamento = document.getElementById("editar-nombre-departamento").value.trim();

      if (!idDepartamento || !nombreDepartamento) {
        alert("Por favor, complete todos los campos.");
        return;
      }

      try {
        const res = await fetch(`https://pagprueba2-production-b22b.up.railway.app/departamento/updatedepartamento/${idDepartamento}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ nombre: nombreDepartamento })
        });

        if (!res.ok) throw new Error(await res.text());
        alert("Departamento actualizado exitosamente.");
        modalEditar.style.display = "none";
        formEditarDepartamento.reset();
        cargarDepartamentos(); // Actualizar la tabla después de editar
      } catch (err) {
        alert(`Error al actualizar el departamento: ${err.message}`);
      }
    });
  }


  // Cargar departamentos en la tabla
  async function cargarDepartamentos() {
    try {
      const res = await fetch("https://pagprueba2-production-b22b.up.railway.app/departamento/getdepartamentos", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!res.ok) throw new Error(`Error al obtener departamentos: ${res.status} - ${await res.text()}`);
      const data = await res.json();
      const departamentos = data.departamentos;

      if (!Array.isArray(departamentos) || departamentos.length === 0) {
        console.warn("No se encontraron departamentos.");
        tablaDepartamentos.innerHTML = "<tr><td colspan='2'>No hay departamentos disponibles.</td></tr>";
        return;
      }

      tablaDepartamentos.innerHTML = ""; // Limpiar tabla antes de llenarla

      departamentos.forEach(departamento => {
        const fila = document.createElement("tr");
        const nombre = document.createElement("td");
        nombre.textContent = departamento.nombre;

        const acciones = document.createElement("td");
        acciones.className = "acciones";

        // NUNCA crear el botón editar para empleados, ni dejar rastro
        if (esEmpleado) {
          fila.appendChild(nombre);
          fila.appendChild(acciones);
          tablaDepartamentos.appendChild(fila);
          return;
        }

        // Solo para usuarios permitidos
        const editarBtn = document.createElement("button");
        editarBtn.textContent = "Editar";
        editarBtn.className = "editar-btn";
        editarBtn.onclick = () => {
          document.getElementById("editar-id-departamento").value = departamento.id_dpto;
          document.getElementById("editar-nombre-departamento").value = departamento.nombre;
          modalEditar.style.display = "flex";
        };
        acciones.appendChild(editarBtn);
        fila.appendChild(nombre);
        fila.appendChild(acciones);
        tablaDepartamentos.appendChild(fila);
      });
    } catch (err) {
      console.error("Error cargando departamentos:", err.message);
      tablaDepartamentos.innerHTML = "<tr><td colspan='2'>Error al cargar departamentos.</td></tr>";
    }
  }

  // Inicializar la página
  cargarDepartamentos();
});