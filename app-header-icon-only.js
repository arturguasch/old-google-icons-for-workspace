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

  // Classic Workspace Icons, header icon only.
  // v3.2: detecció ampliada només per Docs, Sheets i Slides. Evita parpelleig a la resta d'apps.

  const APPS = {
    gmail: {
      icon: "icons/gmail-classic.svg",
      hosts: ["mail.google.com"],
      keywords: ["gmail", "mail", "logo_gmail", "gmail_lockup", "mail/rfr"],
      maxLeft: 230,
      maxTop: 95,
      minScore: 30,
      sizeMin: 30,
      sizeMax: 36
    },
    drive: {
      icon: "icons/drive-classic.svg",
      hosts: ["drive.google.com"],
      keywords: ["drive", "logo_drive", "drive_2020q4", "drive-product-icon"],
      maxLeft: 240,
      maxTop: 95,
      minScore: 20,
      sizeMin: 30,
      sizeMax: 38
    },
    calendar: {
      hosts: ["calendar.google.com"],
      keywords: ["calendar", "calendari", "calendario", "logo_calendar", "calendar_2020q4"],
      maxLeft: 260,
      maxTop: 100,
      minScore: 20,
      sizeMin: 30,
      sizeMax: 38
    },
    docs: {
      icon: "icons/docs-classic.svg",
      urlIncludes: ["docs.google.com/document"],
      keywords: ["docs", "documents", "documentos", "document", "logo_docs", "docs_2020q4"],
      maxLeft: 210,
      maxTop: 90,
      minScore: 12,
      sizeMin: 24,
      sizeMax: 34
    },
    sheets: {
      icon: "icons/sheets-classic.svg",
      urlIncludes: ["docs.google.com/spreadsheets"],
      keywords: ["sheets", "fulls", "hojas", "spreadsheet", "spreadsheets", "logo_sheets", "sheets_2020q4"],
      maxLeft: 210,
      maxTop: 90,
      minScore: 12,
      sizeMin: 24,
      sizeMax: 34
    },
    slides: {
      icon: "icons/slides-classic.svg",
      urlIncludes: ["docs.google.com/presentation"],
      keywords: ["slides", "presentacions", "presentaciones", "presentation", "logo_slides", "slides_2020q4"],
      maxLeft: 210,
      maxTop: 90,
      minScore: 12,
      sizeMin: 24,
      sizeMax: 34
    },
    forms: {
      icon: "icons/forms-classic.png",
      urlIncludes: ["docs.google.com/forms"],
      keywords: ["forms", "formularis", "formularios", "form", "google forms"],
      maxLeft: 230,
      maxTop: 100,
      minScore: 12,
      sizeMin: 24,
      sizeMax: 36
    },
    meet: {
      icon: "icons/meet-classic.svg",
      hosts: ["meet.google.com"],
      keywords: ["meet", "logo_meet", "meet_2020q4"],
      maxLeft: 260,
      maxTop: 110,
      minScore: 18,
      sizeMin: 30,
      sizeMax: 40
    },
    chat: {
      icon: "icons/chat-classic.svg",
      hosts: ["chat.google.com"],
      keywords: ["chat", "xat", "logo_chat", "chat_2020q4"],
      maxLeft: 260,
      maxTop: 110,
      minScore: 18,
      sizeMin: 30,
      sizeMax: 40
    },
    keep: {
      icon: "icons/keep-classic.svg",
      hosts: ["keep.google.com"],
      keywords: ["keep", "notes", "logo_keep", "keep_2020q4"],
      maxLeft: 260,
      maxTop: 110,
      minScore: 18,
      sizeMin: 30,
      sizeMax: 40
    },
    maps: {
      icon: "icons/maps-classic.png",
      hosts: ["maps.google.com"],
      urlIncludes: ["www.google.com/maps"],
      keywords: ["maps", "mapes", "mapas", "google maps", "logo_maps"],
      maxLeft: 300,
      maxTop: 120,
      minScore: 14,
      sizeMin: 30,
      sizeMax: 42
    }
  };

  function currentApp() {
    const host = location.hostname;
    const href = location.href;

    for (const [name, cfg] of Object.entries(APPS)) {
      if (cfg.hosts?.includes(host)) return name;
      if (cfg.urlIncludes?.some((part) => href.includes(part))) return name;
    }

    return null;
  }

  const APP = currentApp();
  if (!APP) return;

  const CFG = APPS[APP];
  const OVERLAY_ID = `classic-workspace-${APP}-header-icon-overlay`;
  const USE_EXTENDED_DETECTION = ["docs", "sheets", "slides", "forms"].includes(APP);

  let scheduled = false;
  let lastDay = null;
  let midnightTimer = null;
  let missingTargetCount = 0;

  function injectStyle() {
    if (USE_EXTENDED_DETECTION && document.documentElement) {
      document.documentElement.setAttribute("data-cwi-header-css-detection", "1");
    }

    if (document.getElementById("classic-workspace-header-icon-style-v30")) return;

    const style = document.createElement("style");
    style.id = "classic-workspace-header-icon-style-v30";
    style.textContent = `
      [data-cwi-header-original-icon="1"],
      [data-cwi-header-original-lockup="1"] {
        opacity: 0 !important;
        visibility: hidden !important;
      }
      [data-cwi-header-original-icon="1"] *,
      [data-cwi-header-original-lockup="1"] * {
        opacity: 0 !important;
        visibility: hidden !important;
      }
      html[data-cwi-header-css-detection="1"] [data-cwi-header-original-icon="1"]::before,
      html[data-cwi-header-css-detection="1"] [data-cwi-header-original-icon="1"]::after,
      html[data-cwi-header-css-detection="1"] [data-cwi-header-original-lockup="1"]::before,
      html[data-cwi-header-css-detection="1"] [data-cwi-header-original-lockup="1"]::after {
        opacity: 0 !important;
        visibility: hidden !important;
        background-image: none !important;
        -webkit-mask-image: none !important;
        mask-image: none !important;
        content: none !important;
      }
      .cwi-gmail-lockup-v32 {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        background: transparent !important;
        white-space: nowrap !important;
      }
      .cwi-gmail-lockup-v32 img {
        width: 32px !important;
        height: 32px !important;
        object-fit: contain !important;
        display: block !important;
        flex: 0 0 auto !important;
      }
      .cwi-gmail-lockup-v32 span {
        font-family: "Google Sans", Roboto, Arial, sans-serif !important;
        font-size: 22px !important;
        line-height: 1 !important;
        font-weight: 400 !important;
        letter-spacing: -0.2px !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function day() {
    return new Date().getDate();
  }

  function iconPath(app) {
    if (app === "calendar") return `icons/calendar-${pad2(day())}.webp`;
    return APPS[app].icon;
  }

  function iconUrl(app) {
    return chrome.runtime.getURL(iconPath(app));
  }

  function isTransparent(color) {
    return !color || color === "transparent" || color === "rgba(0, 0, 0, 0)";
  }

  function nearestBackground(el) {
    let node = el;
    for (let i = 0; node && i < 10; i += 1, node = node.parentElement) {
      const style = getComputedStyle(node);
      const color = style.backgroundColor;
      if (!isTransparent(color)) return color;
    }

    const bodyColor = document.body ? getComputedStyle(document.body).backgroundColor : "";
    if (!isTransparent(bodyColor)) return bodyColor;

    const htmlColor = getComputedStyle(document.documentElement).backgroundColor;
    if (!isTransparent(htmlColor)) return htmlColor;

    return "#f6f8fc";
  }

  function parseRgb(color) {
    const match = String(color || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }

  function luminance(rgb) {
    if (!rgb) return 1;
    const [r, g, b] = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function isDarkPage() {
    const bg = nearestBackground(document.body || document.documentElement);
    return luminance(parseRgb(bg)) < 0.35;
  }

  function gmailTextColor(target) {
    let node = target;
    for (let i = 0; node && i < 8; i += 1, node = node.parentElement) {
      const color = getComputedStyle(node).color;
      const rgb = parseRgb(color);
      if (rgb) {
        const lum = luminance(rgb);
        if (lum > 0.15 || isDarkPage()) return color;
      }
    }
    return isDarkPage() ? "#e8eaed" : "#5f6368";
  }

  function clearHeaderMarks() {
    document.querySelectorAll("[data-cwi-header-original-icon='1'], [data-cwi-header-original-lockup='1']").forEach((el) => {
      el.removeAttribute("data-cwi-header-original-icon");
      el.removeAttribute("data-cwi-header-original-lockup");
    });
  }

  function normalized(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function rectLooksLikeHeaderLogo(rect) {
    if (!rect) return false;
    if (rect.width < 14 || rect.width > 240) return false;
    if (rect.height < 14 || rect.height > 86) return false;
    if (rect.left < 0 || rect.left > CFG.maxLeft) return false;
    if (rect.top < 0 || rect.top > CFG.maxTop) return false;
    return true;
  }

  function nodeText(node) {
    const parts = [];
    if (!node) return "";

    for (let i = 0, el = node; el && i < 7; i += 1, el = el.parentElement) {
      parts.push(el.getAttribute?.("src"));
      parts.push(el.getAttribute?.("href"));
      parts.push(el.getAttribute?.("xlink:href"));
      parts.push(el.getAttribute?.("alt"));
      parts.push(el.getAttribute?.("aria-label"));
      parts.push(el.getAttribute?.("title"));
      parts.push(el.getAttribute?.("data-tooltip"));
      parts.push(el.getAttribute?.("data-ogsr-up"));
      parts.push(el.className);
      parts.push(el.id);
    }

    return normalized(parts.filter(Boolean).join(" "));
  }

  function meaningfulInnerText(el) {
    return String(el.innerText || el.textContent || "").trim();
  }

  function styleLooksLikeIcon(el) {
    try {
      const style = getComputedStyle(el);
      if (style.backgroundImage && style.backgroundImage !== "none") return true;
      if (style.maskImage && style.maskImage !== "none") return true;
      if (style.webkitMaskImage && style.webkitMaskImage !== "none") return true;

      const before = getComputedStyle(el, "::before");
      const after = getComputedStyle(el, "::after");

      if (before.backgroundImage && before.backgroundImage !== "none") return true;
      if (after.backgroundImage && after.backgroundImage !== "none") return true;
      if (before.webkitMaskImage && before.webkitMaskImage !== "none") return true;
      if (after.webkitMaskImage && after.webkitMaskImage !== "none") return true;
    } catch (_) {}

    return false;
  }

  function scoreCandidate(el) {
    const rect = el.getBoundingClientRect();
    if (!rectLooksLikeHeaderLogo(rect)) return -1;

    const text = nodeText(el);
    let score = 0;

    for (const keyword of CFG.keywords) {
      if (text.includes(normalized(keyword))) score += 25;
    }

    const tag = el.tagName?.toLowerCase();
    if (tag === "img") score += 12;
    if (tag === "svg") score += 8;
    if (tag === "image") score += 8;

    if (USE_EXTENDED_DETECTION) {
      if (styleLooksLikeIcon(el)) score += 16;

      const classAndId = normalized(`${el.className || ""} ${el.id || ""}`);
      if (/docs.*icon|icon.*docs|product.*icon|app.*icon|logo/.test(classAndId)) score += 14;

      const innerText = meaningfulInnerText(el);
      if (APP !== "gmail" && innerText.length > 3 && rect.width > 70) score -= 24;
    }

    if (rect.left < 90) score += 10;
    if (rect.top < 70) score += 10;
    if (rect.width <= 80) score += 8;

    if (["docs", "sheets", "slides", "forms"].includes(APP) && rect.left < 80 && rect.top < 55) {
      score += 18;
    }

    return score;
  }

  function selectorsForApp() {
    const common = USE_EXTENDED_DETECTION ? [
      "img",
      "svg",
      "image",
      "[role='img']",
      "[class*='docs-icon' i]",
      "[class*='product-icon' i]",
      "[class*='app-icon' i]",
      "[class*='logo' i]"
    ] : [
      "img",
      "svg",
      "image",
      "[role='img']"
    ];

    const specific = CFG.keywords.flatMap((keyword) => {
      const k = keyword.replace(/"/g, '\\"');
      return [
        `img[src*="${k}" i]`,
        `img[alt*="${k}" i]`,
        `[aria-label*="${k}" i] img`,
        `[aria-label*="${k}" i] svg`,
        `[title*="${k}" i] img`,
        `[title*="${k}" i] svg`
      ];
    });

    return Array.from(new Set([...specific, ...common]));
  }

  function pointCandidates() {
    if (!USE_EXTENDED_DETECTION) return [];

    const found = new Set();
    const maxX = Math.min(CFG.maxLeft, Math.max(90, Math.round(window.innerWidth * 0.28)));
    const maxY = Math.min(CFG.maxTop, 100);

    try {
      for (let x = 4; x <= maxX; x += 12) {
        for (let y = 4; y <= maxY; y += 12) {
          for (const el of document.elementsFromPoint(x, y)) {
            if (!el || el === document.documentElement || el === document.body) continue;
            found.add(el);
          }
        }
      }
    } catch (_) {}

    return Array.from(found);
  }

  function findHeaderLogoElement() {
    let candidates = [];

    for (const selector of selectorsForApp()) {
      try {
        candidates = candidates.concat(Array.from(document.querySelectorAll(selector)));
      } catch (_) {}
    }

    candidates = Array.from(new Set(candidates.concat(pointCandidates())));

    let best = null;
    let bestScore = -1;

    for (const el of candidates) {
      const score = scoreCandidate(el);
      if (score > bestScore) {
        best = el;
        bestScore = score;
      }
    }

    if (best && bestScore >= CFG.minScore) return best;

    const fallbackSelector = USE_EXTENDED_DETECTION
      ? "img, svg, image, [role='img'], [class*='docs-icon' i], [class*='product-icon' i], [class*='app-icon' i], [class*='logo' i]"
      : "img, svg, image, [role='img']";

    const fallback = Array.from(new Set([
      ...document.querySelectorAll(fallbackSelector),
      ...pointCandidates()
    ]))
      .filter((el) => rectLooksLikeHeaderLogo(el.getBoundingClientRect()))
      .filter((el) => !USE_EXTENDED_DETECTION || APP === "gmail" || !(meaningfulInnerText(el).length > 3 && el.getBoundingClientRect().width > 70))
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (ar.left + ar.top) - (br.left + br.top);
      })[0];

    return fallback || null;
  }

  function looksLikeSingleIcon(target, rect) {
    // Si és estret, normalment és una icona independent. Llavors podem amagar l'original
    // i deixar el nostre overlay amb fons transparent, que és millor en mode fosc.
    if (rect.width <= 58) return true;

    // Docs, Sheets, Slides, Forms i Calendar solen tenir la icona separada del text.
    if (["docs", "sheets", "slides", "forms", "calendar", "drive", "meet", "chat", "keep", "maps"].includes(APP) && rect.width <= 90) {
      return true;
    }

    return false;
  }

  function clearOldMarks() {
    clearHeaderMarks();
  }

  function markOriginal(target, attr) {
    const iconAttr = "data-cwi-header-original-icon";
    const lockupAttr = "data-cwi-header-original-lockup";

    document.querySelectorAll("[data-cwi-header-original-icon='1'], [data-cwi-header-original-lockup='1']").forEach((el) => {
      if (el !== target || !attr) {
        el.removeAttribute(iconAttr);
        el.removeAttribute(lockupAttr);
        return;
      }

      if (attr === iconAttr) el.removeAttribute(lockupAttr);
      if (attr === lockupAttr) el.removeAttribute(iconAttr);
    });

    if (attr && target.getAttribute(attr) !== "1") {
      target.setAttribute(attr, "1");
    }
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.position = "fixed";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "2147483647";
    overlay.style.backgroundRepeat = "no-repeat";
    overlay.style.backgroundPosition = "center";
    overlay.style.backgroundSize = "contain";
    overlay.style.display = "none";

    document.documentElement.appendChild(overlay);
    return overlay;
  }

  function setOverlayAsIcon(overlay, icon, size) {
    overlay.className = "";
    overlay.textContent = "";
    overlay.style.backgroundImage = `url("${icon}")`;
    overlay.style.backgroundRepeat = "no-repeat";
    overlay.style.backgroundPosition = "center";
    overlay.style.backgroundSize = "contain";
    overlay.style.width = `${size}px`;
    overlay.style.height = `${size}px`;
  }

  function setOverlayAsGmailLockup(overlay, target, size) {
    overlay.className = "cwi-gmail-lockup-v32";
    overlay.style.backgroundImage = "none";
    overlay.style.width = "auto";
    overlay.style.height = `${size}px`;

    let img = overlay.querySelector("img");
    let span = overlay.querySelector("span");

    if (!img) {
      img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      overlay.appendChild(img);
    }

    if (!span) {
      span = document.createElement("span");
      span.textContent = "Gmail";
      overlay.appendChild(span);
    }

    img.src = iconUrl("gmail");
    span.style.color = gmailTextColor(target);
  }

  function cleanupPausedPage() {
    document.getElementById(OVERLAY_ID)?.remove();
    document.getElementById("classic-workspace-header-icon-style-v30")?.remove();
    clearHeaderMarks();
    document.documentElement?.removeAttribute("data-cwi-header-css-detection");
  }

  function apply() {
    if (!document.body) return;

    if (cwiShouldPauseOnThisPage()) {
      cleanupPausedPage();
      return;
    }

    injectStyle();

    const target = findHeaderLogoElement();
    const overlay = ensureOverlay();

    if (!target) {
      missingTargetCount += 1;
      if (missingTargetCount >= 3) overlay.style.display = "none";
      return;
    }

    const rect = target.getBoundingClientRect();
    if (!rectLooksLikeHeaderLogo(rect)) {
      missingTargetCount += 1;
      if (missingTargetCount >= 3) overlay.style.display = "none";
      return;
    }

    missingTargetCount = 0;

    const singleIcon = looksLikeSingleIcon(target, rect);
    const gmailLockup = APP === "gmail" && !singleIcon && rect.width > 65;
    const markAttr = gmailLockup
      ? "data-cwi-header-original-lockup"
      : singleIcon
        ? "data-cwi-header-original-icon"
        : null;

    markOriginal(target, markAttr);

    const rawSize = rect.width <= 58 ? Math.min(rect.width, rect.height) : rect.height * 0.84;
    const size = Math.max(CFG.sizeMin, Math.min(CFG.sizeMax, Math.round(rawSize)));
    const coverWidth = singleIcon ? size : Math.max(size, Math.min(42, Math.round(size * 1.12)));

    const left = Math.round(rect.left);
    const top = Math.round(rect.top + (rect.height - size) / 2);

    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;

    if (gmailLockup) {
      // En mode fosc això evita el pegat rectangular.
      // Amaguem el lockup original sencer i pintem un lockup propi transparent.
      setOverlayAsGmailLockup(overlay, target, size);
      overlay.style.backgroundColor = "transparent";
    } else {
      setOverlayAsIcon(overlay, iconUrl(APP), singleIcon ? size : coverWidth);
      overlay.style.width = `${coverWidth}px`;
      overlay.style.height = `${size}px`;
      // Fix mode fosc general:
      // si és icona independent, el fons és transparent. Si és lockup parcial,
      // usem el fons real de la zona per tapar només la icona antiga.
      overlay.style.backgroundColor = singleIcon ? "transparent" : nearestBackground(target);
    }

    overlay.style.display = "block";

    if (APP === "calendar") lastDay = day();
  }

  function schedule(delay = 80) {
    if (scheduled) return;
    scheduled = true;

    setTimeout(() => {
      scheduled = false;
      apply();
    }, delay);
  }

  function checkDay() {
    if (APP !== "calendar") return;
    if (lastDay !== day()) apply();
  }

  function scheduleMidnightRefresh() {
    if (APP !== "calendar") return;

    if (midnightTimer) clearTimeout(midnightTimer);

    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0);

    midnightTimer = setTimeout(() => {
      lastDay = null;
      apply();
      scheduleMidnightRefresh();
    }, Math.max(1000, next.getTime() - now.getTime()));
  }

  function start() {
    apply();
    scheduleMidnightRefresh();

    const observer = new MutationObserver((mutations) => {
      const onlyOurOverlay = mutations.every((mutation) => {
        const target = mutation.target;
        return target?.id === OVERLAY_ID || target?.id === "classic-workspace-header-icon-style-v30";
      });

      if (!onlyOurOverlay) schedule(160);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: USE_EXTENDED_DETECTION
        ? ["src", "srcset", "href", "alt", "aria-label", "title", "style", "class"]
        : ["src", "srcset", "href", "alt", "aria-label", "title"]
    });

    [200, 500, 1000, 2000, 4000, 7000].forEach((ms) => setTimeout(apply, ms));

    if (APP === "calendar") {
      setInterval(checkDay, 60 * 1000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("load", () => schedule(150), { once: true });
  window.addEventListener("resize", () => schedule(50));
  window.addEventListener("popstate", () => schedule(80));
  window.addEventListener("hashchange", () => schedule(80));
  window.addEventListener("focus", () => {
    checkDay();
    schedule(100);
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkDay();
      schedule(100);
    }
  });
})();
