# E2E Automated Tests

Comprehensive end-to-end automated tests for all language pairs and functionality.

## Overview

- **Total Test Files:** 6
- **Estimated Test Cases:** 200+
- **Coverage:** All 39 language pairs, all features
- **Frameworks:** Playwright (UI), Node.js (API)

## Test Files

### 1. Authentication Tests (`01-authentication.spec.js`)
- Login/logout for all 39 test users
- Session management
- Security (password handling, HTTPS)
- Special script users (Hindi, Arabic, Chinese)
- Empty state users (Russian)

**Key Tests:**
- ✅ Login success for all priority groups
- ✅ Session persistence after refresh
- ✅ Logout functionality
- ✅ Script rendering (Devanagari, Arabic, Chinese)

### 2. Word Sets Display Tests (`02-word-sets-display.spec.js`)
- German pairs (17 sets each)
- Hindi pairs (16 sets each)
- English pairs (6 sets each)
- Other language pairs
- RTL layout (Arabic)
- Empty state (Russian)

**Key Tests:**
- ✅ Correct number of word sets for each language
- ✅ All CEFR levels displayed
- ✅ All 10 themes displayed (German/Hindi)
- ✅ Devanagari rendering (Hindi)
- ✅ RTL layout (Arabic)
- ✅ Responsive design (mobile/tablet)

### 3. Filtering & Sorting Tests (`03-filtering-sorting.spec.js`)
- Level filters (A1-C2)
- Theme filters (10 themes)
- Combined filters
- Search/text filter
- Performance

**Key Tests:**
- ✅ Filter by each level individually
- ✅ Filter by each theme individually
- ✅ Combine level + theme filters
- ✅ Search by name (case-insensitive)
- ✅ Clear filters
- ✅ No results state

### 4. Import & Deduplication Tests (`04-import-deduplication.spec.js`) ⭐ CRITICAL
- Basic import functionality
- **Duplicate prevention** (MOST IMPORTANT!)
- Partial imports
- Large set handling
- Error handling

**Key Tests:**
- ✅ Import all words from set
- ✅ Import selected words
- ✅ **Prevent duplicates on re-import (CRITICAL)**
- ✅ **Prevent duplicates from overlapping sets (CRITICAL)**
- ✅ **Case-insensitive deduplication**
- ✅ Handle large sets (2999 words)
- ✅ Network error handling

### 5. User Journeys Tests (`05-user-journeys.spec.js`)
- Complete end-to-end workflows
- Real user scenarios
- Cross-feature integration

**Journeys:**
1. ✅ New German learner (A1 import + theme)
2. ✅ Hindi learner (Devanagari + large sets)
3. ✅ Multi-level progressive import
4. ✅ Mobile user (iPhone SE workflow)
5. ✅ RTL user (Arabic)
6. ✅ Empty state user (Russian)
7. ✅ Word deletion and re-import
8. ✅ Cross-device session persistence

### 6. API Integration Tests (`06-api-integration.spec.js`)
- API authentication
- Word sets API
- Import API with deduplication
- Vocabulary management API
- Error handling
- Performance

**Key Tests:**
- ✅ API login/logout
- ✅ Fetch word sets for each language
- ✅ Import via API
- ✅ API deduplication
- ✅ Vocabulary CRUD operations
- ✅ Error codes (401, 404)
- ✅ Response times

## Running Tests

### Prerequisites

```bash
# Install dependencies (if not already installed)
npm install
```

### Run All E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run mobile tests only
npm run test:e2e:mobile

# Show test report
npm run test:e2e:report
```

### Run Specific Test Files

```bash
# Authentication tests only
npx playwright test 01-authentication

# Word sets display tests
npx playwright test 02-word-sets-display

# Filtering tests
npx playwright test 03-filtering-sorting

# Import and deduplication (CRITICAL)
npx playwright test 04-import-deduplication

# User journeys
npx playwright test 05-user-journeys

# API tests
npx playwright test 06-api-integration
```

### Run Tests for Specific Devices

```bash
# Desktop Chrome only
npx playwright test --project="Desktop Chrome"

# iPhone SE only
npx playwright test --project="iPhone SE"

# iPad only
npx playwright test --project="iPad Mini"
```

### Debug Mode

```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test 04-import-deduplication --debug
```

## Test Configuration

Configuration is in [`config/playwright.config.js`](../../config/playwright.config.js).

**Projects (Browsers/Devices):**
- Desktop Chrome
- iPhone SE (375×667)
- iPhone 12 Pro (390×844)
- iPhone 14 Pro Max (430×932)
- Galaxy S21 (360×800)
- iPad Mini (768×1024)
- iPad Pro (834×1194)

**Settings:**
- Base URL: `http://localhost:3001`
- Timeout: 30 seconds per test
- Retries: 0 (local), 2 (CI)
- Screenshots: On failure
- Videos: On failure
- Parallel execution: Yes

## Test Data

All test users are defined in [`helpers/test-users.js`](helpers/test-users.js).

**Password for all test users:** `test123`

**Test Users:**
- High Priority: 4 users (German, English pairs)
- Medium Priority: 5 users (including Hindi)
- Low Priority: 3 users (Arabic, Chinese, Japanese)
- Empty Sets: 2 users (Russian pairs)

## Critical Tests

### Must-Pass Tests Before Release

