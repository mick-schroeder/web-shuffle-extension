'use strict';

/**
 * Keep track of the RandomWebsite tab
 */
var randomWebsiteTabId = null;

/**
 * The focused window ID
 */
var windowId = null;


/**
 * @typedef {Object} RandomWebsiteURL
 * @property {string} url
 * @property {string=} title
 * @property {string} listUrl The URL of the collection.
 * @property {string=} listTitle The title of the collection.
 */

/**
* @type {RandomWebsiteURL}
*/
var randomWebsiteUrl;


var isPendingShuffle = false;


/**
 * Find a random URL and load it
 * 
 */
async function shuffle() {

  randomWebsiteUrl = {
    url: 'https://randomwebsite.mickschroeder.com/redirect',
    title: 'Web Shuffle',
    listUrl: 'https://mickschroeder.com',
    listTitle: 'By Mick Schroeder'
  }

  await set('lastRandomWebsiteUrl', randomWebsiteUrl);

  // Switch to exiting tab 
  if (randomWebsiteTabId !== null) {
    try {
      chrome.tabs.update(randomWebsiteTabId, {
        url: randomWebsiteUrl.url,
        active: true
      }, function (tab) {
      })
    } catch (exception) {
      chrome.tabs.update({
        url: randomWebsiteUrl.url,
      }, async function (tab) {
        await saveRandomWebsiteTabId(tab.id);
      })
    }
  }
  // or Open New tab
  else {
    chrome.tabs.create({
      url: randomWebsiteUrl.url,
    }, async function (tab) {
      await saveRandomWebsiteTabId(tab.id);
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

const saveRandomWebsiteTabId = async tabId => {
  await set('randomWebsiteTabId', tabId);
  randomWebsiteTabId = tabId;
}

const getRandomWebsiteTabId = async () => {
  return await get('randomWebsiteTabId', null);
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
    const savedRandomWebsiteTabId = await getRandomWebsiteTabId();
    const tabs = await getBrowserTabs();
    const tabIds = tabs.map(t => t.id);

    // Reset if necessary
    if (windowId !== currentWindowId || !savedRandomWebsiteTabId || !tabIds.includes(savedRandomWebsiteTabId)) {
      windowId = currentWindowId;
      await saveLastWindowId(windowId);
      chrome.storage.local.remove(['randomWebsiteTabId'], () => {
        randomWebsiteTabId = null;
      })
    }

    isPendingShuffle = true;
    shuffle();
    //animateIcon();
  }
);

// When a tab closes, if it's the Web Shuffle tab, clear the id
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  if (tabId === randomWebsiteTabId) {
    randomWebsiteTabId = null;
  }
})


chrome.runtime.onInstalled.addListener(function () {
  // For Web Shuffleelopment purposes only, uncomment when needed
  // chrome.storage.local.remove(['visited', 'welcome_seen', 'totalUrls'])

  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
      id: "sax-show",
      title: 'Show Web Shuffle Pop-up',
      contexts: ["browser_action"]
    });
    chrome.contextMenus.create({
      id: "sax-feedback",
      title: 'Created By Mick Schroeder',
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
      url: 'https://mickschroeder.com',
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
  randomWebsiteTabId = await getRandomWebsiteTabId();
  randomWebsiteUrl = await get('lastRandomWebsiteUrl', null);
}

init();