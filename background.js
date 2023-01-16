'use strict';

/**
 * Keep track of the WebShuffle tab
 */
var webShuffleTabId = null;

/**
 * The focused window ID
 */
var windowId = null;


/**
 * @typedef {Object} WebShuffleURL
 * @property {string} url
 * @property {string=} title
 * @property {string} listUrl The URL of the collection.
 * @property {string=} listTitle The title of the collection.
 */

/**
* @type {WebShuffleURL}
*/
var webShuffleUrl;


var isPendingShuffle = false;


/**
 * Find a random URL and load it
 * 
 */
async function shuffle() {

  webShuffleUrl = {
    url: 'https://webshuffle.mickschroeder.com/redirect',
    title: 'Web Shuffle',
    listUrl: 'https://mickschroeder.com',
    listTitle: 'By Mick Schroeder'
  }

  await set('lastWebShuffleUrl', webShuffleUrl);

  // Switch to exiting tab 
  if (webShuffleTabId !== null) {
    try {
      chrome.tabs.update(webShuffleTabId, {
        url: webShuffleUrl.url,
        active: true
      }, function (tab) {
      })
    } catch (exception) {
      chrome.tabs.update({
        url: webShuffleUrl.url,
      }, async function (tab) {
        await saveWebShuffleTabId(tab.id);
      })
    }
  }
  // or Open New tab
  else {
    chrome.tabs.create({
      url: webShuffleUrl.url,
    }, async function (tab) {
      await saveWebShuffleTabId(tab.id);
    })
  }
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

const saveWebShuffleTabId = async tabId => {
  await set('webShuffleTabId', tabId);
  webShuffleTabId = tabId;
}

const getWebShuffleTabId = async () => {
  return await get('webShuffleTabId', null);
}

const saveLastWindowId = async windowId => {
  await set('lastWindowId', windowId);
}

const getLastWindowId = async () => {
  return await get('lastWindowId', null);
}


// Load a page on click
chrome.action.onClicked.addListener(
  async function (tab) {

    const currentWindowId = await getFocusedWindowId();
    // Get tab Id
    const savedWebShuffleTabId = await getWebShuffleTabId();
    const tabs = await getBrowserTabs();
    const tabIds = tabs.map(t => t.id);

    // Reset if necessary
    if (windowId !== currentWindowId || !savedWebShuffleTabId || !tabIds.includes(savedWebShuffleTabId)) {
      windowId = currentWindowId;
      await saveLastWindowId(windowId);
      chrome.storage.local.remove(['webShuffleTabId'], () => {
        webShuffleTabId = null;
      })
    }

    isPendingShuffle = true;
    shuffle();
    //animateIcon();
  }
);

// When a tab closes, if it's the Web Shuffle tab, clear the id
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  if (tabId === webShuffleTabId) {
    webShuffleTabId = null;
  }
})


chrome.runtime.onInstalled.addListener(function () {
  // For Web Shuffle development purposes only, uncomment when needed
  // chrome.storage.local.remove(['visited', 'welcome_seen', 'totalUrls'])

  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
      id: "action-show",
      title: 'Show in Chrome Web Store',
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: "action-homepage",
      title: 'Web Shuffle Homepage',
      contexts: ["action"]
    });
    chrome.contextMenus.create({
      id: "action-feedback",
      title: 'Created By Mick Schroeder',
      contexts: ["action"]
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
  if (event.menuItemId === "action-feedback") {
    chrome.tabs.create({
      url: 'https://mickschroeder.com',
    }, function (tab) {
    })
  }
  else if  (event.menuItemId === "action-show") {
    chrome.tabs.create({
      url: 'https://chrome.google.com/webstore/detail/random-website/lgokgkophalfnnapghjjckmeoboepfdj',
    }, function (tab) {
    })
  }
  else if  (event.menuItemId === "action-homepage") {
    chrome.tabs.create({
      url: 'https://webshuffle.mickschroeder.com',
    }, function (tab) {
    })
  }
});


/**
 * Restore values into memory. 
 * Background script can go idle at anytime, so we need to persist these. 
 */
async function init() {
  windowId = await getLastWindowId();
  webShuffleTabId = await getWebShuffleTabId();
  webShuffleUrl = await get('lastWebShuffleUrl', null);
}

init();