/**
 * Debug Test - What's in wordListsContent after navigation?
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug WordLists Content', () => {
  test('check wordListsContent after navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Wait for page to fully load
    await page.waitForTimeout(5000);

    console.log('\n=== Navigating to wordLists ===');

    // Programmatically navigate to wordLists
    await page.evaluate(() => {
      if (typeof window.app !== 'undefined' && typeof window.app.showSection === 'function') {
        window.app.showSection('wordLists');
      }
    });

    // Wait for section to be active
    await page.waitForSelector('#wordListsSection.active', { state: 'attached', timeout: 10000 });

    // Force visible
    await page.evaluate(() => {
      const section = document.querySelector('#wordListsSection');
      if (section) section.style.opacity = '1';
    });

    // Wait a bit
    await page.waitForTimeout(5000);

    console.log('\n=== Checking wordListsContent ===');

    const contentHTML = await page.locator('#wordListsContent').innerHTML().catch(() => 'NOT FOUND');
    console.log('wordListsContent HTML:', contentHTML.substring(0, 500));

    const spinnerVisible = await page.locator('#wordListsContent .loading-spinner').isVisible().catch(() => false);
    console.log(`Loading spinner visible: ${spinnerVisible}`);

    const hasContainer = await page.locator('#wordListsContent .word-lists-container').count();
    console.log(`word-lists-container count: ${hasContainer}`);

    const hasEmptyState = await page.locator('#wordListsContent .empty-state').count();
    console.log(`empty-state count: ${hasEmptyState}`);

    // Check if wordListsUI is initialized
    const uiStatus = await page.evaluate(() => {
      if (!window.wordListsUI) return 'NOT FOUND';
      return {
        initialized: window.wordListsUI.initialized,
        wordSetsCount: window.wordListsUI.wordSets?.length || 0,
        languagePairId: window.wordListsUI.languagePairId
      };
    });
    console.log('\nwordListsUI status:', JSON.stringify(uiStatus, null, 2));

    // Check userManager status
    const userStatus = await page.evaluate(() => {
      if (!window.userManager) return 'NOT FOUND';
      return {
        currentUser: window.userManager.currentUser?.id || null,
        languagePair: window.userManager.getCurrentLanguagePair()?.id || null
      };
    });
    console.log('\nuserManager status:', JSON.stringify(userStatus, null, 2));

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-wordlists-content.png', fullPage: true });

    expect(true).toBeTruthy();
  });
});
