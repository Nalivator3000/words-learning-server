# ТЕКУЩАЯ ЗАДАЧА: Leagues System (Лиги)

## КОНТЕКСТ
Gamification система активно развивается (XP, levels, achievements, currency, streaks). Нужна рейтинговая система с лигами для конкуренции между игроками.

## ЦЕЛЬ
Создать систему лиг с автоматическим повышением/понижением по итогам недели.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблица league_tiers (конфигурация лиг)
```sql
CREATE TABLE IF NOT EXISTS league_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    tier_level INTEGER UNIQUE NOT NULL,
    min_weekly_xp INTEGER NOT NULL,
    icon VARCHAR(10),
    color_hex VARCHAR(7),
    promotion_bonus_coins INTEGER DEFAULT 0,
    promotion_bonus_gems INTEGER DEFAULT 0
);
```

Лиги (от низшей к высшей):
1. Bronze (tier_level: 1, min_weekly_xp: 0, bonus: 50 coins)
2. Silver (tier_level: 2, min_weekly_xp: 500, bonus: 100 coins)
3. Gold (tier_level: 3, min_weekly_xp: 1000, bonus: 200 coins + 5 gems)
4. Platinum (tier_level: 4, min_weekly_xp: 2000, bonus: 400 coins + 10 gems)
5. Diamond (tier_level: 5, min_weekly_xp: 3500, bonus: 800 coins + 25 gems)
6. Master (tier_level: 6, min_weekly_xp: 5000, bonus: 1500 coins + 50 gems)
7. Grandmaster (tier_level: 7, min_weekly_xp: 7500, bonus: 3000 coins + 100 gems)

### 2. Таблица user_leagues (текущая лига пользователя)
```sql
CREATE TABLE IF NOT EXISTS user_leagues (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_tier_id INTEGER REFERENCES league_tiers(id),
    weekly_xp INTEGER DEFAULT 0,
    week_start_date DATE NOT NULL,
    promotion_count INTEGER DEFAULT 0,
    demotion_count INTEGER DEFAULT 0,
    highest_tier_reached INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Таблица league_history (история переходов)
```sql
CREATE TABLE IF NOT EXISTS league_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    from_tier_id INTEGER REFERENCES league_tiers(id),
    to_tier_id INTEGER REFERENCES league_tiers(id),
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    weekly_xp_earned INTEGER NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'promotion', 'demotion', 'same'
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Weekly XP Reset Mechanism
- Каждую неделю (по понедельникам 00:00 UTC) сбрасывается weekly_xp
- Анализ прогресса пользователя за прошедшую неделю
- Повышение/понижение/удержание лиги
- Начисление наград

### 5. API Endpoints (7)
- GET `/api/leagues/tiers` - все лиги с описанием
- GET `/api/leagues/:userId/current` - текущая лига пользователя (tier, weekly_xp, position)
- GET `/api/leagues/:userId/history` - история переходов (последние 10 недель)
- GET `/api/leagues/:tierId/leaderboard` - топ-100 в текущей лиге (по weekly_xp)
- GET `/api/leagues/:userId/progress` - прогресс до следующей лиги (XP needed, percentage)
- POST `/api/admin/leagues/process-week-end` - ручная обработка конца недели (admin only)
- POST `/api/leagues/:userId/award-weekly-xp` - начислить weekly XP (интеграция с XP system)

### 6. Promotion/Demotion Logic
**Promotion (повышение):**
- Если weekly_xp >= min_weekly_xp следующей лиги
- Только на 1 tier вверх за неделю
- Награда: coins + gems по текущей лиге

**Demotion (понижение):**
- Если weekly_xp < 50% от min_weekly_xp текущей лиги
- Только на 1 tier вниз за неделю
- Нельзя опуститься ниже Bronze

**Same tier:**
- Если weekly_xp >= min_weekly_xp текущей лиги, но < следующей
- Небольшая награда: 25 coins

### 7. Integration с XP System
Модифицировать POST `/api/xp/award`:
- После начисления XP также обновлять `user_leagues.weekly_xp`
- При достижении weekly_xp >= следующей лиги отправлять уведомление

### 8. Auto-population league_tiers
При первом запуске сервера создать 7 лиг с иконками и цветами:
- Bronze: 🥉 #CD7F32
- Silver: 🥈 #C0C0C0
- Gold: 🥇 #FFD700
- Platinum: 💎 #E5E4E2
- Diamond: 💠 #B9F2FF
- Master: ⭐ #FF6B6B
- Grandmaster: 👑 #9B59B6

## ПРИОРИТЕТ
HIGH (core gamification feature)

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
- Полноценная система лиг с автоматическими переходами
- Еженедельная конкуренция между игроками
- Награды за продвижение
- Leaderboard по текущей лиге
- Ready for frontend integration
