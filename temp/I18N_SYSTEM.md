# Internationalization (i18n) System

## Overview

LexyBooster использует централизованную систему интернационализации, которая позволяет легко добавлять новые языки интерфейса и управлять переводами.

## Architecture

### Files Structure
```
public/
├── i18n.js                          # Core i18n engine
├── language-manager.js              # Legacy system (bridges to i18n)
└── translations/
    └── source-texts.json           # All translations in one file

add-language.js                      # CLI tool for adding new languages
```

### Key Components

1. **i18n.js** - Основной движок интернационализации
   - Загружает переводы из `source-texts.json`
   - Автоматически определяет язык браузера
   - Обновляет DOM при смене языка
   - Поддерживает интерполяцию параметров

2. **source-texts.json** - Централизованное хранилище переводов
   ```json
   {
     "key": {
       "en": "English text",
       "ru": "Русский текст",
       "de": "Deutscher Text"
     }
   }
   ```

3. **add-language.js** - Автоматический инструмент для добавления языков

## Currently Supported Languages

- 🇬🇧 English (en)
- 🇷🇺 Русский (ru)
- 🇩🇪 Deutsch (de)

## Adding a New Language

### Method 1: Using the Automated Tool (Recommended)

Это самый простой способ - скрипт автоматически переведет все строки с помощью AI:

```bash
# Set up your Anthropic API key (optional, but recommended)
export ANTHROPIC_API_KEY=your_api_key_here

# Add a new language
node add-language.js <language_code> <language_name>

# Examples:
node add-language.js ja Japanese
node add-language.js es Spanish
node add-language.js fr French
node add-language.js zh Chinese
node add-language.js ko Korean
```

**What the script does:**
1. ✅ Reads all existing translations from `source-texts.json`
2. 🤖 Uses Claude AI to translate all strings to the new language
3. 💾 Updates `source-texts.json` with new translations
4. 🔧 Updates `i18n.js` to recognize the new language
5. ✨ Ready to use!

**Note:** If `ANTHROPIC_API_KEY` is not set, the script will create placeholder translations that you'll need to manually translate.

### Method 2: Manual Addition

If you prefer to add translations manually:

1. **Add language code to i18n.js**

   Edit `public/i18n.js` and add your language code to two places:

   ```javascript
   // Line ~20: Initial language detection
   } else if (['ru', 'en', 'de', 'YOUR_LANG'].includes(langCode)) {

   // Line ~104: Supported languages check
   if (!['ru', 'en', 'de', 'YOUR_LANG'].includes(lang)) {
   ```

2. **Add translations to source-texts.json**

   Add your language code to every translation key:

   ```json
   {
     "login": {
       "en": "Log In",
       "ru": "Войти",
       "de": "Anmelden",
       "YOUR_LANG": "Your Translation"
     }
   }
   ```

3. **Add to UI language selector**

   Edit `public/index.html`:

   ```html
   <select id="uiLanguageSelect" class="language-select">
       <option value="en">English</option>
       <option value="ru">Русский</option>
       <option value="de">Deutsch</option>
       <option value="YOUR_LANG">Your Language Name</option>
   </select>
   ```

4. **Restart the application**

## Using Translations in HTML

### Method 1: data-i18n attribute (for text content)
```html
<button data-i18n="login">Login</button>
<h2 data-i18n="settings">Settings</h2>
```

### Method 2: data-i18n-placeholder (for input placeholders)
```html
<input type="text" data-i18n-placeholder="search">
```

### Method 3: data-i18n-title (for tooltips)
```html
<button data-i18n-title="save">💾</button>
```

### Method 4: data-i18n-html (for HTML content)
```html
<div data-i18n-html="welcomeMessage"></div>
```

## Using Translations in JavaScript

```javascript
// Simple translation
const text = i18n.t('login');

// With parameters (interpolation)
const greeting = i18n.t('welcome_message', { name: 'John' });
// If translation is: "Hello {name}!" → Output: "Hello John!"

// Check if translation exists
if (i18n.hasTranslation('myKey')) {
    // ...
}

// Get current language
const currentLang = i18n.getCurrentLanguage(); // 'en', 'ru', etc.

// Change language programmatically
await i18n.setLanguage('de');

// Get all available languages
const languages = i18n.getAvailableLanguages(); // ['en', 'ru', 'de']

// Check translation coverage
const coverage = i18n.getCoverage('ru'); // 100 (percentage)
```

