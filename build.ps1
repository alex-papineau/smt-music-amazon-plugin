# Build script for SMT IV: Amazon Edition
# Creates dist/chrome and dist/firefox directories with appropriate manifests

$ErrorActionPreference = "Stop"

# Define source and destination
$rootDir = Get-Location
$chromeDist = Join-Path $rootDir "dist\chrome"
$firefoxDist = Join-Path $rootDir "dist\firefox"

# Clean previous builds
if (Test-Path $chromeDist) { Remove-Item $chromeDist -Recurse -Force }
if (Test-Path $firefoxDist) { Remove-Item $firefoxDist -Recurse -Force }

# Create directories
New-Item -ItemType Directory -Force -Path $chromeDist | Out-Null
New-Item -ItemType Directory -Force -Path $firefoxDist | Out-Null

# Common files to copy
$commonFiles = @(
    "assets",
    "offscreen",
    "popup",
    "background.js",
    "content.css",
    "content.js",
    "README.md"
)

# Function to copy common files
function Copy-CommonFiles($destination) {
    foreach ($file in $commonFiles) {
        if (Test-Path "$rootDir\$file") {
            Copy-Item -Path "$rootDir\$file" -Destination $destination -Recurse
        }
    }
}

Write-Host "Building Chrome extension..."
Copy-CommonFiles $chromeDist
# Copy Chrome manifest
if (Test-Path "$rootDir\manifest.chrome.json") {
    Copy-Item -Path "$rootDir\manifest.chrome.json" -Destination "$chromeDist\manifest.json"
} else {
    Write-Warning "manifest.chrome.json not found. Checking if manifest.json is Chrome version..."
    # Fallback logic if user renamed it back manually
    Copy-Item -Path "$rootDir\manifest.json" -Destination "$chromeDist\manifest.json"
}

Write-Host "Building Firefox extension..."
Copy-CommonFiles $firefoxDist
# Copy Firefox manifest
# First check if we have an explicit firefox manifest
if (Test-Path "$rootDir\manifest.firefox.json") {
    Copy-Item -Path "$rootDir\manifest.firefox.json" -Destination "$firefoxDist\manifest.json"
} elseif (Test-Path "$rootDir\manifest.json") {
    # If explicit firefox manifest missing, assume current manifest.json is Firefox (per current state)
    # But ideally we rename it to manifest.firefox.json to be safe next time
    Copy-Item -Path "$rootDir\manifest.json" -Destination "$firefoxDist\manifest.json"
}

Write-Host "Build complete!"
Write-Host "Chrome: $chromeDist"
Write-Host "Firefox: $firefoxDist"
Write-Host "Load these directories as unpacked extensions in their respective browsers."
