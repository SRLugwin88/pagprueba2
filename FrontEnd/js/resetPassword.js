// js/resetPassword.js

// Obtener el token de la URL
function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token') || window.location.pathname.split('/').pop();
}

document.getElementById('resetForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const successMsg = document.getElementById('reset-success');
  const errorMsg = document.getElementById('reset-error');
  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';

  if (newPassword !== confirmPassword) {
    errorMsg.textContent = 'Las contraseñas no coinciden.';
    errorMsg.style.display = 'block';
    return;
  }

  const token = getTokenFromUrl();
  if (!token) {
    errorMsg.textContent = 'Token de recuperación no encontrado.';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/auth/resetPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      successMsg.textContent = 'Contraseña restablecida con éxito. Ahora puedes iniciar sesión.';
      successMsg.style.display = 'block';
      setTimeout(() => window.location.href = 'index.html', 2500);
    } else {
      errorMsg.textContent = data.message || 'Error al restablecer la contraseña.';
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    errorMsg.textContent = 'Error de conexión con el servidor.';
    errorMsg.style.display = 'block';
  }
});
