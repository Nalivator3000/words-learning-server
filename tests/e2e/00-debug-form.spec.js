/**
 * Debug Test - Check login form structure
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug Login Form - Structure', () => {
  test('should find login form fields', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/debug-form-initial.png', fullPage: true });

    console.log('\n=== Finding input fields ===');

    // Find all email/password fields
    const allInputs = await page.locator('input').all();
    console.log(`\nTotal inputs found: ${allInputs.length}`);
    for (let i = 0; i < allInputs.length; i++) {
      const type = await allInputs[i].getAttribute('type').catch(() => '');
      const id = await allInputs[i].getAttribute('id').catch(() => '');
      const name = await allInputs[i].getAttribute('name').catch(() => '');
      const placeholder = await allInputs[i].getAttribute('placeholder').catch(() => '');
      const visible = await allInputs[i].isVisible().catch(() => false);
      console.log(`  Input ${i}: type="${type}" id="${id}" name="${name}" placeholder="${placeholder}" visible=${visible}`);
    }

    // Check #loginEmail and #loginPassword specifically
    console.log('\n=== Checking #loginEmail ===');
    const loginEmailCount = await page.locator('#loginEmail').count();
    console.log(`#loginEmail count: ${loginEmailCount}`);
    if (loginEmailCount > 0) {
      const visible = await page.locator('#loginEmail').isVisible();
      const value = await page.locator('#loginEmail').inputValue();
      console.log(`  visible: ${visible}, value: "${value}"`);
    }

    console.log('\n=== Checking #loginPassword ===');
    const loginPasswordCount = await page.locator('#loginPassword').count();
    console.log(`#loginPassword count: ${loginPasswordCount}`);
    if (loginPasswordCount > 0) {
      const visible = await page.locator('#loginPassword').isVisible();
      const value = await page.locator('#loginPassword').inputValue();
      console.log(`  visible: ${visible}, value: "${value}"`);
    }

    // Try filling the fields
    console.log('\n=== Attempting to fill fields ===');
    try {
      await page.fill('#loginEmail', 'test.de.en@lexibooster.test');
      console.log('✅ Filled #loginEmail');
    } catch (e) {
      console.log('❌ Failed to fill #loginEmail:', e.message);
    }

    try {
      await page.fill('#loginPassword', 'testpass');
      console.log('✅ Filled #loginPassword');
    } catch (e) {
      console.log('❌ Failed to fill #loginPassword:', e.message);
    }

    await page.waitForTimeout(1000);

    // Take screenshot after filling
    await page.screenshot({ path: 'test-results/debug-form-after-fill.png', fullPage: true });

    // Check values
    const emailValue = await page.locator('#loginEmail').inputValue().catch(() => '');
    const passwordValue = await page.locator('#loginPassword').inputValue().catch(() => '');
    console.log(`\nAfter fill:`);
    console.log(`  #loginEmail value: "${emailValue}"`);
    console.log(`  #loginPassword value: "${passwordValue}"`);

    // Check if #loginBtn is clickable
    console.log('\n=== Checking #loginBtn ===');
    const loginBtnCount = await page.locator('#loginBtn').count();
    console.log(`#loginBtn count: ${loginBtnCount}`);
    if (loginBtnCount > 0) {
      const visible = await page.locator('#loginBtn').isVisible();
      const disabled = await page.locator('#loginBtn').isDisabled().catch(() => false);
      console.log(`  visible: ${visible}, disabled: ${disabled}`);
    }

    expect(true).toBeTruthy();
  });
});
