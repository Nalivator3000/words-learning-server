# Railway Troubleshooting Guide - "Application failed to respond"

## Проблема
При открытии lexybooster.com появляется ошибка:
```
Application failed to respond
This error appears to be caused by the application.
```

## Причина
Приложение не запускается или падает при старте из-за неправильной конфигурации в Railway.

---

## Решение: Настройка Environment Variables в Railway

### Шаг 1: Откройте настройки проекта в Railway

1. Зайдите на https://railway.app
2. Откройте ваш проект
3. Нажмите на ваш сервис (приложение)
4. Перейдите в раздел **"Variables"**

### Шаг 2: Добавьте PostgreSQL базу данных

Если у вас еще НЕТ PostgreSQL в проекте:

1. В Railway проекте нажмите **"+ New"**
2. Выберите **"Database" → "Add PostgreSQL"**
3. Railway автоматически создаст базу данных
4. Railway автоматически добавит переменную `DATABASE_URL` в ваш сервис

### Шаг 3: Настройте необходимые переменные

В разделе **"Variables"** вашего сервиса должны быть следующие переменные:

#### Обязательные переменные:

```bash
# Database (автоматически добавляется при подключении PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Node Environment
NODE_ENV=production

# Frontend URL (для CORS)
FRONTEND_URL=https://lexybooster.com

# Allowed Origins (для CORS)
ALLOWED_ORIGINS=https://lexybooster.com,https://www.lexybooster.com
```

#### Опциональные переменные:

```bash
# Логирование в production
ENABLE_LOGS=true

# Debug mode (только для отладки)
DEBUG=false
```

### Шаг 4: Проверьте настройки деплоя

1. В разделе **"Settings"** проверьте:
   - **Start Command:** `npm start` (должна быть автоматически определена)
   - **Build Command:** (оставьте пустым, если не используете)

2. В разделе **"Networking"**:
   - Убедитесь, что домен `lexybooster.com` добавлен
   - Проверьте, что указан правильный порт (обычно Railway автоматически определяет)

### Шаг 5: Проверьте Deploy Logs

1. Перейдите в раздел **"Deployments"**
2. Откройте последний деплой
3. Посмотрите логи (**"View Logs"**)

Ищите сообщения об ошибках:
- `Error: connect ECONNREFUSED` - проблема с БД
- `Error: getaddrinfo ENOTFOUND` - неправильная строка подключения к БД
- `Error: password authentication failed` - неправильный пароль к БД
- `Cannot find module` - не установлены зависимости

---

## Проверка конфигурации

### Правильная конфигурация выглядит так:

```
Railway Project
├── Service: lexibooster-server
│   ├── Variables:
│   │   ├── DATABASE_URL (reference to Postgres)
│   │   ├── NODE_ENV=production
│   │   ├── FRONTEND_URL=https://lexybooster.com
│   │   └── ALLOWED_ORIGINS=https://lexybooster.com,...
│   └── Domains:
│       └── lexybooster.com
└── Database: PostgreSQL
    └── DATABASE_URL (auto-generated)
```

### Проверка через Railway CLI (опционально)

Если у вас установлен Railway CLI:

```bash
# Login
railway login

# Link to project
railway link

# Check variables
railway variables

# Check logs
railway logs

# Check status
railway status
```

---

## Типичные ошибки

### Ошибка 1: База данных не подключена
**Симптом:** `Error: connect ECONNREFUSED`

**Решение:**
1. Добавьте PostgreSQL в проект (**"+ New" → "Database" → "PostgreSQL"**)
2. Railway автоматически добавит `DATABASE_URL` в переменные

### Ошибка 2: Неправильная DATABASE_URL
**Симптом:** `Error: getaddrinfo ENOTFOUND`

**Решение:**
1. Удалите переменную `DATABASE_URL` (если вы вручную её добавили)
2. Используйте reference: `${{Postgres.DATABASE_URL}}`

### Ошибка 3: Приложение не слушает правильный порт
**Симптом:** `Application failed to respond`

**Решение:**
Код уже правильно настроен (`const PORT = process.env.PORT || 3001`)
Railway автоматически установит `PORT` в переменные окружения.

### Ошибка 4: CORS блокирует запросы
**Симптом:** Приложение запускается, но не работает

**Решение:**
Убедитесь, что переменная `ALLOWED_ORIGINS` включает ваш домен:
```
ALLOWED_ORIGINS=https://lexybooster.com,https://www.lexybooster.com
```

---

## После настройки переменных

1. Railway автоматически перезапустит деплой
2. Подождите 1-2 минуты
3. Проверьте логи деплоя (**"Deployments" → последний деплой → "View Logs"**)
4. Должно появиться сообщение: `Server running on port XXXX`
5. Откройте https://lexybooster.com

---

## Дополнительная диагностика

### Проверьте прямой URL Railway

1. В настройках домена найдите Railway URL: `https://your-app.up.railway.app`
2. Откройте этот URL в браузере
3. Если работает - проблема в DNS/Cloudflare настройках
4. Если не работает - проблема в конфигурации Railway

### Проверьте Cloudflare DNS

1. Зайдите в Cloudflare
2. Перейдите в **"DNS" → "Records"**
3. Должна быть запись:
   ```
   Type: CNAME
   Name: @
   Target: q7qq2j3z.up.railway.app
   Proxy status: Proxied (оранжевое облако)
   ```

### Проверьте SSL/TLS в Cloudflare

1. Перейдите в **"SSL/TLS"**
2. Установите режим: **"Full"** (не "Full (strict)")
3. Подождите 5 минут для применения изменений

---

## Контрольный список

- [ ] PostgreSQL база данных создана в Railway
- [ ] Переменная `DATABASE_URL` настроена (reference к Postgres)
- [ ] Переменная `NODE_ENV=production` установлена
- [ ] Переменная `FRONTEND_URL=https://lexybooster.com` установлена
- [ ] Переменная `ALLOWED_ORIGINS` содержит ваш домен
- [ ] Домен `lexybooster.com` добавлен в Railway
- [ ] Cloudflare CNAME запись настроена
- [ ] Cloudflare SSL/TLS в режиме "Full"
- [ ] Deploy логи не показывают ошибок
- [ ] Railway URL работает напрямую

---

## Если проблема не решена

Сделайте скриншоты:
1. Railway Variables (раздел "Variables")
2. Railway Deploy Logs (последние 50 строк)
3. Railway Domains (раздел "Settings" → "Domains")
4. Cloudflare DNS Records
5. Ошибку в браузере (F12 → Console)

И приложите их для дальнейшей диагностики.
