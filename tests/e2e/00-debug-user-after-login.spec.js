/**
 * Debug Test - Is user set after login in word-sets tests?
 */

const { test, expect } = require('@playwright/test');
const { LoginPage, WordSetsPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug User After Login', () => {
  test('check if userManager.currentUser is set immediately after login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    console.log('\n=== Immediately after login ===');

    // Check user status right after login
    const userStatusAfterLogin = await page.evaluate(() => {
      return {
        hasUserManager: !!window.userManager,
        currentUser: window.userManager?.currentUser?.id || null,
        currentUserName: window.userManager?.currentUser?.name || null,
        languagePair: window.userManager?.getCurrentLanguagePair()?.id || null,
        languagePairFrom: window.userManager?.getCurrentLanguagePair()?.from_lang || null,
        languagePairTo: window.userManager?.getCurrentLanguagePair()?.to_lang || null,
      };
    });

    console.log('User status after login:', JSON.stringify(userStatusAfterLogin, null, 2));

    // Wait a bit
    await page.waitForTimeout(2000);

    console.log('\n=== After 2 second wait ===');

    // Check again
    const userStatusAfterWait = await page.evaluate(() => {
      return {
        hasUserManager: !!window.userManager,
        currentUser: window.userManager?.currentUser?.id || null,
        currentUserName: window.userManager?.currentUser?.name || null,
        languagePair: window.userManager?.getCurrentLanguagePair()?.id || null,
      };
    });

    console.log('User status after wait:', JSON.stringify(userStatusAfterWait, null, 2));

    // Check localStorage
    const localStorageUser = await page.evaluate(() => {
      return localStorage.getItem('currentUser');
    });

    console.log('\nlocalStorage currentUser:', localStorageUser?.substring(0, 200) || 'NULL');

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-user-after-login.png', fullPage: true });

    expect(true).toBeTruthy();
  });
});
