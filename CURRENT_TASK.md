# ТЕКУЩАЯ ЗАДАЧА: Global Feed (Глобальная лента)

## КОНТЕКСТ
Социальные функции развиты (friends, duels, tournaments, leagues). Нужна глобальная лента для отображения активности всех пользователей и создания community spirit.

## ЦЕЛЬ
Создать систему глобальной ленты с публичными активностями, мильстонами и взаимодействием.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблица global_feed (публичные активности)
```sql
CREATE TABLE IF NOT EXISTS global_feed (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB NOT NULL,
    visibility VARCHAR(20) DEFAULT 'public',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_global_feed_created_at ON global_feed(created_at DESC);
CREATE INDEX idx_global_feed_user_id ON global_feed(user_id);
CREATE INDEX idx_global_feed_type ON global_feed(activity_type);
```

### 2. Таблица feed_likes (лайки)
```sql
CREATE TABLE IF NOT EXISTS feed_likes (
    id SERIAL PRIMARY KEY,
    feed_id INTEGER REFERENCES global_feed(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(feed_id, user_id)
);
```

### 3. Таблица feed_comments (комментарии)
```sql
CREATE TABLE IF NOT EXISTS feed_comments (
    id SERIAL PRIMARY KEY,
    feed_id INTEGER REFERENCES global_feed(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Activity Types (типы активностей)
**Автоматические:**
- `achievement_unlocked` - разблокировал достижение
- `level_up` - повысил уровень
- `milestone_words` - выучил 100/500/1000/5000 слов
- `milestone_streak` - стрик 30/100/365 дней
- `league_promoted` - повышен в лиге
- `tournament_winner` - выиграл турнир
- `duel_victory` - выиграл дуэль (опционально)

**Ручные (пользователь может поделиться):**
- `custom_post` - кастомный пост с текстом
- `study_progress` - прогресс обучения
- `language_started` - начал изучать новый язык

### 5. API Endpoints (7)
- GET `/api/feed/global` - глобальная лента (pagination, filters)
- GET `/api/feed/:userId` - лента конкретного пользователя
- POST `/api/feed/post` - создать пост вручную
- POST `/api/feed/:feedId/like` - поставить/убрать лайк
- POST `/api/feed/:feedId/comment` - добавить комментарий
- GET `/api/feed/:feedId/comments` - получить комментарии к посту
- DELETE `/api/feed/:feedId` - удалить пост (только автор/admin)

### 6. Auto-posting Logic (интеграция)
При достижении мильстонов автоматически создавать posts:
- При разблокировке achievement → `achievement_unlocked`
- При level up → `level_up` (только каждые 5 уровней: 5, 10, 15...)
- При достижении 100/500/1000 слов → `milestone_words`
- При достижении 30/100/365 дней streak → `milestone_streak`
- При повышении в лиге → `league_promoted`
- При победе в турнире → `tournament_winner`

### 7. Feed Filtering & Pagination
- **Pagination**: limit (default 20), offset
- **Filters**:
  - activity_type (achievement, milestone, etc.)
  - time_period (today, week, month, all)
  - user_id (лента конкретного пользователя)
- **Sorting**: created_at DESC, likes_count DESC
- **Visibility**: public (all users), friends_only, private

### 8. Activity Data Format (JSONB)
```json
{
  "achievement_unlocked": {
    "achievement_key": "first_steps",
    "achievement_title": "Первые шаги",
    "achievement_icon": "🏆"
  },
  "level_up": {
    "old_level": 4,
    "new_level": 5,
    "total_xp": 500
  },
  "milestone_words": {
    "count": 1000,
    "languages": ["German", "Spanish"]
  },
  "milestone_streak": {
    "days": 365,
    "start_date": "2024-01-01"
  },
  "tournament_winner": {
    "tournament_id": 1,
    "tournament_title": "Weekly Tournament #5",
    "participants": 32,
    "prize": {"coins": 500, "gems": 50}
  }
}
```

## ПРИОРИТЕТ
MEDIUM-HIGH (social engagement feature)

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
- Глобальная лента с активностями всех пользователей
- Автопостинг при достижении мильстонов
- Лайки и комментарии для взаимодействия
- Pagination и фильтрация
- Ready for frontend integration
