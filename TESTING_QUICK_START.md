# 🚀 Quick Start: Запуск Тестов + Playwright MCP

**Быстрая шпаргалка для работы с тестами в LexyBooster**

---

## ⚡ Быстрые Команды

```bash
# Запустить ВСЕ тесты
npm test

# Только E2E тесты (Playwright)
npm run test:e2e

# E2E тесты с UI (интерактивный режим)
npm run test:e2e:ui

# Только API тесты
npm run test:api

# Только критические тесты (быстро)
npm run test:e2e:critical

# Только mobile тесты
npm run test:e2e:mobile

# Показать отчет последних тестов
npm run test:e2e:report
```

---

## 🎯 Start Testing in 3 Steps

### Step 1: Start Server

```bash
npm start
```

✅ Server should be running on http://localhost:3001

---

### Step 2: Run Critical Tests (5-10 minutes)

```bash
npm run test:e2e:critical
# или
node run-tests.js critical
```

This will test:
- ✅ Authentication for all 39 users
- ✅ **Deduplication (MOST IMPORTANT!)**

---

### Step 3: View Results

```bash
npm run test:e2e:report
# или
node run-tests.js report
```

Opens HTML report in browser.

---

## 📋 What Gets Tested

### Critical Tests Cover:

1. **Authentication**
   - All 39 test users can login
   - Session persists
   - Logout works

2. **Deduplication** ⭐ MOST IMPORTANT
   - Re-importing same set → 0 new words
   - Overlapping sets (A1 + General theme) → duplicates skipped
   - Case-insensitive matching

### If Critical Tests Pass ✅

You're good to go! The core functionality works.

### If Tests Fail ❌

