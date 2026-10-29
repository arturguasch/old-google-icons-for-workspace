// Dynamic redirect rules for the legacy Maps icon and the classic account ring.
// Calendar redirects are intentionally disabled to avoid interfering with Calendar import/export screens.

importScripts("cwi-settings.js");

const ALL_LEGACY_DYNAMIC_RULE_IDS = [7001, 7002, 7003, 7004, 7005, 7101, 7102, 7103, 7104, 7201, 7202];
const CWI_SETTINGS = globalThis.__CWI_SETTINGS__;
const DEFAULT_OPTIONS = CWI_SETTINGS.DEFAULT_OPTIONS;
const normalizeOptions = CWI_SETTINGS.normalizeOptions;

// Verification palette. Set to false to serve the real classic ring colours.
const RING_TEST_MODE = false;

function getOptions() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ cwiOptions: DEFAULT_OPTIONS }, (result) => {
      if (chrome.runtime.lastError) {
        resolve(normalizeOptions(DEFAULT_OPTIONS));
        return;
      }

      resolve(normalizeOptions(result.cwiOptions));
    });
  });
}

function mapsRules(iconPath) {
  return [
    {
      id: 7101,
      priority: 25,
      action: {
        type: "redirect",
        redirect: { extensionPath: `/${iconPath}` }
      },
      condition: {
        urlFilter: "||www.gstatic.com/images/branding/product/ico/maps",
        resourceTypes: ["image"]
      }
    },
    {
      id: 7102,
      priority: 25,
      action: {
        type: "redirect",
        redirect: { extensionPath: `/${iconPath}` }
      },
      condition: {
        urlFilter: "||ssl.gstatic.com/images/branding/product/ico/maps",
        resourceTypes: ["image"]
      }
    },
    {
      id: 7103,
      priority: 25,
      action: {
        type: "redirect",
        redirect: { extensionPath: `/${iconPath}` }
      },
      condition: {
        urlFilter: "maps15",
        resourceTypes: ["image"]
      }
    },
    {
      id: 7104,
      priority: 25,
      action: {
        type: "redirect",
        redirect: { extensionPath: `/${iconPath}` }
      },
      condition: {
        urlFilter: "Google_Maps",
        resourceTypes: ["image"]
      }
    }
  ];
}

// The redesigned account ring is a bitmap served from gstatic, so it is swapped
// at the network layer. Nothing has to watch the DOM: the classic ring is what
// the page receives in the first place, on every surface and before first paint.
const RING_URL_FILTERS = [
  "||ssl.gstatic.com/gb/images/ring/",
  "||www.gstatic.com/gb/images/ring/"
];

function ringRules() {
  const extensionPath = RING_TEST_MODE
    ? "/icons/account-ring-test.svg"
    : "/icons/account-ring-classic.svg";

  return RING_URL_FILTERS.map((urlFilter, index) => ({
    id: 7201 + index,
    priority: 25,
    action: {
      type: "redirect",
      redirect: { extensionPath }
    },
    condition: {
      urlFilter,
      resourceTypes: ["image"]
    }
  }));
}

async function updateDynamicRules() {
  const options = await getOptions();
  const addRules = [];

  if (options.enabled && options.surfaces.launcher && options.apps.maps && options.appSurfaces.maps.launcher && !options.customIconsEnabled.maps) {
    addRules.push(...mapsRules(CWI_SETTINGS.getIconPath("maps", options)));
  }
  if (options.enabled && options.apps.ring) addRules.push(...ringRules());

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ALL_LEGACY_DYNAMIC_RULE_IDS,
    addRules
  });
}

let dynamicRulesRefresh = null;
let dynamicRulesRefreshRequested = false;

function refreshDynamicRules() {
  dynamicRulesRefreshRequested = true;
  if (dynamicRulesRefresh) return dynamicRulesRefresh;

  const runRefreshes = async () => {
    while (dynamicRulesRefreshRequested) {
      dynamicRulesRefreshRequested = false;
      try {
        await updateDynamicRules();
        await chrome.alarms.clear("calendar-dynamic-icon-midnight");
      } catch (error) {
        console.warn("Classic Workspace Icons: could not update dynamic rules", error);
      }
    }
  };

  dynamicRulesRefresh = runRefreshes().finally(() => {
    dynamicRulesRefresh = null;
    if (dynamicRulesRefreshRequested) void refreshDynamicRules();
  });
  return dynamicRulesRefresh;
}

async function notifyTabsRingRefresh() {
  try {
    const tabs = await chrome.tabs.query({
      url: [
        "https://*.google.com/*",
        "https://*.google.cat/*",
        "https://one.google.com/*",
        "https://mail.google.com/*",
        "https://drive.google.com/*",
        "https://docs.google.com/*",
        "https://calendar.google.com/*",
        "https://keep.google.com/*",
        "https://meet.google.com/*",
        "https://chat.google.com/*",
        "https://maps.google.com/*",
        "https://ogs.google.com/*"
      ]
    });

    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, { type: "cwi-ring-live-refresh" }, () => {
        void chrome.runtime.lastError;
      });
    }
  } catch (_) {
    // Tabs without the content script are expected.
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "cwi-refresh-ring-live") {
    refreshDynamicRules()
      .then(notifyTabsRingRefresh)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type !== "cwi-sync-ring-rules") return;

  refreshDynamicRules()
    .then(() => sendResponse({ ok: true }))
    .catch(() => sendResponse({ ok: false }));

  return true;
});

chrome.runtime.onInstalled.addListener(refreshDynamicRules);
chrome.runtime.onStartup.addListener(refreshDynamicRules);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.cwiOptions) {
    refreshDynamicRules().then(() => notifyTabsRingRefresh());
  } else if (areaName === "local" && changes.cwiCustomIcons) {
    refreshDynamicRules();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "calendar-dynamic-icon-midnight") {
    refreshDynamicRules();
  }
});

// Also runs when the service worker wakes up.
refreshDynamicRules();
