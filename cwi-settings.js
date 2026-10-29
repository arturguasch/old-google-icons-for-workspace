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
    "maps",
    "vids",
    "tasks",
    "voice",
    "sites",
    "photos",
    "wallet",
    "ring"
  ];
  const SURFACE_KEYS = ["favicon", "header", "launcher", "sidePanel"];
  const DEFAULT_DESIGN_ID = "2020";
  let customIconCache = {};
  const ICON_DESIGNS = {
    gmail: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/gmail-classic.svg" },
      { id: "2014-2020", label: "2014–2020 · Red and white", path: "icons/legacy-2014-2020/2014_gmail_favicon.png" },
      { id: "2011-2014", label: "2011–2014 · Classic envelope", path: "icons/legacy-earlier-eras/2011_gmail.svg" }
    ],
    calendar: [
      { id: "2020", label: "2020 · Four-color", dayPath: (day) => `icons/calendar-${pad2(day)}.webp` },
      { id: "2014", label: "2014 · Blue classic", dayPath: (day) => `icons/calendar-legacy-days/2014_${day}.png` }
    ],
    drive: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/drive-classic.svg" },
      { id: "2014-2020", label: "2014–2020 · Three colors", path: "icons/legacy-2014-2020/2014_drive_favicon.png" },
      { id: "2012-2014", label: "2012–2014 · Original Drive", path: "icons/legacy-earlier-eras/2012_drive.svg" }
    ],
    docs: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/docs-classic.svg" },
      { id: "2014-2020", label: "2014–2020 · Classic Docs", path: "icons/legacy-2014-2020/2014_docs.svg" }
    ],
    sheets: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/sheets-classic.svg" },
      { id: "2014-2020", label: "2014–2020 · Classic Sheets", path: "icons/legacy-2014-2020/2014_sheets.svg" }
    ],
    slides: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/slides-classic.svg" },
      { id: "2014-2020", label: "2014–2020 · Classic Slides", path: "icons/legacy-2014-2020/2014_slides.svg" }
    ],
    forms: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/forms-classic.png" },
      { id: "2014-2020", label: "2014–2020 · Classic Forms", path: "icons/legacy-2014-2020/2014_forms.svg" }
    ],
    meet: [
      { id: "2020", label: "2020 · Four-color camera", path: "icons/meet-classic.svg" },
      { id: "2017-2020", label: "2017–2020 · Hangouts Meet", path: "icons/legacy-2014-2020/2017_meet_favicon.png" },
      { id: "2022", label: "2022 · Original green Meet", path: "icons/legacy-2014-2020/2022_meet.png" }
    ],
    chat: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/chat-classic.svg" },
      { id: "2017-2020", label: "2017–2020 · Hangouts Chat", path: "icons/legacy-2014-2020/2017_chat.png" }
    ],
    keep: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/keep-classic.svg" },
      { id: "2015-2020", label: "2015–2020 · Classic Keep", path: "icons/legacy-2014-2020/2015_keep.svg" }
    ],
    maps: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/maps-classic.png" },
      { id: "2015-2020", label: "2015–2020 · Classic Maps", path: "icons/legacy-2014-2020/2015_maps.svg" }
    ],
    vids: [{ id: "2020", label: "2020 · Classic Vids", path: "icons/vids-classic.png" }],
    tasks: [{ id: "2020", label: "2020 · Classic Tasks", path: "icons/tasks-classic.png" }],
    voice: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/voice-classic.svg" },
      { id: "2018-2020", label: "2018–2020 · Classic Voice", path: "icons/legacy-2014-2020/2018_voice.svg" }
    ],
    sites: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/sites-classic.svg" },
      { id: "2014-2020", label: "2014–2020 · Classic Sites", path: "icons/legacy-2014-2020/2014_sites.svg" }
    ],
    photos: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/photos-classic.png" },
      { id: "2015-2020", label: "2015–2020 · Classic Photos", path: "icons/legacy-2014-2020/2015_photos.svg" }
    ],
    wallet: [
      { id: "2020", label: "2020 · Workspace colors", path: "icons/wallet-classic.svg" },
      { id: "2015", label: "2015 · Classic Wallet", path: "icons/legacy-2014-2020/2015_wallet.svg" }
    ]
  };

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function getIconDesigns(app) {
    return ICON_DESIGNS[app] || [];
  }

  function getIconDesign(app, options) {
    const designs = getIconDesigns(app);
    if (!designs.length) return null;
    const normalized = normalizeOptions(options);
    return designs.find((design) => design.id === normalized.iconStyles[app]) || designs[0];
  }

  function getIconPath(app, options, day = new Date().getDate()) {
    const normalized = normalizeOptions(options);
    if (normalized.customIconsEnabled[app] && customIconCache[app]) {
      return customIconCache[app];
    }
    const design = getIconDesign(app, options);
    if (!design) return "";
    return design.dayPath ? design.dayPath(day) : design.path;
  }

  function getIconUrl(app, options, day = new Date().getDate()) {
    const path = getIconPath(app, options, day);
    if (!path) return "";
    return path.startsWith("data:") ? path : chrome.runtime.getURL(path);
  }

  function getCustomIcons() {
    return new Promise((resolve) => {
      try {
        if (!chrome?.storage?.local) {
          resolve(customIconCache);
          return;
        }
        chrome.storage.local.get({ cwiCustomIcons: {} }, (result) => {
          if (!chrome.runtime?.lastError) {
            customIconCache = result.cwiCustomIcons && typeof result.cwiCustomIcons === "object"
              ? result.cwiCustomIcons
              : {};
          }
          resolve(customIconCache);
        });
      } catch (_) {
        resolve(customIconCache);
      }
    });
  }

  const DEFAULT_OPTIONS = {
    enabled: true,
    surfaces: {
      favicon: true,
      header: true,
      launcher: true,
      sidePanel: true
    },
    appSurfaces: Object.fromEntries(APP_KEYS.map((app) => [
      app,
      Object.fromEntries(SURFACE_KEYS.map((surface) => [surface, true]))
    ])),
    apps: Object.fromEntries(APP_KEYS.map((app) => [app, true])),
    iconStyles: Object.fromEntries(APP_KEYS.map((app) => [app, DEFAULT_DESIGN_ID])),
    customIconsEnabled: Object.fromEntries(APP_KEYS.map((app) => [app, false]))
  };

  function normalizeOptions(value) {
    const source = value && typeof value === "object" ? value : {};
    const apps = source.apps && typeof source.apps === "object" ? source.apps : {};
    const sourceSurfaces = source.surfaces && typeof source.surfaces === "object" ? source.surfaces : {};
    const sourceAppSurfaces = source.appSurfaces && typeof source.appSurfaces === "object" ? source.appSurfaces : {};
    const sourceIconStyles = source.iconStyles && typeof source.iconStyles === "object" ? source.iconStyles : {};
    const sourceCustomIconsEnabled = source.customIconsEnabled && typeof source.customIconsEnabled === "object"
      ? source.customIconsEnabled
      : {};

    return {
      enabled: source.enabled !== false,
      surfaces: {
        favicon: sourceSurfaces.favicon !== false,
        header: sourceSurfaces.header !== false,
        launcher: sourceSurfaces.launcher !== false,
        sidePanel: sourceSurfaces.sidePanel !== false
      },
      appSurfaces: Object.fromEntries(APP_KEYS.map((app) => {
        const appSurfaces = sourceAppSurfaces[app] && typeof sourceAppSurfaces[app] === "object"
          ? sourceAppSurfaces[app]
          : {};
        return [app, Object.fromEntries(SURFACE_KEYS.map((surface) => [
          surface,
          appSurfaces[surface] !== false
        ]))];
      })),
      apps: Object.fromEntries(APP_KEYS.map((app) => [app, apps[app] !== false])),
      iconStyles: Object.fromEntries(APP_KEYS.map((app) => {
        const designs = getIconDesigns(app);
        const requested = sourceIconStyles[app];
        const selected = designs.find((design) => design.id === requested);
        return [app, selected?.id || DEFAULT_DESIGN_ID];
      })),
      customIconsEnabled: Object.fromEntries(APP_KEYS.map((app) => [
        app,
        sourceCustomIconsEnabled[app] === true
      ]))
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

          const normalized = normalizeOptions(result.cwiOptions);
          getCustomIcons().then(() => {
            for (const app of APP_KEYS) {
              if (!customIconCache[app]) normalized.customIconsEnabled[app] = false;
            }
            resolve(normalized);
          });
        });
      } catch (_) {
        resolve(normalizeOptions(DEFAULT_OPTIONS));
      }
    });
  }

  function watchOptions(initialOptions, onChange) {
    let latestOptions = normalizeOptions(initialOptions);
    try {
      chrome.storage?.onChanged?.addListener((changes, areaName) => {
        if (areaName === "local" && changes.cwiCustomIcons) {
          customIconCache = changes.cwiCustomIcons.newValue && typeof changes.cwiCustomIcons.newValue === "object"
            ? changes.cwiCustomIcons.newValue
            : {};
          for (const app of APP_KEYS) {
            if (!customIconCache[app]) latestOptions.customIconsEnabled[app] = false;
          }
          onChange(latestOptions);
          return;
        }

        if (areaName === "sync" && changes.cwiOptions) {
          getOptions().then((nextOptions) => {
            latestOptions = nextOptions;
            onChange(latestOptions);
          });
        }
      });
    } catch (_) {
      // Storage listeners are unavailable in some restricted browser contexts.
    }
  }

  function appEnabled(app, options) {
    if (!app) return false;
    const normalized = normalizeOptions(options);
    return normalized.enabled !== false && normalized.apps[app] !== false;
  }

  function surfaceEnabled(surface, options) {
    const normalized = normalizeOptions(options);
    return normalized.enabled !== false && normalized.surfaces[surface] !== false;
  }

  function appSurfaceEnabled(app, surface, options) {
    const normalized = normalizeOptions(options);
    return Boolean(app) && normalized.enabled !== false &&
      normalized.apps[app] !== false && normalized.surfaces[surface] !== false &&
      normalized.appSurfaces[app]?.[surface] !== false;
  }

  globalThis.__CWI_SETTINGS__ = {
    APP_KEYS,
    ICON_DESIGNS,
    DEFAULT_OPTIONS,
    normalizeOptions,
    getIconDesigns,
    getIconDesign,
    getIconPath,
    getIconUrl,
    getCustomIcons,
    getOptions,
    watchOptions,
    appEnabled,
    surfaceEnabled,
    appSurfaceEnabled
  };
})();
