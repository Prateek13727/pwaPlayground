const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const admin = require('firebase-admin');
const webPush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwagram-fb9d3.firebaseio.com"
});

exports.storePostsData = functions.https.onRequest(function(request, response){
	cors(request, response, function(){
		admin.database().ref('posts').push({
			id: request.body.id,
			title: request.body.title,
			location: request.body.location,
			image: request.body.image
		})
		.then(function(){
			webPush.setVapidDetails('mailto: pratmbic@gmail.com',
			'BP8JxkKi3OHDUod2PG_DVbW57AzFGzr35RzJ2YPLrRQFbHpshpU4wcna-FycrK_iLHSWxwh-Ek2GhPDghKy29rs',
			'ObY0gVKPWXDdpZliB3CutwczpXou945CanBAAukjV3M'
			);
			return admin.database().ref('subscriptions').once('value');
		})
		.then(function(subscriptions){
			subscriptions.forEach(function(sub){
				var pushConfig = {
					endpoint: sub.val().endpoint,
					keys:{
						auth:sub.val().keys.auth,
						p256dh: sub.val().keys.p256dh
					}
				}
				webPush.sendNotification(pushConfig, JSON.stringify({ title: 'New Post', content: 'New post added', openUrl: '/help'}))
					.catch(function(err){
						console.log(err);
					})
			})
			response.status(201).json({message: 'Data Stored', id: request.body.id})
		})
		.catch(function(err){
			respose.status(500).json({error: err})
		})
	})
});
