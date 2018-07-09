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