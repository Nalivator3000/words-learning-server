# ТЕКУЩАЯ ЗАДАЧА: Система достижений - UI Data Endpoints

## КОНТЕКСТ
Backend для achievements уже существует (таблицы, базовая логика). Нужны дополнительные endpoints для отображения в UI.

## ЦЕЛЬ
Добавить API endpoints для полноценного отображения достижений в интерфейсе.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Проверить существующие endpoints

Найти в server-postgresql.js:
- Таблицы: achievements, user_achievements
- Существующие endpoints для achievements

### 2. Добавить недостающие endpoints

**a) GET /api/users/:userId/achievements/progress**
Получить прогресс по всем достижениям (locked/unlocked/in-progress).

Response:
```json
{
  "achievements": [
    {
      "id": "first_steps",
      "title": "Первые шаги",
      "description": "Выучить 10 слов",
      "icon": "🏆",
      "category": "learning",
      "requirement_type": "words_learned",
      "requirement_value": 10,
      "reward_xp": 50,
      "reward_coins": 10,
      "unlocked": true,
      "unlocked_at": "2025-10-15T12:00:00Z",
      "progress": 10,
      "progress_percentage": 100
    },
    {
      "id": "vocabulary_builder",
      "title": "Словарный запас",
      "description": "Выучить 100 слов",
      "unlocked": false,
      "progress": 45,
      "progress_percentage": 45
    }
  ],
  "total_achievements": 15,
  "unlocked_count": 3,
  "total_xp_earned": 150,
  "total_coins_earned": 30
}
```

**b) GET /api/users/:userId/achievements/recent**
Последние разблокированные достижения (для уведомлений).

Response:
```json
{
  "recent": [
    {
      "id": "week_warrior",
      "title": "Воин недели",
      "unlocked_at": "2025-10-16T10:00:00Z",
      "reward_xp": 100
    }
  ]
}
```

**c) GET /api/achievements/categories**
Список всех категорий достижений.

Response:
```json
{
  "categories": [
    {
      "id": "learning",
      "name": "Обучение",
      "icon": "📚",
      "count": 5
    },
    {
      "id": "streak",
      "name": "Стрики",
      "icon": "🔥",
      "count": 4
    },
    {
      "id": "social",
      "name": "Социальное",
      "icon": "👥",
      "count": 3
    }
  ]
}
```

### 3. Бизнес-логика для прогресса

Рассчитать текущий прогресс пользователя по каждому достижению:

```javascript
async function calculateProgress(userId, achievement) {
  switch(achievement.requirement_type) {
    case 'words_learned':
      return await db.query('SELECT COUNT(*) FROM words WHERE user_id = $1', [userId]);
    case 'streak_days':
      return await db.query('SELECT current_streak FROM users WHERE id = $1', [userId]);
    case 'quiz_accuracy':
      // Calculate from quiz results
      break;
    // ... и т.д.
  }
}
```

### 4. Улучшить существующие endpoints

Если есть endpoint для получения достижений, добавить:
- Фильтрацию по категории
- Сортировку (unlocked_first, alphabetical, by_progress)
- Pagination

### 5. Тестирование

```bash
# 1. Получить прогресс по всем достижениям
curl "http://localhost:3001/api/users/1/achievements/progress"

# 2. Последние разблокированные
curl "http://localhost:3001/api/users/1/achievements/recent?limit=5"

# 3. Категории
curl "http://localhost:3001/api/achievements/categories"

# 4. Фильтр по категории
curl "http://localhost:3001/api/users/1/achievements/progress?category=learning"
```

## ВАЖНО
1. НЕ создавать новые таблицы (уже существуют)
2. Использовать существующую структуру БД
3. Добавить только недостающие endpoints для UI
4. Оптимизировать запросы (JOIN вместо множественных SELECT)

## ГОТОВО КОГДА
- [ ] Проверены существующие endpoints
- [ ] Добавлен /progress endpoint с расчетом прогресса
- [ ] Добавлен /recent endpoint
- [ ] Добавлен /categories endpoint
- [ ] Все endpoints протестированы
- [ ] PLAN.md обновлен
- [ ] Код закоммичен

## АЛЬТЕРНАТИВА (если мало времени)
Добавить только 1 endpoint: `/api/users/:userId/achievements/summary`
- Список всех achievements
- Прогресс по каждому
- Категории
Один комплексный endpoint вместо трех отдельных.
