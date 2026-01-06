# 📋 Полный План Покрытия Тестами - LexyBooster

**Дата создания:** 2026-01-02
**Статус:** В разработке
**Цель:** 100% покрытие критической функциональности

---

## 🎯 Executive Summary

### Текущее состояние
- ✅ **E2E тесты:** Отличное покрытие (аутентификация, отображение, фильтрация)
- ⚠️ **API тесты:** 30% эндпоинтов покрыто
- ❌ **Тесты компонентов:** Практически отсутствуют
- ❌ **Unit тесты:** Минимальное покрытие
- ✅ **Алгоритмы:** Хорошее покрытие (SRS, геймификация)

### Приоритет
1. 🔴 **Критично:** Квиз-система, Импорт слов, Analytics API
2. 🟡 **Важно:** Социальные фичи, Onboarding, Mobile
3. 🟢 **Полезно:** Accessibility, Performance, Cross-browser

---

## 📊 Детальный План по Категориям

## 1️⃣ ПРИОРИТЕТ 1: КРИТИЧЕСКИЕ ТЕСТЫ (2-3 недели)

### 1.1 Quiz System - E2E тесты ⭐⭐⭐

**Статус:** ❌ Не покрыто
**Файл:** `tests/e2e/quiz-system.spec.js` (создать)
**Приоритет:** КРИТИЧЕСКИЙ

#### Тест-кейсы:

**1.1.1 Multiple Choice Quiz**
```javascript
test('Multiple choice - correct answer awards points', async ({ page }) => {
  // Login -> Start quiz -> Answer correctly -> Check XP
});

test('Multiple choice - wrong answer shows correct answer', async ({ page }) => {
  // Answer incorrectly -> Verify correct answer displayed
});

test('Multiple choice - German articles validation', async ({ page }) => {
  // Test "der/die/das" article handling
});
```

**1.1.2 Reverse Multiple Choice**
```javascript
test('Reverse quiz - shows target word, asks for source', async ({ page }) => {
  // Verify reverse direction works
});
```

**1.1.3 Word Building (Scramble)**
```javascript
test('Word building - assemble word from letters', async ({ page }) => {
  // Test letter scramble functionality
});

test('Word building - handles accents correctly', async ({ page }) => {
  // Test: café, Müller, etc.
});
```

**1.1.4 Typing Quiz**
```javascript
test('Typing quiz - exact match validation', async ({ page }) => {
  // Type exact word -> Verify acceptance
});

test('Typing quiz - Levenshtein distance tolerance', async ({ page }) => {
  // Type word with 1-2 typos -> Verify acceptance/rejection
});

test('Typing quiz - case insensitive matching', async ({ page }) => {
  // Test uppercase/lowercase handling
});
```

**1.1.5 Quiz Completion**
```javascript
test('Quiz completion - shows results summary', async ({ page }) => {
  // Complete quiz -> Verify results screen
});

test('Quiz completion - awards XP correctly', async ({ page }) => {
  // Check XP before/after quiz
});

test('Quiz completion - unlocks achievements', async ({ page }) => {
  // First quiz -> "First Steps" achievement
});

test('Quiz completion - updates SRS intervals', async ({ page }) => {
  // Verify next_review_at updated in DB
});
```

**Файлы для тестирования:**
- [public/quiz.js](public/quiz.js) - основная логика квиза
- [public/quiz-ui.js](public/quiz-ui.js) - UI компоненты
- API: `/api/study/sessions/:sessionId/cards` (GET)
- API: `/api/study/sessions/:sessionId/answer` (POST)

---

### 1.2 Word Import & Deduplication - Unit тесты ⭐⭐⭐

**Статус:** ⚠️ Частично покрыто E2E
**Файл:** `tests/unit/word-import.test.js` (создать)
**Приоритет:** КРИТИЧЕСКИЙ

#### Тест-кейсы:

