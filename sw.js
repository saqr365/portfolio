/* Service worker: يخلّي الموقع قابل للتثبيت ويشتغل أوفلاين (الصفحة الرئيسية والصور الصغيرة) */
const CACHE = 'saqr-portfolio-v5';
const SHELL = ['./', 'index.html', 'manifest.json?v=7', 'favicon.ico?v=7', 'icon-192.png?v=7', 'icon-512.png?v=7', 'apple-touch-icon.png?v=7', 'avatar.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // الخطوط والمواقع الخارجية من الشبكة مباشرة
  if (/\.(pdf|docx)$/i.test(url.pathname)) return;       // الملفات الكبيرة من الشبكة فقط

  // الصفحة: الشبكة أولًا (عشان التحديثات تظهر)، ولو مفيش نت تتفتح النسخة المخزّنة
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(m => m || caches.match('index.html')))
    );
    return;
  }

  // باقي الملفات (صور وأيقونات): من الكاش فورًا وتتحدّث في الخلفية
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req)
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
        .catch(() => cached);
      return cached || net;
    })
  );
});
