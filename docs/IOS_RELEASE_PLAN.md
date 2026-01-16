# iOS Release Plan: LexyBooster
## От нуля до App Store

**Дата создания:** 2026-01-16
**Текущая версия приложения:** 5.4.43
**Статус Android:** Опубликован в Google Play (TWA)
**Статус iOS:** Не начато

---

## Обзор текущего состояния

### Что уже есть:
- PWA с полной функциональностью (PWA manifest, Service Worker, offline support)
- Android приложение через TWA (Bubblewrap) в Google Play
- Все иконки готовы (72x72 до 512x512 + maskable)
- Apple meta-теги уже добавлены в index.html
- Responsive дизайн, оптимизированный для мобильных

### Проблема с iOS:
В отличие от Android, Apple **НЕ поддерживает TWA**. Для iOS есть три пути:

---

## Варианты реализации iOS приложения

### Вариант A: PWA (Add to Home Screen) - БЕЗ App Store
**Сложность:** Минимальная
**Время:** Уже готово
**Стоимость:** $0

**Плюсы:**
- Уже работает
- Пользователи могут установить через Safari → Share → Add to Home Screen
- Автоматические обновления (веб)

**Минусы:**
- Нет присутствия в App Store (нет органического трафика)
- Ограничения iOS PWA (уведомления только с iOS 16.4+, нет фонового обновления)
- Пользователи должны знать, как установить PWA

**Вывод:** Подходит как временное решение, но не заменяет полноценное приложение в App Store.

---

### Вариант B: Capacitor (Ionic) - РЕКОМЕНДУЕТСЯ
**Сложность:** Средняя
**Время:** 2-4 недели
**Стоимость:** $99/год (Apple Developer Program)

**Что это:** Обёртка для веб-приложения с доступом к нативным API iOS.

**Плюсы:**
- Минимальные изменения в коде (переиспользуем существующий frontend)
- Один codebase для iOS и Android
- Доступ к нативным функциям (Push Notifications, Face ID, Haptic Feedback)
- Присутствие в App Store

**Минусы:**
- Нужен Mac для сборки
- Нужен Apple Developer Account ($99/год)
- Время на настройку и тестирование

---

### Вариант C: React Native / Flutter - Полный переход
**Сложность:** Высокая
**Время:** 2-4 месяца
**Стоимость:** $99/год + значительные затраты времени

**Плюсы:**
- Нативный опыт пользователя
- Лучшая производительность
- Полный доступ ко всем iOS API

**Минусы:**
- Полная переработка frontend
- Поддержка двух кодовых баз
- Длительная разработка

**Вывод:** Не рекомендуется для текущего этапа. Рассмотреть в будущем при значительном росте.

---

## РЕКОМЕНДУЕМЫЙ ПЛАН: Capacitor для iOS

### Почему Capacitor:
1. Существующий Vanilla JS код работает "как есть"
2. Минимальные изменения в архитектуре
3. Аналогично TWA подходу для Android
4. Активная поддержка Ionic/Capacitor
5. Возможность добавить нативные функции позже

---

## ЭТАП 0: Подготовка (Prerequisities)

### 0.1 Hardware & Software Requirements

| Требование | Описание | Статус |
|------------|----------|--------|
| Mac компьютер | MacBook, iMac, Mac Mini (для Xcode) | Нужен |
| macOS 13+ | Ventura или новее | Нужен |
| Xcode 15+ | iOS SDK, Simulator | Установить |
| Node.js 18+ | Уже есть | ✅ |
| CocoaPods | Dependency manager для iOS | Установить |
| Apple ID | Для Apple Developer Program | Нужен |

### 0.2 Apple Developer Program

**Стоимость:** $99/год
**Регистрация:** https://developer.apple.com/programs/

**Что нужно:**
1. Apple ID (создать если нет)
2. Двухфакторная аутентификация
3. Паспорт/документ для верификации
4. Кредитная карта для оплаты $99

**Время обработки:** 24-48 часов после оплаты

### 0.3 App Store Connect Setup

