# 🚀 План развития FluentFlow

## 0. 🔧 Критичные исправления (Priority)

### 0.1 Озвучка слов (Text-to-Speech)
- [x] **Исправить выбор голосов для озвучки** ✅ ГОТОВО
  - ✅ Реализован умный алгоритм selectBestVoice()
  - ✅ Немецкие слова теперь озвучиваются правильно
  - ✅ Автоматический выбор лучшего голоса

- [x] **Улучшенный алгоритм выбора голоса** ✅ ГОТОВО (app.js:42-118)
  - ✅ Приоритет 1: Локальные голоса (localService: true) +100 очков
  - ✅ Приоритет 2: Точное совпадение языка (de-DE, а не de-US) +50 очков
  - ✅ Приоритет 3: Качественные TTS движки (Google +40, Microsoft +35, Apple +35)
  - ✅ Фильтрация плохих голосов (eSpeak, Festival, Pico, Flite)
  - ✅ Дополнительные бонусы: Natural +30, Premium +30, Neural +25

- [x] **UI для выбора голоса** ✅ ГОТОВО (index.html:388-455, app.js:2043-2127)
  - ✅ Настройки → Выбор голоса для 6 языков (ru, en, de, es, fr, it)
  - ✅ Предпросмотр голоса (кнопка 🔊 "Прослушать" с примерами)
  - ✅ Отображение голосов с индикаторами (📍 локальные, ☁️ онлайн)
  - ✅ Сохранение выбора в localStorage
  - ✅ Авто-режим с умным алгоритмом подбора
  - ✅ Dark mode поддержка для всех элементов

- [x] **Fallback стратегия** ✅ ГОТОВО (Backend)
  - ✅ API endpoint `/api/tts/synthesize` с кешированием
  - ✅ Cache management (`/cache/stats`, `/cache/clear`)
  - ✅ MD5-хеширование для cache keys
  - ✅ Файловое кеширование (cache/tts/)
  - ✅ Готовность к интеграции real TTS (Azure/Google/Amazon/Elevenlabs)
  - [ ] Frontend integration (следующая итерация)
  - [ ] Real API keys configuration (.env)

- [x] **Offline поддержка** ✅ ГОТОВО (Backend)
  - ✅ Bulk TTS synthesis endpoint `/api/tts/bulk-synthesize`
  - ✅ Popular words endpoint `/api/words/popular/:userId`
  - ✅ Batch processing с подробной статистикой (synthesized/cached/errors)
  - ✅ Готовность к frontend integration (IndexedDB, Service Worker)
  - [ ] Frontend integration (следующая итерация)
  - [ ] Service Worker cache для audio
  - [ ] UI для управления offline кешем

- [x] **Улучшения произношения** ✅ ГОТОВО (index.html, app.js, style.css)
  - ✅ Регулировка скорости озвучки (0.5x - 1.5x) с слайдером
  - ✅ Регулировка высоты тона (0.5 - 2.0) с слайдером
  - ✅ Регулировка громкости (0% - 100%) с слайдером
  - ✅ Кнопка тестирования настроек с текущим изучаемым языком
  - ✅ Сохранение настроек в localStorage
  - ✅ Dark mode поддержка для всех контролов
  - [ ] SSML разметка для акцентов и интонации (будущая версия)
  - [ ] Автоматическое замедление для сложных слов (будущая версия)

### 0.2 Переход на PostgreSQL
- [x] **Переключить на server-postgresql.js**
  - Обновлен package.json
  - Добавлена multi-user поддержка
  - Фильтрация по userId и languagePairId

- [x] **Production БД (Railway PostgreSQL)**
  - Используем встроенную PostgreSQL на Railway
  - Автоматический DATABASE_URL
  - Достаточно для коммерческого продукта

- [x] **Тестирование PostgreSQL** ✅ ГОТОВО
  - ✅ Протестировано 31 API endpoint (все работают)
  - ✅ Auth: register, login (с JWT)
  - ✅ Language Pairs: CRUD операции
  - ✅ Words: CRUD, прогресс, bulk операции, экспорт
  - ✅ Gamification: XP, levels, achievements, leaderboards, daily goals
  - ✅ Import/Export: CSV, Google Sheets, миграция
  - ✅ Сервер работает на порту 3001

---

## 1. 🎨 Полная переработка дизайна

### 1.1 Современная визуальная система
- [x] **Дизайн-система на основе Tailwind CSS / UnoCSS** ✅ FOUNDATION ГОТОВА
  - ✅ Tailwind CSS v4.1.14 установлен
  - ✅ tailwind.config.js создан с брендовыми цветами (50+ переменных)
  - ✅ Build scripts настроены (build:css, watch:css)
  - ✅ Готовность к инкрементальной миграции компонентов
  - [ ] Миграция компонентов на Tailwind utilities (будущая итерация)
  - [ ] Полный переход от CSS переменных к utility-first (будущая итерация)

