/**
 * Debug Test - Explore Login Form Structure
 */

const { test } = require('@playwright/test');

test('explore login form buttons', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Click "Log In" button on Welcome page
  const welcomeLoginBtn = page.locator('button:has-text("Log In")').first();
  await welcomeLoginBtn.click();

  // Wait for login form to appear
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'test-results/login-form-structure.png', fullPage: true });

  // Fill the form fields
  await page.fill('#loginEmail', 'test.de.en@lexibooster.test');
  await page.fill('#loginPassword', 'test123');

  // Find ALL "Log In" buttons
  const logInButtons = await page.locator('button:has-text("Log In")').all();
  console.log(`\nFound ${logInButtons.length} "Log In" buttons:`);

  for (let i = 0; i < logInButtons.length; i++) {
    const button = logInButtons[i];
    const text = await button.textContent();
    const id = await button.getAttribute('id').catch(() => '');
    const type = await button.getAttribute('type').catch(() => '');
    const className = await button.getAttribute('class').catch(() => '');
    const isVisible = await button.isVisible();
    const parent = await button.evaluate(el => el.parentElement?.tagName);
    const formId = await button.evaluate(el => {
      let current = el;
      while (current && current.tagName !== 'FORM') {
        current = current.parentElement;
      }
      return current?.id || 'no-form';
    });

    console.log(`\nButton ${i}:`);
    console.log(`  Text: "${text.trim()}"`);
    console.log(`  ID: "${id}"`);
    console.log(`  Type: "${type}"`);
    console.log(`  Class: "${className}"`);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  Parent: ${parent}`);
    console.log(`  Form ID: ${formId}`);
  }

  // Check if there are buttons with Google OAuth text
  const googleButtons = await page.locator('button:has-text("Google")').all();
  console.log(`\n\nFound ${googleButtons.length} buttons with "Google":`);
  for (let i = 0; i < googleButtons.length; i++) {
    const text = await googleButtons[i].textContent();
    console.log(`  ${i}: "${text.trim()}"`);
  }

  // Check for submit buttons
  const submitButtons = await page.locator('button[type="submit"]').all();
  console.log(`\n\nFound ${submitButtons.length} submit buttons:`);
  for (let i = 0; i < submitButtons.length; i++) {
    const text = await submitButtons[i].textContent();
    const id = await submitButtons[i].getAttribute('id').catch(() => '');
    console.log(`  ${i}: id="${id}" text="${text.trim()}"`);
  }

  // Don't actually submit - just explore
  console.log('\n\nReady to identify correct button!');
});
