/**
 * Debug Test - Why is wordListsSection hidden?
 */

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./helpers/page-objects');
const { TEST_PASSWORD } = require('./helpers/test-users');

test.describe('Debug Section Visibility', () => {
  test('check why sections are hidden after login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login('test_de_en', TEST_PASSWORD);

    // Wait for page to fully load
    await page.waitForTimeout(5000);

    console.log('\n=== After Login - Check Section Visibility ===');

    // Check all sections
    const sections = await page.locator('section').all();
    console.log(`\nTotal sections: ${sections.length}`);
    for (let i = 0; i < sections.length; i++) {
      const id = await sections[i].getAttribute('id').catch(() => '');
      const className = await sections[i].getAttribute('class').catch(() => '');
      const visible = await sections[i].isVisible().catch(() => false);
      const display = await sections[i].evaluate(el => window.getComputedStyle(el).display).catch(() => '');
      const opacity = await sections[i].evaluate(el => window.getComputedStyle(el).opacity).catch(() => '');
      console.log(`  Section ${i}: id="${id}" class="${className}"`);
      console.log(`    visible=${visible}, display="${display}", opacity="${opacity}"`);
    }

    // Programmatically navigate to wordLists
    console.log('\n=== Programmatically navigating to wordLists ===');
    await page.evaluate(() => {
      if (typeof window.app !== 'undefined' && typeof window.app.showSection === 'function') {
        window.app.showSection('wordLists');
      }
    });

    await page.waitForTimeout(2000);

    // Check sections again after navigation
    console.log('\n=== After programmatic navigation ===');
    const sectionsAfter = await page.locator('section').all();
    for (let i = 0; i < sectionsAfter.length; i++) {
      const id = await sectionsAfter[i].getAttribute('id').catch(() => '');
      const className = await sectionsAfter[i].getAttribute('class').catch(() => '');
      const visible = await sectionsAfter[i].isVisible().catch(() => false);
      const display = await sectionsAfter[i].evaluate(el => window.getComputedStyle(el).display).catch(() => '');
      const opacity = await sectionsAfter[i].evaluate(el => window.getComputedStyle(el).opacity).catch(() => '');
      if (id === 'wordListsSection' || id === 'homeSection') {
        console.log(`  Section: id="${id}" class="${className}"`);
        console.log(`    visible=${visible}, display="${display}", opacity="${opacity}"`);
      }
    }

    // Check specific CSS that might hide sections
    console.log('\n=== Check CSS hiding mechanisms ===');
    const wordListsSection = page.locator('#wordListsSection');
    const cssInfo = await wordListsSection.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        height: style.height,
        overflow: style.overflow,
        position: style.position,
        zIndex: style.zIndex,
        transform: style.transform
      };
    }).catch(() => null);
    console.log('wordListsSection CSS:', JSON.stringify(cssInfo, null, 2));

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-section-visibility.png', fullPage: true });

    expect(true).toBeTruthy();
  });
});
