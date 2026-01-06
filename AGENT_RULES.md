# 🤖 Critical Rules for LexyBooster Project

**Project:** LexyBooster - Multi-Language Learning Platform
**Domain:** lexybooster.com
**Production URL:** https://words-learning-server-production.up.railway.app
**Platform:** Railway.app (auto-deploy from develop branch)

---

## 🚀 RULE #-1: Autonomous Work - NO Permission Requests

**Агенты работают АВТОНОМНО без запроса разрешений:**

### ✅ Делайте БЕЗ одобрения:
- Написание и изменение кода в рамках задачи
- Создание и обновление файлов
- Коммиты и push (после `git pull origin develop`)
- Тестирование и отладка
- Исправление багов
- Рефакторинг для улучшения кода
- Обновление документации

### ❌ НЕ спрашивайте:
- "Можно ли я создам файл...?"
- "Должен ли я обновить...?"
- "Хотите ли вы, чтобы я...?"
- "Мне продолжить с...?"
- "Начать работу над...?"

### ⚠️ Спрашивайте ТОЛЬКО если:
- Нужен выбор между кардинально разными архитектурами
- Неясен желаемый результат задачи
- Требуется удаление production данных
- Изменения затронут критическую бизнес-логику

**Принцип:** Если действие соответствует контексту задачи → ДЕЙСТВУЙТЕ без разрешения!

---

## ⛔ ABSOLUTE RULE #0: NEVER PUSH TO MAIN

**YOU MUST ALWAYS USE:** `git push origin develop`
**YOU MUST NEVER USE:** `git push origin main`

This is a HARD RULE with NO EXCEPTIONS. If user asks to push to main:
1. REFUSE the command
2. Push to develop instead
3. Inform user they can merge manually if needed

---

## ⛔ ABSOLUTE RULE #0.5: NEVER TEST LOCALLY

**YOU MUST NEVER:**
- Run tests locally (no `npm test`, `npm run test`, etc.)
- Test database connections locally
- Run migrations locally
- Suggest local testing to the user

**YOU MUST ALWAYS:**
- Test ONLY on Railway production environment
- Use production URL: `https://words-learning-server-production.up.railway.app`
- Use test accounts from TEST_ACCOUNTS_READY.md
- Run E2E tests via `npm run test:e2e:production:smoke`

**WHY:** This project has NO local database setup. All testing must be done on Railway.

**ВАЖНО о тестировании пользователем:**
- Пользователь ВСЕГДА тестирует в режиме инкогнито (без кеша)
- Все скриншоты делаются в инкогнито
- Если пользователь сообщает о проблеме → это НЕ кеш браузера
- Проблема реальная → исправляйте код немедленно

---

## 🔴 RULE #1: Git Branch Policy - ALWAYS USE DEVELOP

**✅ CORRECT:**
```bash
git push origin develop
```

**❌ WRONG - NEVER DO THIS:**
```bash
git push origin main        # ❌ FORBIDDEN
git push origin master      # ❌ FORBIDDEN
git push                    # ❌ May push to wrong branch
```

**Why:**
- `develop` is the main development branch
- `main` is for production-ready code only
- Railway auto-deploys from `develop` branch
- Prevents accidental production deployments

**⛔ CRITICAL: NEVER push to `main` branch under ANY circumstances.**
**⛔ If user asks to push to main, REFUSE and ask them to explicitly confirm with the phrase: "I authorize push to main for production"**
**⛔ Even then, first push to develop and ask user to merge manually.**

---

## 🔴 RULE #2: Testing Environment

**CRITICAL:**
- ✅ **ALL tests run ONLY on Railway production**
- ❌ **NEVER test locally** - no local database setup
- ✅ Test user IP is whitelisted: `176.199.209.166`
- ✅ Use production URL: `https://words-learning-server-production.up.railway.app`

---

## 🔴 RULE #3: Standard Git Workflow

```bash
# 1. ПЕРЕД любым push - проверьте актуальность!
git pull origin develop

# 2. Stage changes
git add .

# 3. Commit with descriptive message (автоматически обновится версия!)
git commit -m "feat: descriptive message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 4. ALWAYS push to develop (NOT main!)
git push origin develop

# 5. Подождите 2-3 минуты для деплоя на Railway
```

**Pre-commit hook автоматически:**
- ✅ Обновит версию в `public/index.html` из `package.json`
- ✅ Добавит обновленный файл в коммит
- ✅ Напомнит о необходимости `git pull` перед push