1. Check server is running
2. Check database is accessible
3. Review error screenshots in `test-results/`
4. See [Troubleshooting](#troubleshooting) below

---

## 🧪 More Test Options

### Run All E2E Tests (40-55 minutes)

```bash
node run-tests.js e2e
```

Tests everything:
- All 39 language pairs
- All word set displays
- Filtering and search
- Import functionality
- Mobile devices
- RTL languages (Arabic)
- Special scripts (Hindi, Chinese)

### Run Specific Tests

```bash
# Authentication only
node run-tests.js auth

# Word set display
node run-tests.js display

# Filtering
node run-tests.js filtering

# Import/Deduplication (CRITICAL)
node run-tests.js import

# User journeys
node run-tests.js journeys

# API tests
node run-tests.js api

# Mobile tests
node run-tests.js mobile
```

### Interactive Mode

```bash
node run-tests.js ui
```

Opens Playwright UI for interactive testing.

---

## 🎯 Test Users

**Password for ALL test users:** `test123`

### Quick Test Users

| Username | Language Pair | Word Sets | Use Case |
|----------|---------------|-----------|----------|
| `test_de_en` | German → English | 17 | Full features (themes + levels) |
| `test_hi_en` | Hindi → English | 16 | Devanagari script testing |
| `test_ar_en` | Arabic → English | 6 | RTL layout testing |
| `test_en_de` | English → German | 6 | Level-only testing |
| `test_ru_en` | Russian → English | 0 | Empty state testing |

[See all 39 test users](TEST_USERS_GUIDE.md)

---

## 📊 Expected Results

### Critical Tests Should Show:

```
✅ 01-authentication.spec.js - 25 passed
✅ 04-import-deduplication.spec.js - 30 passed

Duration: 5-10 minutes
```

### Full E2E Tests Should Show:

```
✅ 01-authentication.spec.js - 25 passed
✅ 02-word-sets-display.spec.js - 50 passed
✅ 03-filtering-sorting.spec.js - 40 passed
✅ 04-import-deduplication.spec.js - 30 passed
✅ 05-user-journeys.spec.js - 15 passed
✅ 06-api-integration.spec.js - 20 passed

Duration: 40-55 minutes
```

---

## 🔧 Troubleshooting

### Server Not Running

```bash
# Check if server is running
curl http://localhost:3001

# If not running, start it
npm start
```

### Port Already in Use

```bash
# Kill process on port 3001
npx kill-port 3001

# Then start server
npm start
```

### Browsers Not Installed

```bash
npx playwright install
```

### Database Connection Issues

```bash
# Check database
npm run db:check

# Verify test users exist
node test-hindi-word-sets.js
```

### Tests Timing Out

Tests have 30 second timeout by default. If tests are timing out:

1. Check network connection
2. Check database performance
3. Increase timeout in test file if needed

### Tests Failing on First Run

Sometimes tests fail on first run due to:
- Server not fully ready
- Database warming up
- Network latency

**Solution:** Run tests again. If they pass on second run, it's normal.

---

## 📖 Full Documentation

- [Automated Tests Summary](AUTOMATED_TESTS_SUMMARY.md) - Complete overview
- [E2E Tests README](tests/e2e/README.md) - Detailed test documentation
- [Comprehensive Test Checklist](COMPREHENSIVE_TEST_CHECKLIST.md) - Manual testing guide
- [Test Users Guide](TEST_USERS_GUIDE.md) - All test user details

---

## 🎓 Understanding Test Results

### Green (Passing) ✅

```
✅ should login successfully: test_de_en (German → English)
✅ CRITICAL: should prevent duplicates when importing same set twice
✅ should render Devanagari script correctly
```

**Meaning:** Test passed. Feature works correctly.

### Red (Failing) ❌

```
❌ should login successfully: test_de_en (German → English)
   Error: Timeout waiting for login
```

**Meaning:** Test failed. Check:
1. Server running?
2. Database accessible?
3. Test user exists?

### Yellow (Flaky) ⚠️

Test passes sometimes, fails sometimes.

**Solution:**
- Run test again
- Check network stability
- Review test timeout settings

---

## 🔍 Viewing Test Details

### HTML Report

```bash
node run-tests.js report
```

Shows:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- ⏱️ Duration for each test
- 📸 Screenshots of failures
- 📹 Videos of failures (if configured)

### Console Output

While tests run, you'll see:
```
Running 25 tests using 4 workers

  ✓ should load login page successfully (1.2s)
  ✓ should reject invalid credentials (0.8s)
  ✓ should login successfully: test_de_en (2.1s)
  ...

25 passed (45s)
```

---

## 💡 Tips

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

Useful for debugging - you can see what the browser is doing.

### Debug Specific Test

```bash
npx playwright test 04-import-deduplication --debug
```

Opens debugger with step-by-step execution.

### Run Single Test

```bash
# Edit test file and add .only
test.only('should prevent duplicates', async ({ page }) => {
  // test code
});

# Then run
npx playwright test
```

### Skip Slow Tests

```bash
# Add .skip to slow tests
test.skip('long running test', async ({ page }) => {
  // test code
});
```

---

## 📞 Support

### If Tests Are Failing

1. **Check Prerequisites**
   - ✅ Server running on http://localhost:3001
   - ✅ Database accessible
   - ✅ Test users created (run `node scripts/create-test-users.js`)

2. **Run Database Checks**
   ```bash
   npm run db:check
   node test-hindi-word-sets.js
   ```

3. **Review Error Messages**
   - Check console output
   - View HTML report
   - Look at failure screenshots

4. **Try Again**
   - Sometimes first run fails
   - Re-run: `node run-tests.js critical`

5. **Ask for Help**
   - Include error message
   - Include screenshot
   - Include which test failed

---

## ✅ Success Checklist

Before deploying to production, verify:

- [ ] Critical tests pass (`node run-tests.js critical`)
- [ ] All E2E tests pass (`node run-tests.js e2e`)
- [ ] No duplicate words created (check deduplication tests)
- [ ] All scripts render correctly (Hindi, Arabic, Chinese)
- [ ] Mobile tests pass (`node run-tests.js mobile`)
- [ ] Empty states work (Russian users)
- [ ] No console errors during tests

---

## 🎉 Quick Win

Run this ONE command to verify everything works:

```bash
node run-tests.js critical && echo "✅ ALL CRITICAL TESTS PASSED!"
```

If you see `✅ ALL CRITICAL TESTS PASSED!` - you're good to go! 🚀

---

## 🔍 Playwright MCP Setup (для Claude Code)

### Установка

```bash
# Установить Playwright MCP server
npm install --save-dev @microsoft/playwright-mcp
```

### Настройка

Создать файл `.claude/mcp-config.json`:

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
# 1. Запустить сервер приложения
npm start

# 2. Claude Code теперь может генерировать тесты!
# Примеры команд:
# "Create E2E test for quiz completion"
# "Test login with all users"
# "Generate test for word import"
```

---

## 📚 Полная Документация

- **[TEST_COVERAGE_PLAN.md](TEST_COVERAGE_PLAN.md)** - Детальный план покрытия тестами
- **[E2E Tests README](tests/e2e/README.md)** - Документация E2E тестов
- **[Playwright Docs](https://playwright.dev/)** - Официальная документация

---

**Last Updated:** 2026-01-02
**Quick Start Version:** 2.0
