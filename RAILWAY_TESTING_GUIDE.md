# Testing on Railway (Production) - Complete Guide

## 🌐 Overview

Этот гайд показывает как запустить автоматизированные тесты против **живого production окружения на Railway**.

**⚠️ ВАЖНО:** Тесты будут работать с реальной production базой данных!

---

## 🚀 Quick Start

### Вариант 1: Найти URL Railway автоматически

Railway URL для LexyBooster:
- Production: `https://lexybooster.com`
- Альтернативный Railway URL (если нужен): `https://words-learning-server-production.up.railway.app`

```bash
# Установи Railway CLI (если еще не установлен)
npm install -g @railway/cli

# Войди в Railway
railway login

# Посмотри URL своего деплоя
railway status
```

### Вариант 2: Использовать свой URL напрямую

```bash
# Установи URL как переменную окружения (если нужно переопределить)
export PRODUCTION_URL=https://lexybooster.com

# Или для Windows (PowerShell)
$env:PRODUCTION_URL="https://lexybooster.com"

# Или для Windows (CMD)
set PRODUCTION_URL=https://lexybooster.com

# По умолчанию используется https://lexybooster.com - переопределять не нужно!
```

---

## 🧪 Запуск тестов на Production

### 1. Критические тесты (РЕКОМЕНДУЕТСЯ)

```bash
# Просто запусти - URL уже настроен по умолчанию!
node run-tests-production.js critical

# Или явно укажи URL (Linux/Mac)
PRODUCTION_URL=https://lexybooster.com node run-tests-production.js critical

# Windows PowerShell
$env:PRODUCTION_URL="https://lexybooster.com"; node run-tests-production.js critical

# Windows CMD
set PRODUCTION_URL=https://lexybooster.com && node run-tests-production.js critical
```

**Что тестируется:**
- ✅ Авторизация всех 39 тестовых пользователей
- ✅ Дедупликация импорта (КРИТИЧНО!)

**Время:** 10-15 минут

---

### 2. Smoke Tests (Быстрая проверка)

```bash
node run-tests-production.js smoke
```

**Что тестируется:**
- ✅ Авторизация
- ✅ Отображение наборов слов

**Время:** 5-7 минут

---

### 3. Все тесты (Полная проверка)

```bash
node run-tests-production.js full
```

**Что тестируется:**
- ✅ Всё (200+ тестов)

**Время:** 60+ минут

---

## 📋 Доступные команды

```bash
# Критические тесты (auth + deduplication)
node run-tests-production.js critical

# Быстрая проверка (smoke test)
node run-tests-production.js smoke

# Только авторизация
node run-tests-production.js auth

# Только импорт/дедупликация
node run-tests-production.js import

# Все тесты
node run-tests-production.js full

# Помощь
node run-tests-production.js --help
```

---

## 🔧 Настройка Production URL

### Способ 1: Переменная окружения (рекомендуется)

```bash
# Linux/Mac - в ~/.bashrc или ~/.zshrc (опционально, уже настроено по умолчанию)
export PRODUCTION_URL=https://lexybooster.com

# Windows PowerShell - в профиле (опционально, уже настроено по умолчанию)
$env:PRODUCTION_URL="https://lexybooster.com"
```

### Способ 2: Редактировать конфигурацию напрямую

Открой `config/playwright.config.production.js` и измени:

```javascript
use: {
  baseURL: 'https://lexybooster.com', // LexyBooster production URL
  // ...
}
```

### Способ 3: Создать .env файл

```bash
# Создай .env.production (опционально)
echo "PRODUCTION_URL=https://lexybooster.com" > .env.production

# Загрузи перед тестами
source .env.production  # Linux/Mac
```

---

## ⚙️ Конфигурация для Production

Файл: `config/playwright.config.production.js`

**Особенности production конфигурации:**

1. **Увеличенные таймауты:**
   - Тест: 60 секунд (vs 30 для local)
   - Навигация: 30 секунд
   - Assertions: 10 секунд

2. **Меньше устройств:**
   - Desktop Chrome
   - iPhone 12 Pro
   - (Вместо 7 устройств локально)

3. **Retry на ошибки:**
   - Автоматически повторяет упавшие тесты 2 раза

4. **Последовательное выполнение:**
   - 1 worker (не перегружает production)

---

## 📊 Ожидаемые результаты

### ✅ Успешный запуск

```
╔══════════════════════════════════════════════════════════════╗
║          Production Tests - Railway Environment             ║
╚══════════════════════════════════════════════════════════════╝

🌐 Testing against: https://lexybooster.com

Running: Critical Tests (Production)
Expected Duration: 10-15 min

⚠️  WARNING: Testing against PRODUCTION environment
   - This will create real data in production database
   - Test users: test_de_en, test_hi_en, etc.
   - Password: test123

  ✓ should load login page successfully (2.1s)
  ✓ should login successfully: test_de_en (3.2s)
  ✓ CRITICAL: should prevent duplicates (5.4s)
  ...

✅ Production tests PASSED in 614.23s

✨ Production environment is working correctly!
```

### ❌ Ошибки

```
❌ Production tests FAILED in 234.56s (exit code: 1)

⚠️  Production environment has issues!
   Check test report: npx playwright show-report test-results/production-report
```

