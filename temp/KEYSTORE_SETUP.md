# 🔑 Keystore Setup Guide - LexyBooster v5.1.0

## Существующий Keystore

У вас уже есть keystore с SHA256 fingerprint:
```
1A66E0A7E4B1920ADA5CB6E2CC9FCFA6D0EB05E542E3C43B98C447B22D549A48
```

Этот fingerprint уже прописан в [public/.well-known/assetlinks.json](public/.well-known/assetlinks.json) для package `com.lexybooster.app`.

---

## 🎯 Использование Существующего Keystore

### Шаг 1: Найти Keystore

Keystore файл обычно находится в одном из мест:

1. **В проекте:**
   - `./lexybooster-release-key.jks`
   - `./android/app/lexybooster.keystore`
   - `./android/keystore.jks`

2. **В домашней директории:**
   - `~/.android/debug.keystore` (debug keystore, НЕ для production!)
   - `~/lexybooster-release-key.jks`
   - `~/Documents/lexybooster-release-key.jks`

3. **В бэкапе:**
   - Google Drive
   - Dropbox
   - External HDD
   - Password manager (as attachment)

### Шаг 2: Скопировать Keystore в Проект

```bash
# Скопируйте keystore в корень проекта
cp /path/to/your/lexybooster-release-key.jks c:/Users/Nalivator3000/words-learning-server/

# Или если у вас другое имя файла:
cp /path/to/your/old-keystore.jks c:/Users/Nalivator3000/words-learning-server/lexybooster-release-key.jks
```

### Шаг 3: Проверить Keystore

Проверьте SHA256 fingerprint вашего keystore:

```bash
keytool -list -v -keystore lexybooster-release-key.jks -alias lexybooster
```

Введите пароль keystore.

**Важно:** SHA256 fingerprint должен совпадать с:
```
1A66E0A7E4B1920ADA5CB6E2CC9FCFA6D0EB05E542E3C43B98C447B22D549A48
```

Если fingerprint совпадает - отлично! Можете собирать AAB.

Если не совпадает - это другой keystore. Вам нужно найти правильный keystore с нужным fingerprint.

### Шаг 4: Собрать AAB с Существующим Keystore

```bash
# С паролем в командной строке (удобно для скриптов)
node scripts/build-aab.js ./lexybooster-release-key.jks YOUR_PASSWORD

# Без пароля (Bubblewrap спросит интерактивно)
node scripts/build-aab.js ./lexybooster-release-key.jks
```

---

## 🆕 Создание Нового Keystore

⚠️ **ВНИМАНИЕ:** Если вы создадите новый keystore, вам придется:

1. Обновить SHA256 fingerprint в `assetlinks.json`
2. Задеплоить новый `assetlinks.json` на production
3. **НЕ сможете обновлять существующее приложение в Play Store**
   - Придется опубликовать как новое приложение
   - Или использовать Google Play App Signing (если включено)

### Создать Новый Keystore (только если потерян старый)

```bash
keytool -genkey -v -keystore lexybooster-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias lexybooster
```

**Вопросы при создании:**

1. **Keystore password:** Придумайте надежный пароль (запишите!)
2. **Key password:** Можно использовать тот же пароль
3. **Name:** Ваше имя
4. **Organizational unit:** LexyBooster
5. **Organization:** LexyBooster
6. **City, State, Country:** Ваши данные

### Получить SHA256 Fingerprint Нового Keystore

```bash
keytool -list -v -keystore lexybooster-release-key.jks -alias lexybooster | grep SHA256
```

Скопируйте SHA256 fingerprint (без пробелов и двоеточий).

### Обновить assetlinks.json

