# ⚠️ Инструкция: Применение Batch 2 через Railway Dashboard

## Проблема
- Прямое подключение к БД не работает из-за сетевых ограничений
- `railway run` не может подключиться к внутреннему DATABASE_URL

## ✅ Решение: Использовать Railway Dashboard Query Editor

### Шаг 1: Открыть Railway Dashboard
1. Перейти на https://railway.app/
2. Войти в аккаунт
3. Выбрать проект **astonishing-trust**
4. Найти сервис **Postgres-Ym1L** (или Postgres)

### Шаг 2: Открыть Query Editor
1. Кликнуть на сервис Postgres
2. Перейти на вкладку **Query** (или **Data**)

### Шаг 3: Выполнить SQL

Файл `apply-batch2-themes.sql` содержит все необходимые UPDATE запросы.

**Вариант А: Скопировать весь файл**
1. Открыть файл `apply-batch2-themes.sql`
2. Скопировать ВСЁ содержимое (Ctrl+A, Ctrl+C)
3. Вставить в Query Editor
4. Нажать Execute / Run

**Вариант Б: Выполнить по частям (если есть лимит на размер)**
Файл разделён на языки. Можно выполнять по одному языку:

1. Russian (RU) - строки 6-375 в SQL файле
2. Arabic (AR) - следующий блок
3. Italian (IT) - следующий блок
4. Portuguese (PT) - следующий блок
5. Turkish (TR) - следующий блок
6. Ukrainian (UK) - следующий блок

### Шаг 4: Проверить результат
После выполнения SQL, запустить:
```bash
railway run node -e "const {Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();const r=await c.query(\"SELECT language,COUNT(*) as total,COUNT(*) FILTER(WHERE theme IS NOT NULL AND theme != 'general') as themed FROM words WHERE language IN ('ru','ar','it','pt','tr','uk') GROUP BY language ORDER BY language\");console.table(r.rows);await c.end();})();"
```

Или проще - в Query Editor выполнить:
```sql
SELECT language,
       COUNT(*) as total,
       COUNT(*) FILTER(WHERE theme IS NOT NULL AND theme != 'general') as themed
FROM words
WHERE language IN ('ru', 'ar', 'it', 'pt', 'tr', 'uk')
GROUP BY language
ORDER BY language;
```

## Ожидаемый результат
После выполнения должно быть обновлено ~1500+ слов с темами для 6 языков.

## Альтернативный способ: Через Railway CLI Shell

Если Dashboard не работает, можно попробовать:

1. В терминале выполнить:
```bash
railway shell
```

2. Внутри Railway shell выполнить:
```bash
node apply-batch2-universal.js
```

3. Выйти из shell: `exit`
