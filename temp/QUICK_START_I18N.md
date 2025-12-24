# Quick Start: Adding New Languages

## Пример: Добавление японского языка

Вот как вы можете добавить японский язык за 2 минуты:

### Шаг 1: Запустите скрипт

```bash
# Установите ваш API ключ Anthropic (если есть)
export ANTHROPIC_API_KEY=your_api_key_here

# Запустите команду для добавления японского
node add-language.js ja Japanese
```

### Что произойдет:

```
🌍 Adding new language: Japanese (ja)

📖 Step 1: Loading existing translations...
   ✅ Loaded 75 translation keys

🤖 Step 2: Translating all strings using AI...
   This may take a minute...
   ✅ All strings translated

💾 Step 3: Saving translations...
   ✅ Translations saved

🔧 Step 4: Updating i18n.js...
   ✅ i18n.js updated

✨ Language addition complete!

Next steps:
1. Restart your application
2. The new language will be available in the language selector
3. Test the translations and make manual adjustments if needed
```

### Шаг 2: Добавьте опцию в UI

Отредактируйте `public/index.html`, найдите `uiLanguageSelect` и добавьте:

```html
<select id="uiLanguageSelect" class="language-select">
    <option value="ru">Русский (Russian)</option>
    <option value="en">English</option>
    <option value="de">Deutsch (German)</option>
    <option value="ja">日本語 (Japanese)</option>  <!-- Новая строка -->
</select>
```

### Шаг 3: Перезапустите приложение

```bash
# Остановите текущий процесс (Ctrl+C)
# Запустите заново
npm start
```

### Шаг 4: Проверьте результат

1. Откройте приложение в браузере
2. Перейдите в Settings (Настройки)
3. Выберите "UI Language" → "日本語 (Japanese)"
4. Интерфейс переключится на японский!

## Другие примеры

### Испанский (Spanish)
```bash
node add-language.js es Spanish
```

### Французский (French)
```bash
node add-language.js fr French
```

### Корейский (Korean)
```bash
node add-language.js ko Korean
```

### Китайский (Chinese)
```bash
node add-language.js zh Chinese
```

### Португальский (Portuguese)
```bash
node add-language.js pt Portuguese
```

### Польский (Polish)
```bash
node add-language.js pl Polish
```

### Турецкий (Turkish)
```bash
node add-language.js tr Turkish
```

### Арабский (Arabic)
```bash
node add-language.js ar Arabic
```

### Хинди (Hindi)
```bash
node add-language.js hi Hindi
```

## Без API ключа

Если у вас нет API ключа Anthropic:

```bash
# Просто запустите без установки переменной окружения
node add-language.js ja Japanese
```

Скрипт создаст заглушки вида:
```json
{
  "login": {
    "en": "Log In",
    "ru": "Войти",
    "de": "Anmelden",
    "ja": "[JA] Log In"
  }
}
```

Затем вы можете вручную отредактировать `public/translations/source-texts.json` и заменить `[JA]` префиксы на реальные переводы.

## Проверка результата

После добавления языка, откройте консоль браузера и запустите:

```javascript
// Посмотреть доступные языки
console.log(i18n.getAvailableLanguages());
// Output: ['en', 'ru', 'de', 'ja']

// Проверить покрытие переводов
console.log('Japanese coverage:', i18n.getCoverage('ja') + '%');
// Output: Japanese coverage: 100%

// Попробовать перевод
await i18n.setLanguage('ja');
console.log(i18n.t('login'));
// Output: "ログイン"
```

## Редактирование переводов

Если AI перевел что-то неправильно, просто отредактируйте `public/translations/source-texts.json`:

```json
{
  "login": {
    "en": "Log In",
    "ru": "Войти",
    "de": "Anmelden",
    "ja": "ログイン"  // ← Отредактируйте здесь
  }
}
```

Сохраните файл и перезагрузите страницу (Ctrl+R).

## Поддержка правописания справа налево (RTL)

Для языков, которые пишутся справа налево (арабский, иврит и т.д.), вам нужно будет добавить CSS:

```css
[lang="ar"], [lang="he"] {
    direction: rtl;
    text-align: right;
}
```

Эта функциональность будет добавлена в будущих версиях автоматически.

## Полная документация

Для подробной информации см. [I18N_SYSTEM.md](I18N_SYSTEM.md)
