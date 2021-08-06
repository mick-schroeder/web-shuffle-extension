'use strict';

/**
 * Keep track of the WebShuffle tab
 */
var stumbleTabId = null;

/**
 * The focused window ID
 */
var windowId = null;

var totalUrls = 0; // to be counted on first run
var os = 'mac'; // mac", "win", "android", "cros", "linux"

/**
 * @typedef {Object} StumbleURL
 * @property {string} url
 * @property {string=} title
 * @property {string} listUrl The URL of the collection.
 * @property {string=} listTitle The title of the collection.
 */

/**
* @type {StumbleURL}
*/
var stumbleUrl;


var isPendingStumble = false;

chrome.runtime.getPlatformInfo(function (info) {
  os = info.os;
});


/**
 * Find a random URL and load it
 * 
 */
async function stumble() {

  stumbleUrl = {
    url: 'https://webshuffle.mickschroeder.com/redirect',
    title: 'Web Shuffle',
    listUrl: 'https://mickschroeder.com',
    listTitle: 'By Mick Schroeder'
  }

  await set('lastStumbleUrl', stumbleUrl);

  // Switch to exiting tab 
  if (stumbleTabId !== null) {
    try {
      chrome.tabs.update(stumbleTabId, {
        url: stumbleUrl.url,
        active: true
      }, function (tab) {
      })
    } catch (exception) {
      chrome.tabs.update({
        url: stumbleUrl.url,
      }, async function (tab) {
        await saveStumbleTabId(tab.id);
      })
    }
  }
  // or Open New tab
  else {
    chrome.tabs.create({
      url: stumbleUrl.url,
    }, async function (tab) {
      await saveStumbleTabId(tab.id);
    })
  }
}

var interval = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateIcon() {
/*
  
    chrome.browserAction.setIcon({
      imageData: imageData
    });
  

  await sleep(200);
  
  chrome.browserAction.setIcon({
    imageData: imageData
  });

  await sleep(400);
  chrome.browserAction.setIcon({
    imageData: null,
    path: "./images/icon_16.png"
  });

*/
}


/**
 * Get a value from storage.
 * @param {string} key Key
 * @param {any} defaultVal The default value
 */
const get = async (key, defaultVal) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ [key]: defaultVal }, result => {
      resolve(result[key]);
    });
  })
}

/**
* Set a value.
* @param {string} key Key
* @param {any} val Value
*/
const set = async (key, val) => {
  const item = { [key]: val };
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(item, () => {
      resolve();
    });
  })
}

const saveStumbleTabId = async tabId => {
  await set('stumbleTabId', tabId);
  stumbleTabId = tabId;
}

const getStumbleTabId = async () => {
  return await get('stumbleTabId', null);
}

const saveLastWindowId = async windowId => {
  await set('lastWindowId', windowId);
}

const getLastWindowId = async () => {
  return await get('lastWindowId', null);
}

function update() {
  chrome.storage.local.get(['visited', 'totalUrls', 'welcome_seen'], function (result) {

    if (result.welcome_seen === undefined || result.welcome_seen === false || result.welcome_seen === null) {
      chrome.tabs.executeScript({
        file: 'styles.css'
      }, function () {
        chrome.tabs.executeScript({
          file: 'content.js'
        }, function () {
          notifyTabWelcome();
        });
      });
    } else {
      const count = result.visited === undefined ? 0 : parseInt(result.visited)
      const incremented = count + 1;
      // Set new value
      chrome.storage.local.set({ 'visited': incremented, 'totalUrls': totalUrls }, function () {
        notifyTabStumble(incremented, totalUrls);
      });
    }
  });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // make sure the status is 'complete' and it's the right tab
  if (isPendingStumble && tabId === stumbleTabId && changeInfo.status === 'complete') {
    update();
    isPendingStumble = false;
  }
});

function notifyTabStumble(visited, totalUrls) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(stumbleTabId, { "message": "stumble", 'visited': visited, 'totalUrls': totalUrls, stumbleUrl });
  });
}

function notifyTabWelcome() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(stumbleTabId, { "message": "welcome", "os": os });
  });
}

// Load a page on click
chrome.browserAction.onClicked.addListener(
  async function (tab) {

    const currentWindowId = await getFocusedWindowId();
    // Get stumble tab Id
    const savedStumbleTabId = await getStumbleTabId();
    const tabs = await getBrowserTabs();
    const tabIds = tabs.map(t => t.id);

    // Reset if necessary
    if (windowId !== currentWindowId || !savedStumbleTabId || !tabIds.includes(savedStumbleTabId)) {
      windowId = currentWindowId;
      await saveLastWindowId(windowId);
      chrome.storage.local.remove(['stumbleTabId'], () => {
        stumbleTabId = null;
      })
    }

    isPendingStumble = true;
    stumble();
    animateIcon();
  }
);

// When a tab closes, if it's the Stumble tab, clear the id
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  if (tabId === stumbleTabId) {
    stumbleTabId = null;
  }
})

function clearCounter() {
  chrome.storage.local.remove(['visited'])
}

chrome.runtime.onInstalled.addListener(function () {
  // For development purposes only, uncomment when needed
   chrome.storage.local.remove(['visited', 'welcome_seen', 'totalUrls'])

  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
      id: "sax-show",
      title: 'Show pop-up',
      contexts: ["browser_action"]
    });
    chrome.contextMenus.create({
      id: "sax-feedback",
      title: 'Give feedback',
      contexts: ["browser_action"]
    });
  })
});

/**
 * Return the list of Chrome tabs
 * @returns {Promise<Array<chrome.tabs.Tab>>}
 */
const getBrowserTabs = async () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      resolve(tabs);
    });
  })
}

/**
 * Return the recently focused window id.
 * @returns {Promise<number>}
 */
const getFocusedWindowId = () => {
  return new Promise((resolve, reject) => {
    chrome.windows.getCurrent(window => {
      resolve(window.id);
    });
  });
}

/*
Context menu
*/
chrome.contextMenus.onClicked.addListener(async function (event) {
  if (event.menuItemId === "sax-feedback") {
    chrome.tabs.create({
      url: 'mailto:contact@mickschroeder.com?subject=Web Shuffle',
    }, function (tab) {
    })
  } else if (event.menuItemId === "sax-show") {
    chrome.storage.local.get(['visited', 'totalUrls', 'welcome_seen'], function (result) {
      notifyTabStumble(result.visited, result.totalUrls);
    });
  } 
});


/**
 * Restore values into memory. 
 * Background script can go idle at anytime, so we need to persist these. 
 */
async function init() {
  windowId = await getLastWindowId();
  stumbleTabId = await getStumbleTabId();
  stumbleUrl = await get('lastStumbleUrl', null);
}

init();