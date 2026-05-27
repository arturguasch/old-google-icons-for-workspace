// Dynamic redirect rules for legacy Maps icon only.
// Calendar redirects are intentionally disabled to avoid interfering with Calendar import/export screens.

const ALL_LEGACY_DYNAMIC_RULE_IDS = [7001, 7002, 7003, 7004, 7005, 7101, 7102, 7103, 7104];
const ACTIVE_DYNAMIC_RULE_IDS = [7101, 7102, 7103, 7104];

async function updateDynamicRules() {
  const addRules = [
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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "calendar-dynamic-icon-midnight") {
    refreshDynamicRules();
  }
});

// Also runs when the service worker wakes up.
refreshDynamicRules();
