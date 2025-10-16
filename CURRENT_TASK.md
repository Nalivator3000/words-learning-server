# ТЕКУЩАЯ ЗАДАЧА: Защита стрика (Streak Freeze)

## КОНТЕКСТ
Пользователи теряют стрики если пропускают день занятий. Нужна система "заморозки стрика", которая позволяет сохранить стрик на 1 день.

## ЦЕЛЬ
Реализовать backend API для покупки и использования Streak Freeze (защита стрика).

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблица БД (если не существует)

Проверить есть ли таблица `streak_freeze_inventory`:
```sql
CREATE TABLE IF NOT EXISTS streak_freeze_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    last_free_earned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS streak_freeze_usage_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(50) DEFAULT 'manual'
);
```

### 2. API Endpoints

**a) GET /api/users/:userId/streak-freeze**
Получить текущее количество заморозок у пользователя.

Response:
```json
{
  "user_id": 1,
  "quantity": 3,
  "last_free_earned_at": "2025-10-10T12:00:00Z",
  "next_free_available": true,
  "next_free_in_days": 0
}
```

**b) POST /api/users/:userId/streak-freeze/purchase**
Купить заморозку за монеты (из shop_items).

Request:
```json
{
  "quantity": 1
}
```

Response:
```json
{
  "success": true,
  "new_quantity": 4,
  "coins_spent": 50,
  "remaining_coins": 200
}
```

**c) POST /api/users/:userId/streak-freeze/use**
Использовать заморозку (вручную или автоматически).

Request:
```json
{
  "reason": "manual" // или "auto"
}
```

Response:
```json
{
  "success": true,
  "remaining_quantity": 2,
  "message": "Streak freeze activated! Your streak is protected for today."
}
```

**d) POST /api/users/:userId/streak-freeze/claim-free**
Получить бесплатную заморозку (1 раз в неделю).

Response:
```json
{
  "success": true,
  "new_quantity": 4,
  "message": "Free streak freeze claimed!",
  "next_available_at": "2025-10-23T12:00:00Z"
}
```

**e) GET /api/users/:userId/streak-freeze/history**
История использования заморозок.

Response:
```json
{
  "history": [
    {
      "id": 1,
      "used_at": "2025-10-15T08:00:00Z",
      "reason": "auto"
    },
    {
      "id": 2,
      "used_at": "2025-10-10T20:00:00Z",
      "reason": "manual"
    }
  ],
  "total_used": 2
}
```

### 3. Бизнес-логика

**Правила:**
1. **Бесплатная заморозка**: 1 раз в неделю (7 дней с last_free_earned_at)
2. **Покупка**: Цена из shop_items (по умолчанию 50 монет)
3. **Использование**:
   - Manual: пользователь нажимает кнопку "Использовать заморозку"
   - Auto: система автоматически использует при потере стрика (если есть в inventory)
4. **Лимит**: Максимум 10 заморозок в инвентаре

**Автоматическое использование:**
При проверке стрика (каждый день в 00:00 или при логине):
```javascript
// Псевдокод
if (userMissedYesterday && user.streak > 0) {
  const freezeAvailable = await getStreakFreezeQuantity(userId);
  if (freezeAvailable > 0) {
    await useStreakFreeze(userId, 'auto');
    // Стрик НЕ сбрасывается
    console.log('Streak saved with freeze!');
  } else {
    user.streak = 0; // Сброс стрика
  }
}
```

### 4. Интеграция с существующими системами

**Связь с coins:**
- Проверить таблицу `user_coins` и `coin_transactions`
- При покупке: списать монеты, создать transaction

**Связь со streak:**
- Проверить как сейчас обновляется current_streak в users
- Добавить проверку наличия freeze перед сбросом

**Связь с shop:**
- Streak Freeze должен быть в таблице `shop_items`
- Использовать существующую покупку через shop API

### 5. Тестирование

```bash
# 1. Получить текущее количество
curl http://localhost:3001/api/users/1/streak-freeze

# 2. Получить бесплатную заморозку
curl -X POST http://localhost:3001/api/users/1/streak-freeze/claim-free

# 3. Купить заморозку (если есть монеты)
curl -X POST http://localhost:3001/api/users/1/streak-freeze/purchase \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}'

# 4. Использовать заморозку
curl -X POST http://localhost:3001/api/users/1/streak-freeze/use \
  -H "Content-Type: application/json" \
  -d '{"reason": "manual"}'

# 5. История
curl http://localhost:3001/api/users/1/streak-freeze/history
```

## ВАЖНО
1. Обновить `PLAN.md`: заменить `[ ]` на `[>]` для задачи "Защита стрика"
2. Проверить существуют ли уже таблицы в server-postgresql.js
3. Интегрировать с существующей системой монет
4. Добавить validation (max 10 freezes, достаточно монет, и т.д.)

## ГОТОВО КОГДА
- [ ] Таблицы БД созданы (если не существуют)
- [ ] 5 API endpoints реализованы
- [ ] Бизнес-логика (бесплатная раз в неделю, покупка, использование)
- [ ] Интеграция с coins system
- [ ] Все endpoints протестированы
- [ ] PLAN.md обновлен
- [ ] Код закоммичен

## БОНУС (OPTIONAL)
- Push notification когда стрик под угрозой
- UI индикатор количества freeze в профиле
- Achievement "Ice Guardian" за использование 10 freezes