После одобрения Apple Developer Program:
1. Войти в https://appstoreconnect.apple.com
2. Создать новое приложение
3. Зарезервировать Bundle ID: `com.lexybooster.app`

---

## ЭТАП 1: Настройка Capacitor (1-2 дня)

### 1.1 Установка Capacitor

```bash
# В корне проекта
npm install @capacitor/core @capacitor/cli
npx cap init LexyBooster com.lexybooster.app

# Добавить iOS платформу
npm install @capacitor/ios
npx cap add ios
```

### 1.2 Конфигурация capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lexybooster.app',
  appName: 'LexyBooster',
  webDir: 'public',
  server: {
    // Для разработки - загружаем с Railway
    url: 'https://lexybooster.com',
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#1a1a2e',
    preferredContentMode: 'mobile'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e'
    }
  }
};

export default config;
```

### 1.3 Синхронизация с iOS

```bash
# Копировать веб-файлы и синхронизировать iOS проект
npx cap sync ios

# Открыть в Xcode
npx cap open ios
```

---

## ЭТАП 2: Настройка Xcode проекта (1-2 дня)

### 2.1 App Icons

iOS требует специфические размеры иконок. Нужно создать:

| Размер | Назначение |
|--------|------------|
| 20x20 @2x, @3x | Notification |
| 29x29 @2x, @3x | Settings |
| 40x40 @2x, @3x | Spotlight |
| 60x60 @2x, @3x | App Icon (iPhone) |
| 76x76 @1x, @2x | App Icon (iPad) |
| 83.5x83.5 @2x | App Icon (iPad Pro) |
| 1024x1024 | App Store |

**Инструмент:** Использовать существующий icon-512x512.png и сгенерировать через:
- https://appicon.co
- или Xcode Asset Catalog

### 2.2 Launch Screen (Splash Screen)

Создать Launch Screen в Xcode:
1. Открыть ios/App/App/Base.lproj/LaunchScreen.storyboard
2. Добавить логотип LexyBooster
3. Установить background color: #1a1a2e

### 2.3 Info.plist Configuration

```xml
<!-- Privacy descriptions (required) -->
<key>NSCameraUsageDescription</key>
<string>LexyBooster needs camera access to scan vocabulary cards</string>

<key>NSMicrophoneUsageDescription</key>
<string>LexyBooster needs microphone for pronunciation practice</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>LexyBooster needs photo library to import vocabulary images</string>

<!-- App Transport Security -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>lexybooster.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 2.4 Signing & Capabilities

1. В Xcode выбрать Team (из Apple Developer Account)
2. Включить Automatic Signing
3. Добавить Capabilities:
   - Push Notifications (если нужно)
   - Sign in with Apple (опционально)
   - Associated Domains (для Universal Links)

---

## ЭТАП 3: Нативные функции iOS (2-3 дня)

### 3.1 Push Notifications (Опционально)

```bash
npm install @capacitor/push-notifications
npx cap sync
```

```javascript
// В app.js или отдельном модуле
import { PushNotifications } from '@capacitor/push-notifications';

// Запросить разрешение
const requestPermission = async () => {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }
};
```

### 3.2 Haptic Feedback

```bash
npm install @capacitor/haptics
```

```javascript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// При правильном ответе
Haptics.impact({ style: ImpactStyle.Medium });

// При неправильном
Haptics.notification({ type: 'error' });
```

### 3.3 Status Bar

```bash
npm install @capacitor/status-bar
```

```javascript
import { StatusBar, Style } from '@capacitor/status-bar';

// Установить темную тему
StatusBar.setStyle({ style: Style.Dark });
StatusBar.setBackgroundColor({ color: '#1a1a2e' });
```

### 3.4 Splash Screen

```bash
npm install @capacitor/splash-screen
```

```javascript
import { SplashScreen } from '@capacitor/splash-screen';

// Скрыть splash после загрузки
SplashScreen.hide();
```

---

## ЭТАП 4: Тестирование (3-5 дней)

### 4.1 iOS Simulator

