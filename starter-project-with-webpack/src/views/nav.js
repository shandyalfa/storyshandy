import { getToken, logout } from '../api.js';
import { ensurePushToggleUI, initPushToggle } from '../utils/pushNotification.js';

export function initNav(){
  const link = document.querySelector('#authLink');
  if (!link) return;

  // Advanced: tombol enable/disable push (tanpa edit HTML)
  ensurePushToggleUI(link);

  // init toggle push
  initPushToggle({
    vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  });

  const refresh = () => {
    const loggedIn = !!getToken();
    link.textContent = loggedIn ? 'Logout' : 'Masuk';
    link.href = '#/login';
    link.dataset.mode = loggedIn ? 'logout' : 'login';
  };

  refresh();
  window.addEventListener('auth:changed', refresh);
  window.addEventListener('storage', (e)=>{ if(e.key==='AUTH_TOKEN') refresh(); });

  link.addEventListener('click', (e) => {
    if (link.dataset.mode === 'logout') {
      e.preventDefault();
      logout();
      window.dispatchEvent(new CustomEvent('auth:changed', { detail:{ loggedIn:false } }));
      location.hash = '#/login';
    }
  });
}