```javascript
describe('Word Import Logic', () => {
  test('should normalize words before comparison', () => {
    // Test: "Café" vs "cafe" vs "CAFÉ"
  });

  test('should detect exact duplicates', () => {
    // Import "hello" twice -> Only 1 word in DB
  });

  test('should handle German umlauts in deduplication', () => {
    // "Müller" vs "Muller" - should be different
  });

  test('should prevent duplicate imports from overlapping sets', () => {
    // A1 + A2 sets have overlap -> No duplicates
  });

  test('should validate CSV format', () => {
    // Test malformed CSV handling
  });

  test('should handle empty lines in CSV', () => {
    // CSV with blank lines -> Skip them
  });

  test('should handle very long words (>100 chars)', () => {
    // Reject or truncate?
  });

  test('should handle special characters in words', () => {
    // Test: emoji, unicode, etc.
  });
});
```

**API тесты:**
```javascript
describe('Import API', () => {
  test('POST /api/word-sets/:setId/import - success', async () => {
    // Import 10 words -> Verify count
  });

  test('POST /api/word-sets/:setId/import - duplicate prevention', async () => {
    // Import same set twice -> Same count
  });

  test('POST /api/word-sets/:setId/import - partial import', async () => {
    // Import selected words only
  });

  test('POST /api/word-sets/:setId/import - handles large batches', async () => {
    // Import 2999 words -> Should not timeout
  });
});
```

---

### 1.3 Analytics API - Integration тесты ⭐⭐

**Статус:** ❌ Не покрыто
**Файл:** `tests/api/analytics-api.test.js` (создать)
**Приоритет:** ВЫСОКИЙ

#### API эндпоинты для тестирования:

```javascript
describe('Analytics API', () => {
  // Progress Analytics
  test('GET /api/analytics/progress/:userId', async () => {
    // Should return words learned, review accuracy, etc.
  });

  // Exercise Statistics
  test('GET /api/analytics/exercise-stats/:userId', async () => {
    // Should return quiz stats per type
  });

  // Difficult Words
  test('GET /api/analytics/difficult-words/:userId', async () => {
    // Should return words with low ease_factor
  });

  // Study Time Tracking
  test('GET /api/analytics/study-time/:userId', async () => {
    // Should return time spent studying per day
  });

  // Fluency Prediction
  test('GET /api/analytics/fluency-prediction/:userId', async () => {
    // Should return CEFR level prediction
  });

  // Edge cases
  test('GET /api/analytics/progress/:userId - new user', async () => {
    // User with 0 words -> Empty stats
  });

  test('GET /api/analytics/progress/:userId - unauthorized', async () => {
    // Different userId -> 403 Forbidden
  });
});
```

---

### 1.4 Gamification - E2E + Integration тесты ⭐⭐

**Статус:** ⚠️ Unit тесты есть, E2E нет
**Файлы:**
- `tests/e2e/gamification-flow.spec.js` (создать)
- `tests/integration/achievements.test.js` (создать)

#### E2E тест-кейсы:

```javascript
describe('Gamification Flow', () => {
  test('User earns XP from quiz completion', async ({ page }) => {
    // Before: XP = 0
    // Complete quiz (5 correct answers)
    // After: XP = 50 (10 XP per correct answer)
  });

  test('User levels up after earning enough XP', async ({ page }) => {
    // Earn 100 XP -> Level 2
    // Verify level-up animation shown
  });

  test('User unlocks "First Steps" achievement', async ({ page }) => {
    // Complete first quiz -> Achievement popup
  });

  test('User unlocks "Streak Master" achievement', async ({ page }) => {
    // Study 7 days in a row -> Achievement unlocked
  });

  test('Leaderboard displays user rank', async ({ page }) => {
    // Navigate to leaderboard -> Verify rank shown
  });

  test('Daily goals update progress', async ({ page }) => {
    // Set goal: 20 words/day
    // Learn 10 words -> Progress = 50%
  });
});
```

#### API тесты:

```javascript
describe('Gamification API', () => {
  test('POST /api/gamification/award-xp', async () => {
    // Award 50 XP -> Verify DB updated
  });

  test('GET /api/gamification/achievements/:userId/progress', async () => {
    // Should return progress towards each achievement
  });

  test('GET /api/gamification/leaderboard', async () => {
    // Should return top 10 users by XP
  });

  test('GET /api/gamification/leaderboard/weekly', async () => {
    // Should return weekly leaderboard
  });

  test('PUT /api/gamification/daily-goals/:userId', async () => {
    // Update goal from 20 to 50 words/day
  });
});
```

