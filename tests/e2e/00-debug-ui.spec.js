/**
 * Debug Test - Explore UI after login
 * Use this to understand what's on the page after successful login
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug UI - What appears after login?', () => {
  test('should login and show all buttons/navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Wait for page to fully load
    await page.waitForTimeout(8000); // Increased wait time

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-after-login.png', fullPage: true });

    // Log current URL
    console.log('Current URL:', page.url());

    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent().catch(() => '');
      const id = await buttons[i].getAttribute('id').catch(() => '');
      const isVisible = await buttons[i].isVisible().catch(() => false);
      if (isVisible && (text.trim() || id)) {
        console.log(`  Button ${i}: id="${id}" text="${text.trim()}"`);
      }
    }

    // Find all links
    const links = await page.locator('a').all();
    console.log(`\nFound ${links.length} links:`);
    for (let i = 0; i < links.length; i++) {
      const text = await links[i].textContent().catch(() => '');
      const href = await links[i].getAttribute('href').catch(() => '');
      const id = await links[i].getAttribute('id').catch(() => '');
      const isVisible = await links[i].isVisible().catch(() => false);
      if (isVisible && (text.trim() || id)) {
        console.log(`  Link ${i}: id="${id}" href="${href}" text="${text.trim()}"`);
      }
    }

    // Find all elements with IDs
    const elementsWithIds = await page.locator('[id]').all();
    console.log(`\nFound ${elementsWithIds.length} elements with IDs (showing first 50 visible):`);
    let count = 0;
    for (const el of elementsWithIds) {
      if (count >= 50) break;
      const id = await el.getAttribute('id').catch(() => '');
      const tag = await el.evaluate(node => node.tagName).catch(() => '');
      const isVisible = await el.isVisible().catch(() => false);
      if (isVisible && id) {
        console.log(`  ${tag}#${id}`);
        count++;
      }
    }

    // Check for specific navigation elements we expect
    const navElements = [
      '#wordListsBtn',
      '#homeBtn',
      '#studyBtn',
      '#reviewBtn',
      '#statsBtn',
      '#settingsNavBtn',
      'button:has-text("Word Lists")',
      'button:has-text("Study")',
      'a[href*="word-lists"]',
      'a[href*="study"]'
    ];

    console.log('\n\nChecking for expected navigation elements:');
    for (const selector of navElements) {
      const exists = await page.locator(selector).count();
      const visible = exists > 0 ? await page.locator(selector).first().isVisible().catch(() => false) : false;
      console.log(`  ${selector}: ${exists > 0 ? (visible ? '✅ VISIBLE' : '⚠️ EXISTS but HIDDEN') : '❌ NOT FOUND'}`);
    }

    // Get page title
    const title = await page.title();
    console.log('\nPage title:', title);

    // Get body text (first 500 chars)
    const bodyText = await page.locator('body').textContent();
    console.log('\nBody text (first 500 chars):', bodyText.substring(0, 500));

    // Always pass - this is just for exploration
    expect(true).toBeTruthy();
  });
});
