// === FILTRO Y RENDER DOCUMENTOS ===
let documentosGlobal = [];

function renderizarTablaDocumentos(arr) {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  if (Array.isArray(arr) && arr.length > 0) {
    arr.forEach(doc => {
      const tr = document.createElement('tr');
      // Celdas de datos
      tr.innerHTML = `
        <td>${doc.clase || ''}</td>
        <td>${doc.NumeroDoc || ''}</td>
        <td>${doc.fecha_registro ? doc.fecha_registro.substring(0,10) : ''}</td>
        <td>${doc.medio || ''}</td>
        <td>${doc.tipo_documento || ''}</td>
        <td>${doc.objetivo || ''}</td>
        <td>${doc.estado_doc || ''}</td>
        <td>${doc.organismo && doc.organismo.nombre ? doc.organismo.nombre : ''}</td>
        <td>${doc.observaciones || ''}</td>
      `;

      // Acciones
      const accionesTd = document.createElement('td');
      accionesTd.className = 'acciones';

      // Botón Editar
      const btnEditar = document.createElement('button');
      btnEditar.textContent = 'Editar';
      btnEditar.className = 'editar-btn';
      btnEditar.onclick = () => editarDocumento(doc.id_doc);
      accionesTd.appendChild(btnEditar);

      // Botón Finalizar
      const btnFinalizar = document.createElement('button');
      btnFinalizar.textContent = 'Finalizar';
      btnFinalizar.className = 'finalizar-btn';
      btnFinalizar.onclick = () => finalizarDocumento(doc.id_doc);
      if (doc.estado_doc === 'Finalizado') btnFinalizar.disabled = true;
      accionesTd.appendChild(btnFinalizar);

      // Botón Crear Pase solo si el estado es Iniciado o En trámite
      if (doc.estado_doc === 'Iniciado' || doc.estado_doc === 'En trámite') {
        const btnCrearPase = document.createElement('button');
        btnCrearPase.textContent = 'Crear Pase';
        btnCrearPase.className = 'crear-pase-btn';
        btnCrearPase.onclick = function() {
          window.location.href = `crear_pases.html?id_doc=${doc.id_doc}`;
        };
        accionesTd.appendChild(btnCrearPase);
      }

      tr.appendChild(accionesTd);
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="10" style="text-align:center; color:#b00; font-weight:bold;">No hay resultados para la búsqueda</td>`;
    tbody.appendChild(tr);
  }
}

async function cargarDocumentos() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('https://pagprueba2-production-b22b.up.railway.app/documento/getdocumentos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      throw new Error('No autorizado o error en el servidor');
    }
    documentosGlobal = await res.json();
    // Ordenar por id_doc descendente (mayor id arriba)
    documentosGlobal.sort((a, b) => b.id_doc - a.id_doc);
    renderizarTablaDocumentos(documentosGlobal);
  } catch (err) {
    mostrarModalMensaje('Error', 'Error al cargar documentos: ' + err.message);
  }
}

// Filtro en input
document.addEventListener('DOMContentLoaded', function() {
  // Filtro simple y robusto, sin observer ni handler extra
  const input = document.getElementById('busqueda-doc');
  if (input) {
    input.addEventListener('input', function() {
      const valor = input.value.trim().toUpperCase();
      // Si el input está vacío o solo contiene guiones o espacios, mostrar todos
      if (!valor || /^[\s-]+$/.test(input.value)) {
        renderizarTablaDocumentos(documentosGlobal);
        return;
      }
      // Si el input es solo S- o E-, mostrar todos los documentos con ese prefijo
      if (/^[SE]-$/.test(valor)) {
        const prefijo = valor[0];
        renderizarTablaDocumentos(documentosGlobal.filter(doc => {
          const docObj = parseNumeroDoc(doc.NumeroDoc);
          return docObj.prefijo === prefijo;
        }));
        return;
      }
      // Función robusta para filtrar por prefijo, número y fecha
      function parseNumeroDoc(str) {
        if (!str) return { prefijo: '', numero: '' };
        const clean = str.toString().replace(/\s+/g, '').toUpperCase();
        // Permite S-0001, S-1, S1, E-0001, E-1, E1
        const match = clean.match(/^([SE])-?0*([0-9]+)$/);
        if (match) {
          return { prefijo: match[1], numero: match[2] };
        }
        // Solo prefijo
        const matchPref = clean.match(/^([SE])$/);
        if (matchPref) {
          return { prefijo: matchPref[1], numero: '' };
        }
        return { prefijo: '', numero: '' };
      }
      let filtrados = documentosGlobal.filter(doc => {
        // Filtrado por prefijo y número
        const docObj = parseNumeroDoc(doc.NumeroDoc);
        const valorObj = parseNumeroDoc(valor);
        // Si el input es solo S o E
        if (/^[SE]$/.test(valor)) {
          return docObj.prefijo === valorObj.prefijo;
        }
        // Si el input es S- o E-, mostrar todos los documentos con ese prefijo (aunque tengan número)
        if (/^[SE]-$/.test(valor)) {
          return docObj.prefijo === valorObj.prefijo;
        }
        // Si el input es S-0001, S-1, S1, E-0001, E-1, E1, E-000000004, etc.
        if (/^[SE]-?0*[0-9]+$/.test(valor)) {
          // Permitir buscar por número exacto o parcial, con o sin ceros
          // Elimina ceros a la izquierda para comparar correctamente
          const valorNumero = valorObj.numero.replace(/^0+/, '');
          const docNumero = docObj.numero.replace(/^0+/, '');
          return docObj.prefijo === valorObj.prefijo && docNumero.startsWith(valorNumero);
        }
        // Filtrado por fecha exacta yyyy-mm-dd
        let fechaDoc = doc.fecha_registro ? doc.fecha_registro.substring(0,10) : '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
          return fechaDoc === valor;
        }
        // Permitir búsqueda por fecha en formato dd/mm/yyyy
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
          let partes = fechaDoc.split('-');
          if (partes.length === 3) {
            let fechaFormateada = partes[2] + '/' + partes[1] + '/' + partes[0];
            return fechaFormateada === valor;
          }
        }
        // Búsqueda parcial por fecha (cualquier fragmento)
        if (fechaDoc && fechaDoc.includes(valor)) {
          return true;
        }
        // También buscar si el usuario pone parte de la fecha en formato dd/mm
        if (/^\d{2}\/\d{2}/.test(valor)) {
          let partes = fechaDoc.split('-');
          if (partes.length === 3) {
            let fechaFormateada = partes[2] + '/' + partes[1];
            return fechaFormateada.startsWith(valor);
          }
        }
        return false;
      });
      renderizarTablaDocumentos(filtrados);
    });
  }
});

  // Función para editar documento 
  async function editarDocumento(id_doc) {
    try {
      const token = localStorage.getItem('token');
      // Obtener datos del documento
      const resDoc = await fetch(`https://pagprueba2-production-b22b.up.railway.app/documento/getdocumentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resDoc.ok) throw new Error('No se pudo obtener el documento');
      const documentos = await resDoc.json();
      const documento = documentos.find(d => d.id_doc === id_doc);
      if (!documento) throw new Error('Documento no encontrado');

      // Obtener enums
      const resEnum = await fetch('https://pagprueba2-production-b22b.up.railway.app/documento/enum-options', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enumOptions = await resEnum.json();

      // Obtener organismos
      const resOrg = await fetch('https://pagprueba2-production-b22b.up.railway.app/organismo/getorganismos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const organismos = await resOrg.json();

      abrirModalEditarDocumento(documento, enumOptions, organismos);
    } catch (err) {
      alert('Error al cargar datos para edición: ' + err.message);
    }
  }

  // Función para cargar las opciones de los enums
  async function cargarEnumOptions() {
    const token = localStorage.getItem('token');
    const res = await fetch('https://pagprueba2-production-b22b.up.railway.app/documento/enum-options', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const enums = await res.json();

    // Verifica si el elemento existe
    const selectClase = document.getElementById('clase');
    if (!selectClase) {
        console.error("El elemento con ID 'clase' no existe en el DOM.");
        return;
    }

    // Llenar el select con las opciones
    enums.clase.forEach(opcion => {
        const optionElement = document.createElement('option');
        optionElement.value = opcion.value;
        optionElement.textContent = opcion.label;
        selectClase.appendChild(optionElement);
    });
}

  // Agregar función para abrir modal de edición de documento
  function abrirModalEditarDocumento(documento, enumOptions, organismos) {
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

    // Formulario de edición
    let opcionesOrganismos = organismos.map(org => `<option value="${org.id_org}" ${org.id_org === documento.id_org ? 'selected' : ''}>${org.nombre} (${org.tipo ? org.tipo : 'Sin tipo'})</option>`).join('');
    let opcionesClase = enumOptions.clase.map(opt => `<option value="${opt}" ${opt === documento.clase ? 'selected' : ''}>${opt}</option>`).join('');
    let opcionesMedio = enumOptions.medio.map(opt => `<option value="${opt}" ${opt === documento.medio ? 'selected' : ''}>${opt}</option>`).join('');
    let opcionesTipo = enumOptions.tipo_documento.map(opt => `<option value="${opt}" ${opt === documento.tipo_documento ? 'selected' : ''}>${opt}</option>`).join('');
    let opcionesObjetivo = enumOptions.objetivo.map(opt => `<option value="${opt}" ${opt === documento.objetivo ? 'selected' : ''}>${opt}</option>`).join('');
    let opcionesEstado = enumOptions.estado_doc.map(opt => `<option value="${opt}" ${opt === documento.estado_doc ? 'selected' : ''}>${opt}</option>`).join('');

    const contenido = document.createElement('div');
    contenido.style.background = '#fff';
    contenido.style.padding = '64px 48px';
    contenido.style.borderRadius = '18px';
    contenido.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
    contenido.style.textAlign = 'center';
    contenido.style.maxWidth = '760px';
    contenido.style.width = '98vw';
    contenido.innerHTML = `
      <h3 style="font-size:2.1rem;">Editar Documento</h3>
      <form id="form-editar-documento">
        <div style='margin-bottom:14px; text-align:left; font-size:1.18rem;'><b>N° Documento:</b> <span>${documento.NumeroDoc}</span></div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Fecha de Registro:</label>
          <input type="date" name="fecha_registro" value="${documento.fecha_registro ? documento.fecha_registro.substring(0,10) : ''}" required disabled style="font-size:1.13rem;" />
        </div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Origen del Documento:</label>
          <select name="clase" required disabled style="font-size:1.13rem;">${opcionesClase}</select>
        </div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Medio de Recepción/Envío:</label>
          <select name="medio" required style="font-size:1.13rem;">${opcionesMedio}</select>
        </div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Tipo de Documento:</label>
          <select name="tipo_documento" required style="font-size:1.13rem;">${opcionesTipo}</select>
        </div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Objetivo:</label>
          <select name="objetivo" required style="font-size:1.13rem;">${opcionesObjetivo}</select>
        </div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Estado del Documento:</label>
          <select name="estado_doc" required style="font-size:1.13rem;">${opcionesEstado}</select>
        </div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Organismo:</label>
          <select name="id_org" required style="font-size:1.13rem;">${opcionesOrganismos}</select>
        </div>
        <div style='margin-bottom:14px; text-align:left; font-size:1.13rem;'>
          <label style="font-size:1.13rem;">Observaciones:</label>
          <textarea name="observaciones" style='width:100%; min-height:80px; font-size:1.13rem;'>${documento.observaciones || ''}</textarea>
        </div>
        <div style='display:flex; gap:12px; justify-content:center; margin-top:24px;'>
          <button type="submit" style='padding:12px 32px; background:#007bff; color:#fff; border:none; border-radius:6px; font-size:1.18rem; font-weight:600; cursor:pointer;'>Guardar</button>
          <button type="button" id="cancelar-guardar" style='padding:12px 32px; background:#e57373; color:#fff; border:none; border-radius:6px; font-size:1.18rem; font-weight:600; cursor:pointer;'>Cancelar</button>
        </div>
      </form>
    `;
    modal.appendChild(contenido);
    document.body.appendChild(modal);

    document.getElementById('cancelar-guardar').onclick = function() {
      modal.remove();
    };

    document.getElementById('form-editar-documento').onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const datos = {
        fecha_registro: form.fecha_registro.value,
        clase: form.clase.value,
        medio: form.medio.value,
        tipo_documento: form.tipo_documento.value,
        objetivo: form.objetivo.value,
        estado_doc: form.estado_doc.value,
        id_org: form.id_org.value,
        observaciones: form.observaciones.value
      };
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://pagprueba2-production-b22b.up.railway.app/documento/updatedocumento/${documento.id_doc}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(datos)
        });
        const data = await res.json();
        if (res.ok) {
          // Mostrar mensaje centrado 
          mostrarModalExito('Documento actualizado correctamente');
          modal.remove();
          if (typeof cargarDocumentos === 'function') cargarDocumentos();
        } else {
          alert('Error: ' + (data.error || data.message || 'Error desconocido'));
        }
      } catch (err) {
        alert('Error al conectar con el servidor');
      }
    };
  }

  // Modal de éxito centrado 
  function mostrarModalExito(mensaje) {
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
    const contenido = document.createElement('div');
    contenido.style.background = '#fff';
    contenido.style.padding = '14px 12px'; 
    contenido.style.borderRadius = '8px'; 
    contenido.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    contenido.style.textAlign = 'center';
    contenido.style.minWidth = '220px';
    contenido.innerHTML = `<div style='font-size:1.1rem; color:#0d3c61; font-weight:600; margin-bottom:10px;'>${mensaje}</div><button id='ok-exito' style='margin-top:10px; padding:6px 18px; background:#007bff; color:#fff; border:none; border-radius:6px; font-size:0.95rem; font-weight:500; cursor:pointer;'>OK</button>`;
    modal.appendChild(contenido);
    document.body.appendChild(modal);
    document.getElementById('ok-exito').onclick = function() {
      modal.remove();
    };
  }

  // Función para mostrar mensajes en un modal
function mostrarModalMensaje(titulo, mensaje) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';

  const contenido = document.createElement('div');
  contenido.style.backgroundColor = '#fff';
  contenido.style.padding = '20px';
  contenido.style.borderRadius = '8px';
  contenido.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  contenido.style.textAlign = 'center';

  const tituloElem = document.createElement('h2');
  tituloElem.textContent = titulo;
  contenido.appendChild(tituloElem);

  const mensajeElem = document.createElement('p');
  mensajeElem.textContent = mensaje;
  contenido.appendChild(mensajeElem);

  const botonCerrar = document.createElement('button');
  botonCerrar.textContent = 'Cerrar';
  botonCerrar.style.marginTop = '10px';
  botonCerrar.style.padding = '10px 20px';
  botonCerrar.style.backgroundColor = '#007bff';
  botonCerrar.style.color = '#fff';
  botonCerrar.style.border = 'none';
  botonCerrar.style.borderRadius = '4px';
  botonCerrar.style.cursor = 'pointer';
  botonCerrar.onclick = () => modal.remove();
  contenido.appendChild(botonCerrar);

  modal.appendChild(contenido);
  document.body.appendChild(modal);
}

  // Mostrar nombre completo en header si está logueado
  document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.nombre_completo) {
      document.getElementById('user-info').style.display = 'flex';
      document.getElementById('nombre-usuario').textContent = user.nombre_completo;
    }
  });

  // Función para cerrar sesión
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }

  // Cargar documentos y opciones de enums al iniciar
  document.addEventListener('DOMContentLoaded', () => {
    cargarDocumentos();
    cargarEnumOptions();
  });

  function finalizarDocumento(id_doc) {
    console.log('Intentando finalizar el documento con ID:', id_doc);

    // Crear modal para mensajes
    const modal = document.createElement('div');
    modal.className = 'modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const modalHeader = document.createElement('h2');
    modalHeader.textContent = 'Finalizar Documento';
    modalContent.appendChild(modalHeader);

    const modalMessage = document.createElement('p');
    modalMessage.textContent = '¿Está seguro de que desea cambiar el estado del documento a finalizado?';
    modalContent.appendChild(modalMessage);

    const modalActions = document.createElement('div');
    modalActions.className = 'modal-actions';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    confirmButton.onclick = async function () {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://pagprueba2-production-b22b.up.railway.app/documento/updatedocumento/${id_doc}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado_doc: 'Finalizado' })
        });

        if (!res.ok) {
          throw new Error('No se pudo finalizar el documento');
        }

        modal.remove();
        mostrarModalMensaje('Éxito', 'El documento ha sido finalizado correctamente.');
        cargarDocumentos();
      } catch (err) {
        modal.remove();
        mostrarModalMensaje('Error', 'Error al finalizar el documento: ' + err.message);
      }
    };
    modalActions.appendChild(confirmButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.onclick = function () {
      modal.remove();
    };
    modalActions.appendChild(cancelButton);

    modalContent.appendChild(modalActions);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  function renderizarDocumentos(documentos) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';
    documentos.forEach(doc => {
      const tr = document.createElement('tr');
      // ...otras columnas...

      // Acciones
      const accionesTd = document.createElement('td');

      // Botón Editar
      const btnEditar = document.createElement('button');
      btnEditar.textContent = 'Editar';
      btnEditar.className = 'editar-btn';
      // ...asigna evento editar...
      accionesTd.appendChild(btnEditar);

      // Botón Finalizar
      const btnFinalizar = document.createElement('button');
      btnFinalizar.textContent = 'Finalizar';
      btnFinalizar.className = 'finalizar-btn';
      // ...asigna evento finalizar...
      accionesTd.appendChild(btnFinalizar);

      // Botón Crear Pase solo si el estado es Iniciado o En trámite
      if (doc.estado_doc === 'Iniciado' || doc.estado_doc === 'En trámite') {
        const btnCrearPase = document.createElement('button');
        btnCrearPase.textContent = 'Crear Pase';
        btnCrearPase.className = 'crear-pase-btn';
        btnCrearPase.onclick = function() {
          window.location.href = `crear_pases.html?id_doc=${doc.id_doc}`;
        };
        accionesTd.appendChild(btnCrearPase);
      }

      tr.appendChild(accionesTd);
      tbody.appendChild(tr);
    });
  }

