# 🚀 Развёртывание PostgreSQL в облаке

## ☁️ **Профессиональные варианты:**

### 1. **AWS RDS** ⭐ (рекомендуется для продакшена)
- **Бесплатный tier:** 750 часов/месяц (12 месяцев)
- **Плюсы:** Максимальная надёжность, автобэкапы, мониторинг
- **Минусы:** Сложнее настройка, после года платно

### 2. **DigitalOcean Managed Database**
- **Цена:** от $15/месяц за базовый план
- **Плюсы:** Простая настройка, отличная документация
- **Минусы:** Нет бесплатного tier

### 3. **Google Cloud SQL**
- **Бесплатный tier:** $300 кредитов на 90 дней
- **Плюсы:** Интеграция с GCP, высокая производительность
- **Минусы:** Сложная настройка биллинга

---

## 📋 **AWS RDS PostgreSQL (рекомендуется):**

### Шаг 1: Создание базы
1. Идём на https://neon.tech/
2. **Sign Up** через GitHub/Google
3. **Create Project:**
   - Name: `words-learning-db`
   - Region: Europe
   - PostgreSQL 15+

### Шаг 2: Получение connection string
После создания увидите:
```
postgresql://user:pass@host.neon.tech:5432/neondb
```

### Шаг 3: Создание .env файла
```bash
DB_HOST=your-host.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=your-username
DB_PASSWORD=your-password
PORT=3000
JWT_SECRET=words_learning_jwt_secret_2024
```

### Шаг 4: Инициализация схемы
1. В Neon Dashboard → **SQL Editor**
2. Скопировать содержимое `database-schema-postgres.sql`
3. Выполнить → проверить создание таблиц

### Шаг 5: Запуск локально
```bash
npm install pg dotenv
node server-postgres.js
```

Ожидаемый результат:
```
✅ Connected to PostgreSQL database
🗄️ Using PostgreSQL database
```

---

## 🌐 **Развёртывание сервера (бесплатно):**

### Railway.app (рекомендуется):
1. https://railway.app/ → GitHub регистрация
2. **New Project** → **Deploy from GitHub**
3. Выбрать репозиторий
4. Добавить переменные из .env
5. Автодеплой готов!

### Render.com (альтернатива):
1. https://render.com/ → GitHub регистрация  
2. **Web Service** → выбрать репо
3. Build: `npm install`
4. Start: `node server-postgres.js`

---

## ✅ **Результат:**
- 🌍 API доступно по URL
- 📊 PostgreSQL база в облаке
- 🔄 Автообновления из GitHub
- 💰 Полностью бесплатно
- ⏱️ Время настройки: 30-60 минут

## 🧪 **Тестирование:**
```bash
curl https://your-app.railway.app/api/health
# Ответ: {"status":"healthy","database":"postgresql"}
```

Готово для телеграм-бота и мобильных приложений! 🎯