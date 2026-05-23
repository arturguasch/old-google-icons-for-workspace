(() => {
  // Classic Workspace Icons, header icon only.
  // v3.0: si el logo original és només icona, l'amaga i posa el nostre amb fons transparent.
  // Només usa un pegat amb color de fons quan Google posa icona i text en una mateixa imatge.

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

  let scheduled = false;
  let lastDay = null;
  let midnightTimer = null;

  function injectStyle() {
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

    if (rect.left < 90) score += 10;
    if (rect.top < 70) score += 10;
    if (rect.width <= 80) score += 8;

    if (["docs", "sheets", "slides", "forms"].includes(APP) && rect.left < 80 && rect.top < 55) {
      score += 18;
    }

    return score;
  }

  function selectorsForApp() {
    const common = [
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

  function findHeaderLogoElement() {
    let candidates = [];

    for (const selector of selectorsForApp()) {
      try {
        candidates = candidates.concat(Array.from(document.querySelectorAll(selector)));
      } catch (_) {}
    }

    candidates = Array.from(new Set(candidates));

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

    const fallback = Array.from(document.querySelectorAll("img, svg, image, [role='img']"))
      .filter((el) => rectLooksLikeHeaderLogo(el.getBoundingClientRect()))
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

  function apply() {
    if (!document.body) return;

    injectStyle();

    const target = findHeaderLogoElement();
    const overlay = ensureOverlay();

    if (!target) {
      overlay.style.display = "none";
      return;
    }

    const rect = target.getBoundingClientRect();
    if (!rectLooksLikeHeaderLogo(rect)) {
      overlay.style.display = "none";
      return;
    }

    clearOldMarks();

    const singleIcon = looksLikeSingleIcon(target, rect);
    const gmailLockup = APP === "gmail" && !singleIcon && rect.width > 65;

    if (gmailLockup) {
      target.setAttribute("data-cwi-header-original-lockup", "1");
    } else if (singleIcon) {
      target.setAttribute("data-cwi-header-original-icon", "1");
    }

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

    const observer = new MutationObserver(() => schedule(120));
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "href", "alt", "aria-label", "title", "style", "class"]
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