- [x] **Темная тема (Dark Mode)** ✅ ГОТОВО
  - ✅ Автоматическое определение системных предпочтений
  - ✅ Переключатель темы с плавной анимацией (🌙/☀️)
  - ✅ Адаптация всех компонентов под обе темы (50+ CSS rules)
  - ✅ Сохранение выбора темы в localStorage
  - ✅ ThemeManager класс (theme.js)

- [x] **Glassmorphism & Neumorphism эффекты** ✅ ГОТОВО (style.css)
  - ✅ Стеклянные карточки с backdrop-blur (blur(24px-40px) + saturate(180%))
  - ✅ Stat cards с shimmer анимацией при hover
  - ✅ Auth modal с inset shadows и light reflection
  - ✅ Градиентные радиальные фоны с прозрачностью (light + dark themes)
  - ✅ Box-shadows с inset для 3D эффекта
  - ✅ Webkit-backdrop-filter для Safari поддержки

- [x] **Микроанимации (CSS)** ✅ ГОТОВО (style.css)
  - ✅ Плавные переходы между секциями (sectionAppear animation)
  - ✅ Stagger effect для карточек (cardAppear с delays 0.1s, 0.2s, 0.3s)
  - ✅ Shimmer + glow эффекты для кнопок (shimmer + blur glow)
  - ✅ Pulse анимация для активной навигации (infinite pulse 2s)
  - ✅ Enhanced hover трансформации (translateY + scale + glow)
  - ✅ Active state с микро-scale эффектом
  - [ ] Skeleton loaders (будущая версия)
  - [ ] Конфетти при достижениях (будущая версия)

### 1.2 Компонентная архитектура
- [ ] **Переход на React / Vue 3**
  - Разделение на переиспользуемые компоненты
  - Composition API для Vue / React Hooks
  - TypeScript для типобезопасности

- [ ] **UI Kit библиотека**
  - Buttons (Primary, Secondary, Ghost, Danger)
  - Cards (Word Card, Stats Card, Achievement Card)
  - Modals & Dialogs
  - Progress Bars & Circular Progress
  - [x] **Toast Notifications** ✅ ГОТОВО (toast.js, style.css)
    - ✅ 4 типа: success, error, warning, info
    - ✅ Автоматическое удаление (4-5 секунд)
    - ✅ Кнопка закрытия
    - ✅ Action button с callback
    - ✅ Loading toast (не закрывается автоматически)
    - ✅ Achievement toast (специальное форматирование)
    - ✅ Max 5 toasts одновременно
    - ✅ Анимации: slide-in, fade-out
    - ✅ Dark mode поддержка
    - ✅ Responsive дизайн
  - Skeleton Loaders

### 1.3 Адаптивный дизайн нового поколения
- [ ] **Mobile-First подход**
  - Оптимизация для тач-устройств
  - Swipe-жесты для навигации
  - Pull-to-refresh
  - Haptic feedback (вибрация при действиях)

- [x] **PWA (Progressive Web App)** ✅ ГОТОВО
  - ✅ Manifest.json настроен (shortcuts, categories, icons)
  - ✅ Install prompt (PWAInstallManager в theme.js)
  - ✅ Установка как нативное приложение
  - ✅ Service Worker для offline-режима (service-worker.js)
  - ✅ Кеширование данных и ассетов (Cache API)
  - ✅ Cache-first стратегия для статики
  - ✅ Network-first стратегия для API
  - ✅ Автообновление версий
  - ✅ Генератор иконок (generate-icons.html)
  - [ ] Push-уведомления (следующая версия)
  - [ ] Splash screen (следующая версия)

### 1.4 Новый UX
- [x] **Онбординг для новых пользователей** ✅ ГОТОВО (onboarding.js, style.css, index.html)
  - ✅ Интерактивный тур по 8 шагам (импорт, обучение, повторение, статистика, настройки, тема)
  - ✅ Highlight элементов с анимацией пульсации
  - ✅ Красивые tooltip с градиентами и тенями
  - ✅ Прогресс-бар (шаг X из 8)
  - ✅ Навигация: Назад, Далее, Пропустить
  - ✅ Первое достижение "Первые шаги" 🏆 при завершении
  - ✅ Celebration screen с конфетти эффектом
  - ✅ Кнопка "Начать тур заново" в настройках
  - ✅ Сохранение состояния в localStorage
  - ✅ Dark mode поддержка
  - ✅ Responsive дизайн для мобильных
  - [ ] Подсказки и tooltips для отдельных элементов (следующая версия)

