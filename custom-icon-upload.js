(() => {
  const APP_LABELS = {
    gmail: "Gmail", calendar: "Calendar", drive: "Drive", docs: "Docs",
    sheets: "Sheets", slides: "Slides", forms: "Forms", meet: "Meet",
    chat: "Chat", keep: "Keep", maps: "Maps", vids: "Vids", tasks: "Tasks",
    voice: "Voice", sites: "Sites", photos: "Photos", wallet: "Wallet"
  };
  const params = new URLSearchParams(location.search);
  const app = params.get("app");
  const settings = globalThis.__CWI_SETTINGS__;
  const appName = document.getElementById("appName");
  const input = document.getElementById("imageInput");
  const preview = document.getElementById("preview");
  const dropZone = document.getElementById("dropZone");
  const dropPrompt = document.getElementById("dropPrompt");
  const status = document.getElementById("status");

  if (!Object.hasOwn(APP_LABELS, app) || !settings) {
    document.getElementById("uploadTitle").textContent = "App not found";
    input.disabled = true;
    status.textContent = "Return to the extension popup and choose an app first.";
    return;
  }

  appName.textContent = APP_LABELS[app];

  async function convertImage(file) {
    if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      throw new Error("Choose a PNG, JPG or WebP image.");
    }
    if (file.size > 5 * 1024 * 1024) throw new Error("The image must be 5 MB or smaller.");

    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width !== bitmap.height) throw new Error("The image must be square (1:1).");
      if (bitmap.width < 32 || bitmap.width > 2048) {
        throw new Error("Use an image between 32 × 32 and 2048 × 2048 pixels.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      canvas.getContext("2d", { alpha: true }).drawImage(bitmap, 0, 0, 128, 128);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
      if (!blob || blob.size > 64 * 1024) throw new Error("This image could not be optimized. Try a simpler image.");
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read this image."));
        reader.readAsDataURL(blob);
      });
    } finally {
      bitmap.close();
    }
  }

  async function saveIcon(dataUrl) {
    const icons = await settings.getCustomIcons();
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ cwiCustomIcons: { ...icons, [app]: dataUrl } }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });

    const options = await settings.getOptions();
    options.customIconsEnabled[app] = true;
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set({ cwiOptions: settings.normalizeOptions(options) }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
  }

  async function processFile(file) {
    if (!file) return;
    input.disabled = true;
    status.className = "status";
    status.textContent = "Preparing and saving your icon…";
    try {
      const dataUrl = await convertImage(file);
      await saveIcon(dataUrl);
      preview.src = dataUrl;
      preview.hidden = false;
      dropPrompt.hidden = true;
      status.className = "status is-success";
      status.textContent = `${APP_LABELS[app]} icon saved. Return to the extension popup to see it.`;
    } catch (error) {
      status.className = "status is-error";
      status.textContent = error.message || "Could not save this image.";
    } finally {
      input.value = "";
      input.disabled = false;
    }
  }

  input.addEventListener("change", () => processFile(input.files?.[0]));
  dropZone.addEventListener("click", () => input.click());
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  });
  for (const eventName of ["dragenter", "dragover"]) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      dropZone.classList.add("is-dragging");
    });
  }
  for (const eventName of ["dragleave", "dragend"]) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove("is-dragging");
    });
  }
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
    processFile(event.dataTransfer.files?.[0]);
  });
})();
