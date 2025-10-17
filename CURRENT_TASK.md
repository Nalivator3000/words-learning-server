# ТЕКУЩАЯ ЗАДАЧА: Внутриигровая валюта (Coins/Gems)

## КОНТЕКСТ
Gamification система частично работает (XP, levels, achievements, streaks). Нужна внутриигровая валюта для экономики приложения.

## ЦЕЛЬ
Создать систему двойной валюты (Coins + Gems) с заработком и тратой.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Добавить колонки в user_stats
```sql
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 0;
```

### 2. Таблица истории транзакций
```sql
CREATE TABLE IF NOT EXISTS currency_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    currency_type VARCHAR(10) NOT NULL, -- 'coins' or 'gems'
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'earned' or 'spent'
    source VARCHAR(100) NOT NULL, -- 'daily_goal', 'achievement', 'shop_purchase', etc.
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Источники заработка Coins
- Выполнение ежедневных целей: +50 coins
- Завершение daily challenge: +20/30/50 coins (по сложности)
- Разблокировка achievement: +10-100 coins (по редкости)
- Streak milestones: 7 дней = +100 coins, 30 дней = +500 coins
- Level up: level * 10 coins (level 5 = 50 coins, level 10 = 100 coins)
- Выигрыш в duel: +30 coins (участие: +10 coins)

### 4. Источники заработка Gems (premium currency)
- Weekly challenge completion: +3 gems
- Rare achievement unlock: +5 gems
- Perfect week (7-day streak): +10 gems
- Level milestones (10, 25, 50, 100): +20 gems

### 5. Трата Coins (уже частично реализовано в shop)
- Streak freeze (1 day): 50 coins
- Streak freeze (3 days): 120 coins
- Streak freeze (7 days): 250 coins
- Hint in quiz: 10 coins
- Theme unlock: 100 coins

### 6. Трата Gems
- Premium avatar: 50 gems
- Exclusive theme: 100 gems
- Double XP boost (1 day): 30 gems
- Extra challenge slot: 25 gems

### 7. API Endpoints (5)
- GET /api/users/:userId/currency - получить текущий баланс (coins + gems)
- POST /api/currency/award - начислить валюту (с проверкой источника)
- POST /api/currency/spend - потратить валюту (с валидацией баланса)
- GET /api/currency/transactions/:userId - история транзакций (пагинация)
- GET /api/shop/items - список доступных покупок

### 8. Shop Items (расширение существующей системы)
Добавить новые item_type:
- hint_pack_5 (50 coins)
- hint_pack_20 (180 coins)
- theme_dark_purple (100 coins)
- theme_ocean_blue (100 coins)
- avatar_premium_1 (50 gems)
- xp_boost_1day (30 gems)

## ПРИОРИТЕТ
HIGH (core gamification feature)

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
- Полноценная экономика с Coins/Gems
- Интеграция с существующими системами (achievements, challenges, duels, levels)
- Transaction log для аудита
- Ready for frontend integration
