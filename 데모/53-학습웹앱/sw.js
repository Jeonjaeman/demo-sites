/* AHA! 문법 — 최소 서비스워커 (PWA 설치 요건용, 네트워크 우선) */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  e.respondWith(fetch(e.request).catch(function () { return caches.match(e.request); }));
});
