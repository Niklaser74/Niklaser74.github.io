// Root service worker for snails.se: a kill-switch, not a cache.
//
// Until September 2026 Snäckmageddon lived at the root and registered a
// service worker with scope "/" (cache-first, caches named snackmageddon-*).
// That worker is still installed in returning visitors' browsers and would
// keep serving the old game shell for "/" — this file installs over it, throws
// away the game's old caches, sends every open tab to the game's new home and
// unregisters itself. The hub has no service worker of its own.
//
// Keep this file for months: it only helps once per browser, but that browser
// may not come back for a long time. Cache names are per game (snailmageddon-*
// for the game's own worker at /snailmageddon/), so only snackmageddon-* go.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith('snackmageddon-')).map((k) => caches.delete(k)));
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const c of clients) {
    const u = new URL(c.url);
    // a tab under "/" is the old game shell: send it to the game; a tab already
    // under the game gets a plain reload so the game's own worker takes over
    const target = u.pathname.startsWith('/snailmageddon/') ? c.url : '/snailmageddon/' + u.pathname.slice(1) + u.search + u.hash;
    try { await c.navigate(target); } catch { /* not ours to steer */ }
  }
  await self.registration.unregister();
})()));
