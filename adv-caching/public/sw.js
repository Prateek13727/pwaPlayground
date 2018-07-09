
var CACHE_STATIC_NAME = 'static-v3';
var CACHE_DYNAMIC_NAME = 'dynamic-v1';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/src/css/app.css',
  '/src/css/main.css',
  '/src/js/main.js',
  '/src/js/material.min.js',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache) {
        cache.addAll(STATIC_FILES);
      })
  )
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME) {
            return caches.delete(key);
          }
        }));
      })
  );
});

// //network-only strategy
// self.addEventListener('fetch', function(event) {
//   console.log(event)
//   event.respondWith(
//     fetch(event.request)
//   )
// });

// //cache-only startegy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// //network fallback to cache strategy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(response){
//         return caches.open(CACHE_DYNAMIC_NAME)
//           .then(function(cache) {
//             cache.put(event.request.url, response.clone());
//             return response;
//           });
//       })
//       .catch(function() {
//         return caches.match(event.request)
//       })
//   );
// });


// //cache fallback to network strategy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 });
//             })
//             .catch(function(err) {

//             });
//         }
//       })
//   );
// });


// //dynamic caching for cache with network strategy
// self.addEventListener('fetch', function(event) {
//     event.respondWith(
//     fetch(event.request)
//       .then(function(response){
//         return caches.open(CACHE_DYNAMIC_NAME)
//           .then(function(cache) {
//             cache.put(event.request.url, response.clone());
//             return response;
//           });
//       })
//     );  
// }

function isInArray(array, string) {
  for(i=0; i<array.length; i++) {
    if(array[i] === string) {
      return true;
    }
  }
  return false;
}

self.addEventListener('fetch', function(event) {
  const url = 'https://httpbin.org/ip';
  //cache then network with dynamic caching
  if (event.request.url.indexOf(url) > -1) {
    console.log("cache then network")
    event.respondWith(
    fetch(event.request)
      .then(function(response){
        return caches.open(CACHE_DYNAMIC_NAME)
          .then(function(cache) {
            cache.put(event.request.url, response.clone());
            return response;
          });
      })
      .catch(function() {
        
      })
    );  
  //cache only
  } else if (isInArray(STATIC_FILES, event.request.url)) {
    console.log("hereinCacheOnly")
    event.respondWith(
      caches.match(event.request)
    )
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response
          } else {
            return fetch(event.request)
              .then(function(res){
                caches.open(CACHE_DYNAMIC_NAME)
                 .then(function(cache) {
                    cache.put(event.request.url, res.clone())
                    return res;
                 })
              }) 
          }
        })
    );  
  }  
});
