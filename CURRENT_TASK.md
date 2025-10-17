# ТЕКУЩАЯ ЗАДАЧА: XP & Levels System Enhancement

## КОНТЕКСТ
XP система частично работает через xp_log и user_stats. Нужно улучшить логику и добавить прогрессивную систему уровней.

## ЦЕЛЬ
Стандартизировать начисление XP, добавить прогрессивные уровни 1-100 с титулами.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблица уровней
```sql
CREATE TABLE IF NOT EXISTS level_config (
    level INTEGER PRIMARY KEY,
    xp_required INTEGER NOT NULL,
    title VARCHAR(50)
);
```

### 2. XP константы
```javascript
const XP_REWARDS = {
  WORD_LEARNED: 10,
  QUIZ_CORRECT: 5,
  REVIEW_WORD: 3,
  DUEL_WON: 50,
  DUEL_PARTICIPATED: 20,
  CHALLENGE_EASY: 20,
  CHALLENGE_MEDIUM: 30,
  CHALLENGE_HARD: 50,
  STREAK_BONUS_MULTIPLIER: 1.5
};
```

### 3. API Endpoints (3)
- GET /api/levels/config - таблица уровней
- GET /api/users/:userId/level-progress - прогресс уровня
- POST /api/xp/award - начислить XP с проверкой level up

### 4. Титулы
Level 1-4: Новичок
Level 5-9: Ученик
Level 10-19: Знаток
Level 20-29: Мастер
Level 30-49: Эксперт
Level 50-74: Гуру
Level 75-99: Легенда
Level 100+: Бессмертный

## ПРИОРИТЕТ
MEDIUM
