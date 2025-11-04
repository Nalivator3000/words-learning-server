# 📱 Android APK Quick Start - LexyBooster v5.1.0

**Ready to build Android app in 5 steps!**

---

## 📋 What You Need

1. **Java JDK** - [Download Adoptium JDK 11](https://adoptium.net/)
2. **Bubblewrap CLI** - Install with: `npm install -g @bubblewrap/cli`
3. **15 minutes** - First build takes time, later builds are faster

---

## 🚀 Quick Build Steps

### 1️⃣ Install Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

### 2️⃣ Navigate to Project
```bash
cd c:/Users/Nalivator3000/words-learning-server
```

### 3️⃣ Build APK
```bash
bubblewrap build
```

This will:
- Download Android SDK (first time only)
- Build APK using pre-configured `twa-manifest.json`
- Output: `app-release-signed.apk`

### 4️⃣ Test on Device
```bash
adb install app-release-signed.apk
```

### 5️⃣ Upload to Play Store
1. Go to [Google Play Console](https://play.google.com/console/)
2. Select LexyBooster app
3. **Production** → **Create new release**
4. Upload `app-release.aab` (or `app-release-signed.apk`)
5. Copy release notes from [PLAY_STORE_RELEASE_NOTES_5.1.0.md](PLAY_STORE_RELEASE_NOTES_5.1.0.md)
6. Submit for review

---

## ✅ Pre-Configured Settings

Everything is already set up in `twa-manifest.json`:

- **Package:** com.lexybooster.app
- **Version:** 5.1.0 (Code: 510)
- **App Name:** LexyBooster
- **Production URL:** words-learning-server-production.up.railway.app
- **Icons:** 512x512px, maskable
- **Theme:** #6366f1 (Indigo)
- **Background:** #1a1a2e (Dark)

---

## 📚 Detailed Guides

Need more details? Check these comprehensive guides:

1. **[APK_BUILD_INSTRUCTIONS_5.1.0.md](APK_BUILD_INSTRUCTIONS_5.1.0.md)**
   - Complete build & upload guide
   - Play Store submission steps
   - Release notes (EN/RU)

2. **[TWA_BUILD_GUIDE.md](TWA_BUILD_GUIDE.md)**
   - Step-by-step TWA setup
   - Troubleshooting common issues
   - Asset links configuration

3. **[PLAY_STORE_RELEASE_NOTES_5.1.0.md](PLAY_STORE_RELEASE_NOTES_5.1.0.md)**
   - Release notes in English & Russian
   - Short descriptions (80 chars)
   - Full descriptions (500 chars)
   - Key selling points

---

## 🐛 Quick Troubleshooting

### "Java not found"
```bash
# Download & install: https://adoptium.net/
# Verify: java -version
```

### "Bubblewrap command not found"
```bash
npm install -g @bubblewrap/cli
```

### "Build failed"
Check [TWA_BUILD_GUIDE.md](TWA_BUILD_GUIDE.md) troubleshooting section

---

## ⚠️ Important Notes

1. **First build takes 10-15 minutes** (downloads Android SDK ~500MB)
2. **Later builds take 2-3 minutes**
3. **SAVE your keystore password!** You'll need it for updates
4. **Backup keystore file** - Can't update app without it!

---

## 🎯 What's New in v5.1.0?

✨ **Daily Challenges** - Complete 3 challenges every day!
❄️ **Streak Freeze** - Protect your learning streak
🐛 **Bug Reports** - Report issues directly in-app
🌍 **Universal Support** - Learn any language pair
📱 **Mobile Improvements** - Better UX

See full [CHANGELOG.md](CHANGELOG.md)

---

## ✅ Build Checklist

- [ ] Java JDK installed (`java -version`)
- [ ] Bubblewrap installed (`bubblewrap --version`)
- [ ] APK builds successfully (`bubblewrap build`)
- [ ] APK tested on device
- [ ] Ready to upload to Play Store

---

**Questions?** Check the detailed guides above or [open an issue](https://github.com/Nalivator3000/words-learning-server/issues)

**Good luck with your release! 🚀**
