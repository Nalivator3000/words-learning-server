# iOS Setup Guide for Mac

**Quick Start: From Git Clone to App Store**

Этот документ содержит пошаговые инструкции для настройки iOS приложения на Mac.

---

## Prerequisites Checklist

- [ ] MacBook/iMac/Mac Mini с macOS 13+ (Ventura или новее)
- [ ] Xcode 15+ установлен (App Store)
- [ ] Apple Developer Account ($99/год)
- [ ] Node.js 18+ установлен

---

## Шаг 1: Установка зависимостей (5 минут)

### 1.1 Открыть Terminal и перейти в проект

```bash
cd ~/path/to/words-learning-server
```

### 1.2 Установить Node.js зависимости

```bash
npm install
```

### 1.3 Установить Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

### 1.4 Установить CocoaPods (если не установлен)

```bash
sudo gem install cocoapods
```

---

## Шаг 2: Инициализация iOS проекта (5 минут)

### 2.1 Добавить iOS платформу

```bash
npm run cap:add:ios
# или напрямую: npx cap add ios
```

Это создаст папку `ios/` с Xcode проектом.

### 2.2 Сгенерировать iOS иконки

```bash
npm run generate:ios-icons
```

Иконки будут в папке `ios-icons/`.

### 2.3 Синхронизировать проект

```bash
npm run cap:sync:ios
# или: npx cap sync ios
```

---

## Шаг 3: Настройка Xcode (15-20 минут)

### 3.1 Открыть проект в Xcode

```bash
npm run cap:open:ios
# или: npx cap open ios
```

### 3.2 Настроить Signing & Capabilities

1. В Xcode выбрать **App** в левой панели (Project Navigator)
2. Выбрать **Signing & Capabilities** вкладку
3. Установить:
   - **Team**: Выбрать свой Apple Developer Team
   - **Bundle Identifier**: `com.lexybooster.app`
   - Включить **Automatically manage signing**

### 3.3 Добавить App Icons

1. Скопировать содержимое `ios-icons/` в:
   ```
   ios/App/App/Assets.xcassets/AppIcon.appiconset/
   ```
2. Или перетащить иконки вручную в Xcode Asset Catalog

### 3.4 Настроить Launch Screen (Splash)

1. Открыть `ios/App/App/Base.lproj/LaunchScreen.storyboard`
2. Выбрать View Controller
3. Установить background color: `#1a1a2e` (наш темный фон)
4. (Опционально) Добавить логотип в центр

### 3.5 Проверить Info.plist

Файл: `ios/App/App/Info.plist`

Добавить/проверить следующие ключи:

```xml
<!-- Privacy descriptions -->
<key>NSCameraUsageDescription</key>
<string>LexyBooster needs camera access to scan vocabulary cards</string>

<key>NSMicrophoneUsageDescription</key>
<string>LexyBooster needs microphone for pronunciation practice</string>

<!-- Allow loading from our domain -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

---

## Шаг 4: Тестирование на Simulator (5 минут)

### 4.1 Запустить на симуляторе

В Xcode:
1. Выбрать целевое устройство (iPhone 15, iPhone 15 Pro, и т.д.)
2. Нажать **Run** (Cmd + R)

Или через terminal:
```bash
npm run cap:run:ios
```

### 4.2 Проверить функциональность

- [ ] Приложение запускается без ошибок
- [ ] Google OAuth работает (редирект в Safari и обратно)
- [ ] Quiz Mode функционирует
- [ ] Word Building работает
- [ ] Статистика отображается
- [ ] Темная тема работает
- [ ] Звуки/TTS воспроизводятся

---

## Шаг 5: Тестирование на реальном устройстве

### 5.1 Подключить iPhone/iPad

1. Подключить устройство к Mac через USB/Lightning
2. На устройстве: **Trust This Computer**
3. В Xcode выбрать устройство в списке

### 5.2 Установить приложение

1. Нажать **Run** (Cmd + R) в Xcode
2. При первом запуске: на устройстве пойти в Settings → General → Device Management → Trust Developer

### 5.3 Тестирование

Провести полное тестирование на реальном устройстве:
- [ ] Производительность (нет лагов)
- [ ] Touch/Gesture работают корректно
- [ ] Keyboard не перекрывает контент
- [ ] Safe Area Insets корректны (notch на iPhone X+)
- [ ] Offline mode работает

---

## Шаг 6: TestFlight Beta Testing (30 минут)

### 6.1 Создать Archive

В Xcode:
1. Выбрать **Any iOS Device** как target
2. **Product** → **Archive**
3. Дождаться завершения (~2-5 минут)

### 6.2 Загрузить в App Store Connect

1. После Archive откроется **Organizer**
2. Выбрать архив → **Distribute App**
3. Выбрать **App Store Connect** → **Upload**
4. Следовать инструкциям

### 6.3 Настроить TestFlight

1. Войти в https://appstoreconnect.apple.com
2. Перейти в **My Apps** → **LexyBooster** → **TestFlight**
3. Дождаться processing (~15-30 минут)
4. Добавить Internal Testers (до 100 человек)
5. Добавить External Testers (до 10,000 человек) - требует App Review

### 6.4 Установить через TestFlight

1. Тестеры получат email-приглашение
2. Установить TestFlight app из App Store
3. Открыть ссылку из email → Install

---

## Шаг 7: Подготовка к App Store Release

### 7.1 Screenshots

Создать скриншоты для каждого размера:

| Устройство | Размер |
|------------|--------|
| iPhone 6.7" (14 Pro Max) | 1290 x 2796 |
| iPhone 6.5" (11 Pro Max) | 1284 x 2778 |
| iPhone 5.5" (8 Plus) | 1242 x 2208 |
| iPad Pro 12.9" | 2048 x 2732 |
| iPad Pro 11" | 1668 x 2388 |

**Как сделать:**
1. Запустить на Simulator нужного размера
2. Cmd + S для screenshot
3. Или использовать Xcode: **Debug** → **Capture Screenshot**

### 7.2 App Store Listing

В App Store Connect заполнить:

- **Name**: LexyBooster - Language Learning
- **Subtitle**: Master 18+ Languages with SRS
- **Description**: (см. [IOS_RELEASE_PLAN.md](IOS_RELEASE_PLAN.md))
- **Keywords**: language,learning,vocabulary,flashcards,srs,spaced,repetition
- **Support URL**: https://lexybooster.com/support.html
- **Privacy Policy URL**: https://lexybooster.com/privacy.html
- **Category**: Education
- **Age Rating**: 4+

### 7.3 App Privacy

Заполнить App Privacy секцию:
- **Data Linked to You**: Email, Name (Google Sign-In)
- **Data Used to Track You**: None
- **Data Not Collected**: (остальное)

---

## Шаг 8: Submit for Review

### 8.1 Проверить все поля

В App Store Connect:
1. Все screenshots загружены
2. Description и keywords заполнены
3. Privacy Policy URL работает
4. Support URL работает
5. App Privacy заполнен

### 8.2 Добавить Review Notes

```
Test Account for Review:
Email: [создать тестовый аккаунт]
Password: [если нужен]

