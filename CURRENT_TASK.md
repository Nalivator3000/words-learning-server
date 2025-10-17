# ТЕКУЩАЯ ЗАДАЧА: Group Tournaments (Групповые турниры)

## КОНТЕКСТ
Социальные и соревновательные фичи развиваются (friends, duels 1v1, leagues). Нужна система групповых турниров для массового вовлечения.

## ЦЕЛЬ
Создать систему еженедельных турниров с bracket-структурой и призами для топ-3.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Таблица tournaments (конфигурация турниров)
```sql
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'special'
    bracket_type VARCHAR(50) NOT NULL, -- 'single_elimination', 'double_elimination', 'round_robin'
    language_pair_id INTEGER REFERENCES language_pairs(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    registration_deadline TIMESTAMP NOT NULL,
    max_participants INTEGER DEFAULT 64,
    status VARCHAR(50) DEFAULT 'registration', -- 'registration', 'in_progress', 'completed', 'cancelled'
    prize_1st_coins INTEGER DEFAULT 0,
    prize_1st_gems INTEGER DEFAULT 0,
    prize_2nd_coins INTEGER DEFAULT 0,
    prize_2nd_gems INTEGER DEFAULT 0,
    prize_3rd_coins INTEGER DEFAULT 0,
    prize_3rd_gems INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Таблица tournament_participants (участники)
```sql
CREATE TABLE IF NOT EXISTS tournament_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seed INTEGER, -- позиция в bracket (определяется рейтингом)
    current_round INTEGER DEFAULT 1,
    is_eliminated BOOLEAN DEFAULT false,
    final_position INTEGER,
    total_score INTEGER DEFAULT 0,
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);
```

### 3. Таблица tournament_matches (матчи bracket)
```sql
CREATE TABLE IF NOT EXISTS tournament_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    player1_id INTEGER REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'walkover'
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(tournament_id, round_number, match_number)
);
```

### 4. API Endpoints (8)
- GET `/api/tournaments` - список всех турниров (upcoming, active, past)
- GET `/api/tournaments/:tournamentId` - детали турнира
- POST `/api/tournaments/:tournamentId/register` - регистрация на турнир
- DELETE `/api/tournaments/:tournamentId/unregister` - отмена регистрации
- GET `/api/tournaments/:tournamentId/bracket` - текущая bracket-структура
- GET `/api/tournaments/:tournamentId/participants` - список участников
- POST `/api/admin/tournaments/create` - создать турнир (admin only)
- POST `/api/admin/tournaments/:tournamentId/generate-bracket` - сгенерировать bracket (admin only)

### 5. Bracket Generation Logic
**Single Elimination (8/16/32/64 участников):**
- Round 1: N/2 matches (например, 32 → 16 матчей)
- Round 2: N/4 matches (например, 16 → 8 матчей)
- Round 3 (Quarter-finals): N/8 matches
- Round 4 (Semi-finals): N/16 matches
- Round 5 (Finals): 1 match

**Seeding:**
- Участники сортируются по user_stats.total_xp
- Seed 1 vs Seed N, Seed 2 vs Seed N-1, etc.

**Bye mechanism:**
- Если участников не степень 2 (например, 13), добавить "bye"
- Высшие seeds автоматически проходят в следующий раунд

### 6. Prize Distribution
**1st место:**
- Weekly: 500 coins + 50 gems
- Monthly: 2000 coins + 200 gems

**2nd место:**
- Weekly: 300 coins + 30 gems
- Monthly: 1200 coins + 120 gems

**3rd место:**
- Weekly: 150 coins + 15 gems
- Monthly: 600 coins + 60 gems

### 7. Auto-Creation Weekly Tournaments
При запуске сервера создать турнир на текущую неделю (если не существует):
- Title: "Weekly Tournament - Week {N}"
- Start: Monday 00:00 UTC
- End: Sunday 23:59 UTC
- Registration deadline: Friday 23:59 UTC
- Max participants: 64
- Bracket: single_elimination

### 8. Match Format (для будущей интеграции)
Матч = duel с 5 вопросами:
- Используется существующая система duels
- Winner = больше правильных ответов
- При равенстве = меньшее avg time wins

## ПРИОРИТЕТ
MEDIUM (social gamification feature)

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
- Полноценная система турниров с bracket
- Автогенерация еженедельных турниров
- Призы для топ-3
- Ready for frontend integration
- Интеграция с duels system (в будущем)
