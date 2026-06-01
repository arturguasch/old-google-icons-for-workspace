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

  const VERSION = "3.15-maps-forms-gridcenter-native-label-xy-square-hover";
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
  let observer = null;
  let started = false;
  const CWI_SETTINGS = globalThis.__CWI_SETTINGS__;
  let cwiOptions = null;
  if (!CWI_SETTINGS) return;

  function enabledItems() {
    if (!cwiOptions || cwiOptions.enabled === false) return [];
    return APPS.filter((item) => CWI_SETTINGS.appEnabled(item.app, cwiOptions));
  }

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
  left: var(--cwi-launcher-center-left, 50%) !important;
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

    for (const item of enabledItems()) {
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

/* Custom launcher hover for replaced tiles.
   Keep the layer centered on the tile, but make it narrower than Google's native launcher hover so the first column does not touch the panel edge. */
a[data-cwi-launcher-app] {
  isolation: isolate !important;
}

a[data-cwi-launcher-app]::after {
  content: "" !important;
  position: absolute !important;
  left: var(--cwi-launcher-center-left, 50%) !important;
  top: 50% !important;
  width: var(--cwi-launcher-hover-size, 84px) !important;
  height: var(--cwi-launcher-hover-size, 84px) !important;
  transform: translate(-50%, -50%) !important;
  border-radius: 18px !important;
  background: rgba(60, 64, 67, 0.08) !important;
  opacity: 0 !important;
  z-index: 0 !important;
  pointer-events: none !important;
  transition: opacity 120ms ease !important;
}

a[data-cwi-launcher-app]:hover::after,
a[data-cwi-launcher-app]:focus::after,
a[data-cwi-launcher-app]:focus-visible::after,
a[data-cwi-launcher-app]:active::after {
  opacity: 1 !important;
}

@media (prefers-color-scheme: dark) {
  a[data-cwi-launcher-app]::after {
    background: rgba(232, 234, 237, 0.12) !important;
  }
}

/* Manté la icona antiga de l'extensió per sobre de la neteja de hover. */
a[data-cwi-launcher-app]::before,
a[data-cwi-launcher-app]:hover::before,
a[data-cwi-launcher-app]:focus::before,
a[data-cwi-launcher-app]:active::before {
  content: "" !important;
  position: absolute !important;
  left: var(--cwi-launcher-center-left, 50%) !important;
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


/* Label alignment v3.14. Keep Google's own text node visible and move only
   the label itself. X is centered on the same column center used by the classic
   icon and hover. Y is aligned to the native Google label row. */
a[data-cwi-launcher-app] [data-cwi-launcher-label-align="1"] {
  transform: translate(
    var(--cwi-launcher-label-shift-x, 0px),
    var(--cwi-launcher-label-shift-y, 0px)
  ) !important;
}
`);

    return rules.join("\n");
  }

  function cleanupPausedPage() {
    document.getElementById("cwi-launcher-css-v30")?.remove();
    document.documentElement?.removeAttribute("data-cwi-launcher-tiles");
    document.documentElement?.removeAttribute("data-cwi-launcher-hidden-parts");
    document.documentElement?.removeAttribute("data-cwi-launcher-url");
    document.documentElement?.removeAttribute("data-cwi-launcher-version");

    document.querySelectorAll("[data-cwi-launcher-custom-label]").forEach((el) => el.remove());

    document.querySelectorAll("[data-cwi-launcher-app], [data-cwi-launcher-original-icon], [data-cwi-launcher-original-bg], [data-cwi-launcher-hover-clean], [data-cwi-launcher-label-clean], [data-cwi-launcher-label-align], [data-cwi-launcher-original-label]").forEach((el) => {
      el.style?.removeProperty("--cwi-launcher-center-left");
      el.style?.removeProperty("--cwi-launcher-label-shift-x");
      el.style?.removeProperty("--cwi-launcher-label-shift-y");
      el.style?.removeProperty("--cwi-launcher-label-top");
      el.style?.removeProperty("--cwi-launcher-label-width");
      el.style?.removeProperty("--cwi-launcher-label-height");
      el.style?.removeProperty("--cwi-launcher-label-line-height");
      el.style?.removeProperty("--cwi-launcher-hover-size");
      el.removeAttribute("data-cwi-launcher-app");
      el.removeAttribute("data-cwi-launcher-original-icon");
      el.removeAttribute("data-cwi-launcher-original-bg");
      el.removeAttribute("data-cwi-launcher-hover-clean");
      el.removeAttribute("data-cwi-launcher-label-clean");
      el.removeAttribute("data-cwi-launcher-label-align");
      el.removeAttribute("data-cwi-launcher-original-label");
    });
  }

  function injectCss() {
    if (cwiShouldPauseOnThisPage() || enabledItems().length === 0) {
      cleanupPausedPage();
      return;
    }

    document.documentElement.setAttribute("data-cwi-launcher-version", VERSION);

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
    tile.style.removeProperty("--cwi-launcher-center-left");
    tile.style.removeProperty("--cwi-launcher-label-shift-x");
    tile.style.removeProperty("--cwi-launcher-label-shift-y");
    tile.style.removeProperty("--cwi-launcher-label-top");
    tile.style.removeProperty("--cwi-launcher-label-width");
    tile.style.removeProperty("--cwi-launcher-label-height");
    tile.style.removeProperty("--cwi-launcher-label-line-height");
    tile.style.removeProperty("--cwi-launcher-hover-size");

    tile.querySelectorAll("[data-cwi-launcher-custom-label]").forEach((el) => el.remove());

    tile.querySelectorAll("[data-cwi-launcher-original-icon], [data-cwi-launcher-original-bg], [data-cwi-launcher-hover-clean], [data-cwi-launcher-label-clean], [data-cwi-launcher-label-align], [data-cwi-launcher-original-label]").forEach((el) => {
      el.removeAttribute("data-cwi-launcher-original-icon");
      el.removeAttribute("data-cwi-launcher-original-bg");
      el.removeAttribute("data-cwi-launcher-hover-clean");
      el.removeAttribute("data-cwi-launcher-label-clean");
      el.removeAttribute("data-cwi-launcher-label-align");
      el.removeAttribute("data-cwi-launcher-original-label");
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


  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2) return sorted[middle];
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function clusterByCenter(items, key, threshold) {
    const clusters = [];

    for (const item of [...items].sort((a, b) => key(a) - key(b))) {
      const value = key(item);
      let best = null;
      let bestDistance = Infinity;

      for (const cluster of clusters) {
        const distance = Math.abs(value - cluster.center);
        if (distance < bestDistance) {
          best = cluster;
          bestDistance = distance;
        }
      }

      if (best && bestDistance <= threshold) {
        best.items.push(item);
        best.center = median(best.items.map(key));
      } else {
        clusters.push({ center: value, items: [item] });
      }
    }

    return clusters;
  }

  function textLooksLikeLauncherLabel(a) {
    const text = String(a.innerText || a.textContent || "").trim();
    if (!text) return false;
    if (text.length > 55) return false;
    if (text.includes("\n") && text.split("\n").length > 3) return false;
    return true;
  }

  function collectLauncherTileCandidates() {
    return Array.from(document.querySelectorAll("a[href]")).filter((a) => {
      if (!(a instanceof HTMLAnchorElement)) return false;
      if (!isVisibleTile(a)) return false;
      if (!textLooksLikeLauncherLabel(a)) return false;

      const href = a.href || "";
      return /google|youtube|youtu\.be/i.test(href);
    });
  }

  function matchesAppSelector(tile, item) {
    for (const selector of item.selectors) {
      try {
        if (tile.matches(selector)) return true;
      } catch (_error) {
        // Static selectors, defensive only.
      }
    }
    return false;
  }

  function isEnabledLauncherTile(tile) {
    return enabledItems().some((item) => matchesAppSelector(tile, item));
  }

  function findClosestLabelRow(tile, labelRows) {
    if (!labelRows || !labelRows.length) return null;

    const tileRect = tile.getBoundingClientRect();
    const tileCy = tileRect.top + tileRect.height / 2;
    let nearest = null;
    let nearestDistance = Infinity;

    for (const row of labelRows) {
      const distance = Math.abs(row.center - tileCy);
      if (distance < nearestDistance) {
        nearest = row;
        nearestDistance = distance;
      }
    }

    if (!nearest) return null;
    if (nearestDistance > Math.max(46, tileRect.height * 0.48)) return null;
    return nearest;
  }

  function computeNativeLauncherLabelRows(targetTiles) {
    const candidates = [];

    for (const tile of collectLauncherTileCandidates()) {
      if (targetTiles?.has(tile)) continue;
      if (isEnabledLauncherTile(tile)) continue;

      const tileRect = tile.getBoundingClientRect();
      const label = findBestLauncherLabel(tile);
      if (!label || label === tile) continue;

      const labelRect = label.getBoundingClientRect();
      if (!visible(labelRect)) continue;

      const text = String(label.innerText || label.textContent || "").trim();
      if (!text || text.length > 55) continue;

      const labelTopInTile = labelRect.top - tileRect.top;
      if (!Number.isFinite(labelTopInTile)) continue;
      if (labelTopInTile < 34 || labelTopInTile > tileRect.height + 8) continue;

      candidates.push({
        center: tileRect.top + tileRect.height / 2,
        labelViewportTop: labelRect.top,
        labelHeight: Math.max(18, Math.ceil(labelRect.height || 20))
      });
    }

    if (!candidates.length) return [];

    return clusterByCenter(candidates, (item) => item.center, 42)
      .map((cluster) => ({
        center: median(cluster.items.map((item) => item.center)),
        labelViewportTop: median(cluster.items.map((item) => item.labelViewportTop)),
        labelHeight: Math.max(18, Math.round(median(cluster.items.map((item) => item.labelHeight)) || 20))
      }));
  }

  function computeLauncherColumnCenters() {
    const candidates = collectLauncherTileCandidates().map((tile) => {
      const rect = tile.getBoundingClientRect();
      return {
        tile,
        rect,
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2
      };
    });

    if (candidates.length < 3) return null;

    const rowClusters = clusterByCenter(candidates, (item) => item.cy, 42)
      .filter((cluster) => cluster.items.length >= 2);

    const normalizedCandidates = rowClusters.length ? rowClusters.flatMap((cluster) => cluster.items) : candidates;
    const columnClusters = clusterByCenter(normalizedCandidates, (item) => item.cx, 44)
      .filter((cluster) => cluster.items.length >= 1)
      .sort((a, b) => a.center - b.center);

    if (columnClusters.length < 2) return null;

    return columnClusters.map((cluster) => ({
      center: median(cluster.items.map((item) => item.cx)),
      count: cluster.items.length
    }));
  }

  function alignTileToGridColumn(tile, columnCenters) {
    if (!columnCenters || columnCenters.length < 2) return;

    const tileRect = tile.getBoundingClientRect();
    const tileCenterX = tileRect.left + tileRect.width / 2;
    let nearest = null;
    let nearestDistance = Infinity;

    for (const column of columnCenters) {
      const distance = Math.abs(column.center - tileCenterX);
      if (distance < nearestDistance) {
        nearest = column;
        nearestDistance = distance;
      }
    }

    if (!nearest) return;
    if (nearestDistance > Math.max(58, tileRect.width * 0.72)) return;

    const centerLeft = nearest.center - tileRect.left;
    if (!Number.isFinite(centerLeft)) return;
    if (centerLeft < -20 || centerLeft > tileRect.width + 20) return;

    const roundedCenterLeft = Math.round(centerLeft * 100) / 100;
    const labelShiftX = centerLeft - tileRect.width / 2;
    const roundedLabelShiftX = Math.round(labelShiftX * 100) / 100;

    tile.style.setProperty("--cwi-launcher-center-left", `${roundedCenterLeft}px`);
    tile.style.setProperty("--cwi-launcher-label-shift-x", `${roundedLabelShiftX}px`);
  }

  function findBestLauncherLabel(tile) {
    const tileRect = tile.getBoundingClientRect();
    const tileText = String(tile.innerText || tile.textContent || "").trim();
    if (!tileText) return null;

    const candidates = [];

    for (const el of Array.from(tile.querySelectorAll("*"))) {
      if (el.hasAttribute("data-cwi-launcher-custom-label")) continue;

      const text = String(el.innerText || el.textContent || "").trim();
      if (!text) continue;
      if (text.length > 55) continue;

      const r = el.getBoundingClientRect();
      if (!visible(r)) continue;

      const cy = r.top + r.height / 2;
      const within =
        r.left >= tileRect.left - 6 &&
        r.right <= tileRect.right + 6 &&
        r.top >= tileRect.top - 4 &&
        r.bottom <= tileRect.bottom + 6;

      if (!within) continue;
      if (cy < tileRect.top + tileRect.height * 0.42) continue;
      if (r.height > 44) continue;

      const childrenWithSameText = Array.from(el.children || []).filter((child) => {
        const childText = String(child.innerText || child.textContent || "").trim();
        return childText === text;
      });

      // Prefer the innermost visible label node so the shift is applied only once.
      const score =
        Math.abs((r.left + r.width / 2) - (tileRect.left + tileRect.width / 2)) +
        Math.max(0, r.width - 92) * 0.4 +
        childrenWithSameText.length * 100 +
        Math.max(0, 18 - r.height) * 0.2;

      candidates.push({ el, score });
    }

    candidates.sort((a, b) => a.score - b.score);
    return candidates[0]?.el || null;
  }

  function isTransparentColor(value) {
    const color = String(value || "").trim().toLowerCase();
    return !color ||
      color === "transparent" ||
      color === "rgba(0, 0, 0, 0)" ||
      /rgba\([^)]*,\s*0\s*\)$/i.test(color);
  }

  function applyLabelTypography(source, target, labelRect, tile) {
    const style = getComputedStyle(source);
    const props = [
      "font-family",
      "font-size",
      "font-weight",
      "font-style",
      "letter-spacing",
      "text-transform",
      "text-decoration"
    ];

    for (const prop of props) {
      const value = style.getPropertyValue(prop);
      if (value) target.style.setProperty(prop, value, "important");
    }

    const sourceColor = style.getPropertyValue("color");
    const tileColor = tile ? getComputedStyle(tile).getPropertyValue("color") : "";
    const safeColor = !isTransparentColor(sourceColor)
      ? sourceColor
      : (!isTransparentColor(tileColor) ? tileColor : "rgb(32, 33, 36)");
    target.style.setProperty("color", safeColor, "important");

    const lineHeight = style.getPropertyValue("line-height");
    const fallbackLineHeight = `${Math.max(18, Math.round(labelRect.height || 20))}px`;
    target.style.setProperty("line-height", lineHeight && lineHeight !== "normal" ? lineHeight : fallbackLineHeight, "important");
  }

  function markLauncherLabel(tile, labelRows) {
    const label = findBestLauncherLabel(tile);
    if (!label || label === tile) return;

    const tileRect = tile.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const row = findClosestLabelRow(tile, labelRows);

    // X correction: center the native label node on exactly the same column center
    // already used for the classic icon and hover. In your measurements, Drive and
    // Calendar had labelRect.x equal to tile.x, with a 76 px label inside an 88 px
    // tile. That makes the label center 6 px too far left. This fixes that
    // generally from live geometry, not from app names.
    const configuredCenterLeft = Number.parseFloat(tile.style.getPropertyValue("--cwi-launcher-center-left"));
    const targetCenterX = tileRect.left + (Number.isFinite(configuredCenterLeft) ? configuredCenterLeft : tileRect.width / 2);
    const currentLabelCenterX = labelRect.left + labelRect.width / 2;
    let shiftX = targetCenterX - currentLabelCenterX;

    // Y correction: align to the native Google labels in the same row.
    let shiftY = 0;
    if (row && Number.isFinite(row.labelViewportTop)) {
      shiftY = row.labelViewportTop - labelRect.top;
    }

    // Avoid wild movements if Google changes the launcher layout. We only fix small
    // label mismatches, not full layout changes.
    if (!Number.isFinite(shiftX) || Math.abs(shiftX) > 18) shiftX = 0;
    if (!Number.isFinite(shiftY) || Math.abs(shiftY) > 14) shiftY = 0;

    tile.style.setProperty("--cwi-launcher-label-shift-x", `${Math.round(shiftX * 100) / 100}px`);
    tile.style.setProperty("--cwi-launcher-label-shift-y", `${Math.round(shiftY * 100) / 100}px`);
    label.setAttribute("data-cwi-launcher-label-align", "1");
    label.setAttribute("data-cwi-launcher-label-clean", "1");
  }

  function applySquareHoverGeometry(tile) {
    const tileRect = tile.getBoundingClientRect();
    if (!visible(tileRect)) return;

    // Build the hover from a fixed square icon slot instead of from the full
    // tile height. This keeps all replaced launcher tiles visually consistent
    // even when Google gives some tiles a slightly shorter overall box.
    const size = Math.max(78, Math.min(84, Math.round(tileRect.width - 4)));
    tile.style.setProperty("--cwi-launcher-hover-size", `${size}px`);
  }

  function markOriginalIconParts(tile, columnCenters) {
    clearOldMarks(tile);
    alignTileToGridColumn(tile, columnCenters);
    applySquareHoverGeometry(tile);

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
    if (cwiShouldPauseOnThisPage() || enabledItems().length === 0) {
      cleanupPausedPage();
      return;
    }

    let count = 0;
    let hiddenParts = 0;
    const columnCenters = computeLauncherColumnCenters();
    const targets = [];
    const targetTiles = new Set();

    // First collect and restore target tiles. Then measure native, non-replaced labels
    // in the same launcher rows. This keeps the v1.0.12 horizontal centering intact
    // and only computes a vertical correction for the real Google text nodes.
    for (const item of enabledItems()) {
      for (const selector of item.selectors) {
        const nodes = Array.from(document.querySelectorAll(selector));

        for (const a of nodes) {
          if (!(a instanceof HTMLAnchorElement)) continue;
          if (!isVisibleTile(a)) continue;
          if (targetTiles.has(a)) continue;

          clearOldMarks(a);
          a.dataset.cwiLauncherApp = item.app;
          targets.push({ tile: a, app: item.app });
          targetTiles.add(a);
        }
      }
    }

    const labelRows = computeNativeLauncherLabelRows(targetTiles);

    for (const target of targets) {
      const a = target.tile;
      a.dataset.cwiLauncherApp = target.app;
      hiddenParts += markOriginalIconParts(a, columnCenters);
      markLauncherLabel(a, labelRows);
      count += 1;
    }


    // Marca possibles contenidors del label o hover inferior.
    // Ho fem per tots els iconos canviats.
    for (const target of targets) {
      const a = target.tile;
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
          // Do not overwrite transform on the actual aligned label after markLauncherLabel.
          if (!el.hasAttribute("data-cwi-launcher-label-align")) {
            el.setAttribute("data-cwi-launcher-label-clean", "1");
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

  function stop() {
    started = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (midnightTimer) {
      clearTimeout(midnightTimer);
      midnightTimer = null;
    }
    cleanupPausedPage();
  }

  function start() {
    if (cwiShouldPauseOnThisPage() || enabledItems().length === 0) {
      stop();
      return;
    }

    injectCss();
    markTiles();
    scheduleMidnightRefresh();

    if (started) return;
    started = true;

    observer = new MutationObserver(() => schedule(60));
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "style", "class", "aria-label", "title", "src", "srcset"]
    });

    [100, 250, 500, 1000, 2000, 4000].forEach((ms) => setTimeout(() => {
      if (enabledItems().length === 0 || cwiShouldPauseOnThisPage()) {
        cleanupPausedPage();
        return;
      }
      injectCss();
      markTiles();
    }, ms));
  }

  CWI_SETTINGS.getOptions().then((options) => {
    cwiOptions = CWI_SETTINGS.normalizeOptions(options);

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

    chrome.storage?.onChanged?.addListener((changes, areaName) => {
      if (areaName !== "sync" || !changes.cwiOptions) return;
      cwiOptions = CWI_SETTINGS.normalizeOptions(changes.cwiOptions.newValue);

      cleanupPausedPage();
      if (enabledItems().length === 0 || cwiShouldPauseOnThisPage()) {
        stop();
      } else {
        start();
        schedule(20);
      }
    });

    setInterval(checkDay, 60 * 1000);
  });
})();
