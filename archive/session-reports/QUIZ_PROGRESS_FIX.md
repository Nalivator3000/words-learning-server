# Исправление ошибки 404 в квизах

## Проблема

При прохождении квизов периодически возникала ошибка:

```
❌ API request failed: /api/words/1253/progress
Error: API Error: 404 - {"error":"Source word not found"}
```

## Причина

Приложение использует **две архитектуры** одновременно:

### Старая архитектура (таблица `words`)
- Содержит пользовательские слова с уникальными ID (например, ID: 1253)
- Каждое слово привязано к конкретному пользователю
- Используется в endpoint `/api/words/random-proportional/:count`

### Новая архитектура (таблицы `source_words_*` + `user_word_progress`)
- `source_words_german`, `source_words_spanish` и т.д. содержат словарь слов
- Слова имеют свои ID (например, ID: 8490 для "der Punkt")
- `user_word_progress` связывает пользователя со словами через `source_word_id`
- Используется в endpoint `/api/words/:id/progress`

## Конфликт

1. **Квиз получает слова** из старой таблицы `words` (ID: 1253)
2. **Прогресс обновляется** через endpoint, который ищет слово в `source_words_*` (ожидает ID: 8490)
3. **Ошибка**: слово с ID 1253 не существует в таблице `source_words_german`

### Пример

Слово **"der Punkt"**:
- В таблице `words`: ID = **1253**
- В таблице `source_words_german`: ID = **8490**

Когда квиз пытается обновить прогресс для ID 1253, endpoint не находит его в новой архитектуре.

## Решение

Обновлен endpoint `/api/words/random-proportional/:count` для использования новой архитектуры:

### До:
```javascript
SELECT * FROM words
WHERE status = $1 AND user_id = $2 AND language_pair_id = $3
```

### После:
```javascript
SELECT
    sw.id,                                    -- ID из source_words_*
    sw.word,
    sw.translation_ru as translation,
    sw.example_de as example,
    uwp.source_word_id,
    uwp.status,
    uwp.correct_count
FROM user_word_progress uwp
JOIN source_words_german sw ON sw.id = uwp.source_word_id
WHERE uwp.status = $1
    AND uwp.user_id = $2
    AND uwp.language_pair_id = $3
```

## Изменения

1. **Запрос слов** теперь идет из `user_word_progress` + JOIN с `source_words_*`
2. **ID возвращается** из таблицы `source_words_*`, а не из старой таблицы `words`
3. **Переводы** получаются динамически из колонок `translation_${targetLang}`
4. **Оптимизация**: избегаем N+1 запросов, получая все данные одним JOIN'ом

## Результат

- Квиз получает ID из новой архитектуры (8490)
- Endpoint `/api/words/:id/progress` успешно находит слово
- Ошибка 404 "Source word not found" больше не возникает

## Commit

Исправление: [d3e5910](https://github.com/Nalivator3000/words-learning-server/commit/d3e5910)

## Статус

✅ Исправлено и задеплоено на Railway
