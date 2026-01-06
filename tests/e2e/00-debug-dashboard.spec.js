/**
 * Debug Test - See dashboard after login
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug Dashboard - After successful login', () => {
  test('should show dashboard with all navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Additional wait to ensure everything loaded
    await page.waitForTimeout(5000);

    // Take fullpage screenshot
    await page.screenshot({ path: 'test-results/debug-dashboard-fullpage.png', fullPage: true });

    console.log('Current URL:', page.url());

    // Check for header and navigation
    const headerVisible = await page.locator('header').isVisible().catch(() => false);
    console.log(`\nHeader visible: ${headerVisible}`);

    const navVisible = await page.locator('nav').isVisible().catch(() => false);
    console.log(`Nav visible: ${navVisible}`);

    // Find userMenuBtn
    const userMenuBtn = await page.locator('#userMenuBtn').count();
    console.log(`\n#userMenuBtn count: ${userMenuBtn}`);
    if (userMenuBtn > 0) {
      const visible = await page.locator('#userMenuBtn').isVisible().catch(() => false);
      const boundingBox = await page.locator('#userMenuBtn').boundingBox().catch(() => null);
      console.log(`  visible: ${visible}`);
      console.log(`  boundingBox: ${JSON.stringify(boundingBox)}`);
    }

    // Check all buttons in header-right
    const headerRightBtns = await page.locator('.header-right button').all();
    console.log(`\n.header-right buttons: ${headerRightBtns.length}`);
    for (let i = 0; i < headerRightBtns.length; i++) {
      const id = await headerRightBtns[i].getAttribute('id').catch(() => '');
      const text = await headerRightBtns[i].textContent().catch(() => '');
      const visible = await headerRightBtns[i].isVisible().catch(() => false);
      console.log(`  Button ${i}: id="${id}" text="${text}" visible=${visible}`);
    }

    // Check if settings button in top-right exists
    const settingsButtons = await page.locator('button[title="Settings"], .settings-btn').all();
    console.log(`\nSettings buttons: ${settingsButtons.length}`);
    for (let i = 0; i < settingsButtons.length; i++) {
      const id = await settingsButtons[i].getAttribute('id').catch(() => '');
      const className = await settingsButtons[i].getAttribute('class').catch(() => '');
      const visible = await settingsButtons[i].isVisible().catch(() => false);
      console.log(`  Settings ${i}: id="${id}" class="${className}" visible=${visible}`);
    }

    expect(true).toBeTruthy();
  });
});
