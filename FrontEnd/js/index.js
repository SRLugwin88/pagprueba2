// Lógica para iniciar sesión en GesDoc
async function iniciarSesion() {
  const username = document.getElementById('login-username').value.trim();
  const contrasena = document.getElementById('login-password').value;

  // Validación básica
  if (!username || !contrasena) {
    alert('Por favor, completa usuario y contraseña.');
    return;
  }

  try {
    // Cambia la URL según el puerto real de tu backend
    const backendUrl = 'pagprueba2-production-b22b.up.railway.app/auth/login';
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Importante para sesiones/cookies
      body: JSON.stringify({ username, contrasena })
    });
    let data = {};
    try {
      data = await res.json();
    } catch (jsonErr) {
      // Si la respuesta no es JSON
      alert('Respuesta inesperada del servidor.');
      return;
    }
    if (res.ok && data.success) {
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('id_rol', data.user.id_rol); // Guardar id_rol
        localStorage.setItem('rol', data.user.rol); // Guardar rol
        if (data.user.departamento) {
          localStorage.setItem('departamento', JSON.stringify(data.user.departamento));
        }
      }
      window.location.href = 'principal.html';
    } else {
      alert(data.message || 'Usuario o contraseña incorrectos.');
    }
  } catch (err) {
    alert('Error de conexión con el servidor.\n' + (err.message || ''));
  }
}
