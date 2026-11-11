// Önce ağ, olmazsa önbellek: geliştirirken eski dosyada takılmazsın, internetsiz de açılır.
const V = "antrenman-v12";
const FILES = ["./", "index.html", "style.css", "js/core.js", "js/profile.js", "js/templates.js", "js/nutrition.js", "js/safe.js", "js/about.js", "js/native.js", "js/flex.js", "js/warm.js", "js/own.js", "js/daycard.js", "js/timers.js", "js/visuals.js", "js/share.js", "js/calendar.js", "js/today.js", "js/track.js", "js/entry.js", "js/pool.js", "js/plan.js", "js/main.js", "exercise-data.js", "exercise-tags.js", "exercise-extra.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const same = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(fetch(e.request).then(r => { if (same && r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