---

## 2️⃣ ПРИОРИТЕТ 2: ВАЖНЫЕ ТЕСТЫ (3-4 недели)

### 2.1 Onboarding Flow - E2E тесты ⭐

**Статус:** ⚠️ Базовые E2E есть
**Файл:** `tests/e2e/onboarding-complete.spec.js` (расширить)

#### Дополнительные тест-кейсы:

```javascript
describe('Onboarding - Extended', () => {
  test('Step 1 - Language selection validation', async ({ page }) => {
    // Try to proceed without selecting -> Error shown
  });

  test('Step 2 - Daily goal options', async ({ page }) => {
    // Select 10/20/50 words per day -> Saved correctly
  });

  test('Step 3 - Theme selection', async ({ page }) => {
    // Select dark/light theme -> Applied immediately
  });

  test('Back button navigation works', async ({ page }) => {
    // Step 3 -> Back -> Step 2 -> Data preserved
  });

  test('Complete onboarding -> Redirect to dashboard', async ({ page }) => {
    // Finish wizard -> Redirect to /dashboard
  });

  test('Skip onboarding -> Direct to dashboard', async ({ page }) => {
    // Click "Skip" -> Redirect with default settings
  });

  test('Onboarding not shown to existing users', async ({ page }) => {
    // Login existing user -> No onboarding wizard
  });
});
```

#### API тесты:

```javascript
describe('Onboarding API', () => {
  test('POST /api/auth/complete-onboarding', async () => {
    // Complete onboarding -> onboarding_completed = true
  });

  test('GET /api/user/needs-onboarding', async () => {
    // New user -> Returns true
    // Existing user -> Returns false
  });

  test('POST /api/onboarding/import-word-sets', async () => {
    // Import initial sets during onboarding
  });
});
```

---

### 2.2 Social Features - E2E тесты ⭐

**Статус:** ❌ Полностью не покрыто
**Файлы:**
- `tests/e2e/duels.spec.js` (создать)
- `tests/e2e/friends.spec.js` (создать)
- `tests/e2e/leagues.spec.js` (создать)

#### Duels тесты:

```javascript
describe('Duels', () => {
  test('User can challenge friend to duel', async ({ page }) => {
    // Send duel challenge -> Friend receives notification
  });

  test('Duel gameplay - both players answer questions', async ({ page }) => {
    // Simultaneous quiz -> Higher score wins
  });

  test('Duel results - winner gets bonus XP', async ({ page }) => {
    // Win duel -> +20 bonus XP
  });

  test('Duel declined - notification sent', async ({ page }) => {
    // Decline challenge -> Challenger notified
  });
});
```

#### Friends тесты:

```javascript
describe('Friends System', () => {
  test('Send friend request', async ({ page }) => {
    // Search user -> Send request -> Pending status
  });

  test('Accept friend request', async ({ page }) => {
    // Accept request -> Friends list updated
  });

  test('Remove friend', async ({ page }) => {
    // Remove friend -> Confirmation dialog -> Removed
  });

  test('View friend activity', async ({ page }) => {
    // Friends tab -> See recent activity
  });
});
```

#### Leagues тесты:

```javascript
describe('Leagues', () => {
  test('User placed in league based on XP', async ({ page }) => {
    // Bronze: 0-999 XP, Silver: 1000-4999, etc.
  });

  test('League leaderboard shows top 10', async ({ page }) => {
    // View league -> Top 10 users displayed
  });

  test('User promoted to next league', async ({ page }) => {
    // Earn enough XP -> Promotion notification
  });
});
```

---

### 2.3 Mobile-Specific Tests ⭐

**Статус:** ⚠️ Базовое покрытие есть
**Файл:** `tests/e2e/mobile-interactions.spec.js` (создать)

#### Тест-кейсы:

