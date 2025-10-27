# 🌐 Translation System Guide

Централизованная система переводов для LexiBooster с поддержкой автоматического перевода.

## 📋 Текущее состояние

### Проблемы которые решает эта система:

1. ❌ **Захардкоженные тексты** - много текстов прямо в HTML/JS без data-translate
2. ❌ **Разрозненные переводы** - переводы в разных файлах (language-manager.js, hardcoded в JS)
3. ❌ **Сложно добавлять новые языки** - нужно вручную переводить сотни строк
4. ❌ **Нет автоматизации** - каждый новый текст нужно переводить вручную на 6 языков

### Решение:

✅ **Централизованный JSON** с всеми переводами
✅ **Автоматический сбор** всех текстов из приложения
✅ **Автоперевод** через Google Translate API
✅ **Единый интерфейс** для всех переводов

---

## 🚀 Использование

### Шаг 1: Извлечь все тексты из приложения

```bash
node scripts/extract-translations.js
```

**Что делает:**
- Сканирует все HTML и JS файлы в `public/`
- Находит захардкоженные тексты (русский и английский)
- Генерирует `translations/source-texts.json` с уникальными ключами
- Автоматически определяет язык текста (кириллица = русский)

**Результат:** `translations/source-texts.json`
```json
{
  "global_leaderboard": {
    "source": "Global Leaderboard",
    "en": "Global Leaderboard",
    "ru": null,
    "de": null,
    "es": null,
    "fr": null,
    "it": null
  },
  "total_xp": {
    "source": "Total XP:",
    "en": "Total XP:",
    "ru": null,
    "de": null,
    "es": null,
    "fr": null,
    "it": null
  }
}
```

### Шаг 2: Автоматически перевести на все языки

```bash
# С помощью Google Translate API (бесплатно до 500k символов/месяц)
node scripts/auto-translate.js

# Или с DeepL API (лучше качество, платно)
node scripts/auto-translate.js --provider=deepl --api-key=YOUR_KEY
```

**Что делает:**
- Читает `translations/source-texts.json`
- Для каждого текста где `lang === null`, делает автоперевод
- Сохраняет результат обратно в JSON
- Создаёт бэкап перед изменениями

**Результат:** Все `null` заменены на переводы:
```json
{
  "global_leaderboard": {
    "source": "Global Leaderboard",
    "en": "Global Leaderboard",
    "ru": "Глобальный Рейтинг",
    "de": "Globale Bestenliste",
    "es": "Tabla de Clasificación Global",
    "fr": "Classement Mondial",
    "it": "Classifica Globale"
  }
}
```

### Шаг 3: Использовать переводы в коде

#### В HTML:
```html
<!-- Старый способ (захардкожено) -->
<h2>🏆 Таблица лидеров</h2>

<!-- Новый способ (с переводом) -->
<h2 data-i18n="leaderboard_title">🏆 Leaderboard</h2>
```

#### В JavaScript:
```javascript
// Старый способ (захардкожено)
const title = '🌍 Глобальный рейтинг';

// Новый способ (с переводом)
const title = window.i18n.t('global_leaderboard');
```

---

## 📁 Структура файлов

```
translations/
├── source-texts.json       # Все тексты приложения (автогенерируется)
├── source-texts.backup.json  # Бэкап перед автопереводом
└── README.md              # Документация структуры

scripts/
├── extract-translations.js  # Сбор всех текстов из кода
├── auto-translate.js       # Автоперевод через API
└── validate-translations.js # Проверка на missing translations

public/
├── i18n.js                # Новая система переводов (замена language-manager.js)
└── ...
```

---

## 🔧 Миграция текущего кода

### 1. HTML файлы

**Было:**
```html
<button>Экспорт данных</button>
<h2>Статистика</h2>
<p>Всего опыта: <strong>1000 XP</strong></p>
```

**Стало:**
```html
<button data-i18n="export_data">Export Data</button>
<h2 data-i18n="statistics">Statistics</h2>
<p data-i18n="total_xp">Total XP: <strong>1000 XP</strong></p>
```

### 2. JavaScript файлы

