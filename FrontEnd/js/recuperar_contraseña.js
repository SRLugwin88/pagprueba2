// js/recuperar_contraseña.js

document.getElementById('recuperarForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const successMsg = document.getElementById('recuperar-success');
  const errorMsg = document.getElementById('recuperar-error');
  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';

  try {
    const res = await fetch('/api/auth/requestPasswordReset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email })
    });
    const data = await res.json();
    if (res.ok) {
      successMsg.textContent = 'Si los datos son correctos, recibirás un correo con el enlace para restablecer tu contraseña.';
      successMsg.style.display = 'block';
    } else {
      errorMsg.textContent = data.message || 'Error al enviar el correo de recuperación.';
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    errorMsg.textContent = 'Error de conexión con el servidor.';
    errorMsg.style.display = 'block';
  }
});