```javascript
describe('Mobile Interactions', () => {
  test('Swipe to navigate quiz cards', async ({ page }) => {
    // Swipe left -> Next question
    // Swipe right -> Previous question
  });

  test('Pull to refresh word sets list', async ({ page }) => {
    // Pull down -> Refresh animation -> Updated list
  });

  test('Touch target sizes >= 44x44px', async ({ page }) => {
    // Verify all buttons meet minimum size
  });

  test('Bottom navigation stays fixed', async ({ page }) => {
    // Scroll page -> Bottom nav visible
  });

  test('Modal closes on swipe down', async ({ page }) => {
    // Open modal -> Swipe down -> Modal closes
  });

  test('Haptic feedback on quiz answer', async ({ page }) => {
    // Answer question -> Vibration (if supported)
  });
});
```

---

### 2.4 Word Sets Management - API тесты

**Статус:** ❌ Не покрыто
**Файл:** `tests/api/word-sets-management.test.js` (создать)

#### API тесты:

```javascript
describe('Word Sets Management API', () => {
  test('POST /api/word-sets - create custom set', async () => {
    // Create "My Vocabulary" set -> Verify created
  });

  test('POST /api/word-sets/:setId/words - add words', async () => {
    // Add 5 words to custom set -> Count = 5
  });

  test('DELETE /api/word-sets/:setId - delete set', async () => {
    // Delete custom set -> 204 No Content
  });

  test('POST /api/word-sets/previews/batch - batch preview', async () => {
    // Request previews for 10 sets -> All returned
  });

  test('GET /api/word-sets/:setId/preview - single preview', async () => {
    // Preview set -> First 10 words returned
  });
});
```

---

## 3️⃣ ПРИОРИТЕТ 3: ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ (2-3 недели)

### 3.1 Accessibility Tests

**Файл:** `tests/accessibility/a11y.spec.js` (создать)

```javascript
describe('Accessibility', () => {
  test('Keyboard navigation - Tab through all interactive elements', async ({ page }) => {
    // Tab -> Focus visible on all buttons/inputs
  });

  test('Keyboard navigation - Enter key activates buttons', async ({ page }) => {
    // Focus button -> Press Enter -> Action triggered
  });

  test('Screen reader - ARIA labels present', async ({ page }) => {
    // All interactive elements have aria-label
  });

  test('Color contrast - WCAG AA compliance', async ({ page }) => {
    // Text contrast ratio >= 4.5:1
  });

  test('Focus management - Modal traps focus', async ({ page }) => {
    // Open modal -> Tab -> Focus stays within modal
  });

  test('Skip to content link present', async ({ page }) => {
    // Tab first -> "Skip to content" link
  });
});
```

---

### 3.2 Performance Tests

**Файл:** `tests/performance/load-test.js` (создать)

```javascript
describe('Performance - Load Testing', () => {
  test('Homepage loads in < 2 seconds', async () => {
    // Measure page load time
  });

  test('Quiz response time < 500ms', async () => {
    // Submit answer -> Measure response time
  });

  test('Word set import handles 2999 words < 5 seconds', async () => {
    // Large import -> Measure time
  });

  test('Concurrent users - 100 simultaneous logins', async () => {
    // Simulate 100 users logging in
  });

  test('Database query performance - word lookup < 50ms', async () => {
    // Measure DB query time
  });
});
```

---

### 3.3 Cross-Browser Tests

**Файл:** `playwright.config.js` (обновить)

```javascript
// Add to projects array
{
  name: 'Safari',
  use: { ...devices['Desktop Safari'] },
},
{
  name: 'Firefox',
  use: { ...devices['Desktop Firefox'] },
},
{
  name: 'Mobile Safari',
  use: { ...devices['iPhone 14 Pro'] },
},
```

---

### 3.4 Offline Mode Tests (PWA)

**Файл:** `tests/e2e/pwa-offline.spec.js` (создать)

```javascript
describe('PWA Offline Functionality', () => {
  test('Service worker caches static assets', async ({ page, context }) => {
    // Load page online -> Go offline -> Page still accessible
  });

  test('Offline banner shown when disconnected', async ({ page, context }) => {
    // Go offline -> "You're offline" banner shown
  });

  test('Quiz data cached for offline use', async ({ page, context }) => {
    // Start quiz online -> Go offline -> Continue quiz
  });

  test('Background sync queues actions', async ({ page, context }) => {
    // Answer quiz offline -> Come online -> Data synced
  });

  test('PWA installable - Add to Home Screen', async ({ page }) => {
    // Install prompt shown -> Install -> Opens as app
  });
});
```

