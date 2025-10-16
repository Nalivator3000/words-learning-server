# ТЕКУЩАЯ ЗАДАЧА: Недельные челленджи (Weekly Challenges)

## КОНТЕКСТ
Ежедневные челленджи уже реализованы. Нужна система недельных челленджей с более сложными заданиями и большими наградами.

## ЦЕЛЬ
Добавить API endpoints для недельных челленджей (более долгосрочные цели).

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблица БД

```sql
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_coins INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start_date, challenge_type)
);
```

### 2. Типы недельных челленджей

```javascript
const WEEKLY_CHALLENGE_TEMPLATES = [
  {
    type: 'words_learned_week',
    title: 'Словарный марафон',
    description: 'Выучить 50 новых слов за неделю',
    target: 50,
    reward_xp: 200,
    reward_coins: 50,
    icon: '📚'
  },
  {
    type: 'streak_maintained_week',
    title: 'Недельный воин',
    description: 'Сохранить стрик всю неделю (7 дней подряд)',
    target: 7,
    reward_xp: 300,
    reward_coins: 75,
    icon: '🔥'
  },
  {
    type: 'quizzes_week',
    title: 'Квиз-мастер',
    description: 'Пройти 20 квизов за неделю',
    target: 20,
    reward_xp: 250,
    reward_coins: 60,
    icon: '🎯'
  },
  {
    type: 'xp_week',
    title: 'XP Чемпион',
    description: 'Заработать 500 XP за неделю',
    target: 500,
    reward_xp: 150,
    reward_coins: 40,
    icon: '⭐'
  }
];
```

### 3. API Endpoints

**a) GET /api/weekly-challenges/:userId**
Получить челленджи текущей недели.

Response:
```json
{
  "week_start": "2025-10-14",
  "week_end": "2025-10-20",
  "challenges": [
    {
      "id": 1,
      "type": "words_learned_week",
      "title": "Словарный марафон",
      "description": "Выучить 50 новых слов за неделю",
      "target": 50,
      "current_progress": 23,
      "progress_percentage": 46,
      "reward_xp": 200,
      "reward_coins": 50,
      "is_completed": false,
      "icon": "📚"
    }
  ],
  "completed_count": 0,
  "total_count": 4
}
```

**b) POST /api/weekly-challenges/:userId/claim**
Забрать награду за завершенный челлендж.

Request:
```json
{
  "challenge_id": 1
}
```

Response:
```json
{
  "success": true,
  "reward_xp": 200,
  "reward_coins": 50,
  "message": "Награда получена!"
}
```

**c) GET /api/weekly-challenges/:userId/history**
История прошлых недель.

Response:
```json
{
  "history": [
    {
      "week_start": "2025-10-07",
      "week_end": "2025-10-13",
      "completed_count": 3,
      "total_count": 4,
      "total_xp_earned": 750,
      "total_coins_earned": 185
    }
  ]
}
```

### 4. Бизнес-логика

**Автогенерация челленджей:**
- Каждый понедельник в 00:00 создаются 4 новых недельных челленджа
- Используются predefined templates
- Прогресс отслеживается автоматически (триггеры или cron job)

**Расчет прогресса:**
```javascript
async function updateWeeklyChallengeProgress(userId, challengeType) {
  const weekStart = getWeekStart(new Date()); // Понедельник текущей недели

  let currentProgress = 0;

  switch(challengeType) {
    case 'words_learned_week':
      currentProgress = await db.query(`
        SELECT COUNT(*) FROM words
        WHERE user_id = $1 AND created_at >= $2
      `, [userId, weekStart]);
      break;
    case 'streak_maintained_week':
      // Check if user maintained streak all 7 days
      break;
    // ... и т.д.
  }

  await db.query(`
    UPDATE weekly_challenges
    SET current_progress = $1,
        is_completed = (current_progress >= target)
    WHERE user_id = $2 AND challenge_type = $3 AND week_start_date = $4
  `, [currentProgress, userId, challengeType, weekStart]);
}
```

### 5. Интеграция

- При добавлении нового слова → обновить progress для `words_learned_week`
- При прохождении квиза → обновить `quizzes_week`
- При заработке XP → обновить `xp_week`
- При daily streak update → проверить `streak_maintained_week`

### 6. Тестирование

```bash
# 1. Получить текущие челленджи
curl http://localhost:3001/api/weekly-challenges/1

# 2. Забрать награду
curl -X POST http://localhost:3001/api/weekly-challenges/1/claim \
  -H "Content-Type: application/json" \
  -d '{"challenge_id": 1}'

# 3. История
curl http://localhost:3001/api/weekly-challenges/1/history
```

## ВАЖНО
1. Week start = Понедельник (ISO week standard)
2. Челленджи НЕ сбрасываются если не завершены (просто истекают)
3. Reward можно забрать только 1 раз
4. Прогресс обновляется автоматически (не вручную)

## ГОТОВО КОГДА
- [ ] Таблица weekly_challenges создана
- [ ] 3 endpoints реализованы (get, claim, history)
- [ ] Template система для челленджей
- [ ] Автогенерация в начале недели (базовая версия)
- [ ] Прогресс рассчитывается корректно
- [ ] Тестирование всех endpoints
- [ ] PLAN.md обновлен
- [ ] Код закоммичен

## УПРОЩЕННАЯ ВЕРСИЯ (для быстроты)
Если времени мало - сделать только:
1. Таблица weekly_challenges
2. GET endpoint (с mock данными)
3. Manual progress update (без автоматики)
Автогенерацию и интеграцию оставить на следующую итерацию.
