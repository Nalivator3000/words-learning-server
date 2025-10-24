# 📱 TWA Setup Guide - FluentFlow Android Release

**Last Updated**: 2025-10-24
**Status**: Ready for TWA initialization
**Target**: Google Play Store

---

## Prerequisites ✅

### Already Installed:
- ✅ Node.js (v22.18.0)
- ✅ npm (v10.x)
- ✅ @bubblewrap/cli (installed globally)

### Need to Install:

#### 1. **Java Development Kit (JDK) 17+**
```bash
# Download from: https://adoptium.net/
# Or use Chocolatey:
choco install temurin17

# Verify installation:
java -version
# Should show: openjdk version "17.0.x" or higher
```

#### 2. **Android Command Line Tools**
```bash
# Download from: https://developer.android.com/studio#command-tools
# Or install Android Studio: https://developer.android.com/studio

# Add to PATH:
# C:\Users\<username>\AppData\Local\Android\Sdk\cmdline-tools\latest\bin
# C:\Users\<username>\AppData\Local\Android\Sdk\platform-tools

# Verify:
sdkmanager --version
```

---

## Step-by-Step Setup

### Step 1: Initialize Bubblewrap Project

```bash
cd c:/Users/Nalivator3000/words-learning-server

# Initialize TWA (interactive prompts)
bubblewrap init --manifest=https://your-domain.com/manifest.json
```

**Interactive Prompts:**
1. **App Package Name**: `com.fluentflow.app`
2. **App Name**: `FluentFlow`
3. **Start URL**: `https://your-domain.com/?source=pwa`
4. **Icon URL**: `https://your-domain.com/icons/icon-512x512.png`
5. **Maskable Icon URL**: `https://your-domain.com/icons/icon-512x512-maskable.png`
6. **Theme Color**: `#6366f1`
7. **Background Color**: `#1a1a2e`
8. **Display Mode**: `standalone`
9. **Orientation**: `portrait`
10. **Enable Notifications**: `Yes`
11. **Status Bar Color**: `#4f46e5`

**Output**: Creates `twa-manifest.json` configuration file

---

### Step 2: Configure Digital Asset Links

Create `/public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.fluentflow.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT_HERE"
    ]
  }
}]
```

**Get SHA256 Fingerprint:**
```bash
# After generating keystore (Step 3)
keytool -list -v -keystore android.keystore -alias fluentflow-key
# Copy the SHA256 fingerprint
```

---

### Step 3: Generate Signing Keystore

```bash
# Create Android keystore for app signing
keytool -genkey -v -keystore android.keystore -alias fluentflow-key -keyalg RSA -keysize 2048 -validity 10000

# Prompts:
# - Password: <create strong password, save in password manager>
# - First and Last name: FluentFlow
# - Organizational unit: Development
# - Organization: FluentFlow
# - City: <your city>
# - State: <your state>
# - Country: <2-letter code, e.g., US>
```

