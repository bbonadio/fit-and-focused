var buttons = require('sdk/ui/button/action');
var panels = require("sdk/panel");
var tabs = require("sdk/tabs");
var ss = require("sdk/simple-storage");
var pageMod = require("sdk/page-mod");
var self = require("sdk/self");
var sdk_urls = require("sdk/url");
var { setTimeout } = require("sdk/timers");
var simplePrefs = require('sdk/simple-prefs');
var notifications = require("sdk/notifications");


exports.main = function (options, callbacks) {
    if (options.loadReason === 'install') {
        tabs.open(self.data.url("justInstalled.html"));
    }
};

///
/// should run this code at startup
  //check is websiteList was saved, if not create with default
  if (typeof ss.storage.websitesListSaved == 'undefined' ) {
  	ss.storage.websitesListSaved  = ['www.facebook.com', 'twitter.com', 'buzzfeed.com', '9gag.com'];
  }
  //same for timeSession
  if (typeof ss.storage.timeSessionSaved == 'undefined' ) {
  	ss.storage.timeSessionSaved=10;
  }
  //same for timeUnlock
  if (typeof ss.storage.timeUnlockSaved == 'undefined' ) {
  	ss.storage.timeUnlockSaved=0.2;
  }
////
////

simplePrefs.on("changePreferences", function() {
    tabs.open(self.data.url("preferences.html"));
});

var websitesList = JSON.parse(JSON.stringify(ss.storage.websitesListSaved));
var tabsUnderWatch = [];

var button = buttons.ActionButton({
  id: "addon-button",
  label: "Addon preferences",
  icon: {
    "16": "./logo-16.ico",
    "32": "./logo-32.ico",
    "64": "./logo-32.ico"
  },
  onClick: handleChange
});

var panel = panels.Panel({
  contentURL: self.data.url("panel.html"),
  contentScriptFile: self.data.url("scriptPanel.js"),
  onHide: handleHide
});


panel.port.on('goToPreferences', function() { 
	tabs.open(self.data.url("preferences.html")); 
	});
	
panel.port.on('addCurrentUrlToList', function() {
	hostUrl = sdk_urls.URL(tabs.activeTab.url).host;
	//check if the website is not already in the list
	if (ss.storage.websitesListSaved.indexOf(hostUrl) == -1) {
		if (hostUrl) {
			websitesList.push(hostUrl);
			ss.storage.websitesListSaved.push(hostUrl);
			//send message of succes
			panel.port.emit('successfullyAdded',hostUrl);
			tabReady(tabs.activeTab);
		}
	}
	else {
		panel.port.emit('alreadyInList',hostUrl);
	}
	
});

function handleHide() {
  button.state('window', {checked: false});
}

function handleChange(state) {
	panel.show({
		position: button
    });
}

tabs.on("ready", tabReady); 

function tabActivated(tab) {
	//if the tab was put under watch (after workout was completed and tab was left)
	// if it is activated again we launch an exercise session if the page is still on
	if (tabsUnderWatch.indexOf(tab.id) > -1) {
		for (var i=0; i<websitesList.length; i++) {
			if (tab.url.indexOf(websitesList[i]) > -1) {
				console.log(websitesList[i]);
				sendExerciseToUrl(websitesList[i],tab);
			}
		}
  	}
}

function tabReady(tab) {
  console.log(tab.url + 'ready');
  var urlVisit=tab.url;  
  for (var i=0; i<websitesList.length; i++) {
      if (urlVisit.indexOf(websitesList[i]) > -1) {
  		console.log(websitesList[i]);
  		sendExerciseToUrl(websitesList[i], tab);
  	}
  }
  if (urlVisit == self.data.url("preferences.html"))
  {
	  var prefScript = tabs.activeTab.attach({
	  		contentScriptFile: self.data.url("changePreferences.js")
	  });
	  //send pref variables
	  prefScript.port.emit('timeSessionSaved',ss.storage.timeSessionSaved);
	  prefScript.port.emit('websitesListSaved',ss.storage.websitesListSaved);
	  prefScript.port.emit('timeUnlockSaved',ss.storage.timeUnlockSaved);
	  //be ready to change pref variables
	  prefScript.port.on('changeTimeSessionSaved',function(arg){ ss.storage.timeSessionSaved = arg; } );
	  prefScript.port.on('changeTimeUnlockSaved',function(arg){ ss.storage.timeUnlockSaved = arg;} );
	  
	  prefScript.port.on('removeWebsiteFromPref',function(arg){ 
	  		console.log(arg);
	  		var ind = ss.storage.websitesListSaved.indexOf(arg);
	  		if (ind > -1) {
	  			ss.storage.websitesListSaved.splice(ind,1);
	  			var ind2 = websitesList.indexOf(arg);
	  			if (ind2 > -1) {
	  				websitesList.splice(ind2,1);
	  			} 
	  			else {
	  			//if the website was in the stored preferences but not in the current websites list, it has been visited a bit ago
	  			//so we set a timeout to remove it later
	  				setTimeout(function() { 
	  					var ind3 = websitesList.indexOf(arg); 
	  					if(ind3 > -1) { websitesList.splice(ind3,1); }
	  				}, ss.storage.timeUnlockSaved*60*1000);
	  			}
	  		}
	  } );
	  prefScript.port.on('consoleIt',function(arg) { console.log(arg); });
  }

}

