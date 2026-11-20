(() => {
  const settings = globalThis.__CWI_SETTINGS__;
  if (!settings) return;

  const STYLE_ID = "cwi-classic-meet-presentation-button-style";
  const BUTTON = "#docs-meet-in-editors-entrypointbutton";
  const MARK = "data-cwi-meet-button-icon";
  const IMAGE_CLASS = "cwi-meet-button-image";
  let options = null;
  let pending = false;

  function cleanup() {
    document.querySelectorAll(`[${MARK}]`).forEach((box) => {
      box.querySelectorAll(`.${IMAGE_CLASS}`).forEach((image) => image.remove());
      box.removeAttribute(MARK);
    });
    document.getElementById(STYLE_ID)?.remove();
  }

  function apply() {
    if (!document.documentElement || !options || !settings.appSurfaceEnabled("meet", "meetButton", options)) {
      cleanup();
      return;
    }
    const url = settings.getIconUrl("meet", options);
    if (!url) {
      cleanup();
      return;
    }

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = `${BUTTON} [${MARK}] { background: transparent url("${url}") center / contain no-repeat !important; }
${BUTTON} [${MARK}] > * { visibility: hidden !important; }
${BUTTON} [${MARK}]::before, ${BUTTON} [${MARK}]::after { content: none !important; }`;

    document.querySelectorAll(`${BUTTON} .goog-flat-menu-button-caption .docs-icon`).forEach((box) => {
      if (!box.hasAttribute(MARK)) box.setAttribute(MARK, "1");
      box.querySelectorAll(`.${IMAGE_CLASS}`).forEach((image) => image.remove());
    });
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      apply();
    });
  }

  function touchesButton(mutation) {
    const target = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
    if (target?.closest?.(BUTTON)) return true;
    return [...(mutation.addedNodes || [])].some((node) =>
      node.nodeType === 1 && (node.matches(BUTTON) || node.querySelector(BUTTON))
    );
  }

  settings.getOptions().then((initial) => {
    options = initial;
    apply();
    const observer = new MutationObserver((mutations) => {
      if (mutations.some(touchesButton)) schedule();
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["class", "style", "src"]
    });
    settings.watchOptions(options, (next) => {
      options = next;
      apply();
    });
  });
})();
