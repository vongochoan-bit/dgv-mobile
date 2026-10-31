/* DGV-GBT Mobile – lưu sẵn mọi file của app để chạy offline. Không bao giờ tải hay gửi số liệu. */
const V = 'dgvm-115.1';
const FILES = ['./', 'index.html', 'app.css?v=115.1', 'app.js?v=115.1', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k != V).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => { const r = e.request; if (r.method != 'GET' || new URL(r.url).origin != location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(r, { ignoreSearch: r.mode == 'navigate' }).then(h => h || (r.mode == 'navigate' ? c.match('index.html') : null)).then(h => h || fetch(r)))) });