Or use Google Sign-In with any Gmail account.

The app requires internet connection for initial login.
```

### 8.3 Submit

1. **Add for Review**
2. Выбрать версию
3. **Submit to App Review**

### 8.4 Ожидание

- **Время ревью**: 24-48 часов (обычно)
- **Возможные статусы**: Waiting for Review → In Review → Ready for Sale / Rejected

---

## Troubleshooting

### Ошибка: "No signing certificate"

```bash
# В Xcode: Preferences → Accounts → Download Manual Profiles
```

### Ошибка: "Pod install failed"

```bash
cd ios/App
pod install --repo-update
```

### Ошибка: "WKWebView crash"

Проверить `capacitor.config.ts` - server URL должен быть HTTPS.

### Ошибка: "Google Sign-In не работает"

1. Проверить URL Scheme в Info.plist
2. Добавить redirect URL в Google Cloud Console для iOS

### Ошибка при Archive: "No accounts with signing certificates"

1. Xcode → Preferences → Accounts
2. Убедиться, что Team выбран
3. Download Manual Profiles

---

## Useful Commands

```bash
# Синхронизировать после изменений в web
npm run cap:sync:ios

# Открыть Xcode
npm run cap:open:ios

# Запустить на подключенном устройстве
npm run cap:run:ios

# Сгенерировать иконки
npm run generate:ios-icons

# Полная пересборка
rm -rf ios/App/Pods ios/App/Podfile.lock
cd ios/App && pod install
npm run cap:sync:ios
```

---

## Checklist: Готовность к релизу

### Development
- [ ] Xcode 15+ установлен
- [ ] CocoaPods установлен
- [ ] Capacitor добавлен
- [ ] iOS platform добавлена
- [ ] App icons установлены
- [ ] Launch screen настроен

### Testing
- [ ] Работает на Simulator
- [ ] Работает на реальном устройстве
- [ ] Google OAuth работает
- [ ] Все основные функции работают
- [ ] TestFlight beta отправлен

### App Store
- [ ] Apple Developer Account активен
- [ ] App создан в App Store Connect
- [ ] Screenshots для всех размеров
- [ ] Description и keywords заполнены
- [ ] Privacy Policy URL работает
- [ ] Support URL работает
- [ ] App Privacy заполнен

### Submit
- [ ] Archive создан
- [ ] Build загружен в App Store Connect
- [ ] Review notes добавлены
- [ ] Submitted for review

---

## Contacts & Resources

- **Apple Developer Portal**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Capacitor iOS Docs**: https://capacitorjs.com/docs/ios
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/

---

**Last Updated**: 2026-01-16
**Version**: 1.0
