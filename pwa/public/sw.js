var CACHE_STATIC_NAME = "static-v15";
var CACHE_DYNAMIC_NAME = "dynamic-v1";
var STATIC_FILES = [
  "/", 
  "/index.html", 
  "/offline.html", 
  "/src/js/app.js", 
  "/src/js/feed.js",
  "/src/js/material.min.js", 
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg"
]

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
     .then(function(cache) {
      console.log("[Service Worker] pre-caching app shell")
      // think of these as requests not files
      cache.addAll(STATIC_FILES);
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
  const url = 'https://httpbin.org/get';
  //cache then network  
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
    caches.open(CACHE_DYNAMIC_NAME)
      .then(function(cache) {
        return fetch(event.request)
          .then(function(response) {
            cache.put(event.request.url, response.clone())
            return response
          })
      })
    )  
  } else if(new RegExp('\\b' + STATIC_FILES.join('\\b|\\b') + '\\b').test(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
    )
  } else {
    //cache with network fallback
    event.respondWith(
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
              return caches.open(CACHE_STATIC_NAME)
               .then(function(cache) {
                  if (event.request.url.indexOf('/help'){
                    //returning offline page for help is a good strategy but not for other pages like css. 
                    return cache.match('/offline.html')
                  })
               })
            })
        }
      })
    )
  }
})


// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if(response) {
//           return response
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//               .then(function(cache) {
//                 cache.put(event.request.url, res.clone())
//                 return res
//               })
//             })
//             .catch(function(error) {
//               return caches.open(CACHE_STATIC_NAME)
//                .then(function(cache) {
//                   return cache.match('/offline.html')
//                })
//             })
//         }
//       })
//   )
// })


