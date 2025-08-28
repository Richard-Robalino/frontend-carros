document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return; // Evita errores si el form no existe
const API_URL = import.meta.env.VITE_API_URL;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('${API_URL}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      window.location.href = 'dashboard.html';
    } catch (err) {
      const errorElem = document.getElementById('loginError');
      if (errorElem) errorElem.innerText = err.message;
    }
  });
});
