# ТЕКУЩАЯ ЗАДАЧА: Публичные профили пользователей

## КОНТЕКСТ
Нужна система публичных профилей для социальных функций (просмотр профиля друга, лидерборд, и т.д.).

## ЦЕЛЬ
Добавить API endpoint для публичного профиля пользователя.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. API Endpoint

**GET /api/users/:userId/profile/public**

Публичная информация о пользователе (без приватных данных).

Response:
```json
{
  "user_id": 1,
  "username": "alex_polyglot",
  "display_name": "Alex",
  "avatar_url": "https://example.com/avatars/1.png",
  "bio": "Learning German and Spanish",
  "joined_date": "2025-01-15",
  "learning_languages": ["Немецкий", "Испанский"],
  "stats": {
    "level": 15,
    "total_xp": 3500,
    "total_words": 450,
    "current_streak": 12,
    "longest_streak": 45,
    "total_quizzes": 120
  },
  "badges": [
    {
      "id": "streak_warrior",
      "name": "Воин стрика",
      "icon": "🔥",
      "unlocked_at": "2025-03-10"
    }
  ],
  "top_achievements": [
    {
      "id": "word_master",
      "name": "Мастер слов",
      "icon": "📚"
    }
  ],
  "is_public": true
}
```

### 2. Проверить существующие таблицы

- `users` - есть базовая информация
- `user_stats` или gamification tables - stats
- `user_achievements` - achievements
- Возможно нужно добавить колонки: `bio`, `avatar_url`, `is_public`

### 3. SQL Query

```sql
SELECT
  u.id as user_id,
  u.name as username,
  u.email, -- не включать в public response
  us.level,
  us.total_xp,
  us.total_words_learned,
  us.current_streak,
  us.longest_streak,
  us.total_quizzes_completed,
  u.createdat as joined_date
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE u.id = $1
```

### 4. Безопасность

- НЕ возвращать: email, пароль, phone
- Проверка `is_public` флага (если false - ограничить данные)
- Возвращать только базовые stats если профиль приватный

### 5. Дополнительные поля (опционально)

Если времени хватит, добавить в таблицу users:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
```

### 6. Тестирование

```bash
# Get public profile
curl http://localhost:3001/api/users/1/profile/public

# Should not include sensitive data (email, password)
```

## ВАЖНО
1. Не возвращать приватные данные (email, password)
2. Использовать существующие таблицы (не создавать новые)
3. Проверить is_public флаг (если добавлен)
4. JOIN с user_stats для статистики

## ГОТОВО КОГДА
- [ ] Endpoint `/api/users/:userId/profile/public` создан
- [ ] Возвращает публичные данные (без email/password)
- [ ] Включает статистику из user_stats
- [ ] Включает top 3 achievements (если есть)
- [ ] Протестировано
- [ ] PLAN.md обновлен
- [ ] Закоммичено

## УПРОЩЕННАЯ ВЕРСИЯ
Если мало времени - сделать только базовый endpoint:
- Username, level, XP, streak
- Без achievements/badges (оставить на следующую итерацию)
