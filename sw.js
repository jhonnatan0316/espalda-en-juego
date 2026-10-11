// Service worker: uso sin conexión y avisos push.
const CACHE = 'eej-v4';
const BASE = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'config.json',
  'js/app.js', 'js/data.js', 'js/schedule.js', 'js/store.js', 'js/player.js', 'js/figuras.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/badge.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fuentes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fuentes) return;

  const guardar = (res) => {
    if (res && (res.ok || res.type === 'opaque')) {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia));
    }
    return res;
  };

  // La configuración, primero de la red: un cambio en GitHub llega en la siguiente apertura.
  if (url.pathname.endsWith('config.json')) {
    ev.respondWith(fetch(req).then(guardar).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // El resto: lo guardado al momento, y se actualiza por detrás.
  ev.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const red = fetch(req).then(guardar).catch(() => hit);
      return hit || red;
    }),
  );
});

self.addEventListener('push', (ev) => {
  let d = {};
  try { d = ev.data ? ev.data.json() : {}; } catch { d = { cuerpo: ev.data ? ev.data.text() : '' }; }
  ev.waitUntil(self.registration.showNotification(d.titulo || 'Espalda en juego', {
    body: d.cuerpo || '',
    tag: d.tag || 'aviso',
    renotify: true,
    icon: 'icons/icon-192.png',
    badge: 'icons/badge.png',
    data: { url: d.url || '#/hoy' },
  }));
});

self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const destino = new URL(ev.notification.data?.url || '#/hoy', self.registration.scope).href;
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
      if (abierta) return abierta.navigate(destino).then((v) => (v || abierta).focus());
      return self.clients.openWindow(destino);
    }),
  );
});
