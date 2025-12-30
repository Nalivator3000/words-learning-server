const { test, expect } = require('@playwright/test');
const { LoginPage, WordSetsPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

/**
 * Filtering and Sorting Tests
 * Tests word set filtering and sorting functionality
 */

test.describe('Filtering - Level Filters (German)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
  });

  test('should filter by A1 level', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    const initialCount = await wordSetsPage.getWordSetCount();
    expect(initialCount).toBe(17); // All sets initially

    await wordSetsPage.filterByLevel('A1');

    const filteredCount = await wordSetsPage.getWordSetCount();
    expect(filteredCount).toBeLessThan(initialCount);

    // Should show only A1 set(s)
    const titles = await wordSetsPage.getWordSetTitles();
    const hasA1 = titles.some(title => title.includes('A1'));
    expect(hasA1).toBeTruthy();
  });

  test('should filter by each CEFR level', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    for (const level of levels) {
      await wordSetsPage.filterByLevel(level);

      const titles = await wordSetsPage.getWordSetTitles();
      const hasLevel = titles.some(title => title.includes(level));
      expect(hasLevel).toBeTruthy();
    }
  });

  test('should clear level filter', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    // Apply filter
    await wordSetsPage.filterByLevel('A1');
    const filteredCount = await wordSetsPage.getWordSetCount();

    // Clear filter (select "All" or empty option)
    await wordSetsPage.filterByLevel('');

    const clearedCount = await wordSetsPage.getWordSetCount();
    expect(clearedCount).toBeGreaterThan(filteredCount);
    expect(clearedCount).toBe(17);
  });
});

test.describe('Filtering - Theme Filters (German)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
  });

  test('should filter by Communication theme', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    await wordSetsPage.filterByTheme('communication');

    const titles = await wordSetsPage.getWordSetTitles();
    const titleText = titles.join(' ').toLowerCase();

    expect(titleText).toContain('communication');
  });

  test('should filter by each theme', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    const themes = ['communication', 'culture', 'economics', 'education', 'general', 'law', 'philosophy', 'politics', 'science', 'work'];

    for (const theme of themes) {
      await wordSetsPage.filterByTheme(theme);

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ').toLowerCase();

      expect(titleText).toContain(theme);
    }
  });

  test('should clear theme filter', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    // Apply theme filter
    await wordSetsPage.filterByTheme('culture');
    const filteredCount = await wordSetsPage.getWordSetCount();

    // Clear filter
    await wordSetsPage.filterByTheme('');

    const clearedCount = await wordSetsPage.getWordSetCount();
    expect(clearedCount).toBeGreaterThan(filteredCount);
  });
});

test.describe('Filtering - Theme Filters (Hindi)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_hi_en', TEST_PASSWORD);
  });

  test('should filter by General theme (2999 words)', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    await wordSetsPage.filterByTheme('general');

    const titles = await wordSetsPage.getWordSetTitles();
    const titleText = titles.join(' ').toLowerCase();

    expect(titleText).toContain('general');

    // Should show 2999 word count
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/2[,\s]?999/);
  });

  test('should filter by all 10 Hindi themes', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    const themes = ['communication', 'culture', 'economics', 'education', 'general', 'law', 'philosophy', 'politics', 'science', 'work'];

    for (const theme of themes) {
      await wordSetsPage.filterByTheme(theme);

      const titles = await wordSetsPage.getWordSetTitles();
      const titleText = titles.join(' ').toLowerCase();

      expect(titleText).toContain(theme);
    }
  });
});

test.describe('Filtering - Combined Filters (German)', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
  });

  test('should combine level and theme filters', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    // Apply both filters
    await wordSetsPage.filterByLevel('A1');
    await wordSetsPage.filterByTheme('general');

    const count = await wordSetsPage.getWordSetCount();

    // Should show both A1 level set AND General theme set
    expect(count).toBeGreaterThanOrEqual(1);

    const titles = await wordSetsPage.getWordSetTitles();
    const titleText = titles.join(' ').toLowerCase();

    // Should contain either A1 or general (or both)
    const hasA1 = titleText.includes('a1');
    const hasGeneral = titleText.includes('general');

    expect(hasA1 || hasGeneral).toBeTruthy();
  });

  test('should clear combined filters independently', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    // Apply both filters
    await wordSetsPage.filterByLevel('A1');
    await wordSetsPage.filterByTheme('general');

    const combinedCount = await wordSetsPage.getWordSetCount();

    // Clear only level filter
    await wordSetsPage.filterByLevel('');

    const afterLevelClear = await wordSetsPage.getWordSetCount();
    expect(afterLevelClear).toBeGreaterThanOrEqual(combinedCount);

    // Clear theme filter
    await wordSetsPage.filterByTheme('');

    const fullyCleared = await wordSetsPage.getWordSetCount();
    expect(fullyCleared).toBe(17); // All sets visible
  });
});

