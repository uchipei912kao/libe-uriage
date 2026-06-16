/* Service Worker — オフラインでも開けるようにキャッシュ */
const CACHE = 'libe-uriage-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // CDN（Chart.js等）はネット優先、ローカル資産はキャッシュ優先
  if (e.request.url.startsWith('http') && !e.request.url.includes(self.location.origin)) {
    return; // 外部CDNはそのまま通す
  }
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
