// Service worker: uso sin conexión.
const CACHE = 'eej-v9';
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
  const guardado = () => caches.match(req, { ignoreSearch: true });

  // Las tipografías no cambian: primero lo guardado.
  if (fuentes) {
    ev.respondWith(guardado().then((hit) => hit || fetch(req).then(guardar)));
    return;
  }
  // La web, primero de la red para que cada cambio se vea al momento.
  // Sin conexión, o si la red tarda más de 4 segundos, se usa lo guardado.
  ev.respondWith((async () => {
    const red = fetch(req, { cache: 'no-cache' }).then(guardar);
    const limite = new Promise((resolver) => setTimeout(resolver, 4000, null));
    try {
      const res = await Promise.race([red, limite]);
      if (res) return res;
    } catch { /* sin red: se sigue con lo guardado */ }
    return (await guardado()) || red;
  })());
});
