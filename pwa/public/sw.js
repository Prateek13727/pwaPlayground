importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = "static-v1";
var CACHE_DYNAMIC_NAME = "dynamic-v1";
var STATIC_FILES = [
  "/", 
  "/index.html", 
  "/offline.html",
  '/src/js/idb.js', 
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

function trimCache(cacheName, maxItems) {
  caches.open("dynamic-v1")
   .then((cache) => {
     cache.keys()
       .then((keys) => {
          if(keys.length > maxItems) {
            cache.delete(keys[0])
             .then(function(){
                trimCache(CACHE_DYNAMIC_NAME, 3)
             })
          }
      })
  })
}

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

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
  const url = 'https://pwagram-fb9d3.firebaseio.com/posts.json';
  //cache then network  
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          const clonedResponse = response.clone();
          clearAllData('posts')
            .then(function(){
              return clonedResponse.json()
            })
            .then(function(data){
              for(key in data) {
                writeData('posts', data[key])
              }
          })
          return response;
        })
    )  
  } else if(isInArray(STATIC_FILES, event.request.url)) {
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
                // trimCache(CACHE_DYNAMIC_NAME, 3)
                cache.put(event.request.url, res.clone())
                return res
              })
            })
            .catch(function(error) {
              return caches.open(CACHE_STATIC_NAME)
               .then(function(cache) {
                  if (event.request.headers.get('accept').includes('text/html')){
                    //returning offline page for help is a good strategy but not for other pages like css. 
                    return cache.match('/offline.html')
                  }
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


