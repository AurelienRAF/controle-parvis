// Réseau d'abord pour recevoir les mises à jour, mais pas plus de 3 s d'attente :
// au-delà (réseau du stade), on sert la copie gardée dans le téléphone.
const CACHE = 'controle-parvis-v1';
const FICHIERS = ['./', 'index.html', 'exceljs.min.js', 'manifest.webmanifest', 'icone.svg', 'icone-180.png', 'icone-192.png', 'icone-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return; // l'envoi au Sheet ne passe pas par ici
  e.respondWith(caches.open(CACHE).then(c => new Promise(resolve => {
    let fini = false;
    const rendre = r => { if (!fini && r) { fini = true; resolve(r); } };
    const viaCache = () => c.match(req, { ignoreSearch: true }).then(r => r || c.match('./'));
    fetch(req).then(r => {
      if (r.ok) c.put(req, r.clone());
      rendre(r);
    }).catch(() => viaCache().then(r => { if (r) rendre(r); else if (!fini) { fini = true; resolve(Response.error()); } }));
    setTimeout(() => viaCache().then(rendre), 3000);
  })));
});
