/**
 * Debug Test - Check login field selectors
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug Login Fields', () => {
  test('check what login fields exist', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    console.log('\n=== Checking for auth modal ===');
    const authModalVisible = await page.locator('#authModal').isVisible().catch(() => false);
    console.log(`#authModal visible: ${authModalVisible}`);

    // Check for Log In tab
    const loginTab = await page.locator('#loginTab').count();
    console.log(`\n#loginTab count: ${loginTab}`);
    if (loginTab > 0) {
      const visible = await page.locator('#loginTab').isVisible();
      console.log(`#loginTab visible: ${visible}`);

      // Try clicking it
      await page.click('#loginTab');
      await page.waitForTimeout(1000);
    }

    // Check for email input fields
    console.log('\n=== Checking email inputs ===');
    const emailSelectors = ['#loginEmail', '#email', 'input[type="email"]', 'input[placeholder*="mail" i]'];
    for (const selector of emailSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible().catch(() => false);
        const id = await page.locator(selector).first().getAttribute('id').catch(() => '');
        const placeholder = await page.locator(selector).first().getAttribute('placeholder').catch(() => '');
        console.log(`${selector}: count=${count}, visible=${visible}, id="${id}", placeholder="${placeholder}"`);
      } else {
        console.log(`${selector}: not found`);
      }
    }

    // Check for password input fields
    console.log('\n=== Checking password inputs ===');
    const passwordSelectors = ['#loginPassword', '#password', 'input[type="password"]'];
    for (const selector of passwordSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible().catch(() => false);
        const id = await page.locator(selector).first().getAttribute('id').catch(() => '');
        const placeholder = await page.locator(selector).first().getAttribute('placeholder').catch(() => '');
        console.log(`${selector}: count=${count}, visible=${visible}, id="${id}", placeholder="${placeholder}"`);
      } else {
        console.log(`${selector}: not found`);
      }
    }

    // Check for login button
    console.log('\n=== Checking login buttons ===');
    const loginBtnSelectors = ['#loginBtn', 'button:has-text("Log In")', 'button[type="submit"]'];
    for (const selector of loginBtnSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible().catch(() => false);
        const id = await page.locator(selector).first().getAttribute('id').catch(() => '');
        const text = await page.locator(selector).first().textContent().catch(() => '');
        console.log(`${selector}: count=${count}, visible=${visible}, id="${id}", text="${text.trim()}"`);
      } else {
        console.log(`${selector}: not found`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-login-fields.png', fullPage: true });

    expect(true).toBeTruthy();
  });
});
