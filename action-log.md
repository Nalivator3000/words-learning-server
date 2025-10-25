# Action Log - Words Learning Server

## 2025-10-14

### Weekly Challenges System (Backend)
**Commit:** 📅 WEEKLY: Complete weekly challenges with bigger rewards

**Изменения:**
- База данных: `weekly_challenges` table (id, user_id, week_start_date, challenge_type, title, description, target_value, current_progress, is_completed, completed_at, reward_xp, reward_coins, reward_claimed, difficulty, UNIQUE constraint)
- API Endpoints (4 новых):
  - `GET /api/weekly-challenges/:userId` - получить или создать челленджи на текущую неделю (auto-create 3 default)
  - `POST /api/weekly-challenges/progress` - обновить прогресс (auto-complete при достижении target)
  - `POST /api/weekly-challenges/:challengeId/claim` - забрать награду (XP + coins, transaction-safe)
  - `GET /api/weekly-challenges/stats/:userId` - статистика по всем челленджам

**Файлы:**
- [server-postgresql.js:645-664](server-postgresql.js#L645-L664) - таблица
- [server-postgresql.js:6580-6774](server-postgresql.js#L6580-L6774) - API endpoints

**Функциональность:**
- Week calculation: автоматическое определение начала недели (понедельник)
- Default challenges: 3 челленджа каждую неделю (XP 500, words 50, streak 7)
- Bigger rewards: XP 100-200, coins 25-50 (больше чем daily)
- Difficulty levels: medium, hard (еженедельные более сложные)
- Progress tracking: инкрементальное обновление с auto-completion
- UNIQUE constraint: (user_id, week_start_date, challenge_type) предотвращает дубликаты
- Weekly reset: новые челленджи создаются каждую неделю автоматически

### Milestones & Rewards System (Backend)
**Commit:** 🏅 MILESTONES: Complete milestone tracking with dynamic rewards

**Изменения:**
- База данных: `user_milestones` table (id, user_id, milestone_type, milestone_value, is_reached, reached_at, reward_xp, reward_coins, reward_claimed, special_reward, UNIQUE constraint)
- API Endpoints (4 новых):
  - `POST /api/milestones/check` - проверить и создать достигнутые milestones (batch creation)
  - `GET /api/milestones/:userId` - получить все milestones (фильтр по типу)
  - `POST /api/milestones/:milestoneId/claim` - забрать награду (XP + coins + special)
  - `GET /api/milestones/:userId/progress` - прогресс по всем типам (с current stats)

**Файлы:**
- [server-postgresql.js:666-681](server-postgresql.js#L666-L681) - таблица
- [server-postgresql.js:6776-7013](server-postgresql.js#L6776-L7013) - API endpoints

**Функциональность:**
- Milestone types: words_learned, total_xp, streak_days, quizzes_completed, achievements_unlocked
- Predefined thresholds: 8 уровней для каждого типа (10, 50, 100, 250, 500, 1000, 2500, 5000)
- Dynamic rewards: XP = value * 0.5, coins = value * 0.1
- Batch creation: check endpoint создаёт все достигнутые milestones за раз
- Progress tracking: агрегация текущих stats из user_stats и achievements
- Special rewards: поддержка специальных наград (badges, themes, etc.)
- UNIQUE constraint: (user_id, milestone_type, milestone_value) для дубликатов

### User Badges System (Backend)
**Commit:** 🎖️ BADGES: Complete badge collection with rarity system

**Изменения:**
- База данных (2 таблицы):
  - `badges` - определения бейджей (id, badge_key UNIQUE, badge_name, description, icon, rarity, category, is_active, created_at)
  - `user_badges` - earned badges (id, user_id, badge_id, earned_at, is_equipped, UNIQUE constraint)

- Predefined Badges (10 бейджей):
  - **Achievement (4):** First Steps 👣, Word Master 📚 (1000 words), Streak Legend 🔥 (365 days), Perfectionist 💯 (100 perfect quizzes)
  - **Time (2):** Night Owl 🦉 (after midnight), Early Bird 🌅 (before 6 AM)
  - **Social (2):** Social Butterfly 🦋 (50+ friends), Duel Champion ⚔️ (100 wins)
  - **Special (2):** Beta Tester 🧪 (legendary), League Master 💠 (Diamond)

- Rarity levels: common, uncommon, rare, epic, legendary

- API Endpoints (6 новых):
  - `GET /api/badges` - все бейджи (с is_earned если userId указан)
  - `GET /api/badges/user/:userId` - earned badges (с датами и equip status)
  - `POST /api/badges/award` - наградить бейджем (duplicate check)
  - `POST /api/badges/:badgeId/equip` - экипировать бейдж (только 1 одновременно)
  - `POST /api/badges/:badgeId/unequip` - снять бейдж
  - `GET /api/badges/user/:userId/equipped` - получить текущий бейдж

**Файлы:**
- [server-postgresql.js:683-708](server-postgresql.js#L683-L708) - таблицы
- [server-postgresql.js:1107-1142](server-postgresql.js#L1107-L1142) - initializeBadges()
- [server-postgresql.js:7015-7161](server-postgresql.js#L7015-L7161) - API endpoints

**Функциональность:**
- Badge categories: achievement, streak, accuracy, time, social, competitive, league, special
- Rarity system: сортировка по редкости (legendary → common)
- Equip system: только 1 бейдж может быть equipped одновременно
- User enrichment: автоматическое добавление is_earned для списка бейджей
- Award protection: duplicate check при выдаче бейджа
- UNIQUE constraints: badge_key для определений, (user_id, badge_id) для earned

### Activity Feed System (Backend)
**Commit:** 📰 FEED: Complete activity feed with social interactions

**Изменения:**
- База данных: `activity_feed` table (id, user_id, activity_type, activity_data JSONB, is_public, created_at) + indexes
- API Endpoints (6 новых):
  - `POST /api/activity-feed` - опубликовать активность (achievement, streak, word learned, etc.)
  - `GET /api/activity-feed/global` - глобальная лента (все публичные активности)
  - `GET /api/activity-feed/user/:userId` - личная лента пользователя
  - `GET /api/activity-feed/friends/:userId` - лента друзей (только accepted friendships)
  - `GET /api/activity-feed/type/:activityType` - фильтр по типу активности
  - `DELETE /api/activity-feed/:activityId` - удалить свою активность (ownership check)

**Файлы:**
- [server-postgresql.js:584-603](server-postgresql.js#L584-L603) - таблица + indexes
- [server-postgresql.js:5946-6121](server-postgresql.js#L5946-L6121) - API endpoints

**Функциональность:**
- Activity types: achievement_unlocked, streak_milestone, word_learned, level_up, challenge_completed, duel_won, friend_added
- Privacy control: is_public флаг для приватных активностей
- Rich data: JSONB activity_data для деталей (achievement name, streak count, etc.)
- User enrichment: автоматическое добавление name, avatar_url, level, XP
- Friends filtering: bidirectional friendship queries (UNION)
- Pagination: limit + offset для infinite scroll
- Performance: indexes на created_at и user_id для быстрых запросов
- Ownership protection: только автор может удалять свою активность

### Social Reactions System (Backend)
**Commit:** ❤️ REACTIONS: Complete likes & comments system

**Изменения:**
- База данных (2 таблицы):
  - `activity_likes` - лайки (id, activity_id, user_id, created_at, UNIQUE constraint)
  - `activity_comments` - комментарии (id, activity_id, user_id, comment_text, created_at)

- API Endpoints (7 новых):
  - `POST /api/activity-feed/:activityId/like` - лайкнуть активность (duplicate check)
  - `DELETE /api/activity-feed/:activityId/like` - убрать лайк
  - `GET /api/activity-feed/:activityId/likes` - список лайкнувших (с user info)
  - `POST /api/activity-feed/:activityId/comment` - добавить комментарий (text validation)
  - `GET /api/activity-feed/:activityId/comments` - все комментарии (chronological order)
  - `DELETE /api/activity-feed/comments/:commentId` - удалить комментарий (ownership check)
  - `GET /api/activity-feed/:activityId/details` - полная информация (likes_count, comments_count, is_liked)

**Файлы:**
- [server-postgresql.js:605-625](server-postgresql.js#L605-L625) - таблицы
- [server-postgresql.js:6123-6362](server-postgresql.js#L6123-L6362) - API endpoints

**Функциональность:**
- Duplicate prevention: UNIQUE constraint на (activity_id, user_id) для лайков
- Like/unlike: toggle механика с live count updates
- Comment validation: trimming, length check, empty text rejection
- User enrichment: автоматическое добавление name + avatar к reactions
- Ownership protection: только автор комментария может его удалить
- Details endpoint: полная агрегация (counts + is_liked для текущего юзера)
- Chronological order: комментарии сортируются ASC (oldest first, как в соцсетях)
- CASCADE deletion: автоматическое удаление reactions при удалении activity

### User Inventory System (Backend)
**Commit:** 🎒 INVENTORY: Complete user inventory management

**Изменения:**
- База данных: `user_inventory` table (id, user_id, item_type, item_id, item_name, quantity, is_equipped, is_active, acquired_at, expires_at, metadata JSONB, UNIQUE constraint)
- API Endpoints (7 новых):
  - `GET /api/inventory/:userId` - получить инвентарь (фильтр по item_type)
  - `POST /api/inventory` - добавить предмет (auto-stack existing)
  - `POST /api/inventory/:inventoryId/use` - использовать предмет (quantity decrement)
  - `POST /api/inventory/:inventoryId/equip` - экипировать предмет (auto-unequip others)
  - `POST /api/inventory/:inventoryId/unequip` - снять предмет
  - `GET /api/inventory/:userId/equipped` - получить экипированные предметы
  - `POST /api/inventory/cleanup-expired` - удалить истёкшие предметы (cron job)

**Файлы:**
- [server-postgresql.js:627-643](server-postgresql.js#L627-L643) - таблица
- [server-postgresql.js:6364-6557](server-postgresql.js#L6364-L6557) - API endpoints

**Функциональность:**
- Item types: theme, avatar, booster, hint, freeze, badge, consumable
- Quantity stacking: автоматическое увеличение quantity для существующих предметов
- Consumable mechanics: use endpoint уменьшает quantity, удаляет при 0
- Equip system: только 1 предмет каждого типа может быть equipped одновременно
- Time-limited items: expires_at для временных предметов (boosters, freezes)
- Metadata storage: JSONB для дополнительных данных (duration, multiplier, etc.)
- UNIQUE constraint: (user_id, item_type, item_id) предотвращает дубликаты
- Cleanup endpoint: автоматическая очистка истёкших предметов (для cron)

### Boosters System (Backend)
**Commit:** 🚀 BOOSTERS: Complete power-ups system with time-limited boosters

**Изменения:**
- База данных: `boosters` table (id, user_id, booster_type, multiplier, duration_minutes, purchased_at, activated_at, expires_at, is_active, is_used)
- API Endpoints (6 новых):
  - `POST /api/boosters/purchase` - купить бустер (coins → booster, transaction log)
  - `POST /api/boosters/:boosterId/activate` - активировать бустер (начать таймер)
  - `GET /api/boosters/active/:userId` - активные бустеры (unexpired только)
  - `GET /api/boosters/inventory/:userId` - инвентарь бустеров (не активированные)
  - `GET /api/boosters/history/:userId` - история использованных бустеров
  - `POST /api/boosters/apply-multiplier` - применить множитель к XP (auto-calculation)

**Файлы:**
- [server-postgresql.js:498-513](server-postgresql.js#L498-L513) - таблица
- [server-postgresql.js:5385-5601](server-postgresql.js#L5385-L5601) - API endpoints

**Функциональность:**
- Purchase-Activate workflow: купить → сохранить в инвентарь → активировать при необходимости
- Time-based expiration: бустер действует N минут с момента активации
- Type restriction: можно иметь только 1 активный бустер каждого типа одновременно
- Multiplier application: умножает baseXp на multiplier (1.5x, 2.0x, 3.0x)
- Coin deduction: проверка баланса перед покупкой, transaction log
- Usage tracking: is_used флаг для истории
- Booster types: xp_booster, coin_booster, learning_booster (расширяемо)

### Push Notifications System (Backend)
**Commit:** 🔔 NOTIFICATIONS: Complete push notifications system with preferences

**Изменения:**
- База данных (3 таблицы):
  - `push_subscriptions` - подписки на push (id, user_id, endpoint UNIQUE, keys_p256dh, keys_auth, user_agent, is_active, created_at, last_used_at)
  - `notification_preferences` - настройки уведомлений (id, user_id UNIQUE, daily_reminder, daily_reminder_time, streak_warning, achievements, friend_requests, duel_challenges, new_followers, weekly_report)
  - `notification_history` - история уведомлений (id, user_id, notification_type, title, body, data JSONB, is_read, sent_at, read_at)

- API Endpoints (8 новых):
  - `POST /api/notifications/subscribe` - подписаться на push (Web Push API subscription)
  - `POST /api/notifications/unsubscribe` - отписаться от push
  - `GET /api/notifications/preferences/:userId` - получить настройки (auto-create defaults)
  - `PUT /api/notifications/preferences/:userId` - обновить настройки (гранулярный контроль)
  - `POST /api/notifications/send` - отправить уведомление (internal use, backend-triggered)
  - `GET /api/notifications/history/:userId` - история уведомлений (last 50)
  - `PUT /api/notifications/:notificationId/read` - пометить как прочитанное
  - `GET /api/notifications/unread-count/:userId` - количество непрочитанных

**Файлы:**
- [server-postgresql.js:515-561](server-postgresql.js#L515-L561) - таблицы
- [server-postgresql.js:5603-5810](server-postgresql.js#L5603-L5810) - API endpoints

**Функциональность:**
- Web Push API integration: endpoint + keys (p256dh, auth) для браузерных уведомлений
- Subscription management: update existing или create new, is_active флаг
- Notification preferences: 8 типов уведомлений с индивидуальным контролем
- Daily reminder time: пользователь выбирает время для ежедневного напоминания
- Notification history: сохранение всех отправленных уведомлений
- Read/Unread tracking: is_read флаг + read_at timestamp
- Data payload: JSONB поле для дополнительных данных (achievement details, friend info, etc.)
- Multi-device support: один пользователь может иметь несколько subscriptions

### User Settings System (Backend)
**Commit:** ⚙️ SETTINGS: Complete user preferences system

**Изменения:**
- База данных: `user_settings` table (id, user_id UNIQUE, theme, language, timezone, date_format, time_format, sound_effects, animations, auto_play_audio, speech_rate, speech_pitch, speech_volume, created_at, updated_at)
- API Endpoints (4 новых):
  - `GET /api/settings/:userId` - получить настройки (auto-create defaults)
  - `PUT /api/settings/:userId` - обновить все настройки (bulk update)
  - `PATCH /api/settings/:userId/:setting` - обновить одну настройку (granular)
  - `POST /api/settings/:userId/reset` - сбросить на дефолты

**Файлы:**
- [server-postgresql.js:563-582](server-postgresql.js#L563-L582) - таблица
- [server-postgresql.js:5813-5923](server-postgresql.js#L5813-L5923) - API endpoints

**Функциональность:**
- Theme preferences: auto, light, dark (system detection)
- Localization: language, timezone, date_format, time_format
- UI preferences: sound_effects, animations (accessibility)
- TTS settings: auto_play_audio, speech_rate (0.5-2.0), speech_pitch (0.5-2.0), speech_volume (0.0-1.0)
- Auto-creation: дефолтные настройки создаются при первом запросе
- Flexible updates: обновление всех полей или только одного
- Reset to defaults: очистка + создание новой записи с дефолтами
- Validation: whitelist allowed settings для PATCH endpoint
- Timestamp tracking: updated_at обновляется при каждом изменении

### Streak Freeze System (Backend)
**Commit:** ❄️ FREEZE: Complete streak freeze system

**Изменения:**
- База данных: `streak_freezes` table (id, user_id, freeze_days, purchased_at, expires_at, is_active, used_on_date)
- API Endpoints (3 новых):
  - `POST /api/streak-freeze/purchase` - купить заморозку стрика
  - `GET /api/streak-freeze/:userId` - получить активные заморозки
  - `POST /api/streak-freeze/use` - использовать заморозку (auto-called при пропуске дня)

**Файлы:**
- [server-postgresql.js:434-446](server-postgresql.js#L434-L446) - таблица
- [server-postgresql.js:4808-4890](server-postgresql.js#L4808-L4890) - API endpoints

**Функциональность:**
- Expiration tracking: заморозки действуют N дней с момента покупки
- Auto-use: старейшая активная заморозка используется автоматически при пропуске
- Multi-freeze support: можно иметь несколько активных заморозок
- Purchase tracking: история покупок с датами

### Daily Goals System (Backend)
**Commit:** 🎯 GOALS: Complete daily goals system with auto-rewards

**Изменения:**
- База данных: `daily_goals` table (id, user_id, goal_date, goal_type, target_value, current_progress, is_completed, completed_at, reward_xp, reward_coins, UNIQUE constraint)
- API Endpoints (3 новых):
  - `GET /api/daily-goals/:userId` - получить или создать цели на сегодня (auto-create 3 default goals)
  - `POST /api/daily-goals/progress` - обновить прогресс цели (auto-complete + rewards)
  - `GET /api/daily-goals/stats/:userId` - статистика по целям за N дней

**Файлы:**
- [server-postgresql.js:448-463](server-postgresql.js#L448-L463) - таблица
- [server-postgresql.js:4892-5085](server-postgresql.js#L4892-L5085) - API endpoints

**Функциональность:**
- Auto-generation: 3 default goals каждый день (xp: 50, words_learned: 10, quizzes: 5)
- Progress tracking: incremental updates с auto-completion
- Auto-rewards: XP + coins автоматически начисляются при завершении
- Goal types: xp, words_learned, quizzes (расширяемо)
- Daily reset: новые цели создаются каждый день
- Stats: total goals, completion rate, earned rewards

### Duels System (Backend)
**Commit:** ⚔️ DUELS: Complete 1v1 battles system

**Изменения:**
- База данных (2 таблицы):
  - `duels` table: id, challenger_id, opponent_id, status, language_pair_id, total_questions, time_limit_seconds, challenger_score, opponent_score, winner_id, started_at, completed_at, CHECK constraint
  - `duel_answers` table: id, duel_id, user_id, word_id, is_correct, answer_time_ms, answeredAt

- API Endpoints (7 новых):
  - `POST /api/duels/challenge` - вызвать друга на дуэль
  - `POST /api/duels/:duelId/accept` - принять вызов
  - `POST /api/duels/:duelId/decline` - отклонить вызов
  - `POST /api/duels/:duelId/answer` - отправить ответ (auto-complete duel)
  - `GET /api/duels/:duelId` - детали дуэли (с ответами)
  - `GET /api/duels/user/:userId` - все дуэли пользователя
  - `GET /api/duels/stats/:userId` - статистика (wins/losses/draws)

**Файлы:**
- [server-postgresql.js:465-496](server-postgresql.js#L465-L496) - таблицы
- [server-postgresql.js:5087-5362](server-postgresql.js#L5087-L5362) - API endpoints

**Функциональность:**
- Challenge workflow: pending → active → completed/declined
- Real-time scoring: обновление счета после каждого ответа
- Auto-completion: дуэль завершается когда оба игрока ответили на все вопросы
- Winner determination: автоматическое определение победителя по счету
- XP rewards: 100 XP победителю
- Answer tracking: сохранение всех ответов с временем
- Stats: общая статистика побед/поражений/ничьих
- Activity logging: интеграция с friend activities

### User Profiles System (Backend)
**Commit:** 👤 PROFILES: Complete user profiles system with public profiles

**Изменения:**
- База данных:
  - Миграция users table: добавлены поля username (UNIQUE), bio, avatar_url, is_public
  - `user_profiles` table: showcase_achievements, favorite_languages, study_goal, daily_goal_minutes, timezone, language_level (JSONB), profile_views, last_active

- API Endpoints (6 новых):
  - `GET /api/profiles/:userId` - публичный профиль (с stats, counts)
  - `PUT /api/profiles/:userId` - обновить свой профиль
  - `POST /api/profiles/:userId/avatar` - загрузка аватара (URL-based)
  - `GET /api/profiles/:userId/showcase` - showcase достижения (топ-3)
  - `GET /api/profiles/search/users` - поиск пользователей по username/name
  - `GET /api/profiles/:userId/activity` - активность профиля (XP, achievements, streak)

**Файлы:**
- [server-postgresql.js:241-288](server-postgresql.js#L241-L288) - миграции и таблицы
- [server-postgresql.js:4162-4527](server-postgresql.js#L4162-L4527) - API endpoints

**Функциональность:**
- Privacy control: is_public флаг для приватных профилей
- Profile views tracking: автоматический подсчет просмотров
- Showcase achievements: массив до 3х лучших достижений
- User stats aggregation: XP, level, streak, words, achievements, friends count
- Dynamic profile updates: flexible field updates с transaction safety
- Activity summary: последние XP действия, достижения, стрик

### Leagues System (Backend)
**Commit:** 🏆 LEAGUES: Complete weekly leagues system (Bronze → Diamond)

**Изменения:**
- База данных (2 таблицы):
  - `league_memberships` - участие в лигах (id, user_id, league_tier, week_start_date, week_xp, rank_in_league, promoted, demoted, UNIQUE constraint)
  - `league_tiers` - конфигурация лиг (id, tier_name UNIQUE, tier_level, promotion_threshold, demotion_threshold, min_xp_required, icon, color)

- Predefined League Tiers (5 уровней):
  - **Bronze** 🥉: level 1, top 3 promoted, min XP: 0
  - **Silver** 🥈: level 2, top 3 promoted, bottom 8 demoted, min XP: 500
  - **Gold** 🥇: level 3, top 3 promoted, bottom 8 demoted, min XP: 1500
  - **Platinum** 💎: level 4, top 3 promoted, bottom 8 demoted, min XP: 3000
  - **Diamond** 💠: level 5, bottom 8 demoted, min XP: 5000

- API Endpoints (6 новых):
  - `GET /api/leagues/current/:userId` - текущая лига пользователя (auto-create if needed)
  - `GET /api/leagues/leaderboard/:tier` - топ-50 в лиге за текущую неделю
  - `POST /api/leagues/update-xp` - обновить недельный XP
  - `GET /api/leagues/history/:userId` - история участия в лигах
  - `GET /api/leagues/tiers` - список всех лиг
  - `POST /api/admin/leagues/process-week` - еженедельная обработка повышений/понижений

**Файлы:**
- [server-postgresql.js:404-432](server-postgresql.js#L404-L432) - создание таблиц
- [server-postgresql.js:803-826](server-postgresql.js#L803-L826) - initializeLeagueTiers()
- [server-postgresql.js:4529-4775](server-postgresql.js#L4529-L4775) - API endpoints

**Функциональность:**
- Weekly reset: лиги работают по неделям (понедельник)
- Auto-placement: новые пользователи попадают в лигу по total XP
- Promotion/Demotion: топ-3 повышаются, низ-8 понижаются
- Week XP tracking: отдельный счетчик XP за текущую неделю
- ROW_NUMBER ranking: эффективное ранжирование с window functions
- Transaction-safe processing: обработка всех пользователей в транзакции
- League history: сохранение результатов всех недель с promoted/demoted флагами

## 2025-10-13

### Coins Economy System (API Endpoints)
**Commit:** 💰 COINS: Complete API endpoints for coins economy system

**Изменения:**
- Реализованы 6 API endpoints для экономики монет
- Интеграция с challenges (монеты автоматически начисляются при claim reward)

**API Endpoints (6 новых):**
- `GET /api/coins/balance/:userId` - получить баланс монет
- `POST /api/coins/earn` - начислить монеты (с transaction logging)
- `POST /api/coins/spend` - потратить монеты (с проверкой баланса)
- `GET /api/coins/shop` - получить товары в магазине (фильтрация по category/item_type)
- `POST /api/coins/purchase` - купить товар (с stock management и expiration)
- `GET /api/coins/transactions/:userId` - история транзакций
- `GET /api/coins/purchases/:userId` - покупки пользователя (active items)

**Файлы:**
- [server-postgresql.js:3083-3448](server-postgresql.js#L3083-L3448) - API endpoints

**Функциональность:**
- Transaction safety: BEGIN/COMMIT/ROLLBACK для всех операций
- Insufficient funds check: проверка перед тратой монет
- Stock management: уменьшение stock_quantity для limited items
- Expiration calculation: автоматический расчет expiresAt для boosters/freezes
- Balance tracking: balance_after в каждой транзакции
- Active purchases: фильтрация по is_active и expiresAt

**Интеграция:**
- ✅ Challenges: монеты начисляются при claim reward (уже реализовано в server-postgresql.js:2359-2380)
- Coins зачисляются автоматически через coin_transactions таблицу
- Transaction-safe implementation с rollback при ошибках

### Friends System (Backend)
**Commit:** 👥 FRIENDS: Complete friends system with social features

**Изменения:**
- База данных (2 таблицы):
  - `friendships` - связи друзей (id, user_id, friend_id, status, requestedAt, acceptedAt, UNIQUE constraint, CHECK constraint)
  - `friend_activities` - лента активности (id, user_id, activity_type, activity_data JSONB, createdAt)

- API Endpoints (8 новых):
  - `POST /api/friends/request` - отправить заявку в друзья
  - `POST /api/friends/accept/:friendshipId` - принять заявку
  - `POST /api/friends/decline/:friendshipId` - отклонить заявку
  - `DELETE /api/friends/:friendshipId` - удалить из друзей (unfriend)
  - `GET /api/friends/:userId` - список друзей (accepted only)
  - `GET /api/friends/requests/received/:userId` - входящие заявки
  - `GET /api/friends/requests/sent/:userId` - исходящие заявки
  - `GET /api/friends/search` - поиск пользователей по имени/email (с friendship_status)
  - `GET /api/friends/activities/:userId` - лента активности друзей

**Файлы:**
- [server-postgresql.js:298-321](server-postgresql.js#L298-L321) - создание таблиц
- [server-postgresql.js:3450-3857](server-postgresql.js#L3450-L3857) - API endpoints

**Функциональность:**
- Friend request workflow: pending → accepted/declined
- Bidirectional friendship queries: (user_id = X OR friend_id = X)
- Status tracking: pending, accepted, blocked
- Activity logging: friend_request_sent, became_friends, etc.
- Search with context: показывает friendship_status (friends, request_sent, request_received, none)
- User validation: проверка существования пользователя, нельзя добавить себя
- CASCADE deletion: удаление связанных данных при удалении пользователя
- Friend stats: total_xp, level, current_streak, total_words_learned

### Achievements System (Backend)
**Commit:** 🏆 ACHIEVEMENTS: Complete achievement system with 15 predefined achievements

**Изменения:**
- База данных (2 таблицы):
  - `achievements` - определения достижений (id, achievement_key UNIQUE, title, description, icon, category, difficulty, reward_xp, reward_coins, is_secret, is_active)
  - `user_achievements` - прогресс пользователей (id, user_id, achievement_id, progress, target, is_unlocked, unlockedAt, UNIQUE constraint)

- Predefined Achievements (15 штук):
  - **Learning (4):** Первые шаги (10 слов), Строитель словаря (100 слов), Мастер слов (500 слов), Полиглот (3 пары)
  - **Streak (3):** Воин недели (7 дней), Марафонец (30 дней), Легендарный стрик (100 дней)
  - **Accuracy (2):** Перфекционист (10 квизов 100%), Снайпер (50 квизов 100%)
  - **Time (2):** Ночной ученик (🌙 после 22:00), Ранняя пташка (🌅 до 6:00) - секретные
  - **XP (2):** Коллекционер XP (1000 XP), Мастер XP (10000 XP)
  - **Social (1):** Общительный (5 друзей)
  - **Challenges (1):** Мастер челленджей (30 челленджей)

- API Endpoints (5 новых):
  - `GET /api/achievements` - все достижения (с прогрессом если userId указан)
  - `GET /api/achievements/unlocked/:userId` - разблокированные достижения
  - `POST /api/achievements/progress` - обновить прогресс (auto-unlock при достижении target)
  - `GET /api/achievements/stats/:userId` - статистика (unlocked_count, total_xp_earned, total_coins_earned)
  - `POST /api/admin/achievements` - создать кастомное достижение (админ)

**Файлы:**
- [server-postgresql.js:323-353](server-postgresql.js#L323-L353) - создание таблиц
- [server-postgresql.js:668-722](server-postgresql.js#L668-L722) - initializeAchievements()
- [server-postgresql.js:3859-4111](server-postgresql.js#L3859-L4111) - API endpoints

**Функциональность:**
- Progress tracking: incremental progress с auto-unlock
- Secret achievements: скрыты в публичном списке
- Reward system: автоматическое начисление XP + coins при unlock
- Category filtering: learning, streak, accuracy, time, xp, social, challenges
- Difficulty levels: easy, medium, hard, legendary
- Transaction safety: BEGIN/COMMIT/ROLLBACK для unlock операций
- User progress enrichment: автоматическое добавление прогресса к achievements list
- Icon support: эмодзи иконки для каждого достижения

### Client-Side Database Refactoring
**Commit:** 🔄 REFACTOR: Replace localStorage with server API in database.js

**Изменения:**
- Полностью переписан [public/database.js](public/database.js) с localStorage на серверное API
- Все операции теперь работают через HTTP запросы к backend
- Убрана зависимость от локального хранилища браузера

**Функции переписаны (13 функций):**
- `initDB()` - инициализация через проверку подключения
- `getAllWords()` - GET /api/words/:userId
- `addWord()` - POST /api/words с полными данными слова
- `updateWord()` - PUT /api/words/:wordId
- `deleteWord()` - DELETE /api/words/:wordId
- `getWordsByCollection()` - GET /api/words/:userId?collectionId=X
- `searchWords()` - GET /api/words/:userId/search?query=X
- `updateWordStatistics()` - PUT /api/words/:wordId/statistics
- `getCollections()` - GET /api/collections/:userId
- `addCollection()` - POST /api/collections
- `updateCollection()` - PUT /api/collections/:collectionId
- `deleteCollection()` - DELETE /api/collections/:collectionId
- `exportToJSON()` - GET /api/words/:userId для экспорта

**Технические детали:**
- Async/await для всех запросов
- Обработка ошибок с try/catch
- HTTP методы: GET, POST, PUT, DELETE
- JSON формат данных
- API endpoints используют существующие маршруты из server-postgresql.js
- Централизованная обработка ошибок сети

**Файлы:**
- [public/database.js](public/database.js) - полная переработка (было: localStorage, стало: API)

**Преимущества:**
- Синхронизация данных между устройствами
- Централизованное хранилище
- Более надежное хранение (PostgreSQL vs localStorage)
- Готовность к multi-device support
- Отсутствие ограничений localStorage (5-10MB)

**Следующие шаги:**
- Тестирование всех функций на реальных данных
- Проверка совместимости с gamification.js
- Миграция существующих данных из localStorage (если нужно)

### Leaderboards System
**Commit:** 🏆 LEADERBOARDS: Complete global ranking system

**Изменения:**
- База данных:
  - `leaderboard_cache` - кеш рейтингов для оптимизации (id, leaderboard_type, time_period, rank_position, user_id, score, cached_at, UNIQUE constraint)

- API Endpoints (4 новых):
  - `GET /api/leaderboard/global/:type` - Топ-100 рейтинг (xp, streak, words)
  - `GET /api/leaderboard/position/:userId/:type` - Позиция пользователя в рейтинге
  - `GET /api/leaderboard/nearby/:userId/:type` - Пользователи рядом (±5 позиций)
  - `GET /api/leaderboard/stats` - Глобальная статистика

**Файлы:**
- [server-postgresql.js:403-415](server-postgresql.js#L403-L415) - leaderboard_cache таблица
- [server-postgresql.js:2830-3081](server-postgresql.js#L2830-L3081) - API endpoints

**Функциональность:**
- 3 типа рейтингов: XP (опыт), Streak (стрик), Words (слова)
- Real-time rankings с ROW_NUMBER() window function
- Nearby view: показывает пользователей выше и ниже твоей позиции
- User position lookup: узнай свою позицию
- Global stats: highest scores, averages
- Efficient queries с CTEs и window functions
- Ranked output с позициями (rank: 1, 2, 3...)

**Query оптимизация:**
- Window functions для ранжирования (ROW_NUMBER)
- Фильтрация валидных записей (WHERE > 0)
- Indexed joins на user_stats
- Limit support для пагинации

**Response format:**
```json
{
  "rank": 1,
  "id": 2,
  "name": "User Name",
  "score": 1500,
  "level": 15
}
```

**Следующие шаги:**
- Frontend UI (таблица лидеров с аватарами)
- Weekly/Monthly leaderboards (time periods)
- Friends leaderboard (compare with friends)
- Leagues system (Bronze → Diamond)

### Coins Economy System (Database Layer)
**Commit:** 💰 COINS: Add coins economy system (database layer)

**Изменения:**
- База данных (4 компонента):
  - Поле `coins_balance` добавлено в таблицу `user_stats` (миграция с IF NOT EXISTS)
  - `coin_transactions` - история транзакций (id, user_id, amount, transaction_type, source, description, balance_after, timestamp)
  - `shop_items` - каталог товаров (id, item_key UNIQUE, item_type, name, description, price_coins, icon, category, is_active, is_limited, stock_quantity)
  - `user_purchases` - покупки пользователей (id, user_id, shop_item_id, quantity, total_cost, is_active, purchasedAt, expiresAt)

- Shop Items (19 predefined):
  - **Streak Protection (3):** Freeze 1/3/7 days (50-250 coins)
  - **Hints (2):** Packs of 5/20 hints (30-100 coins)
  - **Boosters (2):** XP Booster x2/x3 (80-120 coins)
  - **Themes (5):** Ocean, Forest, Sunset, Neon, Galaxy (200-350 coins)
  - **Avatars (5):** Cat, Dog, Panda, Unicorn, Dragon (100-300 coins)
  - **Special (2):** Double Rewards 24h (500 coins), Challenge Refresh (150 coins)

**Файлы:**
- [server-postgresql.js:344-401](server-postgresql.js#L344-L401) - создание таблиц (migrations + tables)
- [server-postgresql.js:501-547](server-postgresql.js#L501-L547) - initializeShopItems()

**Функциональность:**
- Transaction logging: каждая операция записывается с balance_after
- Item categorization: streak, hints, boosters, themes, avatars, special, challenges
- Item types: powerup, consumable, booster, theme, avatar
- Stock management: is_limited + stock_quantity для ограниченных товаров
- Time-limited purchases: expiresAt для временных покупок (бустеры, фризы)
- Active/inactive items: is_active для включения/выключения покупок
- UNIQUE constraint на item_key для безопасности

**Следующие шаги:**
- API endpoints (GET balance, POST earn/spend, GET shop, POST purchase, GET history)
- Интеграция с challenges (начисление монет за rewards)
- Balance validation (insufficient funds handling)
- Inventory system (активация купленных предметов)

### Daily Challenges System (Backend)
**Commit:** 🎯 CHALLENGES: Complete daily challenges system

**Изменения:**
- База данных (3 таблицы):
  - `challenge_templates` - шаблоны заданий (id, challenge_type, title, description, target_value, reward_xp, reward_coins, difficulty, icon, is_active, timestamps)
  - `user_daily_challenges` - экземпляры заданий (id, user_id, challenge_template_id, challenge_date, current_progress, target_value, is_completed, completed_at, reward_claimed, timestamps)
  - `challenge_progress_log` - история прогресса (id, user_challenge_id, progress_increment, action_type, action_details, timestamp)

- Challenge Templates (9 predefined):
  - **Easy (3):** Learn 5 words (50 XP, 10 coins), Review 10 words (30 XP, 5 coins), 5 correct answers (25 XP, 5 coins)
  - **Medium (3):** Earn 100 XP (75 XP, 15 coins), Perfect quiz (100 XP, 20 coins), Maintain streak (50 XP, 10 coins)
  - **Hard (3):** Learn 20 words (200 XP, 50 coins), 30 exercises (150 XP, 30 coins), 60 minutes study (250 XP, 60 coins)

- API Endpoints (6 новых):
  - `GET /api/challenges/daily/:userId` - получить или автогенерировать 3 челленджа на сегодня
  - `POST /api/challenges/progress` - обновить прогресс челленджа
  - `POST /api/challenges/claim-reward/:challengeId` - забрать награду (XP + coins)
  - `GET /api/challenges/history/:userId` - история челленджей со статистикой
  - `POST /api/admin/challenges/template` - создать кастомный челлендж (админ)
  - `GET /api/challenges/stats/:userId` - статистика по сложности/типу, challenge streak

**Файлы:**
- [server-postgresql.js:298-342](server-postgresql.js#L298-L342) - создание таблиц
- [server-postgresql.js:405-437](server-postgresql.js#L405-L437) - initializeChallengeTemplates()
- [server-postgresql.js:2069-2386](server-postgresql.js#L2069-L2386) - API endpoints

**Функциональность:**
- Auto-generation: каждый день 1 easy + 1 medium + 1 hard (random selection)
- Progress tracking: incremental updates, логирование каждого действия
- Reward system: XP зачисляется в user_stats, coins (для будущей системы)
- Challenge streak: подсчет consecutive days с выполненными челленджами
- History: 30 дней истории с completion rate
- Admin panel: создание кастомных челленджей
- Transaction safety: BEGIN/COMMIT/ROLLBACK для rewards
- Date-based reset: автоматическое обновление каждый день
- UNIQUE constraint: user_id + challenge_template_id + challenge_date

**Следующие шаги:**
- Frontend UI для отображения челленджей (карточки с прогресс-барами)
- Notifications о новых челленджах (push/email)
- Achievement "Challenge Master" за 30 дней выполненных челленджей
- Weekly challenges (расширение системы)

### Bug Reporting System (Backend)
**Commit:** 🐛 REPORTS: Complete bug reporting system backend

**Изменения:**
- База данных:
  - Добавлен флаг `is_beta_tester` к таблице `users` (миграция с IF NOT EXISTS)
  - Создана таблица `reports` (id, user_id, report_type, title, description, page_url, browser_info, screen_resolution, status, priority, assigned_to, github_issue_number, timestamps)
  - Создана таблица `report_attachments` (id, report_id, filename, filepath, mimetype, size, timestamp)
  - Создана таблица `report_comments` (id, report_id, user_id, comment_text, is_internal, timestamp)
  - Создана таблица `report_votes` (id, report_id, user_id, vote_type, timestamp с UNIQUE constraint)

- API Endpoints (10 новых):
  - `PUT /api/admin/users/:userId/beta-tester` - включить/выключить beta-доступ
  - `GET /api/users/:userId/beta-tester` - проверить статус beta-тестера
  - `POST /api/reports` - создать новый репорт (только для beta-тестеров, до 5 скриншотов)
  - `GET /api/reports` - список репортов с фильтрацией (userId, status, reportType, priority)
  - `GET /api/reports/:reportId` - детали репорта (с attachments, comments, votes)
  - `PUT /api/admin/reports/:reportId` - обновить статус/приоритет/назначение/GitHub issue
  - `POST /api/reports/:reportId/comments` - добавить комментарий к репорту
  - `POST /api/reports/:reportId/vote` - проголосовать за репорт (upvote, important, me_too)
  - `DELETE /api/admin/reports/:reportId` - удалить репорт (с файлами)
  - `GET /api/reports/stats/summary` - статистика по репортам (total, byStatus, byType, byPriority)

**Файлы:**
- [server-postgresql.js:228-239](server-postgresql.js#L228-L239) - миграция is_beta_tester
- [server-postgresql.js:241-296](server-postgresql.js#L241-L296) - создание таблиц
- [server-postgresql.js:1584-1984](server-postgresql.js#L1584-L1984) - API endpoints

**Функциональность:**
- Report types: bug, feature, improvement, question
- Status workflow: open → in_progress → resolved → closed
- Priority levels: low, medium, high, critical
- Автоматический сбор контекста (pageUrl, browserInfo, screenResolution)
- Multi-file upload через multer (до 5 файлов)
- Система комментариев (публичные + внутренние)
- Voting system (upvote, important, me_too с UNIQUE constraint)
- Assignment система для админов
- GitHub Issues integration support (поле github_issue_number)
- CASCADE deletion для связанных данных
- Transaction safety (BEGIN/COMMIT/ROLLBACK)
- Удаление файлов при удалении репорта

**Следующие шаги:**
- Frontend UI (FAB button, модальное окно)
- Админ-панель для управления репортами
- Email уведомления (Nodemailer/SendGrid)
- GitHub Issues автоматизация (Octokit)

### Global Word Collections System (Backend)
**Commit:** 📚 COLLECTIONS: Add global word collections system (backend)

**Изменения:**
- Добавлены таблицы БД:
  - `global_word_collections` - системные наборы слов
  - `global_collection_words` - слова в наборах
- Реализованы API endpoints:
  - `GET /api/global-collections` - список всех публичных наборов с фильтрацией (язык, категория, сложность)
  - `GET /api/global-collections/:collectionId` - получение набора со всеми словами
  - `POST /api/global-collections/:collectionId/import` - импорт набора в личную коллекцию пользователя
  - `POST /api/admin/global-collections` - создание нового глобального набора (админ)

**Файлы:**
- [server-postgresql.js:195-226](server-postgresql.js#L195-L226) - создание таблиц
- [server-postgresql.js:1322-1512](server-postgresql.js#L1322-L1512) - API endpoints

**Функциональность:**
- Поддержка множества языковых пар (from_lang, to_lang)
- Категоризация (General, Travel, Business, Food, Sports, IT и др.)
- Уровни сложности (A1, A2, B1, B2, C1, C2)
- Счетчик использования (usage_count)
- Проверка дубликатов при импорте
- Транзакционная безопасность
- Сортировка слов по order_index

### Analytics System (Completed Earlier)
**Commit:** 📊 ANALYTICS: Complete statistics and analytics system

**Изменения:**
- Добавлена таблица БД `analytics_events` для отслеживания событий
- Реализованы 5 analytics endpoints:
  - `GET /api/analytics/progress/:userId` - прогресс за период
  - `GET /api/analytics/exercise-stats/:userId` - статистика по типам упражнений
  - `GET /api/analytics/difficult-words/:userId` - сложные слова
  - `GET /api/analytics/study-time/:userId` - время обучения
  - `GET /api/analytics/fluency-prediction/:userId` - ML предсказание прогресса
- Интеграция Chart.js v4.4.1 для визуализаций
- Добавлена страница статистики в UI

**Протестировано:**
- Все 5 API endpoints успешно протестированы через PowerShell
- Корректный формат возвращаемых данных
- Работа с пустыми данными (новый пользователь)

### Plan Updates
**Файл:** [PLAN.md](PLAN.md)

**Изменения:**
- Секция 3.4 "Глобальные наборы слов" отмечена как ✅ ЧАСТИЧНО ГОТОВО (Backend)
- Добавлена секция 8 "Система репортов и обратной связи" с 7 подсекциями:
  - 8.1 Управление тестировщиками (флаг is_beta_tester)
  - 8.2 UI для отправки репортов (FAB button, модальное окно)
  - 8.3 Backend для репортов (таблицы и API)
  - 8.4 Админ-панель для управления репортами
  - 8.5 Уведомления
  - 8.6 Интеграции (GitHub Issues)
  - 8.7 Дополнительные функции (голосование, gamification)
- Добавлена секция 9 "Финальная оптимизация и рефакторинг" (8 подсекций)

## Следующие шаги

### Приоритет 1: Bug Reporting System (Секция 8)
- Реализация backend (таблицы БД, API endpoints)
- Создание UI компонентов (FAB button, модальное окно)
- Админ-панель для управления репортами
- Интеграция с GitHub Issues

### Приоритет 2: Global Collections Frontend
- UI для просмотра и поиска наборов
- Импорт наборов в личную коллекцию
- Превью набора перед импортом

### Приоритет 3: Other Incomplete Features
- Gamification система (достижения, уровни)
- Social features (друзья, соревнования)
- AI-powered features (умные упражнения, персонализация)

---

## История коммитов (develop branch)

```
c708a37 ✨ ANIMATIONS: Complete micro-animations system with stagger & pulse effects
1100fb8 ✨ DESIGN: Glassmorphism effects with radial gradient backgrounds
2bae10d 🔊 TTS: Complete voice selection UI with preview and persistence
24fc1b3 📋 UPDATE PLAN: Mark PWA as complete ✅
0268689 📱 PWA: Complete Service Worker implementation for offline mode
```

## Активные background процессы

- Background Bash 460545: node server-postgresql.js (running)
- Background Bash 6d7e27: node server-postgresql.js (running)
- Background Bash 07baee: node server-postgresql.js (running)

## 2025-10-25

### Test Account Creation System (Android Release Prep)
**Commits:** 
- 1f4dae3: ✅ TEST DATA: Create Demo Account Script
- a3e8f77: 🔧 FIX: Use Correct Password Hash Algorithm

**Изменения:**
- Скрипты автоматизации:
  - `create-test-account.js` - создание тестового аккаунта с данными
  - `delete-test-account.js` - удаление тестового аккаунта
- Railway PostgreSQL direct access через pg library
- Исправлена схема базы данных (createdat/updatedat вместо created_at/updated_at)
- Исправлен алгоритм хеширования паролей (простой JS hash вместо SHA256)

**Файлы:**
- [create-test-account.js](create-test-account.js) - создание аккаунта
- [delete-test-account.js](delete-test-account.js) - удаление аккаунта
- [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) - обновлен прогресс

**Функциональность:**
- Создание пользователя: demo@fluentflow.app / DemoPassword123!
- Автоматический импорт 50 немецких слов с примерами
- Инициализация language_pairs (German → English)
- Инициализация user_stats (XP, level, streak, coins, gems)
- Правильный password hash: matches server-postgresql.js:1674

**База данных (Railway PostgreSQL):**
```sql
-- Созданные записи:
- users: ID 5 (demo@fluentflow.app)
- language_pairs: ID 6 (German → English, active)
- words: 50 записей (der Apfel, das Buch, die Katze, etc.)
- user_stats: начальные значения (level 1, XP 0, streak 0)
```

**Прогресс по чеклисту:**
- Phase 2 (Store Assets): 30% → 75% ✅
- Phase 3 (Testing): 0% → 10% ✅
- Critical blocker снят: Feature graphic created ✅
- Critical blocker снят: Production deployed ✅

**Production URL:**
https://words-learning-server-copy-production.up.railway.app/

**Следующие шаги:**
1. Войти в production с demo@fluentflow.app
2. Захватить 8 скриншотов для Google Play Store (1080x2400px)
3. Phase 2 будет 100% готова после скриншотов

