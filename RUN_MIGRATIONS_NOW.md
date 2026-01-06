# 🚀 Запуск Миграций на Railway

**Статус:** Код успешно запушен на Railway (коммит `20683bb`)
**Деплой:** Railway автоматически задеплоит изменения через 1-2 минуты

---

## ✅ Что уже сделано

1. ✅ Все изменения закоммичены
2. ✅ Код запушен на Railway (`git push origin develop`)
3. ✅ Railway начал автоматический деплой

---

## 📋 Что нужно сделать СЕЙЧАС

### Шаг 1: Залогиниться в Railway CLI

```bash
railway login
```

Откроется браузер для авторизации. Авторизуйся через GitHub.

### Шаг 2: Запустить миграции (3 команды)

```bash
# 1. Создать таблицу user_word_progress
railway run npm run db:migrate:progress

# 2. Создать 170+ word sets
railway run npm run db:create-word-sets

# 3. Мигрировать User #5 и #7
railway run npm run db:migrate:users
```

### Шаг 3: Проверить результаты

```bash
# Проверить количество записей в user_word_progress
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('SELECT COUNT(*) FROM user_word_progress').then(r => {console.log('✅ Progress rows:', r.rows[0].count); db.end();});"

# Проверить количество word sets
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('SELECT COUNT(*) FROM word_sets').then(r => {console.log('✅ Word sets:', r.rows[0].count); db.end();});"

# Проверить User #5 (должно быть 399 слов)
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('SELECT COUNT(*) FROM user_word_progress WHERE user_id = 5').then(r => {console.log('✅ User #5 words:', r.rows[0].count); db.end();});"

# Проверить User #7 (должно быть 25 слов)
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const db = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); db.query('SELECT COUNT(*) FROM user_word_progress WHERE user_id = 7').then(r => {console.log('✅ User #7 words:', r.rows[0].count); db.end();});"
```

---

## 🎯 Ожидаемые результаты

После выполнения миграций должно быть:

- ✅ Таблица `user_word_progress` создана с индексами
- ✅ Таблица `word_sets` содержит **170+ наборов слов**
- ✅ User #5: **399 записей** в user_word_progress
- ✅ User #7: **25 записей** в user_word_progress

---

## 🧪 Тестирование

### 1. Проверить onboarding

Открой в браузере:
```
https://lexybooster-production.up.railway.app/onboarding.html
```

**Что проверить:**
- ✅ Страница загружается
- ✅ Автоматически определяется язык браузера
- ✅ Можно пройти все 5 шагов
- ✅ Отображаются доступные word sets
- ✅ Можно выбрать наборы слов
- ✅ Кнопка "Start Learning" работает
- ✅ Редирект на dashboard

### 2. Проверить learning flow

1. Перейди на dashboard (`/`)
2. Проверь, что отображаются правильные счетчики слов
3. Нажми "Start Learning"
4. Ответь на несколько вопросов
5. Проверь, что прогресс обновляется

### 3. Проверить API endpoints

```bash
# Получить URL приложения
railway status | grep "URL"

# Заменить [app-url] на реальный URL
APP_URL="https://lexybooster-production.up.railway.app"

# Тест word counts
curl "$APP_URL/api/words/counts?userId=5&languagePairId=1"

# Тест random words
curl "$APP_URL/api/words/random/new/10?userId=5&languagePairId=1"

# Тест word sets
curl "$APP_URL/api/word-sets?sourceLang=german"
```

---

## 🔍 Проверка деплоя

```bash
# Статус деплоя
railway status

# Логи
railway logs

# Переменные окружения
railway variables
```

---

## ⚠️ Если что-то пошло не так

### Проблема: Railway CLI не работает

**Решение 1:** Используй Railway Dashboard
1. Открой https://railway.app/dashboard
2. Выбери свой проект
3. Вкладка "Deployments"
4. Найди последний деплой (коммит `20683bb`)
5. Нажми на него
6. Вкладка "Settings" → "Commands"
7. Запускай команды вручную:
   - `npm run db:migrate:progress`
   - `npm run db:create-word-sets`
   - `npm run db:migrate:users`

**Решение 2:** Прямое подключение к БД
1. Открой Railway Dashboard
2. Зайди в проект → PostgreSQL
3. Скопируй DATABASE_URL
4. Используй в .env локально:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate:progress
   DATABASE_URL="postgresql://..." npm run db:create-word-sets
   DATABASE_URL="postgresql://..." npm run db:migrate:users
   ```

### Проблема: Миграция упала с ошибкой

**Действия:**
1. Посмотри полный текст ошибки
2. Проверь логи: `railway logs`
3. Проверь, что таблицы source_words_* существуют
4. Проверь версию PostgreSQL (должна быть 12+)

---

## 📊 Что изменилось

### До (старая архитектура):
```
words (table)
- id, user_id, word, translation, status, correct_count...
- Проблема: каждый пользователь дублирует все слова
- User #5: 399 строк
- User #7: 25 строк
- 1,000,000 users × 8,000 words = 8 BILLION строк 💥
```

### После (новая архитектура):
```
source_words_german (table) - 8,076 слов (общие для всех)
user_word_progress (table) - только прогресс пользователя
- user_id, source_word_id, status, correct_count...
- User #5: 399 строк прогресса
- User #7: 25 строк прогресса
- 1,000,000 users × 8,000 progress records = 8 MILLION строк ✅
- Экономия: 1000x
```

---

## 🎊 После успешной миграции

**Всё будет работать так:**

1. **Новый пользователь:**
   - Регистрируется → `/onboarding.html`
   - Выбирает языки (русский → немецкий)
   - Выбирает word sets ("German A1", "German A2"...)
   - Система создаёт записи в `user_word_progress` (status='new')
   - Пользователь начинает учить слова

2. **Существующий пользователь (User #5, #7):**
   - Все их слова мигрированы в `user_word_progress`
   - Весь прогресс сохранён (status, ease_factor, review_cycle)
   - Они продолжают учить с того же места
   - Никаких изменений в UI

3. **Запросы к API:**
   ```sql
   -- Получить новые слова для изучения
   SELECT sw.word, sw.translation_ru, uwp.status
   FROM source_words_german sw
   LEFT JOIN user_word_progress uwp
     ON uwp.source_word_id = sw.id
     AND uwp.user_id = 5
   WHERE uwp.status = 'new' OR uwp.status IS NULL
   LIMIT 10
   ```

---

## ✅ Чеклист выполнения

Отметь после каждого шага:

- [ ] `railway login` выполнен
- [ ] `railway run npm run db:migrate:progress` выполнен
- [ ] `railway run npm run db:create-word-sets` выполнен
- [ ] `railway run npm run db:migrate:users` выполнен
- [ ] Проверил количество записей в `user_word_progress`
- [ ] Проверил количество записей в `word_sets`
- [ ] Проверил миграцию User #5 (399 слов)
- [ ] Проверил миграцию User #7 (25 слов)
- [ ] Открыл `/onboarding.html` и протестировал
- [ ] Протестировал learning flow
- [ ] Всё работает! 🎉

---

**Готово к запуску!** 🚀

Просто скопируй команды из Шага 2 и выполни их по очереди.