**Important**:
- Save password in secure location (1Password, Bitwarden, etc.)
- Backup `android.keystore` file (if lost, can't update app!)
- Add to `.gitignore`: `android.keystore`

---

### Step 4: Update Bubblewrap Config

Edit `twa-manifest.json`:

```json
{
  "packageId": "com.fluentflow.app",
  "host": "your-domain.com",
  "name": "FluentFlow",
  "launcherName": "FluentFlow",
  "display": "standalone",
  "themeColor": "#6366f1",
  "navigationColor": "#4f46e5",
  "backgroundColor": "#1a1a2e",
  "enableNotifications": true,
  "startUrl": "/?source=pwa",
  "iconUrl": "https://your-domain.com/icons/icon-512x512.png",
  "maskableIconUrl": "https://your-domain.com/icons/icon-512x512-maskable.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "fluentflow-key"
  },
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  "shortcuts": [
    {
      "name": "Study Words",
      "short_name": "Study",
      "url": "/?section=study",
      "icon": "https://your-domain.com/icons/icon-96x96.png"
    },
    {
      "name": "Review Words",
      "short_name": "Review",
      "url": "/?section=review",
      "icon": "https://your-domain.com/icons/icon-96x96.png"
    }
  ],
  "alphaDependencies": {
    "enabled": false
  },
  "features": {
    "locationDelegation": {
      "enabled": false
    },
    "playBilling": {
      "enabled": false
    }
  },
  "minSdkVersion": 21,
  "targetSdkVersion": 33
}
```

---

### Step 5: Build APK

```bash
# Build debug APK (for testing)
bubblewrap build

# Output: app-release-unsigned.apk
# Location: ./app-release-unsigned.apk
```

**If build fails:**
- Check Java version: `java -version` (must be 17+)
- Check Android SDK installed: `sdkmanager --list`
- Install build tools: `sdkmanager "build-tools;33.0.0"`
- Install platform: `sdkmanager "platforms;android-33"`

---

### Step 6: Sign APK

```bash
# Bubblewrap signs automatically if signingKey configured
# Manual signing (if needed):
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore android.keystore app-release-unsigned.apk fluentflow-key

# Verify signature:
jarsigner -verify -verbose -certs app-release-unsigned.apk
```

---

### Step 7: Install on Device (Testing)

```bash
# Enable USB Debugging on Android device:
# Settings → About Phone → Tap "Build number" 7 times → Developer options → USB debugging

# Connect device via USB

# Install APK:
adb install app-release-unsigned.apk

# Check logs:
adb logcat | grep FluentFlow
```

**Testing Checklist:**
- [ ] App icon appears on launcher
- [ ] App opens to correct URL
- [ ] Deep links work (shortcuts)
- [ ] Offline mode works
- [ ] Notifications work (if enabled)
- [ ] No address bar (fullscreen standalone)
- [ ] Status bar color matches theme

---

### Step 8: Generate Release APK (for Google Play)

```bash
# Build release APK
bubblewrap build --release

# Output: app-release-signed.apk
```

**For Android App Bundle (AAB) - Preferred by Google Play:**
```bash
# Build AAB (smaller download size)
bubblewrap build --release --aab

# Output: app-release.aab
```

---

### Step 9: Upload to Google Play Console

1. **Create Google Play Developer Account**
   - Go to: https://play.google.com/console
   - Pay $25 one-time fee
   - Verify identity (2-3 days)

2. **Create New App**
   - App name: FluentFlow
   - Default language: English
   - App type: App
   - Free/Paid: Free

3. **Upload AAB/APK**
   - Go to: Production → Create new release
   - Upload `app-release.aab`
   - Release notes: "Initial release of FluentFlow language learning app"

4. **Fill Store Listing**
   - See: [PLAN_ANDROID_RELEASE.md](./PLAN_ANDROID_RELEASE.md) Phase 2

5. **Content Rating**
   - Fill questionnaire
   - FluentFlow: Everyone (3+)

6. **Submit for Review**
   - Review time: 1-7 days (usually 1-2 days)

---

## Digital Asset Links Verification

### Test Asset Links:
```bash
# Check if assetlinks.json is accessible:
curl https://your-domain.com/.well-known/assetlinks.json

# Should return valid JSON with your package name and fingerprint
```

### Verify in Android:
```bash
# Install TWA
adb install app-release.apk

# Check if TWA opens in fullscreen (no address bar)
# If address bar appears, asset links verification failed
```

---

## Troubleshooting

### Issue: "Bubblewrap command not found"
```bash
# Check global npm packages:
npm list -g --depth=0

# Reinstall:
npm install -g @bubblewrap/cli
```

### Issue: "Java not found"
```bash
# Install JDK 17+
# Add to PATH:
# JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x
```

### Issue: "Android SDK not found"
```bash
# Install Android Studio or Command Line Tools
# Set ANDROID_HOME:
# ANDROID_HOME=C:\Users\<username>\AppData\Local\Android\Sdk
```

### Issue: "Build failed: License not accepted"
```bash
# Accept all licenses:
sdkmanager --licenses
# Type 'y' for all prompts
```

### Issue: "Asset links verification failed"
```bash
# 1. Verify assetlinks.json is accessible via HTTPS
# 2. Verify SHA256 fingerprint matches keystore
# 3. Verify package name matches (com.fluentflow.app)
# 4. Wait 24-48 hours for Google to cache asset links
```

---

## Version Management

### Update App Version:
Edit `twa-manifest.json`:
```json
{
  "appVersionName": "1.0.1",  // User-visible version
  "appVersionCode": 2          // Incremental version code
}
```

**Rules:**
- `appVersionCode` must increase with each release (1, 2, 3, ...)
- `appVersionName` can be semantic versioning (1.0.0, 1.0.1, 1.1.0, ...)

### Rebuild after version update:
```bash
bubblewrap build --release --aab
```

---

## Security Best Practices

1. **Never commit keystore to git**
   ```bash
   echo "android.keystore" >> .gitignore
   echo "*.keystore" >> .gitignore
   ```

2. **Backup keystore securely**
   - Upload to encrypted cloud storage (Google Drive, Dropbox with encryption)
   - Store in password manager's secure notes
   - Keep offline backup on encrypted USB drive

3. **Use strong keystore password**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols
   - Store in password manager

4. **Enable 2FA on Google Play Console**
   - Settings → Security → Two-factor authentication

---

## Next Steps After Upload

1. **Internal Testing Track** (1-2 days)
   - Add 10-20 testers
   - Fix critical bugs

2. **Closed Testing Track** (3-5 days)
   - Add 50-100 beta testers
   - Collect feedback

3. **Production Release** (1-7 days review)
   - Submit for review
   - Monitor crash reports
   - Respond to user reviews

---

## Useful Commands Cheat Sheet

```bash
# Check Bubblewrap version
bubblewrap --version

# Update Bubblewrap
npm update -g @bubblewrap/cli

# Clean build
rm -rf app-release-unsigned.apk app-release.aab

# List connected devices
adb devices

# Uninstall app
adb uninstall com.fluentflow.app

# View app logs
adb logcat | grep FluentFlow

# Take screenshot
adb exec-out screencap -p > screenshot.png

# Get APK info
aapt dump badging app-release.apk
```

---

## Resources

- **Bubblewrap Docs**: https://github.com/GoogleChromeLabs/bubblewrap
- **TWA Guide**: https://developer.chrome.com/docs/android/trusted-web-activity/
- **Google Play Console**: https://play.google.com/console
- **Asset Links Tool**: https://developers.google.com/digital-asset-links/tools/generator
- **Android Studio**: https://developer.android.com/studio
- **FluentFlow Docs**: See PLAN_ANDROID_RELEASE.md

---

**Created**: 2025-10-24
**Author**: Claude Code
**Status**: Ready for implementation 🚀