## Translation Keys Best Practices

### Naming Convention
```javascript
// ✅ Good - descriptive, hierarchical
"user_settings_title"
"button_save"
"error_network_timeout"
"message_success_saved"

// ❌ Bad - vague, non-descriptive
"text1"
"btn"
"msg"
```

### Using Placeholders
```json
{
  "welcome_message": {
    "en": "Welcome, {name}! You have {count} new messages.",
    "ru": "Добро пожаловать, {name}! У вас {count} новых сообщений.",
    "de": "Willkommen, {name}! Sie haben {count} neue Nachrichten."
  }
}
```

```javascript
// Usage
const msg = i18n.t('welcome_message', { name: 'Alice', count: 5 });
```

## Language Switching Flow

1. User selects language from dropdown
2. `languageManager.setUILanguage()` is called
3. Language Manager delegates to `i18n.setLanguage()`
4. i18n updates all DOM elements with `data-i18n` attributes
5. `languageChanged` event is dispatched
6. Language preference is saved to localStorage

```javascript
// Listen for language changes
window.addEventListener('languageChanged', (e) => {
    console.log('Language changed to:', e.detail.language);
    // Update your component
});
```

## Testing New Languages

After adding a new language:

1. ✅ Restart your application
2. ✅ Open Settings → UI Language
3. ✅ Select your new language
4. ✅ Navigate through all pages
5. ✅ Check for:
   - Missing translations (shown as `[key_name]`)
   - Layout issues (text overflow, alignment)
   - Context accuracy (translations make sense)

## Troubleshooting

### Translation not appearing
```
Symptom: Text shows as [key_name]
Solution:
  1. Check if key exists in source-texts.json
  2. Check if your language code has translation for that key
  3. Check browser console for warnings
```

### Language not available in dropdown
```
Symptom: New language doesn't show in settings
Solution:
  1. Add <option> to uiLanguageSelect in index.html
  2. Add language code to i18n.js supported languages arrays
  3. Clear browser cache and reload
```

### Translations not updating after change
```
Symptom: Old translations still showing
Solution:
  1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
  2. Clear browser cache
  3. Check source-texts.json was saved correctly
```

## Translation Coverage Report

Run this in browser console to see translation coverage:

```javascript
['en', 'ru', 'de'].forEach(lang => {
    console.log(`${lang}: ${i18n.getCoverage(lang)}%`);
});
```

## Example: Adding Japanese (日本語)

Complete example of adding Japanese language:

```bash
# Step 1: Run the automated tool
export ANTHROPIC_API_KEY=your_api_key
node add-language.js ja Japanese

# Step 2: Add to HTML selector
# Edit public/index.html, add:
# <option value="ja">日本語 (Japanese)</option>

# Step 3: Restart and test
npm start

# Step 4: Select Japanese in Settings
# Navigate to Settings → UI Language → 日本語
```

## Contributing Translations

If you'd like to improve existing translations:

1. Edit `public/translations/source-texts.json`
2. Find the key you want to improve
3. Update the translation for your language
4. Test in the application
5. Submit a pull request (if applicable)

## Future Enhancements

Planned features:
- [ ] Automatic translation validation
- [ ] Missing translation reporter
- [ ] Context hints for translators
- [ ] RTL (Right-to-Left) language support
- [ ] Pluralization rules
- [ ] Date/time formatting per locale
- [ ] Number formatting per locale

## API Reference

### I18nManager Class

```typescript
class I18nManager {
    // Load translations from JSON
    async loadTranslations(): Promise<boolean>

    // Translate a key
    t(key: string, params?: object): string

    // Change language
    async setLanguage(lang: string): Promise<boolean>

    // Get current language
    getCurrentLanguage(): string

    // Get available languages
    getAvailableLanguages(): string[]

    // Check if translation exists
    hasTranslation(key: string): boolean

    // Get translation coverage percentage
    getCoverage(lang: string): number

    // Update all DOM elements
    updateDOM(): void

    // Get all translations for current language
    getAllTranslations(): object
}
```

## Support

For issues or questions about the i18n system:
1. Check this documentation
2. Look for warnings in browser console
3. Check `source-texts.json` format
4. Test with English (fallback language)

---

Last updated: 2025-01-14
Version: 1.0.0
