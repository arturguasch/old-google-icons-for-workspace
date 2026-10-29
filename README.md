# Old Google Icons: Customize Workspace Icons

Restore classic Google Workspace icons in browser tabs and bookmarks, app headers, the Google apps menu and supported Workspace side panels. Choose a classic design for each app or use your own image.

Supported apps: Gmail, Calendar, Drive, Docs, Sheets, Slides, Forms, Meet, Chat, Keep, Maps, Vids, Tasks, Voice and Sites, plus Google Photos and Google Wallet. Each app has its own on/off switch. Header replacements apply where a supported product logo is detected; the side panel supports Calendar, Keep, Maps and Tasks.

My goal with browser extensions is to keep them simple, accessible and free for everyone. I also care a lot about privacy: I do not want to build tools that secretly sell or misuse people's data, as many extensions unfortunately do.

If you find my work useful, any support is greatly appreciated and helps me keep maintaining and improving these projects.
https://buymeacoffee.com/openextensions

You can install and keep the extension easily configured from the Chrome Web Store:
https://chromewebstore.google.com/detail/old-google-icons-for-work/fmjfppfhcmngnmmlpellgekebpcmiagj?authuser=1&hl=en

The extension was previously named “Old Google Icons for Workspace”. It is now called “Old Google Icons: Customize Workspace Icons” to better describe its classic icon styles and custom icon options.

## 1.0.1

- Added support for replacing Calendar, Keep and Maps icons in the Google Workspace side panel.
- Fixed the top-left app icon replacement in Google Docs, Sheets and Slides.

## 1.0.2

- Fixed a Google Calendar issue where importing ICS or CSV files from Calendar settings could fail while the extension was enabled.
- Improved behavior on Google Calendar settings pages by preventing the app launcher visual replacement script from running there.

## 1.0.3

- Added a user-friendly extension panel to manage icon replacements from the toolbar.
- Added a global enable or pause control for the extension.
- Added per-app toggles to enable or disable icon replacement individually.
- Added quick access to support development, report issues and view the privacy policy.
- Improved live toggle behavior so supported icon changes apply without refreshing open Google pages.

## 1.0.4

- Fixed top-left app icon positioning and hover behavior in Google Docs, Sheets and Slides.
- Fixed the hover background for replaced icons in the Google app launcher.

## 1.0.5

- Fixed the Google Meet favicon so the classic icon is correctly restored in the browser tab.
- Added a stronger Meet favicon lock to prevent Google Meet from replacing the classic icon.
- Added cache-busting for the Meet favicon to prevent Chrome from continuing to display a previously cached icon.

## 1.0.6

- Added a Ring entry to the extension panel with its own on/off switch.
- Restored the classic multicolour Google account ring (red, yellow, green, blue)
  in place of the redesigned blue AI-style ring.

## 1.0.7

- Added support for Google Vids, Tasks, Voice, Sites, Photos and Wallet, with classic icons and individual on/off switches. Google Tasks is also supported in the Workspace side panel.
- Fixed the Drive header icon appearing over file previews. The classic icon now stays below preview and dialog layers.
- Fixed the Gmail logo text appearing blue. It now uses a neutral colour matched to the header background in light and dark themes.

## What's new in 1.0.8

- Redesigned the popup with a wider, clearer layout, global controls and expandable settings for each app.
- Added independent per-app switches for browser tabs and bookmarks, the main app logo, the Google apps menu and the Workspace side panel. Existing installations keep all locations enabled by default.
- Added classic icon choices from older Google designs, including the 31 date-specific Calendar icons. The 2020-era design is selected by default.
- Added custom icons for each app. Upload a square PNG, JPG or WebP image (32–2048 px, up to 5 MB); it is optimized to 128 × 128 px and stored on this device.
- Fixed the Google Slides header icon rotating between competing Drive and Slides logo slots.
- Renamed the extension from “Old Google Icons for Workspace” to “Old Google Icons: Customize Workspace Icons” to better reflect its icon customization features.
