var parent = chrome.contextMenus.create({
  title: "BetBot | Твой персональный помощник"
});

chrome.contextMenus.create({
  id: "csgopositive",
  title: "Внедриться в csgopositive",
  parentId: parent
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId == "csgopositive") {
    chrome.tabs.executeScript({
      file: "/js/jQuery.js"
    });
    chrome.tabs.executeScript({
      file: "/js/csgopositive-hud.js"
    });
  }
});
