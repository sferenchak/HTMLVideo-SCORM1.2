const body = document.querySelector('body');
body.onload = () => doStart(false);
body.onbeforeunload = () => doUnload(false);
body.onunload = () => doUnload();

var media = document.querySelector('video');
var controls = document.querySelector('.controls');

var play = document.querySelector('.play');
var stop = document.querySelector('.stop');
var rwd = document.querySelector('.rwd');
var fwd = document.querySelector('.fwd');

var timerWrapper = document.querySelector('.timer');
var timer = document.querySelector('.timer .currentTime');
var duration = document.querySelector('.timer .duration');
var timerBar = document.querySelector('.timer div');
var furthestTimeMarker = document.querySelector(
	'.timer div.furthest-time-marker'
);

media.removeAttribute('controls');
controls.style.visibility = 'visible';

var furthestTimeWatched = null;

play.addEventListener('click', playPauseMedia);
stop.addEventListener('click', stopMedia);
media.addEventListener('ended', stopMedia);
rwd.addEventListener('click', mediaBackward);
media.addEventListener('timeupdate', setTime);
media.addEventListener('loadedmetadata', () => {
	let mediaDuration = parseTime(media.duration);
	duration.textContent = mediaDuration;
});

function playPauseMedia() {
	if (media.paused) {
		play.setAttribute('data-icon', 'u');
		media.play();
	} else {
		play.setAttribute('data-icon', 'P');
		media.pause();
	}
}

function stopMedia() {
	media.pause();
	media.currentTime = 0;
	play.setAttribute('data-icon', 'P');

	clearControls();
}

function clearControls() {
	rwd.classList.remove('active');
	fwd.classList.remove('active');
	clearInterval(intervalRwd);
	clearInterval(intervalFwd);
}

var intervalFwd;
var intervalRwd;

function mediaBackward() {
	clearInterval(intervalFwd);
	fwd.classList.remove('active');

	if (rwd.classList.contains('active')) {
		rwd.classList.remove('active');
		clearInterval(intervalRwd);
		media.play();
	} else {
		rwd.classList.add('active');
		media.pause();
		intervalRwd = setInterval(windBackward, 200);
	}
}

function mediaForward() {
	clearInterval(intervalRwd);
	rwd.classList.remove('active');

	if (fwd.classList.contains('active')) {
		fwd.classList.remove('active');
		clearInterval(intervalFwd);
		media.play();
	} else {
		fwd.classList.add('active');
		media.pause();
		intervalFwd = setInterval(windForward, 200);
	}
}

function windBackward() {
	if (media.currentTime <= 3) {
		rwd.classList.remove('active');
		clearInterval(intervalRwd);
		stopMedia();
	} else {
		media.currentTime -= 3;
	}
}

function windForward() {
	if (media.currentTime >= furthestTimeWatched - 3) {
		fwd.classList.remove('active');
		clearInterval(intervalFwd);
		disableFwd();
		media.pause();
		playPauseMedia();
		return;
	}
	if (media.currentTime >= media.duration - 3) {
		fwd.classList.remove('active');
		clearInterval(intervalFwd);
		stopMedia();
	} else {
		media.currentTime += 3;
	}
}

function disableFwd() {
	// apply styling
	fwd.classList.add('disabled');
	fwd.removeEventListener('click', mediaForward);
}

function enableFwd() {
	fwd.classList.remove('disabled');
	fwd.addEventListener('click', mediaForward);
}

function setTime() {
	let mediaTime = parseTime(media.currentTime);

	// update the furthest time watched to handle seeking logic to prevent just seeking to end
	if (!media.seeking && media.currentTime > furthestTimeWatched) {
		furthestTimeWatched = media.currentTime;
	}

	// enable fwd button if not seeking and currentTime less than furthestWatchedTime
	if (Math.floor(media.currentTime) < Math.floor(furthestTimeWatched)) {
		enableFwd();
	}

	// calculate the percent of video viewed
	let percentComplete = Math.floor(
		(furthestTimeWatched / media.duration) * 100
	);

	// This course is considered complete when the user has viewed 95% of the video
	if (percentComplete >= 95) {
		furthestTimeMarker.style.backgroundColor = 'green';
		reachedEnd = true;
		ScormProcessSetValue('cmi.core.lesson_status', 'completed');
	}

	//save the current location as the bookmark
	ScormProcessSetValue('cmi.core.lesson_location', furthestTimeWatched);

	timer.textContent = mediaTime;

	var barLength =
		timerWrapper.clientWidth * (media.currentTime / media.duration);
	timerBar.style.width = barLength + 'px';
	var furthestTimeWatchedMarker =
		timerWrapper.clientWidth * (furthestTimeWatched / media.duration);
	furthestTimeMarker.style.left = furthestTimeWatchedMarker + 'px';
}

function parseTime(mediaTimeInput) {
	var hours = Math.floor(mediaTimeInput / 60 / 60);
	var minutes = Math.floor(mediaTimeInput / 60);
	var seconds = Math.floor(mediaTimeInput - minutes * 60);
	var hourValue;
	var minuteValue;
	var secondValue;

	if (hours < 10) {
		hourValue = '0' + hours;
	} else {
		hourValue = hours;
	}
	if (minutes < 10) {
		minuteValue = '0' + minutes;
	} else {
		minuteValue = minutes;
	}

	if (seconds < 10) {
		secondValue = '0' + seconds;
	} else {
		secondValue = seconds;
	}
	return `${hourValue}:${minuteValue}:${secondValue}`;
}

