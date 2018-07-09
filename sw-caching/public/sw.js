var CACHE_STATIC_NAME = "static-V1";
var CACHE_DYNAMIC_NAME = "dynamic";

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
     .then(function(cache) {
      console.log("[Service Worker] pre-caching app shell")
      // think of these as requests not files
      cache.addAll([
        "/", 
        "/index.html", 
        "/src/js/main.js", 
        "/src/js/material.min.js", 
        "/src/css/app.css",
        "/src/css/dynamic.css",
        "/src/css/main.css",
        "https://fonts.googleapis.com/css?family=Roboto:400,700",
        "https://fonts.googleapis.com/icon?family=Material+Icons",
        "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
      ]);
    })
  )
})

self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating Service Worker ...', event);
    event.waitUntil(
      caches.keys()
        .then(function(keylist){
          return Promise.all(keylist.map(function(key){
            if(key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
              return caches.delete(key)
            }
          }))
         })
    )
    return self.clients.claim();
})

self.addEventListener('fetch', function(event) {
  return event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if(response) {
          return response
        } else {
          return fetch(event.request)
            .then(function(res) {
              return caches.open(CACHE_DYNAMIC_NAME)
              .then(function(cache) {
                cache.put(event.request.url, res.clone())
                return res
              })
            })
            .catch(function(error) {

            })
        }
      })
  )
})
