# ТЕКУЩАЯ ЗАДАЧА: Система друзей (Friends System)

## КОНТЕКСТ
Нужна полноценная система друзей для социальных функций приложения.

## ЦЕЛЬ
Реализовать backend API для системы друзей с возможностью поиска, добавления друзей, управления запросами и просмотра ленты активности друзей.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблицы БД

```sql
-- Таблица друзей (friendships)
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    requested_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
```

### 2. API Endpoints

#### 2.1 Поиск пользователей
**GET /api/users/search?query=username&limit=20**

Response:
```json
{
  "users": [
    {
      "user_id": 5,
      "username": "alex_polyglot",
      "avatar_url": "https://...",
      "level": 12,
      "total_xp": 2500,
      "friendship_status": "none|pending|accepted|blocked"
    }
  ],
  "total": 15
}
```

#### 2.2 Отправить запрос в друзья
**POST /api/friends/request**

Body:
```json
{
  "user_id": 1,
  "friend_id": 5
}
```

Response:
```json
{
  "success": true,
  "message": "Friend request sent!",
  "friendship_id": 42
}
```

#### 2.3 Ответить на запрос
**POST /api/friends/respond**

Body:
```json
{
  "friendship_id": 42,
  "action": "accept|reject"
}
```

#### 2.4 Удалить из друзей
**DELETE /api/friends/:friendshipId**

#### 2.5 Заблокировать пользователя
**POST /api/friends/block**

Body:
```json
{
  "user_id": 1,
  "blocked_user_id": 5
}
```

#### 2.6 Получить список друзей
**GET /api/friends/:userId?status=accepted&limit=50&offset=0**

Response:
```json
{
  "friends": [
    {
      "friendship_id": 42,
      "user_id": 5,
      "username": "alex_polyglot",
      "avatar_url": "https://...",
      "level": 12,
      "total_xp": 2500,
      "current_streak": 15,
      "status": "accepted",
      "since": "2025-09-01"
    }
  ],
  "total": 24
}
```

#### 2.7 Получить входящие запросы
**GET /api/friends/:userId/requests/incoming**

#### 2.8 Получить исходящие запросы
**GET /api/friends/:userId/requests/outgoing**

#### 2.9 Получить заблокированных пользователей
**GET /api/friends/:userId/blocked**

#### 2.10 Лента активности друзей
**GET /api/friends/:userId/activity?limit=20**

Response:
```json
{
  "activities": [
    {
      "user_id": 5,
      "username": "alex_polyglot",
      "avatar_url": "https://...",
      "activity_type": "achievement_unlocked|level_up|milestone_reached|streak_milestone",
      "activity_data": {
        "achievement_name": "Word Master",
        "achievement_icon": "📚"
      },
      "timestamp": "2025-10-17T10:30:00Z",
      "time_ago": "2 часа назад"
    }
  ],
  "total": 45
}
```

### 3. SQL Queries примеры

#### Поиск пользователей с проверкой статуса дружбы
```sql
SELECT
  u.id as user_id,
  u.name as username,
  us.level,
  us.total_xp,
  COALESCE(f1.status, f2.status, 'none') as friendship_status
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
LEFT JOIN friendships f1 ON (f1.user_id = $1 AND f1.friend_id = u.id)
LEFT JOIN friendships f2 ON (f2.user_id = u.id AND f2.friend_id = $1)
WHERE u.name ILIKE $2 AND u.id != $1
ORDER BY us.total_xp DESC
LIMIT $3
```

#### Получить друзей с их статистикой
```sql
SELECT
  f.id as friendship_id,
  u.id as user_id,
  u.name as username,
  us.level,
  us.total_xp,
  us.current_streak,
  f.status,
  f.responded_at as since
FROM friendships f
JOIN users u ON (
  CASE
    WHEN f.user_id = $1 THEN u.id = f.friend_id
    WHEN f.friend_id = $1 THEN u.id = f.user_id
  END
)
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE (f.user_id = $1 OR f.friend_id = $1)
  AND f.status = $2
ORDER BY us.total_xp DESC
LIMIT $3 OFFSET $4
```

#### Лента активности друзей (за последние 7 дней)
```sql
-- Достижения друзей
SELECT
  u.id as user_id,
  u.name as username,
  'achievement_unlocked' as activity_type,
  json_build_object(
    'achievement_name', a.name,
    'achievement_icon', a.icon,
    'xp_reward', a.xp_reward
  ) as activity_data,
  ua.unlocked_at as timestamp
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id IN (
  SELECT CASE
    WHEN f.user_id = $1 THEN f.friend_id
    ELSE f.user_id
  END
  FROM friendships f
  WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
)
AND ua.unlocked_at >= NOW() - INTERVAL '7 days'

UNION ALL

-- Level ups (из xp_log)
SELECT
  u.id as user_id,
  u.name as username,
  'level_up' as activity_type,
  json_build_object(
    'new_level', us.level
  ) as activity_data,
  us.last_level_up_at as timestamp
FROM user_stats us
JOIN users u ON us.user_id = u.id
WHERE us.user_id IN (...)
AND us.last_level_up_at >= NOW() - INTERVAL '7 days'

ORDER BY timestamp DESC
LIMIT $2
```

### 4. Безопасность

- Проверка, что user_id != friend_id (нельзя добавить себя в друзья)
- Проверка на дубликаты запросов (UNIQUE constraint)
- Проверка прав доступа (пользователь может управлять только своими друзьями)
- Rate limiting для поиска (не более 10 запросов в минуту)

### 5. Валидация

- username для поиска: минимум 2 символа
- Проверка существования пользователей перед отправкой запроса
- Проверка статуса дружбы перед действиями
- Нельзя принять/отклонить чужие запросы

### 6. Тестирование

```bash
# Поиск пользователей
curl http://localhost:3001/api/users/search?query=alex&limit=5

# Отправить запрос в друзья
curl -X POST http://localhost:3001/api/friends/request \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "friend_id": 2}'

# Принять запрос
curl -X POST http://localhost:3001/api/friends/respond \
  -H "Content-Type: application/json" \
  -d '{"friendship_id": 1, "action": "accept"}'

# Список друзей
curl http://localhost:3001/api/friends/1?status=accepted

# Входящие запросы
curl http://localhost:3001/api/friends/1/requests/incoming

# Лента активности
curl http://localhost:3001/api/friends/1/activity?limit=10
```

## ГОТОВО КОГДА

- [ ] Таблица friendships создана
- [ ] 10 API endpoints реализованы
- [ ] Поиск пользователей работает
- [ ] Отправка/принятие/отклонение запросов работает
- [ ] Блокировка работает
- [ ] Лента активности друзей работает
- [ ] Все endpoints протестированы
- [ ] PLAN.md обновлен
- [ ] EXECUTION_LOG.md обновлен
- [ ] Закоммичено

## ПРИОРИТЕТ
HIGH - необходимо для социальных функций
