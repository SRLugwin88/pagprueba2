document.addEventListener('DOMContentLoaded', async () => {
  // === FILTRO Y RENDER PASES ===
  let pasesGlobal = [];

  function renderizarTablaPases(arr) {
    const tbody = document.getElementById('tabla-pases');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (Array.isArray(arr) && arr.length > 0) {
      arr.forEach(pase => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${pase.numero_doc || ''}</td>
          <td>${pase.fecha_ingreso ? pase.fecha_ingreso.substring(0,10) : ''}</td>
          <td>${pase.fecha_salida ? pase.fecha_salida.substring(0,10) : ''}</td>
          <td>${pase.departamento_origen || ''}</td>
          <td>${pase.departamento_destino || ''}</td>
          <td>${pase.receptor || ''}</td>
          <td>${pase.objetivo || ''}</td>
          <td>${pase.descripcion || ''}</td>
          <td class="acciones">
            <button class="editar" type="button">Editar</button>
          </td>
        `;
        tr.querySelector('.editar').addEventListener('click', function() {
          abrirModalEditarPase(pase);
        });
        tbody.appendChild(tr);
      });
    } else {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" style="text-align:center; color:#b00; font-weight:bold;">No hay resultados para la búsqueda</td>`;
      tbody.appendChild(tr);
    }
  }

  // MODAL DE EDICIÓN DE PASE
  function abrirModalEditarPase(pase) {
    let modal = document.getElementById('modal-editar-pase');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-editar-pase';
      modal.className = 'modal-editar-pase-bg';
      modal.innerHTML = `
        <div class="modal-editar-pase">
          <button id="cerrar-modal-editar-pase" class="cerrar-modal-editar-pase">&times;</button>
          <h3>Editar Pase</h3>
          <form id="form-editar-pase">
            <label>N° Documento
              <input type="text" value="${pase.numero_doc || ''}" readonly>
            </label>
            <label>Fecha Entrada
              <input type="text" value="${pase.fecha_ingreso ? pase.fecha_ingreso.substring(0,10) : ''}" readonly>
            </label>
            <label>Fecha Salida
              <input type="text" value="${pase.fecha_salida ? pase.fecha_salida.substring(0,10) : ''}" readonly>
            </label>
            <label>Depto. Origen
              <input type="text" value="${pase.departamento_origen || ''}" readonly>
            </label>
            <label>Depto. Destino
              <input type="text" value="${pase.departamento_destino || ''}" readonly>
            </label>
            <label>Receptor
              <input type="text" value="${pase.receptor || ''}" readonly>
            </label>
            <label>Objetivo
              <input type="text" id="editar-objetivo" value="${pase.objetivo || ''}" maxlength="120" required>
              <span id="error-objetivo" class="error-modal-pase"></span>
            </label>
            <label>Descripción
              <textarea id="editar-descripcion" maxlength="300">${pase.descripcion || ''}</textarea>
              <span id="error-descripcion" class="error-modal-pase"></span>
            </label>
            <div id="error-general-editar-pase" class="error-modal-pase" style="margin-bottom:8px;"></div>
            <div class="modal-editar-pase-botones">
              <button type="submit" class="btn-guardar-modal">Guardar</button>
              <button type="button" id="cancelar-editar-pase" class="btn-cancelar-modal">Cancelar</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.style.display = 'flex';
      // Actualizar valores si el modal ya existe
      modal.querySelector('input[type="text"][readonly]').value = pase.numero_doc || '';
      modal.querySelector('#editar-objetivo').value = pase.objetivo || '';
      modal.querySelector('#editar-descripcion').value = pase.descripcion || '';
      // Limpiar errores previos
      const errorObjetivo = modal.querySelector('#error-objetivo');
      const errorDescripcion = modal.querySelector('#error-descripcion');
      const errorGeneral = modal.querySelector('#error-general-editar-pase');
      if (errorObjetivo) errorObjetivo.textContent = '';
      if (errorDescripcion) errorDescripcion.textContent = '';
      if (errorGeneral) errorGeneral.textContent = '';
    }

    // Cerrar modal
    modal.querySelector('#cerrar-modal-editar-pase').onclick = cerrar;
    modal.querySelector('#cancelar-editar-pase').onclick = cerrar;
    function cerrar() {
      modal.style.display = 'none';
    }

    // Validación y guardar cambios
    modal.querySelector('#form-editar-pase').onsubmit = async function(e) {
      e.preventDefault();
      const objetivo = modal.querySelector('#editar-objetivo').value.trim();
      const descripcion = modal.querySelector('#editar-descripcion').value.trim();
      const errorObjetivo = modal.querySelector('#error-objetivo');
      const errorDescripcion = modal.querySelector('#error-descripcion');
      const errorGeneral = modal.querySelector('#error-general-editar-pase');
      let hayError = false;
      if (errorObjetivo) errorObjetivo.textContent = '';
      if (errorDescripcion) errorDescripcion.textContent = '';
      if (errorGeneral) errorGeneral.textContent = '';

      if (!objetivo) {
        if (errorObjetivo) errorObjetivo.textContent = 'El objetivo es obligatorio.';
        hayError = true;
      } else if (objetivo.length > 120) {
        if (errorObjetivo) errorObjetivo.textContent = 'Máximo 120 caracteres.';
        hayError = true;
      }
      if (descripcion.length > 300) {
        if (errorDescripcion) errorDescripcion.textContent = 'Máximo 300 caracteres.';
        hayError = true;
      }
      if (hayError) return;
      try {
        const res = await fetch(`pagprueba2-production-b22b.up.railway.app/pase/updatePase/${pase.id_pase}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ objetivo, descripcion })
        });
        if (!res.ok) {
          let msg = await res.text();
          if (errorGeneral) errorGeneral.textContent = msg || 'Error al actualizar el pase.';
          throw new Error(msg);
        }
        mostrarModalExito('Pase actualizado correctamente');
        modal.style.display = 'none';
        await cargarPasesGlobal();
      } catch (err) {
        if (errorGeneral) errorGeneral.textContent = err.message || 'Error al actualizar el pase.';
        mostrarModalExito('Error al actualizar: ' + err.message, true);
      }
    };
  }

  async function cargarPasesGlobal() {
    const token = localStorage.getItem('token');
    const tablaPases = document.getElementById('tabla-pases');
    if (tablaPases) tablaPases.innerHTML = '<tr><td colspan="9">Cargando...</td></tr>';
    try {
      const url = 'pagprueba2-production-b22b.up.railway.app/pase/getPases';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al obtener pases');
      pasesGlobal = data.data || [];
      // Ordenar por id_pase descendente
      pasesGlobal.sort((a, b) => b.id_pase - a.id_pase);
      renderizarTablaPases(pasesGlobal);
    } catch (err) {
      if (tablaPases) tablaPases.innerHTML = `<tr><td colspan="9" style="color:red;">${err.message}</td></tr>`;
    }
  }

  // Filtro en input 
  function parseNumeroDoc(str) {
    if (!str) return { prefijo: '', numero: '', guion: false };
    const clean = str.toString().replace(/\s+/g, '').toUpperCase();
    // Detecta S- o E- (solo prefijo y guion)
    if (/^([SE])-$/.test(clean)) {
      return { prefijo: clean[0], numero: '', guion: true };
    }
    // Detecta S-123, E-00045, etc
    const match = clean.match(/^([SE])-(0*[0-9]+)$/);
    if (match) {
      return { prefijo: match[1], numero: match[2], guion: true };
    }
    // Detecta S123, E45 (sin guion)
    const matchSinGuion = clean.match(/^([SE])0*([0-9]+)$/);
    if (matchSinGuion) {
      return { prefijo: matchSinGuion[1], numero: matchSinGuion[2], guion: false };
    }
    // Solo S o E
    const matchPref = clean.match(/^([SE])$/);
    if (matchPref) {
      return { prefijo: matchPref[1], numero: '', guion: false };
    }
    return { prefijo: '', numero: '', guion: false };
  }

  function filtrarPases(valor) {
    valor = valor.trim().toUpperCase();
    // Si el input está vacío o solo contiene guiones o espacios, mostrar todos
    if (!valor || /^[\s-]+$/.test(valor)) {
      renderizarTablaPases(pasesGlobal);
      return;
    }
    let filtrados = pasesGlobal.filter(pase => {
      const numeroDoc = pase.numero_doc || pase.NumeroDoc || (pase.documento && pase.documento.NumeroDoc) || '';
      const docObj = parseNumeroDoc(numeroDoc);
      const valorObj = parseNumeroDoc(valor);
      // --- FILTRO POR FECHA ---
      let fechaDoc = pase.fecha_ingreso ? pase.fecha_ingreso.substring(0,10) : '';
      // yyyy-mm-dd exacto
      if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return fechaDoc === valor;
      }
      // dd/mm/yyyy exacto
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
        let partes = fechaDoc.split('-');
        if (partes.length === 3) {
          let fechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
          return fechaFormateada === valor;
        }
      }
      // dd-mm-yyyy exacto
      if (/^\d{2}-\d{2}-\d{4}$/.test(valor)) {
        let partes = fechaDoc.split('-');
        if (partes.length === 3) {
          let fechaFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`;
          return fechaFormateada === valor;
        }
      }
      // Búsqueda parcial por fecha (cualquier fragmento en yyyy-mm-dd)
      if (fechaDoc && fechaDoc.includes(valor)) {
        return true;
      }
      // Búsqueda parcial por fecha en formato dd/mm o dd-mm
      if (/^\d{2}[\/\-]\d{2}/.test(valor)) {
        let partes = fechaDoc.split('-');
        if (partes.length === 3) {
          let fechaFormateada1 = `${partes[2]}/${partes[1]}`;
          let fechaFormateada2 = `${partes[2]}-${partes[1]}`;
          return fechaFormateada1.startsWith(valor) || fechaFormateada2.startsWith(valor);
        }
      }

      // Caso E- o S- (solo prefijo y guion)
      if (valorObj.guion && valorObj.numero === '') {
        return docObj.prefijo === valorObj.prefijo && docObj.guion;
      }
      // Caso E-123 o S-456 (prefijo, guion y número)
      if (valorObj.guion && valorObj.numero) {
        const valorNumero = valorObj.numero.replace(/^0+/, '');
        const docNumero = docObj.numero.replace(/^0+/, '');
        return docObj.prefijo === valorObj.prefijo && docObj.guion && docNumero.startsWith(valorNumero);
      }
      // Caso E o S (solo la letra, sin guion ni número)
      if (!valorObj.guion && valorObj.numero === '') {
        return docObj.prefijo === valorObj.prefijo && (!docObj.numero || docObj.numero === '') && !docObj.guion;
      }
      return false;
    });
    renderizarTablaPases(filtrados);
  }



  // Cargar la tabla de pases y conectar el filtro tras cargar datos y DOM
  await cargarPasesGlobal();

  // DEBUG: Verifica si el input existe y muestra advertencia si no
  const input = document.getElementById('busqueda');
  if (!input) {
    console.error('El input de búsqueda con id="busqueda" NO existe en el HTML. El filtro no funcionará.');
  } else {
    input.addEventListener('input', function() {
      filtrarPases(input.value);
    });
    // Ejecutar el filtro automáticamente tras cargar los datos
    filtrarPases(input.value);
  }


  // ...lógica de creación de pase y formularios SOLO si existen los selects (pantalla de creación)
  const selectDocumento = document.getElementById('pase-documento');
  const selectDeptoDestino = document.getElementById('pase-depto-destino');
  const selectDeptoActual = document.getElementById('pase-depto-actual'); // <-- Agregado
  const selectReceptor = document.getElementById('pase-receptor');
  let empleados = [];
  let departamentos = [];

  function filtrarEmpleadosPorDeptoDestino() {
    const idDepto = selectDeptoDestino.value;
    selectReceptor.innerHTML = '<option value="">Seleccione un empleado</option>';
    if (!idDepto) return;
    const empleadosFiltrados = empleados.filter(emp =>
      emp.departamento && String(emp.departamento.id_dpto) === String(idDepto)
    );
    empleadosFiltrados.forEach(emp => {
      const option = document.createElement('option');
      option.value = emp.id_empleado;
      option.textContent = emp.nombre_completo;
      selectReceptor.appendChild(option);
    });
  }

  if (selectDeptoDestino && selectReceptor) {
    selectDeptoDestino.addEventListener('change', filtrarEmpleadosPorDeptoDestino);
  }

  async function fetchData(url, headers = {}) {
    try {
      const res = await fetch(url, { headers });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error(`[fetchData] Respuesta no JSON de ${url}:`, text);
        throw new Error(`Respuesta no JSON de ${url}`);
      }
      console.log(`[fetchData] Respuesta cruda de ${url}:`, data);
      if (!res.ok) throw new Error(`Error en ${url}: ${text}`);
      // Permite respuesta tipo { data: [...] }, { departamentos: [...] }, o array directo
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      if (data && Array.isArray(data.departamentos)) {
        return data.departamentos;
      }
      if (Array.isArray(data)) {
        return data;
      }
      throw new Error(`La respuesta de ${url} está vacía o no tiene formato correcto.`);
    } catch (err) {
      alert(`Error al cargar datos: ${err.message}`);
      return [];
    }
  }

  // Cargar departamentos si existe al menos uno de los selects
  async function cargarDepartamentos() {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('[DEBUG token]', token);
      console.log('[DEBUG user]', user);
      departamentos = await fetchData('pagprueba2-production-b22b.up.railway.app/departamento/getdepartamentos', {
        'Authorization': `Bearer ${token}`
      });
      console.log('[DEBUG departamentos]', departamentos);
      // Adaptar si los objetos no tienen id_dpto pero sí id
      const adaptado = departamentos.map(d => {
        if (d && typeof d === 'object') {
          if ('id_dpto' in d && 'nombre' in d) return d;
          if ('id' in d && 'nombre' in d) return { id_dpto: d.id, nombre: d.nombre };
          if ('id_dpto' in d && 'Nombre' in d) return { id_dpto: d.id_dpto, nombre: d.Nombre };
        }
        return d;
      });
      // Cargar destino: siempre todos
      if (selectDeptoDestino) {
        selectDeptoDestino.innerHTML = '';
        if (adaptado && adaptado.length > 0) {
          adaptado.forEach(depto => {
            if (!depto.id_dpto || !depto.nombre) {
              console.warn('[WARN] Departamento malformado:', depto);
              return;
            }
            const option = document.createElement('option');
            option.value = depto.id_dpto;
            option.textContent = depto.nombre;
            selectDeptoDestino.appendChild(option);
          });
        } else {
          agregarOpcionError(selectDeptoDestino, 'No hay departamentos disponibles');
        }
      }
      // Cargar actual: mostrar solo el departamento del usuario, como campo solo lectura
      if (selectDeptoActual) {
        selectDeptoActual.innerHTML = '';
        const user = JSON.parse(localStorage.getItem('user'));
        let deptoUser = null;
        if (user && user.departamento && user.departamento.id_dpto) {
          deptoUser = adaptado.find(d => String(d.id_dpto) === String(user.departamento.id_dpto));
        }
        // Reemplazar el select por un input solo lectura si se encuentra el departamento
        if (deptoUser) {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = deptoUser.nombre;
          input.readOnly = true;
          input.className = selectDeptoActual.className;
          input.id = selectDeptoActual.id;
          // Insertar el input en el DOM en lugar del select
          selectDeptoActual.parentNode.replaceChild(input, selectDeptoActual);
        } else {
          // Si no se encuentra, mostrar error
          agregarOpcionError(selectDeptoActual, 'No se encontró el departamento del usuario');
        }
      }
    } catch (error) {
      if (selectDeptoDestino) {
        selectDeptoDestino.innerHTML = '';
        agregarOpcionError(selectDeptoDestino, 'Error al cargar departamentos');
      }
      if (selectDeptoActual) {
        selectDeptoActual.innerHTML = '';
        agregarOpcionError(selectDeptoActual, 'Error al cargar departamentos');
      }
      console.error('Error al cargar departamentos:', error);
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

  // Cargar empleados si existe el select
  async function cargarEmpleados() {
    empleados = await fetchData('pagprueba2-production-b22b.up.railway.app/empleado/getempleados', {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    if (selectReceptor) {
      selectReceptor.innerHTML = '<option value="">Seleccione un empleado</option>';
      empleados.forEach(emp => {
        if (!emp.departamento || !emp.departamento.id_dpto) {
          console.warn(`El empleado ${emp.nombre_completo} no tiene un departamento asignado correctamente.`);
        }
        const option = document.createElement('option');
        option.value = emp.id_empleado;
        option.textContent = emp.nombre_completo;
        selectReceptor.appendChild(option);
      });
    }
  }

  // Cargar documentos si existe el select
  async function cargarDocumentos() {
    const documentos = await fetchData('pagprueba2-production-b22b.up.railway.app/documento/getdocumentos', {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    if (selectDocumento) {
      selectDocumento.innerHTML = '<option value="">Seleccione un documento</option>';
      // Filtrar solo documentos cuyo NumeroDoc empiece con "E"
      documentos.filter(doc => {
        // Acepta E-0000000004, E-123, E0001, etc.
        return typeof doc.NumeroDoc === 'string' && /^E[-0-9]+$/i.test(doc.NumeroDoc.trim());
      }).forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id_doc;
        option.textContent = doc.NumeroDoc;
        selectDocumento.appendChild(option);
      });
    }
  }

  // Solo asociar submit si existe el formulario
  async function crearPase(event) {
    event.preventDefault();
    const id_departamento_actual = JSON.parse(localStorage.getItem('user'))?.departamento?.id_dpto;
    const departamentoDestinoId = selectDeptoDestino ? selectDeptoDestino.value : null;
    const receptorId = selectReceptor ? selectReceptor.value : null;

    if (!id_departamento_actual) return alert('Error: No se pudo obtener el departamento actual.');
    if (!departamentoDestinoId) return alert('Seleccione un departamento destino.');
    if (!receptorId) return alert('Seleccione un empleado receptor.');


    // Convertir IDs a número para evitar error 400
    const paseData = {
      id_doc: selectDocumento ? Number(selectDocumento.value) : null,
      id_departamento_actual: Number(id_departamento_actual),
      id_departamento_destino: Number(departamentoDestinoId),
      id_receptor: Number(receptorId),
      objetivo: document.getElementById('pase-objetivo')?.value.trim() || '',
      descripcion: document.getElementById('pase-descripcion')?.value.trim() || ''
    };

    const departamentoDestino = departamentos.find(depto => parseInt(depto.id_dpto) === parseInt(departamentoDestinoId));
    const receptor = empleados.find(emp => parseInt(emp.id_empleado) === parseInt(receptorId));

    if (!departamentoDestino) return alert('Error: El departamento destino no es válido.');
    if (!receptor) return alert('Error: El receptor seleccionado no es válido.');
    try {
      const res = await fetch('pagprueba2-production-b22b.up.railway.app/pase/createPase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paseData)
      });
      if (!res.ok) throw new Error(await res.text());
      mostrarModalExito('Pase creado exitosamente');
      document.getElementById('form-pase')?.reset();
    } catch (err) {
      mostrarModalExito(`Error al crear el pase: ${err.message}`, true);
    }
  }

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
    modal.innerHTML = `<span style=\"font-size:2rem;\">${esError ? '❌' : '✅'}</span><br>${mensaje}`;
    modal.style.color = esError ? '#e57373' : '#0d3c61';
    modal.style.display = 'block';
    setTimeout(() => { modal.style.display = 'none'; }, 2000);
  }

  // Inicialización: solo si hay algún select relevante
  if (selectDeptoDestino || selectDeptoActual) await cargarDepartamentos();
  if (selectReceptor) await cargarEmpleados();
  if (selectDocumento) await cargarDocumentos();
  const formPase = document.getElementById('form-pase');
  if (formPase) {
    formPase.addEventListener('submit', crearPase);
  }

  const params = new URLSearchParams(window.location.search);
  const idDoc = params.get('id_doc');
  if (idDoc && selectDocumento) {
    // Espera a que se carguen los documentos y selecciona el correcto
    cargarDocumentos().then(() => {
      selectDocumento.value = idDoc;
      selectDocumento.dispatchEvent(new Event('change'));
    });
  }
});
