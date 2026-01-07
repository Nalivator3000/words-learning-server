# Исправление проблемы "0 слов" у демо-пользователя

## Проблема

Демо-пользователь (test.onboarding@lexibooster.test) показывал везде 0 слов в интерфейсе, хотя в базе данных есть тысячи слов для всех языков.

## Причина

При создании демо-пользователя скрипт создавал только запись в таблице `users`, но не создавал:
1. ❌ Языковую пару (`language_pairs`)
2. ❌ Профиль пользователя (`user_profiles`)
3. ❌ Прогресс по словам (`user_word_progress`)

В новой архитектуре приложения:
- Слова хранятся в таблицах `source_words_*` (spanish, german, french и т.д.)
- Прогресс пользователя по словам хранится в `user_word_progress`
- Без записей в `user_word_progress` у пользователя нет слов для изучения

## Решение

Обновили скрипт `scripts/create-onboarding-test-user.js` для автоматического:

1. ✅ Создания языковой пары (German → Russian)
2. ✅ Создания профиля пользователя с дневными целями
3. ✅ Импорта ~100 слов из наборов слов в `user_word_progress`

## Использование

```bash
node scripts/create-onboarding-test-user.js
```

### Данные для входа

- **Email:** test.onboarding@lexibooster.test
- **Password:** Test123!

После входа пользователь сразу увидит ~91 слово в статусе "studying" и сможет начать обучение.

## Архитектура данных

```
users (основная информация о пользователе)
  └─> language_pairs (языковые пары пользователя, например "German → Russian")
       └─> user_word_progress (прогресс по каждому слову)
            └─> source_words_* (исходные слова из языковой базы)
```

### Таблица user_word_progress

Хранит прогресс пользователя по каждому слову:
- `user_id` - ID пользователя
- `language_pair_id` - ID языковой пары
- `source_language` - язык слова (german, spanish и т.д.)
- `source_word_id` - ID слова в таблице source_words_*
- `status` - статус изучения (studying, review_1, review_3, mastered)
- `correct_count`, `incorrect_count` - статистика ответов
- `ease_factor` - коэффициент сложности для алгоритма повторений

### API endpoint /api/words/counts

Эндпоинт подсчитывает количество слов по статусам из таблицы `user_word_progress`:

```sql
SELECT status, COUNT(*) as count
FROM user_word_progress
WHERE user_id = ? AND language_pair_id = ?
GROUP BY status
```

Если у пользователя нет записей в `user_word_progress`, все счётчики будут 0.

## Проверка данных

```bash
# Проверить прогресс демо-пользователя
node check-demo-user-progress.js

# Проверить статус всех языков
node check-all-languages-final.js
```

## Дата исправления

02.01.2026
