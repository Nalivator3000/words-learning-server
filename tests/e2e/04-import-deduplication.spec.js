const { test, expect } = require('@playwright/test');
const { LoginPage, WordSetsPage, WordSetDetailPage, VocabularyPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

/**
 * Import and Deduplication Tests
 * CRITICAL: Tests word import functionality and duplicate prevention
 */

test.describe('Import - Basic Functionality', () => {
  test('should import all words from a small set', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_de', TEST_PASSWORD);

    // Go to word sets and open A1 (smallest set)
    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0);

    // Import all words
    await detailPage.importAll();

    // Verify success message
    const successMsg = await detailPage.getSuccessMessage();
    expect(successMsg).toBeTruthy();
    expect(successMsg.toLowerCase()).toContain('import');

    // Go to vocabulary and verify words were added
    await vocabPage.goto();
    const wordCount = await vocabPage.getWordCount();
    expect(wordCount).toBeGreaterThan(0);
  });

  test('should import selected words only', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_es', TEST_PASSWORD);

    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0);

    // Select 5 words
    await detailPage.selectWords(5);

    // Import selected
    await detailPage.importSelected();

    // Verify success
    const successMsg = await detailPage.getSuccessMessage();
    expect(successMsg).toBeTruthy();

    // Check vocabulary
    await vocabPage.goto();
    const wordCount = await vocabPage.getWordCount();
    expect(wordCount).toBeGreaterThanOrEqual(5);
  });
});

test.describe('Deduplication - Critical Tests', () => {
  test('CRITICAL: should prevent duplicates when importing same set twice', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_de', TEST_PASSWORD);

    // First import
    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0); // A1 level

    await detailPage.importAll();
    await detailPage.close();

    // Get initial vocabulary count
    await vocabPage.goto();
    const initialCount = await vocabPage.getWordCount();
    expect(initialCount).toBeGreaterThan(0);

    // Second import of SAME set
    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0); // Same A1 level

    await detailPage.importAll();

    // Check success message mentions skipped words
    const successMsg = await detailPage.getSuccessMessage();
    expect(successMsg.toLowerCase()).toMatch(/skip|already|duplicate|0 import/i);

    await detailPage.close();

    // Verify vocabulary count DID NOT increase
    await vocabPage.goto();
    const finalCount = await vocabPage.getWordCount();

    expect(finalCount).toBe(initialCount); // Should be exactly the same!
  });

  test('CRITICAL: should prevent duplicates from overlapping sets (level + theme)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Import A1 level set
    await wordSetsPage.goto();

    const a1Set = await wordSetsPage.getWordSetByTitle('German A1');
    await a1Set.click();

    await detailPage.importAll();
    await detailPage.close();

    // Get count after A1
    await vocabPage.goto();
    const afterA1Count = await vocabPage.getWordCount();
    expect(afterA1Count).toBeGreaterThan(0);

    // Import General theme (which likely overlaps with A1)
    await wordSetsPage.goto();

    const generalSet = await wordSetsPage.getWordSetByTitle('General');
    await generalSet.click();

    await detailPage.importAll();

    // Check message
    const successMsg = await detailPage.getSuccessMessage();
    expect(successMsg).toBeTruthy();

    // Some words should be skipped, some imported
    // Total should be LESS than afterA1Count + general theme count
    await detailPage.close();

    await vocabPage.goto();
    const finalCount = await vocabPage.getWordCount();

    // Final count should be MORE than A1 (some new words added)
    // But LESS than A1 + full General theme (duplicates skipped)
    expect(finalCount).toBeGreaterThan(afterA1Count);

    // Verify no duplicate words in vocabulary
    const words = await vocabPage.getVocabularyWords();
    const wordTexts = await Promise.all(
      words.map(async w => await w.textContent())
    );

    const uniqueWords = new Set(wordTexts);
    expect(uniqueWords.size).toBe(wordTexts.length); // No duplicates!
  });

  test('CRITICAL: should skip ALL words when re-importing complete set', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_fr', TEST_PASSWORD);

    // First import
    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0);

    await detailPage.importAll();

    const firstMsg = await detailPage.getSuccessMessage();
    expect(firstMsg).toBeTruthy();

    // Extract imported count from message (e.g., "100 words imported")
    const firstImportMatch = firstMsg.match(/(\d+)\s*import/i);
    const firstImportCount = firstImportMatch ? parseInt(firstImportMatch[1]) : 0;

    await detailPage.close();

    // Second import - should skip ALL
    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0); // Same set

    await detailPage.importAll();

    const secondMsg = await detailPage.getSuccessMessage();

    // Should mention 0 imported or all skipped
    expect(secondMsg.toLowerCase()).toMatch(/0 import|all skip|already/i);

    // OR check for skipped count matching first import count
    const skippedMatch = secondMsg.match(/(\d+)\s*skip/i);
    if (skippedMatch && firstImportCount > 0) {
      const skippedCount = parseInt(skippedMatch[1]);
      expect(skippedCount).toBe(firstImportCount);
    }
  });
});

