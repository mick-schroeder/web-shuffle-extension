var default_options = {}

ready(() => {
	set_webingest_options()
	read_options()
	getId('save').onclick = save_options
	getId('cancel').onclick = () => window.close()
	init()
})

function set_webingest_options() {
	// Set default options
	if (!localStorage['pdcheck']) {
		localStorage['pdcheck'] = 'true';
	}
	if (!localStorage['pdurl']) {
		localStorage['pdurl'] = "https://webshuffle.mickschroeder.com/redirect";
	}
	if (!localStorage['asurl']) {
		localStorage['asurl'] = "https://webshuffle.mickschroeder.com/redirect";
	}
	if (!localStorage['randomTime']) {
		localStorage['randomTime'] = 'true';
	}
	if (!localStorage['preferNewTab']) {
		localStorage['preferNewTab'] = 'true';
	}
	if (!localStorage['mySitesList']) {
		localStorage['mySitesList'] = JSON.stringify(['https://mail.google.com','https://weather.gov']);
	}
}

// Option to save current value to localstorage
function save_options() {
	if (getId('default_time').value < 0) {
		getId('default_time').value = 0;
	}

	localStorage['default_time'] = getId('default_time').value;
	localStorage['autostart'] = getId('autostart').checked;
	localStorage['asurl'] = getId('asurl').value;
	//localStorage['pdcheck'] = getId('pdcheck').checked
	//localStorage['pdurl'] = getId('pdurl').value;
	localStorage['timercheck'] = getId('timercheck').checked;
	localStorage.default_pattern = getId('defaultPattern').value;

	// new values
	localStorage['randomTime'] = getId('randomTime').checked;
	localStorage['preferNewTab'] = getId('preferNewTab').checked;
	localStorage['mySites'] = getId('mySites').checked;
	localStorage['mySitesChance'] = getId('mySitesChance').value;
	// save mySitesList
	saveUrlsAndIntervals();

	if (getId('timer01').checked) {
		localStorage['timermode'] = '1';
	} else {
		localStorage['timermode'] = '2';
	}

	localStorage['pmonitor'] = getId('pmonitor').checked

	if (getId('pagemr01').checked) {
		localStorage['pmpattern'] = 'A';
	} else {
		localStorage['pmpattern'] = 'B';
	}

	if (getId('pmsound01').checked) {
		localStorage['sound'] = '1';
	} else if (getId('pmsound02').checked) {
		localStorage['sound'] = '2';
	} else if (getId('pmsound03').checked) {
		localStorage['sound'] = '3';
	} else if (getId('pmsound04').checked) {
		localStorage['sound'] = '4';
	}

	localStorage['soundurl'] = getId('soundurl').value;
	localStorage['soundvolume'] = getId('soundvolume').value;

	// notification closing
	if (getId('pm_sound_til_click').checked) {
		localStorage['pm_sound_til'] = 'click';
	} else if (getId('pm_sound_til_sound').checked) {
		localStorage['pm_sound_til'] = 'sound';
	} else if (getId('pm_sound_til_timeout').checked) {
		localStorage['pm_sound_til'] = 'timeout';
	}

	localStorage['pm_sound_timeout'] = getId('pm_sound_timeout').value;


	localStorage.support = !(getId('dontsupport').checked);

	show_save_animation();
}

