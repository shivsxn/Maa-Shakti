/* Maa Vandana Logistics — offline copy.
   The network always comes first, so a new version is seen the next
   time the app opens. The saved copy is only used when there is no
   connection, which lets the app still open in a yard with no signal.
   Records never pass through here: they live on the device and in the
   cloud project, exactly as they do in the browser. */
const CACHE = 'mvl-shell-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // fonts, Firebase: left to the browser
  const nav = req.mode === 'navigate';
  const live = nav ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(live.then(res => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(nav ? './index.html' : req, copy));
    }
    return res;
  }).catch(() => caches.match(nav ? './index.html' : req, { ignoreSearch: true })
    .then(hit => hit || caches.match('./'))));
});