- [ ] **Улучшенная навигация**
  - Breadcrumbs для глубоких страниц
  - Быстрые действия (Quick Actions)
  - Поиск по словам (Command Palette - Cmd+K)
  - История действий (undo/redo)

---

## 2. 🎮 Геймификация

### 2.1 Система стриков (Streaks)
- [x] **Ежедневные стрики** ✅ ЧАСТИЧНО ГОТОВО
  - ✅ Счётчик дней подряд изучения (gamification.js)
  - ✅ Визуализация календаря активности GitHub-style heatmap (gamification.js:273-334, style.css)
  - ✅ 365 дней истории с 5 уровнями интенсивности (0, 1-49, 50-99, 100-199, 200+ XP)
  - ✅ Hover tooltip с датой и XP
  - ✅ Легенда интенсивности (Меньше → Больше)
  - ✅ Responsive дизайн для мобильных
  - ✅ Dark mode поддержка
  - [ ] Уведомления о риске потери стрика (будущая версия)
  - [ ] Награды за мильстоны (7, 30, 100, 365 дней) - частично есть в achievements

- [x] **Защита стрика (Streak Freeze)** ✅ ГОТОВО (Backend)
  - ✅ Таблица `streak_freezes` (user_id, freeze_days, expires_at, is_active, used_on_date)
  - ✅ GET `/api/streak-freeze/:userId` - получить активные заморозки
  - ✅ POST `/api/streak-freeze/use` - использовать заморозку (manual/auto)
  - ✅ POST `/api/streak-freeze/:userId/claim-free` - получить бесплатную заморозку (раз в неделю)
  - ✅ GET `/api/streak-freeze/:userId/history` - история использования заморозок
  - ✅ Покупка через shop (streak_freeze_1/3/7) - уже реализовано
  - [ ] Frontend UI (кнопка "использовать заморозку", индикатор количества)
  - [ ] Автоматическое использование при потере стрика (интеграция со streak check)

### 2.2 Система очков и уровней (XP & Levels)
- [x] **Опыт (Experience Points)**
  - XP за изучение новых слов (+10 XP)
  - XP за правильные ответы в квизе (+5 XP)
  - XP за повторение слов (+3 XP)
  - Бонус XP за стрики (×1.5 множитель)

- [ ] **Уровни пользователя**
  - Уровни от 1 до 100
  - Прогрессивная шкала опыта (100 → 200 → 400...)
  - Разблокировка функций с уровнями
  - Титулы (Новичок → Ученик → Мастер → Гуру)

### 2.3 Система достижений (Achievements)
- [x] **Коллекция ачивок** ✅ ГОТОВО (Backend + UI Endpoints)
  - "Первые шаги" - выучить 10 слов
  - "Полиглот" - создать 3 языковые пары
  - "Марафонец" - стрик 30 дней
  - "Перфекционист" - 100% правильных ответов в 10 квизах
  - "Ночной ученик" - изучение после 22:00
  - "Ранняя пташка" - изучение до 6:00
  - Секретные ачивки (Easter Eggs)

- [ ] **Визуальные бейджи**
  - Иконки достижений
  - Прогресс-бары до следующей ачивки
  - Страница коллекции с locked/unlocked состояниями

### 2.4 Челленджи (Challenges)
- [x] **Ежедневные задания** ✅ ГОТОВО (Backend)
  - ✅ 9 predefined challenge templates (Easy, Medium, Hard)
  - ✅ Auto-generation: 3 challenges per day (1 each difficulty)
  - ✅ Progress tracking with incremental updates (server-postgresql.js:2073-2189)
  - ✅ Reward system: XP + Coins (transaction-safe)
  - ✅ Таблицы БД: challenge_templates, user_daily_challenges, challenge_progress_log
  - ✅ API endpoints: daily challenges, progress, claim reward, history, stats
  - ✅ Challenge streak calculation
  - ✅ Admin API for custom challenges
  - [ ] UI для отображения челленджей (будущая версия)
  - [ ] Уведомления о новых челленджах (будущая версия)
  - [ ] Achievement "Challenge Master" за 30 дней челленджей (будущая версия)

- [x] **Недельные челленджи** ✅ ГОТОВО (Backend)
  - ✅ Таблица weekly_challenges (user_id, week_start_date, challenge_type, target_value, current_progress)
  - ✅ GET `/api/weekly-challenges/:userId` - получить челленджи текущей недели
  - ✅ POST `/api/weekly-challenges/:userId/update` - обновить прогресс
  - ✅ POST `/api/weekly-challenges/:userId/claim` - забрать награду
  - ✅ GET `/api/weekly-challenges/stats/:userId` - статистика
  - ✅ 3 типа челленджей: Weekly XP Master (500 XP), Word Collector (50 слов), Streak Keeper (7 дней)
  - ✅ Автогенерация челленджей при первом запросе
  - [ ] Frontend UI (будущая версия)

