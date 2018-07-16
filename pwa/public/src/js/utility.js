//indexed DB intialization
var dbPromise = idb.open('post-store', 1 , function(db){
  if(!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id'});
  }
  if(!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', {keyPath: 'id'});
  }
});

function writeData(storeName, data) {
	return dbPromise
	    .then(function(db){
	        const tx = db.transaction(storeName, 'readwrite');
	        const store = tx.objectStore(storeName);
	        store.put(data);
	        return tx.complete;
	    })
}

function readAllData(storeName) {
	return dbPromise
		.then(function(db){
			const tx = db.transaction(storeName, 'readonly');
			const store = tx.objectStore(storeName);
			return store.getAll()
		})
}

function clearAllData(storeName) {
	return dbPromise
		.then(function(db){
			const tx = db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName)
			store.clear();
			return tx.complete;
		})
}

function deleteItemFromDB(storeName, id) {
	return dbPromise
		.then(function(db){
			const tx = db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName)
			store.delete(id);
			return tx.complete;
		})
		.then(function() {
			console.log("item-deleted")
		})
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  ;
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}