```bash
# Запустить на симуляторе
npx cap run ios

# Или открыть в Xcode и выбрать симулятор
npx cap open ios
# Cmd + R для запуска
```

### 4.2 Тестирование на реальном устройстве

1. Подключить iPhone/iPad к Mac
2. В Xcode выбрать устройство
3. Build & Run (Cmd + R)
4. При первом запуске - Trust Developer на устройстве

### 4.3 Чек-лист тестирования

| Функция | iPhone | iPad | Статус |
|---------|--------|------|--------|
| Google OAuth Login | | | |
| Quiz Mode | | | |
| Word Building | | | |
| Statistics | | | |
| Leaderboard | | | |
| Dark Mode | | | |
| Offline Mode | | | |
| Audio/TTS | | | |
| Streak Tracking | | | |
| Achievements | | | |
| Settings | | | |
| Language Switching | | | |

### 4.4 TestFlight (Beta Testing)

1. В Xcode: Product → Archive
2. Distribute App → App Store Connect
3. В App Store Connect: TestFlight → Add Testers
4. Отправить приглашения beta-тестерам

---

## ЭТАП 5: Подготовка к публикации (2-3 дня)

### 5.1 Screenshots для App Store

**Обязательные размеры:**

| Устройство | Размер (pixels) | Кол-во |
|------------|-----------------|--------|
| iPhone 6.7" | 1290 x 2796 | 3-10 |
| iPhone 6.5" | 1284 x 2778 | 3-10 |
| iPhone 5.5" | 1242 x 2208 | 3-10 |
| iPad Pro 12.9" | 2048 x 2732 | 3-10 |
| iPad Pro 11" | 1668 x 2388 | 3-10 |

**Рекомендуемые скриншоты:**
1. Quiz Mode - главный экран обучения
2. Statistics Dashboard - прогресс пользователя
3. Word Building Mode - второй режим обучения
4. Leaderboard - социальный элемент
5. Achievements - геймификация
6. Language Selection - выбор языков
7. Streak Calendar - мотивация
8. Dark Mode - альтернативная тема

### 5.2 App Store Listing

**Название:** LexyBooster - Language Learning

**Подзаголовок (30 символов):**
```
Master 18+ Languages with SRS
```

**Описание:**
```
LexyBooster помогает эффективно учить новые слова с помощью интервального повторения (SRS) и геймификации.

ОСОБЕННОСТИ:
• 18+ языков для изучения
• Интервальное повторение (алгоритм SM-2)
• Система достижений и уровней
• Ежедневные серии (streaks)
• Глобальная таблица лидеров
• Офлайн-режим
• Темная и светлая темы

КАК ЭТО РАБОТАЕТ:
Изучайте слова в режиме Quiz или Word Building. Система отслеживает ваш прогресс и показывает слова именно тогда, когда вы начинаете их забывать.

ГЕЙМИФИКАЦИЯ:
Зарабатывайте XP, повышайте уровень, получайте достижения и соревнуйтесь с другими пользователями в таблице лидеров.

ПОДДЕРЖИВАЕМЫЕ ЯЗЫКИ:
Английский, Немецкий, Французский, Испанский, Итальянский, Португальский, Русский, Украинский, Польский, Чешский, Турецкий, Арабский, Хинди, Китайский, Японский, Корейский, Нидерландский, Шведский

Скачайте LexyBooster и начните учить языки уже сегодня!
```

**Ключевые слова (100 символов):**
```
language,learning,vocabulary,flashcards,srs,spaced,repetition,german,spanish,french,quiz,words
```

**Категории:**
- Primary: Education
- Secondary: Productivity

**Возрастной рейтинг:** 4+

### 5.3 Privacy Policy & Support URL

- Privacy Policy: https://lexybooster.com/privacy.html
- Terms of Service: https://lexybooster.com/terms.html
- Support URL: https://lexybooster.com/support.html (создать)
- Marketing URL: https://lexybooster.com

---

## ЭТАП 6: Публикация в App Store (1-2 недели)

### 6.1 Создание App в App Store Connect

