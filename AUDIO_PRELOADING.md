# Audio Preloading System

Автоматическая предзагрузка аудио для самых популярных слов, чтобы использовать бесплатные лимиты Google TTS API до их истечения.

## Концепция

Google TTS API даёт **бесплатный лимит** каждый месяц:
- Standard voices: 4 млн символов/месяц
- WaveNet/Neural2 voices: 1 млн символов/месяц

**Идея**: В конце месяца автоматически генерировать аудио для самых популярных слов, пока есть неиспользованный лимит.

## Как это работает

1. **Анализ популярности**: Находим слова, которые чаще всего используются в квизах за последние 30 дней
2. **Проверка кэша**: Исключаем слова, для которых уже есть кэш (локальный или Google Drive)
3. **Генерация**: Генерируем аудио для оставшихся популярных слов
4. **Сохранение**: Сохраняем в локальный кэш + загружаем на Google Drive

## Использование

### 1. Оценка стоимости

Посмотреть, сколько слов можно закэшировать и сколько это будет стоить:

```bash
# Через CLI
node scripts/preload-popular-audio.js --estimate

# Через API
curl https://your-app.up.railway.app/api/tts/preload/estimate?maxWords=500
```

Пример ответа:
```json
{
  "words": 347,
  "estimatedChars": 5205,
  "estimatedCostUSD": "0.0208",
  "message": "347 words × ~15 chars = 5205 chars ≈ $0.0208"
}
```

### 2. Тестовый запуск (dry run)

Посмотреть, какие слова будут закэшированы, без реальной генерации:

```bash
node scripts/preload-popular-audio.js --dry-run --max-words 100
```

Покажет топ-10 слов:
```
📋 Words that would be cached:
   1. "der Hund" (de) - used 456 times
   2. "die Katze" (de) - used 423 times
   3. "das Haus" (de) - used 412 times
   ...
```

### 3. Реальная генерация

```bash
# Локально (если настроен .env)
node scripts/preload-popular-audio.js --max-words 100

# Через API (на production)
curl -X POST https://your-app.up.railway.app/api/tts/preload \
  -H "Content-Type: application/json" \
  -d '{"maxWords": 100, "dryRun": false}'
```

### 4. Автоматизация (Railway Cron)

Railway поддерживает cron jobs. Добавьте в `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server-postgresql.js",
    "restartPolicyType": "ON_FAILURE"
  },
  "cron": [
    {
      "name": "preload-popular-audio",
      "schedule": "0 0 28 * *",
      "command": "node scripts/preload-popular-audio.js --max-words 500"
    }
  ]
}
```

**Расписание**: `0 0 28 * *` = каждый 28-й день месяца в 00:00 (перед концом месяца)

### 5. Альтернатива: GitHub Actions

Если Railway не поддерживает cron, используйте GitHub Actions:

`.github/workflows/preload-audio.yml`:
```yaml
name: Preload Popular Audio

on:
  schedule:
    - cron: '0 0 28 * *'  # 28-го числа каждого месяца
  workflow_dispatch:  # Ручной запуск

jobs:
  preload:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger preload
        run: |
          curl -X POST ${{ secrets.RAILWAY_API_URL }}/api/tts/preload \
            -H "Content-Type: application/json" \
            -d '{"maxWords": 500}'
```

## API Endpoints

### POST /api/tts/preload

Запустить прелоадинг (фоновая задача).

**Request:**
```json
{
  "maxWords": 100,
  "dryRun": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preload job started in background",
  "maxWords": 100,
  "dryRun": false
}
```

**Примечание**: Задача выполняется асинхронно. Проверяйте логи Railway для результатов.

### GET /api/tts/preload/estimate

Получить оценку стоимости.

**Query params:**
- `maxWords` - макс. количество слов (по умолчанию: 500)

**Response:**
```json
{
  "words": 347,
  "estimatedChars": 5205,
  "estimatedCostUSD": "0.0208",
  "message": "347 words × ~15 chars = 5205 chars ≈ $0.0208"
}
```

## SQL запрос для анализа

Если хотите вручную посмотреть популярные слова:

```sql
WITH word_usage AS (
    SELECT
        word_id,
        COUNT(*) as usage_count
    FROM quiz_history
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY word_id
)
SELECT
    w.word,
    lp.from_lang as language,
    wu.usage_count
FROM word_usage wu
JOIN user_word_progress uwp ON wu.word_id = uwp.id
JOIN words w ON uwp.word_id = w.id
JOIN language_pairs lp ON w.language_pair_id = lp.id
ORDER BY wu.usage_count DESC
LIMIT 100;
```

## Мониторинг расходов

### Бесплатные лимиты Google TTS

- **Standard voices**: 4,000,000 символов/месяц бесплатно
- **WaveNet/Neural2 voices**: 1,000,000 символов/месяц бесплатно

Мы используем Neural2/Wavenet, поэтому лимит: **1 млн символов**.

### Примерный расчёт

- Среднее слово: ~15 символов
- 1,000,000 символов ÷ 15 = **~66,666 слов бесплатно**
- После лимита: **$16/млн символов** (Neural2/Wavenet)

### Проверка использования

Google Cloud Console → Text-to-Speech API → Quotas & System Limits

## Логи

Прелоадер пишет подробные логи:

```
🚀 Starting audio preload job...
   Max words: 100
   Dry run: false

📊 Found 87 popular uncached words

[1/87] Processing "der Hund" (de)
✅ Generated: "der Hund" (de-DE)

[2/87] Processing "die Katze" (de)
✅ Generated: "die Katze" (de-DE)

...

✅ Preload complete!
   Generated: 85
   Failed: 2
   Total: 87
```

## Рекомендации

1. **Запускайте в конце месяца** (28-30 число), чтобы использовать неиспользованный лимит
2. **Начните с малого**: `--max-words 100` для теста
3. **Проверяйте estimate** перед реальным запуском
4. **Мониторьте квоту** в Google Cloud Console
5. **Google Drive** сохранит весь кэш навсегда, даже если Railway удалит локальный кэш

## Безопасность

- Endpoint `/api/tts/preload` **публичный** - рассмотрите добавление авторизации
- Или используйте только CLI скрипт через Railway terminal
- GitHub Actions может использовать секретный токен

## Troubleshooting

### "No popular uncached words found"

Отлично! Все популярные слова уже закэшированы.

### "TTS not configured"

Проверьте `GOOGLE_APPLICATION_CREDENTIALS_JSON` в Railway Variables.

### Квота исчерпана

Google TTS вернёт ошибку:
```
Error: 8 RESOURCE_EXHAUSTED: Quota exceeded
```

Подождите до следующего месяца или включите биллинг.

### Медленная работа

Прелоадер делает 1 запрос в секунду для избежания rate limits. 100 слов = ~100 секунд.
