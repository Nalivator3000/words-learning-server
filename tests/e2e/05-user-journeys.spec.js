const { test, expect } = require('@playwright/test');
const { LoginPage, WordSetsPage, WordSetDetailPage, VocabularyPage, NavigationHelper } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

/**
 * Complete User Journey Tests
 * End-to-end scenarios mimicking real user behavior
 */

test.describe('Journey 1: New German Learner', () => {
  test('complete beginner journey - A1 import and study', async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);
    const nav = new NavigationHelper(page);

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);
    await expect(page).not.toHaveURL(/login/);

    // Step 2: Navigate to word sets
    await nav.goToWordSets();

    // Step 3: Verify 17 sets visible
    const setCount = await wordSetsPage.getWordSetCount();
    expect(setCount).toBe(17);

    // Step 4: Filter to A1 level
    await wordSetsPage.filterByLevel('A1');

    // Step 5: Open A1 word set
    await wordSetsPage.openWordSet(0);

    // Step 6: Import all A1 words
    await detailPage.importAll();

    const successMsg = await detailPage.getSuccessMessage();
    expect(successMsg).toBeTruthy();
    expect(successMsg).toMatch(/1000|import/i);

    await detailPage.close();

    // Step 7: Check vocabulary
    await nav.goToVocabulary();

    const wordCount = await vocabPage.getWordCount();
    expect(wordCount).toBe(1000);

    // Step 8: Try importing Communication theme
    await nav.goToWordSets();
    await wordSetsPage.filterByTheme('communication');

    const commSet = await wordSetsPage.getWordSetByTitle('Communication');
    await commSet.click();

    await detailPage.importAll();

    // Step 9: Verify some words skipped (overlap with A1)
    const commMsg = await detailPage.getSuccessMessage();
    expect(commMsg.toLowerCase()).toMatch(/skip|already/i);

    await detailPage.close();

    // Step 10: Check total vocabulary increased
    await nav.goToVocabulary();

    const finalCount = await vocabPage.getWordCount();
    expect(finalCount).toBeGreaterThan(1000);
    expect(finalCount).toBeLessThan(1000 + 222); // 222 = Communication theme size

    // Step 11: Logout
    await nav.logout();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Journey 2: Hindi Learner', () => {
  test('complete Hindi learning journey with Devanagari', async ({ page }) => {
    test.setTimeout(90000);

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login('test_hi_en', TEST_PASSWORD);

    // Step 2: Navigate to word sets
    await page.goto('/word-sets');

    // Step 3: Verify 16 sets visible
    const setCount = await wordSetsPage.getWordSetCount();
    expect(setCount).toBe(16);

    // Step 4: Verify Devanagari renders correctly
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('□');
    expect(bodyText).not.toContain('�');

    // Step 5: Open General theme (2999 words)
    const generalSet = await wordSetsPage.getWordSetByTitle('General');
    await generalSet.click();

    // Step 6: Verify Devanagari in word list
    const scriptOk = await detailPage.verifyScriptRendering('devanagari');
    expect(scriptOk).toBeTruthy();

    // Step 7: Import General theme
    await detailPage.importAll();

    const msg = await detailPage.getSuccessMessage();
    expect(msg).toBeTruthy();

    await detailPage.close();

    // Step 8: Check vocabulary
    await vocabPage.goto();

    const wordCount = await vocabPage.getWordCount();
    expect(wordCount).toBeGreaterThanOrEqual(2999);

    // Step 9: Import A1 (should have overlap)
    await page.goto('/word-sets');

    const a1Set = await wordSetsPage.getWordSetByTitle('Hindi A1');
    await a1Set.click();

    await detailPage.importAll();

    const a1Msg = await detailPage.getSuccessMessage();
    expect(a1Msg.toLowerCase()).toMatch(/skip/i);

    await detailPage.close();

    // Step 10: Verify total is NOT 2999 + 1000
    await vocabPage.goto();

    const finalCount = await vocabPage.getWordCount();
    expect(finalCount).toBeLessThan(3999); // Should have duplicates skipped
  });
});