---

## 🗓️ СТРАТЕГИЯ ЗАПУСКА ТЕСТОВ

### Когда запускать тесты?

#### 1. **Pre-commit Hooks** (Локально)

**Цель:** Поймать баги до коммита

```json
// package.json
{
  "scripts": {
    "pre-commit": "npm run lint && npm run test:critical"
  }
}
```

**Запускаемые тесты:**
- Линтеры (ESLint, Prettier)
- Unit тесты (~10 сек)
- Critical E2E тесты (~2 мин):
  - Authentication
  - Quiz (smoke test)

**Когда:** Перед каждым `git commit`

---

#### 2. **Pre-push Hooks** (Локально)

**Цель:** Полная проверка перед отправкой в репозиторий

```json
{
  "scripts": {
    "pre-push": "npm run test:api && npm run test:e2e:smoke"
  }
}
```

**Запускаемые тесты:**
- Все API тесты (~5 мин)
- Smoke E2E тесты (~5 мин):
  - Authentication
  - Word sets display
  - Basic quiz flow

**Когда:** Перед каждым `git push`

---

#### 3. **Pull Request CI** (GitHub Actions)

**Цель:** Автоматическая проверка перед мержем

**.github/workflows/pr-tests.yml:**

```yaml
name: PR Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start server
        run: npm start &
        env:
          NODE_ENV: test

      - name: Wait for server
        run: npx wait-on http://localhost:3001

      - name: Run all tests
        run: |
          npm run test:api
          npm run test:database
          npm run test:security
          npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
```

**Запускаемые тесты:**
- Все API тесты
- Все database тесты
- Все security тесты
- Все E2E тесты (~40-55 мин)

**Когда:** При создании/обновлении Pull Request

---

#### 4. **Nightly Builds** (GitHub Actions)

**Цель:** Полное регрессионное тестирование

**.github/workflows/nightly.yml:**

```yaml
name: Nightly Full Test Suite

on:
  schedule:
    # Runs at 2:00 AM UTC every day
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  full-test-suite:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run full test suite
        run: |
          npm run test:all
          npm run test:e2e -- --project=${{ matrix.browser }}
          npm run test:performance
          npm run test:accessibility

      - name: Generate coverage report
        run: npm run coverage

      - name: Send Telegram notification
        if: failure()
        uses: appleboy/telegram-action@master
        with:
          to: ${{ secrets.TELEGRAM_CHAT_ID }}
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          message: |
            ❌ Nightly tests failed!
            Browser: ${{ matrix.browser }}
            See: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

**Запускаемые тесты:**
- ВСЕ тесты на всех браузерах
- Performance тесты
- Accessibility тесты
- Coverage report

**Когда:** Каждую ночь в 2:00 AM UTC

---

#### 5. **Production Smoke Tests** (Railway/Vercel)

**Цель:** Проверить production после деплоя

```json
{
  "scripts": {
    "test:production:smoke": "BASE_URL=https://lexybooster.com npm run test:e2e:critical"
  }
}
```

**.github/workflows/production-smoke.yml:**

```yaml
name: Production Smoke Tests

on:
  deployment_status:

jobs:
  smoke-test:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run smoke tests on production
        run: npm run test:production:smoke
        env:
          BASE_URL: https://lexybooster.com

      - name: Notify if failed
        if: failure()
        run: echo "Production smoke tests failed!"
```

**Запускаемые тесты:**
- Critical E2E tests (~5 мин):
  - Login/logout
  - Basic navigation
  - One quiz flow

**Когда:** После каждого деплоя в production

---

#### 6. **Weekly Performance Audit**

**Цель:** Мониторинг деградации производительности

**.github/workflows/weekly-performance.yml:**

```yaml
name: Weekly Performance Audit

on:
  schedule:
    # Every Monday at 9:00 AM UTC
    - cron: '0 9 * * 1'

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://lexybooster.com
            https://lexybooster.com/dashboard
            https://lexybooster.com/quiz

      - name: Run load tests
        run: npm run test:performance:load

      - name: Generate report
        run: npm run test:performance:report
