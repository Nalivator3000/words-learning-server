# ТЕКУЩАЯ ЗАДАЧА: Персональные инсайты (Personal Insights)

## КОНТЕКСТ
У пользователей есть богатая статистика обучения (XP logs, quiz results, activity patterns), но нет персонализированных подсказок и инсайтов. Нужна система, которая анализирует данные и предоставляет полезные наблюдения.

## ЦЕЛЬ
Реализовать backend API для генерации персональных инсайтов на основе паттернов обучения пользователя.

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Анализ данных для инсайтов

**Типы инсайтов:**
1. **Время обучения** (Best learning time)
   - "Вы лучше всего учитесь утром" (6-12)
   - "Ваш любимый час для занятий - 20:00"
   - Анализ: COUNT и AVG(xp) по часам дня

2. **Тип упражнений** (Favorite exercise type)
   - "Ваш любимый тип упражнений - Multiple Choice"
   - "Вы получаете больше всего XP из Quiz"
   - Анализ: GROUP BY action_type в xp_log

3. **Прогресс** (Progress rate)
   - "Вы выучили 20% быстрее, чем в прошлом месяце"
   - "Ваш темп обучения ускорился на 35%"
   - Анализ: Сравнение XP за текущий и прошлый период

4. **Streak паттерны** (Streak patterns)
   - "Вы наиболее продуктивны по вторникам"
   - "Выходные - ваше самое активное время"
   - Анализ: Day of week в activity_log

5. **Точность** (Accuracy trends)
   - "Ваша точность улучшилась на 15% за месяц"
   - "Вы делаете меньше ошибок в новых словах"
   - Анализ: correctcount/incorrectcount в words

### 2. Backend API Endpoint

**Endpoint:** `GET /api/users/:userId/insights`

**Query Parameters:**
- `period` (optional): 'week', 'month', 'all' (default: 'month')
- `limit` (optional): количество инсайтов (default: 5)

**Response:**
```json
{
  "insights": [
    {
      "id": "best_time",
      "type": "learning_time",
      "title": "Вы лучше всего учитесь утром",
      "description": "83% вашего XP заработано между 8:00 и 12:00",
      "icon": "☀️",
      "priority": "high",
      "data": {
        "peak_hour": 9,
        "peak_hour_xp_percentage": 35
      }
    },
    {
      "id": "favorite_exercise",
      "type": "exercise_preference",
      "title": "Ваш любимый тип упражнений - Quiz",
      "description": "Вы прошли 45 квизов за последний месяц",
      "icon": "📝",
      "priority": "medium",
      "data": {
        "favorite_type": "quiz_completed",
        "count": 45
      }
    },
    {
      "id": "progress_acceleration",
      "type": "progress",
      "title": "Вы выучили 28% быстрее, чем в прошлом месяце",
      "description": "Ваш средний темп: 15 слов/день (было 12)",
      "icon": "🚀",
      "priority": "high",
      "data": {
        "improvement_percentage": 28,
        "current_rate": 15,
        "previous_rate": 12
      }
    }
  ],
  "generated_at": "2025-10-16T12:00:00Z"
}
```

### 3. SQL Queries

**Best learning time:**
```sql
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as activities,
  SUM(xp_earned) as total_xp
FROM xp_log
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY hour
ORDER BY total_xp DESC
LIMIT 3
```

**Favorite exercise type:**
```sql
SELECT
  action_type,
  COUNT(*) as count,
  SUM(xp_earned) as total_xp
FROM xp_log
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY action_type
ORDER BY count DESC
LIMIT 1
```

**Progress rate comparison:**
```sql
-- Current month
SELECT COUNT(DISTINCT word_id) as words_learned
FROM words
WHERE user_id = $1
  AND created_at >= DATE_TRUNC('month', NOW())

-- Previous month
SELECT COUNT(DISTINCT word_id) as words_learned
FROM words
WHERE user_id = $1
  AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
  AND created_at < DATE_TRUNC('month', NOW())
```

### 4. Insight Generation Logic

```javascript
async function generateInsights(userId, period = 'month') {
  const insights = [];

  // 1. Best learning time
  const timeData = await getBestLearningTime(userId, period);
  if (timeData.peak_hour) {
    insights.push({
      id: 'best_time',
      type: 'learning_time',
      title: getTimeInsightTitle(timeData.peak_hour),
      description: `${timeData.percentage}% вашего XP заработано в это время`,
      icon: getTimeIcon(timeData.peak_hour),
      priority: 'high',
      data: timeData
    });
  }

  // 2. Favorite exercise
  const exerciseData = await getFavoriteExercise(userId, period);
  if (exerciseData.type) {
    insights.push({...});
  }

  // 3. Progress comparison
  const progressData = await getProgressComparison(userId);
  if (progressData.improvement > 0) {
    insights.push({...});
  }

  return insights;
}
```

### 5. Helper Functions

```javascript
function getTimeInsightTitle(hour) {
  if (hour >= 6 && hour < 12) return "Вы лучше всего учитесь утром";
  if (hour >= 12 && hour < 18) return "Вы продуктивны днём";
  if (hour >= 18 && hour < 22) return "Вечер - ваше лучшее время";
  return "Вы ночная сова";
}

function getTimeIcon(hour) {
  if (hour >= 6 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 18) return "🌤️";
  if (hour >= 18 && hour < 22) return "🌆";
  return "🌙";
}
```

### 6. Тестирование

```bash
# Test insights endpoint
curl http://localhost:3001/api/users/1/insights

# Test with period parameter
curl "http://localhost:3001/api/users/1/insights?period=week&limit=3"
```

## ВАЖНО
1. Обновить `PLAN.md`: заменить `[ ]` на `[>]` для задачи "Персональные инсайты"
2. Вернуть минимум 3 инсайта, максимум 10
3. Только инсайты с достаточными данными (минимум 5 записей)
4. Кешировать результаты на 1 час (Redis или in-memory)

## ГОТОВО КОГДА
- [ ] Endpoint `/api/users/:userId/insights` реализован
- [ ] Минимум 3 типа инсайтов работают (time, exercise, progress)
- [ ] SQL queries оптимизированы (WITH indexes)
- [ ] Протестировано на реальных данных пользователя
- [ ] PLAN.md обновлен
- [ ] Код закоммичен

## БОНУС (OPTIONAL)
- Streak patterns (день недели анализ)
- Accuracy trends (improvement over time)
- Weekly summary (дайджест за неделю)
