const { Tray, Menu, nativeImage, app } = require('electron').remote;
const Store = require('./store.js');
const spawn = require('child_process').spawn;

const contextMenu = Menu.buildFromTemplate([
  {label: 'New', click: openWindow},
  {label: 'Exit', role: 'quit'}
]);

appIcon = new Tray(nativeImage.createFromDataURL('data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='));
appIcon.setTitle('Timer');
appIcon.setContextMenu(contextMenu);

function openWindow() {
  app.show();
  app.focus();
}

const store = new Store({
  configName: 'user-preferences',
  defaults: { last_timer_minutes: 8, last_timer_seconds: 0 }
});

const minutesElem = document.getElementById('input_minutes');
const secondsElem = document.getElementById('input_seconds');

const previousMinutes = store.get('last_timer_minutes');
let previousSeconds = store.get('last_timer_seconds');
if (previousMinutes !== undefined) {
  minutesElem.value = previousMinutes;
}
if (previousSeconds !== undefined) {
  if (previousSeconds < 10) {
    previousSeconds = '0' + previousSeconds.toString();
  }
  secondsElem.value = previousSeconds;
}

let totalSeconds = 0;
let child = null;

minutesElem.focus();
minutesElem.select();

document.getElementById('timer').addEventListener('submit', function(e) {
  e.preventDefault();
  app.hide();
  const inputMinutes = + minutesElem.value;
  const inputSeconds = + secondsElem.value;
  totalSeconds = (60 * inputMinutes) + inputSeconds;
  decrement();

  minutesElem.value = '';
  secondsElem.value = '';
  store.set('last_timer_minutes', inputMinutes);
  store.set('last_timer_seconds', inputSeconds);
});

function decrement() {
  if (child) {
    child.kill();
  }

  child = spawn('bash', [__dirname + '/timer.sh', 1]);

  child.stdout.on('data', (data) => {
    if (totalSeconds > 1) {
      totalSeconds--;
      const minutes = Math.floor(totalSeconds/60);
      let seconds = totalSeconds % 60;
      if (seconds < 10) {
        seconds = '0' + seconds.toString();
      }
      const title = minutes + ':' + seconds;
      appIcon.setTitle(title);
      minutesElem.setAttribute('placeholder', minutes);
      secondsElem.setAttribute('placeholder', seconds);
    } else {
      child.kill();
      const notif = new Notification('Timer done!', {
        body: 'Click to exit'
      });
      notif.addEventListener('click', function() {
        app.quit();
      });
      appIcon.setTitle('Timer done');
    }
  });
};