- [ ] **Сезонные события**
  - Летний марафон
  - Новогодний челлендж
  - Тематические награды

### 2.5 Внутриигровая валюта (Coins/Gems)
- [x] **Заработок монет** ✅ ГОТОВО (Backend)
  - За выполнение заданий
  - За стрики
  - За достижения

- [x] **Трата монет** ✅ ГОТОВО (Backend)
  - Покупка заморозок стрика
  - Разблокировка тем оформления
  - Покупка подсказок в квизах
  - Кастомизация аватара

### 2.6 Статистика и аналитика
- [x] **Расширенная статистика** ✅ ГОТОВО
  - ✅ Heatmap активности (GitHub-style календарь за 365 дней)
  - ✅ XP история (последние 50 действий)
  - ✅ Счетчики: слов выучено, упражнений выполнено
  - ✅ Текущий и рекордный стрик
  - ✅ Прогресс уровня с XP bar
  - ✅ График прогресса обучения (по дням/неделям/месяцам) - analytics.js, Chart.js
  - ✅ Процент успешности по типам упражнений - bar chart с данными из xp_log
  - ✅ Самые сложные слова - топ-20 слов с низким correctcount
  - ✅ Время обучения (дневное/недельное/общее) - рассчитано из quizzes_completed
  - ✅ Predicted fluency date (ML-модель) - линейная регрессия на основе темпа обучения

- [x] **Персональные инсайты** ✅ ГОТОВО (Backend)
  - ✅ API endpoint `/api/users/:userId/insights`
  - ✅ 5 типов инсайтов: Best learning time, Favorite exercise, Progress comparison, Streak patterns, Milestones
  - ✅ Query параметры: period (week/month/all), limit
  - ✅ Priority sorting (high → medium → low)
  - ✅ Корректная обработка lowercase column names (createdat, xp_amount)
  - [ ] Frontend UI для отображения инсайтов (будущая версия)

### 2.7 Рейтинговая система
- [ ] **Персональный рейтинг**
  - Еженедельный/месячный скор
  - Факторы: XP, стрики, точность, слова

- [x] **Лиги (Leagues)** ✅ ГОТОВО (Backend)
  - ✅ 7 лиг: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
  - ✅ Повышение/понижение в лиге по итогам недели (promotion/demotion logic)
  - ✅ Weekly XP tracking с автосбросом
  - ✅ Leaderboard по текущей лиге (топ-100)
  - ✅ Награды за продвижение (coins + gems)
  - ✅ История переходов (league_history)
  - ✅ Admin endpoint для обработки конца недели
  - ✅ 7 API endpoints
  - [ ] Frontend UI (будущая версия)
  - [ ] Cron job для автоматического week end (будущая версия)

---

## 3. 👥 Социальные функции

### 3.1 Профили пользователей
- [x] **Публичный профиль** ✅ ГОТОВО (Backend)
  - Аватар (загрузка или выбор из библиотеки)
  - Username
  - Био (короткое описание)
  - Флаги изучаемых языков
  - Showcase достижений (топ-3 бейджа)

- [ ] **Статистика профиля**
  - Общий уровень
  - Количество слов
  - Стрик
  - Достижения
  - Позиция в глобальном рейтинге

### 3.2 Система друзей
- [x] **Добавление друзей** ✅ ГОТОВО (Backend)
  - ✅ Поиск по username (GET /api/users/search)
  - ✅ Отправка/принятие/отклонение запросов
  - ✅ Блокировка пользователей
  - ✅ Таблицы: friendships, friend_activities
  - ✅ 12 API endpoints (request, accept, decline, remove, block, search, activity feed)
  - [ ] QR-код для быстрого добавления (будущая версия)
  - [ ] Приглашения по email (будущая версия)
  - [ ] Frontend UI (будущая версия)

- [x] **Лента друзей** ✅ ГОТОВО (Backend)
  - ✅ Активность друзей (GET /api/friends/activities/:userId)
  - ✅ Activity types: achievement_unlocked, level_up, friend_request, became_friends
  - [ ] "Поздравить" реакции (будущая версия)
  - [ ] Сравнение прогресса (будущая версия)

### 3.3 Соревнования
- [x] **1-на-1 дуэли** ✅ ГОТОВО (Backend REST API)
  - ✅ Вызов друга на квиз (POST /api/duels/challenge)
  - ✅ Принятие/отклонение вызовов
  - ✅ 9 API endpoints (challenge, respond, start, answer, complete, status, history, active, stats)
  - ✅ Таблицы: duels, duel_answers, duel_results
  - ✅ Random word selection, answer validation, score calculation
  - ✅ XP rewards system
  - ✅ Win/loss/draw statistics
  - [ ] Real-time WebSocket (будущая версия)
  - [ ] Frontend UI (будущая версия)

