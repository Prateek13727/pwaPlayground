importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = "static-v11";
var CACHE_DYNAMIC_NAME = "dynamic-v1";
var STATIC_FILES = [
  "/", 
  "/index.html", 
  "/offline.html",
  '/src/js/idb.js', 
  "/src/js/app.js", 
  "/src/js/feed.js",
  "/src/js/material.min.js", 
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
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

const endpoint = 'https://us-central1-pwagram-fb9d3.cloudfunctions.net/storePostsData';
// const url = 'https://pwagram-fb9d3.firebaseio.com/posts.json'
self.addEventListener('sync', function(event){
  if (event.tag === "sync-new-posts") {
    console.log('[Service Worker] Background Syncing ....');
    event.waitUntil(
      readAllData('sync-posts')
      .then(function(data){
        for (dt of data) {
          const { id, location, title } = dt;
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              id,
              title,
              location,
              image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-fb9d3.appspot.com/o/sf-boat.jpg?alt=media&token=120d28e6-a5f9-4b01-b725-7ca703a7afe5'
            })
          })
          .then(function(response){
            if(response.ok) {
              response.json()
                .then(function(res){
                  deleteItemFromDB('sync-posts', res.id);
                })
            }
          }) 
          .catch(function(err){
            console.log(err);
          })
        }
      })
    )
  }
})

self.addEventListener('notificationclick', function(event){
  const { notification, action } = event;
  if (action === "confirm") {
    notification.close();
  } else {
    clients.matchAll()
      .then(function(clt){
        var client = clt.find(function(c){
          return c.visibilityState === 'visible';
        })
        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          client.openWindow(notification.data.url);
        }
      })    
    notification.close();
  }
});

self.addEventListener('notificationclose', function(event){
  const { notification } = event;
  console.log("notification was closed")
  console.log(notification);
});

self.addEventListener('push', function(event) {
  console.log('push notification received', event);
  var data = { title: 'New', content: 'dummy', openUrl: '/'};
  if(event.data){
    data = JSON.parse(event.data.text());
  }
  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl,
    }
  }
  event.waitUntil(
    //we access registration here because we have to get to the service worker even if browser is closed
    self.registration.showNotification(data.title, options)
  );
});

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


