//randomly select an excercise
var exerciseList = ['jumping_jacks','wall_sit','push_ups','crunches',
	'squats','plank','high_knees_run_in_place','lunges'];
var exerciseListNiceNames = ['Jumping Jacks','Wall Sit','Push-Ups','Crunches',
	'Squats','Plank','High knees running in place','Lunges'];
	
//load name and gif
var exerciseNumber = Math.floor(Math.random()*exerciseList.length);
var nameExercise = exerciseList[exerciseNumber];
var niceNameExercise = exerciseListNiceNames[exerciseNumber];

//get the original html and change it to add the popup layer
var originalHTML = document.body.innerHTML;
var newHtml = originalHTML + "<div id='popupFIT'><p>"+niceNameExercise+"</p><p id='timerFIT'>.</p><p><img id='exerciseImg' alt='imageExercise' /></p></div> <div id='overlayFIT'></div>";
document.body.innerHTML = newHtml;

//set image
self.port.emit('getGifAddress',nameExercise+'.gif');
self.port.on('returnGifAddress', function(arg) { setGifExercise(arg); } );
function setGifExercise(arg) {
	document.getElementById("exerciseImg").src=arg;
}


//set the popup and overlay style
var overlay = document.getElementById('overlayFIT');
var popup = document.getElementById('popupFIT');
overlay.style = 'display:block;    position:fixed;  left:0px;        top:0px;         width:100%;      height:100%;     background:#000; opacity:0.98;     z-index:99999;';
popup.style='display:block; width:50%; position:fixed; height:350px; top:5%; margin-right: 25%; margin-left:25%; text-align: center; background:#FFFFFF;  border:2px solid #000; z-index:100000; padding: 20px';


//launch the counter
var counter;
counter = setInterval(timerFunc, 1000);
self.port.on('setTimer', function(arg){ setTimeLeft(arg) });
self.port.on('detach',function(){ clearInterval(counter); });


var timeLeft;
function setTimeLeft(arg) {
	timeLeft = arg;
}
function timerFunc() {
	//at each count, remove one second
    timeLeft=timeLeft-1;
    document.getElementById('timerFIT').innerHTML=timeLeft;
    //when time is up, clear the interval and close the popup
    if (timeLeft <=0) {
    	clearInterval(counter);
        closePopup();
    }
}

//set a port.on to close the popup
function closePopup(){
        //var overlay = document.getElementById("overlayFIT");
        //var popup = document.getElementById("popupFIT");
        //overlay.style.display = "none";
        //popup.style.display = "none";
        document.body.innerHTML = originalHTML;
        //send message to destroy worker
        self.port.emit('finishedExercise');
}
self.port.on('stopExercise',function(){ closePopup(); });
