# 📱 AAB Quick Build Guide - LexyBooster v5.1.0

## ⚡ Быстрый Старт (5 минут)

### У вас ЕСТЬ keystore с SHA256 fingerprint `1A66E0...`

```bash
# 1. Скопируйте keystore в проект
cp /path/to/your/lexybooster-release-key.jks ./

# 2. Соберите AAB
node scripts/build-aab.js ./lexybooster-release-key.jks YOUR_PASSWORD

# 3. Загрузите в Play Store
# Файл: app-release.aab
```

### У вас НЕТ keystore (первая сборка)

```bash
# 1. Создайте новый keystore
keytool -genkey -v -keystore lexybooster-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias lexybooster

# ⚠️ СОХРАНИТЕ ПАРОЛЬ! Без него не сможете обновлять приложение!

# 2. Получите SHA256 fingerprint
keytool -list -v -keystore lexybooster-release-key.jks -alias lexybooster | grep SHA256

# 3. Обновите public/.well-known/assetlinks.json
# Замените старый fingerprint на новый (без двоеточий!)

# 4. Задеплойте изменения
git add public/.well-known/assetlinks.json
git commit -m "Update assetlinks.json with new keystore"
git push origin develop

# 5. Соберите AAB
node scripts/build-aab.js ./lexybooster-release-key.jks YOUR_PASSWORD
```

---

## 📋 Что Нужно

- ✅ Node.js (уже установлен)
- ✅ Java JDK (уже установлен)
- ✅ Bubblewrap CLI: `npm install -g @bubblewrap/cli`
- 🔑 Keystore файл (или создать новый)

---

## 🔑 Ваш Текущий Keystore

В [public/.well-known/assetlinks.json](public/.well-known/assetlinks.json) указан SHA256 fingerprint:

```
1A66E0A7E4B1920ADA5CB6E2CC9FCFA6D0EB05E542E3C43B98C447B22D549A48
```

**Package name:** `com.lexybooster.app`

Это значит, что у вас где-то есть keystore с этим fingerprint. Найдите его!

Проверить fingerprint вашего keystore:
```bash
keytool -list -v -keystore YOUR_KEYSTORE.jks -alias lexybooster | grep SHA256
```

---

## 🚀 Автоматическая Сборка

### Опция 1: С паролем в команде (быстро)

```bash
node scripts/build-aab.js ./lexybooster-release-key.jks YOUR_PASSWORD
```

### Опция 2: Без пароля (интерактивно)

```bash
node scripts/build-aab.js ./lexybooster-release-key.jks
```

Bubblewrap спросит пароль при сборке.

### Опция 3: Напрямую через Bubblewrap

```bash
# Убедитесь что twa-manifest.json настроен правильно
bubblewrap build
```

---

## 📦 Результаты Сборки

После успешной сборки вы получите:

1. **app-release.aab** - Для загрузки в Google Play Store
2. **app-release-signed.apk** - Для локального тестирования

**Размер:** ~5-10 MB (TWA приложения очень легкие!)

---

## 🎯 Следующие Шаги

### 1. Тест на устройстве (опционально)

```bash
adb install app-release-signed.apk
```

### 2. Загрузка в Play Store

1. Перейдите на [Google Play Console](https://play.google.com/console/)
2. Выберите приложение **LexyBooster**
3. **Production** → **Create new release**
4. Загрузите **app-release.aab**
5. Скопируйте release notes из [PLAY_STORE_RELEASE_NOTES_5.1.0.md](PLAY_STORE_RELEASE_NOTES_5.1.0.md)
6. **Review release** → **Start rollout to production**

### 3. Мониторинг

- Обычно review занимает 1-3 дня
- Проверяйте Play Console на ошибки
- Мониторьте crash reports после релиза

---

## 🆘 Проблемы?

### "Bubblewrap command not found"

```bash
npm install -g @bubblewrap/cli
```

### "Java not found"

Java JDK уже установлен. Перезапустите терминал.

### "Keystore not found"

Проверьте путь к keystore:
```bash
ls -la lexybooster-release-key.jks
```

### "Wrong password"

Keystore защищен паролем. Проверьте пароль в password manager.

### Другие проблемы

См. подробную документацию:
- [KEYSTORE_SETUP.md](KEYSTORE_SETUP.md) - Настройка keystore
- [APK_BUILD_INSTRUCTIONS_5.1.0.md](APK_BUILD_INSTRUCTIONS_5.1.0.md) - Детальные инструкции
- [TWA_BUILD_GUIDE.md](TWA_BUILD_GUIDE.md) - TWA troubleshooting

---

## ⚠️ ВАЖНО: Backup Keystore!

После создания/получения keystore:

```bash
# Создайте backup
cp lexybooster-release-key.jks ~/lexybooster-keystore-BACKUP-$(date +%Y%m%d).jks

# Также сохраните в:
# - Google Drive / Dropbox
# - External HDD
# - Password manager (as attachment)
```

**БЕЗ keystore вы НЕ СМОЖЕТЕ обновлять приложение в Play Store!**

---

## 📊 Информация о Версии

```json
{
  "version": "5.1.0",
  "versionCode": 510,
  "packageName": "com.lexybooster.app",
  "minSdk": 21,
  "targetSdk": 34
}
```

---

## ✅ Checklist

- [ ] Bubblewrap CLI установлен
- [ ] Java JDK установлен
- [ ] Keystore файл найден/создан
- [ ] SHA256 fingerprint проверен
- [ ] assetlinks.json обновлен (если новый keystore)
- [ ] AAB собран успешно
- [ ] AAB протестирован (опционально)
- [ ] AAB загружен в Play Console
- [ ] Release notes добавлены
- [ ] Keystore забэкаплен в 3+ места
- [ ] Пароль сохранен в password manager

---

**Готово к сборке! 🚀**

Запустите: `node scripts/build-aab.js`
