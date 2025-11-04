# 📦 TWA Build Guide - LexyBooster Android APK/AAB

## 🎯 Goal
Build an Android APK/AAB file for LexyBooster using Bubblewrap CLI (Google's official TWA tool).

**No Android Studio needed!** ✅

---

## 📋 Prerequisites

### Required Software:

1. **Node.js** (v14+)
   - Check: `node --version`
   - Already installed ✅

2. **Java JDK** (v8 or v11)
   - Check: `java -version`
   - Download: https://adoptium.net/ (free, recommended)

3. **Android SDK Command Line Tools**
   - Will be installed automatically by Bubblewrap
   - OR download manually from: https://developer.android.com/studio

4. **Bubblewrap CLI**
   - Will install via npm

---

## 🚀 Step-by-Step Build Process

### Step 1: Install Java JDK (if not installed)

#### Windows:
1. Download: https://adoptium.net/temurin/releases/
2. Select:
   - Version: JDK 11 (LTS)
   - Operating System: Windows
   - Architecture: x64
3. Install and add to PATH
4. Verify:
   ```bash
   java -version
   ```

Expected output:
```
openjdk version "11.0.XX"
```

---

### Step 2: Install Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

Verify installation:
```bash
bubblewrap help
```

---

### Step 3: Initialize Bubblewrap for LexyBooster

Navigate to your project directory:
```bash
cd c:/Users/Nalivator3000/words-learning-server
```

Initialize TWA project:
```bash
bubblewrap init --manifest https://words-learning-server-copy-production.up.railway.app/manifest.json
```

**Bubblewrap will ask questions. Here are the answers:**

#### Question 1: App name
```
LexyBooster
```

#### Question 2: Short app name
```
LexyBooster
```

#### Question 3: Application ID (package name)
```
com.LexyBooster.app
```
⚠️ **IMPORTANT:** This is permanent! Cannot be changed after first upload to Google Play.

#### Question 4: Display mode
```
standalone
```
(Makes app look like native app - no browser UI)

#### Question 5: Orientation
```
default
```
(Allows both portrait and landscape)

#### Question 6: Theme color
```
#6366f1
```
(Indigo blue from your app)

#### Question 7: Background color
```
#ffffff
```
(White background for loading screen)

#### Question 8: Start URL
```
/
```
(Root path of your web app)

#### Question 9: Icon URL
```
https://words-learning-server-copy-production.up.railway.app/icons/icon-512x512.png
```

#### Question 10: Maskable icon URL
```
https://words-learning-server-copy-production.up.railway.app/icons/maskable-icon-512x512.png
```

#### Question 11: Shortcuts (optional)
```
No
```
(Or press Enter to skip for first release)

#### Question 12: Include Play Billing
```
No
```
(App is free, no in-app purchases)

#### Question 13: Signing key
```
Generate new signing key
```
Bubblewrap will generate keystore automatically.

**Keystore Password:**
- Bubblewrap will ask for password
- Choose a strong password
- **SAVE THIS PASSWORD!** You'll need it for every update
- Store in password manager (1Password, LastPass, etc.)

---

### Step 4: Review Generated Files

After initialization, you'll see:
```
✅ Project created successfully!

Files created:
- twa-manifest.json (TWA configuration)
- android/ (Android project directory)
- android/app/ (App source)
- android/app/build.gradle (Build config)
- android/keystore.jks (Signing key) ⚠️ KEEP SECRET!
```

**IMPORTANT - Backup Your Keystore:**
```bash
# Copy keystore to safe location
cp android/keystore.jks ../LexyBooster-keystore-BACKUP.jks

# Also save to cloud (Google Drive, Dropbox)
# Never commit to Git!
```

---

### Step 5: Build APK

Now build the APK:

```bash
bubblewrap build
```

This will:
1. Download Android SDK if needed (~500 MB, one-time)
2. Compile Android project
3. Sign APK with your keystore
4. Generate `app-release-signed.apk`

**Time:** First build: 10-15 minutes, Later builds: 2-3 minutes

**Output:**
```
✅ Build successful!

APK location: android/app/build/outputs/apk/release/app-release-signed.apk
Size: ~5-10 MB
```

---

### Step 6: Build AAB (for Google Play)

For Google Play Store, you need an AAB (Android App Bundle):

```bash
bubblewrap build --skipPwaValidation
```

This creates:
```
android/app/build/outputs/bundle/release/app-release.aab
```

AAB is smaller and optimized for Play Store delivery.

---

### Step 7: Test APK on Android Device

#### Option A: Install via ADB (Recommended)

1. Enable Developer Mode on Android:
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. Connect phone to computer via USB

3. Install APK:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release-signed.apk
   ```

4. Test app on phone

#### Option B: Transfer APK to Phone

1. Copy APK to phone via USB or cloud
2. Open APK on phone
3. Allow "Install from Unknown Sources"
4. Install and test

---

## 🔧 Common Build Issues & Solutions

### Issue 1: "Java not found"

**Solution:**
```bash
# Check Java installation
java -version

# If not installed, download from https://adoptium.net/
# Add to PATH after installation
```

### Issue 2: "Android SDK not found"

**Solution:**
Bubblewrap will download automatically. If it fails:
```bash
# Manual SDK installation
# Download from: https://developer.android.com/studio#command-tools
# Extract to: C:\Android\sdk
# Set environment variable: ANDROID_HOME=C:\Android\sdk
```

### Issue 3: "Build failed: invalid manifest"

**Solution:**
Check that manifest.json is valid:
```bash
# Verify manifest is accessible
curl https://words-learning-server-copy-production.up.railway.app/manifest.json

# Check JSON is valid
```

### Issue 4: "Signing failed: keystore not found"

**Solution:**
```bash
# Regenerate keystore
bubblewrap init

# Or specify keystore path
bubblewrap build --signingKeyPath=path/to/keystore.jks
```

### Issue 5: "APK size too large (>100 MB)"

**Solution:**
TWA apps are small (~5-10 MB) since they're just wrappers.
If yours is larger, check for:
- Bundled assets that should be on server
- Unnecessary dependencies

---

## 📱 Digital Asset Links Verification

For fullscreen TWA (no browser UI), you need Asset Links.

### Step 1: Generate assetlinks.json

Bubblewrap creates this automatically. Find SHA-256 fingerprint:

```bash
# Windows (PowerShell)
keytool -list -v -keystore android/keystore.jks -alias androiddebugkey

# Enter keystore password
# Copy SHA256 fingerprint
```

### Step 2: Create assetlinks.json

Create file at:
```
public/.well-known/assetlinks.json
```

Content:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.LexyBooster.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT_HERE"
    ]
  }
}]
```

### Step 3: Deploy to Production

Deploy `assetlinks.json` so it's accessible at:
```
https://words-learning-server-copy-production.up.railway.app/.well-known/assetlinks.json
```

Verify it's accessible:
```bash
curl https://words-learning-server-copy-production.up.railway.app/.well-known/assetlinks.json
```

### Step 4: Verify Asset Links

Use Google's validator:
https://developers.google.com/digital-asset-links/tools/generator

Enter:
- Website: `https://words-learning-server-copy-production.up.railway.app`
- App package name: `com.LexyBooster.app`

Should show: ✅ "Verified"

---

## 🎯 Build Checklist

Before uploading to Google Play:

- [ ] APK/AAB builds successfully
- [ ] APK tested on real Android device
- [ ] App opens in fullscreen (no browser UI)
- [ ] All features work (login, study, sync)
- [ ] Offline mode works
- [ ] No crashes in 10-minute usage
- [ ] Asset links verified (fullscreen mode)
- [ ] Keystore backed up to 2+ locations
- [ ] Keystore password saved in password manager
- [ ] App size < 100 MB (should be ~5-10 MB)
- [ ] Version code and version name set correctly

---

## 📊 Build Configuration Files

### twa-manifest.json
Main configuration file created by Bubblewrap.

**Key fields:**
```json
{
  "packageId": "com.LexyBooster.app",
  "host": "words-learning-server-copy-production.up.railway.app",
  "name": "LexyBooster",
  "launcherName": "LexyBooster",
  "display": "standalone",
  "themeColor": "#6366f1",
  "backgroundColor": "#ffffff",
  "startUrl": "/",
  "iconUrl": "https://words-learning-server-copy-production.up.railway.app/icons/icon-512x512.png",
  "maskableIconUrl": "https://words-learning-server-copy-production.up.railway.app/icons/maskable-icon-512x512.png",
  "signingKey": {
    "path": "./android/keystore.jks",
    "alias": "androiddebugkey"
  },
  "appVersionName": "1.0.0",
  "appVersionCode": 1
}
```

### android/app/build.gradle
Android build configuration.

**Key settings:**
```gradle
android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "com.LexyBooster.app"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## 🔄 Updating Your App

When you make changes to your web app:

1. **No rebuild needed!** TWA just loads your website
2. Users get updates automatically when you update the website
3. Only rebuild APK if:
   - Changing package name (can't do after first upload)
   - Changing app name
   - Updating icons
   - Changing theme colors
   - Updating manifest.json

To rebuild after changes:
```bash
# Update twa-manifest.json with changes
# Increment version code
bubblewrap update

# Build new APK
bubblewrap build
```

---

## 🎉 Success!

After successful build, you'll have:
- ✅ `app-release-signed.apk` - For testing on devices
- ✅ `app-release.aab` - For Google Play Store upload
- ✅ Keystore file - KEEP SAFE!

Next steps:
1. Test APK on Android device
2. Upload AAB to Google Play Console
3. Submit for review

---

## 📚 Additional Resources

**Bubblewrap Documentation:**
- GitHub: https://github.com/GoogleChromeLabs/bubblewrap
- CLI docs: https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli

**TWA Documentation:**
- Official guide: https://developer.chrome.com/docs/android/trusted-web-activity/
- Quick start: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start/

**Troubleshooting:**
- Bubblewrap issues: https://github.com/GoogleChromeLabs/bubblewrap/issues
- TWA FAQ: https://developer.chrome.com/docs/android/trusted-web-activity/faq/

---

## ⚠️ Important Reminders

1. **NEVER commit keystore to Git!**
   - Add to `.gitignore`: `*.jks`, `*.keystore`, `android/keystore.jks`

2. **BACKUP keystore to multiple locations:**
   - External hard drive
   - Cloud storage (Google Drive, Dropbox)
   - Password manager (as attachment)
   - USB drive in safe place

3. **SAVE keystore password:**
   - You cannot recover it if lost!
   - Cannot update app without it!
   - Store in password manager

4. **Package name is permanent:**
   - Cannot be changed after first Google Play upload
   - Choose carefully: `com.LexyBooster.app`

5. **Version codes must increment:**
   - v1.0.0 = code 1
   - v1.0.1 = code 2
   - v1.1.0 = code 3
   - Never reuse version codes!

---

**Created:** 2025-10-25
**Status:** Ready to use
**Estimated build time:** 15-30 minutes (first time)
