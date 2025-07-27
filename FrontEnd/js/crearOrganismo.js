// Script para crear organismo desde el frontend
// Debe incluirse en crear_organismo.html o como archivo externo

document.getElementById("form-organismo").addEventListener("submit", async function(event) {
  event.preventDefault();
  const nombre = document.getElementById("organismo-nombre").value;
  const tipo = document.getElementById("organismo-tipo").value;
  const direccion = document.getElementById("organismo-direccion").value;
  const telefono = document.getElementById("organismo-telefono").value;
  const email = document.getElementById("organismo-email").value;
  const datos = { nombre, tipo, direccion, telefono, email };
  try {
    const token = localStorage.getItem('token');
    const response = await fetch("http://localhost:5001/organismo/createorganismo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(datos)
    });
    const data = await response.json();
    if (response.ok) {
      mostrarModalExito();
    } else {
      alert("Error: " + (data.error || data.message || 'Error desconocido'));
    }
  } catch (error) {
    alert("Error al conectar con el servidor");
    console.error("Error:", error);
  }
});

function mostrarModalExito() {
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
  contenido.style.padding = '32px 24px';
  contenido.style.borderRadius = '12px';
  contenido.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
  contenido.style.textAlign = 'center';
  contenido.innerHTML = `<h3>Organismo creado exitosamente</h3><button id='ok-modal' style='margin-top:18px; padding:10px 28px; background:#007bff; color:#fff; border:none; border-radius:6px; font-size:1.1rem; font-weight:600; cursor:pointer;'>OK</button>`;
  modal.appendChild(contenido);
  document.body.appendChild(modal);
  document.getElementById('ok-modal').onclick = function() {
    modal.remove();
    document.getElementById('form-organismo').reset();
  };
}
