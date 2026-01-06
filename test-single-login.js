#!/usr/bin/env node

/**
 * Quick test to verify login works on production
 * Tests a single user login to validate fixes
 */

const { chromium } = require('playwright');

async function testLogin() {
  console.log('🧪 Testing single user login on production...\n');

  const browser = await chromium.launch({ headless: false }); // Show browser
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Go to production site
    console.log('📍 Navigating to https://lexybooster.com...');
    await page.goto('https://lexybooster.com');

    // Wait a bit for page to load
    await page.waitForTimeout(2000);

    // Check if onboarding modal is visible
    const onboardingVisible = await page.isVisible('#onboardingModal');
    console.log(`  Onboarding modal visible: ${onboardingVisible}`);

    // Check if auth modal is visible
    const authModalVisible = await page.isVisible('#authModal');
    console.log(`  Auth modal visible: ${authModalVisible}`);

    // Check if login tab exists
    const loginTabExists = await page.isVisible('#loginTab');
    console.log(`  Login tab visible: ${loginTabExists}\n`);

    if (onboardingVisible) {
      console.log('⚠️  Onboarding modal is blocking - attempting to close...');
      // Try to find close button
      const closeBtn = await page.locator('#onboardingModal .close, #onboardingModal [aria-label="Close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        console.log('✅ Closed onboarding modal');
        await page.waitForTimeout(1000);
      }
    }

    // Wait for auth modal to be visible
    console.log('🔐 Waiting for auth modal...');
    await page.waitForSelector('#authModal', { state: 'visible', timeout: 10000 });
    console.log('✅ Auth modal is visible');

    // Click login tab
    console.log('🔐 Clicking login tab...');
    await page.click('#loginTab');
    await page.waitForTimeout(300);

    // Fill credentials for test_de_en user
    const email = 'test.de.en@lexibooster.test';
    const password = 'test123';

    console.log(`🔐 Logging in as: ${email}`);
    await page.fill('#loginEmail', email);
    await page.fill('#loginPassword', password);

    // Click login button
    await page.click('#loginBtn');
    console.log('✅ Clicked login button');

    // Wait for auth modal to close
    console.log('⏳ Waiting for auth modal to close...');
    await page.waitForSelector('#authModal', { state: 'hidden', timeout: 15000 });
    console.log('✅ Auth modal closed!');

    // Wait for home section
    console.log('⏳ Waiting for home section...');
    await page.waitForSelector('#homeSection.active', { timeout: 15000 });
    console.log('✅ Home section is active!');

    // Take screenshot of success
    await page.screenshot({ path: 'test-login-success.png' });
    console.log('📸 Screenshot saved: test-login-success.png');

    console.log('\n✅✅✅ LOGIN SUCCESSFUL! ✅✅✅\n');

  } catch (error) {
    console.error('\n❌ Login failed:', error.message);

    // Take screenshot of error
    await page.screenshot({ path: 'test-login-error.png' });
    console.log('📸 Error screenshot saved: test-login-error.png');

    // Print page content for debugging
    const content = await page.content();
    console.log('\nPage HTML (first 500 chars):', content.substring(0, 500));

  } finally {
    await browser.close();
  }
}

testLogin();