function read_options() {
	if (localStorage['default_time']) {
		getId('default_time').value = localStorage['default_time'];
	}

	getId('randomTime').checked = (localStorage['randomTime'] == 'true');
	getId('autostart').checked = (localStorage['autostart'] == 'true');
	getId('pdcheck').checked = (localStorage['pdcheck'] == 'true');
	getId('pmonitor').checked = (localStorage['pmonitor'] == 'true');
	getId('timercheck').checked = (localStorage['timercheck'] == 'true');

	getId('preferNewTab').checked = (localStorage['preferNewTab'] == 'true');
	getId('mySites').checked = (localStorage['mySites'] == 'true');
	getId('mySitesChance').value = localStorage['mySitesChance'] || '20';
	// formySitesList
	
	if (localStorage['mySitesList']) {
		urlsLoad = JSON.parse(localStorage['mySitesList']);
		var urlsString = '';
		for (var i = 0; i < urlsLoad.length; i++) {
		  urlsString += urlsLoad[i] + "\n";
		}
		getId("mySitesList").value = urlsString;
	}
	getId('asurl').value = localStorage['asurl'] || '';
	// timer
	if (localStorage['timermode']) {
		if (localStorage['timermode'] == '1') {
			getId('timer01').checked = true;
		} else if (localStorage['timermode'] == '2') {
			getId('timer02').checked = true;
		}
	} else {
		getId('timer01').checked = true;
	}
	if (localStorage['pmpattern'] && localStorage['pmpattern'] == 'B') {
		getId('pagemr02').checked = true;
	} else {
		getId('pagemr01').checked = true;
	}


	if (localStorage.default_pattern) {
		// set deafult pattern 
		getId('defaultPattern').value = localStorage.default_pattern;
	}



	// sound
	if (localStorage['sound'] && localStorage['sound'] == '2') {
		getId('pmsound02').checked = true;
	} else if (localStorage['sound'] && localStorage['sound'] == '3') {
		getId('pmsound03').checked = true;
	} else if (localStorage['sound'] && localStorage['sound'] == '4') {
		getId('pmsound04').checked = true;
	} else {
		getId('pmsound01').checked = true;
	}
	getId('soundvolume').value = localStorage['soundvolume'];

	getId('pdurl').value = localStorage['pdurl'] || '';
	getId('soundurl').value = localStorage['soundurl'] || '';


	// notification closing
	if (!localStorage['pm_sound_til']) {
		localStorage['pm_sound_til'] = 'click';
	}
	getId('pm_sound_til_' + localStorage['pm_sound_til']).checked = true;
	getId('pm_sound_timeout').value = localStorage['pm_sound_timeout'] || 5;

	getId('dontsupport').checked = (localStorage.support == 'false');
}


function show_save_animation() {
	alert('Settings was saved.');
}

var sound = new Audio();
var is_sound_playing = false;
var volume_change_timer;
var volume_fadeout_timer;

function play_sound() {
	clearInterval(volume_fadeout_timer);
	if (getId('pmsound02').checked)
		var sound_file = './sound/sound1.mp3';
	else if (getId('pmsound03').checked)
		var sound_file = './sound/sound2.mp3';
	else if (getId('pmsound04').checked)
		var sound_file = getId('soundurl').value;

	if (sound_file) {
		sound.volume = getId('soundvolume').value;
		sound.src = sound_file;
		sound.play();
	}
}

function pause_sound() {
	sound.pause();
}

function pause_sound_with_fadeout(sound) {
	var volume = sound.volume;
	volume_fadeout_timer = setInterval(function () {
		if (volume > 0) {
			volume -= 0.05;
			sound.volume = Math.max(volume, 0);
		} else {
			clearInterval(volume_fadeout_timer);
			sound.pause();
		}
	}, 16)
}

function validURL(myURL) {
	var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
	'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
	'((\\d{1,3}\\.){3}\\d{1,3}))'+ // ip (v4) address
	'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ //port
	'(\\?[;&amp;a-z\\d%_.~+=-]*)?'+ // query string
	'(\\#[-a-z\\d_]*)?$','i');
	return pattern.test(myURL);
 }
// Save My Sites
// Adopted from function by Cami Blanch
// https://github.com/camiblanch/Tabulus-Rotatum/blob/master/src/options.js

function saveUrlsAndIntervals() {
	var line = document.getElementById('mySitesList').value.split('\n');
	var urlsArray = [];
	var badLine = [];

	for (var i = 0; i < line.length; i++) {
		if (line[i] != "") {
			var urlAndIndex = line[i];
			if (urlAndIndex == "") {
				badLine.push(i);
				console.log("Bad or Empty data.\nLine " + i + " ignored.");
			} else if (!validURL(urlAndIndex)) {
				badLine.push(i);
				console.log("Not Valid URL.\nLine " + i + " ignored.");
			} else {
				urlsArray.push(urlAndIndex);
			}
		}
	}

	for (i = badLine.length - 1; i >= 0; i--) {
		line.splice(badLine[i], 1);
	}

	var urlsAndInterals = "";

	for (i = 0; i < line.length; i++) {
		urlsAndInterals = urlsAndInterals + line[i] + "\n";
	}

	getId('mySitesList').value = urlsAndInterals;
	localStorage['mySitesList'] = JSON.stringify(urlsArray);
}


function init() {
	getId('test-play').onclick = play_sound;
	var soundoptions = document.getElementsByClassName('pmsound');
	[].forEach.call(soundoptions, function (soundoption) {
		soundoption.onclick = play_sound;
	});

	getId('soundvolume').onchange = function () {
		sound.volume = this.value;
		if (sound.paused)
			play_sound();
		clearTimeout(volume_change_timer);
		volume_change_timer = setTimeout(function () {
			pause_sound_with_fadeout(sound);
		}, 2000)
	}

	// getId('incognito').onclick = function () {
	// 	chrome.tabs.create({
	// 		url: getId('incognito').href,
	// 		active: true
	// 	})
	// }
}