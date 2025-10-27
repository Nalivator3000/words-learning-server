# Screenshot Generator Guide

Автоматизированный генератор скриншотов для Google Play Store с использованием Puppeteer.

## Зачем это нужно?

- ✅ **Быстрое создание скриншотов** - автоматически делает 8 скриншотов за ~30 секунд
- ✅ **Консистентность** - все скриншоты одинакового качества и размера (1080x2400px)
- ✅ **Удобство для тестирования** - можно использовать для регрессионного тестирования UI
- ✅ **Легко обновлять** - при изменении дизайна просто запускаем скрипт заново

## Требования

```bash
npm install puppeteer
```

## Использование

### 1. Запустить генератор

```bash
node scripts/generate-screenshots.js
```

### 2. Скриншоты будут сохранены в

```
screenshots/
├── 01-home-dashboard.png        # Главная с статистикой
├── 02-study-mode-light.png      # Режим изучения (светлая тема)
├── 03-study-mode-dark.png       # Режим изучения (темная тема)
├── 04-word-building.png         # Упражнение "Собери слово"
├── 05-srs-review.png            # SRS повторение
├── 06-statistics.png            # Статистика и графики
├── 07-import.png                # Импорт слов
└── 08-settings.png              # Настройки
```

## Что делает скрипт?

1. **Запускает headless браузер** с мобильным viewport (1080x2400)
2. **Логинится** с тестовым аккаунтом (`test_user` / `test123`)
3. **Навигирует** по всем основным экранам приложения
4. **Делает скриншоты** с ожиданием анимаций
5. **Переключает темы** для демонстрации dark mode
6. **Сохраняет** в папку `screenshots/`

## Конфигурация

В начале файла `generate-screenshots.js` можно изменить:

```javascript
const APP_URL = 'https://words-learning-server-copy-production.up.railway.app';
const MOBILE_VIEWPORT = {
  width: 1080,
  height: 2400,
  deviceScaleFactor: 2
};
const TEST_USER = {
  username: 'test_user',
  password: 'test123'
};
```

## Использование для тестирования

### Visual Regression Testing

Можно сравнивать скриншоты после изменений в коде:

```bash
# Создать baseline скриншоты
node scripts/generate-screenshots.js

# После изменений в коде
node scripts/generate-screenshots.js

# Сравнить визуально или с помощью pixelmatch/resemble.js
```

### CI/CD Integration

Добавить в `package.json`:

```json
{
  "scripts": {
    "screenshots": "node scripts/generate-screenshots.js",
    "test:visual": "node scripts/generate-screenshots.js && node scripts/compare-screenshots.js"
  }
}
```

## Ручная настройка скриншотов

Если нужно сделать скриншоты вручную:

### Chrome DevTools (для идеального качества)

1. Открыть приложение в Chrome
2. `F12` → Toggle Device Toolbar (`Ctrl+Shift+M`)
3. Выбрать **Edit** → **Add custom device**:
   - Device name: `Google Play Screenshot`
   - Width: `1080`
   - Height: `2400`
   - Device pixel ratio: `2`
4. Нажать `Ctrl+Shift+P` → "Capture screenshot"

### Требования Google Play к скриншотам

- **Размер**: 1080x2400px (соотношение 9:16)
- **Формат**: PNG или JPEG
- **Минимум**: 2 скриншота
- **Максимум**: 8 скриншотов
- **Размер файла**: до 8 МБ
- **Цветовое пространство**: RGB (не CMYK)

## Следующие шаги

После генерации скриншотов:

1. ✅ Проверить все скриншоты визуально
2. ✅ При необходимости - добавить текстовые аннотации в Figma/Canva
3. ✅ Загрузить в Google Play Console
4. ✅ Указать описание для каждого скриншота (для accessibility)

## Troubleshooting

### "Login failed"

- Проверить, что тестовый аккаунт `test_user` существует в БД
- Проверить, что пароль правильный
- Проверить селекторы форм логина

### "Timeout waiting for selector"

- Увеличить `waitForTimeout` значения
- Проверить, что приложение доступно по URL
- Проверить селекторы элементов

### Скриншоты пустые/белые

- Увеличить задержки перед screenshot
- Проверить `waitUntil: 'networkidle2'`
- Отключить headless режим для отладки: `headless: false`

## Advanced: Добавление новых скриншотов

Чтобы добавить новый скриншот:

```javascript
// Example: Survival Mode screenshot
console.log('\n📱 Screenshot 9: Survival Mode');
await page.click('#studyBtn');
await page.waitForTimeout(500);
const survivalBtn = await page.$('.survival-mode-btn');
if (survivalBtn) {
  await survivalBtn.click();
  await page.waitForTimeout(1000);
  await takeScreenshot(page, '09-survival-mode', 'Survival mode gameplay');
}
```

## Автоматизация обновления скриншотов

Создать npm script для быстрого обновления:

```json
{
  "scripts": {
    "screenshots:update": "npm run screenshots && echo 'Screenshots updated! Check screenshots/ folder'"
  }
}
```

---

**Полезно для:**
- 📸 Google Play Store листинга
- 🧪 Visual regression тестирования
- 📱 App Store Connect (iOS) - с другим viewport
- 🎨 Демонстрации дизайна
- 📊 Презентаций и документации
