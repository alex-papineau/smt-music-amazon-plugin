// Initialize storage with defaults and handle migrations
chrome.runtime.onInstalled.addListener(async (details) => {
    const data = await chrome.storage.local.get(['enabled', 'volume', 'track', 'onlyActiveTab']);

    const defaults = {
        enabled: data.enabled ?? true,
        volume: data.volume ?? 50,
        track: data.track ?? getRandomTrackUrl(),
        onlyActiveTab: data.onlyActiveTab ?? true
    };

    // Ensure track is remote and using the correct repo
    const isOldPath = defaults.track.startsWith('assets/') || defaults.track.startsWith('content/');
    const isOldRepo = defaults.track.includes('smt-music-amazon-plugin');
    const isOldFilename = defaults.track.endsWith('/black_market.webm') && !defaults.track.includes('smt4_') && !defaults.track.includes('p1_');

    if (isOldPath || isOldRepo || isOldFilename) {
        defaults.track = getDefaultTrackUrl();
    }

    await chrome.storage.local.set(defaults);
});

// Firefox Environment: Background pages always have DOM access
let audioPlayer = new Audio();
audioPlayer.loop = true;
audioPlayer.crossOrigin = 'anonymous';

let currentTrack = '';
let currentVolume = 50;
let isAudioEnabled = true;

// Function to handle direct audio playback
function updateDirectAudio(track, volume, enabled) {
    if (!audioPlayer) return;

    if (track !== undefined) {
        const trackUrl = (track.startsWith('http://') || track.startsWith('https://'))
            ? track
            : chrome.runtime.getURL(track);

        if (track !== currentTrack && track) {
            console.log(`Changing track source to: ${trackUrl}`);
            currentTrack = track;
            audioPlayer.src = trackUrl;
            audioPlayer.load();
        }
    }

    if (volume !== undefined) {
        currentVolume = volume;
        audioPlayer.volume = volume / 100;
    }

    if (enabled !== undefined) {
        isAudioEnabled = enabled;
    }

    console.log(`Direct Audio State: enabled=${isAudioEnabled}, volume=${currentVolume}, track=${currentTrack}`);
}

// Separated play/pause logic so it can be called synchronously
function applyPlaybackState() {
    if (!audioPlayer) return;
    if (isAudioEnabled) {
        if (audioPlayer.paused) {
            console.log('Starting direct playback');
            audioPlayer.play().catch(err => {
                if (err.name !== 'AbortError') console.error('Direct playback failed:', err);
            });
        }
    } else {
        if (!audioPlayer.paused) {
            console.log('Pausing direct playback');
            audioPlayer.pause();
        }
    }
}

// Helper to sync direct audio with current browser state
async function syncState() {
    let { enabled, volume, track, onlyActiveTab } = await chrome.storage.local.get(['enabled', 'volume', 'track', 'onlyActiveTab']);

    if (onlyActiveTab === undefined) onlyActiveTab = true;

    // Robust Migration: Always check if the current track is a legacy local path or old repo
    const isOldPath = track && (track.startsWith('assets/') || track.startsWith('content/'));
    const isOldRepo = track && track.includes('smt-music-amazon-plugin');
    const isOldFilename = track && track.endsWith('/black_market.webm') && !track.includes('smt4_') && !track.includes('p1_');

    if (isOldPath || isOldRepo || isOldFilename) {
        console.log("Migration triggered: correcting legacy track path.");
        track = getDefaultTrackUrl();
        await chrome.storage.local.set({ track });
    }

    // Check if any Amazon tabs are open
    const amazonTabs = await chrome.tabs.query({
        url: [
            "https://*.amazon.com/*",
            "https://*.amazon.ca/*",
            "https://*.amazon.co.uk/*",
            "https://*.amazon.de/*",
            "https://*.amazon.fr/*",
            "https://*.amazon.it/*",
            "https://*.amazon.es/*",
            "https://*.amazon.co.jp/*"
        ]
    });

    const hasAmazonTabs = amazonTabs.length > 0;

    // Check if current active tab is Amazon
    let isActiveTabAmazon = false;
    if (onlyActiveTab) {
        const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (activeTab && activeTab.url) {
            const url = activeTab.url;
            isActiveTabAmazon = url.includes('amazon.com') || url.includes('amazon.ca') || url.includes('amazon.co.uk') ||
                url.includes('amazon.de') || url.includes('amazon.fr') || url.includes('amazon.it') ||
                url.includes('amazon.es') || url.includes('amazon.co.jp');
        }
    }

    const shouldPlay = enabled && hasAmazonTabs && (!onlyActiveTab || isActiveTabAmazon);

    console.log(`Sync check: enabled=${enabled}, active amazon tabs=${amazonTabs.length}, onlyActiveTab=${onlyActiveTab}, isActiveTabAmazon=${isActiveTabAmazon}, track=${track}`);

    updateDirectAudio(track, volume, shouldPlay);
}

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AMAZON_VISITED') {
        syncState().then(() => {
            applyPlaybackState();
        });
    } else if (message.type === 'RANDOMIZE_TRACK') {
        randomizeTrack();
    } else if (message.type === 'RESTART_TRACK') {
        if (audioPlayer) {
            console.log("Restarting track");
            audioPlayer.currentTime = 0;
            audioPlayer.play().catch(console.error);
        }
    }

    return false;
});

// Select a random track and update storage
async function randomizeTrack() {
    const newTrack = getRandomTrackUrl();
    await chrome.storage.local.set({ track: newTrack });
    syncState().then(() => {
        applyPlaybackState();
    });
}

// Keep-alive for Firefox
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'keep-alive') {
        port.onMessage.addListener((msg) => {
            if (msg.type === 'ping') {
                // Ping received
            }
        });
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        syncState().then(() => {
            applyPlaybackState();
        });
    }
});

// Heartbeat alarm to keep background script alive
chrome.alarms.create('heartbeat', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'heartbeat') {
        // Heartbeat pulse
    }
});

// Tab event listeners
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    setTimeout(() => {
        syncState().then(() => {
            applyPlaybackState();
        });
    }, 100);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
        setTimeout(() => {
            syncState().then(() => {
                applyPlaybackState();
            });
        }, 100);
    }
});

chrome.tabs.onActivated.addListener(() => {
    syncState().then(() => {
        applyPlaybackState();
    });
});

chrome.windows.onFocusChanged.addListener(() => {
    syncState().then(() => {
        applyPlaybackState();
    });
});

// Initial sync
syncState();
