
var timeSessionSaved;
var timeUnlockSaved;
var websitesListSaved;

function setTimeSessionSaved(arg){
	timeSessionSaved = arg;
	document.getElementById('timeSession').innerHTML=timeSessionSaved;
	document.getElementById('inputTimeSession').value=timeSessionSaved;
}

function setTimeUnlockSaved(arg1){
	timeUnlockSaved = arg1;
	document.getElementById('timeUnlock').innerHTML=timeUnlockSaved;
	document.getElementById('inputTimeUnlock').value=timeUnlockSaved;
}
function setWebsitesListSavedd(arg2){
	websitesListSaved = arg2;
	var selectForm = document.getElementById('selectWebsitesListID');

	//add newest list
	for (var i=0; i<websitesListSaved.length; i++) {
		var option = document.createElement("option");
		option.text = websitesListSaved[i];
		selectForm.add(option);
	}
	selectForm.size = Math.min(websitesListSaved.length,10);
}

self.port.on('timeSessionSaved', function(arg){ setTimeSessionSaved(arg) });
self.port.on('timeUnlockSaved', function(arg1){ setTimeUnlockSaved(arg1) });
self.port.on('websitesListSaved', function(arg2){ setWebsitesListSavedd(arg2) });

document.getElementById("removeFromPrefs").addEventListener("click", removeFromPrefs);
function removeFromPrefs() {
	var selectForm = document.getElementById('selectWebsitesListID');
	var toBeRemoved = [];
	for (var x=0; x<selectForm.length;x++) {
		if (selectForm[x].selected)
		{
			//remove from list
			removeWebsite(selectForm.options[x].value);
			self.port.emit('consoleIt','removing '+selectForm[x].value);
			//remove from select
			selectForm.remove(x);	
		}
	}
}

function removeWebsite(arg) {
	self.port.emit('removeWebsiteFromPref',arg);
}

document.getElementById("inputTimeSessionButton").addEventListener("click", function() {
		var newTimeSession = document.getElementById("inputTimeSession").value;
		self.port.emit("changeTimeSessionSaved",newTimeSession);
		setTimeSessionSaved(newTimeSession);
	});
	
document.getElementById("inputTimeUnlockButton").addEventListener("click", function() {
		var newTimeUnlock = document.getElementById("inputTimeUnlock").value;
		self.port.emit("changeTimeUnlockSaved",newTimeUnlock);
		setTimeUnlockSaved(newTimeUnlock);
	});

document.getElementById("inputNewWebsiteButton").addEventListener("click", function() {
		var newWebsite = document.getElementById("inputNewWebsite").value;
		self.port.emit("addNewWebsite",newWebsite);
	});
document.getElementById("addTolistFromList").addEventListener("click", function() {
		var selectFormSuggestedWebsites = document.getElementById('suggestedWebsitesListID');
		var selectFormCurrentList = document.getElementById('selectWebsitesListID');
		for (var x=0; x<selectFormSuggestedWebsites.length;x++) {
			if (selectFormSuggestedWebsites[x].selected)
			{
				//add to list
				self.port.emit("addNewWebsite",selectFormSuggestedWebsites.options[x].value);
				self.port.emit("sendWebsitesListSaved");
			}
		}
	});


//when website was successfully added, add it to the list
self.port.on('successfullyAdded', function(arg) {
	var selectForm = document.getElementById('selectWebsitesListID');
	var option = document.createElement("option");
	option.text = arg;
	selectForm.add(option);
});