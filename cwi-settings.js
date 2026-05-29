(() => {
  if (globalThis.__CWI_SETTINGS__) return;

  const APP_KEYS = [
    "gmail",
    "calendar",
    "drive",
    "docs",
    "sheets",
    "slides",
    "forms",
    "meet",
    "chat",
    "keep",
    "maps"
  ];

  const DEFAULT_OPTIONS = {
    enabled: true,
    apps: Object.fromEntries(APP_KEYS.map((app) => [app, true]))
  };

  function normalizeOptions(value) {
    const source = value && typeof value === "object" ? value : {};
    const apps = source.apps && typeof source.apps === "object" ? source.apps : {};

    return {
      enabled: source.enabled !== false,
      apps: Object.fromEntries(APP_KEYS.map((app) => [app, apps[app] !== false]))
    };
  }

  function getOptions() {
    return new Promise((resolve) => {
      try {
        if (!chrome?.storage?.sync) {
          resolve(normalizeOptions(DEFAULT_OPTIONS));
          return;
        }

        chrome.storage.sync.get({ cwiOptions: DEFAULT_OPTIONS }, (result) => {
          if (chrome.runtime?.lastError) {
            resolve(normalizeOptions(DEFAULT_OPTIONS));
            return;
          }

          resolve(normalizeOptions(result.cwiOptions));
        });
      } catch (_) {
        resolve(normalizeOptions(DEFAULT_OPTIONS));
      }
    });
  }

  function appEnabled(app, options) {
    if (!app) return false;
    const normalized = normalizeOptions(options);
    return normalized.enabled !== false && normalized.apps[app] !== false;
  }

  globalThis.__CWI_SETTINGS__ = {
    APP_KEYS,
    DEFAULT_OPTIONS,
    normalizeOptions,
    getOptions,
    appEnabled
  };
})();