1. **Deduplication Tests** (04-import-deduplication.spec.js)
   - ✅ Prevent duplicates on re-import
   - ✅ Prevent duplicates from overlapping sets
   - ✅ Case-insensitive matching

2. **Script Rendering** (02-word-sets-display.spec.js)
   - ✅ Devanagari (Hindi)
   - ✅ Arabic RTL
   - ✅ Chinese characters

3. **Authentication** (01-authentication.spec.js)
   - ✅ Login for all users
   - ✅ Session persistence

4. **Word Sets Display** (02-word-sets-display.spec.js)
   - ✅ Correct counts (17 German, 16 Hindi, 6 English)
   - ✅ Empty state (Russian)

## CI/CD Integration

Tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Test Results

After running tests, results are available in:
- **HTML Report:** `playwright-report/index.html`
- **JSON Results:** `test-results/results.json`
- **Screenshots:** `test-results/` (on failure)
- **Videos:** `test-results/` (on failure)

```bash
# View HTML report
npm run test:e2e:report
```

## Writing New Tests

### Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage, WordSetsPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Your test code
    expect(true).toBeTruthy();
  });
});
```

### Page Objects

Use page objects from `helpers/page-objects.js`:
- `LoginPage` - Login functionality
- `WordSetsPage` - Word sets list
- `WordSetDetailPage` - Word set detail view
- `VocabularyPage` - User vocabulary
- `NavigationHelper` - Navigation actions
- `AssertionHelper` - Common assertions

### Test Users

Use test user helpers from `helpers/test-users.js`:
- `getAllTestUsers()` - All 39 users
- `getTestUsersByPriority('high')` - Users by priority
- `getUsersWithThemes()` - German/Hindi users
- `getRTLUsers()` - Arabic users

## Troubleshooting

### Tests Failing Locally

1. **Server not running:**
   ```bash
   # Start server in separate terminal
   npm start
   ```

2. **Port 3001 already in use:**
   ```bash
   # Kill process on port 3001
   npx kill-port 3001
   ```

3. **Browsers not installed:**
   ```bash
   npx playwright install
   ```

4. **Database connection issues:**
   ```bash
   # Check database is accessible
   npm run db:check
   ```

### Flaky Tests

If tests are flaky (intermittently fail):

1. **Increase timeouts:**
   ```javascript
   test.setTimeout(60000); // 60 seconds
   ```

2. **Add explicit waits:**
   ```javascript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('.word-set');
   ```

3. **Retry failed tests:**
   ```bash
   npx playwright test --retries=2
   ```

### Debugging

1. **Run in headed mode:**
   ```bash
   npx playwright test --headed
   ```

2. **Use debug mode:**
   ```bash
   npx playwright test --debug
   ```

3. **Add console logs:**
   ```javascript
   console.log('Current URL:', page.url());
   ```

4. **Take screenshots manually:**
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```

## Performance Benchmarks

Expected test execution times:

- **Authentication tests:** ~2-3 minutes
- **Word sets display:** ~5-7 minutes
- **Filtering:** ~3-4 minutes
- **Import/deduplication:** ~10-15 minutes
- **User journeys:** ~15-20 minutes
- **API tests:** ~2-3 minutes

**Total:** ~40-55 minutes for full suite

## Coverage

### Language Pair Coverage

- ✅ German → 10 targets (17 sets each)
- ✅ English → 10 targets (6 sets each)
- ✅ Hindi → 2 targets (16 sets each)
- ✅ Spanish → 4 targets (6 sets each)
- ✅ French → 3 targets (6 sets each)
- ✅ Italian → 2 targets (6 sets each)
- ✅ Portuguese → 2 targets (6 sets each)
- ✅ Arabic → 2 targets (6 sets each)
- ✅ Chinese → 2 targets (6 sets each)
- ✅ Russian → 2 targets (0 sets - empty state)

### Feature Coverage

- ✅ Authentication (login, logout, session)
- ✅ Word sets display (all counts, levels, themes)
- ✅ Filtering (level, theme, search)
- ✅ Sorting (TBD)
- ✅ Import (all, selected)
- ✅ **Deduplication (critical)**
- ✅ Vocabulary management (view, delete)
- ✅ Script rendering (Latin, Cyrillic, Arabic, Devanagari, Chinese)
- ✅ RTL layout (Arabic)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Empty states
- ✅ Error handling

### Device Coverage

- ✅ Desktop (Chrome)
- ✅ Mobile (iPhone SE, 12 Pro, 14 Pro Max)
- ✅ Mobile (Galaxy S21)
- ✅ Tablet (iPad Mini, iPad Pro)

## Next Steps

1. **Run critical tests first:**
   ```bash
   npx playwright test 04-import-deduplication
   ```

2. **Fix any failures**

3. **Run full suite:**
   ```bash
   npm run test:e2e
   ```

4. **Review HTML report:**
   ```bash
   npm run test:e2e:report
   ```

5. **Integrate into CI/CD**

## Support

For questions or issues:
- Check [COMPREHENSIVE_TEST_CHECKLIST.md](../../COMPREHENSIVE_TEST_CHECKLIST.md)
- Review [TEST_USERS_GUIDE.md](../../TEST_USERS_GUIDE.md)
- See [Playwright documentation](https://playwright.dev/)

---

**Last Updated:** December 30, 2025
**Test Data Version:** 1.0
**Total Tests:** 200+
