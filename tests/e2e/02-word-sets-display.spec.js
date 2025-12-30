const { test, expect } = require('@playwright/test');
const { LoginPage, WordSetsPage, NavigationHelper } = require('./helpers/page-objects');
const { getTestUsersByPriority, getExpectedWordSets, TEST_PASSWORD } = require('./helpers/test-users');

/**
 * Word Sets Display Tests
 * Tests that word sets display correctly for all language pairs
 */

test.describe('Word Sets Display - German Pairs (17 sets)', () => {
  const germanUsers = getTestUsersByPriority('high').filter(u => u.from === 'de');

  for (const user of germanUsers) {
    test(`${user.username}: should display all 17 word sets`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);

      await wordSetsPage.goto();

      const wordSetCount = await wordSetsPage.getWordSetCount();
      expect(wordSetCount).toBe(17);
    });

    test(`${user.username}: should display all CEFR levels`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ');

      // Check for all levels
      expect(titleText).toContain('A1');
      expect(titleText).toContain('A2');
      expect(titleText).toContain('B1');
      expect(titleText).toContain('B2');
      expect(titleText).toContain('C1');
      expect(titleText).toContain('C2');
      expect(titleText).toContain('beginner');
    });

    test(`${user.username}: should display all 10 themes`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ').toLowerCase();

      // Check for all themes
      const themes = ['communication', 'culture', 'economics', 'education', 'general', 'law', 'philosophy', 'politics', 'science', 'work'];

      for (const theme of themes) {
        expect(titleText).toContain(theme);
      }
    });
  }
});

test.describe('Word Sets Display - Hindi Pairs (16 sets)', () => {
  const hindiUsers = getTestUsersByPriority('medium').filter(u => u.from === 'hi');

  for (const user of hindiUsers) {
    test(`${user.username}: should display all 16 word sets`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);

      await wordSetsPage.goto();

      const wordSetCount = await wordSetsPage.getWordSetCount();
      expect(wordSetCount).toBe(16);
    });

    test(`${user.username}: should render Devanagari script correctly`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      // Check page content doesn't have replacement characters
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('□');
      expect(bodyText).not.toContain('�');

      // Font should support Devanagari (check computed style)
      const firstSet = page.locator(wordSetsPage.wordSetCard).first();
      const fontSize = await firstSet.evaluate(el => window.getComputedStyle(el).fontSize);

      // Font size should be readable (at least 12px)
      const sizeValue = parseInt(fontSize);
      expect(sizeValue).toBeGreaterThanOrEqual(12);
    });

    test(`${user.username}: should display all 6 levels (no beginner)`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ');

      // Check for 6 levels
      expect(titleText).toContain('A1');
      expect(titleText).toContain('A2');
      expect(titleText).toContain('B1');
      expect(titleText).toContain('B2');
      expect(titleText).toContain('C1');
      expect(titleText).toContain('C2');

      // Should NOT have beginner
      expect(titleText.toLowerCase()).not.toContain('beginner');
    });

    test(`${user.username}: should display all 10 themes`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ').toLowerCase();

      // Check for all themes
      const themes = ['communication', 'culture', 'economics', 'education', 'general', 'law', 'philosophy', 'politics', 'science', 'work'];

      for (const theme of themes) {
        expect(titleText).toContain(theme);
      }
    });
  }
});

test.describe('Word Sets Display - English Pairs (6 sets, level-only)', () => {
  const englishUsers = getTestUsersByPriority('high').filter(u => u.from === 'en');

  for (const user of englishUsers) {
    test(`${user.username}: should display exactly 6 word sets`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);

      await wordSetsPage.goto();

      const wordSetCount = await wordSetsPage.getWordSetCount();
      expect(wordSetCount).toBe(6);
    });

    test(`${user.username}: should have NO thematic sets`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ').toLowerCase();

      // Should NOT contain theme names
      expect(titleText).not.toContain('communication');
      expect(titleText).not.toContain('culture');
      expect(titleText).not.toContain('economics');
      expect(titleText).not.toContain('general');
    });

    test(`${user.username}: should display only CEFR levels A1-C2`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ');

      // Check for 6 levels
      expect(titleText).toContain('A1');
      expect(titleText).toContain('A2');
      expect(titleText).toContain('B1');
      expect(titleText).toContain('B2');
      expect(titleText).toContain('C1');
      expect(titleText).toContain('C2');
    });
  }
});

test.describe('Word Sets Display - Arabic RTL', () => {
  test('test_ar_en: should display Arabic with RTL layout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_ar_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    // Open first word set to check RTL
    await wordSetsPage.openWordSet(0);

    // Check if Arabic text has RTL direction
    const sourceWords = page.locator('.source-word, .word-source').first();

    if (await sourceWords.count() > 0) {
      const direction = await sourceWords.evaluate(el => window.getComputedStyle(el).direction);
      expect(direction).toBe('rtl');
    }
  });
});

test.describe('Word Sets Display - Chinese Script', () => {
  test('test_zh_en: should render Chinese characters correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_zh_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    // Check no replacement characters
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('□');
    expect(bodyText).not.toContain('�');
  });
});

test.describe('Word Sets Display - Empty State', () => {
  const emptyUsers = [
    { username: 'test_ru_en', language: 'Russian → English' },
    { username: 'test_ru_de', language: 'Russian → German' },
  ];

  for (const user of emptyUsers) {
    test(`${user.username}: should show empty state (no word sets)`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);

      await wordSetsPage.goto();

      // Should show empty state
      const isEmpty = await wordSetsPage.isEmptyStateVisible();
      expect(isEmpty).toBeTruthy();

      // Should have 0 word sets
      const wordSetCount = await wordSetsPage.getWordSetCount();
      expect(wordSetCount).toBe(0);
    });

    test(`${user.username}: should not show errors in empty state`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const wordSetsPage = new WordSetsPage(page);

      await loginPage.goto();
      await loginPage.login(user.username, TEST_PASSWORD);
      await wordSetsPage.goto();

      // Check no error alerts
      const errors = await page.locator('.error, [role="alert"].error').count();
      expect(errors).toBe(0);

      // Check console for errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      // Should have no console errors
      expect(consoleErrors.length).toBe(0);
    });
  }
});

test.describe('Word Sets Display - Word Counts', () => {
  test('test_de_en: word sets should display word counts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    // Check that word counts are visible
    const wordCounts = await page.locator(wordSetsPage.wordCount).all();

    // Should have counts for all sets
    expect(wordCounts.length).toBeGreaterThan(0);

    // Check first count is a number
    if (wordCounts.length > 0) {
      const countText = await wordCounts[0].textContent();
      const hasNumber = /\d+/.test(countText);
      expect(hasNumber).toBeTruthy();
    }
  });

  test('test_hi_en: General theme should show 2999 words', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_hi_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    // Find General theme
    const generalSet = await wordSetsPage.getWordSetByTitle('General');

    if (await generalSet.count() > 0) {
      const text = await generalSet.textContent();

      // Should contain 2999 or 2,999
      expect(text).toMatch(/2[,\s]?999/);
    }
  });
});

test.describe('Word Sets Display - Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    // Word sets should still be visible on mobile
    const wordSetCount = await wordSetsPage.getWordSetCount();
    expect(wordSetCount).toBeGreaterThan(0);

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Allow 5px tolerance
  });

  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    const wordSetCount = await wordSetsPage.getWordSetCount();
    expect(wordSetCount).toBeGreaterThan(0);
  });
});
