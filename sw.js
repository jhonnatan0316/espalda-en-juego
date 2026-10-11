// Service worker: uso sin conexión.
const CACHE = 'eej-v8';
const BASE = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'config.json',
  'js/app.js', 'js/data.js', 'js/schedule.js', 'js/store.js', 'js/player.js', 'js/figuras.js', 'js/recordatorios.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable.png',
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