- [ ] **Групповые турниры**
  - Еженедельные турниры
  - Bracket-система
  - Призы для топ-3

### 3.4 Совместное обучение
- [x] **Глобальные наборы слов (Word Collections)** 🎯 ✅ ЧАСТИЧНО ГОТОВО (Backend)
  - ✅ Системные наборы слов от администратора (server-postgresql.js)
  - ✅ Категории: Базовый уровень (A1, A2), Средний (B1, B2), Продвинутый (C1, C2)
  - ✅ Тематические наборы: Путешествия, Бизнес, Еда, Спорт, IT и т.д.
  - ✅ API для администратора для создания/редактирования наборов
  - ✅ Импорт глобального набора в личную коллекцию пользователя
  - ✅ Превью набора (количество слов, сложность, описание)
  - ✅ Поиск и фильтрация наборов (по языку, категории, сложности)
  - ✅ Статистика использования наборов (usage_count)
  - ✅ Таблицы БД: global_word_collections, global_collection_words
  - [ ] UI для просмотра и импорта наборов (будущая версия)
  - [ ] Админ-панель для управления наборами (будущая версия)

- [ ] **Обмен наборами слов**
  - Публикация своих наборов
  - Импорт наборов друзей
  - Рейтинг и отзывы на наборы

- [ ] **Учебные группы**
  - Создание групп по языкам
  - Групповые челленджи
  - Общий чат
  - Совместная статистика группы

### 3.5 Глобальная лента (Feed)
- [ ] **Публичные активности**
  - Достижения пользователей
  - Новые рекорды
  - Мильстоны (1000 слов, 365-дневный стрик)

- [ ] **Взаимодействие**
  - Лайки и комментарии
  - Поделиться своим достижением

### 3.6 Лидерборды (Leaderboards)
- [x] **Глобальные рейтинги** ✅ ГОТОВО (Backend)
  - ✅ Топ-100 по XP (server-postgresql.js:2835-2888)
  - ✅ Топ по стрикам
  - ✅ Топ по количеству слов
  - ✅ User position lookup (узнать свою позицию)
  - ✅ Nearby users (±5 позиций вокруг)
  - ✅ Global statistics (highest, averages)
  - ✅ Window functions (ROW_NUMBER) для ранжирования
  - ✅ Таблица leaderboard_cache для оптимизации
  - [ ] UI для отображения лидерборда (будущая версия)
  - [ ] Weekly/Monthly periods (будущая версия)

- [ ] **Локальные рейтинги**
  - Рейтинг среди друзей
  - Рейтинг по стране/городу
  - Рейтинг по учебному заведению

### 3.7 Менторство и комьюнити
- [ ] **Программа менторов**
  - Опытные пользователи помогают новичкам
  - Бонусы за менторство

- [ ] **Форум/Дискуссии**
  - Q&A по языкам
  - Советы и лайфхаки
  - Мотивационные посты

### 3.8 Интеграции с соцсетями
- [ ] **Шеринг достижений**
  - Поделиться в Instagram/Twitter/VK
  - Автогенерация красивых карточек
  - "Я выучил 100 слов в FluentFlow!"

- [ ] **Приглашения друзей**
  - Реферальная программа
  - Бонусы за приглашённых друзей

---

## 4. 🛠️ Технический стек (предложения)

### Frontend
- **Framework**: React 18 / Vue 3 + TypeScript
- **Styling**: Tailwind CSS / UnoCSS
- **Animations**: Framer Motion / GSAP
- **State Management**: Zustand / Pinia
- **Forms**: React Hook Form / VeeValidate
- **Charts**: Chart.js / Recharts
- **PWA**: Vite PWA Plugin

### Backend
- **API**: REST → GraphQL (Apollo Server)
- **Real-time**: WebSockets (Socket.io) для дуэлей
- **Queue**: Bull/BullMQ для фоновых задач
- **Notifications**: Push API + Email (SendGrid/Nodemailer)

### Database
- **PostgreSQL** (уже есть)
- **Redis** для кеширования и real-time данных
- **Migrations**: Prisma ORM

### DevOps
- **CI/CD**: GitHub Actions
- **Мониторинг**: Sentry для ошибок
- **Аналитика**: Mixpanel / PostHog

---

## 5. 📅 Дорожная карта (Roadmap)

### Phase 1: Фундамент (2-3 месяца)
1. Настройка нового tech stack
2. Миграция на React/Vue + TypeScript
3. Базовая геймификация (XP, уровни, стрики)
4. Редизайн главных экранов

