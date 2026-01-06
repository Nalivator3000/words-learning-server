/**
 * Debug Test - Monitor network during login
 */

const { test, expect } = require('@playwright/test');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug Login Network', () => {
  test('monitor network requests during login', async ({ page }) => {
    // Monitor network requests
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        const status = response.status();
        console.log(`API ${status}: ${url}`);

        if (url.includes('/login')) {
          try {
            const body = await response.json();
            console.log('  Login response:', JSON.stringify(body, null, 2));
          } catch (e) {
            console.log('  Could not parse response body');
          }
        }
      }
    });

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('login') || text.includes('user') || text.includes('error')) {
        console.log(`Browser log: ${text}`);
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    console.log('\n=== Attempting login ===');

    // Fill and submit login form
    await page.fill('#loginEmail', 'test.de.en@lexibooster.test');
    await page.fill('#loginPassword', TEST_PASSWORD);

    console.log('Fields filled, clicking login button...');

    await page.click('#loginBtn');

    console.log('Login button clicked, waiting for response...');

    // Wait for network activity
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('\n=== After network idle ===');

    // Check auth modal
    const authModalVisible = await page.locator('#authModal').isVisible().catch(() => false);
    console.log(`Auth modal visible: ${authModalVisible}`);

    // Check user
    const userStatus = await page.evaluate(() => {
      return {
        currentUser: window.userManager?.currentUser?.id || null,
        localStorage: localStorage.getItem('currentUser') !== null,
      };
    });

    console.log('User status:', JSON.stringify(userStatus, null, 2));

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-login-network.png', fullPage: true });

    expect(true).toBeTruthy();
  });
});
