/* public/sw.js */
const SCOPE = new URL(self.registration.scope);
const withBase = (p) => new URL(p.replace(/^\//, ''), SCOPE).toString();
const VERSION = 'v2';
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const API_CACHE = `api-${VERSION}`;

// App shell minimal (Basic)
const APP_SHELL = [
  withBase(''), // scope root (/storyshandy/)
  withBase('index.html'),
  withBase('manifest.webmanifest'),
  withBase('favicon.svg'),
  withBase('offline.html'),
  withBase('icons/manifest-icon-192.maskable.png'),
  withBase('icons/manifest-icon-512.maskable.png'),
  withBase('screenshots/home-narrow.png'),
  withBase('screenshots/home-wide.png'),
];


self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => ![SHELL_CACHE, RUNTIME_CACHE, API_CACHE].includes(k))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// ===== PUSH (Skilled + Advanced) =====
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'Story baru', body: event.data?.text?.() ?? '' };
  }

  const title = payload.title || 'Story baru';
  const body =
    payload.body ||
    payload.message ||
    payload.description ||
    'Ada story baru ditambahkan.';

  const storyId =
    payload.id ||
    payload.storyId ||
    payload.data?.id ||
    payload.story?.id;

  const options = {
    body,
    icon: payload.icon || withBase('favicon.svg'),
    badge: payload.badge || withBase('favicon.svg'),
    data: { url: storyId ? withBase(`#/story/${storyId}`) : withBase('#/home') },
    actions: [
      { action: 'open', title: 'Lihat detail' },
      { action: 'close', title: 'Tutup' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/#/home';

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of allClients) {
      if ('focus' in client) {
        await client.focus();
        client.navigate(targetUrl);
        return;
      }
    }
    if (clients.openWindow) await clients.openWindow(targetUrl);
  })());
});

// ===== OFFLINE + CACHING (Basic + Advanced) =====
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // biarkan non-GET lewat network (POST create story, login, dll)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) Navigasi (SPA) → network-first, fallback ke cache/index/offline
  if (req.mode === 'navigate') {
    event.respondWith(networkFirstForPage(req));
    return;
  }

  // 2) Cache data dinamis stories (Advanced)
  // menangkap /v1/stories baik via proxy (same-origin) maupun full base url
  const isStoriesList =
    url.pathname.endsWith('/v1/stories') || url.pathname.endsWith('/stories');

  if (isStoriesList && url.searchParams.get('location') === '1') {
    event.respondWith(networkFirstForAPI(req));
    return;
  }

  // 3) Static assets (css/js/font) → stale-while-revalidate
  if (['style', 'script', 'worker', 'font'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  // 4) Images (termasuk foto story) → cache-first
  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req, RUNTIME_CACHE));
    return;
  }

  // default: coba cache dulu
  event.respondWith(cacheFirst(req, RUNTIME_CACHE));
});

async function networkFirstForPage(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;

    // fallback ke app shell untuk SPA
    const shell = await caches.match(withBase('index.html'));
    if (shell) return shell;
    return caches.match(withBase('offline.html'));


    // fallback offline page
    return caches.match('/offline.html');
  }
}

async function networkFirstForAPI(req) {
  const url = new URL(req.url);
  const cacheKey = new Request(url.toString(), { method: 'GET' });

  try {
    const fresh = await fetch(req);

    // ✅ jangan cache error (401/403/500)
    if (fresh.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(cacheKey, fresh.clone());
    }

    return fresh;
  } catch (e) {
    const cached = await caches.match(cacheKey);
    if (cached) return cached;

    return new Response(JSON.stringify({ listStory: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;

  const fresh = await fetch(req);
  const cache = await caches.open(cacheName);
  cache.put(req, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(req, cacheName) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then(async (fresh) => {
    const cache = await caches.open(cacheName);
    cache.put(req, fresh.clone());
    return fresh;
  }).catch(() => null);

  return cached || (await fetchPromise) || cached;
}
