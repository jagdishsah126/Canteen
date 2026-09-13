/* Canteen Tracker service worker — cache-first app shell */
var CACHE_NAME = "canteen-tracker-v3";

var APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./store.js",
  "./billing.js",
  "./backup.js",
  "./nepaliDate.js",
  "./vendor-ndc.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") {
    return;
  }

  var url = new URL(request.url);

  // App shell + same-origin assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) {
          return cached;
        }
        return fetch(request).then(function (response) {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
          return response;
        }).catch(function () {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return caches.match(request);
        });
      })
    );
    return;
  }

  // Optional: cache Google Fonts after first successful fetch
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then(function (response) {
            if (response && response.status === 200) {
              var copy = response.clone();
              caches.open(CACHE_NAME).then(function (cache) {
                cache.put(request, copy);
              });
            }
            return response;
          })
          .catch(function () {
            return Response.error();
          });
      })
    );
  }
});