**Было:**
```javascript
const title = type === 'global' ? '🌍 Глобальный рейтинг' : '📅 Рейтинг недели';
html += `<span class="you-badge">Вы</span>`;
```

**Стало:**
```javascript
const title = type === 'global'
    ? i18n.t('global_leaderboard')
    : i18n.t('weekly_leaderboard');
html += `<span class="you-badge">${i18n.t('you')}</span>`;
```

---

## 🤖 Автоматический перевод

### Поддерживаемые провайдеры:

1. **Google Translate API** (рекомендуется для начала)
   - Бесплатно: 500,000 символов/месяц
   - Быстро
   - 100+ языков
   - Setup: https://cloud.google.com/translate/docs/setup

2. **DeepL API** (лучше качество)
   - Бесплатно: 500,000 символов/месяц
   - Очень высокое качество
   - 26 языков
   - Setup: https://www.deepl.com/pro-api

3. **Libre Translate** (open source, бесплатно)
   - Полностью бесплатно
   - Можно развернуть локально
   - Хуже качество
   - Setup: https://github.com/LibreTranslate/LibreTranslate

### Пример использования:

```bash
# Google Translate (требует API key)
export GOOGLE_TRANSLATE_API_KEY=your_key_here
node scripts/auto-translate.js

# DeepL
export DEEPL_API_KEY=your_key_here
node scripts/auto-translate.js --provider=deepl

# Libre Translate (бесплатно, без ключа)
node scripts/auto-translate.js --provider=libre
```

---

## 📊 Статистика переводов

После запуска `extract-translations.js` или `auto-translate.js`:

```
📊 Translation Coverage:

English (en):  ████████████████████ 100% (245/245)
Russian (ru):  ████████████████████ 100% (245/245)
German (de):   ██████████░░░░░░░░░░  52% (127/245)
Spanish (es):  ████████░░░░░░░░░░░░  43% (105/245)
French (fr):   ████████░░░░░░░░░░░░  40% (98/245)
Italian (it):  ██████░░░░░░░░░░░░░░  35% (86/245)

Missing: 167 translations
Run: node scripts/auto-translate.js
```

---

## ✅ TODO: Полная миграция

- [x] Создать систему сбора текстов
- [x] Документировать новую структуру
- [ ] Создать auto-translate.js (Google Translate API)
- [ ] Создать i18n.js (новый translation manager)
- [ ] Мигрировать HTML (добавить data-i18n везде)
- [ ] Мигрировать JS (заменить hardcoded на i18n.t())
- [ ] Протестировать все языки
- [ ] Удалить старый language-manager.js

---

## 🎯 Преимущества новой системы

| До | После |
|---|---|
| 🔴 Тексты захардкожены в 10+ файлах | 🟢 Все тексты в одном JSON |
| 🔴 Нужно вручную переводить каждый текст на 6 языков | 🟢 Автоперевод одной командой |
| 🔴 Сложно найти непереведённые тексты | 🟢 Скрипт показывает coverage % |
| 🔴 Новый язык = несколько часов работы | 🟢 Новый язык = 2 минуты |
| 🔴 Переводы рассинхронизированы | 🟢 Единый источник правды |

---

## 📝 Примеры использования

### Добавить новый язык (например, Японский):

1. Добавить в `translations/source-texts.json`:
```json
{
  "hello": {
    "source": "Hello",
    "en": "Hello",
    "ru": "Привет",
    "ja": null   // <-- добавили японский
  }
}
```

2. Запустить автоперевод:
```bash
node scripts/auto-translate.js --languages=ja
```

3. Готово! Японский добавлен ко всем 245 текстам.

### Найти missing translations:

```bash
node scripts/validate-translations.js

# Output:
Missing translations for 'de':
  - hello_world
  - welcome_message
  - sign_up_button

Total missing: 3
```

---

## 🚀 Следующие шаги

1. **Создать auto-translate.js** - скрипт для автоматического перевода
2. **Создать i18n.js** - новый translation manager вместо language-manager.js
3. **Мигрировать код** - заменить все hardcoded тексты на i18n.t()
4. **Тестирование** - проверить все языки работают корректно

**Время на полную миграцию:** ~2-3 часа
**Выгода:** Легко добавлять новые языки за 2 минуты вместо 2 часов!
