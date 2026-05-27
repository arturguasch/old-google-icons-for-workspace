(() => {

  // Google Calendar import/export is sensitive to DOM observers used by the launcher grid.
  // The launcher grid can still be handled inside ogs.google.com, so this script stays
  // completely inactive in the main calendar.google.com document.
  if (location.hostname === "calendar.google.com") return;

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

  // Classic Workspace Icons, launcher v3.0.
  // Afegeix Maps i Forms. Calendar continua canviant segons el dia local.

  const VERSION = "3.0-maps-forms-darkfix";
  document.documentElement.setAttribute("data-cwi-launcher-version", VERSION);

  const APPS = [
    {
      app: "drive",
      icon: "icons/drive-classic.svg",
      selectors: ['a[href*="drive.google.com"]']
    },
    {
      app: "gmail",
      icon: "icons/gmail-classic.svg",
      selectors: ['a[href*="mail.google.com/mail"]', 'a[href*="mail.google.com"]']
    },
    {
      app: "docs",
      icon: "icons/docs-classic.svg",
      selectors: ['a[href*="docs.google.com/document"]']
    },
    {
      app: "sheets",
      icon: "icons/sheets-classic.svg",
      selectors: ['a[href*="docs.google.com/spreadsheets"]']
    },
    {
      app: "slides",
      icon: "icons/slides-classic.svg",
      selectors: ['a[href*="docs.google.com/presentation"]']
    },
    {
      app: "forms",
      icon: "icons/forms-classic.png",
      selectors: ['a[href*="docs.google.com/forms"]']
    },
    {
      app: "calendar",
      selectors: ['a[href*="calendar.google.com/calendar"]', 'a[href*="calendar.google.com"]']
    },
    {
      app: "chat",
      icon: "icons/chat-classic.svg",
      selectors: ['a[href*="chat.google.com"]']
    },
    {
      app: "meet",
      icon: "icons/meet-classic.svg",
      selectors: ['a[href*="meet.google.com"]']
    },
    {
      app: "keep",
      icon: "icons/keep-classic.svg",
      selectors: ['a[href*="keep.google.com"]']
    },
    {
      app: "maps",
      icon: "icons/maps-classic.png",
      selectors: ['a[href*="maps.google.com"]', 'a[href*="www.google.com/maps"]']
    }
  ];

  let lastDay = null;
  let scheduled = false;
  let midnightTimer = null;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function day() {
    return new Date().getDate();
  }

  function iconPath(item) {
    if (item.app === "calendar") return `icons/calendar-${pad2(day())}.webp`;
    return item.icon;
  }

  function iconUrl(item) {
    return chrome.runtime.getURL(iconPath(item));
  }

  function cssEscapeUrl(url) {
    return url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function buildCss() {
    const rules = [];

    rules.push(`
a[data-cwi-launcher-app] {
  position: relative !important;
}

a[data-cwi-launcher-app]::before {
  content: "" !important;
  position: absolute !important;
  left: 50% !important;
  top: 12px !important;
  width: 38px !important;
  height: 38px !important;
  transform: translateX(-50%) !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
  border-radius: 8px !important;
}

a[data-cwi-launcher-app] [data-cwi-launcher-original-icon="1"] {
  opacity: 0 !important;
  visibility: hidden !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
}

a[data-cwi-launcher-app] [data-cwi-launcher-original-icon="1"] *,
a[data-cwi-launcher-app] [data-cwi-launcher-original-icon="1"]::before,
a[data-cwi-launcher-app] [data-cwi-launcher-original-icon="1"]::after {
  opacity: 0 !important;
  visibility: hidden !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  content: none !important;
}

a[data-cwi-launcher-app] [data-cwi-launcher-original-bg="1"],
a[data-cwi-launcher-app] [data-cwi-launcher-original-bg="1"]::before,
a[data-cwi-launcher-app] [data-cwi-launcher-original-bg="1"]::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  content: none !important;
}

/* Evita el "pill" o ombra que Google afegeix a la zona de la icona en hover.
   No toca el text del tile, només la meitat superior on va la icona. */
a[data-cwi-launcher-app] [data-cwi-launcher-hover-clean="1"],
a[data-cwi-launcher-app] [data-cwi-launcher-hover-clean="1"]::before,
a[data-cwi-launcher-app] [data-cwi-launcher-hover-clean="1"]::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  content: none !important;
}
`);

    for (const item of APPS) {
      const icon = cssEscapeUrl(iconUrl(item));

      rules.push(`
a[data-cwi-launcher-app="${item.app}"]::before {
  background-image: url("${icon}") !important;
}
`);
    }


    rules.push(`
/* v3.4, elimina el rectangle gris de hover als tiles modificats.
   S'aplica a tots els iconos canviats, és a dir, tots els a[data-cwi-launcher-app]. */
a[data-cwi-launcher-app],
a[data-cwi-launcher-app]:hover,
a[data-cwi-launcher-app]:focus,
a[data-cwi-launcher-app]:active,
a[data-cwi-launcher-app]:focus-visible {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  outline: none !important;
}

a[data-cwi-launcher-app]:hover *,
a[data-cwi-launcher-app]:focus *,
a[data-cwi-launcher-app]:active *,
a[data-cwi-launcher-app]:focus-visible * {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  outline: none !important;
}

a[data-cwi-launcher-app]:hover *::before,
a[data-cwi-launcher-app]:hover *::after,
a[data-cwi-launcher-app]:focus *::before,
a[data-cwi-launcher-app]:focus *::after,
a[data-cwi-launcher-app]:active *::before,
a[data-cwi-launcher-app]:active *::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
}

/* Manté la icona antiga de l'extensió per sobre de la neteja de hover. */
a[data-cwi-launcher-app]::before,
a[data-cwi-launcher-app]:hover::before,
a[data-cwi-launcher-app]:focus::before,
a[data-cwi-launcher-app]:active::before {
  content: "" !important;
  position: absolute !important;
  left: 50% !important;
  top: 12px !important;
  width: 38px !important;
  height: 38px !important;
  transform: translateX(-50%) !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
  border-radius: 8px !important;
}

/* També elimina highlights marcats per JS a labels i contenidors inferiors. */
a[data-cwi-launcher-app] [data-cwi-launcher-label-clean="1"],
a[data-cwi-launcher-app] [data-cwi-launcher-label-clean="1"]::before,
a[data-cwi-launcher-app] [data-cwi-launcher-label-clean="1"]::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
}
`);

    return rules.join("\n");
  }

  function cleanupPausedPage() {
    document.getElementById("cwi-launcher-css-v30")?.remove();
    document.documentElement?.removeAttribute("data-cwi-launcher-tiles");
    document.documentElement?.removeAttribute("data-cwi-launcher-hidden-parts");
    document.documentElement?.removeAttribute("data-cwi-launcher-url");
    document.querySelectorAll("[data-cwi-launcher-app], [data-cwi-launcher-original-icon], [data-cwi-launcher-original-bg], [data-cwi-launcher-hover-clean], [data-cwi-launcher-label-clean]").forEach((el) => {
      el.removeAttribute("data-cwi-launcher-app");
      el.removeAttribute("data-cwi-launcher-original-icon");
      el.removeAttribute("data-cwi-launcher-original-bg");
      el.removeAttribute("data-cwi-launcher-hover-clean");
      el.removeAttribute("data-cwi-launcher-label-clean");
    });
  }

  function injectCss() {
    if (cwiShouldPauseOnThisPage()) {
      cleanupPausedPage();
      return;
    }

    let style = document.getElementById("cwi-launcher-css-v30");
    if (!style) {
      style = document.createElement("style");
      style.id = "cwi-launcher-css-v30";
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = buildCss();
    lastDay = day();
  }

  function visible(rect) {
    return rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;
  }

  function isVisibleTile(a) {
    const r = a.getBoundingClientRect();

    if (!visible(r)) return false;

    if (r.width < 55 || r.width > 145) return false;
    if (r.height < 55 || r.height > 145) return false;

    return true;
  }

  function clearOldMarks(tile) {
    tile.querySelectorAll("[data-cwi-launcher-original-icon], [data-cwi-launcher-original-bg], [data-cwi-launcher-hover-clean], [data-cwi-launcher-label-clean]").forEach((el) => {
      el.removeAttribute("data-cwi-launcher-original-icon");
      el.removeAttribute("data-cwi-launcher-original-bg");
      el.removeAttribute("data-cwi-launcher-hover-clean");
      el.removeAttribute("data-cwi-launcher-label-clean");
    });
  }

  function hasMeaningfulText(el, tile) {
    const text = String(el.innerText || el.textContent || "").trim();
    const tileText = String(tile.innerText || tile.textContent || "").trim();

    if (!text) return false;
    if (text === tileText && text.length <= 45) return true;

    return text.length > 0;
  }

  function isIconZoneRect(r, tileRect) {
    if (!visible(r)) return false;

    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const tileCx = tileRect.left + tileRect.width / 2;

    if (r.left < tileRect.left - 6 || r.right > tileRect.right + 6) return false;
    if (r.top < tileRect.top - 6 || r.bottom > tileRect.bottom + 6) return false;

    if (cy > tileRect.top + tileRect.height * 0.62) return false;

    if (r.width > 80 || r.height > 80) return false;
    if (r.width < 6 || r.height < 6) return false;

    if (Math.abs(cx - tileCx) > tileRect.width * 0.36) return false;

    return true;
  }

  function elementLooksGraphical(el) {
    const tag = el.tagName?.toLowerCase();
    if (["img", "svg", "image", "canvas", "picture"].includes(tag)) return true;

    const style = getComputedStyle(el);
    if (style.backgroundImage && style.backgroundImage !== "none") return true;

    const text = String(el.innerText || el.textContent || "").trim();
    if (!text && (style.backgroundColor || el.children.length > 0)) return true;

    return false;
  }

  function markOriginalIconParts(tile) {
    clearOldMarks(tile);

    const tileRect = tile.getBoundingClientRect();
    const descendants = Array.from(tile.querySelectorAll("*"));

    const marked = new Set();

    function mark(el) {
      if (!el || el === tile || marked.has(el)) return;
      el.setAttribute("data-cwi-launcher-original-icon", "1");
      el.setAttribute("data-cwi-launcher-hover-clean", "1");

      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== "none") {
        el.setAttribute("data-cwi-launcher-original-bg", "1");
      }

      marked.add(el);
    }

    for (const el of descendants) {
      const r = el.getBoundingClientRect();

      if (!isIconZoneRect(r, tileRect)) continue;
      if (hasMeaningfulText(el, tile)) continue;
      if (!elementLooksGraphical(el)) continue;

      mark(el);

      const parent = el.parentElement;
      if (parent && parent !== tile) {
        const pr = parent.getBoundingClientRect();

        if (
          isIconZoneRect(pr, tileRect) &&
          !hasMeaningfulText(parent, tile) &&
          pr.width <= 86 &&
          pr.height <= 86
        ) {
          parent.setAttribute("data-cwi-launcher-hover-clean", "1");
          mark(parent);
        }
      }
    }

    // Marca també contenidors no textuals de la zona superior. Google els usa per hover/ripple.
    for (const el of descendants) {
      const r = el.getBoundingClientRect();

      if (
        isIconZoneRect(r, tileRect) &&
        !hasMeaningfulText(el, tile) &&
        r.width <= 90 &&
        r.height <= 90
      ) {
        el.setAttribute("data-cwi-launcher-hover-clean", "1");
      }
    }

    if (marked.size === 0) {
      const directChildren = Array.from(tile.children);

      for (const child of directChildren) {
        const r = child.getBoundingClientRect();

        if (
          isIconZoneRect(r, tileRect) &&
          !hasMeaningfulText(child, tile) &&
          r.width <= 86 &&
          r.height <= 86
        ) {
          child.setAttribute("data-cwi-launcher-hover-clean", "1");
          mark(child);
          break;
        }
      }
    }

    return marked.size;
  }

  function markTiles() {
    if (cwiShouldPauseOnThisPage()) {
      cleanupPausedPage();
      return;
    }

    let count = 0;
    let hiddenParts = 0;

    for (const item of APPS) {
      for (const selector of item.selectors) {
        const nodes = Array.from(document.querySelectorAll(selector));

        for (const a of nodes) {
          if (!(a instanceof HTMLAnchorElement)) continue;
          if (!isVisibleTile(a)) continue;

          a.dataset.cwiLauncherApp = item.app;
          hiddenParts += markOriginalIconParts(a);
          count += 1;
        }
      }
    }


    // Marca possibles contenidors del label o hover inferior.
    // Ho fem per tots els iconos canviats.
    for (const item of APPS) {
      for (const selector of item.selectors) {
        const nodes = Array.from(document.querySelectorAll(selector));

        for (const a of nodes) {
          if (!(a instanceof HTMLAnchorElement)) continue;
          if (!isVisibleTile(a)) continue;

          const tileRect = a.getBoundingClientRect();
          const descendants = Array.from(a.querySelectorAll("*"));

          for (const el of descendants) {
            const r = el.getBoundingClientRect();
            if (!visible(r)) continue;

            const cy = r.top + r.height / 2;
            const within =
              r.left >= tileRect.left - 4 &&
              r.right <= tileRect.right + 4 &&
              r.top >= tileRect.top - 4 &&
              r.bottom <= tileRect.bottom + 4;

            if (!within) continue;

            const text = String(el.innerText || el.textContent || "").trim();

            // Zona del text o contenidors amplis de hover sota la icona.
            if (
              (text && text.length <= 45 && cy > tileRect.top + tileRect.height * 0.45) ||
              (!text && cy > tileRect.top + tileRect.height * 0.45 && r.width <= tileRect.width && r.height <= 36)
            ) {
              el.setAttribute("data-cwi-launcher-label-clean", "1");
            }
          }
        }
      }
    }

    document.documentElement.setAttribute("data-cwi-launcher-tiles", String(count));
    document.documentElement.setAttribute("data-cwi-launcher-hidden-parts", String(hiddenParts));
    document.documentElement.setAttribute("data-cwi-launcher-url", location.href);
  }

  function checkDay() {
    if (lastDay !== day()) {
      injectCss();
      markTiles();
    }
  }

  function scheduleMidnightRefresh() {
    if (midnightTimer) clearTimeout(midnightTimer);

    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0);

    midnightTimer = setTimeout(() => {
      injectCss();
      markTiles();
      scheduleMidnightRefresh();
    }, Math.max(1000, next.getTime() - now.getTime()));
  }

  function schedule(delay = 50) {
    if (scheduled) return;
    scheduled = true;

    setTimeout(() => {
      scheduled = false;
      injectCss();
      markTiles();
      checkDay();
    }, delay);
  }

  function start() {
    if (cwiShouldPauseOnThisPage()) {
      cleanupPausedPage();
      return;
    }

    injectCss();
    markTiles();
    scheduleMidnightRefresh();

    const observer = new MutationObserver(() => schedule(60));
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "style", "class", "aria-label", "title", "src", "srcset"]
    });

    [100, 250, 500, 1000, 2000, 4000].forEach((ms) => setTimeout(() => {
      injectCss();
      markTiles();
    }, ms));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("load", () => schedule(100), { once: true });
  window.addEventListener("resize", () => schedule(50));
  window.addEventListener("popstate", () => schedule(80));
  window.addEventListener("hashchange", () => schedule(80));
  window.addEventListener("scroll", () => schedule(20), true);
  window.addEventListener("focus", () => schedule(60));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) schedule(60);
  });

  setInterval(checkDay, 60 * 1000);
})();