test.describe('Journey 3: Multi-Level Progressive Import', () => {
  test('systematic import A1→A2→B1 with no duplicates', async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_de', TEST_PASSWORD);

    let cumulativeCount = 0;

    // Import A1
    await page.goto('/word-sets');
    const a1Set = await wordSetsPage.getWordSetByTitle('A1');
    await a1Set.click();
    await detailPage.importAll();
    await detailPage.close();

    await vocabPage.goto();
    cumulativeCount = await vocabPage.getWordCount();
    expect(cumulativeCount).toBeGreaterThan(0);

    const a1Count = cumulativeCount;

    // Import A2
    await page.goto('/word-sets');
    const a2Set = await wordSetsPage.getWordSetByTitle('A2');
    await a2Set.click();
    await detailPage.importAll();
    await detailPage.close();

    await vocabPage.goto();
    cumulativeCount = await vocabPage.getWordCount();
    expect(cumulativeCount).toBeGreaterThan(a1Count);

    const a1a2Count = cumulativeCount;

    // Import B1
    await page.goto('/word-sets');
    const b1Set = await wordSetsPage.getWordSetByTitle('B1');
    await b1Set.click();
    await detailPage.importAll();
    await detailPage.close();

    await vocabPage.goto();
    cumulativeCount = await vocabPage.getWordCount();
    expect(cumulativeCount).toBeGreaterThan(a1a2Count);

    // Verify no duplicates
    const words = await vocabPage.getVocabularyWords();
    const wordTexts = await Promise.all(
      words.map(async w => await w.textContent())
    );

    const uniqueWords = new Set(wordTexts);
    expect(uniqueWords.size).toBe(wordTexts.length);

    // Try re-importing A1 - should skip all
    await page.goto('/word-sets');
    const a1SetAgain = await wordSetsPage.getWordSetByTitle('A1');
    await a1SetAgain.click();
    await detailPage.importAll();

    const reImportMsg = await detailPage.getSuccessMessage();
    expect(reImportMsg.toLowerCase()).toMatch(/0 import|all skip/i);

    await detailPage.close();

    // Verify count unchanged
    await vocabPage.goto();
    const finalCount = await vocabPage.getWordCount();
    expect(finalCount).toBe(cumulativeCount);
  });
});