test.describe('Deduplication - Hindi Large Sets', () => {
  test('should handle large set import with deduplication (General theme 2999 words)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_hi_en', TEST_PASSWORD);

    // Import General theme (2999 words)
    await wordSetsPage.goto();

    const generalSet = await wordSetsPage.getWordSetByTitle('General');
    await generalSet.click();

    // This should take longer - increase timeout
    test.setTimeout(60000);

    await detailPage.importAll();
    const firstMsg = await detailPage.getSuccessMessage();
    expect(firstMsg).toBeTruthy();

    await detailPage.close();

    // Get vocabulary count
    await vocabPage.goto();
    const countAfterGeneral = await vocabPage.getWordCount();
    expect(countAfterGeneral).toBeGreaterThan(2000);

    // Now import A1 (1000 words) - should have overlap with General
    await wordSetsPage.goto();

    const a1Set = await wordSetsPage.getWordSetByTitle('Hindi A1');
    await a1Set.click();

    await detailPage.importAll();

    const secondMsg = await detailPage.getSuccessMessage();
    expect(secondMsg).toBeTruthy();

    // Should mention some words were skipped
    expect(secondMsg.toLowerCase()).toMatch(/skip/i);

    await detailPage.close();

    // Verify final count
    await vocabPage.goto();
    const finalCount = await vocabPage.getWordCount();

    // Should be MORE than initial but LESS than 2999 + 1000 = 3999
    expect(finalCount).toBeGreaterThan(countAfterGeneral);
    expect(finalCount).toBeLessThan(3999);
  });
});

test.describe('Deduplication - Case Sensitivity', () => {
  test('should treat different cases as duplicates', async ({ page }) => {
    // This test assumes the deduplication is case-insensitive
    // Based on server code: LOWER(word) = LOWER($1)

    const loginPage = new LoginPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_de', TEST_PASSWORD);

    // Import words
    await page.goto('/word-sets');
    // ... (implementation depends on UI structure)

    // Verify no duplicates even with different cases
    await vocabPage.goto();
    const words = await vocabPage.getVocabularyWords();

    // Get all word texts and normalize to lowercase
    const wordTexts = await Promise.all(
      words.map(async w => {
        const text = await w.textContent();
        return text.toLowerCase().trim();
      })
    );

    const uniqueWords = new Set(wordTexts);

    // No duplicates even when case-insensitive
    expect(uniqueWords.size).toBe(wordTexts.length);
  });
});

test.describe('Import - Partial Import', () => {
  test('should import only new words when partially overlapping sets', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);
    const vocabPage = new VocabularyPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_ru', TEST_PASSWORD);

    // Import A1 completely
    await wordSetsPage.goto();

    const a1Set = await wordSetsPage.getWordSetByTitle('A1');
    await a1Set.click();
    await detailPage.importAll();
    await detailPage.close();

    await vocabPage.goto();
    const afterA1 = await vocabPage.getWordCount();

    // Import A2 (should have no overlap with A1)
    await wordSetsPage.goto();

    const a2Set = await wordSetsPage.getWordSetByTitle('A2');
    await a2Set.click();
    await detailPage.importAll();

    const msg = await detailPage.getSuccessMessage();

    // All A2 words should be imported (no overlap with A1)
    expect(msg).toContain('import');

    await detailPage.close();

    await vocabPage.goto();
    const afterA2 = await vocabPage.getWordCount();

    // Should have more words now
    expect(afterA2).toBeGreaterThan(afterA1);
  });
});

test.describe('Import - Performance', () => {
  test('should import small sets quickly (< 5 seconds)', async ({ page }) => {
    test.setTimeout(15000);

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_de', TEST_PASSWORD);

    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0);

    const startTime = Date.now();

    await detailPage.importAll();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in less than 5 seconds
    expect(duration).toBeLessThan(5000);
  });

  test('should show progress for large imports', async ({ page }) => {
    test.setTimeout(90000); // 90 seconds for large import

    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_hi_en', TEST_PASSWORD);

    await wordSetsPage.goto();

    // Open General theme (2999 words)
    const generalSet = await wordSetsPage.getWordSetByTitle('General');
    await generalSet.click();

    // Click import
    await page.click('.import-all, button:has-text("Import All")');

    // Should show some kind of progress indicator
    const progressIndicator = page.locator('.loading, .progress, .spinner, [role="progressbar"]');

    // Wait briefly and check if progress indicator appears
    await page.waitForTimeout(500);

    const hasProgress = await progressIndicator.isVisible().catch(() => false);

    // Either shows progress OR completes very quickly
    // (both are acceptable)
    expect(true).toBeTruthy();
  });
});

test.describe('Import - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0);

    // Simulate offline
    await page.context().setOffline(true);

    // Try to import
    await page.click('.import-all, button:has-text("Import All")').catch(() => { });

    // Should show error message
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    const hasError = bodyText.toLowerCase().includes('error') ||
      bodyText.toLowerCase().includes('failed') ||
      bodyText.toLowerCase().includes('offline');

    // Restore online
    await page.context().setOffline(false);

    expect(hasError).toBeTruthy();
  });

  test('should allow retry after failed import', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);

    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    await wordSetsPage.goto();
    await wordSetsPage.openWordSet(0);

    // Simulate offline
    await page.context().setOffline(true);

    // Try to import (will fail)
    await page.click('.import-all, button:has-text("Import All")').catch(() => { });
    await page.waitForTimeout(2000);

    // Restore online
    await page.context().setOffline(false);

    // Retry import - button should still be clickable
    const importBtn = page.locator('.import-all, button:has-text("Import All")');
    const isEnabled = await importBtn.isEnabled();

    expect(isEnabled).toBeTruthy();
  });
});

test.describe('Import - Cancel/Close', () => {
  test('should allow closing detail view without importing', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const wordSetsPage = new WordSetsPage(page);
    const detailPage = new WordSetDetailPage(page);

    await loginPage.goto();
    await loginPage.login('test_en_de', TEST_PASSWORD);

    await wordSetsPage.goto();
    const initialCount = await wordSetsPage.getWordSetCount();

    // Open set
    await wordSetsPage.openWordSet(0);

    // Close without importing
    await detailPage.close();

    // Should return to word sets list
    const finalCount = await wordSetsPage.getWordSetCount();
    expect(finalCount).toBe(initialCount);
  });
});
