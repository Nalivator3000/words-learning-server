/**
 * Debug Test - What is the Welcome page structure?
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug Welcome Page - Structure', () => {
  test('should explore Welcome page structure', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-welcome-page.png', fullPage: true });

    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Check for modals
    const authModal = await page.locator('#authModal').count();
    const authModalVisible = authModal > 0 ? await page.locator('#authModal').isVisible() : false;
    console.log('\n#authModal:', authModal > 0 ? `exists, visible: ${authModalVisible}` : 'not found');

    const onboardingModal = await page.locator('#onboardingModal').count();
    const onboardingModalVisible = onboardingModal > 0 ? await page.locator('#onboardingModal').isVisible() : false;
    console.log('#onboardingModal:', onboardingModal > 0 ? `exists, visible: ${onboardingModalVisible}` : 'not found');

    // Check for Welcome page elements
    const welcomeHeading = await page.locator('h1, h2').allTextContents();
    console.log('\nHeadings:', welcomeHeading);

    const logInButtons = await page.locator('button:has-text("Log In")').all();
    console.log(`\n"Log In" buttons: ${logInButtons.length} found`);
    for (let i = 0; i < logInButtons.length; i++) {
      const id = await logInButtons[i].getAttribute('id').catch(() => '');
      const visible = await logInButtons[i].isVisible().catch(() => false);
      const text = await logInButtons[i].textContent().catch(() => '');
      console.log(`  Button ${i}: id="${id}" visible=${visible} text="${text.trim()}"`);
    }

    // Check if login form is visible
    const emailInput = await page.locator('#loginEmail').count();
    const emailVisible = emailInput > 0 ? await page.locator('#loginEmail').isVisible() : false;
    console.log(`\n#loginEmail: ${emailInput > 0 ? `exists, visible: ${emailVisible}` : 'not found'}`);

    const passwordInput = await page.locator('#loginPassword').count();
    const passwordVisible = passwordInput > 0 ? await page.locator('#loginPassword').isVisible() : false;
    console.log(`#loginPassword: ${passwordInput > 0 ? `exists, visible: ${passwordVisible}` : 'not found'}`);

    const loginBtn = await page.locator('#loginBtn').count();
    const loginBtnVisible = loginBtn > 0 ? await page.locator('#loginBtn').isVisible() : false;
    console.log(`#loginBtn: ${loginBtn > 0 ? `exists, visible: ${loginBtnVisible}` : 'not found'}`);

    // Try clicking the first "Log In" button
    if (logInButtons.length > 0) {
      console.log('\n=== Clicking first "Log In" button ===');
      await logInButtons[0].click();
      await page.waitForTimeout(2000);

      // Take screenshot after click
      await page.screenshot({ path: 'test-results/debug-after-login-btn-click.png', fullPage: true });

      // Check again for login form
      const emailVisibleAfter = await page.locator('#loginEmail').isVisible().catch(() => false);
      const passwordVisibleAfter = await page.locator('#loginPassword').isVisible().catch(() => false);
      const loginBtnVisibleAfter = await page.locator('#loginBtn').isVisible().catch(() => false);

      console.log('\nAfter clicking "Log In":');
      console.log(`  #loginEmail visible: ${emailVisibleAfter}`);
      console.log(`  #loginPassword visible: ${passwordVisibleAfter}`);
      console.log(`  #loginBtn visible: ${loginBtnVisibleAfter}`);

      const authModalVisibleAfter = await page.locator('#authModal').isVisible().catch(() => false);
      console.log(`  #authModal visible: ${authModalVisibleAfter}`);
    }

    expect(true).toBeTruthy();
  });
});