### Phase 2: Геймификация (1-2 месяца)
1. Система достижений
2. Ежедневные задания
3. Внутриигровая валюта
4. Расширенная статистика

### Phase 3: Социальные функции (2-3 месяца)
1. Профили и друзья
2. Лидерборды
3. 1-на-1 дуэли
4. Обмен наборами слов

### Phase 4: Community & Scale (ongoing)
1. Групповые турниры
2. Форум и менторство
3. Mobile apps (React Native)
4. Монетизация (Premium подписка)

---

## 6. 💡 Дополнительные идеи

### AI-фичи
- [ ] **Персонализированные рекомендации**
  - ML-модель предлагает слова на основе прогресса

- [ ] **Умный ассистент**
  - Chatbot для ответов на вопросы
  - Помощь в составлении учебного плана

- [ ] **Генерация контента**
  - GPT-генерация примеров использования слов
  - Создание упражнений на основе интересов пользователя

### Gamification+
- [ ] **Виртуальный питомец**
  - Питомец "растёт" с прогрессом пользователя
  - Нужно "кормить" выполнением заданий

- [ ] **Коллекционные карточки**
  - Редкие карточки слов
  - Обмен с друзьями

### Accessibility
- [ ] **Поддержка специальных возможностей**
  - Screen reader support
  - Keyboard navigation
  - Настройка размера шрифтов
  - Цветовые схемы для дальтоников

---

## 7. 🎯 Метрики успеха (KPIs)

- **DAU/MAU** (Daily/Monthly Active Users)
- **Retention Rate** (Day 1, Day 7, Day 30)
- **Average Session Time**
- **Words Learned per User**
- **Streak Maintenance Rate**
- **Social Features Engagement** (% users with friends, duels played)
- **Conversion to Premium** (если будет монетизация)

---

## 8. 🐛 Система репортов и обратной связи

### 8.1 Управление тестировщиками
- [x] **Beta-тестеры в базе данных** ✅ ГОТОВО (Backend)
  - ✅ Флаг `is_beta_tester` в таблице users (server-postgresql.js:228-239)
  - ✅ API для администратора: PUT /api/admin/users/:userId/beta-tester
  - ✅ API для проверки статуса: GET /api/users/:userId/beta-tester
  - [ ] Список всех beta-тестеров с их статистикой (будущая версия)
  - [ ] Возможность массового включения/выключения beta-доступа (будущая версия)

### 8.2 UI для отправки репортов
- [ ] **Плавающая кнопка для репортов** 🎯 ВЫСОКИЙ ПРИОРИТЕТ
  - Floating action button (FAB) в правом нижнем углу на всех страницах
  - Видна только для beta-тестеров (проверка is_beta_tester)
  - Иконка: 🐛 или 📝 "Сообщить о проблеме"
  - При наведении - tooltip "Отправить отчёт (Beta)"
  - Анимация пульсации для привлечения внимания
  - Dark mode поддержка

- [ ] **Модальное окно репорта**
  - Заголовок: "Отправить отчёт о проблеме / предложение"
  - Поле "Тип": Bug / Feature Request / UI Issue / Performance / Other
  - Текстовое поле (textarea) для описания (обязательное, min 20 символов)
  - Автоматический сбор контекста:
    - Текущая страница/секция приложения
    - Browser User Agent
    - Screen resolution
    - Текущий язык обучения (если применимо)
    - Timestamp
  - Загрузка скриншотов (drag & drop или click to upload)
  - Поддержка множественных изображений (до 5 файлов, макс 5MB каждый)
  - Превью загруженных изображений с возможностью удаления
  - Кнопка "Прикрепить скриншот текущей страницы" (автоматический screenshot через html2canvas)
  - Email для обратной связи (опционально, prefill из профиля)
  - Чекбокс "Отправить технические данные для диагностики" (console logs, errors)
  - Priority: Low / Medium / High (только для критичных багов)
  - Кнопки: "Отправить" и "Отмена"

### 8.3 Backend для репортов
- [x] **API endpoints** ✅ ГОТОВО (server-postgresql.js:1584-1984)
  - ✅ `POST /api/reports` - создание нового репорта (с multipart/form-data, до 5 скриншотов)
  - ✅ `GET /api/reports` - список всех репортов с фильтрацией (status, type, priority, userId)
  - ✅ `GET /api/reports/:reportId` - детали репорта (с attachments, comments, votes)
  - ✅ `PUT /api/admin/reports/:reportId` - обновление статуса/приоритета/назначения
  - ✅ `POST /api/reports/:reportId/comments` - добавление комментария
  - ✅ `POST /api/reports/:reportId/vote` - голосование (upvote, important, me_too)
  - ✅ `DELETE /api/admin/reports/:reportId` - удаление репорта
  - ✅ `GET /api/reports/stats/summary` - статистика по репортам
  - ✅ Проверка beta_tester статуса для создания репортов
  - ✅ Автоматический сбор контекста (pageUrl, browserInfo, screenResolution)

