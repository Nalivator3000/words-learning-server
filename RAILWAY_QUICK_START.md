# Railway Testing - Quick Start 🚀

## Самый быстрый способ протестировать production

### 1️⃣ Узнай свой Railway URL

```bash
# Вариант 1: Railway CLI
railway status

# Вариант 2: Зайди на railway.app и скопируй URL
# Обычно выглядит как: https://your-app.up.railway.app
```

---

### 2️⃣ Запусти критические тесты

```bash
# Linux/Mac
PRODUCTION_URL=https://your-app.up.railway.app npm run test:e2e:production

# Windows PowerShell
$env:PRODUCTION_URL="https://your-app.up.railway.app"; npm run test:e2e:production

# Windows CMD
set PRODUCTION_URL=https://your-app.up.railway.app && npm run test:e2e:production
```

**Время:** 10-15 минут
**Что тестирует:** Авторизация + Дедупликация (самое важное!)

---

### 3️⃣ Посмотри результаты

```bash
# Открыть HTML отчет
npm run test:e2e:production:report
```

---

## ✅ Если всё прошло

```
✅ Production tests PASSED in 614.23s
✨ Production environment is working correctly!
```

**Готово!** Production работает отлично! 🎉

---

## ❌ Если тесты упали

```
❌ Production tests FAILED
⚠️  Production environment has issues!
```

**Что делать:**

1. **Посмотри отчет:**
   ```bash
   npm run test:e2e:production:report
   ```

2. **Проверь что тестовые пользователи созданы:**
   ```bash
   # Получи DATABASE_URL из Railway
   railway variables

   # Создай тестовых пользователей
   DATABASE_URL="postgresql://..." node scripts/create-test-users.js
   ```

3. **Проверь логи Railway:**
   ```bash
   railway logs
   ```

---

## 📚 Другие команды

```bash
# Smoke test (быстрая проверка, 5-7 мин)
PRODUCTION_URL=https://your-app.up.railway.app npm run test:e2e:production:smoke

# Полные тесты (60+ мин)
PRODUCTION_URL=https://your-app.up.railway.app npm run test:e2e:production:full

# Посмотреть отчет
npm run test:e2e:production:report
```

---

## 🔑 Тестовые пользователи на Production

Убедись что эти пользователи созданы на production:
- `test_de_en` (German → English)
- `test_hi_en` (Hindi → English)
- `test_ar_en` (Arabic → English)
- ... и еще 36 пользователей

**Пароль для всех:** `test123`

**Если нет - создай:**
```bash
DATABASE_URL="postgresql://user:pass@host:port/db" node scripts/create-test-users.js
```

---

## 📖 Полная документация

Для деталей смотри: [RAILWAY_TESTING_GUIDE.md](RAILWAY_TESTING_GUIDE.md)

---

## 🎯 Рекомендуемый workflow

1. **После каждого деплоя:** Smoke test (5-7 мин)
   ```bash
   npm run test:e2e:production:smoke
   ```

2. **Раз в день:** Critical tests (10-15 мин)
   ```bash
   npm run test:e2e:production
   ```

3. **Перед мажорным релизом:** Full tests (60+ мин)
   ```bash
   npm run test:e2e:production:full
   ```

---

**Готово! Начни с команды выше ☝️**
