/* tutorial:
https://www.freecodecamp.org/news/build-a-pwa-from-scratch-with-html-css-and-javascript/
*/

// name of the cache
const staticDevGeoLoc = "dev-map-v1";
const assets = [
  "/",
  "/index.html",
  "/index.css",
  "/mapGps.js",
  "/WesternEurope.png"
];

// self is the service worker, and we cache the assets in the browser
self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticDevGeoLoc).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request);
    })
  );
});
