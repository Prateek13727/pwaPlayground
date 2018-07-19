var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureBtn = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader') 
var fetchedLocation;

// function unregisterServiceWorker() {
//   if('serviceWorker' in navigator) {
//     navigator.serviceWorker.getRegistrations
//       .then(function(registrations){
//         for(i=0; i < registrations; i++) {
//             registrations[i].unregister()
//         }
//       })
//   }
// }

function intilializeGeolocation() {
  if(!('geolocation' in navigator)) {
    locationBtn.style.display = "none";
    locationLoader.style.display = "none";
    return;
  }
}

locationBtn.addEventListener('click', function() {
  locationBtn.style.display = "none";
  locationLoader.style.display = "block";
  if(('geolocation' in navigator)) {
    navigator.geolocation.getCurrentPosition((position) => {
      fetchedLocation = { 
        lat: position.coords.latitude,
        long: position.coords.longitude
      }
      locationInput.value = "In Bangalore";
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      console.log("[Feed.js] Current-location", fetchedLocation);
    }, function(err){
      console.log(err);
    }, {
      timeout: 5000
    })
  }
})

function intilializeMedia() {
 if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {}
 }

 // adding polyfills
 if(!('getUserMedia' in navigator.mediaDevices)) {
  navigator.mediaDevices.getUserMedia = function(constraints) {
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if(!getUserMedia) {
      return Promise.reject("getUserMedia is not supported")
    }
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigation, constraints, resolve, reject);
    })
  } 
 }

 navigator.mediaDevices.getUserMedia({video: true})
  .then(function(stream){
    videoPlayer.style.display ='block';
    videoPlayer.srcObject = stream;
  })
  .catch(function(err) {
    imagePickerArea.style.display ='block';
  })

}

captureBtn.addEventListener('click', function(event){
  canvasElement.style.display ='block';
  videoPlayer.style.display ='none';
  captureBtn.style.display ='none';
  var context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach(function(track){
    track.stop()
  })
  picture = dataURItoBlob(canvasElement.toDataURL());
})

imagePicker.addEventListener('change', function(event){
  picture = event.target.files[0];
})

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  intilializeMedia();
  intilializeGeolocation();
  createPostArea.style.transform = 'translateY(0)';
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });
    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  // createPostArea.style.display = 'none';
   createPostArea.style.transform = 'translateY(100vh)';
   videoPlayer.style.display ='none';
   canvasElement.style.display = 'none';
   imagePickerArea.display = 'none';
}

// function OnSaveButtonClicked(event) {
//   if ('caches' in window) {
//     caches.open('user-requested')
//       .then(function(cache) {
//         cache.add('https://httpbin.org/get')
//         cache.add('/src/images/sf-boat.jpg')
//       })
//   }
// }

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function createCard(data) {
  const { image, location, title } = data;
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = "Save";
  // cardSaveButton.addEventListener("click", OnSaveButtonClicked)
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}


function convertToArray(data) {
  var arr = [];
  for (key in data) {
    arr.push(data[key])
  }
  return arr;
}

function updateUI(data) {
  clearCards();
  var arr = convertToArray(data);
  for(i=0; i<arr.length; i++) {
    createCard(arr[i]);
  }
}

// var url = 'https://httpbin.org/get';
var url = 'https://pwagram-fb9d3.firebaseio.com/posts.json'
var networkReqReceived = false;

//network
fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log("[feed.js] Fetched from network");
    updateUI(data);
    networkReqReceived = true;
  });

// // from cache
// if ('caches' in window) {
//   caches.match(url)
//    .then(function(response) {
//      if(response){
//         response.json()   
//      }
//     })
//     .then(function(data){
//       if(!networkReqReceived) {
//         updateUI(data);
//         console.log("fromCache")
//      }
//     })
// }

//from indexedDB
if('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if(!networkReqReceived) {
        console.log("[feed.js] Fetched from cache");
        updateUI(data);
      }
    })
}

var endpoint = "https://us-central1-pwagram-fb9d3.cloudfunctions.net/storePostsData";
// var url = "https://pwagram-fb9d3.firebaseio.com/posts.json";
function sendData() {
  var id = new Date().toISOString();
  var formData = new FormData();
  formData.append('id', id);
  formData.append('title', titleInput.value);
  formData.append('location', locationInput.value);
  formData.append('file', picture, id + '.png');
  formData.append('locationLat', fetchedLocation.lat);
  formData.append('locationLong', fetchedLocation.long);
  
  fetch(endpoint, {
    method: 'POST',
    body: formData
  })
  .then(function(response){
    console.log("[Feed.js] Response from server", response)
  })
}

document.addEventListener('submit', function(event){
  event.preventDefault();
  if(titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert('Please enter valid data')
    return;
  }

  if('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw){
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: picture,
          locationCoords: {
            lat: fetchedLocation.lat,
            long: fetchedLocation.long
          }
        }
        //store post in index DB
        writeData('sync-posts', post)
          .then(function(){
            return sw.sync.register('sync-new-posts');    
          })
          .then(function(){
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your Post was saved for syncing!'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err){
            console.log("[Feed.js] Error while writing to indexedDB", err);
          })
      });
  } else {
    sendData();
  }
  closeCreatePostModal();
})