```

**Когда:** Каждый понедельник в 9:00 AM UTC

---

### 📋 Сводная Таблица Запуска Тестов

| Триггер | Тесты | Время | Частота |
|---------|-------|-------|---------|
| **Pre-commit** | Unit + Critical E2E | ~2 мин | Каждый commit |
| **Pre-push** | API + Smoke E2E | ~10 мин | Каждый push |
| **Pull Request** | All tests | ~60 мин | Каждый PR |
| **Nightly** | Full suite + Performance | ~120 мин | Каждую ночь |
| **Post-Deploy** | Smoke tests | ~5 мин | После деплоя |
| **Weekly** | Performance audit | ~30 мин | Каждый понедельник |

---

## 🛠️ Настройка Playwright MCP

### Установка Playwright MCP Server

```bash
# Установка официального MCP сервера от Microsoft
npm install -g @microsoft/playwright-mcp

# Или локально в проект
npm install --save-dev @microsoft/playwright-mcp
```

### Конфигурация для Claude Code

**.claude/mcp-config.json:**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@microsoft/playwright-mcp"],
      "env": {
        "PLAYWRIGHT_BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

### Использование с Claude Code

```bash
# Запустить сервер
npm start

# В другом терминале - запустить Claude Code с Playwright MCP
claude-code --mcp playwright

# Теперь можно использовать команды типа:
# "Navigate to login page and verify form elements"
# "Test quiz flow from start to completion"
```

### Пример использования Playwright MCP

```javascript
// Claude может генерировать тесты через MCP
test('AI-generated quiz test', async ({ page }) => {
  // Claude: "Navigate to dashboard, start a quiz, answer 5 questions correctly"
  await page.goto('/dashboard');
  await page.click('[data-testid="start-quiz"]');

  for (let i = 0; i < 5; i++) {
    // Claude: "Select first answer option"
    await page.click('.quiz-option:first-child');
    await page.click('[data-testid="submit-answer"]');
  }

  // Claude: "Verify quiz completion and XP award"
  await expect(page.locator('.quiz-results')).toBeVisible();
  await expect(page.locator('.xp-earned')).toContainText('+50');
});
```

---

## 📈 Метрики Успеха

### Целевые показатели

- ✅ **Code Coverage:** ≥ 80% для критических модулей
- ✅ **E2E Coverage:** 100% критических user flows
- ✅ **API Coverage:** 100% public endpoints
- ✅ **Test Success Rate:** ≥ 95% (не более 5% flaky tests)
- ✅ **Test Execution Time:** < 60 мин для full suite
- ✅ **Production Smoke Tests:** 100% pass rate after deploy

### Дашборд метрик

Использовать GitHub Actions Dashboard:
- Test pass/fail rate
- Test execution time trends
- Flaky test detection
- Coverage reports (Codecov)

---

## 🚀 План Внедрения

### Фаза 1: Критические тесты (Неделя 1-2)
- [x] Создать план тестирования
- [ ] Настроить Playwright MCP
- [ ] Написать Quiz System E2E тесты
- [ ] Написать Word Import unit тесты
- [ ] Настроить pre-commit hooks

### Фаза 2: API тесты (Неделя 3-4)
- [ ] Analytics API тесты
- [ ] Gamification API тесты
- [ ] Word Sets Management API тесты
- [ ] Настроить PR CI workflow

### Фаза 3: Социальные фичи (Неделя 5-6)
- [ ] Duels E2E тесты
- [ ] Friends System E2E тесты
- [ ] Leagues E2E тесты
- [ ] Настроить nightly builds

### Фаза 4: Дополнительно (Неделя 7-8)
- [ ] Accessibility тесты
- [ ] Performance тесты
- [ ] Cross-browser тесты
- [ ] PWA offline тесты

### Фаза 5: Оптимизация (Неделя 9-10)
- [ ] Оптимизировать flaky tests
- [ ] Настроить coverage reporting
- [ ] Документация лучших практик
- [ ] Обучение команды

---

## 📚 Полезные Ресурсы

- [Playwright Документация](https://playwright.dev/)
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Текущие E2E тесты](tests/e2e/README.md)
- [Test Users Guide](TEST_USERS_GUIDE.md)

---

**Автор:** Claude Code
**Последнее обновление:** 2026-01-02
**Версия:** 1.0
