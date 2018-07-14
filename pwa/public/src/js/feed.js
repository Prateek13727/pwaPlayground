var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title')
var locationInput = document.querySelector('#location')

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

function openCreatePostModal() {
  // createPostArea.style.display = 'block';
  createPostArea.style.transform = 'translateY(0)';
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);
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
}

function OnSaveButtonClicked(event) {
  console.log("clicked")
  if ('caches' in window) {
    caches.open('user-requested')
      .then(function(cache) {
        cache.add('https://httpbin.org/get')
        cache.add('/src/images/sf-boat.jpg')
      })
  }
}

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
  console.log(location)
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
  const arr = [];
  for (key in data) {
    arr.push(data[key])
  }
  return arr;
}

function updateUI(data) {
  clearCards();
  const arr = convertToArray(data);
  for(i=0; i<arr.length; i++) {
    createCard(arr[i]);
  }
}

// const url = 'https://httpbin.org/get';
const url = 'https://pwagram-fb9d3.firebaseio.com/posts.json'
var networkReqReceived = false;

//network
fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    updateUI(data);
    console.log("fromNetwork")
    networkReqReceived = false;
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
        updateUI(data);
        console.log("fromCache");
      }
    })
}

const endpoint = "https://us-central1-pwagram-fb9d3.cloudfunctions.net/storePostsData";
// const url = "https://pwagram-fb9d3.firebaseio.com/posts.json";
function sendData() {
  fetch(endpoint,{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-fb9d3.appspot.com/o/sf-boat.jpg?alt=media&token=120d28e6-a5f9-4b01-b725-7ca703a7afe5'
    })
  })
  .then(function(response){
    console.log("response", response)
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
          location: locationInput.value
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
            console.log(err);
          })
      });
  } else {
    sendData();
  }

  closeCreatePostModal();
})



