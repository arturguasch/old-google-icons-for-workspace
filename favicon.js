(() => {

  function cwiShouldPauseOnThisPage() {
    const host = location.hostname;
    const href = location.href.toLowerCase();
    const path = location.pathname.toLowerCase();

    // Google Calendar import/export/settings is sensitive because it handles local .ics uploads.
    // The extension only changes visual icons, so it should stay completely inactive there.
    if (host === "calendar.google.com" && (
      href.includes("/settings") ||
      href.includes("settings/export") ||
      href.includes("settings/import") ||
      href.includes("/import") ||
      href.includes("/export")
    )) return true;

    // Keep broad Google-frame scripts away from Google picker/upload surfaces.
    if ((host === "docs.google.com" || host === "drive.google.com") && (
      path.includes("/picker") ||
      path.includes("/upload") ||
      href.includes("picker?") ||
      href.includes("filepicker")
    )) return true;

    return false;
  }

  if (cwiShouldPauseOnThisPage()) return;
  const APPS = {
    gmail: { icon: "icons/gmail-classic.svg", hosts: ["mail.google.com"], type: "image/svg+xml" },
    calendar: { hosts: ["calendar.google.com"], hardLock: true },
    drive: { icon: "icons/drive-classic.svg", hosts: ["drive.google.com"], type: "image/svg+xml" },
    docs: { icon: "icons/docs-classic.svg", urlIncludes: ["docs.google.com/document"], type: "image/svg+xml" },
    sheets: { icon: "icons/sheets-classic.svg", urlIncludes: ["docs.google.com/spreadsheets"], type: "image/svg+xml" },
    slides: { icon: "icons/slides-classic.svg", urlIncludes: ["docs.google.com/presentation"], type: "image/svg+xml" },
    forms: { icon: "icons/forms-classic.png", urlIncludes: ["docs.google.com/forms"], type: "image/png" },
    meet: { icon: "icons/meet-classic.svg", hosts: ["meet.google.com"], type: "image/svg+xml" },
    chat: { icon: "icons/chat-classic.svg", hosts: ["chat.google.com"], type: "image/svg+xml" },
    keep: { icon: "icons/keep-classic.svg", hosts: ["keep.google.com"], type: "image/svg+xml" },
    maps: {
      icon: "icons/maps-classic.png",
      hosts: ["maps.google.com"],
      urlIncludes: ["www.google.com/maps"],
      type: "image/png",
      hardLock: true
    }
  };

  let applying = false;
  let scheduled = false;
  let observer = null;
  let lastCalendarDay = null;
  let midnightTimer = null;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function calendarDay() {
    return new Date().getDate();
  }

  function calendarIconPath() {
    return `icons/calendar-${pad2(calendarDay())}.webp`;
  }

  function appForCurrentPage() {
    if (cwiShouldPauseOnThisPage()) return null;
    const host = location.hostname;
    const url = location.href;

    for (const [app, cfg] of Object.entries(APPS)) {
      if (cfg.hosts?.includes(host)) return app;
      if (cfg.urlIncludes?.some((part) => url.includes(part))) return app;
    }

    return null;
  }

  function iconPath(app) {
    if (app === "calendar") return calendarIconPath();
    return APPS[app].icon;
  }

  function iconType(app) {
    if (app === "calendar") return "image/webp";
    return APPS[app].type || "image/svg+xml";
  }

  function iconUrl(app) {
    return chrome.runtime.getURL(iconPath(app));
  }

  function ensureHead(callback) {
    if (cwiShouldPauseOnThisPage()) return;
    if (document.head) callback();
    else requestAnimationFrame(() => ensureHead(callback));
  }

  function relIsIcon(rel) {
    return /\bicon\b/i.test(String(rel || "")) || /apple-touch-icon|mask-icon/i.test(String(rel || ""));
  }

  function makeIconLink(rel, href, app) {
    const link = document.createElement("link");
    link.dataset.classicWorkspaceIcon = "1";
    link.dataset.classicWorkspaceApp = app;
    link.rel = rel;
    link.type = iconType(app);
    link.href = href;
    return link;
  }

  function setFavicon() {
    const app = appForCurrentPage();
    if (!app || !document.head) return;

    const cfg = APPS[app];
    const href = iconUrl(app);
    const type = iconType(app);

    applying = true;

    try {
      if (cfg.hardLock) {
        const iconLinks = Array.from(document.querySelectorAll("link"))
          .filter((el) => relIsIcon(el.rel));

        for (const el of iconLinks) {
          if (el.dataset.classicWorkspaceIcon !== "1") {
            el.remove();
          }
        }

        let primary = document.querySelector('link[data-classic-workspace-icon="1"][data-classic-workspace-primary="1"]');
        if (!primary) {
          primary = makeIconLink("icon", href, app);
          primary.dataset.classicWorkspacePrimary = "1";
          primary.setAttribute("sizes", "any");
          document.head.appendChild(primary);
        }

        primary.href = href;
        primary.type = type;
        primary.rel = "icon";
        primary.setAttribute("sizes", "any");

        let shortcut = document.querySelector('link[data-classic-workspace-icon="1"][data-classic-workspace-shortcut="1"]');
        if (!shortcut) {
          shortcut = makeIconLink("shortcut icon", href, app);
          shortcut.dataset.classicWorkspaceShortcut = "1";
          document.head.appendChild(shortcut);
        }

        shortcut.href = href;
        shortcut.type = type;
        shortcut.rel = "shortcut icon";

        document.head.appendChild(primary);
        document.head.appendChild(shortcut);

        lastCalendarDay = calendarDay();
      } else {
        let link = document.querySelector('link[data-classic-workspace-icon="1"]');

        if (!link) {
          link = document.querySelector("link[rel*='icon']") || document.createElement("link");
          link.dataset.classicWorkspaceIcon = "1";
          link.dataset.classicWorkspaceApp = app;
        }

        link.rel = "shortcut icon";
        link.type = type;
        link.href = href;

        if (link.parentNode !== document.head || link !== document.head.lastElementChild) {
          document.head.appendChild(link);
        }

        const ours = document.querySelector('link[data-classic-workspace-icon="1"]');
        if (ours && ours !== document.head.lastElementChild) {
          document.head.appendChild(ours);
        }
      }
    } finally {
      setTimeout(() => {
        applying = false;
      }, 0);
    }
  }

  function scheduleSetFavicon(delay = 60) {
    if (scheduled) return;

    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      ensureHead(setFavicon);
    }, delay);
  }

  function startObserver() {
    if (observer || !document.head) return;

    observer = new MutationObserver(() => {
      if (!applying) scheduleSetFavicon(50);
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "rel", "type", "sizes"]
    });
  }

  function pulseHardLock() {
    const app = appForCurrentPage();
    if (!app || !APPS[app]?.hardLock) return;

    [0, 50, 150, 400, 900, 1600, 3000].forEach((ms) => {
      setTimeout(() => ensureHead(setFavicon), ms);
    });
  }

  function pulseCalendarLock() {
    if (appForCurrentPage() !== "calendar") return;
    pulseHardLock();
  }

  function scheduleCalendarMidnightRefresh() {
    if (location.hostname !== "calendar.google.com") return;

    if (midnightTimer) clearTimeout(midnightTimer);

    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0);
    const delay = Math.max(1000, next.getTime() - now.getTime());

    midnightTimer = setTimeout(() => {
      lastCalendarDay = null;
      pulseCalendarLock();
      scheduleCalendarMidnightRefresh();
    }, delay);
  }

  function checkCalendarDayChange() {
    if (location.hostname !== "calendar.google.com") return;

    const day = calendarDay();
    if (lastCalendarDay !== day) {
      pulseCalendarLock();
    }
  }

  ensureHead(() => {
    setFavicon();
    startObserver();
    pulseCalendarLock();
    scheduleCalendarMidnightRefresh();
  });

  window.addEventListener("DOMContentLoaded", () => {
    scheduleSetFavicon(30);
    pulseCalendarLock();
  }, { once: true });

  window.addEventListener("load", () => {
    scheduleSetFavicon(120);
    pulseCalendarLock();
  }, { once: true });

  window.addEventListener("focus", () => {
    checkCalendarDayChange();
    scheduleSetFavicon(50);
    pulseCalendarLock();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkCalendarDayChange();
      scheduleSetFavicon(50);
      pulseCalendarLock();
    }
  });

  if (location.hostname === "calendar.google.com") {
    document.addEventListener("click", () => pulseCalendarLock(), true);
    window.addEventListener("popstate", () => pulseCalendarLock());
    window.addEventListener("hashchange", () => pulseCalendarLock());
    setInterval(checkCalendarDayChange, 60 * 1000);
  }

  if (location.hostname === "maps.google.com" || location.href.includes("www.google.com/maps")) {
    document.addEventListener("click", () => pulseHardLock(), true);
    window.addEventListener("popstate", () => pulseHardLock());
    window.addEventListener("hashchange", () => pulseHardLock());
    setInterval(() => pulseHardLock(), 5000);
  }
})();