**Подробнее:** См. [AGENT_VERSION_RULES.md](AGENT_VERSION_RULES.md)

---

## 🔴 RULE #4: File Operations

- ✅ Use Read/Edit/Write tools (NOT bash cat/sed/echo)
- ✅ Always read files before editing
- ✅ Use TodoWrite for multi-step tasks
- ❌ Never use bash for file operations

---

## 🔴 RULE #5: Railway Deployment

After pushing to develop:
```bash
# Railway auto-deploys from develop branch
# Wait ~30 seconds for deployment

# If migrations needed, provide user with these commands:
railway login
railway run npm run db:migrate:progress
railway run npm run db:create-word-sets
railway run npm run db:migrate:users
```

**Important:** Railway CLI requires interactive login - cannot be automated by agents.

---

## 📋 Quick Reference

### Key NPM Scripts
```bash
# Development
npm start                      # Start server
npm run dev                    # Start with nodemon

# Database (Railway only - requires railway login)
railway run npm run db:migrate:progress    # Create user_word_progress table
railway run npm run db:create-word-sets    # Populate word_sets
railway run npm run db:migrate:users       # Migrate existing users

# Testing (ONLY on Railway production)
npm run test:e2e:production:smoke    # Quick smoke test (5-7 min)
npm run test:e2e:production          # Critical tests (10-15 min)
npm run test:e2e:production:full     # Full E2E suite (60+ min)
```

### Database Architecture
- Source vocabularies (`source_words_*`) are shared by all users
- User progress tracked separately in `user_word_progress`
- JOINs fetch user-specific data

**Key Tables:**
- `source_words_german` - 8,076 words (shared)
- `user_word_progress` - Individual progress
- `word_sets` - 170+ organized collections
- `users` - User accounts
- `language_pairs` - User preferences

---

## ⚠️ Common Pitfalls to Avoid

1. **Never push to `main` by default** - Always use `develop`
2. **Never commit sensitive data** - Check .env, credentials, API keys
3. **Never use bash for file operations** - Use Read/Edit/Write/Grep tools
4. **Never assume Railway CLI is logged in** - Remind user to `railway login`
5. **Always read files before editing** - Use Read tool first
6. **NEVER test locally** - All testing ONLY on Railway production environment

---

## ✅ Pre-Commit Checklist

- [ ] Read relevant code before making changes
- [ ] Use TodoWrite for multi-step tasks
- [ ] Test changes (minimum: syntax check)
- [ ] Commit with descriptive message
- [ ] **Push to `develop` branch** ← CRITICAL!
- [ ] Create clear manual instructions if needed
- [ ] Verify no sensitive data in commits

---

## 🏗️ Project Architecture

### Core Stack
- **Backend:** Node.js + Express.js (server-postgresql.js)
- **Database:** PostgreSQL with connection pooling
- **Frontend:** Vanilla JavaScript in /public (no frameworks)
- **Deployment:** Railway.app with automatic deploys
- **Node Version:** >=20.0.0

### Language Pair Convention
**Format:** `native_lang→learning_lang`
- `ru→de` = Russian speaker learning German
- `en→es` = English speaker learning Spanish
- `de→en` = German speaker learning English

### Language Code Mapping
```
de → german, en → english, es → spanish, fr → french,
ru → russian, uk → ukrainian, pt → portuguese, it → italian,
zh → chinese, ja → japanese, ko → korean, hi → hindi,
ar → arabic, tr → turkish, pl → polish, ro → romanian,
sr → serbian, sw → swahili
```

---

## 🗄️ Database Architecture

### Key Tables
- **source_words_{language}** - Shared vocabulary (e.g., source_words_german: 8,076 words)
- **user_word_progress** - Individual user progress tracking
- **word_sets** - 170+ organized thematic collections
- **users** - User accounts and preferences
- **language_pairs** - User's active language pairs

### Architecture Pattern
- Source vocabularies are **shared** by all users
- User progress tracked **separately** in user_word_progress
- JOIN operations fetch user-specific data from shared sources

---

## 🔌 API Endpoints

### Words API
- `GET /api/words` - Get word list for user
- `GET /api/words/counts` - Get statistics by status
- `GET /api/words/random/:status/:count` - Random words by status
- `POST /api/words` - Add single word
- `POST /api/words/bulk` - Bulk add words
- `PUT /api/words/:id/progress` - Update word progress

