(() => {
  const SUPPORT_URL = "https://buymeacoffee.com/openextensions";
  const REPORT_URL = "https://github.com/arturguasch/old-google-icons-for-workspace/issues";

  const APPS = [
    { key: "gmail", label: "Gmail", icon: "icons/gmail-classic.svg" },
    { key: "calendar", label: "Calendar", icon: calendarIconPath() },
    { key: "drive", label: "Drive", icon: "icons/drive-classic.svg" },
    { key: "docs", label: "Docs", icon: "icons/docs-classic.svg" },
    { key: "sheets", label: "Sheets", icon: "icons/sheets-classic.svg" },
    { key: "slides", label: "Slides", icon: "icons/slides-classic.svg" },
    { key: "forms", label: "Forms", icon: "icons/forms-classic.png" },
    { key: "meet", label: "Meet", icon: "icons/meet-classic.svg" },
    { key: "chat", label: "Chat", icon: "icons/chat-classic.svg" },
    { key: "keep", label: "Keep", icon: "icons/keep-classic.svg" },
    { key: "maps", label: "Maps", icon: "icons/maps-classic.png" },
    { key: "ring", label: "Ring", icon: "icons/account-ring-classic.svg" }
  ];

  const settings = globalThis.__CWI_SETTINGS__;
  const masterToggle = document.getElementById("masterToggle");
  const appsList = document.getElementById("appsList");
  const enabledCount = document.getElementById("enabledCount");
  const versionText = document.getElementById("versionText");
  let options = settings.normalizeOptions(settings.DEFAULT_OPTIONS);

  function calendarIconPath() {
    return `icons/calendar-${String(new Date().getDate()).padStart(2, "0")}.webp`;
  }

  function openUrl(url) {
    chrome.tabs.create({ url });
  }

  function saveOptions() {
    const normalized = settings.normalizeOptions(options);
    chrome.storage.sync.set({ cwiOptions: normalized });
  }

  function renderCount() {
    const count = APPS.filter((app) => options.apps[app.key] !== false).length;
    enabledCount.textContent = `${count} enabled`;
  }

  function renderApps() {
    appsList.textContent = "";

    for (const app of APPS) {
      const row = document.createElement("div");
      row.className = "app-row";
      row.dataset.app = app.key;

      const name = document.createElement("div");
      name.className = "app-name";

      const icon = document.createElement("img");
      icon.alt = "";
      icon.src = app.icon;

      const label = document.createElement("span");
      label.textContent = app.label;

      name.append(icon, label);

      const switchLabel = document.createElement("label");
      switchLabel.className = "switch";
      switchLabel.setAttribute("aria-label", `Enable ${app.label}`);

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = options.apps[app.key] !== false;
      input.addEventListener("change", () => {
        options.apps[app.key] = input.checked;
        renderCount();
        saveOptions();
      });

      const visual = document.createElement("span");
      switchLabel.append(input, visual);
      row.append(name, switchLabel);
      appsList.append(row);
    }
  }

  function render() {
    masterToggle.checked = options.enabled !== false;
    renderApps();
    renderCount();
  }

  async function init() {
    versionText.textContent = chrome.runtime.getManifest().version;
    options = await settings.getOptions();
    render();

    masterToggle.addEventListener("change", () => {
      options.enabled = masterToggle.checked;
      saveOptions();
    });

    document.getElementById("supportButton").addEventListener("click", () => openUrl(SUPPORT_URL));
    document.getElementById("reportButton").addEventListener("click", () => openUrl(REPORT_URL));
  }

  init();
})();
