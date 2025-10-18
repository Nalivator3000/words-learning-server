# ТЕКУЩАЯ ЗАДАЧА: Feature Access Integration (Iteration 18)

## ЦЕЛЬ
Интегрировать проверки доступа к features в существующие endpoints для обеспечения level-based restrictions.

## SCOPE

### 1. Endpoints для интеграции проверок (8 endpoints)

**Friends System:**
- POST `/api/friends/request` → check `friend_requests` (level 5)

**Duels:**
- POST `/api/duels/challenge` → check `duel_challenges` (level 10)

**Tournaments:**
- POST `/api/tournaments/:id/register` → check `tournament_participation` (level 15)

**Challenges:**
- GET `/api/daily-challenges/:userId` → check `daily_challenges` (level 3)
- GET `/api/weekly-challenges/:userId` → check `weekly_challenges` (level 7)

**Global Feed:**
- POST `/api/feed/create` → check `global_feed_posting` (level 20)

**Leagues:**
- POST `/api/leagues/:userId/award-weekly-xp` → check `league_participation` (level 12)

**Achievements:**
- GET `/api/achievements/unlocked/:userId` → check `achievement_tracking` (level 18)

### 2. Интеграция паттерн

Для каждого endpoint:

```javascript
// В начале endpoint handler (после валидации параметров)
const featureAccess = await checkFeatureAccess(userId, 'feature_key');

if (!featureAccess.hasAccess) {
    return res.status(403).json({
        error: 'Feature locked',
        message: `You need level ${featureAccess.requiredLevel} to use this feature`,
        feature_name: featureAccess.featureName,
        current_level: featureAccess.currentLevel,
        levels_remaining: featureAccess.levelsRemaining
    });
}

// Продолжение обычной логики endpoint...
```

### 3. Response формат для locked features

```json
{
  "error": "Feature locked",
  "message": "You need level 10 to use this feature",
  "feature_name": "Дуэли",
  "current_level": 5,
  "levels_remaining": 5
}
```

HTTP Status: **403 Forbidden**

### 4. Список endpoints и их feature keys

| Endpoint | Feature Key | Level Required |
|----------|-------------|----------------|
| POST /api/friends/request | friend_requests | 5 |
| POST /api/duels/challenge | duel_challenges | 10 |
| POST /api/tournaments/:id/register | tournament_participation | 15 |
| GET /api/daily-challenges/:userId | daily_challenges | 3 |
| GET /api/weekly-challenges/:userId | weekly_challenges | 7 |
| POST /api/feed/create | global_feed_posting | 20 |
| POST /api/leagues/:userId/award-weekly-xp | league_participation | 12 |
| GET /api/achievements/unlocked/:userId | achievement_tracking | 18 |

## ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

1. **server-postgresql.js**
   - Найти 8 endpoints (grep для точного поиска)
   - Добавить проверку checkFeatureAccess в начало каждого
   - Добавить error handling для locked features

## КРИТЕРИИ УСПЕХА
- ✅ 8 endpoints интегрированы с проверками доступа
- ✅ Единообразный error response (403 + message)
- ✅ Сервер успешно стартует
- ✅ Проверка работы: тестовый запрос с низким уровнем возвращает 403
- ✅ Изменения закоммичены и запушены
