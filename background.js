// Dynamic Calendar favicon redirect rules.
// Actualitza el redirect segons el dia local de l'usuari.

const CALENDAR_RULE_IDS = [7001, 7002, 7003, 7004, 7005, 7101, 7102, 7103, 7104];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function calendarIconPath() {
  return `/icons/calendar-${pad2(new Date().getDate())}.webp`;
}

function nextMidnightWhen() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 5, 0);
  return next.getTime();
}

async function updateCalendarDynamicRules() {
  const extensionPath = calendarIconPath();

  const addRules = [
    {
      id: 7001,
      priority: 30,
      action: {
        type: "redirect",
        redirect: { extensionPath }
      },
      condition: {
        urlFilter: "||ssl.gstatic.com/calendar/images/dynamiclogo",
        resourceTypes: ["image"]
      }
    },
    {
      id: 7002,
      priority: 30,
      action: {
        type: "redirect",
        redirect: { extensionPath }
      },
      condition: {
        urlFilter: "||www.gstatic.com/calendar/images/dynamiclogo",
        resourceTypes: ["image"]
      }
    },
    {
      id: 7003,
      priority: 30,
      action: {
        type: "redirect",
        redirect: { extensionPath }
      },
      condition: {
        urlFilter: "calendar/images/favicon",
        resourceTypes: ["image"]
      }
    },
    {
      id: 7004,
      priority: 30,
      action: {
        type: "redirect",
        redirect: { extensionPath }
      },
      condition: {
        urlFilter: "calendar_2020q4",
        resourceTypes: ["image"]
      }
    },
    {
      id: 7005,
      priority: 30,
      action: {
        type: "redirect",
        redirect: { extensionPath }
      },
      condition: {
        urlFilter: "Google_Calendar",
        resourceTypes: ["image"]
      }
    },
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
    removeRuleIds: CALENDAR_RULE_IDS,
    addRules
  });
}

async function scheduleMidnightAlarm() {
  await chrome.alarms.clear("calendar-dynamic-icon-midnight");
  chrome.alarms.create("calendar-dynamic-icon-midnight", {
    when: nextMidnightWhen()
  });
}

async function refreshCalendarIconRules() {
  try {
    await updateCalendarDynamicRules();
    await scheduleMidnightAlarm();
  } catch (error) {
    console.warn("Classic Workspace Icons: could not update Calendar dynamic rules", error);
  }
}

chrome.runtime.onInstalled.addListener(refreshCalendarIconRules);
chrome.runtime.onStartup.addListener(refreshCalendarIconRules);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "calendar-dynamic-icon-midnight") {
    refreshCalendarIconRules();
  }
});

// També s'executa quan el service worker desperta.
refreshCalendarIconRules();
