(() => {
  const SUPPORT_URL = "https://buymeacoffee.com/openextensions";
  const REPORT_URL = "https://github.com/arturguasch/old-google-icons-for-workspace/issues";

  const APPS = [
    { key: "gmail", label: "Gmail", icon: "icons/gmail-classic.svg" },
    { key: "calendar", label: "Calendar", icon: "icons/calendar-01.webp" },
    { key: "drive", label: "Drive", icon: "icons/drive-classic.svg" },
    { key: "docs", label: "Docs", icon: "icons/docs-classic.svg" },
    { key: "sheets", label: "Sheets", icon: "icons/sheets-classic.svg" },
    { key: "slides", label: "Slides", icon: "icons/slides-classic.svg" },
    { key: "forms", label: "Forms", icon: "icons/forms-classic.png" },
    { key: "meet", label: "Meet", icon: "icons/meet-classic.svg" },
    { key: "chat", label: "Chat", icon: "icons/chat-classic.svg" },
    { key: "keep", label: "Keep", icon: "icons/keep-classic.svg" },
    { key: "maps", label: "Maps", icon: "icons/maps-classic.png" },
    { key: "vids", label: "Vids", icon: "icons/vids-classic.png" },
    { key: "tasks", label: "Tasks", icon: "icons/tasks-classic.png" },
    { key: "voice", label: "Voice", icon: "icons/voice-classic.svg" },
    { key: "sites", label: "Sites", icon: "icons/sites-classic.svg" },
    { key: "photos", label: "Photos", icon: "icons/photos-classic.png" },
    { key: "wallet", label: "Wallet", icon: "icons/wallet-classic.svg" },
    { key: "ring", label: "Account ring", icon: "icons/account-ring-classic.svg" }
  ];

  const SURFACES = [
    { key: "favicon", label: "Browser tab & bookmarks", shortLabel: "Tab & bookmarks", detail: "Icon shown in tabs and bookmarks", icon: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M4 8h16"/><circle cx="8" cy="6" r=".6"/><circle cx="11" cy="6" r=".6"/>' },
    { key: "header", label: "Main app logo", shortLabel: "Main app logo", detail: "Logo shown at the top of each app", icon: '<path d="M4 6.5h16M4 11h10"/><circle cx="17.5" cy="16.5" r="3.5"/><path d="M20 19l1.5 1.5"/>' },
    { key: "launcher", label: "Google apps menu", shortLabel: "Apps menu", detail: "In-page Google apps launcher", icon: '<circle cx="6" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="18" cy="6" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="18" cy="18" r="1"/>' },
    { key: "sidePanel", label: "Workspace side panel", shortLabel: "Side panel", detail: "Calendar, Keep, Maps, Tasks", icon: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M14 4v16M7.5 8h3M7.5 12h3M7.5 16h3"/>' }
  ];
  const SIDE_PANEL_APPS = new Set(["calendar", "keep", "maps", "tasks"]);
  const settings = globalThis.__CWI_SETTINGS__;
  const masterToggle = document.getElementById("masterToggle");
  const surfacesList = document.getElementById("surfacesList");
  const appsList = document.getElementById("appsList");
  const enabledCount = document.getElementById("enabledCount");
  const surfaceCount = document.getElementById("surfaceCount");
  const versionText = document.getElementById("versionText");
  let options = settings.normalizeOptions(settings.DEFAULT_OPTIONS);

  function openUrl(url) {
    chrome.tabs.create({ url });
  }

  function saveOptions(onSaved) {
    options = settings.normalizeOptions(options);
    chrome.storage.sync.set({ cwiOptions: options }, () => {
      void chrome.runtime.lastError;
      onSaved?.();
    });
  }

  function appSupportsSurface(app, surface) {
    if (app.key === "ring") return surface.key === "header";
    if (surface.key === "sidePanel") return SIDE_PANEL_APPS.has(app.key);
    return true;
  }

  function updateCounts() {
    const appsOn = APPS.filter((app) => options.apps[app.key] !== false).length;
    const surfacesOn = SURFACES.filter((surface) => options.surfaces[surface.key] !== false).length;
    enabledCount.textContent = `${appsOn} / ${APPS.length} on`;
    surfaceCount.textContent = `${surfacesOn} / ${SURFACES.length} on`;
  }

  function renderGlobalSurfaces() {
    for (const input of surfacesList.querySelectorAll("input[data-surface]")) {
      const surface = input.dataset.surface;
      input.checked = options.surfaces[surface] !== false;
      input.addEventListener("change", () => {
        options.surfaces[surface] = input.checked;
        updateCounts();
        saveOptions();
        renderApps();
      });
    }
  }

  function selectedSurfaceCount(app) {
    return SURFACES.filter((surface) =>
      appSupportsSurface(app, surface) && options.appSurfaces[app.key][surface.key] !== false
    ).length;
  }

  function makeSurfaceControl(app, surface) {
    const supported = appSupportsSurface(app, surface);
    const label = document.createElement("label");
    label.className = "app-surface-option";
    if (!supported) label.classList.add("is-unavailable");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = supported && options.appSurfaces[app.key][surface.key] !== false;
    input.disabled = !supported;
    input.setAttribute("aria-label", `${app.label}: ${surface.label}`);

    const icon = document.createElement("span");
    icon.className = "app-surface-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `<svg viewBox="0 0 24 24">${surface.icon}</svg>`;

    const copy = document.createElement("span");
    copy.className = "app-surface-copy";

    const title = document.createElement("strong");
    title.textContent = surface.shortLabel;
    const state = document.createElement("small");
    if (!supported) {
      state.textContent = "Not available";
    } else if (options.enabled === false || options.surfaces[surface.key] === false) {
      state.textContent = "Paused globally";
    } else {
      state.textContent = surface.detail;
    }

    copy.append(title, state);
    const mark = document.createElement("span");
    mark.className = "mini-check";
    mark.setAttribute("aria-hidden", "true");
    label.append(input, icon, copy, mark);

    if (supported) {
      input.addEventListener("change", () => {
        options.appSurfaces[app.key][surface.key] = input.checked;
        state.textContent = options.enabled === false || options.surfaces[surface.key] === false
          ? "Paused globally"
          : surface.detail;
        updateAppSummary(app.key);
        saveOptions();
      });
    }

    return label;
  }

  function updateAppSummary(appKey) {
    const card = appsList.querySelector(`[data-app="${appKey}"]`);
    const app = APPS.find((item) => item.key === appKey);
    if (!card || !app) return;

    const summary = card.querySelector(".app-summary-state");
    if (!summary) {
      card.dataset.enabled = options.apps[app.key] === false ? "false" : "true";
      return;
    }
    if (options.apps[app.key] === false) {
      summary.textContent = "Paused";
      card.dataset.enabled = "false";
      return;
    }

    const total = SURFACES.filter((surface) => appSupportsSurface(app, surface)).length;
    const selected = selectedSurfaceCount(app);
    const design = settings.getIconDesign(app.key, options);
    const designName = options.customIconsEnabled[app.key]
      ? "Custom icon"
      : design?.label?.split(" · ")[0] || "Classic";
    summary.textContent = selected === 0
      ? `${designName} · No locations`
      : `${designName} · ${selected}/${total} locations`;
    card.dataset.enabled = "true";
  }

  function makeDesignPicker(app, icon) {
    const designs = settings.getIconDesigns(app.key);
    const wrapper = document.createElement("div");
    wrapper.className = "icon-design-options";

    const classicCard = document.createElement("section");
    classicCard.className = "icon-design-card classic-design-card";
    const classicTitle = document.createElement("span");
    classicTitle.className = "design-label";
    classicTitle.textContent = "Classic design";

    const designPicker = document.createElement("div");
    designPicker.className = "design-picker";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "design-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", `${app.label} classic design`);
    const triggerText = document.createElement("span");
    triggerText.className = "design-trigger-text";
    const chevron = document.createElement("span");
    chevron.className = "design-chevron";
    chevron.setAttribute("aria-hidden", "true");
    trigger.append(triggerText, chevron);

    const menu = document.createElement("div");
    menu.className = "design-menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;
    menu.setAttribute("aria-label", `${app.label} classic designs`);
    const designButtons = new Map();

    const customCard = document.createElement("section");
    customCard.className = "icon-design-card custom-design-card";
    const customHeading = document.createElement("div");
    customHeading.className = "custom-design-heading";
    const customPreview = document.createElement("img");
    customPreview.className = "custom-design-preview";
    customPreview.alt = "";
    customPreview.setAttribute("aria-hidden", "true");
    const customTitleWrap = document.createElement("span");
    customTitleWrap.className = "custom-title-wrap";
    const customTitle = document.createElement("strong");
    customTitle.textContent = "Custom icon";
    const customStatus = document.createElement("small");
    customStatus.className = "custom-design-status";
    customTitleWrap.append(customTitle, customStatus);
    customHeading.append(customPreview, customTitleWrap);

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "custom-file-input";
    fileInput.accept = "image/png,image/jpeg,image/webp";
    fileInput.setAttribute("aria-label", `Upload a custom ${app.label} icon`);

    const customActions = document.createElement("div");
    customActions.className = "custom-design-actions";
    const uploadButton = document.createElement("button");
    uploadButton.type = "button";
    uploadButton.className = "custom-upload-button";
    uploadButton.textContent = "Upload image";
    uploadButton.addEventListener("click", () => fileInput.click());
    const useLabel = document.createElement("label");
    useLabel.className = "custom-use-label";
    const useInput = document.createElement("input");
    useInput.type = "checkbox";
    useInput.className = "custom-use-input";
    useInput.setAttribute("aria-label", `Use custom ${app.label} icon`);
    const useTrack = document.createElement("span");
    useTrack.className = "custom-use-track";
    useLabel.append(useInput, useTrack);
    customActions.append(uploadButton, useLabel);

    const customHint = document.createElement("small");
    customHint.className = "custom-design-hint";
    customHint.textContent = "Saved on this device · PNG, JPG or WebP · 1:1 · 32–2048 px · max. 5 MB. Resized to 128 × 128.";
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "custom-remove-button";
    removeButton.textContent = "Remove custom icon";
    removeButton.hidden = true;
    const customMessage = document.createElement("small");
    customMessage.className = "custom-design-message";
    customCard.append(customHeading, customActions, customHint, removeButton, customMessage);

    let customIcon = "";
    let menuOpen = false;

    function closeMenu() {
      menuOpen = false;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      designPicker.classList.remove("is-open");
      designPicker.closest(".app-card")?.classList.remove("has-open-design-menu");
    }

    function renderDesignMenu() {
      menu.textContent = "";
      designButtons.clear();
      const selectedId = options.iconStyles[app.key];
      const selectedDesign = designs.find((design) => design.id === selectedId) || designs[0];
      triggerText.textContent = selectedDesign?.label || "Classic";

      for (const design of designs) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "design-menu-option";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(design.id === selectedId));
        option.textContent = design.label;
        option.addEventListener("click", () => {
          options.iconStyles[app.key] = design.id;
          options.customIconsEnabled[app.key] = false;
          closeMenu();
          renderDesignMenu();
          updateCustomControls();
          updatePreview();
          updateAppSummary(app.key);
          saveOptions();
        });
        menu.append(option);
        designButtons.set(design.id, option);
      }
    }

    function updatePreview() {
      const activeCustom = options.customIconsEnabled[app.key] && customIcon;
      const url = activeCustom ? customIcon : settings.getIconUrl(app.key, options);
      if (url) {
        icon.src = url;
        customPreview.src = customIcon || url;
      }
      customCard.classList.toggle("is-active", Boolean(activeCustom));
    }

    function updateCustomControls() {
      const available = Boolean(customIcon);
      customCard.classList.toggle("has-custom-icon", available);
      useInput.disabled = !available;
      useInput.checked = available && options.customIconsEnabled[app.key] === true;
      customStatus.textContent = available
        ? (useInput.checked ? "Using this icon" : "Image ready")
        : "Choose an image to get started";
      customStatus.classList.toggle("is-selected", useInput.checked);
      removeButton.hidden = !available;
      customMessage.textContent = "";
      updatePreview();
    }

    async function convertImage(file) {
      const maxFileBytes = 5 * 1024 * 1024;
      if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        throw new Error("Choose a PNG, JPG or WebP image.");
      }
      if (file.size > maxFileBytes) throw new Error("The image must be 5 MB or smaller.");

      const bitmap = await createImageBitmap(file);
      if (bitmap.width !== bitmap.height) {
        bitmap.close();
        throw new Error("The image must be square (1:1).");
      }
      if (bitmap.width < 32 || bitmap.width > 2048) {
        bitmap.close();
        throw new Error("Use an image between 32 × 32 and 2048 × 2048 pixels.");
      }

      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext("2d", { alpha: true });
      context.clearRect(0, 0, 128, 128);
      context.drawImage(bitmap, 0, 0, 128, 128);
      bitmap.close();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
      if (!blob || blob.size > 64 * 1024) throw new Error("This image could not be optimized. Try a simpler image.");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read this image."));
        reader.readAsDataURL(blob);
      });
    }

    async function saveCustomIcon(dataUrl) {
      const icons = await settings.getCustomIcons();
      const nextIcons = { ...icons, [app.key]: dataUrl };
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ cwiCustomIcons: nextIcons }, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      });
      customIcon = dataUrl;
      options.customIconsEnabled[app.key] = true;
      updateCustomControls();
      updateAppSummary(app.key);
      saveOptions();
    }

    fileInput.addEventListener("change", async () => {
      const [file] = fileInput.files || [];
      fileInput.value = "";
      if (!file) return;
      uploadButton.disabled = true;
      customMessage.textContent = "Preparing image…";
      customMessage.classList.remove("is-error");
      try {
        await saveCustomIcon(await convertImage(file));
      } catch (error) {
        customMessage.textContent = error.message || "Could not save this image.";
        customMessage.classList.add("is-error");
      } finally {
        uploadButton.disabled = false;
      }
    });

    useInput.addEventListener("change", () => {
      options.customIconsEnabled[app.key] = useInput.checked;
      updateCustomControls();
      updateAppSummary(app.key);
      saveOptions();
    });

    removeButton.addEventListener("click", async () => {
      const icons = await settings.getCustomIcons();
      const nextIcons = { ...icons };
      delete nextIcons[app.key];
      chrome.storage.local.set({ cwiCustomIcons: nextIcons }, () => {
        if (chrome.runtime.lastError) {
          customMessage.textContent = "Could not remove this image.";
          customMessage.classList.add("is-error");
          return;
        }
        customIcon = "";
        options.customIconsEnabled[app.key] = false;
        updateCustomControls();
        updateAppSummary(app.key);
        saveOptions();
      });
    });

    trigger.addEventListener("click", () => {
      menuOpen = !menuOpen;
      menu.hidden = !menuOpen;
      trigger.setAttribute("aria-expanded", String(menuOpen));
      designPicker.classList.toggle("is-open", menuOpen);
      designPicker.closest(".app-card")?.classList.toggle("has-open-design-menu", menuOpen);
      if (menuOpen) designButtons.get(options.iconStyles[app.key])?.focus();
    });
    designPicker.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) {
        closeMenu();
        trigger.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (menuOpen && !designPicker.contains(event.target)) closeMenu();
    });

    classicCard.append(classicTitle, designPicker);
    designPicker.append(trigger, menu);
    wrapper.append(classicCard, customCard);
    renderDesignMenu();
    updateCustomControls();
    settings.getCustomIcons().then((icons) => {
      customIcon = icons[app.key] || "";
      updateCustomControls();
    });
    return wrapper;
  }

  function renderApps() {
    const openApps = new Set(
      Array.from(appsList.querySelectorAll(".app-card.is-open"), (card) => card.dataset.app)
    );
    appsList.textContent = "";

    for (const app of APPS) {
      const standalone = app.key === "ring";
      const card = document.createElement("article");
      card.className = "app-card";
      card.dataset.app = app.key;

      const row = document.createElement("div");
      row.className = "app-row";

      const identity = document.createElement(standalone ? "div" : "button");
      if (!standalone) identity.type = "button";
      identity.className = "app-identity";
      if (standalone) identity.classList.add("is-static");
      else identity.setAttribute("aria-expanded", "false");

      const icon = document.createElement("img");
      icon.alt = "";
      icon.src = standalone
        ? app.icon
        : settings.getIconUrl(app.key, options) || chrome.runtime.getURL(app.icon);
      icon.className = "app-icon";

      const copy = document.createElement("span");
      copy.className = "app-identity-copy";
      const name = document.createElement("strong");
      name.textContent = app.label;
      copy.append(name);
      if (!standalone) {
        const summary = document.createElement("small");
        summary.className = "app-summary-state";
        copy.append(summary);
      }

      identity.append(icon, copy);
      if (!standalone) {
        const chevron = document.createElement("span");
        chevron.className = "app-chevron";
        chevron.setAttribute("aria-hidden", "true");
        identity.append(chevron);
      }

      const switchLabel = document.createElement("label");
      switchLabel.className = "switch app-switch";
      switchLabel.setAttribute("aria-label", `Enable ${app.label} icons`);

      const appToggle = document.createElement("input");
      appToggle.type = "checkbox";
      appToggle.checked = options.apps[app.key] !== false;
      appToggle.addEventListener("change", () => {
        options.apps[app.key] = appToggle.checked;
        updateAppSummary(app.key);
        updateCounts();
        if (app.key === "ring") {
          saveOptions(() => {
            chrome.runtime.sendMessage({ type: "cwi-refresh-ring-live" }, () => {
              void chrome.runtime.lastError;
            });
          });
        } else {
          saveOptions();
        }
      });
      switchLabel.append(appToggle, document.createElement("span"));

      let details = null;
      if (!standalone) {
        details = document.createElement("div");
        details.className = "app-details";
        details.id = `app-surfaces-${app.key}`;
        details.hidden = true;
        details.setAttribute("aria-label", `${app.label} icon locations`);

        const designPicker = makeDesignPicker(app, icon);
        const detailsTitle = document.createElement("p");
        detailsTitle.className = "details-title";
        detailsTitle.textContent = "Show classic icons in";
        const grid = document.createElement("div");
        grid.className = "app-surface-grid";
        for (const surface of SURFACES) grid.append(makeSurfaceControl(app, surface));
        details.append(designPicker, detailsTitle, grid);

        identity.setAttribute("aria-controls", details.id);
        const isOpen = openApps.has(app.key);
        identity.setAttribute("aria-expanded", String(isOpen));
        details.hidden = !isOpen;
        if (isOpen) card.classList.add("is-open");
        identity.addEventListener("click", () => {
          const expanded = identity.getAttribute("aria-expanded") === "true";
          identity.setAttribute("aria-expanded", String(!expanded));
          details.hidden = expanded;
          card.classList.toggle("is-open", !expanded);
        });
      }

      row.append(identity, switchLabel);
      card.append(row);
      if (details) card.append(details);
      appsList.append(card);
      updateAppSummary(app.key);
    }
  }

  function render() {
    masterToggle.checked = options.enabled !== false;
    renderGlobalSurfaces();
    renderApps();
    updateCounts();
  }

  async function init() {
    versionText.textContent = chrome.runtime.getManifest().version;
    options = await settings.getOptions();
    render();

    masterToggle.addEventListener("change", () => {
      options.enabled = masterToggle.checked;
      saveOptions();
      renderApps();
    });

    document.getElementById("supportButton").addEventListener("click", () => openUrl(SUPPORT_URL));
    document.getElementById("reportButton").addEventListener("click", () => openUrl(REPORT_URL));
  }

  init();
})();
