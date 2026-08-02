/* Booth service worker.
   The whole point: once this page has been loaded on the booth device even one
   time, it keeps working with the venue wifi down. Cache-first for everything,
   because every asset is versioned by hand and none of it changes at runtime.

   Bump CACHE when you swap the avatar or any voice line, or the booth will keep
   serving the old media from cache. */
var CACHE = "vicron-booth-v1";

var ASSETS = [
  "./",
  "./index.html",
  "./handout.html",
  "./assets/avatar.mp4",
  "./assets/avatar-poster.jpg",
  "./assets/q-industry.mp3",
  "./assets/q-bottleneck.mp3",
  "./assets/r-leads.mp3",
  "./assets/r-followup.mp3",
  "./assets/r-scheduling.mp3",
  "./assets/r-admin.mp3",
  "./assets/r-reviews.mp3",
  "./assets/r-retention.mp3"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      // addAll is all-or-nothing; cache individually so one bad path can't
      // leave the booth with no offline copy at all.
      .then(function (c) {
        return Promise.all(ASSETS.map(function (url) {
          return c.add(url).catch(function () { /* skip what isn't there */ });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        // stash same-origin successes so a first-visit miss is still cached
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