// SCORM Tracking
var startTimeStamp = null;
var processedUnload = false;
var reachedEnd = false;

function doStart() {
	//record the time that the learner started the SCO so that we can report the total time
	startTimeStamp = new Date();

	//initialize communication with the LMS
	ScormProcessInitialize();

	//it's a best practice to set the lesson status to incomplete when
	//first launching the course (if the course is not already completed)
	var completionStatus = ScormProcessGetValue('cmi.core.lesson_status');
	if (completionStatus == 'not attempted') {
		ScormProcessSetValue('cmi.core.lesson_status', 'incomplete');
	}

	//see if the user stored a bookmark previously (don't check for errors
	//because cmi.core.lesson_location may not be initialized
	var bookmark = ScormProcessGetValue('cmi.core.lesson_location');

	//if there isn't a stored bookmark, start the user at the beginning
	if (bookmark == '') {
		media.currentTime = 0;
	} else {
		//if there is a stored bookmark, prompt the user to resume from the previous location
		if (
			confirm('Would you like to resume from where you previously left off?')
		) {
			media.currentTime = parseInt(bookmark, 10);
		} else {
			media.currentTime = 0;
		}
	}
}

function doUnload(pressedExit) {
	//don't call this function twice
	if (processedUnload == true) {
		return;
	}

	processedUnload = true;

	//record the session time
	var endTimeStamp = new Date();
	var totalMilliseconds = endTimeStamp.getTime() - startTimeStamp.getTime();
	var scormTime = ConvertMilliSecondsToSCORMTime(totalMilliseconds, false);

	ScormProcessSetValue('cmi.core.session_time', scormTime);

	//if the user just closes the browser, we will default to saving
	//their progress data. If the user presses exit, he is prompted.
	//If the user reached the end, the exit normall to submit results.
	if (pressedExit == false && reachedEnd == false) {
		ScormProcessSetValue('cmi.core.exit', 'suspend');
	}

	ScormProcessFinish();
}

function doExit() {
	//note use of short-circuit AND. If the user reached the end, don't prompt.
	//just exit normally and submit the results.
	if (
		reachedEnd == false &&
		confirm('Would you like to save your progress to resume later?')
	) {
		//set exit to suspend
		ScormProcessSetValue('cmi.core.exit', 'suspend');
	} else {
		//set exit to normal
		ScormProcessSetValue('cmi.core.exit', '');
	}

	//process the unload handler to close out the session.
	//the presense of an adl.nav.request will cause the LMS to
	//take the content away from the user.
	doUnload(true);
}

//SCORM requires time to be formatted in a specific way
function ConvertMilliSecondsToSCORMTime(
	intTotalMilliseconds,
	blnIncludeFraction
) {
	var intHours;
	var intintMinutes;
	var intSeconds;
	var intMilliseconds;
	var intHundredths;
	var strCMITimeSpan;

	if (blnIncludeFraction == null || blnIncludeFraction == undefined) {
		blnIncludeFraction = true;
	}

	//extract time parts
	intMilliseconds = intTotalMilliseconds % 1000;

	intSeconds = ((intTotalMilliseconds - intMilliseconds) / 1000) % 60;

	intMinutes =
		((intTotalMilliseconds - intMilliseconds - intSeconds * 1000) / 60000) % 60;

	intHours =
		(intTotalMilliseconds -
			intMilliseconds -
			intSeconds * 1000 -
			intMinutes * 60000) /
		3600000;

	/*
    deal with exceptional case when content used a huge amount of time and interpreted CMITimstamp 
    to allow a number of intMinutes and seconds greater than 60 i.e. 9999:99:99.99 instead of 9999:60:60:99
    note - this case is permissable under SCORM, but will be exceptionally rare
    */

	if (intHours == 10000) {
		intHours = 9999;

		intMinutes = (intTotalMilliseconds - intHours * 3600000) / 60000;
		if (intMinutes == 100) {
			intMinutes = 99;
		}
		intMinutes = Math.floor(intMinutes);

		intSeconds =
			(intTotalMilliseconds - intHours * 3600000 - intMinutes * 60000) / 1000;
		if (intSeconds == 100) {
			intSeconds = 99;
		}
		intSeconds = Math.floor(intSeconds);

		intMilliseconds =
			intTotalMilliseconds -
			intHours * 3600000 -
			intMinutes * 60000 -
			intSeconds * 1000;
	}

	//drop the extra precision from the milliseconds
	intHundredths = Math.floor(intMilliseconds / 10);

	//put in padding 0's and concatinate to get the proper format
	strCMITimeSpan =
		ZeroPad(intHours, 4) +
		':' +
		ZeroPad(intMinutes, 2) +
		':' +
		ZeroPad(intSeconds, 2);

	if (blnIncludeFraction) {
		strCMITimeSpan += '.' + intHundredths;
	}

	//check for case where total milliseconds is greater than max supported by strCMITimeSpan
	if (intHours > 9999) {
		strCMITimeSpan = '9999:99:99';

		if (blnIncludeFraction) {
			strCMITimeSpan += '.99';
		}
	}

	return strCMITimeSpan;
}

function ZeroPad(intNum, intNumDigits) {
	var strTemp;
	var intLen;
	var i;

	strTemp = new String(intNum);
	intLen = strTemp.length;

	if (intLen > intNumDigits) {
		strTemp = strTemp.substr(0, intNumDigits);
	} else {
		for (i = intLen; i < intNumDigits; i++) {
			strTemp = '0' + strTemp;
		}
	}

	return strTemp;
}
