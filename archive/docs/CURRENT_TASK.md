# ТЕКУЩАЯ ЗАДАЧА: User Profile Endpoint (Iteration 20)

## ЦЕЛЬ
Создать comprehensive endpoint для получения полного профиля пользователя с объединённой информацией.

## SCOPE

### 1. Endpoint: GET /api/users/:userId/profile

Возвращает полную информацию о пользователе в одном запросе:
- Basic info (username, email, createdat)
- Stats (level, total_xp, streak, words learned)
- League info (current tier, weekly_xp)
- Achievements count (unlocked/total)
- Profile data (bio, avatar_url, showcase_achievements)
- Level progress (current XP, XP to next level, percentage)
- Recent activity (last 5 feed posts or friend activities)

### 2. Response Format
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2025-01-15",
    "is_beta_tester": false
  },
  "stats": {
    "level": 12,
    "total_xp": 2500,
    "current_streak": 15,
    "total_words_learned": 250,
    "total_quizzes_completed": 85
  },
  "league": {
    "current_tier": "Silver",
    "weekly_xp": 450,
    "tier_level": 2
  },
  "achievements": {
    "unlocked_count": 8,
    "total_count": 15
  },
  "profile": {
    "bio": "Learning German!",
    "avatar_url": null,
    "showcase_achievements": [1, 5, 8]
  },
  "level_progress": {
    "current_xp": 2500,
    "xp_for_next_level": 3000,
    "xp_needed": 500,
    "progress_percentage": 83.3
  },
  "recent_activity": [...]
}
```

### 3. Оптимизация
- Использовать JOIN'ы для минимизации запросов к БД
- Кешировать результат на 5 минут (optional)
- Возвращать 404 если пользователь не найден

## КРИТЕРИИ УСПЕХА
- ✅ Endpoint создан
- ✅ Все поля корректно заполняются
- ✅ Сервер успешно стартует
- ✅ Изменения закоммичены