Отредактируйте [public/.well-known/assetlinks.json](public/.well-known/assetlinks.json):

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.lexybooster.app",
      "sha256_cert_fingerprints": [
        "YOUR_NEW_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**Важно:** Удалите двоеточия из fingerprint!

Например:
- Из: `1A:66:E0:A7:E4:B1:92:0A:DA:5C:B6:E2:CC:9F:CF:A6:D0:EB:05:E5:42:E3:C4:3B:98:C4:47:B2:2D:54:9A:48`
- В: `1A66E0A7E4B1920ADA5CB6E2CC9FCFA6D0EB05E542E3C43B98C447B22D549A48`

### Задеплоить Обновленный assetlinks.json

```bash
git add public/.well-known/assetlinks.json
git commit -m "Update assetlinks.json with new keystore fingerprint"
git push origin develop
```

После деплоя, проверьте доступность:
```bash
curl https://words-learning-server-production.up.railway.app/.well-known/assetlinks.json
```

---

## 🔍 Проверка Keystore Alias

Если вы не уверены в alias вашего keystore:

```bash
keytool -list -keystore lexybooster-release-key.jks
```

Вывод покажет:
```
Keystore type: PKCS12
Keystore provider: SUN

Your keystore contains 1 entry

lexybooster, Nov 4, 2025, PrivateKeyEntry,
Certificate fingerprint (SHA-256): 1A:66:E0:...
```

Первое слово (`lexybooster`) - это alias.

---

## 📋 Быстрая Справка

### Команды для Keystore

```bash
# Показать информацию о keystore
keytool -list -v -keystore lexybooster-release-key.jks

# Показать SHA256 fingerprint
keytool -list -v -keystore lexybooster-release-key.jks -alias lexybooster | grep SHA256

# Показать все aliases
keytool -list -keystore lexybooster-release-key.jks

# Создать новый keystore
keytool -genkey -v -keystore lexybooster-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lexybooster

# Экспортировать сертификат
keytool -export -alias lexybooster -keystore lexybooster-release-key.jks -file lexybooster.cert

# Изменить пароль keystore
keytool -storepasswd -keystore lexybooster-release-key.jks

# Изменить пароль ключа
keytool -keypasswd -alias lexybooster -keystore lexybooster-release-key.jks
```

### Команды для Сборки AAB

```bash
# С существующим keystore
node scripts/build-aab.js ./lexybooster-release-key.jks YOUR_PASSWORD

# Bubblewrap напрямую (если настроен twa-manifest.json)
bubblewrap build

# Только APK
bubblewrap build --skipPwaValidation

# С кастомным keystore
bubblewrap build --signingKeyPath=./path/to/keystore.jks --signingKeyAlias=lexybooster
```

---

## ⚠️ Важные Замечания

1. **НИКОГДА не коммитьте keystore в Git!**
   ```bash
   # Убедитесь что в .gitignore есть:
   *.jks
   *.keystore
   android/keystore.jks
   lexybooster-release-key.jks
   ```

2. **Backup keystore в 3+ места:**
   - Локальный копия
   - Cloud storage (Google Drive, Dropbox)
   - External HDD
   - Password manager (as secure note/attachment)

3. **Запишите пароль:**
   - Используйте password manager (1Password, LastPass, Bitwarden)
   - Не храните в plaintext
   - Не отправляйте по email/messengers

4. **SHA256 fingerprint в assetlinks.json:**
   - Должен совпадать с keystore
   - Без двоеточий и пробелов
   - UPPERCASE буквы

5. **Package name:**
   - `com.lexybooster.app` - не менять!
   - Уже используется в Play Store
   - Изменение = новое приложение

---

## 🔄 Workflow для Обновления Приложения

### Каждое обновление (например, v5.1.0 → v5.2.0):

1. **Обновить версию в package.json:**
   ```json
   {
     "version": "5.2.0"
   }
   ```

2. **Обновить версию в twa-manifest.json:**
   ```json
   {
     "appVersionName": "5.2.0",
     "appVersionCode": 520
   }
   ```

3. **Собрать AAB с ТЕМ ЖЕ keystore:**
   ```bash
   node scripts/build-aab.js ./lexybooster-release-key.jks YOUR_PASSWORD
   ```

4. **Загрузить AAB в Play Console:**
   - Production → Create new release
   - Upload `app-release.aab`

5. **Version Code должен расти:**
   - v5.1.0 = code 510
   - v5.2.0 = code 520
   - v5.3.0 = code 530

---

## 🆘 Troubleshooting

### "jarsigner: unable to sign jar: java.util.zip.ZipException: invalid entry compressed size"

**Причина:** Поврежденный AAB/APK или неправильный пароль

**Решение:**
1. Пересоберите: `bubblewrap build`
2. Проверьте пароль keystore
3. Убедитесь что keystore не поврежден

### "keytool error: java.lang.Exception: Keystore file does not exist"

**Причина:** Неверный путь к keystore

**Решение:**
```bash
# Проверьте путь
ls -la lexybooster-release-key.jks

# Используйте абсолютный путь
node scripts/build-aab.js /full/path/to/lexybooster-release-key.jks
```

### "keytool error: java.security.UnrecoverableKeyException: Cannot recover key"

**Причина:** Неверный пароль

**Решение:**
1. Проверьте пароль в password manager
2. Попробуйте разные пароли
3. Если потерян - создавайте новый keystore (см. выше)

### "App not installed as package appears to be invalid"

**Причина:** Подпись не совпадает с установленным приложением

**Решение:**
```bash
# Удалите старое приложение
adb uninstall com.lexybooster.app

# Установите заново
adb install app-release.aab
```

---

## 📚 Дополнительные Ресурсы

- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)

---

**Готово к сборке! 🚀**

Если у вас есть keystore - скопируйте его в проект и запустите:
```bash
node scripts/build-aab.js ./lexybooster-release-key.jks YOUR_PASSWORD
```
