# Old Google Icons for Workspace

Restore the classic Google Workspace icons in the browser tab, app header, Google app launcher and supported side panels.

My goal with browser extensions is to keep them simple, accessible and free for everyone. I also care a lot about privacy: I do not want to build tools that secretly sell or misuse people's data, as many extensions unfortunately do.

If you find my work useful, any support is greatly appreciated and helps me keep maintaining and improving these projects.
https://buymeacoffee.com/openextensions

You can install and keep the extension easily configured from the Chrome Web Store:
https://chromewebstore.google.com/detail/old-google-icons-for-work/fmjfppfhcmngnmmlpellgekebpcmiagj?authuser=1&hl=en

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

## What's new in 1.0.4

- Fixed top-left app icon positioning and hover behavior in Google Docs, Sheets and Slides.
- Fixed the hover background for replaced icons in the Google app launcher.

## What's new in 1.0.5

- Fixed the Google Meet favicon so the classic icon is correctly restored in the browser tab.
- Added a stronger Meet favicon lock to prevent Google Meet from replacing the classic icon.
- Added cache-busting for the Meet favicon to prevent Chrome from continuing to display a previously cached icon.

## What's new in 1.0.6

- Added a Ring entry to the extension panel with its own on/off switch.
- Restored the classic multicolour Google account ring (red, yellow, green, blue)
  in place of the redesigned blue AI-style ring.
- The new ring is swapped at the network layer. Google serves it as a bitmap from
  `gstatic.com/gb/images/ring/`, so a declarativeNetRequest rule redirects those
  requests to the packaged classic ring. The page never downloads the new ring,
  on any Google surface, in any frame, before first paint.
- `account-ring.js` stays as a fallback for variants drawn as inline SVG rather
  than requested as an image (including the large ring shown after clicking the
  avatar).
- Turning the Ring switch on or off updates open Google tabs immediately, without
  a page refresh.