function tabClosedBecauseUnfinishedWorkout(d) {
	notifications.notify({
	  text: d + " was closed because the workout wasn't completed",
	  iconURL: "./logo-32.ico"
	});
}

function sendExerciseToUrl(dom, myTab) {
	if (myTab.url.indexOf(dom) > -1) {
		//get the tab id
	 	var tabID = myTab.id;
		//launch the script
	 	var exerciseScript = myTab.attach({
	 		contentScriptFile: self.data.url("scriptExercise.js")
	 	});
	 	//send the time of the session
	 	exerciseScript.port.emit('setTimer',ss.storage.timeSessionSaved);
	 	exerciseScript.port.on('consoleIt',function(bla){console.log(bla);});
	 	exerciseScript.port.on('getGifAddress', function(arg){
	 		exerciseScript.port.emit('returnGifAddress',self.data.url(arg)) 
	 		});
	 	//listen for the oppening of a tab. If so, it means the exercise wasn't followed until the end
	 	//so we close the tab 
	 	function myTabWasDectivated(t) {
	 		console.log('tab was activated: ' + t.url);
	 		myTab.removeListener("deactivate",myTabWasDectivated);
	 		console.log('listener deactivate was removed in tabWasActivated');
	 		myTab.removeListener("ready",newPageReady);
	 		console.log('listener newPageReady was removed in tabWasActivated');
	 		exerciseScript.destroy();
	 		console.log('script was destroyed in tabWasActivated');
	 		myTab.close(tabClosedBecauseUnfinishedWorkout(dom));
	 		console.log('in for loop '+myTab.url+' just closed');

	 	}
	 	myTab.on("deactivate", myTabWasDectivated);
	 	
	 	//listen for a ready event. If it's the activeTab, then the user changed website and we can destroy the script
	 	function newPageReady(t) {
	 		if (t == myTab && t.url.indexOf(dom) == -1 ) {
		 		myTab.removeListener("ready",newPageReady);
		 		console.log('listener was removed in newPageReady');
		 		exerciseScript.destroy();
		 		console.log('script was destroyed in newPageReady');
		 		myTab.removeListener("deactivate",myTabWasDectivated);
		 		console.log('listener deactivate was removed in newPageReady');
	 		}
	 	}
	 	myTab.on("ready", newPageReady); 
	 	
	 		
	 	//delete website from list and be ready to add it later when time is elapsed
	 	function whenScriptFinishes() { 
	 		//remove the tab listeners
	 		myTab.removeListener("deactivate",myTabWasDectivated);
	 		console.log("listener deactivated removed in whenscriptfinishes");
	 		myTab.removeListener("ready",newPageReady);
	 		console.log("listener ready removed in whenscriptfinishes");
	 		//destroy the worker
	 		exerciseScript.destroy();
	 		console.log('script was destroyed in whenscriptfinishes');
	 		//remove the website from the list 
	 		var storedWebsite = JSON.parse(JSON.stringify(dom));
	 		var i = websitesList.indexOf(dom)
	 		if (i > -1) { websitesList.splice(i, 1); }
	 		console.log(storedWebsite + ' removed from list');
	 		
	 		//set a listener, if the tab is deactivated, put it on the watch list
	 		function tabDeactivated(t) {
	 			if (t.id == tabID) {
	 				tabsUnderWatch.push(t.id);
	 				console.log('tab under watch: ' + t.url);
	 				//remove listener
	 				myTab.removeListener("deactivate",tabDeactivated);
	 			}
	 		}
	 		myTab.on("deactivate",tabDeactivated);	 		
	 		
	 		setTimeout(function() {
	 			console.log('in timeout function');
		 		if (websitesList.indexOf(storedWebsite) == -1) {
		 			console.log('in if websitesList.indexOf');
		 			websitesList.push(storedWebsite);
		 			console.log(storedWebsite + ' put back in list')
		 			//if the page is still open, send a new exercise
		 			if (tabs.activeTab.id == tabID ) {
		 				myTab.removeListener("deactivate",tabDeactivated);
		 				console.log("listener deactivate removed in the if");
		 				
		 				var ind4 = tabsUnderWatch.indexOf(tabs.activeTab.id);
		 				if (ind4 > -1) { tabsUnderWatch.splice(ind4,1); }
		 				
		 				console.log(dom + ' still open, sending new exercise')
		 				sendExerciseToUrl(dom,myTab);
		 			}
		 			else {
		 				//set a listener for when the tab is activated again
		 				myTab.on("activate",tabActivated);
		 				console.log('activate event listener on ' + myTab.url);
		 			}
		 		}
	 		}, ss.storage.timeUnlockSaved*60*1000);
	 	}
	 	exerciseScript.port.on('finishedExercise', whenScriptFinishes);
	}
}
  		