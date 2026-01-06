# Project Context - Words Learning Server

**Последнее обновление:** 2026-01-02

## ⚠️ КРИТИЧЕСКИ ВАЖНО

### Окружение
- **ВСЕ тестирование и запуск ТОЛЬКО на Railway**
- **НЕТ локальной базы данных** - используем только Railway PostgreSQL
- База данных доступна только через Railway (прямое подключение с локальной машины не работает)

### Database Connection

**ВАЖНО:** Структура базы данных отличается от ожидаемой!
- НЕТ универсальной таблицы `words` с колонкой `language`
- Вместо этого есть отдельные таблицы для каждого языка: `source_words_russian`, `source_words_arabic`, и т.д.
- Колонки в source_words_*: `id`, `word`, `level`, `created_at`, `theme`

**Подключение:**
```bash
# PUBLIC DATABASE_URL (для внешнего подключения):
postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway

# Получить его можно через:
railway link -p astonishing-trust -s Postgres-Ym1L
railway variables | grep DATABASE_PUBLIC_URL

# Скрипты с прямым подключением работают (см. apply-batch2-correct.js)
```

### Railway Credentials
- Database: PostgreSQL на Railway
- Connection: `postgresql://postgres:hJnNfZyWMLLILSPMXPLxskZxVhDZsBev@junction.proxy.rlwy.net:26930/railway`
- Primary Domain: https://lexybooster.com/
- Railway URL: https://words-learning-server-production.up.railway.app

## Структура данных

### Языки в проекте
1. **Spanish (es)** - полностью завершен, все темы применены
2. **Russian (ru)** - batch 1 и 2 готовы, нужно применить batch 2
3. **Arabic (ar)** - batch 1 и 2 готовы, нужно применить batch 2
4. **Italian (it)** - batch 1 и 2 готовы, нужно применить batch 2
5. **Portuguese (pt)** - batch 1 и 2 готовы, нужно применить batch 2
6. **Turkish (tr)** - batch 1 и 2 готовы, нужно применить batch 2
7. **Ukrainian (uk)** - batch 1 и 2 готовы, нужно применить batch 2
8. **German (de)** - в процессе
9. **French (fr)** - в процессе
10. **Swahili (sw)** - в процессе

### Таблица words
Колонки:
- `id` - primary key
- `language` - код языка (es, ru, ar, etc.)
- `word` - слово на изучаемом языке
- `translation` - перевод на английский
- `theme` - тематическая категория (может быть NULL или 'general')

### Доступные темы (themes)
- food
- family
- health
- clothing
- home
- travel
- work
- shopping
- education
- sports
- culture
- colors
- numbers
- time
- communication
- general
- emotions

## Текущий статус работ

### Batch 1 (501-1000 слов)
✅ Применены темы для всех языков

### Batch 2 (1001-1500+ слов)
✅ Применено успешно! (2026-01-02)
- Russian: 369 слов обновлено
- Arabic: 284 слова обновлено
- Italian: 424 слова обновлено
- Portuguese: 367 слов обновлено
- Turkish: 385 слов обновлено (115 уже имели темы)
- Ukrainian: 167 слов обновлено
- **ИТОГО: 1996 слов обновлено**

### Текущая статистика тем по языкам:
- **RUSSIAN**: 5926/10000 (59.3%) с темами, 4074 без тем
- **ARABIC**: 8016/10000 (80.2%) с темами, 1984 без тем
- **ITALIAN**: 4183/10000 (41.8%) с темами, 5817 без тем
- **PORTUGUESE**: 6407/10000 (64.1%) с темами, 3593 без тем
- **TURKISH**: 6118/10113 (60.5%) с темами, 3995 без тем
- **UKRAINIAN**: 8930/10000 (89.3%) с темами, 1070 без тем
- **SPANISH**: 1633/9972 (16.4%) с темами, 8339 без тем

⏳ **СЛЕДУЮЩИЙ ШАГ:** Создать Batch 3 для оставшихся слов

## Скрипты

### Проверка статуса
```bash
railway run node check-all-languages-status.js
```

### Применение тем
```bash
# Через Railway CLI (рекомендуется):
railway run node apply-themes-batch2-safe.js

# Или через SQL файл в Railway Dashboard:
# Открыть Query tab → вставить содержимое apply-batch2-themes.sql
```

### Генерация тем через LLM
См. файлы `*-words-batch2.txt` для входных данных

## Известные проблемы

1. **Прямое подключение к БД не работает** - ECONNRESET/ECONNREFUSED
   - Решение: использовать `railway run` или Railway Dashboard

2. **Railway CLI требует логина** - `railway login` не работает в неинтерактивном режиме
   - Решение: пользователь должен залогиниться вручную

3. **Некоторые слова могут отсутствовать в БД** - это нормально
   - SQL использует условие `WHERE theme IS NULL OR theme = 'general'`
   - Не перезаписывает уже установленные темы

## Следующие шаги

1. ✅ Сгенерированы все файлы batch 2
2. ⏳ **ТЕКУЩАЯ ЗАДАЧА:** Применить `apply-batch2-themes.sql` к БД
3. ⏳ Проверить результаты через `check-all-languages-status.js`
4. ⏳ Создать batch 3 для оставшихся слов (если есть)
5. ⏳ Завершить German, French, Swahili

## Тестовые пользователи

См. `scripts/create-onboarding-test-user.js` для создания тестовых пользователей на Railway.
