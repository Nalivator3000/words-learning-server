/**
 * Debug Test - Full login with console monitoring
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug Full Login', () => {
  test('perform full login and monitor console', async ({ page }) => {
    // Monitor all console messages
    page.on('console', msg => {
      console.log(`Browser: ${msg.text()}`);
    });

    // Monitor network
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`API ${response.status()}: ${url}`);
      }
    });

    const loginPage = new LoginPage(page);

    console.log('\n=== Going to page ===');
    await loginPage.goto();
    await page.waitForTimeout(2000);

    console.log('\n=== Starting login process ===');

    // Convert username to email
    const email = 'test_de_en'.replace(/_/g, '.') + '@lexibooster.test';

    console.log(`Filling email: ${email}`);
    await page.fill(loginPage.emailInput, email);

    console.log(`Filling password`);
    await page.fill(loginPage.passwordInput, TEST_PASSWORD);

    await page.waitForTimeout(500);

    console.log(`Clicking login button: ${loginPage.loginButton}`);
    await page.click(loginPage.loginButton);

    console.log('Waiting for response...');
    await page.waitForTimeout(5000);

    console.log('\n=== Checking result ===');
    const currentUser = await page.evaluate(() => {
      return window.userManager?.currentUser?.id || null;
    });
    console.log(`currentUser: ${currentUser}`);

    const modalVisible = await page.locator('#authModal').isVisible();
    console.log(`Auth modal visible: ${modalVisible}`);

    await page.screenshot({ path: 'test-results/debug-full-login.png', fullPage: true });

    expect(true).toBeTruthy();
  });
});