1. Войти в https://appstoreconnect.apple.com
2. My Apps → "+" → New App
3. Заполнить:
   - Platform: iOS
   - Name: LexyBooster
   - Primary Language: English
   - Bundle ID: com.lexybooster.app
   - SKU: lexybooster-001

### 6.2 Загрузка билда

```bash
# В Xcode
Product → Archive
# После архивирования
Distribute App → App Store Connect → Upload
```

### 6.3 Заполнение метаданных

1. App Information (название, категории)
2. Pricing and Availability (Free)
3. App Privacy (Data collection disclosure)
4. Version Information (описание, скриншоты)

### 6.4 App Review

**Время ревью:** 24-48 часов (обычно)

**Частые причины отказа:**
- Crashes при запуске
- Неполная функциональность
- Отсутствие Privacy Policy
- Неправильные скриншоты
- Обманчивое описание
- Login через веб без Apple Sign In

**Как избежать:**
- Тщательно тестировать перед отправкой
- Убедиться, что все функции работают
- Предоставить тестовый аккаунт для ревью
- Добавить Apple Sign In (рекомендуется для apps с login)

### 6.5 После одобрения

1. Установить дату релиза
2. Или выпустить сразу (Release Immediately)
3. Мониторить отзывы и crashes

---

## ЭТАП 7: Post-Launch (Ongoing)

### 7.1 Analytics & Monitoring

- App Store Connect Analytics
- Crash reports в Xcode Organizer
- User reviews мониторинг

### 7.2 Updates

При обновлении веб-приложения:
- Если только веб-контент: автоматически (Capacitor загружает с сервера)
- Если native код: новый билд → App Store review

### 7.3 Version Updates

```bash
# Обновить версию в Xcode
# Increment Build Number
# Создать Archive
# Отправить в App Store Connect
```

---

## Сводная таблица этапов

| Этап | Описание | Время | Зависимости |
|------|----------|-------|-------------|
| 0 | Подготовка (Mac, Xcode, Apple Developer) | 1-3 дня | $99 |
| 1 | Настройка Capacitor | 1-2 дня | Этап 0 |
| 2 | Настройка Xcode проекта | 1-2 дня | Этап 1 |
| 3 | Нативные функции iOS | 2-3 дня | Этап 2 |
| 4 | Тестирование | 3-5 дней | Этап 3 |
| 5 | Подготовка к публикации | 2-3 дня | Этап 4 |
| 6 | Публикация в App Store | 1-2 недели | Этап 5 |
| 7 | Post-Launch | Ongoing | Этап 6 |

**ИТОГО: 2-4 недели** (при наличии Mac и Apple Developer Account)

---

## Checklist: Готовность к началу

- [ ] Есть Mac компьютер (MacBook/iMac/Mac Mini)
- [ ] macOS обновлен до последней версии
- [ ] Xcode установлен
- [ ] Apple ID создан
- [ ] Apple Developer Program оплачен ($99)
- [ ] Bundle ID зарезервирован в App Store Connect
- [ ] CocoaPods установлен
- [ ] Node.js 18+ установлен

---

## Альтернатива: Аренда Mac

Если нет Mac:

1. **MacStadium** - облачные Mac ($59-149/месяц)
   - https://www.macstadium.com

2. **MacinCloud** - облачный Mac ($25-49/месяц)
   - https://www.macincloud.com

3. **GitHub Actions с macOS** - для CI/CD билдов
   - Бесплатные минуты для публичных репо

---

## Контакты и ресурсы

**Apple Developer:**
- Documentation: https://developer.apple.com/documentation/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/

**Capacitor:**
- Documentation: https://capacitorjs.com/docs
- iOS Guide: https://capacitorjs.com/docs/ios
- Plugins: https://capacitorjs.com/docs/plugins

---

## Следующий шаг

**Начать с Этапа 0:**
1. Убедиться, что есть доступ к Mac
2. Зарегистрироваться в Apple Developer Program
3. Установить Xcode

После этого можно перейти к Этапу 1 (Настройка Capacitor).