test.describe('Journey 4: Mobile User', () => {
  test('complete mobile workflow on iPhone SE', async ({ page }) => {
    test.setTimeout(60000);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const loginPage = new LoginPage(page);

    // Step 1: Login on mobile
    await loginPage.goto();
    await loginPage.login('test_de_es', TEST_PASSWORD);

    // Step 2: Navigate to word sets (using mobile nav)
    await page.goto('/word-sets');

    // Step 3: Verify sets display on mobile
    const wordSets = await page.locator('.word-set, .card, [data-testid="word-set"]').all();
    expect(wordSets.length).toBeGreaterThan(0);

    // Step 4: Open word set with tap
    await wordSets[0].click();
    await page.waitForLoadState('networkidle');

    // Step 5: Scroll through words (mobile scroll)
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);

    // Step 6: Select individual words with tap
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    if (checkboxes.length >= 3) {
      await checkboxes[0].check();
      await checkboxes[1].check();
      await checkboxes[2].check();
    }

    // Step 7: Import selected words
    const importBtn = page.locator('button:has-text("Import"), button:has-text("Add")');
    await importBtn.click();

    await page.waitForTimeout(2000);

    // Step 8: Verify success on mobile
    const bodyText = await page.textContent('body');
    expect(bodyText.toLowerCase()).toMatch(/success|import|added/i);

    // Step 9: Check vocabulary on mobile
    await page.goto('/vocabulary');

    const vocabWords = await page.locator('.vocabulary-word, .word-item').all();
    expect(vocabWords.length).toBeGreaterThan(0);

    // Step 10: Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});

test.describe('Journey 5: RTL Language User (Arabic)', () => {
  test('complete Arabic learning journey with RTL layout', async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login('test_ar_en', TEST_PASSWORD);

    // Step 2: Navigate to word sets
    await page.goto('/word-sets');

    // Step 3: Verify 6 sets visible
    const setCount = await wordSetsPage.getWordSetCount();
    expect(setCount).toBe(6);

    // Step 4: Open A1 word set
    await wordSetsPage.openWordSet(0);

    // Step 5: Verify Arabic text displays RTL
    const sourceWords = page.locator('.source-word, .word-source').first();

    if (await sourceWords.count() > 0) {
      const direction = await sourceWords.evaluate(el =>
        window.getComputedStyle(el).direction
      );
      expect(direction).toBe('rtl');

      // Text should align right
      const textAlign = await sourceWords.evaluate(el =>
        window.getComputedStyle(el).textAlign
      );
      expect(textAlign).toMatch(/right|end/);
    }

    // Step 6: Verify Arabic script renders correctly
    const arabicText = await sourceWords.textContent();
    expect(arabicText).not.toContain('□');
    expect(arabicText).not.toContain('�');

    // Step 7: Import words
    await page.click('button:has-text("Import All")');
    await page.waitForTimeout(3000);

    // Step 8: Check vocabulary maintains RTL
    await page.goto('/vocabulary');

    const vocabWords = page.locator('.vocabulary-word, .word-item').first();

    if (await vocabWords.count() > 0) {
      const arabicInVocab = vocabWords.locator('.source-word, .word-source').first();

      const direction = await arabicInVocab.evaluate(el =>
        window.getComputedStyle(el).direction
      );
      expect(direction).toBe('rtl');
    }
  });
});

test.describe('Journey 6: Empty State User (Russian)', () => {
  test('Russian learner encounters empty state gracefully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login('test_ru_en', TEST_PASSWORD);

    // Step 2: Navigate to word sets
    await page.goto('/word-sets');

    // Step 3: Verify empty state is shown
    const isEmpty = await wordSetsPage.isEmptyStateVisible();
    expect(isEmpty).toBeTruthy();

    // Step 4: Verify no error messages
    const errors = await page.locator('.error, [role="alert"].error').count();
    expect(errors).toBe(0);

    // Step 5: Verify helpful message
    const bodyText = await page.textContent('body');
    expect(bodyText.toLowerCase()).toMatch(/no word sets|coming soon|check back/i);

    // Step 6: Verify navigation still works
    await page.goto('/vocabulary');

    // Should show empty vocabulary
    const vocabEmpty = await page.locator('.empty-state, .no-words').isVisible();
    expect(vocabEmpty).toBeTruthy();

    // Step 7: Verify can logout
    const logoutBtn = page.locator('a:has-text("Logout"), button:has-text("Logout")');
    await logoutBtn.click();

    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Journey 7: Word Deletion and Re-import', () => {
  test('delete word then re-import successfully', async ({ page }) => {
    test.setTimeout(60000);

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    // Step 1: Login and import words
    await loginPage.goto();
    await loginPage.login('test_en_de', TEST_PASSWORD);

    await page.goto('/word-sets');
    await wordSetsPage.openWordSet(0);
    await detailPage.importAll();
    await detailPage.close();

    // Step 2: Go to vocabulary
    await vocabPage.goto();

    const initialCount = await vocabPage.getWordCount();
    expect(initialCount).toBeGreaterThan(0);

    // Step 3: Delete one word
    await vocabPage.deleteWord(0);

    // Step 4: Verify count decreased
    const afterDelete = await vocabPage.getWordCount();
    expect(afterDelete).toBe(initialCount - 1);

    // Step 5: Re-import same set
    await page.goto('/word-sets');
    await wordSetsPage.openWordSet(0);
    await detailPage.importAll();

    // Step 6: Should import ONLY the deleted word
    const reImportMsg = await detailPage.getSuccessMessage();
    expect(reImportMsg).toMatch(/1 import|1 word import/i);

    await detailPage.close();

    // Step 7: Verify count back to original
    await vocabPage.goto();

    const finalCount = await vocabPage.getWordCount();
    expect(finalCount).toBe(initialCount);
  });
});

test.describe('Journey 8: Cross-Device Session', () => {
  test('session persists across page refreshes', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Step 2: Import some words
    await page.goto('/word-sets');
    await wordSetsPage.openWordSet(0);

    await page.click('button:has-text("Import All")');
    await page.waitForTimeout(3000);

    // Step 3: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 4: Should still be logged in
    await expect(page).not.toHaveURL(/login/);

    // Step 5: Go to vocabulary - words should still be there
    await page.goto('/vocabulary');

    const wordCount = await page.locator('.total-count, [data-testid="total-words"]')
      .first()
      .textContent();

    const count = parseInt(wordCount.match(/\d+/)?.[0] || '0');
    expect(count).toBeGreaterThan(0);

    // Step 6: Refresh again
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 7: Still logged in
    await expect(page).not.toHaveURL(/login/);
  });
});