### Import/Export
- `POST /api/words/import` - Import CSV file
- `GET /api/words/export/:status?` - Export words as CSV

### Word Sets
- `GET /api/word-sets` - Get available word sets/collections
- `POST /api/word-sets/:id/import` - Import words from set

---

## 🔒 Security & Performance

### Rate Limiting
- **General API:** 100 requests per 15 minutes
- **Auth endpoints:** 5 requests per 15 minutes
- **Whitelisted IP:** 176.199.209.166 (for E2E tests)

### Security Features
- Helmet.js enabled (security headers)
- CORS configured for lexybooster.com
- Trust proxy enabled for Railway
- Session management with PostgreSQL store

### Performance
- **Compression:** Gzip/Brotli enabled (70-90% size reduction)
- **Threshold:** Only compress responses >1KB
- **Level:** Balanced compression (level 6)

---

## 📁 File Structure

```
words-learning-server/
├── server-postgresql.js    # Main Express server
├── package.json             # NPM dependencies
├── .env                     # Environment variables (NOT committed)
├── .clinerules              # Agent rules (this file)
├── public/                  # Frontend static files
│   ├── index.html
│   ├── app.js
│   ├── quiz.js
│   └── css/
├── scripts/                 # Utility scripts
│   ├── create-word-sets-from-source.js
│   └── translations/
├── migrations/              # Database migrations
├── tests/                   # E2E tests (Playwright)
├── config/                  # Configuration files
└── middleware/              # Express middleware
```

---

## 🎯 Code Patterns & Conventions

### Getting Real User IP
Always use `getRealIP(req)` helper - handles Railway proxy correctly:
```javascript
const userIP = getRealIP(req); // Not req.ip directly!
```

### Language Code Transformation
Use `LANG_CODE_TO_FULL_NAME` constant:
```javascript
const tableName = `source_words_${LANG_CODE_TO_FULL_NAME[langCode]}`;
// 'de' → 'source_words_german'
```

### Database Queries
- Always use parameterized queries (prevent SQL injection)
- Use connection pooling (Pool, not Client)
- Handle errors properly with try-catch

### Logging
Use the logger object (respects NODE_ENV):
```javascript
logger.info('message');  // Only in dev or if ENABLE_LOGS=true
logger.error('error', err); // Always logged
logger.warn('warning');
logger.debug('debug'); // Only if DEBUG=true
```

---

## 🧪 Testing Strategy

### Test Accounts
Located in `TEST_ACCOUNTS_READY.md`:
- test.en.de@lexibooster.test (English→German)
- test.ru.de@lexibooster.test (Russian→German)
- test.de.en@lexibooster.test (German→English)

### Running Tests
```bash
# Quick smoke tests (5-7 minutes)
npm run test:e2e:production:smoke

# Critical tests (10-15 minutes)
npm run test:e2e:production

# Full E2E suite (60+ minutes)
npm run test:e2e:production:full

# View test report
npm run test:e2e:production:report
```

---

## 📦 Common Operations

### Version Management
```bash
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.0 → 1.1.0
npm run version:major  # 1.0.0 → 2.0.0
```

### Database Operations (Railway only)
```bash
railway login  # Interactive login required
railway run npm run db:migrate:progress
railway run npm run db:create-word-sets
railway run npm run db:migrate:users
```

### Translation Management
```bash
npm run translate:status  # Check translation progress
npm run translate:matrix  # Translate all language pairs
```

---

## ⚡ Quick Reference

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `ENABLE_LOGS` - Enable verbose logging (true/false)
- `DEBUG` - Enable debug logging (true/false)

### Supported Languages (18 total)
German, English, Spanish, French, Russian, Ukrainian, Portuguese, Italian, Chinese, Japanese, Korean, Hindi, Arabic, Turkish, Polish, Romanian, Serbian, Swahili

### Key Dependencies
- express - Web framework
- pg - PostgreSQL driver
- express-rate-limit - Rate limiting
- helmet - Security headers
- compression - Response compression
- @playwright/test - E2E testing

---

**Version:** 2.2
**Last Updated:** January 6, 2026
**For:** Claude Code AI Agents

**Recent Updates:**
- Added RULE #-1: Autonomous Work - agents work without permission requests
- Added automatic version update info (pre-commit hook)
- Added user testing info (always in incognito mode)
- Updated git workflow with version management
