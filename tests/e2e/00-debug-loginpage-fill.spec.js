/**
 * Debug Test - What happens when we use LoginPage to fill fields?
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug LoginPage Fill', () => {
  test('check if fields are filled correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await page.waitForTimeout(2000);

    console.log('\n=== Before filling ===');
    const beforeEmail = await page.locator('#loginEmail').inputValue();
    const beforePassword = await page.locator('#loginPassword').inputValue();
    console.log(`Email: "${beforeEmail}"`);
    console.log(`Password: "${beforePassword}"`);

    // Fill using LoginPage selectors
    const email = 'test_de_en'.replace(/_/g, '.') + '@lexibooster.test';
    console.log(`\n=== Filling with email: ${email} ===`);

    await page.fill(loginPage.emailInput, email);
    await page.fill(loginPage.passwordInput, TEST_PASSWORD);

    await page.waitForTimeout(500);

    console.log('\n=== After filling ===');
    const afterEmail = await page.locator('#loginEmail').inputValue();
    const afterPassword = await page.locator('#loginPassword').inputValue();
    console.log(`Email: "${afterEmail}"`);
    console.log(`Password: "${afterPassword}"`);

    // Check if button is enabled
    const btnDisabled = await page.locator('#loginBtn').isDisabled();
    console.log(`Login button disabled: ${btnDisabled}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-loginpage-fill.png', fullPage: true });

    expect(afterEmail).toBe(email);
    expect(afterPassword).toBe(TEST_PASSWORD);
  });
});