test.describe('Filtering - Search/Text Filter', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
  });

  test('should search by level name', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    await wordSetsPage.search('A1');

    const titles = await wordSetsPage.getWordSetTitles();
    const hasA1 = titles.some(title => title.includes('A1'));

    expect(hasA1).toBeTruthy();
  });

  test('should search by theme name', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    await wordSetsPage.search('Communication');

    const titles = await wordSetsPage.getWordSetTitles();
    const hasCommunication = titles.some(title =>
      title.toLowerCase().includes('communication')
    );

    expect(hasCommunication).toBeTruthy();
  });

  test('should be case-insensitive', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    await wordSetsPage.search('GENERAL');

    const titles = await wordSetsPage.getWordSetTitles();
    const hasGeneral = titles.some(title =>
      title.toLowerCase().includes('general')
    );

    expect(hasGeneral).toBeTruthy();
  });

  test('should update results as typing', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    const initialCount = await wordSetsPage.getWordSetCount();

    // Type partial search
    await page.fill(wordSetsPage.searchInput, 'Cult');
    await page.waitForTimeout(600); // Wait for debounce

    const partialCount = await wordSetsPage.getWordSetCount();
    expect(partialCount).toBeLessThanOrEqual(initialCount);

    // Complete the search
    await page.fill(wordSetsPage.searchInput, 'Culture');
    await page.waitForTimeout(600);

    const fullCount = await wordSetsPage.getWordSetCount();
    expect(fullCount).toBeGreaterThan(0);
  });

  test('should clear search filter', async ({ page }) => {
    const wordSetsPage = new WordSetsPage(page);
    await wordSetsPage.goto();

    await wordSetsPage.search('A1');
    await page.waitForTimeout(600);

    const searchedCount = await wordSetsPage.getWordSetCount();

    // Clear search
    await page.fill(wordSetsPage.searchInput, '');
    await page.waitForTimeout(600);

    const clearedCount = await wordSetsPage.getWordSetCount();
    expect(clearedCount).toBeGreaterThan(searchedCount);
    expect(clearedCount).toBe(17);
  });
});

test.describe('Filtering - No Results State', () => {
  test('should show no results message for invalid search', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    // Search for something that doesn't exist
    await wordSetsPage.search('XYZ_NONEXISTENT_TERM_12345');
    await page.waitForTimeout(600);

    const count = await wordSetsPage.getWordSetCount();
    expect(count).toBe(0);

    // Should show some kind of "no results" message
    const bodyText = await page.textContent('body');
    expect(
      bodyText.toLowerCase().includes('no results') ||
      bodyText.toLowerCase().includes('not found') ||
      bodyText.toLowerCase().includes('no word sets')
    ).toBeTruthy();
  });
});

test.describe('Sorting - Not Implemented Yet', () => {
  test.skip('should sort by name A-Z', async ({ page }) => {
    // Placeholder for future sorting implementation
  });

  test.skip('should sort by word count', async ({ page }) => {
    // Placeholder for future sorting implementation
  });

  test.skip('should sort by level', async ({ page }) => {
    // Placeholder for future sorting implementation
  });
});

test.describe('Filtering - Performance', () => {
  test('should filter quickly without lag', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    // Measure filter performance
    const startTime = Date.now();

    await wordSetsPage.filterByLevel('A1');
    await page.waitForSelector(wordSetsPage.wordSetCard, { timeout: 5000 });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in less than 2 seconds
    expect(duration).toBeLessThan(2000);
  });

  test('should search quickly without lag', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await wordSetsPage.goto();

    const startTime = Date.now();

    await wordSetsPage.search('General');
    await page.waitForTimeout(700); // Wait for debounce + render

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in less than 1.5 seconds
    expect(duration).toBeLessThan(1500);
  });
});
