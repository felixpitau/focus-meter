var url;

Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
}

function blockPage() {
  console.log('Page blocked for focus time!')
  var blockContainer = document.createElement('div');
  blockContainer.setAttribute('class', 'focusmeter-block-container');
  blockContainer.setAttribute('id', 'focusmeter');
  var textContainer = document.createElement('div');
  textContainer.setAttribute('class', 'focusmeter-text');
  var textNode = document.createTextNode('Focus Meter has blocked this site');
  textContainer.appendChild(textNode);
  blockContainer.appendChild(textContainer);
  document.body.appendChild(blockContainer);
}

function checkToBlock() {
  url = window.location.href;
  chrome.storage.sync.get(['blacklist', 'onWork', 'onBreak', 'onFocus'], function(items) {
    if (items.onFocus || (!items.onBreak && items.onWork)) {
      var blacklist = items.blacklist.split('\n');
      for (var i = 0; i < blacklist.length; i++) {
        var black = blacklist[i];
        if (url.search(black) != -1 && black != "") {
          blockPage();
          break;
        }
      }
    } else {
      if (document.getElementById('focusmeter') != null) {
        document.getElementById('focusmeter').remove();
      }
    }
  });
}

if (document.readyState === 'complete') {
  checkToBlock();
} else {
  document.addEventListener('DOMContentLoaded', checkToBlock);
}
chrome.storage.onChanged.addListener(checkToBlock);
