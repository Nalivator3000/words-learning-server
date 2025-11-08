# Troubleshooting Guide

## CSP Errors with traffic.js / requests.js

### Symptom
```
Error fetching ...: TypeError: Failed to fetch. Refused to connect because it violates CSP
    at s.fetch (requests.js:1:3798)
    at traffic.js:1:1473
    at fetch (traffic.js:1:1450)
```

### Cause
A **browser extension** is intercepting and blocking fetch requests. The files `traffic.js` and `requests.js` do not exist in this project - they are injected by a browser extension.

### Solution

**✅ FIXED:** Disabled `upgradeInsecureRequests` in CSP for localhost development (commit a0ca15c).

The root cause was that helmet.js was automatically adding `upgrade-insecure-requests` directive, which forced all HTTP requests to be upgraded to HTTPS. This caused browser extensions to fail when trying to connect to `http://localhost:3000`.

Changes made:
- Added `http://localhost:*` to CSP `connectSrc` directive
- Set `useDefaults: false` to prevent helmet from adding default CSP directives
- Explicitly removed `upgradeInsecureRequests` from CSP

Simply **refresh the page** (Ctrl+Shift+R for hard refresh) and the error should disappear.

#### Alternative Solutions (if issue persists):

##### Option 1: Use Incognito/Private Mode
1. Open browser in incognito/private mode (extensions are usually disabled)
2. Navigate to the application
3. Check if the error disappears

##### Option 2: Disable Extensions
1. Open browser extensions page:
   - Chrome: `chrome://extensions`
   - Firefox: `about:addons`
   - Edge: `edge://extensions`
2. Disable all extensions
3. Refresh the application
4. Re-enable extensions one by one to identify the culprit

##### Option 3: Try Another Browser
Use a different browser without extensions installed.

### Common Culprits
Extensions that often cause this issue:
- **AdBlock / uBlock Origin** - Ad blockers
- **Privacy Badger** - Privacy tools
- **VPN extensions** - Proxy/VPN tools
- **Antivirus browser extensions**
- **Developer tools extensions**

### How to Identify the Extension
1. Open DevTools Console (F12)
2. Look for the error stack trace
3. The extension name may appear in the error or in the Sources tab
4. Check the Sources tab for `traffic.js` or `requests.js` to see which extension added it

### Prevention
For development, use a dedicated browser profile without extensions:
```bash
# Chrome - Create clean profile for development
chrome.exe --user-data-dir="C:\ChromeDev" --disable-extensions

# Firefox - Create clean profile
firefox.exe -P development -no-remote
```

## Quiz Not Starting - "No words to study"

### Symptom
Error message: "No words to study. Please import some words first!"

### Debug Steps
1. Open DevTools Console (F12)
2. Try to start a quiz
3. Look for debug logs with emoji icons:
   - 🎮 Starting study quiz
   - 👤 Current user
   - 🌍 Current language pair
   - 📚 Lesson size
   - 🔍 getRandomWords

### Common Causes
1. **User not logged in** - Check if user object is null
2. **No language pair selected** - Check if languagePairId is null/undefined
3. **No words imported** - Check if there are words in the database
4. **API request failing** - Check Network tab for failed requests

### Solutions
- If user is null: Log out and log back in
- If languagePairId is null: Select a language pair in settings
- If no words: Import words from the Import section
- If API failing: Check if server is running and accessible
