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

  const STYLE_ID = "cwi-workspace-side-panel-icons-style"
  const VERSION_ATTR = "data-cwi-sidepanel-css-version"
  const VERSION = "1.0.2-css-url-selectors-import-guard"

  const ICON_SIZE = "24px"

  function runtimeUrl(path) {
    return chrome.runtime.getURL(path).replace(/\\/g, "\\\\").replace(/"/g, "\\\"")
  }

  function calendarIconPath() {
    return `icons/calendar-${String(new Date().getDate()).padStart(2, "0")}.webp`
  }

  function iconUrls() {
    return {
      calendar: runtimeUrl(calendarIconPath()),
      keep: runtimeUrl("icons/keep-classic.svg"),
      maps: runtimeUrl("icons/maps-classic.png")
    }
  }

  function css() {
    const icons = iconUrls()

    return `
.app-switcher-button[data-guest-app-id="6"] .app-switcher-button-icon-container,
[data-guest-app-id="6"] .app-switcher-button-icon-container,
.app-switcher-button-icon-container[style*="calendar_"],
[style*="/companion/icon_assets/calendar_"],
[style*="calendar_2026_2x"],
.Yb-Il-d-c-j[style*="calendar_"],
.aT5-aOt-I-JX-Jw[style*="calendar_"] {
  background-image: url("${icons.calendar}") !important;
}

.app-switcher-button[data-guest-app-id="2"] .app-switcher-button-icon-container,
[data-guest-app-id="2"] .app-switcher-button-icon-container,
.app-switcher-button-icon-container[style*="keep_"],
[style*="/companion/icon_assets/keep_"],
[style*="keep_2026_2x"],
.Yb-Il-d-c-j[style*="keep_"],
.aT5-aOt-I-JX-Jw[style*="keep_"] {
  background-image: url("${icons.keep}") !important;
}

.app-switcher-button[data-guest-app-id="8"] .app-switcher-button-icon-container,
[data-guest-app-id="8"] .app-switcher-button-icon-container,
.app-switcher-button-icon-container[style*="logo_maps"],
[style*="logo_maps_2025"],
[style*="logo_maps"],
.Yb-Il-d-c-j[style*="logo_maps"],
.aT5-aOt-I-JX-Jw[style*="logo_maps"] {
  background-image: url("${icons.maps}") !important;
}

.app-switcher-button[data-guest-app-id="6"] .app-switcher-button-icon-container,
[data-guest-app-id="6"] .app-switcher-button-icon-container,
.app-switcher-button-icon-container[style*="calendar_"],
[style*="/companion/icon_assets/calendar_"],
[style*="calendar_2026_2x"],
.Yb-Il-d-c-j[style*="calendar_"],
.aT5-aOt-I-JX-Jw[style*="calendar_"],
.app-switcher-button[data-guest-app-id="2"] .app-switcher-button-icon-container,
[data-guest-app-id="2"] .app-switcher-button-icon-container,
.app-switcher-button-icon-container[style*="keep_"],
[style*="/companion/icon_assets/keep_"],
[style*="keep_2026_2x"],
.Yb-Il-d-c-j[style*="keep_"],
.aT5-aOt-I-JX-Jw[style*="keep_"],
.app-switcher-button[data-guest-app-id="8"] .app-switcher-button-icon-container,
[data-guest-app-id="8"] .app-switcher-button-icon-container,
.app-switcher-button-icon-container[style*="logo_maps"],
[style*="logo_maps_2025"],
[style*="logo_maps"],
.Yb-Il-d-c-j[style*="logo_maps"],
.aT5-aOt-I-JX-Jw[style*="logo_maps"] {
  background-repeat: no-repeat !important;
  background-position: center center !important;
  background-size: ${ICON_SIZE} ${ICON_SIZE} !important;
}
`
  }

  function cleanupPausedPage() {
    document.getElementById(STYLE_ID)?.remove()
    document.documentElement?.removeAttribute(VERSION_ATTR)
  }

  function installStyle() {
    if (!document.documentElement) return
    if (cwiShouldPauseOnThisPage()) {
      cleanupPausedPage()
      return
    }

    document.documentElement.setAttribute(VERSION_ATTR, VERSION)

    let style = document.getElementById(STYLE_ID)
    if (!style) {
      style = document.createElement("style")
      style.id = STYLE_ID
      style.type = "text/css"
      ;(document.head || document.documentElement).appendChild(style)
    }

    const nextCss = css()
    if (style.textContent !== nextCss) style.textContent = nextCss
  }

  function scheduleMidnightRefresh() {
    const now = new Date()
    const next = new Date(now)
    next.setHours(24, 0, 5, 0)

    window.setTimeout(() => {
      installStyle()
      scheduleMidnightRefresh()
    }, Math.max(1000, next.getTime() - now.getTime()))
  }

  installStyle()

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installStyle, { once: true })
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") installStyle()
  }, { passive: true })

  window.addEventListener("focus", installStyle, { passive: true })
  scheduleMidnightRefresh()
})()
