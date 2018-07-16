var enableNotifactionsButtons = document.querySelectorAll('.enable-notifications');

//polyfill support
if (!window.Promise) {
	window.Promise = Promise;
}

var deferredPrompt;

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js')
	.then(function(){
		console.log("service worker registered")
	});
}

self.addEventListener('beforeinstallprompt', function(event) {
	console.log("beforeinstallprompt fired")
	event.preventDefault();
	deferredPrompt = event;
})

function displayConfirmNotification(){
	if( 'serviceWorker' in navigator) {
		var options = {
			body: 'you successfully subscribed to our notification system',
			icon: '/src/images/icons/app-icon-96x96.png',
			image: '/src/images/sf-boat.jpg',
			dir: 'ltr',
			lang: 'en-US', //BCP 47,
			// vibrate: [100 50 200],
			badge: '/src/images/icons/app-icon-96x96.png',
			tag:'confirm-notification',
			renotify: 'true',
			actions: [
				{
					action: 'confirm', title: 'Okay', icon:'/src/images/icons/app-icon-96x96.png'
				},
				{
					action: 'cancel', title: 'Cancel', icon:'/src/images/icons/app-icon-96x96.png'
				}
			]
		}
		navigator.serviceWorker.ready
			.then(function(swreg){
				swreg.showNotification('Successfully subscribed', options);
			})
	}
}

function configurePushSubscription() {
	if (!'serviceWorker' in navigator) {
		return;
	}
	var reg;
	navigator.serviceWorker.ready
		.then(function(swreg){
			reg = swreg;
			return swreg.pushManager.getSubscription();
		})
		.then(function(sub){
			if(sub === null){
				const vapidPublicKey = "BP8JxkKi3OHDUod2PG_DVbW57AzFGzr35RzJ2YPLrRQFbHpshpU4wcna-FycrK_iLHSWxwh-Ek2GhPDghKy29rs";
				const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
				return reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: convertedVapidKey,
				});
			} else {

			}
		})
		.then(function(newSub){
			//valid for current service worker only.In case we unregister and install a new service
			//worker we have to clear the database too and create a new subscription
			return fetch('https://pwagram-fb9d3.firebaseio.com/subscriptions.json',{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(newSub)
			})
		})
		.then(function(res){
			if(res.ok) {
				displayConfirmNotification();	
			}
		})
}

function askForNotificationPermission(){
	Notification.requestPermission(function(result){
		console.log('User Choice', result);
		if(result !== 'granted') {
			console.log("blocked")
		} else {
			configurePushSubscription();
			// displayConfirmNotification();
		}
	});
}

if('Notification' in window && 'serviceWorker' in navigator) {
	for(i=0; i<enableNotifactionsButtons.length; i++) {
		enableNotifactionsButtons[i].style.display = 'inline-block';
		enableNotifactionsButtons[i].addEventListener('click', askForNotificationPermission)
	}
}