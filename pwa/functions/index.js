const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const admin = require('firebase-admin');

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
			response.status(201).json({message: 'Data Stored', id: request.body.id})
		})
		.catch(function(err){
			respose.status(500).json({error: err})
		})
	})
});
