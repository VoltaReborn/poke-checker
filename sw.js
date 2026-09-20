/* PokéType v2: app shell offline; previously fetched API data may be available offline. */
const SHELL = 'poketype-shell-v2-original-look-2';
const API = 'poketype-api-v2-1';
const ART = 'poketype-art-v2-1';
const PREFIX = 'poketype-';
const SHELL_URLS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-physical.png', './icon-special.png', './icon-status.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && ![SHELL, API, ART].includes(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
async function trimCache(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(key => cache.delete(key)));
}
async function networkFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok || (cacheName === ART && response.type === 'opaque')) {
      await cache.put(request, response.clone());
      if (limit) await trimCache(cache, limit);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
      event.respondWith(networkFirst(req, SHELL));
    } else {
      event.respondWith(caches.match(req).then(found => found || fetch(req)));
    }
  } else if (url.hostname === 'pokeapi.co' && url.pathname.startsWith('/api/v2/')) {
    event.respondWith(networkFirst(req, API, 350));
  } else if (url.hostname === 'raw.githubusercontent.com' && url.pathname.startsWith('/PokeAPI/sprites/')) {
    event.respondWith(networkFirst(req, ART, 140));
  }
});
