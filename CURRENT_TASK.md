# ТЕКУЩАЯ ЗАДАЧА: Level-based Feature Unlocking (Iteration 17)

## ЦЕЛЬ
Реализовать систему разблокировки функций при достижении определённых уровней.

## SCOPE

### 1. Features Unlock Table
Создать таблицу БД `level_features`:
```sql
CREATE TABLE level_features (
    id SERIAL PRIMARY KEY,
    level_required INTEGER NOT NULL,
    feature_key VARCHAR(100) NOT NULL UNIQUE,
    feature_name VARCHAR(255) NOT NULL,
    feature_description TEXT,
    feature_category VARCHAR(50), -- 'social', 'gamification', 'customization', 'advanced'
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Feature Definitions (Predefined List)
Автоматически инициализировать features при старте сервера:

**Social Features:**
- Level 5: `friend_requests` - Отправка запросов в друзья
- Level 10: `duel_challenges` - Участие в 1-на-1 дуэлях
- Level 15: `tournament_participation` - Регистрация на турниры
- Level 20: `global_feed_posting` - Ручная публикация в ленте

**Gamification:**
- Level 3: `daily_challenges` - Доступ к ежедневным заданиям
- Level 7: `weekly_challenges` - Доступ к недельным заданиям
- Level 12: `league_participation` - Участие в системе лиг
- Level 18: `achievement_tracking` - Доступ к системе достижений

**Customization:**
- Level 8: `theme_unlocking` - Покупка кастомных тем
- Level 14: `avatar_customization` - Кастомные аватары
- Level 25: `profile_bio` - Редактирование био профиля

**Advanced:**
- Level 30: `import_google_sheets` - Импорт из Google Sheets
- Level 40: `word_collections_create` - Создание публичных наборов слов
- Level 50: `mentor_program` - Участие в программе менторства

### 3. API Endpoints

#### GET /api/levels/features
Получить все features с unlock requirements:
```json
{
  "features": [
    {
      "level_required": 5,
      "feature_key": "friend_requests",
      "feature_name": "Запросы в друзья",
      "feature_description": "Отправляйте запросы и добавляйте друзей",
      "feature_category": "social",
      "icon": "👥"
    }
  ]
}
```

#### GET /api/users/:userId/unlocked-features
Получить разблокированные features для пользователя:
```json
{
  "current_level": 12,
  "unlocked_features": [
    { "feature_key": "daily_challenges", "unlocked_at_level": 3 },
    { "feature_key": "friend_requests", "unlocked_at_level": 5 }
  ],
  "locked_features": [
    { "feature_key": "tournament_participation", "unlocks_at_level": 15, "levels_remaining": 3 }
  ]
}
```

#### GET /api/users/:userId/can-use-feature/:featureKey
Проверка доступа к feature:
```json
{
  "can_use": true,
  "feature_key": "duel_challenges",
  "current_level": 12,
  "required_level": 10
}
```

### 4. Integration Points

Добавить проверки доступа к features в существующие endpoints:

**Friends System:**
- POST /api/friends/request → check `friend_requests`

**Duels:**
- POST /api/duels/challenge → check `duel_challenges`

**Tournaments:**
- POST /api/tournaments/:id/register → check `tournament_participation`

**Challenges:**
- GET /api/daily-challenges/:userId → check `daily_challenges`
- GET /api/weekly-challenges/:userId → check `weekly_challenges`

**Global Feed:**
- POST /api/feed/create → check `global_feed_posting`

**Leagues:**
- POST /api/leagues/:userId/award-weekly-xp → check `league_participation`

### 5. Helper Function

Создать `checkFeatureAccess(userId, featureKey)`:
```javascript
async function checkFeatureAccess(userId, featureKey) {
    // Get user level
    const userStats = await db.query('SELECT level FROM user_stats WHERE user_id = $1', [userId]);
    if (!userStats.rows.length) return { hasAccess: false, error: 'User not found' };

    const userLevel = userStats.rows[0].level;

    // Get feature requirement
    const feature = await db.query('SELECT level_required FROM level_features WHERE feature_key = $1', [featureKey]);
    if (!feature.rows.length) return { hasAccess: true }; // Feature not restricted

    const requiredLevel = feature.rows[0].level_required;

    return {
        hasAccess: userLevel >= requiredLevel,
        currentLevel: userLevel,
        requiredLevel: requiredLevel,
        levelsRemaining: Math.max(0, requiredLevel - userLevel)
    };
}
```

## ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

1. **server-postgresql.js**
   - Добавить таблицу `level_features` (после level_config)
   - Добавить инициализацию features
   - Добавить helper function `checkFeatureAccess`
   - Добавить 3 новых endpoint
   - Интегрировать проверки в 8 существующих endpoints

## КРИТЕРИИ УСПЕХА
- ✅ Таблица level_features создана
- ✅ 14+ features автоинициализированы
- ✅ 3 новых API endpoints работают
- ✅ 8 существующих endpoints защищены проверками
- ✅ Сервер успешно стартует
- ✅ Изменения закоммичены и запушены
