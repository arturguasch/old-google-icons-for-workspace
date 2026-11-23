(() => {
  if (location.pathname !== "/") return;

  const settings = globalThis.__CWI_SETTINGS__;
  if (!settings) return;

  const SELECTOR = '#sI1XGe svg[aria-label="Google"][role="img"], #sI1XGe svg[aria-label="Google Search"][role="img"]';
  let options = null;
  let observer = null;

  function isEnabled() {
    return Boolean(options) && settings.appEnabled("search", options) &&
      settings.appEnabled("searchWordmark", options);
  }

  function restoreWordmarks() {
    document.querySelectorAll('img[data-cwi-search-wordmark="1"]').forEach((image) => {
      if (image.__cwiOriginalWordmark) image.replaceWith(image.__cwiOriginalWordmark);
      else image.remove();
    });
  }

  function applyWordmark() {
    if (!document.documentElement) return;
    if (!isEnabled()) {
      restoreWordmarks();
      return;
    }

    const imageUrl = settings.getIconUrl("searchWordmark", options);
    if (!imageUrl) return;
    document.querySelectorAll('img[data-cwi-search-wordmark="1"]').forEach((image) => {
      if (image.src !== imageUrl) image.src = imageUrl;
    });

    document.querySelectorAll(SELECTOR).forEach((original) => {
      const replacement = document.createElement("img");
      replacement.className = original.getAttribute("class") || "";
      replacement.alt = "Google";
      replacement.setAttribute("aria-label", "Google");
      replacement.setAttribute("role", "img");
      replacement.setAttribute("draggable", "false");
      replacement.width = Number(original.getAttribute("width")) || 272;
      replacement.height = Number(original.getAttribute("height")) || 92;
      replacement.dataset.cwiSearchWordmark = "1";
      replacement.src = imageUrl;
      replacement.__cwiOriginalWordmark = original.cloneNode(true);
      original.replaceWith(replacement);
    });
  }

  function observePage() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(applyWordmark);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  settings.getOptions().then((initialOptions) => {
    options = settings.normalizeOptions(initialOptions);
    applyWordmark();
    observePage();
    settings.watchOptions(options, (nextOptions) => {
      options = nextOptions;
      applyWordmark();
    });
    document.addEventListener("DOMContentLoaded", applyWordmark, { once: true });
  });
})();