**Что делать:**
1. Посмотри HTML отчет
2. Проверь логи Railway
3. Убедись что база данных доступна
4. Проверь что тестовые пользователи созданы

---

## 🔍 Просмотр результатов

### HTML отчет

```bash
# Посмотреть отчет production тестов
npx playwright show-report test-results/production-report
```

Откроется браузер с детальным отчетом:
- ✅ Passed tests (зеленые)
- ❌ Failed tests (красные)
- 📸 Screenshots при ошибках
- 📹 Videos при ошибках
- ⏱️ Время выполнения

---

## ⚠️ Важные замечания

### 1. Тестовые пользователи

Тесты используют эти аккаунты на production:
- `test_de_en`, `test_hi_en`, `test_ar_en`, и т.д.
- Пароль: `test123`
- Всего: 39 пользователей

**Убедись что они созданы на production:**

```bash
# Подключись к Railway database
railway connect

# Проверь пользователей
psql $DATABASE_URL -c "SELECT username FROM users WHERE username LIKE 'test_%' ORDER BY username;"
```

**Если нет - создай их:**

```bash
# Экспортируй DATABASE_URL из Railway
railway variables

# Запусти скрипт создания
DATABASE_URL="postgresql://..." node scripts/create-test-users.js
```

---

### 2. Rate Limiting

Production может иметь rate limiting. Поэтому:
- ✅ Используется 1 worker (последовательно)
- ✅ Увеличены таймауты
- ✅ Retry при ошибках

---

### 3. Data в Production

Тесты создают реальные данные:
- Импортируют слова
- Создают vocabulary entries
- Логинятся/выходят

**Это нормально** для тестовых пользователей.

**НЕ запускай** тесты от реальных пользователей!

---

## 🚨 Troubleshooting

### Проблема: Connection Timeout

```
Error: page.goto: Timeout 30000ms exceeded
```

**Решение:**
1. Проверь что Railway app запущен
2. Проверь URL правильный
3. Увеличь timeout в config (уже 60s)

---

### Проблема: Test Users Not Found

```
Error: Login failed for test_de_en
```

**Решение:**
Создай тестовых пользователей на production:

```bash
# Получи DATABASE_URL из Railway
railway variables

# Создай пользователей
DATABASE_URL="postgresql://..." node scripts/create-test-users.js
```

---

### Проблема: Database Connection Error

```
Error: connect ECONNREFUSED
```

**Решение:**
1. Проверь что база данных Railway доступна
2. Проверь что DATABASE_URL правильный
3. Проверь firewall/security groups

---

### Проблема: Rate Limited

```
Error: 429 Too Many Requests
```

**Решение:**
1. Запускай меньше тестов одновременно
2. Увеличь паузы между запросами
3. Используй `smoke` вместо `full`

---

## 📈 Best Practices

### 1. Запускай критические тесты регулярно

```bash
# Каждый день или после деплоя
node run-tests-production.js critical
```

### 2. Полные тесты - редко

```bash
# Раз в неделю или перед мажорным релизом
node run-tests-production.js full
```

### 3. Smoke тесты - часто

```bash
# После каждого деплоя
node run-tests-production.js smoke
```

### 4. Интеграция с CI/CD

Добавь в GitHub Actions / GitLab CI:

```yaml
# .github/workflows/production-tests.yml
name: Production Tests

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  workflow_dispatch: # Manual trigger

jobs:
  test-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run production tests
        env:
          PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}
        run: node run-tests-production.js critical

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: production-test-results
          path: test-results/
```

---

## 🎯 Checklist перед Production тестами

- [ ] Railway app работает
- [ ] Тестовые пользователи созданы (39 users)
- [ ] PRODUCTION_URL установлен правильно
- [ ] Playwright browsers установлены (`npx playwright install`)
- [ ] База данных доступна

---

## 📞 Помощь

### Если тесты падают на production:

1. **Проверь локально сначала:**
   ```bash
   npm start
   node run-tests.js critical
   ```

2. **Если локально работает, но на production нет:**
   - Проверь логи Railway
   - Проверь базу данных
   - Проверь environment variables
   - Проверь тестовых пользователей

3. **Посмотри детальный отчет:**
   ```bash
   npx playwright show-report test-results/production-report
   ```

---

## ✅ Quick Commands Summary

```bash
# Критические тесты (НАЧНИ С ЭТОГО) - URL уже настроен!
node run-tests-production.js critical

# Smoke test
node run-tests-production.js smoke

# Посмотреть отчет
npx playwright show-report test-results/production-report

# Создать тестовых пользователей на production
DATABASE_URL="postgresql://..." node scripts/create-test-users.js

# Проверить что тестовые пользователи есть
DATABASE_URL="postgresql://..." node test-hindi-word-sets.js
```

---

**Готово! Теперь можешь тестировать на Railway! 🚀**

**Рекомендуемый порядок:**
1. Создай тестовых пользователей на production (если еще нет)
2. Запусти critical tests
3. Если прошли ✅ - всё отлично!
4. Если упали ❌ - посмотри отчет и исправь

---

**Last Updated:** December 30, 2025
**Railway Testing Version:** 1.0
