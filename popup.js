var timer;

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

function setTimer(timeEnd) {
  var elTimer = document.getElementById('timer');
  if (timeEnd == null) {
    clearInterval(timer);
    elTimer.innerHTML = '';
  } else {
    timer = setInterval(function() {
      var t = timeRemaining(timeEnd);
      elTimer.innerHTML = t.minutes + 'm ' + t.seconds + 's';
      if (t.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }
}

function timeRemaining(timeEnd) {
  var t = Math.abs(timeEnd - Date.now());
  var seconds = Math.floor((t/1000) % 60);
  var minutes = Math.floor((t/1000/60) % 60);
  return {minutes: minutes, seconds: seconds, total: t};
}

function parseTime(time) {
  var matchData = time.match(/([0-9]{1,2}|(pm|p)$)/gi);
  var timeData = {
    hours: 0,
    minutes: 0
  };
  if (Number(matchData[0]) != NaN && Number(matchData[0]) < 24) {
    if (Number(matchData[0]) < 12 && time.match(/(pm|p)/gi)) {
      timeData.hours = Number(matchData[0]) + 12;
    } else {
      timeData.hours = Number(matchData[0]);
    }
  }
  if (Number(matchData[1]) != NaN && Number(matchData[1]) < 60) {
    timeData.minutes = Number(matchData[1]);
  }
  return timeData;
}

function updateIndicator(items) {
  chrome.storage.sync.get((items) => {
    var elBreak = document.getElementById('break');
    var elFocus = document.getElementById('focus');
    document.getElementById('tokens').innerHTML = 'Tokens: ' + Math.floor(items.tokens);
    document.getElementById('indicator-focus').setAttribute('class','');
    document.getElementById('indicator-break').setAttribute('class','');
    document.getElementById('indicator-work').setAttribute('class','');
    document.getElementById('indicator-free').setAttribute('class','');
    if (items.onFocus) {
      chrome.browserAction.setBadgeText({text: 'focus'});
      document.getElementById('indicator-focus').setAttribute('class','active');
      setTimer(items.timeEnd);
      elBreak.setAttribute('class', '');
      elFocus.setAttribute('class', 'active');
    } else if (items.onBreak) {
      chrome.browserAction.setBadgeText({text: 'break'});
      document.getElementById('indicator-break').setAttribute('class','active');
      setTimer(items.timeEnd);
      elBreak.setAttribute('class', 'active');
      elFocus.setAttribute('class', '');
    } else if (items.onWork) {
      chrome.browserAction.setBadgeText({text: ''});
      document.getElementById('indicator-work').setAttribute('class','active');
      setTimer();
      elBreak.setAttribute('class', '');
      elFocus.setAttribute('class', '');
      var elNotification = document.getElementById('notification');
      elNotification.innerHTML = 'Focus to earn tokens!';
      setTimeout(function() {
        elNotification.innerHTML = '';
      }, 3000);
    } else {
      chrome.browserAction.setBadgeText({text: ''});
      document.getElementById('indicator-free').setAttribute('class','active');
      setTimer();
      elBreak.setAttribute('class', '');
      elFocus.setAttribute('class', '');
    }
  });
}

function onContentLoad() {
  document.getElementById('focus').addEventListener('click', onClickFocus);
  document.getElementById('break').addEventListener('click', onClickBreak);
  document.getElementById('options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  chrome.storage.sync.get(function (items) {
    var workStart = parseTime(items.workStart);
    var workEnd = parseTime(items.workEnd);
    var milWorkStart = new Date(Date.now()).setHours(workStart.hours, workStart.minutes, 0);
    var milWorkEnd = new Date(Date.now()).setHours(workEnd.hours, workEnd.minutes, 0);
    var milNow = new Date(Date.now()).getTime();
    if (milWorkStart < milWorkEnd) {
      if (milNow > milWorkStart && milNow < milWorkEnd) {
        workTrue(milNow, milWorkEnd);
      } else {
        workFalse(milNow, milWorkStart);
      }
    } else {
      if (milNow < milWorkStart || milNow > milWorkEnd) {
        workTrue(milNow, milWorkEnd);
      } else {
        workFalse(milNow, milWorkStart);
      }
    }
    updateIndicator();
  });
}

function workTrue(milNow, milWorkEnd) {
  chrome.storage.sync.set({
    onWork: true
  });
  chrome.alarms.clear('onwork');
  chrome.alarms.clear('offwork');
  if (milNow < milWorkEnd) {
    chrome.alarms.create('offwork', {when: milWorkEnd});
  }
}

function workFalse(milNow, milWorkStart) {
  chrome.storage.sync.set({
    onWork: false
  });
  chrome.alarms.clear('onwork');
  chrome.alarms.clear('offwork');
  if (milNow < milWorkStart) {
    chrome.alarms.create('onwork', {when: milWorkStart});
  }
}

function startFocus(items) {
  if (items.onBreak) {
    endBreak(items);
  }
  chrome.storage.sync.set({
    onFocus: true,
    timeStart: Date.now(),
    timeEnd: Date.now() + (Number(items.minFocus)*1000*60)
  });
  chrome.alarms.create('offfocus', {delayInMinutes: Number(items.minFocus)});
}

function endFocus(items) {
  var difference = Date.now() - items.timeStart;
  var reward = (difference / 60000) / items.ratio;
  chrome.storage.sync.set({
    tokens: items.tokens + reward,
    onFocus: false
  });
  chrome.alarms.clear('offfocus');
}

function startBreak(items) {
  if (items.tokens >= (items.minFocus / items.ratio)) {
    if (items.onFocus) {
      endFocus(items);
    }
    var delay = Number(items.maxBreak < items.tokens ? items.maxBreak : items.tokens);
    chrome.storage.sync.set({
      onBreak: true,
      timeStart: Date.now(),
      timeEnd: Date.now() + (delay*1000*60)
    });
    chrome.alarms.create('offbreak', {delayInMinutes: delay});
  } else {
    var elNotification = document.getElementById('notification');
    elNotification.innerHTML = 'Not enough tokens!';
    setTimeout(function() {
      elNotification.innerHTML = '';
    }, 3000);
  }
}

function endBreak(items) {
  var difference = Date.now() - items.timeStart;
  var debit = difference / 60000;
  chrome.storage.sync.set({
    tokens: items.tokens - debit,
    onBreak: false
  });
  chrome.alarms.clear('offbreak');
}

function onClickFocus() {
  chrome.storage.sync.get(function (items) {
    if (items.onFocus) {
      endFocus(items);
    } else {
      startFocus(items);
    }
  });
}

function onClickBreak() {
  chrome.storage.sync.get(function (items) {
    if (items.onBreak) {
      endBreak(items);
    } else {
      startBreak(items);
    }
  });
}

if (document.readyState === 'complete') {
  onContentLoad();
} else {
  document.addEventListener('DOMContentLoaded', onContentLoad);
}

chrome.storage.onChanged.addListener(() => {
  updateIndicator();
});