- [x] **База данных** ✅ ГОТОВО (server-postgresql.js:241-296)
  - ✅ Таблица `reports` (id, user_id, report_type, title, description, page_url, browser_info, screen_resolution, status, priority, assigned_to, github_issue_number, timestamps)
  - ✅ Таблица `report_attachments` (id, report_id, filename, filepath, mimetype, size, timestamp)
  - ✅ Таблица `report_comments` (id, report_id, user_id, comment_text, is_internal, timestamp)
  - ✅ Таблица `report_votes` (id, report_id, user_id, vote_type, timestamp, UNIQUE constraint)
  - ✅ CASCADE deletion для связанных данных
  - ✅ Status workflow: open → in_progress → resolved → closed
  - ✅ Priority levels: low, medium, high, critical
  - ✅ Report types: bug, feature, improvement, question

### 8.4 Админ-панель для репортов
- [ ] **Dashboard для администратора**
  - Список всех репортов с фильтрами:
    - По статусу (New, In Progress, Resolved, Closed)
    - По типу (Bug, Feature Request, etc.)
    - По приоритету (Low, Medium, High)
    - По дате (последние 7 дней, 30 дней, все)
  - Счетчики: новых репортов, в работе, решённых за последние 7 дней
  - Детальный просмотр репорта:
    - Информация о пользователе (username, email, уровень, статистика)
    - Описание проблемы
    - Все прикреплённые скриншоты (галерея с lightbox)
    - Технический контекст (браузер, разрешение, страница)
    - История изменений статуса
    - Комментарии (от пользователя и админа)
  - Действия:
    - Изменить статус
    - Изменить приоритет
    - Добавить комментарий
    - Отметить как дубликат
    - Удалить (soft delete)
    - Связать с GitHub issue (интеграция)

### 8.5 Уведомления
- [ ] **Email уведомления**
  - Администратору: новый репорт от beta-тестера (с приоритетом)
  - Пользователю: статус изменён (In Progress, Resolved)
  - Пользователю: админ оставил комментарий
  - Digest email (ежедневный summary для админа с новыми репортами)

- [ ] **In-app уведомления**
  - Toast notification после успешной отправки репорта
  - Badge на иконке настроек, если есть обновления по его репортам
  - История отправленных репортов в профиле пользователя

### 8.6 Интеграции
- [ ] **GitHub Issues автоматизация**
  - Автоматическое создание GitHub issue из репорта (с лейблами)
  - Синхронизация статусов (GitHub issue closed → report resolved)
  - Прикрепление скриншотов к issue
  - Ссылка на GitHub issue в админ-панели

- [ ] **Аналитика репортов**
  - Статистика: сколько багов/фич запрошено за период
  - Топ-5 самых активных beta-тестеров
  - Среднее время решения репорта
  - Распределение по типам (pie chart)
  - Тренды (количество репортов по неделям)

### 8.7 Дополнительные возможности
- [ ] **Голосование за feature requests**
  - Пользователи могут upvote чужие feature requests
  - Сортировка по популярности
  - Публичная roadmap с топовыми запросами

- [ ] **Attachments сверх скриншотов**
  - Видео-запись экрана (WebRTC Screen Capture API)
  - Логи консоли (автоматический сбор последних 50 строк)
  - Network requests (HAR файлы для debugging)

- [ ] **Gamification для beta-тестеров**
  - Достижение "Bug Hunter" 🐛 за первый репорт
  - Достижение "QA Master" за 10+ репортов
  - Ачивка "Critical Finder" за найденный критичный баг
  - Лидерборд beta-тестеров (по количеству полезных репортов)

---

## 9. 🔧 Финальная оптимизация и рефакторинг

### 9.1 Код и архитектура
- [ ] **Аудит кодовой базы**
  - Поиск дублирования кода (DRY principle)
  - Выявление неиспользуемых функций и переменных
  - Проверка соответствия code style guide
  - Анализ complexity metrics (цикломатическая сложность)

- [ ] **Рефакторинг backend**
  - Разделение server-postgresql.js на модули (routes, controllers, models)
  - Вынос business logic из endpoints в отдельные service классы
  - Улучшение error handling (единая система обработки ошибок)
  - Добавление input validation (Joi/Yup схемы)
  - Удаление устаревших endpoints
  - Документация API (Swagger/OpenAPI)

