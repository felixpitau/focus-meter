chrome.alarms.onAlarm.addListener(function(alarm) {
  chrome.storage.sync.get(function (items) {
    if (alarm.name == 'onwork') {
      chrome.notifications.create({
        type:     'basic',
        iconUrl:  'icon-128.png',
        title:    'Time to start focusing!',
        message:  'Press start focus',
        priority: 0
      });
      chrome.storage.sync.set({
        onWork: true
      });
    } else if (alarm.name == 'offwork') {
      if (items.onFocus) {
        chrome.notifications.create({
          type:     'basic',
          iconUrl:  'icon-128.png',
          title:    'Your set work time is over!',
          message:  'You can keep focusing if you\'d like',
          priority: 0
        });
      } else if (items.onBreak) {
        chrome.notifications.create({
          type:     'basic',
          iconUrl:  'icon-128.png',
          title:    'Your set work time is over!',
          message:  'Your break has been ended.',
          priority: 0
        });
        chrome.storage.sync.set({
          onBreak: false
        });
      } else {
        chrome.notifications.create({
          type:     'basic',
          iconUrl:  'icon-128.png',
          title:    'Your set work time is over!',
          message:  'This means no more blocking, for now.',
          priority: 0
        });
      }

      chrome.storage.sync.set({
        onWork: false
      });
    } else if (alarm.name == 'offfocus') {
      if (items.overtime) {
        chrome.notifications.create({
          type:     'basic',
          iconUrl:  'icon-128.png',
          title:    items.minFocus + ' minutes have passed for your focus time!',
          message:  'You can keep going if you\'d like, or you can start a break.',
          priority: 0
        });
      } else {
        chrome.notifications.create({
          type:     'basic',
          iconUrl:  'icon-128.png',
          title:    items.minFocus + ' minutes focus time have passed.',
          message:  'Maybe it\'s time for a break?',
          priority: 0
        });
        var difference = new Date(Date.now()).getTime() - new Date(items.timeStart).getTime();
        var reward = (difference / 60000) / items.ratio;
        chrome.storage.sync.set({
          tokens: items.tokens + reward,
          onFocus: false
        });
      }
    } else if (alarm.name == 'offbreak') {
      chrome.notifications.create({
        type:     'basic',
        iconUrl:  'icon-128.png',
        title:    'Break time is over!',
        message:  '',
        priority: 0
      });
      var difference = new Date(Date.now()).getTime() - new Date(items.timeStart).getTime();
      var debit = difference / 60000;
      chrome.storage.sync.set({
        tokens: items.tokens - debit,
        onBreak: false
      });
    }
  });
});

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason == 'install') {
    chrome.runtime.openOptionsPage();
  }
});

chrome.notifications.onButtonClicked.addListener(function() {
  // todo: implement.
});
