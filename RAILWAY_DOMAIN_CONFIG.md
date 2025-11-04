# 🚀 Railway Domain Configuration - lexybooster.com

## Текущая конфигурация

**Домен:** lexybooster.com (корневой)
**Railway CNAME:** q7qq2j3z.up.railway.app
**Port:** 8080
**Регистратор:** Namecheap

---

## ✅ Рекомендуемая настройка: Cloudflare

### Почему Cloudflare?

- ✅ **CNAME для корневого домена работает нативно** (без костылей)
- ✅ Бесплатный SSL сертификат (автоматически)
- ✅ CDN - быстрая загрузка по всему миру
- ✅ DDoS защита
- ✅ Кеширование статики (CSS, JS, images)
- ✅ Always Online - показывает кеш если Railway упадёт
- ✅ Web Application Firewall (WAF)

### Пошаговая инструкция (10 минут)

#### Шаг 1: Регистрация на Cloudflare

1. Откройте https://dash.cloudflare.com/sign-up
2. Зарегистрируйтесь (email + пароль)
3. Подтвердите email

#### Шаг 2: Добавьте домен

1. В Cloudflare Dashboard нажмите **+ Add a Site**
2. Введите: `lexybooster.com`
3. Нажмите **Add site**
4. Выберите план: **Free** (0$/month)
5. Нажмите **Continue**

Cloudflare автоматически просканирует ваши текущие DNS записи.

#### Шаг 3: Обновите nameservers в Namecheap

Cloudflare покажет вам 2 nameserver'а, например:

```
adrian.ns.cloudflare.com
judy.ns.cloudflare.com
```

**В Namecheap:**

1. Войдите на https://www.namecheap.com/myaccount/login/
2. **Domain List** → найдите `lexybooster.com` → **Manage**
3. Найдите секцию **NAMESERVERS**
4. Выберите **Custom DNS**
5. Введите nameservers от Cloudflare:
   ```
   Nameserver 1: adrian.ns.cloudflare.com
   Nameserver 2: judy.ns.cloudflare.com
   ```
6. Нажмите зелёную галочку **✓**

⏳ **Подождите 5-60 минут** пока изменения применятся.

Cloudflare пришлёт email когда домен будет активирован.

#### Шаг 4: Настройте DNS записи в Cloudflare

После активации домена в Cloudflare:

1. Перейдите в **DNS** → **Records**
2. Удалите все старые записи (если они есть)
3. Добавьте новые записи:

**Запись 1: Корневой домен (lexybooster.com)**

```
Type: CNAME
Name: @
Target: q7qq2j3z.up.railway.app
Proxy status: Proxied (оранжевое облако ☁️)
TTL: Auto
```

**Запись 2: WWW (www.lexybooster.com)**

```
Type: CNAME
Name: www
Target: q7qq2j3z.up.railway.app
Proxy status: Proxied (оранжевое облако ☁️)
TTL: Auto
```

4. Нажмите **Save** для каждой записи

#### Шаг 5: Настройте SSL/TLS

1. В Cloudflare Dashboard → **SSL/TLS**
2. В секции **Overview** выберите режим:
   - **Full (strict)** ⭐ (рекомендуется)

Это обеспечит шифрование от пользователя до Cloudflare и от Cloudflare до Railway.

#### Шаг 6: Настройте автоматический HTTPS редирект

1. В Cloudflare Dashboard → **SSL/TLS** → **Edge Certificates**
2. Включите:
   - ✅ **Always Use HTTPS** (ON)
   - ✅ **Automatic HTTPS Rewrites** (ON)

#### Шаг 7: Настройте кеширование (опционально)

1. В Cloudflare Dashboard → **Rules** → **Page Rules**
2. Нажмите **Create Page Rule**

**Правило 1: Кешировать статику**

```
URL: lexybooster.com/public/*

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month
```

**Правило 2: WWW редирект (если хотите)**

```
URL: www.lexybooster.com/*

Settings:
- Forwarding URL: 301 - Permanent Redirect
- Destination URL: https://lexybooster.com/$1
```

Нажмите **Save and Deploy**

---

## 📝 Обновление Railway приложения

### 1. Environment Variables

В Railway Dashboard → Settings → Variables:

Добавьте или обновите:

```env
PORT=8080
FRONTEND_URL=https://lexybooster.com
ALLOWED_ORIGINS=https://lexybooster.com,https://www.lexybooster.com
```

### 2. Обновите CORS в server-postgresql.js

Найдите настройки CORS (примерно строка 50-60):

```javascript
// CORS configuration
app.use(cors({
    origin: [
        'https://lexybooster.com',
        'https://www.lexybooster.com',
        'http://localhost:3000',
        'http://localhost:5500'
    ],
    credentials: true
}));
```

### 3. Обновите manifest.json

В `public/manifest.json`:

```json
{
  "name": "LexyBooster - Language Learning & SRS",
  "short_name": "LexyBooster",
  "start_url": "https://lexybooster.com/",
  "scope": "https://lexybooster.com/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#7c3aed",
  ...
}
```

### 4. Коммит и деплой

```bash
git add server-postgresql.js public/manifest.json
git commit -m "Configure domain: lexybooster.com"
git push origin main
```

Railway автоматически задеплоит изменения.

---

## ✅ Проверка работы

### 1. Проверка DNS (через 5-30 минут после настройки)

**Windows:**
```bash
nslookup lexybooster.com
```

**Должен вернуть:**
```
Name:    lexybooster.com
Address: [IP адрес Cloudflare]
```

**Онлайн проверка:**
https://dnschecker.org/#CNAME/lexybooster.com

### 2. Проверка SSL (через 5-15 минут)

**Windows:**
```bash
curl -I https://lexybooster.com
```

**Должен вернуть:**
```
HTTP/2 200
server: cloudflare
...
```

**Онлайн проверка:**
https://www.ssllabs.com/ssltest/analyze.html?d=lexybooster.com

### 3. Проверка приложения

Откройте браузер:
```
https://lexybooster.com
```

Должно загрузиться ваше приложение LexyBooster с зелёным замочком 🔒

### 4. Проверка API

```bash
curl https://lexybooster.com/api/health
```

Должен вернуть JSON с health status.

---

## 🚨 Возможные проблемы

### Проблема 1: "ERR_NAME_NOT_RESOLVED"

**Причина:** DNS записи ещё не распространились
**Решение:** Подождите 30-60 минут, проверьте правильность nameservers в Namecheap

### Проблема 2: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Причина:** Неправильный SSL режим в Cloudflare
**Решение:** Убедитесь что выбран режим **Full (strict)**, а не Flexible

### Проблема 3: "Too many redirects" (бесконечный редирект)

**Причина:** Конфликт SSL настроек
**Решение:**
1. Cloudflare SSL/TLS → **Full (strict)**
2. Railway должен использовать HTTPS

### Проблема 4: Статика не загружается (CSS/JS)

**Причина:** CORS или неправильные пути
**Решение:**
1. Проверьте CORS настройки в server-postgresql.js
2. Убедитесь что все пути относительные (не hardcoded localhost)

### Проблема 5: "This site can't be reached"

**Причина:** Railway приложение не запущено или порт неправильный
**Решение:**
1. Проверьте что Railway deployment успешен
2. Убедитесь что PORT=8080 в переменных окружения
3. Проверьте логи в Railway Dashboard

---

## 📊 Текущая архитектура

```
┌─────────────────────────────────────────────┐
│           lexybooster.com                   │
│              (Namecheap)                    │
└──────────────────┬──────────────────────────┘
                   │ Nameservers
                   ↓
┌─────────────────────────────────────────────┐
│            Cloudflare CDN                   │
│  • SSL Certificate (Let's Encrypt)          │
│  • DDoS Protection                          │
│  • Caching                                  │
│  • WAF                                      │
└──────────────────┬──────────────────────────┘
                   │ CNAME: q7qq2j3z.up.railway.app
                   ↓
┌─────────────────────────────────────────────┐
│         Railway (Port 8080)                 │
│  • Node.js + Express                        │
│  • PostgreSQL Database                      │
│  • LexyBooster Application                  │
└─────────────────────────────────────────────┘
```

---

## 🎯 После настройки

### 1. Обновите Google OAuth (если используете)

Google Cloud Console → Credentials:

**Authorized JavaScript origins:**
```
https://lexybooster.com
https://www.lexybooster.com
```

**Authorized redirect URIs:**
```
https://lexybooster.com/auth/callback
https://lexybooster.com/
```

### 2. Обновите Google Play Store listing

После публикации приложения обновите:
- Website URL: https://lexybooster.com
- Privacy Policy URL: https://lexybooster.com/privacy.html

### 3. Добавьте в Google Search Console

1. https://search.google.com/search-console
2. Add Property → Domain
3. Добавьте lexybooster.com
4. Verify ownership (через DNS TXT record)

### 4. Настройте monitoring

**Uptime monitoring (бесплатно):**
- https://uptimerobot.com
- Проверяйте https://lexybooster.com каждые 5 минут

### 5. Настройте email

**Для support@lexybooster.com:**
- Используйте Cloudflare Email Routing (бесплатно)
- Или Google Workspace / Microsoft 365

---

## 📞 Поддержка

**Railway:**
- Dashboard: https://railway.app
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**Cloudflare:**
- Dashboard: https://dash.cloudflare.com
- Docs: https://developers.cloudflare.com
- Community: https://community.cloudflare.com

**Namecheap:**
- Dashboard: https://www.namecheap.com
- Support: https://www.namecheap.com/support

---

**Создано:** 2025-10-28
**Домен:** lexybooster.com
**Railway CNAME:** q7qq2j3z.up.railway.app
**Port:** 8080
**CDN:** Cloudflare (рекомендуется)