- [ ] **Рефакторинг frontend**
  - Разделение app.js на модули (по функциональности)
  - Вынос повторяющихся DOM операций в helpers
  - Унификация работы с API (единый API client класс)
  - Улучшение state management
  - Удаление неиспользуемых CSS правил
  - Минификация и бандлинг (Webpack/Vite)

- [ ] **Очистка файлов**
  - Удаление старых/неиспользуемых файлов (database.js, старые миграции)
  - Удаление закомментированного кода
  - Удаление console.log и debug кода
  - Очистка node_modules и package-lock
  - Проверка .gitignore на актуальность

### 9.2 База данных
- [ ] **Оптимизация PostgreSQL**
  - Добавление недостающих индексов (EXPLAIN ANALYZE)
  - Оптимизация медленных запросов
  - Нормализация таблиц (если есть избыточность)
  - Архивирование старых данных
  - Настройка connection pooling
  - Backup стратегия

- [ ] **Миграции**
  - Документирование всех миграций
  - Добавление rollback скриптов
  - Версионирование схемы БД

### 9.3 Производительность
- [ ] **Frontend оптимизация**
  - Lazy loading для изображений
  - Code splitting (разделение на chunks)
  - Service Worker оптимизация (кеш стратегии)
  - Минификация CSS/JS
  - Сжатие изображений (WebP, оптимизация PNG)
  - Tree shaking (удаление неиспользуемого кода)
  - Lighthouse audit (цель: 90+ score)

- [ ] **Backend оптимизация**
  - Response compression (gzip/brotli)
  - API response caching (Redis)
  - Rate limiting для защиты от DDoS
  - Query optimization (N+1 problem)
  - Connection pooling
  - CDN для статических файлов

- [ ] **Мониторинг производительности**
  - Логирование медленных запросов
  - Трекинг API response times
  - Memory leaks detection
  - Error tracking (Sentry)

### 9.4 Безопасность
- [ ] **Security audit**
  - SQL injection защита (prepared statements)
  - XSS защита (sanitization)
  - CSRF tokens
  - Rate limiting
  - Helmet.js для Express security headers
  - Обновление зависимостей (npm audit fix)
  - Secrets management (переменные окружения)
  - HTTPS enforcement

- [ ] **Аутентификация**
  - JWT refresh tokens
  - Secure cookie settings
  - Password strength validation
  - Account lockout после неудачных попыток
  - 2FA (будущая версия)

### 9.5 Тестирование
- [ ] **Unit тесты**
  - Backend functions (80%+ coverage)
  - Frontend utilities
  - Database queries

- [ ] **Integration тесты**
  - API endpoints (все критичные routes)
  - Authentication flow
  - Gamification system

- [ ] **E2E тесты**
  - User registration → login → word import → quiz flow
  - Critical user journeys
  - Playwright/Cypress

### 9.6 DevOps и деплой
- [ ] **CI/CD pipeline**
  - Automated testing on push
  - Automated deployment (Railway/Vercel)
  - Staging environment
  - Production deployment strategy

- [ ] **Мониторинг**
  - Uptime monitoring (UptimeRobot)
  - Error tracking (Sentry)
  - Analytics (PostHog/Mixpanel)
  - Server logs aggregation

- [ ] **Документация**
  - README.md обновление
  - API документация (Swagger)
  - Deployment guide
  - Contributing guidelines
  - User manual (для пользователей)

### 9.7 Структура проекта
- [ ] **Реорганизация папок**
  ```
  ├── server/
  │   ├── routes/          # API endpoints
  │   ├── controllers/     # Business logic
  │   ├── models/          # DB models
  │   ├── middleware/      # Auth, validation
  │   ├── services/        # Helper services
  │   └── config/          # Configuration
  ├── public/
  │   ├── js/
  │   │   ├── core/        # app.js, database.js
  │   │   ├── features/    # gamification, analytics
  │   │   └── utils/       # helpers, theme
  │   ├── css/
  │   ├── images/
  │   └── index.html
  ├── tests/
  │   ├── unit/
  │   ├── integration/
  │   └── e2e/
  └── docs/
  ```

### 9.8 Package dependencies
- [ ] **Обновление зависимостей**
  - npm outdated → npm update
  - Major version updates (breaking changes)
  - Security patches
  - Удаление неиспользуемых пакетов

- [ ] **Bundle size оптимизация**
  - Анализ bundle size (webpack-bundle-analyzer)
  - Замена тяжелых библиотек на легкие альтернативы
  - Tree shaking
  - Dynamic imports

---

**Создано**: 2025-10-09
**Обновлено**: 2025-10-13
**Версия плана**: 1.1
**Приоритет**: HIGH

*"Превратим изучение языков в увлекательное приключение!"* 🚀
