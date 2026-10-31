/* DGV-GBT Mobile – lưu sẵn file của app để chạy offline. Không bao giờ tải hay gửi số liệu.
   Trang (index.html) + sw: lấy bản mới trên mạng trước (chờ tối đa 3 giây), mất mạng thì dùng bản đã lưu → luôn lên bản mới khi có mạng.
   app.js / app.css có số bản (?v=) nên lấy từ bộ nhớ trước. */
const V = 'dgvm-117';
const FILES = ['./', 'index.html', 'app.css?v=117', 'app.js?v=117', 'eng.js?v=117', 'xlsx.js?v=117', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k != V).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
const net = (r, ms) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout')), ms); fetch(r, { cache: 'no-store' }).then(x => { clearTimeout(t); x.ok ? ok(x) : no(new Error('http ' + x.status)) }, e => { clearTimeout(t); no(e) }) });
self.addEventListener('fetch', e => { const r = e.request; if (r.method != 'GET') return; const u = new URL(r.url); if (u.origin != location.origin) return;
  if (r.mode == 'navigate' || /\/(index\.html)?$/.test(u.pathname) || u.pathname.endsWith('manifest.webmanifest')) {
    e.respondWith(net(r, 3000).then(x => { const c = x.clone(); caches.open(V).then(k => k.put(r.mode == 'navigate' ? 'index.html' : r, c)); return x })
      .catch(() => caches.open(V).then(k => k.match(r, { ignoreSearch: true }).then(h => h || k.match('index.html'))))); return }
  e.respondWith(caches.open(V).then(c => c.match(r).then(h => h || fetch(r).then(x => { if (x.ok) c.put(r, x.clone()); return x })))) });
