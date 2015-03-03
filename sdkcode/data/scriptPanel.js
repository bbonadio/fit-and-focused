document.getElementById("addPageToPrefs").addEventListener("click", addToList);
document.getElementById("goToPrefs").addEventListener("click", goToPrefs);

function goToPrefs() {
	self.port.emit('goToPreferences');
}

function addToList() {
	self.port.emit('addCurrentUrlToList');
}

self.port.on('successfullyAdded', function(arg){
	var originalHtml = JSON.parse(JSON.stringify(document.getElementById("addWebsiteSection").innerHTML));
	document.getElementById("addWebsiteSection").innerHTML = 'Successfully added ' + arg;
	//put back original html
	setTimeout(function() {  
		document.getElementById("addWebsiteSection").innerHTML=originalHtml;
		}, 2000);

	} );
self.port.on('alreadyInList', function(arg){
	var originalHtml = JSON.parse(JSON.stringify(document.getElementById("addWebsiteSection").innerHTML));
	document.getElementById("addWebsiteSection").innerHTML = arg + ' already in the list';
	//put back original html
	setTimeout(function() {  
		document.getElementById("addWebsiteSection").innerHTML=originalHtml; 
		}, 2000);
	} );

