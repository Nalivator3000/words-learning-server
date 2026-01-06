/**
 * Debug Test - Find logout button
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug Logout - Where is the button?', () => {
  test('should find logout button location', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Wait for page to fully load
    await page.waitForTimeout(5000);

    // Check if we're actually logged in
    const authModalVisible = await page.locator('#authModal').isVisible().catch(() => true);
    console.log('\n=== Login Status ===');
    console.log(`Auth modal visible: ${authModalVisible}`);

    if (authModalVisible) {
      console.log('❌ STILL ON LOGIN PAGE - Login failed!');
      await page.screenshot({ path: 'test-results/debug-login-failed.png', fullPage: true });
      expect(false).toBeTruthy(); // Force fail
      return;
    }

    console.log('✅ Login successful - on dashboard');

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-after-login-logout.png', fullPage: true });

    // Log current URL
    console.log('Current URL:', page.url());

    // Search for logout-related elements
    const logoutSelectors = [
      '#logoutBtn',
      'button:has-text("Выход")',
      'button:has-text("Logout")',
      'button:has-text("Log out")',
      'button:has-text("Sign out")',
      '[data-action="logout"]',
      '.logout-btn',
      'a:has-text("Выход")',
      'a:has-text("Logout")',
    ];

    console.log('\n=== Searching for logout button ===');
    for (const selector of logoutSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible().catch(() => false);
        const text = await page.locator(selector).first().textContent().catch(() => '');
        console.log(`✅ ${selector}: ${count} found, visible: ${visible}, text: "${text.trim()}"`);
      } else {
        console.log(`❌ ${selector}: not found`);
      }
    }

    // Check settings button
    console.log('\n=== Settings Button ===');
    const settingsSelectors = [
      '#settingsNavBtn',
      '#settingsBtn',
      'button:has-text("Settings")',
      'button:has-text("Настройки")',
      '[data-action="settings"]',
    ];

    for (const selector of settingsSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible().catch(() => false);
        const text = await page.locator(selector).first().textContent().catch(() => '');
        console.log(`✅ ${selector}: ${count} found, visible: ${visible}, text: "${text.trim()}"`);
      } else {
        console.log(`❌ ${selector}: not found`);
      }
    }

    // Try clicking settings button if found
    const settingsBtn = await page.locator('#settingsNavBtn').count();
    if (settingsBtn > 0) {
      console.log('\n=== Clicking settings button ===');
      await page.click('#settingsNavBtn');
      await page.waitForTimeout(2000);

      // Take screenshot after opening settings
      await page.screenshot({ path: 'test-results/debug-after-settings-open.png', fullPage: true });

      // Now check for logout again
      console.log('\n=== After opening settings - searching for logout ===');
      for (const selector of logoutSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          const visible = await page.locator(selector).first().isVisible().catch(() => false);
          const text = await page.locator(selector).first().textContent().catch(() => '');
          console.log(`✅ ${selector}: ${count} found, visible: ${visible}, text: "${text.trim()}"`);
        }
      }
    }

    // Find all navigation buttons
    console.log('\n=== All navigation buttons ===');
    const navButtons = await page.locator('nav button, .nav button, [role="navigation"] button').all();
    for (let i = 0; i < navButtons.length; i++) {
      const text = await navButtons[i].textContent().catch(() => '');
      const id = await navButtons[i].getAttribute('id').catch(() => '');
      const visible = await navButtons[i].isVisible().catch(() => false);
      if (visible && (text.trim() || id)) {
        console.log(`  Nav Button ${i}: id="${id}" text="${text.trim()}" visible=${visible}`);
      }
    }

    // Always pass - this is just for exploration
    expect(true).toBeTruthy();
  });
});
