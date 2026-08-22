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

  const CWI_SETTINGS = globalThis.__CWI_SETTINGS__;
  if (!CWI_SETTINGS) return;

  const APP_KEY = "ring";

  // Verification palette. Set to false to ship the real classic ring colours.
  const TEST_MODE = false;

  const CLASSIC = {
    yellow: "#F6AD01",
    green: "#249A41",
    blue: "#3174F1",
    red: "#E92D18"
  };

  const TEST = {
    yellow: "#FF00FF",
    green: "#00FFFF",
    blue: "#FF8800",
    red: "#AA00FF"
  };

  function colorFor(slot) {
    return TEST_MODE ? TEST[slot] : CLASSIC[slot];
  }

  // Arc geometry of the classic multicolour account ring, keyed by viewBox.
  // 40x40 is the header ring, 88x88 the large ring inside the account bubble.
  const RING_TEMPLATES = {
    "0 0 40 40": [
      { slot: "yellow", d: "M4.02,28.27C2.73,25.8,2,22.98,2,20c0-2.87,0.68-5.59,1.88-8l-1.72-1.04C0.78,13.67,0,16.75,0,20c0,3.31,0.8,6.43,2.23,9.18L4.02,28.27z" },
      { slot: "green", d: "M32.15,33.27C28.95,36.21,24.68,38,20,38c-6.95,0-12.98-3.95-15.99-9.73l-1.79,0.91C5.55,35.61,12.26,40,20,40c5.2,0,9.93-1.98,13.48-5.23L32.15,33.27z" },
      { slot: "blue", d: "M33.49,34.77C37.49,31.12,40,25.85,40,20c0-5.86-2.52-11.13-6.54-14.79l-1.37,1.46C35.72,9.97,38,14.72,38,20c0,5.25-2.26,9.98-5.85,13.27L33.49,34.77z" },
      { slot: "red", d: "M20,2c4.65,0,8.89,1.77,12.09,4.67l1.37-1.46C29.91,1.97,25.19,0,20,0l0,0C12.21,0,5.46,4.46,2.16,10.96L3.88,12C6.83,6.08,12.95,2,20,2" }
    ],
    "0 0 88 88": [
      { slot: "red", d: "M6.54186 25.1943C13.4332 11.4946 27.619 2.09524 44.0001 2.09524C54.8512 2.09524 64.7391 6.21967 72.1814 12.9864L73.6119 11.4618C65.8019 4.33354 55.4184 0 44.0002 0C26.862 0 12.012 9.81177 4.75195 24.1118L6.54186 25.1943Z" },
      { slot: "blue", d: "M72.2777 74.9259C80.6525 67.264 85.9049 56.2454 85.9049 44C85.9049 31.7078 80.6122 20.6517 72.1814 12.9863L73.6118 11.4618C82.4565 19.5136 88.0001 31.13 88.0001 44C88.0001 56.87 82.4783 68.4636 73.6783 76.4936L72.2777 74.9259Z" },
      { slot: "green", d: "M6.7633 63.2399L4.88354 64.1953C12.21 78.3418 26.9718 87.9989 44 87.9989C55.44 87.9989 65.8465 83.6424 73.6565 76.4924L72.2718 74.9311C64.8192 81.7468 54.8952 85.9048 43.9999 85.9048C27.7925 85.9048 13.734 76.7036 6.7633 63.2399Z" },
      { slot: "yellow", d: "M6.54202 25.1938L4.75292 24.1118C1.71646 30.0736 0 36.85 0 44C0 51.15 1.76 58.1465 4.90646 64.1965L6.76859 63.25C3.78227 57.4858 2.09524 50.9399 2.09524 44C2.09524 37.2376 3.69708 30.8493 6.54202 25.1938Z" }
    ]
  };

  const SVG_NS = "http://www.w3.org/2000/svg";
  const CLASSIC_FILLS = Object.values(CLASSIC).map((c) => c.toLowerCase());
  const SLOT_BY_CLASSIC_FILL = Object.fromEntries(
    Object.entries(CLASSIC).map(([slot, hex]) => [hex.toLowerCase(), slot])
  );

  const ACCOUNT_LABEL = /google account|cuenta de google|compte de google|conta do google|compte google|google-konto|google 帐号|google アカウント/i;
  const RING_IMG_RE = /(?:ssl|www)\.gstatic\.com\/gb\/images\/ring\//i;
  const EXT_RING_RE = /account-ring-(?:classic|test)\.svg/i;

  const originalMarkup = new WeakMap();
  const originalImgAttrs = new WeakMap();
  let cwiOptions = null;
  let observer = null;
  let scheduled = false;
  let applying = false;

  function enabled() {
    return Boolean(cwiOptions) && CWI_SETTINGS.appEnabled(APP_KEY, cwiOptions);
  }

  function classicRingUrl() {
    return chrome.runtime.getURL(
      TEST_MODE ? "icons/account-ring-test.svg" : "icons/account-ring-classic.svg"
    );
  }

  function normalizeFill(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  }

  function viewBoxOf(svg) {
    return String(svg.getAttribute("viewBox") || "").trim().replace(/,/g, " ").replace(/\s+/g, " ");
  }

  function isClassicRingSvg(svg) {
    const fills = Array.from(svg.querySelectorAll("path")).map((p) => normalizeFill(p.getAttribute("fill")));
    if (fills.length < 4) return false;
    return CLASSIC_FILLS.every((c) => fills.includes(c));
  }

  // Depth-limited so the lookup stays inside the avatar container instead of
  // matching the header avatar from anywhere on the page.
  const NEARBY_IMG = ":scope > img, :scope > * > img, :scope > * > * > img";

  function hasNearbyAvatar(node) {
    for (const img of node.querySelectorAll(NEARBY_IMG)) {
      if (img.classList.contains("gbii")) return true;
      if (String(img.getAttribute("src") || "").includes("googleusercontent.com/ogw")) return true;
    }

    return false;
  }

  // The gradient variants of the ring are only rebuilt inside the account UI,
  // so unrelated 40x40 or 88x88 artwork on the page is never touched.
  function sitsInAccountUi(svg) {
    let node = svg.parentElement;

    for (let depth = 0; node && depth < 8; depth++) {
      if (node === document.body || node === document.documentElement) break;

      if (ACCOUNT_LABEL.test(node.getAttribute("aria-label") || "")) return true;

      const href = node.getAttribute("href") || "";
      if (href.includes("SignOutOptions") || href.includes("accounts.google.com")) return true;

      if (hasNearbyAvatar(node)) return true;

      node = node.parentElement;
    }

    return false;
  }

  function isTargetRing(svg) {
    if (!RING_TEMPLATES[viewBoxOf(svg)]) return false;
    if (isClassicRingSvg(svg)) return true;
    return sitsInAccountUi(svg);
  }

  function rememberOriginal(svg) {
    if (!originalMarkup.has(svg)) originalMarkup.set(svg, svg.innerHTML);
  }

  function paintClassicFills(svg) {
    let changed = 0;

    for (const path of svg.querySelectorAll("path")) {
      const slot = SLOT_BY_CLASSIC_FILL[normalizeFill(path.getAttribute("fill"))];
      if (!slot) continue;

      const color = colorFor(slot);
      if (normalizeFill(path.getAttribute("fill")) === color.toLowerCase() && path.style.fill) continue;

      path.setAttribute("fill", color);
      path.style.setProperty("fill", color, "important");
      changed++;
    }

    return changed;
  }

  function rebuildRing(svg, template) {
    svg.textContent = "";

    for (const arc of template) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("fill-rule", "evenodd");
      path.setAttribute("clip-rule", "evenodd");
      path.setAttribute("d", arc.d);
      path.setAttribute("fill", colorFor(arc.slot));
      path.style.setProperty("fill", colorFor(arc.slot), "important");
      svg.appendChild(path);
    }

    return template.length;
  }

  function applyToRing(svg) {
    const template = RING_TEMPLATES[viewBoxOf(svg)];
    if (!template) return 0;

    rememberOriginal(svg);

    const painted = isClassicRingSvg(svg) ? paintClassicFills(svg) : rebuildRing(svg, template);
    if (painted) svg.dataset.cwiAccountRing = "1";

    return painted;
  }

  function isRingImg(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (img.dataset.cwiRingImg === "1") return true;

    const src = img.getAttribute("src") || img.currentSrc || "";
    const srcset = img.getAttribute("srcset") || "";
    return RING_IMG_RE.test(src) || RING_IMG_RE.test(srcset) || EXT_RING_RE.test(src);
  }

  function rememberImg(img) {
    if (originalImgAttrs.has(img)) return;

    const src = img.getAttribute("src") || "";
    const srcset = img.getAttribute("srcset") || "";

    // Only keep a gstatic original. If we already swapped to the extension SVG,
    // wait until a gstatic URL appears (Google rewrites) before remembering.
    if (!RING_IMG_RE.test(src) && !RING_IMG_RE.test(srcset)) return;

    originalImgAttrs.set(img, { src, srcset });
  }

  function cacheBust(url) {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}cwi_restore=${Date.now()}`;
  }

  function applyRingImgs() {
    const url = classicRingUrl();

    for (const img of document.querySelectorAll("img")) {
      if (!isRingImg(img)) continue;

      rememberImg(img);
      img.dataset.cwiRingImg = "1";
      img.removeAttribute("srcset");

      if (img.getAttribute("src") !== url) {
        img.setAttribute("src", url);
      }
    }
  }

  function restoreRingImgs() {
    for (const img of document.querySelectorAll('img[data-cwi-ring-img="1"]')) {
      const orig = originalImgAttrs.get(img);

      if (orig) {
        if (orig.srcset) img.setAttribute("srcset", orig.srcset);
        else img.removeAttribute("srcset");

        // Bypass the browser cache of the previously redirected response.
        img.setAttribute("src", cacheBust(orig.src || orig.srcset.split(/\s+/)[0] || ""));
      } else {
        img.removeAttribute("srcset");
      }

      delete img.dataset.cwiRingImg;
    }
  }

  function scanAndApply() {
    if (!enabled()) return;

    applying = true;

    try {
      applyRingImgs();

      for (const svg of document.querySelectorAll("svg")) {
        if (isTargetRing(svg)) applyToRing(svg);
      }
    } finally {
      setTimeout(() => {
        applying = false;
      }, 0);
    }
  }

  function restoreRings() {
    applying = true;

    try {
      restoreRingImgs();

      for (const svg of document.querySelectorAll('svg[data-cwi-account-ring="1"]')) {
        const markup = originalMarkup.get(svg);
        if (markup !== undefined) svg.innerHTML = markup;
        delete svg.dataset.cwiAccountRing;
      }
    } finally {
      setTimeout(() => {
        applying = false;
      }, 0);
    }
  }

  function schedule(delay = 60) {
    if (scheduled) return;

    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      scanAndApply();
    }, delay);
  }

  // The account bubble with the large ring is mounted only after the avatar is
  // clicked, and Google repaints it a few times while it animates in.
  function pulse() {
    [0, 60, 160, 400, 900, 1600].forEach((ms) => setTimeout(scanAndApply, ms));
  }

  function startObserver() {
    if (observer || !document.body) return;

    observer = new MutationObserver(() => {
      if (!applying) schedule(50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["fill", "style", "viewBox", "src", "srcset"]
    });
  }

  function stopObserver() {
    if (!observer) return;

    observer.disconnect();
    observer = null;
  }

  function ensureBody(callback) {
    if (document.body) callback();
    else requestAnimationFrame(() => ensureBody(callback));
  }

  function activate() {
    ensureBody(() => {
      scanAndApply();
      startObserver();
      pulse();
    });
  }

  // Wait for declarativeNetRequest rules to match the toggle before poking
  // already-loaded images, so a restore does not hit a still-active redirect.
  function syncRulesThen(callback) {
    try {
      chrome.runtime.sendMessage({ type: "cwi-sync-ring-rules" }, () => {
        void chrome.runtime?.lastError;
        callback();
      });
    } catch (_) {
      callback();
    }
  }

  function applyLiveToggle() {
    if (enabled()) {
      activate();
    } else {
      stopObserver();
      restoreRings();
    }
  }

  CWI_SETTINGS.getOptions().then((options) => {
    cwiOptions = CWI_SETTINGS.normalizeOptions(options);

    if (enabled()) activate();

    window.addEventListener("DOMContentLoaded", () => enabled() && pulse(), { once: true });
    window.addEventListener("load", () => enabled() && pulse(), { once: true });

    document.addEventListener("click", (event) => {
      if (!enabled()) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest('a[href*="SignOutOptions"], [aria-label], img.gbii, svg');
      if (trigger) pulse();
    }, true);

    window.addEventListener("focus", () => enabled() && schedule(80));

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && enabled()) schedule(80);
    });

    chrome.storage?.onChanged?.addListener((changes, areaName) => {
      if (areaName !== "sync" || !changes.cwiOptions) return;

      cwiOptions = CWI_SETTINGS.normalizeOptions(changes.cwiOptions.newValue);
      syncRulesThen(applyLiveToggle);
    });

    chrome.runtime?.onMessage?.addListener((message) => {
      if (message?.type !== "cwi-ring-live-refresh") return;
      applyLiveToggle();
    });
  });
})();
