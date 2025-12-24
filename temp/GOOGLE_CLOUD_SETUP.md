# 🔐 Google Cloud Console Setup Guide

**Цель:** Настроить Google OAuth 2.0 для LexyBooster
**Время:** ~15-20 минут

---

## 📝 Шаг 1: Создать проект

1. Перейти на [Google Cloud Console](https://console.cloud.google.com/)
2. Нажать **"Select a project"** → **"New Project"**
3. Название проекта: **"LexyBooster"**
4. Organization: Оставить по умолчанию
5. Нажать **"Create"**

---

## 🔌 Шаг 2: Включить APIs

1. В боковом меню: **"APIs & Services"** → **"Library"**
2. Найти: **"Google+ API"** (или **"Google People API"**)
3. Нажать **"Enable"**

---

## 🎫 Шаг 3: OAuth Consent Screen

1. В боковом меню: **"APIs & Services"** → **"OAuth consent screen"**
2. User Type: **"External"**
3. Нажать **"Create"**

### App Information
- **App name:** `LexyBooster`
- **User support email:** Ваш email
- **App logo:** (опционально) Загрузить лого 120x120px
- **Application home page:** `https://words-learning-server-production.up.railway.app`

### App Domain
- **Authorized domains:**
  - `railway.app`

### Developer Contact Information
- **Email addresses:** Ваш email

4. Нажать **"Save and Continue"**

### Scopes
5. Нажать **"Add or Remove Scopes"**
6. Выбрать:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
7. Нажать **"Update"** → **"Save and Continue"**

### Test Users (Optional)
8. Можно добавить тестовых пользователей или пропустить
9. Нажать **"Save and Continue"**

### Summary
10. Проверить информацию и нажать **"Back to Dashboard"**

---

## 🔑 Шаг 4: Создать OAuth 2.0 Credentials

1. В боковом меню: **"APIs & Services"** → **"Credentials"**
2. Нажать **"+ Create Credentials"** → **"OAuth client ID"**

### Application Type
3. Выбрать: **"Web application"**

### Name
4. Название: **"LexyBooster Web Client"**

### Authorized JavaScript Origins
5. Добавить:
   - `http://localhost:3000` (для разработки)
   - `https://words-learning-server-production.up.railway.app` (для production)

### Authorized Redirect URIs
6. Добавить:
   - `http://localhost:3000/auth/google/callback`
   - `https://words-learning-server-production.up.railway.app/auth/google/callback`

7. Нажать **"Create"**

---

## 📋 Шаг 5: Сохранить Credentials

После создания появится модальное окно с:
- **Client ID** (начинается с цифр, заканчивается на `.apps.googleusercontent.com`)
- **Client Secret** (случайная строка)

### ⚠️ ВАЖНО: Скопировать и сохранить!

**Создать файл `.env` в корне проекта:**
```env
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL_LOCAL=http://localhost:3000/auth/google/callback
GOOGLE_CALLBACK_URL_PROD=https://words-learning-server-production.up.railway.app/auth/google/callback

# Session Secret (generate random string)
SESSION_SECRET=generate_random_32_char_string_here
```

### Генерация SESSION_SECRET
```bash
# В терминале:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Шаг 6: Railway Environment Variables

1. Перейти на [Railway Dashboard](https://railway.app/)
2. Выбрать проект **words-learning-server**
3. Перейти в **"Variables"**
4. Добавить переменные:
   - `GOOGLE_CLIENT_ID` = ваш Client ID
   - `GOOGLE_CLIENT_SECRET` = ваш Client Secret
   - `GOOGLE_CALLBACK_URL` = `https://words-learning-server-production.up.railway.app/auth/google/callback`
   - `SESSION_SECRET` = случайная строка из 32+ символов
   - `NODE_ENV` = `production`

---

## ✅ Шаг 7: Проверка

### Локально
```bash
npm start
# Перейти на http://localhost:3000
# Попробовать войти через Google
```

### Production
```bash
git push origin develop
# Railway автоматически задеплоит
# Перейти на https://words-learning-server-production.up.railway.app
# Попробовать войти через Google
```

---

## 🔒 Безопасность

### ✅ DO
- Хранить credentials в `.env` файле
- Добавить `.env` в `.gitignore`
- Использовать HTTPS на production
- Регулярно ротировать Client Secret
- Использовать secure cookies (`secure: true` в production)

### ❌ DON'T
- Никогда не коммитить `.env` файл
- Не использовать одинаковый Client ID для dev/prod
- Не делиться Client Secret публично
- Не хардкодить credentials в коде

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Причина:** Redirect URI не совпадает с настроенным в Google Console

**Решение:**
1. Проверить URL в Google Console
2. Убедиться что URL точно совпадает (без лишних слешей)
3. Подождать 5 минут для обновления настроек

### Error: "Access blocked: Authorization Error"
**Причина:** OAuth consent screen не настроен или в статусе "Testing"

**Решение:**
1. Проверить OAuth consent screen
2. Добавить тестовых пользователей (если в Testing mode)
3. Или опубликовать app (если готово к production)

### Error: "Invalid client"
**Причина:** Неверный Client ID или Client Secret

**Решение:**
1. Проверить `.env` файл
2. Убедиться что нет лишних пробелов
3. Перезапустить сервер после изменения `.env`

---

## 📚 Полезные ссылки

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)

---

## ✅ Checklist

- [ ] Проект создан в Google Cloud Console
- [ ] Google+ API включен
- [ ] OAuth consent screen настроен
- [ ] OAuth credentials созданы
- [ ] Client ID и Secret сохранены в `.env`
- [ ] Redirect URIs добавлены (local + prod)
- [ ] Railway environment variables настроены
- [ ] Тестовый вход через Google работает локально
- [ ] Тестовый вход через Google работает на production

---

**Следующий шаг:** [GOOGLE_OAUTH_PLAN.md](GOOGLE_OAUTH_PLAN.md) - Реализация Backend
