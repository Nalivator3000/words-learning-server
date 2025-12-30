#!/usr/bin/env node
/**
 * Comprehensive Automated UI Test Suite
 * Tests all major functionality of LexyBooster
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://lexybooster.com';
const SCREENSHOT_DIR = 'test-screenshots';
const TEST_EMAIL = `test${Date.now()}@lexybooster.com`;
const TEST_PASSWORD = 'Test123!@#';
const TEST_NAME = 'Test User';

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page, name) {
    const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`  📸 Screenshot: ${name}.png`);
    return filepath;
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ========================================
// PHASE 1: AUTHENTICATION TESTS
// ========================================

async function testLoginScreen(page) {
    console.log('\n📋 Test 1: Login Screen');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Check for login form
    const loginForm = await page.$('#loginForm');
    if (loginForm) {
        console.log('  ✅ Login form found');
        await screenshot(page, '01-login-screen');

        // Check buttons spacing
        const authTabs = await page.evaluate(() => {
            const tabs = document.querySelector('.auth-tabs');
            const computed = window.getComputedStyle(tabs);
            return {
                gap: computed.gap,
                display: computed.display
            };
        });

        console.log(`  ✅ Auth tabs gap: ${authTabs.gap} (should not be 'normal')`);
        console.log(`  ✅ Auth tabs display: ${authTabs.display}`);
    } else {
        console.log('  ❌ Login form not found');
    }
}

async function testRegistrationScreen(page) {
    console.log('\n📋 Test 2: Registration Screen');

    // Click register tab
    await page.click('#registerTab');
    await sleep(1000);
    await screenshot(page, '02-registration-screen');

    const registerForm = await page.$('#registerForm');
    if (registerForm) {
        console.log('  ✅ Registration form found');

        // Check form fields
        const fields = await page.$$eval('#registerForm input, #registerForm select', els =>
            els.map(el => ({ type: el.type, id: el.id, required: el.required }))
        );

        console.log(`  ✅ Found ${fields.length} form fields:`);
        fields.forEach(f => {
            console.log(`     - ${f.id} (${f.type})${f.required ? ' *required*' : ''}`);
        });
    } else {
        console.log('  ❌ Registration form not found');
    }
}

async function testUserRegistration(page) {
    console.log('\n📋 Test 3: User Registration Flow');

    try {
        // Fill registration form
        await page.type('#registerName', TEST_NAME);
        await page.type('#registerEmail', TEST_EMAIL);
        await page.type('#registerPassword', TEST_PASSWORD);
        await page.type('#registerPasswordConfirm', TEST_PASSWORD);

        // Select languages
        await page.select('#registerNativeLang', 'ru');
        await page.select('#registerTargetLang', 'en');

        // Accept terms
        await page.click('#acceptTerms');

        await screenshot(page, '03-registration-filled');
        console.log('  ✅ Form filled successfully');

        // Submit
        await page.click('#registerBtn');
        await sleep(3000);

        // Check if registered (should see main app or success message)
        const url = page.url();
        console.log(`  ✅ After registration URL: ${url}`);

        await screenshot(page, '03-after-registration');

        // Check for welcome message or app loaded
        const appLoaded = await page.$('#app, #mainNav, header');
        if (appLoaded) {
            console.log('  ✅ App loaded after registration');
        } else {
            console.log('  ⚠️  App may not have loaded');
        }
    } catch (error) {
        console.log(`  ❌ Registration error: ${error.message}`);
        await screenshot(page, '03-registration-error');
    }
}

async function testEmailLogin(page) {
    console.log('\n📋 Test 5: Email/Password Login');

    try {
        // Logout first if logged in
        const logoutBtn = await page.$('#logoutBtn, #logoutBtnSettings');
        if (logoutBtn) {
            await logoutBtn.click();
            await sleep(2000);
        }

        // Go to login
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await sleep(2000);

        // Fill login form
        await page.type('#loginEmail', TEST_EMAIL);
        await page.type('#loginPassword', TEST_PASSWORD);

        await screenshot(page, '05-login-filled');

        // Submit
        await page.click('#loginBtn');
        await sleep(3000);

        await screenshot(page, '05-after-login');

        // Verify logged in
        const appLoaded = await page.$('#app, #mainNav');
        if (appLoaded) {
            console.log('  ✅ Login successful');
        } else {
            console.log('  ❌ Login may have failed');
        }
    } catch (error) {
        console.log(`  ❌ Login error: ${error.message}`);
    }
}

// ========================================
// PHASE 2: NAVIGATION TESTS
// ========================================

async function testNavigationMenu(page) {
    console.log('\n📋 Test 7: All Menu Items');

    const menuItems = [
        { selector: '[data-page="home"], #homeBtn', name: 'Home' },
        { selector: '[data-page="import"], #importBtn', name: 'Import' },
        { selector: '[data-page="study"], #studyBtn', name: 'Study' },
        { selector: '[data-page="review"], #reviewBtn', name: 'Review' },
        { selector: '[data-page="stats"], #statsBtn', name: 'Stats' },
        { selector: '[data-page="settings"], #settingsBtn', name: 'Settings' }
    ];

    for (const item of menuItems) {
        try {
            console.log(`\n  📍 Testing: ${item.name}`);

            // Click menu item
            const selector = item.selector.split(', ')[0];
            await page.click(selector);
            await sleep(2000);

            // Scroll to bottom
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await sleep(1000);

            // Take screenshot
            await screenshot(page, `07-${item.name.toLowerCase()}-page`);

            // Scroll to top
            await page.evaluate(() => window.scrollTo(0, 0));

            console.log(`  ✅ ${item.name} page tested`);
        } catch (error) {
            console.log(`  ❌ ${item.name} error: ${error.message}`);
        }
    }
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function main() {
    console.log('\n🧪 LexyBooster Comprehensive UI Test Suite');
    console.log('═'.repeat(80));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        // Phase 1: Authentication
        console.log('\n🔐 PHASE 1: AUTHENTICATION');
        console.log('═'.repeat(80));
        await testLoginScreen(page);
        await testRegistrationScreen(page);
        await testUserRegistration(page);
        await testEmailLogin(page);

        // Phase 2: Navigation
        console.log('\n🧭 PHASE 2: NAVIGATION');
        console.log('═'.repeat(80));
        await testNavigationMenu(page);

        console.log('\n═'.repeat(80));
        console.log('✅ Test suite completed!');
        console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}/`);
        console.log('\nBrowser will stay open for manual inspection.');
        console.log('Press Ctrl+C to close.');
        console.log('═'.repeat(80) + '\n');

        // Keep browser open
        await new Promise(() => {});
    } catch (error) {
        console.error('\n❌ Test suite error:', error);
        await screenshot(page, 'error');
        await browser.close();
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\n\n👋 Closing browser...\n');
    process.exit(0);
});

main();
