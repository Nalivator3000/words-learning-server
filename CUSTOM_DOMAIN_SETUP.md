# 🌐 Custom Domain Setup Guide - lexybooster.com

## Настройка домена lexybooster.com для Railway приложения

### Вариант 1: Прямое подключение через Namecheap (Простой способ)

#### Шаг 1: Railway Dashboard

1. Откройте https://railway.app
2. Перейдите в ваш проект `words-learning-server`
3. Выберите сервис `words-learning-server-copy-production`
4. Перейдите на вкладку **Settings**
5. Найдите секцию **Networking** → **Domains**
6. Нажмите **+ Generate Domain** (если ещё не сделали)
7. Нажмите **Custom Domain**
8. Введите: `app.lexybooster.com` (рекомендуется) или `lexybooster.com`

Railway покажет вам DNS записи, которые нужно добавить.

#### Шаг 2: Namecheap DNS настройка

1. Войдите в Namecheap: https://www.namecheap.com/myaccount/login/
2. Перейдите в **Domain List**
3. Найдите `lexybooster.com` → нажмите **Manage**
4. Перейдите на вкладку **Advanced DNS**

#### Вариант A: Поддомен app.lexybooster.com (Рекомендуется)

Добавьте CNAME запись:

```
Type: CNAME Record
Host: app
Value: words-learning-server-copy-production.up.railway.app
TTL: Automatic
```

**Структура:**
- `lexybooster.com` - для лендинга/маркетинга (можно настроить позже)
- `app.lexybooster.com` - ваше приложение на Railway

#### Вариант B: Корневой домен lexybooster.com

Railway даст вам IP адрес. Добавьте A запись:

```
Type: A Record
Host: @
Value: [IP адрес от Railway]
TTL: Automatic
```

**И добавьте CNAME для www:**

```
Type: CNAME Record
Host: www
Value: lexybooster.com.
TTL: Automatic
```

#### Шаг 3: Подождите DNS распространение

- **Обычно**: 5-30 минут
- **Максимум**: до 24 часов (редко)

Проверить можно здесь: https://dnschecker.org/#CNAME/app.lexybooster.com

#### Шаг 4: SSL Certificate

