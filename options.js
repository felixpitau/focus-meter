function save_options() {
  var valRatio = document.getElementById('ratio').value;
  var valWorkStart = document.getElementById('work-start').value;
  var valWorkEnd = document.getElementById('work-end').value;
  var valMinFocus = document.getElementById('min-focus').value;
  var valMaxBreak = document.getElementById('max-break').value;
  var valOvertime = document.getElementById('overtime').checked;
  var valBlacklist = document.getElementById('blacklist').value;
  chrome.storage.sync.set({
    ratio: valRatio,
    workStart: valWorkStart,
    workEnd: valWorkEnd,
    minFocus: valMinFocus,
    maxBreak: valMaxBreak,
    overtime: valOvertime,
    blacklist: valBlacklist
  }, function() {
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    ratio: '5',
    workStart: '9:00 am',
    workEnd: '5:00 pm',
    minFocus: '25',
    maxBreak: '15',
    overtime: false,
    blacklist: '',

    onFocus: false,
    onBreak: false,
    onWork: false,
    tokens: 0,
    timeStart: Date.now(),
    timeEnd: Date.now()
  }, function(items) {
    document.getElementById('ratio').value = items.ratio;
    document.getElementById('work-start').value = items.workStart;
    document.getElementById('work-end').value = items.workEnd;
    document.getElementById('min-focus').value = items.minFocus;
    document.getElementById('max-break').value = items.maxBreak;
    document.getElementById('overtime').checked = items.overtime;
    document.getElementById('blacklist').value = items.blacklist;
    chrome.storage.sync.set(items);
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
