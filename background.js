// Dynamic redirect rules for legacy Maps icon only.
// Calendar redirects are intentionally disabled to avoid interfering with Calendar import/export screens.

const ALL_LEGACY_DYNAMIC_RULE_IDS = [7001, 7002, 7003, 7004, 7005, 7101, 7102, 7103, 7104];

const DEFAULT_OPTIONS = {
  enabled: true,
  apps: {
    gmail: true,
    calendar: true,
    drive: true,
    docs: true,
    sheets: true,
    slides: true,
    forms: true,
    meet: true,
    chat: true,
    keep: true,
    maps: true
  }
};

function normalizeOptions(value) {
  const source = value && typeof value === "object" ? value : {};
  const sourceApps = source.apps && typeof source.apps === "object" ? source.apps : {};
  const apps = {};

  for (const app of Object.keys(DEFAULT_OPTIONS.apps)) {
    apps[app] = sourceApps[app] !== false;
  }

  return {
    enabled: source.enabled !== false,
    apps
  };
}

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

function mapsRules() {
  return [
    {
      id: 7101,
      priority: 25,
      action: {
        type: "redirect",
        redirect: { extensionPath: "/icons/maps-classic.png" }
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
        redirect: { extensionPath: "/icons/maps-classic.png" }
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
        redirect: { extensionPath: "/icons/maps-classic.png" }
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
        redirect: { extensionPath: "/icons/maps-classic.png" }
      },
      condition: {
        urlFilter: "Google_Maps",
        resourceTypes: ["image"]
      }
    }
  ];
}

async function updateDynamicRules() {
  const options = await getOptions();
  const addRules = options.enabled && options.apps.maps ? mapsRules() : [];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ALL_LEGACY_DYNAMIC_RULE_IDS,
    addRules
  });
}

async function refreshDynamicRules() {
  try {
    await updateDynamicRules();
    await chrome.alarms.clear("calendar-dynamic-icon-midnight");
  } catch (error) {
    console.warn("Classic Workspace Icons: could not update dynamic rules", error);
  }
}

chrome.runtime.onInstalled.addListener(refreshDynamicRules);
chrome.runtime.onStartup.addListener(refreshDynamicRules);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.cwiOptions) refreshDynamicRules();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "calendar-dynamic-icon-midnight") {
    refreshDynamicRules();
  }
});

// Also runs when the service worker wakes up.
refreshDynamicRules();
