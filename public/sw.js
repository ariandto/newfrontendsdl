// public/sw.js
// -------------------------------------------------------------
//  PWA Service Worker – cache-first untuk App Shell
//  Push Notification handler TELAH DIHAPUS
// -------------------------------------------------------------

const CACHE_NAME = "pwa-cache-v1";
const APP_SHELL  = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

/* Instal: simpan App Shell di cache */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* Activate: bersihkan cache lama */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: cache-first untuk permintaan GET asal domain sendiri */
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return; // biarkan request non-GET atau cross-origin lewat jaringan
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          // simpan respons baru ke cache
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
    )
  );
});