Railway автоматически выдаст SSL сертификат (Let's Encrypt) через 5-15 минут после успешной проверки DNS.

В Railway вы увидите статус:
- ⏳ **Pending** - проверяет DNS
- ✅ **Active** - готово, сертификат выдан

---

### Вариант 2: Через Cloudflare (Рекомендуется для production) ⭐

#### Преимущества Cloudflare:

- ✅ Бесплатный SSL сертификат
- ✅ CDN (быстрая загрузка по всему миру)
- ✅ DDoS защита
- ✅ Кеширование статических файлов
- ✅ Web Application Firewall (WAF)
- ✅ Аналитика трафика
- ✅ Always Online (если Railway упадёт, Cloudflare покажет кеш)

#### Шаг 1: Создайте аккаунт Cloudflare

1. Зарегистрируйтесь на https://dash.cloudflare.com/sign-up
2. Нажмите **Add site**
3. Введите `lexybooster.com`
4. Выберите **Free Plan**
5. Нажмите **Continue**

#### Шаг 2: Обновите Nameservers в Namecheap

Cloudflare покажет вам nameservers (например):

```
adrian.ns.cloudflare.com
judy.ns.cloudflare.com
```

1. Войдите в Namecheap
2. Domain List → Manage `lexybooster.com`
3. Найдите **Nameservers**
4. Выберите **Custom DNS**
5. Введите nameservers от Cloudflare
6. Нажмите **Save**

⏳ Подождите 5-60 минут, пока Cloudflare проверит изменения.

#### Шаг 3: Настройте DNS в Cloudflare

В Cloudflare Dashboard → DNS → Records:

**Для приложения (app.lexybooster.com):**

```
Type: CNAME
Name: app
Target: words-learning-server-copy-production.up.railway.app
Proxy status: Proxied (оранжевое облако ✅)
TTL: Auto
```

**Для корневого домена (lexybooster.com) - опционально:**

```
Type: CNAME
Name: @
Target: your-landing-page.netlify.app (или другой хостинг)
Proxy status: Proxied (оранжевое облако ✅)
TTL: Auto
```

**Для www редиректа:**

```
Type: CNAME
Name: www
Target: lexybooster.com
Proxy status: Proxied (оранжевое облако ✅)
TTL: Auto
```

#### Шаг 4: SSL/TLS настройки в Cloudflare

1. В Cloudflare Dashboard → SSL/TLS
2. Выберите режим: **Full (strict)** ⭐

Это обеспечит шифрование от пользователя до Cloudflare и от Cloudflare до Railway.

#### Шаг 5: Page Rules для кеширования (опционально)

Cloudflare Dashboard → Rules → Page Rules:

**Правило 1: Кешировать статику**

```
URL: app.lexybooster.com/public/*
Settings:
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 month
```

**Правило 2: WWW редирект**

```
URL: www.lexybooster.com/*
Settings:
  - Forwarding URL: 301 - Permanent Redirect
  - Destination URL: https://lexybooster.com/$1
```

---

## 📝 Обновление кода приложения

### 1. Environment Variables в Railway

В Railway Dashboard → Settings → Environment Variables:

Добавьте или обновите:

```
FRONTEND_URL=https://app.lexybooster.com
ALLOWED_ORIGINS=https://app.lexybooster.com,https://lexybooster.com
```

### 2. Обновите CORS в server-postgresql.js

Найдите строку с `cors()` и обновите:

```javascript
// CORS configuration
app.use(cors({
    origin: [
        'https://app.lexybooster.com',
        'https://lexybooster.com',
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
  "name": "LexiBooster - Language Learning & SRS",
  "short_name": "LexiBooster",
  "start_url": "https://app.lexybooster.com/",
  "scope": "https://app.lexybooster.com/",
  ...
}
```

### 4. Обновите Google OAuth (если используете)

В Google Cloud Console → Credentials:

**Authorized JavaScript origins:**
```
https://app.lexybooster.com
https://lexybooster.com
```

**Authorized redirect URIs:**
```
https://app.lexybooster.com/auth/callback
https://app.lexybooster.com/
```

---

## ✅ Проверка работы

### Проверка DNS (Windows)

```bash
# Проверка CNAME
nslookup app.lexybooster.com

# Должен вернуть:
# app.lexybooster.com
# Address: [IP адрес]
```

### Проверка SSL

```bash
# Проверка сертификата
curl -I https://app.lexybooster.com

# Должен вернуть:
# HTTP/2 200
# ...
```

### Проверка приложения

```bash
# Проверка API
curl https://app.lexybooster.com/api/health

# Должен вернуть JSON с health status
```

### Онлайн проверки

- **DNS**: https://dnschecker.org/#CNAME/app.lexybooster.com
- **SSL**: https://www.ssllabs.com/ssltest/analyze.html?d=app.lexybooster.com
- **Performance**: https://pagespeed.web.dev/analysis?url=https://app.lexybooster.com

---

## 🚨 Возможные проблемы и решения

### Проблема 1: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Причина:** SSL сертификат ещё не выдан
**Решение:** Подождите 15-30 минут после добавления домена в Railway

### Проблема 2: "This site can't be reached"

**Причина:** DNS записи ещё не распространились
**Решение:** Подождите 30-60 минут, проверьте правильность DNS записей

### Проблема 3: CORS ошибки

**Причина:** Домен не добавлен в ALLOWED_ORIGINS
**Решение:** Обновите Environment Variables в Railway и код в server-postgresql.js

### Проблема 4: "Too many redirects"

**Причина:** Неправильный SSL режим в Cloudflare
**Решение:** Убедитесь, что выбран режим **Full (strict)**, а не **Flexible**

---

## 📊 Рекомендуемая структура

```
lexybooster.com               → Landing page (Netlify/Vercel)
app.lexybooster.com           → Main application (Railway)
api.lexybooster.com           → API if separate (Railway)
docs.lexybooster.com          → Documentation (GitHub Pages)
blog.lexybooster.com          → Blog (Ghost/WordPress)
```

---

## 🎯 Следующие шаги после настройки

1. ✅ Протестируйте приложение на новом домене
2. ✅ Обновите ссылки в Google Play Store listing (после публикации)
3. ✅ Добавьте Google Analytics для нового домена
4. ✅ Настройте monitoring (UptimeRobot, Pingdom)
5. ✅ Настройте email (для support@lexybooster.com)
6. ✅ Создайте лендинг для lexybooster.com
7. ✅ Добавьте домен в Google Search Console

---

## 📞 Поддержка

Если возникли проблемы:
- Railway Support: https://help.railway.app
- Cloudflare Support: https://support.cloudflare.com
- Namecheap Support: https://www.namecheap.com/support

---

**Создано:** 2025-10-28
**Домен:** lexybooster.com
**Хостинг:** Railway
**CDN:** Cloudflare (рекомендуется)
