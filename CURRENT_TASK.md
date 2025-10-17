# ТЕКУЩАЯ ЗАДАЧА: 1-на-1 Дуэли (Duels System)

## КОНТЕКСТ
Система соревнований между друзьями в реальном времени.

## ЦЕЛЬ
Реализовать backend для 1-на-1 дуэлей с WebSocket поддержкой для real-time батлов.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблицы БД

```sql
-- Дуэли
CREATE TABLE IF NOT EXISTS duels (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER NOT NULL REFERENCES users(id),
    opponent_id INTEGER NOT NULL REFERENCES users(id),
    language_pair_id INTEGER REFERENCES language_pairs(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'declined')),
    winner_id INTEGER REFERENCES users(id),
    questions_count INTEGER DEFAULT 10,
    time_limit_seconds INTEGER DEFAULT 120,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Ответы участников
CREATE TABLE IF NOT EXISTS duel_answers (
    id SERIAL PRIMARY KEY,
    duel_id INTEGER REFERENCES duels(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    word_id INTEGER REFERENCES words(id),
    answer TEXT,
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT NOW(),
    time_taken_ms INTEGER
);

-- Результаты
CREATE TABLE IF NOT EXISTS duel_results (
    id SERIAL PRIMARY KEY,
    duel_id INTEGER UNIQUE REFERENCES duels(id) ON DELETE CASCADE,
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    challenger_avg_time_ms INTEGER,
    opponent_avg_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_opponent ON duels(opponent_id);
CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duel_answers_duel ON duel_answers(duel_id);
```

### 2. API Endpoints

#### 2.1 Создать вызов
**POST /api/duels/challenge**
```json
{
  "challengerId": 1,
  "opponentId": 2,
  "languagePairId": 1,
  "questionsCount": 10,
  "timeLimitSeconds": 120
}
```

#### 2.2 Принять/отклонить вызов
**POST /api/duels/:duelId/respond**
```json
{
  "userId": 2,
  "action": "accept|decline"
}
```

#### 2.3 Начать дуэль
**POST /api/duels/:duelId/start**
Возвращает список слов для квиза

#### 2.4 Отправить ответ
**POST /api/duels/:duelId/answer**
```json
{
  "userId": 1,
  "wordId": 15,
  "answer": "Hund",
  "timeTakenMs": 1250
}
```

#### 2.5 Завершить дуэль
**POST /api/duels/:duelId/complete**
Автоматически вызывается когда оба ответили на все вопросы

#### 2.6 Получить статус дуэли
**GET /api/duels/:duelId**

#### 2.7 История дуэлей
**GET /api/duels/history/:userId?limit=20**

#### 2.8 Активные дуэли
**GET /api/duels/active/:userId**

#### 2.9 Статистика дуэлей
**GET /api/duels/stats/:userId**
```json
{
  "total_duels": 50,
  "wins": 32,
  "losses": 15,
  "draws": 3,
  "win_rate": 0.64,
  "avg_score": 8.5,
  "best_streak": 7
}
```

### 3. WebSocket Events (для real-time)

```javascript
// Server Events
socket.on('duel:join', (duelId, userId))
socket.on('duel:answer', (duelId, userId, answer))
socket.on('duel:leave', (duelId, userId))

// Client Events (broadcast)
socket.emit('duel:opponent_joined', { opponentId, opponentName })
socket.emit('duel:opponent_answered', { questionIndex, isCorrect })
socket.emit('duel:opponent_left', { opponentId })
socket.emit('duel:completed', { winnerId, results })
```

### 4. Бизнес-логика

```javascript
// Выбор слов для дуэли
async function selectDuelWords(languagePairId, count = 10) {
  // Выбрать слова со статусом 'learned' или 'reviewing'
  // Разнообразие сложности (30% easy, 50% medium, 20% hard)
  // Исключить слова, повторяющиеся за последние 24 часа
  const words = await db.query(`
    SELECT * FROM words
    WHERE language_pair_id = $1
      AND status IN ('learned', 'reviewing')
    ORDER BY RANDOM()
    LIMIT $2
  `, [languagePairId, count]);
  return words.rows;
}

// Проверка ответа
function checkAnswer(userAnswer, correctTranslation) {
  const normalize = (str) => str.toLowerCase().trim();
  return normalize(userAnswer) === normalize(correctTranslation);
}

// Подсчет результатов
async function calculateDuelResults(duelId) {
  const answers = await db.query(`
    SELECT user_id, is_correct, time_taken_ms
    FROM duel_answers
    WHERE duel_id = $1
  `, [duelId]);

  const challenger_answers = answers.rows.filter(a => a.user_id === challengerId);
  const opponent_answers = answers.rows.filter(a => a.user_id === opponentId);

  const challenger_score = challenger_answers.filter(a => a.is_correct).length;
  const opponent_score = opponent_answers.filter(a => a.is_correct).length;

  let winner_id = null;
  if (challenger_score > opponent_score) winner_id = challengerId;
  else if (opponent_score > challenger_score) winner_id = opponentId;
  // else draw

  return { challenger_score, opponent_score, winner_id };
}
```

### 5. Rewards System

```javascript
// После завершения дуэли
async function awardDuelRewards(duelId, winnerId) {
  const rewardXP = 50; // Победитель
  const participationXP = 20; // Участник

  if (winnerId) {
    await db.query(`
      INSERT INTO xp_log (user_id, activity_type, xp_amount)
      VALUES ($1, 'duel_won', $2)
    `, [winnerId, rewardXP]);
  }

  // Participation XP для обоих
  // Achievement unlocks
  // Update stats
}
```

### 6. Security & Validation

- Проверка: оба пользователя друзья
- Проверка: opponent не в duel с кем-то еще
- Rate limiting: не более 10 вызовов в день
- Validation: answers только от участников дуэли
- Timeout handling: auto-cancel после 5 минут без ответа

### 7. Расширения (будущее)

- [ ] Ранжированные дуэли (ranked mode)
- [ ] Турниры (bracket system)
- [ ] Spectator mode (друзья смотрят)
- [ ] Replay system
- [ ] Powerups (подсказки, заморозка времени)

## ПРИОРИТЕТ
MEDIUM - нужна интеграция WebSocket
