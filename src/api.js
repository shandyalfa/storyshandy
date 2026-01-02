const DEFAULT_BASE = import.meta.env.DEV
  ? '/v1'
  : 'https://story-api.dicoding.dev/v1';

const API_BASE = () => {
  const saved = (localStorage.getItem('API_BASE') || DEFAULT_BASE).replace(/\/$/, '');
  if (!import.meta.env.DEV && saved.startsWith('/')) return 'https://story-api.dicoding.dev/v1';
  return saved;
};

const TOKEN_KEY = 'AUTH_TOKEN';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon, shadowUrl: shadow });

export function setApiBase(url){ localStorage.setItem('API_BASE', url); }
export function getApiBase(){ return localStorage.getItem('API_BASE') || DEFAULT_BASE; }

export function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
export function getToken(){ return localStorage.getItem(TOKEN_KEY) || ''; }
export function logout(){ localStorage.removeItem(TOKEN_KEY); }

export async function register({ name, email, password }, signal){
  const r = await fetch(`${API_BASE()}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
    signal
  });
  if (!r.ok) throw new Error((await r.text()) || 'Gagal register');
  return r.json();
}

export async function login({ email, password }, signal){
  const r = await fetch(`${API_BASE()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal
  });
  if (!r.ok) throw new Error((await r.text()) || 'Gagal login');
  const data = await r.json();
  if (data?.loginResult?.token) setToken(data.loginResult.token);
  return data;
}

export async function listStories(signal){
  const token = getToken();
  const r = await fetch(`${API_BASE()}/stories?location=1`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    signal
  });

  if (r.status === 401) {
    throw new Error('Perlu login terlebih dahulu (401 Unauthorized). Buka menu “Masuk”, login, lalu refresh beranda.');
  }
  if (!r.ok) {
    const t = await r.text().catch(()=> '');
    throw new Error(`Gagal memuat data API (status ${r.status}). ${t}`);
  }

  const data = await r.json();
  const rows = data.listStory || [];
  return rows.map(s => ({
    id: s.id,
    title: s.name || '(tanpa judul)',
    description: s.description || '',
    category: 'cerita',
    lat: Number.isFinite(Number(s.lat)) ? Number(s.lat) : null,
    lng: Number.isFinite(Number(s.lon)) ? Number(s.lon) : null,
    imageUrl: s.photoUrl || ''
  }));
}



export async function createStory({ description, lat, lng, imageFile }, signal){
  const token = getToken();
  const fd = new FormData();
  fd.append('description', description || '');
  if (Number.isFinite(lat)) fd.append('lat', String(lat));
  if (Number.isFinite(lng)) fd.append('lon', String(lng));
  if (imageFile) fd.append('photo', imageFile);

  const endpoint = token ? `${API_BASE()}/stories` : `${API_BASE()}/stories/guest`;
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: fd,
    signal
  });

  if (r.status === 401) {
    throw new Error('Perlu login untuk mengirim story ke endpoint non-guest (401).');
  }
  if (!r.ok) {
    const t = await r.text().catch(()=> '');
    throw new Error(`Gagal mengirim data (status ${r.status}). ${t}`);
  }
  return r.json();
}

export async function createStoryGuest({ description, lat, lng, imageFile }, signal) {
  const fd = new FormData();
  fd.append('description', description || '');
  if (Number.isFinite(lat)) fd.append('lat', String(lat));
  if (Number.isFinite(lng)) fd.append('lon', String(lng));
  if (imageFile) fd.append('photo', imageFile);

  const r = await fetch(`${API_BASE()}/stories/guest`, {
    method: 'POST',
    body: fd,
    signal
  });

  if (!r.ok) {
    const t = await r.text().catch(()=> '');
    throw new Error(`Gagal kirim (guest) (status ${r.status}). ${t}`);
  }
  return r.json();
}

export async function createStoryAuth({ description, lat, lng, imageFile }, signal) {
  const token = getToken();
  if (!token) throw new Error('Harus login untuk kirim story auth.');

  const fd = new FormData();
  fd.append('description', description || '');
  if (Number.isFinite(lat)) fd.append('lat', String(lat));
    if (Number.isFinite(lng)) fd.append('lon', String(lng));
  if (imageFile) fd.append('photo', imageFile);

  const r = await fetch(`${API_BASE()}/stories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
    signal
  });

  if (!r.ok) {
    const t = await r.text().catch(()=> '');
    throw new Error(`Gagal kirim (auth) (status ${r.status}). ${t}`);
  }
  return r.json();
}


export async function subscribePush(subscription, signal){
  const token = getToken();
  const subJSON = subscription.toJSON();

  const body = {
    endpoint: subJSON.endpoint,
    keys: {
      p256dh: subJSON.keys.p256dh,
      auth: subJSON.keys.auth,
    },
  };

  const r = await fetch(`${API_BASE()}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!r.ok) throw new Error(`Gagal subscribe push (status ${r.status}). ${(await r.text().catch(()=>''))}`);
  return r.json();
}

export async function unsubscribePush(subscription, signal){
  const token = getToken();
  const subJSON = subscription.toJSON();

  const body = { endpoint: subJSON.endpoint };

  const r = await fetch(`${API_BASE()}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!r.ok) throw new Error(`Gagal unsubscribe push (status ${r.status}). ${(await r.text().catch(()=>''))}`);
  return r.json();
}
