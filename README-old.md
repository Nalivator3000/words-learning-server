# Words Learning Server

Серверная версия приложения для изучения немецких слов.

## Установка и запуск

### Локально (для разработки)

1. **Установка PostgreSQL:**
   - Скачать и установить PostgreSQL
   - Создать базу данных: `CREATE DATABASE words_learning;`

2. **Настройка окружения:**
   - Скопировать `.env.example` в `.env`
   - Настроить параметры подключения к БД

3. **Установка зависимостей:**
```bash
npm install
```

4. **Запуск сервера:**
```bash
npm start
```
или для разработки с автоперезагрузкой:
```bash
npm run dev
```

5. **Открыть в браузере:**
```
http://localhost:3000
```

### На хостинге

#### Heroku

1. **Создать приложение:**
```bash
heroku create your-app-name
```

2. **Деплой:**
```bash
git push heroku main
```

#### Vercel

1. **Установить Vercel CLI:**
```bash
npm i -g vercel
```

2. **Деплой:**
```bash
vercel
```

#### Railway

1. **Подключить к GitHub репозиторию**
2. **Автоматический деплой из main ветки**

## Функционал

- ✅ Изучение слов (Multiple Choice, Typing, Word Building)
- ✅ Система повторения (7 дней, 30 дней)
- ✅ Озвучка немецких слов
- ✅ Импорт/экспорт CSV
- ✅ Статистика прогресса
- ✅ Мобильная версия
- ✅ Клавиатурная навигация

## API Endpoints

### Слова
- `GET /api/words` - Получить список слов
- `GET /api/words/counts` - Статистика по статусам
- `GET /api/words/random/:status/:count` - Случайные слова
- `POST /api/words` - Добавить слово
- `POST /api/words/bulk` - Добавить множество слов
- `PUT /api/words/:id/progress` - Обновить прогресс

### Импорт/Экспорт
- `POST /api/words/import` - Импорт CSV
- `GET /api/words/export/:status?` - Экспорт CSV

## База данных

Использует PostgreSQL базу данных. Таблицы создаются автоматически при первом запуске.

## Технологии

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Озвучка:** Web Speech API
- **Мобильная поддержка:** Responsive design

## Переменные окружения

- `DATABASE_URL` - URL подключения к PostgreSQL
- `DB_HOST` - Хост базы данных
- `DB_PORT` - Порт базы данных
- `DB_NAME` - Имя базы данных
- `DB_USER` - Пользователь базы данных
- `DB_PASSWORD` - Пароль базы данных
- `PORT` - Порт сервера (по умолчанию 3000)
- `NODE_ENV` - Окружение (development/production)

## Структура проекта

```
├── server.js          # Основной сервер с PostgreSQL
├── package.json       # Зависимости Node.js
├── .env               # Переменные окружения (не коммитится)
├── .env.example       # Пример настроек
├── uploads/           # Временные файлы загрузок
└── public/            # Фронтенд файлы
    ├── index.html
    ├── app.js
    ├── database.js    # API клиент для сервера
    ├── quiz.js
    └── style.css
```

## Готовые хостинги с PostgreSQL

### Heroku (бесплатный)
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:mini
git push heroku main
```

### Railway (бесплатный)
- Автоматическое подключение к PostgreSQL
- Деплой через GitHub

### Render (бесплатный)
- Встроенная PostgreSQL база
- Автодеплой из репозитория