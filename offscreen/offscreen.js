const player = document.getElementById('player');
let currentTrack = '';

function init() {
    chrome.storage.local.get(['enabled', 'volume', 'track'], (data) => {
        if (data && data.enabled) {
            updatePlayer(data.track, data.volume, data.enabled);
        }
    });
}

function updatePlayer(track, volume, enabled) {
    if (!track) return;

    // Convert relative extension path to full URL
    const trackUrl = chrome.runtime.getURL(track);

    if (track !== currentTrack) {
        currentTrack = track;
        player.src = trackUrl;
        player.load();
    }

    player.volume = (volume || 0) / 100;

    if (enabled) {
        player.play().catch(err => {
            if (err.name !== 'AbortError') {
                console.error("Playback failed:", err);
            }
        });
    } else {
        player.pause();
    }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        chrome.storage.local.get(['enabled', 'volume', 'track'], (data) => {
            updatePlayer(data.track, data.volume, data.enabled);
        });
    }
});

// Listen for manual actions (like RESTART)
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'RESTART_OFFSCREEN') {
        player.currentTime = 0;
        player.play().catch(err => console.error("Restart failed:", err));
    }
});

init();
