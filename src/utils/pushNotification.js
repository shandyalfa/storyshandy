import { subscribePush, unsubscribePush } from '../api.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function getReadyRegistration() {
  const base = import.meta.env.BASE_URL || '/';     // "/storyshandy/" saat deploy
  const swUrl = `${base}sw.js`;                     // "/storyshandy/sw.js"

  // ambil yang sudah ada dulu biar gak dobel
  let reg = await navigator.serviceWorker.getRegistration(base);
  if (!reg) reg = await navigator.serviceWorker.register(swUrl, { scope: base });

  return reg;
}

export function ensurePushToggleUI() {
  if (document.querySelector('#pushToggle')) return;

  const wrap = document.createElement('div');
  wrap.className = 'push-setting';
  wrap.innerHTML = `
    <label for="pushToggle">
      <input type="checkbox" id="pushToggle" />
      Push Notification
    </label>
    <span id="pushStatus" role="status" aria-live="polite"></span>
  `;

  const slot = document.querySelector('#navRight');
  (slot || document.body).appendChild(wrap);
}

export async function initPushToggle({
  checkboxSelector = '#pushToggle',
  statusSelector = '#pushStatus',
  vapidPublicKey,
} = {}) {
  const checkbox = document.querySelector(checkboxSelector);
  const statusEl = document.querySelector(statusSelector);
  const setStatus = (msg) => statusEl && (statusEl.textContent = msg);

  if (!checkbox) return;

  if (!vapidPublicKey) {
    checkbox.disabled = true;
    setStatus('VAPID key belum ada di .env');
    return;
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    checkbox.disabled = true;
    setStatus('Push tidak didukung di browser ini.');
    return;
  }

  const reg = await getReadyRegistration();
  const existingSub = await reg.pushManager.getSubscription();

  checkbox.checked = !!existingSub;
  setStatus(existingSub ? 'Push aktif.' : 'Push nonaktif.');

  checkbox.addEventListener('change', async () => {
    try {
      if (checkbox.checked) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          checkbox.checked = false;
          setStatus('Izin notifikasi ditolak.');
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await subscribePush(sub);
        setStatus('Push aktif.');
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub);
          await sub.unsubscribe();
        }
        setStatus('Push nonaktif.');
      }
    } catch (err) {
      checkbox.checked = !checkbox.checked;
      setStatus(`Error: ${err.message}`);
    }
  });
}
