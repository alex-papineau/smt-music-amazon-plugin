# Amazon SMT Music Companion

A Firefox Extension that plays music from a selection of black market/shopping related tracks from ATLUS' various games (SMT 4, SMT 3, P1 and P3 so far) while browsing Amazon. Complete with a popup UI to control the music.

*"Make sure you bring more Macca next time."*

## Installation

1. Clone or download this repository.
2. Open Firefox and navigate to `about:debugging`.
3. Click **This Firefox** in the top left.
4. Click **Load Temporary Add-on** and select the `manifest.json` file in the root directory of this project.
5. **Visit Amazon.** The song should play automatically. Click the extension icon in the toolbar to open the controls.

## How it works

The extension uses a background script to monitor your active tabs for Amazon URLs. When an Amazon page is detected, it triggers audio playback of tracks hosted via GitHub Pages. The background page in Firefox handles the playback directly using the standard Audio API.

## Features

- **"Active Tab Only" Playback**: Automatically pauses music when you switch to other tabs or windows.
- **Track Randomization**: Pick a random track anytime with the "RANDOM" button.
- **SMT IV Style UI**: A terminal-themed popup interface inspired by SMT IV.
- **Dynamic Notifications**: A custom "Now Playing" toast appears on Amazon pages.

## License

MIT
