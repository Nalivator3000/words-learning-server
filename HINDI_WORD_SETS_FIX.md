# Hindi Word Sets Fix - Target Language Filtering

**Дата:** 2026-01-07
**Версия:** v5.4.23
**Коммит:** e8d431d

---

## 🐛 Проблема

Пользователь 92 (Hindi + German) получал **неправильные наборы слов**:
- Ожидалось: Hindi → German наборы
- Получал: Hindi → English наборы

### Причина

API endpoint `/api/word-sets` фильтровал наборы только по `source_language`, но **не учитывал целевой язык**.

Для языковой пары `hi-de`:
- ✅ Правильно: `source_language = 'hindi'`
- ❌ Неправильно: возвращал **ВСЕ** наборы хинди (и → English, и → German)

---

## ✅ Решение

Добавлена фильтрация по **целевому языку** через паттерн в названии набора.

### Логика фильтрации

1. **Для английского (`hi-en`):**
   - Показывать наборы БЕЗ стрелки: `Hindi A1: General 1`
   - ИЛИ с явным указанием: `Hindi → English A1: General 1`
   - SQL: `title NOT LIKE '%→%' OR title LIKE '%→ English%'`

2. **Для других языков (`hi-de`, `hi-es`, и т.д.):**
   - Показывать ТОЛЬКО наборы с указанием языка: `Hindi → German A1: General 1`
   - SQL: `title LIKE '%→ German%'`

### Код изменений

**Файл:** [server-postgresql.js:2854-2913](server-postgresql.js#L2854-L2913)

```javascript
// Parse languagePair: "hi-de" → learning=hi, native=de
const learningLanguage = parts[0];
const nativeLanguage = parts[1];

// Map to full names: hi → hindi, de → german
const fullLanguageName = langMap[learningLanguage];
const fullNativeName = langMap[nativeLanguage];

// Filter by source language
query += ` AND source_language = $${paramIndex}`;
params.push(fullLanguageName);
paramIndex++;

// Filter by target language in title
const nativeNameCapitalized = fullNativeName.charAt(0).toUpperCase() + fullNativeName.slice(1);

if (nativeLanguage === 'en') {
    // English: default sets (no arrow) OR explicit "→ English"
    query += ` AND (title NOT LIKE '%→%' OR title LIKE $${paramIndex})`;
    params.push(`%→ ${nativeNameCapitalized}%`);
} else {
    // Other: ONLY sets with "→ TargetLanguage"
    query += ` AND title LIKE $${paramIndex}`;
    params.push(`%→ ${nativeNameCapitalized}%`);
}
paramIndex++;
```

---

## 🧪 Тестирование

### Тест 1: Hindi → English (`hi-en`)

**Запрос:**
```sql
SELECT * FROM word_sets
WHERE source_language = 'hindi'
AND (title NOT LIKE '%→%' OR title LIKE '%→ English%')
AND is_public = true
```

**Результат:** ✅ 162 набора
```
Hindi A1: General 1 (50 words)
Hindi A1: General 2 (50 words)
...
```

### Тест 2: Hindi → German (`hi-de`)

**Запрос:**
```sql
SELECT * FROM word_sets
WHERE source_language = 'hindi'
AND title LIKE '%→ German%'
AND is_public = true
```

**Результат:** ✅ 162 набора
```
Hindi → German A1: General 1 (50 words)
Hindi → German A1: General 2 (50 words)
...
```

---

## 📊 Наборы слов - Финальный статус

### Hindi → English
- **Наборов:** 162
- **Слов:** 7,959
- **Формат названия:** `Hindi {level}: General {number}`
- **Пример:** `Hindi A1: General 1`

### Hindi → German
- **Наборов:** 162
- **Слов:** 7,958
- **Формат названия:** `Hindi → German {level}: General {number}`
- **Пример:** `Hindi → German A1: General 1`

### Распределение по уровням (оба направления)

| Уровень | Наборов (×2) | Слов |
|---------|--------------|------|
| A1      | 18 × 2 = 36  | 1,704 |
| A2      | 17 × 2 = 34  | 1,634 |
| B1      | 24 × 2 = 48  | 2,390 |
| B2      | 33 × 2 = 66  | 3,216 |
| C1      | 39 × 2 = 78  | 3,879 |
| C2      | 31 × 2 = 62  | 3,094 |
| **Всего** | **324** | **15,917** |

---

## 🎯 Применимость

Это решение автоматически работает для **всех** языковых пар с множественными направлениями:

- **Текущие:** Hindi → English, Hindi → German
- **Будущие:** Любые пары с форматом `{Source} → {Target}` в названии

---

## 📝 Затронутые файлы

### Изменено
- [server-postgresql.js](server-postgresql.js) - API endpoint `/api/word-sets`

### Созданы для тестирования (можно удалить)
- [test-word-sets-filter.js](test-word-sets-filter.js)
- [debug-user-92-word-lists.js](debug-user-92-word-lists.js)
- [check-all-general-sets.js](check-all-general-sets.js)

---

## 🚀 Деплой

- **Коммит:** e8d431d
- **Ветка:** develop
- **Статус:** ✅ Запушен в GitHub
- **Railway:** Автодеплой (~2-3 минуты)
- **Ожидаемая версия на production:** v5.4.23

---

## ✅ Проверка после деплоя

1. Открыть https://lexibooster.com
2. Войти как пользователь 92 (test.hi.de@lexibooster.test)
3. Перейти в Word Lists
4. **Ожидаемый результат:**
   - Видны ТОЛЬКО наборы "Hindi → German A1: General X"
   - НЕ видны наборы "Hindi A1: General X" (без стрелки)

---

**Статус:** ✅ **ИСПРАВЛЕНО И ЗАДЕПЛОЕНО**
