/* Booth service worker.
   The whole point: once this page has been loaded on the booth device even one
   time, it keeps working with the venue wifi down. Cache-first for everything,
   because every asset is versioned by hand and none of it changes at runtime.

   Bump CACHE when you swap the avatar or any voice line, or the booth will keep
   serving the old media from cache. */
var CACHE = "vicron-booth-v3";

var ASSETS = [
  "./booth.html",
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

  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // Never touch the lead endpoint or the public landing page. Those must always
  // hit the network: one is an API, the other is the page prospects see and the
  // one most likely to be edited.
  if (url.pathname.indexOf("/api/") === 0) return;
  if (url.pathname === "/" || url.pathname === "/index.html") return;

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;                     // booth asset, already precached
      return fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request);        // offline and not cached: nothing to give
      });
    })
  );
});
