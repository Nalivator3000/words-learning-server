# 📱 APK Build Instructions - v5.1.0

**Version:** 5.1.0
**Build Date:** 2025-11-04

---

## 🚀 Quick Start (Using Bubblewrap)

### Prerequisites
- ✅ Node.js installed
- ✅ Java JDK installed (check: `java -version`)
- ✅ Bubblewrap CLI installed (`npm install -g @bubblewrap/cli`)

### Step 1: Update TWA Configuration

Убедитесь что в `twa-manifest.json` актуальные данные:

```json
{
  "packageId": "com.lexybooster.app",
  "name": "LexyBooster",
  "launcherName": "LexyBooster",
  "displayMode": "standalone",
  "orientation": "portrait",
  "themeColor": "#6366f1",
  "backgroundColor": "#1a1a2e",
  "startUrl": "/?source=twa",
  "iconUrl": "https://words-learning-server-production.up.railway.app/icons/icon-512x512.png",
  "maskableIconUrl": "https://words-learning-server-production.up.railway.app/icons/icon-512x512-maskable.png",
  "webManifestUrl": "https://words-learning-server-production.up.railway.app/manifest.json",
  "shortcuts": [],
  "enableNotifications": true,
  "features": {
    "locationDelegation": {
      "enabled": false
    },
    "playBilling": {
      "enabled": false
    }
  }
}
```

### Step 2: Build APK

```bash
# Navigate to project directory
cd c:/Users/Nalivator3000/words-learning-server

# Build APK with Bubblewrap
bubblewrap build

# Or if you need to init first:
# bubblewrap init --manifest=https://words-learning-server-production.up.railway.app/manifest.json
```

APK будет создан в: `./app-release-signed.apk`

---

## 🔑 Signing the APK

Если APK не подписан автоматически:

```bash
# Generate keystore (только один раз)
keytool -genkey -v -keystore lexybooster-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lexybooster

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore lexybooster-release-key.jks app-release-unsigned.apk lexybooster

# Align APK
zipalign -v 4 app-release-unsigned.apk lexybooster-v5.1.0.apk
```

⚠️ **ВАЖНО:** Сохрани keystore файл и пароль! Без него невозможно обновлять приложение!

---

## 📤 Upload to Google Play Console

### Step 1: Login to Play Console
1. Перейти на [Google Play Console](https://play.google.com/console/)
2. Выбрать приложение "LexyBooster"

### Step 2: Create Release
1. **Production** → **Releases** → **Create new release**
2. Upload APK: `lexybooster-v5.1.0.apk`

### Step 3: Fill Release Information

**Release name:** `5.1.0 - Daily Challenges & Streak Freeze`

**Release notes (EN):**
```
🎉 What's New in v5.1.0

✨ Daily Challenges - Complete 3 challenges every day!
❄️ Streak Freeze - Protect your learning streak
🐛 Bug Reports - Report issues directly in-app
🌍 Universal Support - Learn any language pair
📱 Mobile Improvements - Better UX

Bug fixes & performance improvements included!
```

**Release notes (RU):**
```
🎉 Что нового в v5.1.0

✨ Ежедневные задания - Выполняй 3 задания каждый день!
❄️ Заморозка стрика - Защити свою серию обучения
🐛 Отчёты об ошибках - Сообщай о проблемах в приложении
🌍 Универсальность - Изучай любую языковую пару
📱 Улучшения - Лучший UX

Исправления багов и улучшения производительности!
```

### Step 4: Rollout Strategy

**Recommended:** Staged rollout
- Day 1-3: 10% of users
- Day 4-7: 50% of users
- Day 8+: 100% of users

OR

**Alternative:** Full rollout immediately (если уверен в стабильности)

### Step 5: Review and Publish
1. Review all information
2. Click **"Review release"**
3. Click **"Start rollout to production"**

⏱️ **Review time:** Usually 1-3 days for Google to review

---

## 🧪 Testing Before Upload

### Local Testing
```bash
# Install on device/emulator
adb install lexybooster-v5.1.0.apk

# Or drag & drop APK to emulator
```

### Test Checklist
- [ ] App opens without crashes
- [ ] Daily Challenges visible and working
- [ ] Streak Freeze UI accessible
- [ ] Bug Reports form functional
- [ ] All buttons work
- [ ] Dark mode working
- [ ] Translations correct
- [ ] No console errors
- [ ] Performance smooth

---

## 📊 Version Information

```
Version Name: 5.1.0
Version Code: 510 (increment from previous)
Min SDK: 21 (Android 5.0 Lollipop)
Target SDK: 34 (Android 14)
Package Name: com.lexybooster.app
```

---

## 🎨 App Bundle (AAB) - Alternative

Google Play рекомендует App Bundle вместо APK:

```bash
# Build AAB with Bubblewrap
bubblewrap build --appBundle

# AAB будет создан: ./app-release.aab
```

**Преимущества AAB:**
- Меньший размер загрузки
- Автоматическая оптимизация для устройств
- Required для новых приложений с August 2021

**Рекомендация:** Используй AAB для production

---

## 🔄 Update Existing App

Если это обновление существующего приложения:

1. **Version Code** должен быть больше предыдущего
2. **Package Name** должен совпадать с предыдущим
3. **Keystore** должен быть тот же самый
4. **Min SDK** не должен увеличиваться (можно только уменьшать)

---

## 🐛 Troubleshooting

### Error: "Package name mismatch"
**Решение:** Убедись что `packageId` в `twa-manifest.json` совпадает с Play Console

### Error: "Invalid APK"
**Решение:** Пересоздай APK с правильной подписью

### Error: "Version code conflict"
**Решение:** Увеличь version code в `twa-manifest.json`

### Error: "Missing Play Store Key"
**Решение:** Дождись 4 ноября чтобы сбросить ключ

---

## 📝 Important Files

```
lexybooster-v5.1.0.apk          - Signed APK for Play Store
lexybooster-release-key.jks     - Keystore (KEEP SAFE!)
twa-manifest.json               - TWA configuration
PLAY_STORE_RELEASE_NOTES_5.1.0.md - Release notes
CHANGELOG.md                     - Full changelog
```

---

## ✅ Pre-Upload Checklist

- [ ] Version bumped to 5.1.0
- [ ] APK built successfully
- [ ] APK tested on device
- [ ] All new features working
- [ ] No crashes or critical bugs
- [ ] Release notes prepared
- [ ] Screenshots updated (if UI changed significantly)
- [ ] Keystore safely backed up
- [ ] Privacy policy reviewed

---

## 🎯 After Upload

1. Monitor Play Console for reviews
2. Check crash reports
3. Monitor user feedback
4. Be ready to hotfix if needed
5. Celebrate when approved! 🎉

---

## 📞 Support

If you encounter issues:
1. Check [TWA_BUILD_GUIDE.md](TWA_BUILD_GUIDE.md)
2. Check [GOOGLE_PLAY_SETUP_GUIDE.md](GOOGLE_PLAY_SETUP_GUIDE.md)
3. Review Google Play Console documentation
4. Check Bubblewrap documentation

---

**Good luck with the release! 🚀**
