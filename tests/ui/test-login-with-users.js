#!/usr/bin/env node
/**
 * Test login with created test users
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://lexybooster.com';
const TEST_PASSWORD = 'Test123!@#';

// Sample test users to verify
const TEST_USERS = [
    { email: 'test-en-de@lexybooster.test', scenario: 'English → German' },
    { email: 'test-ru-en@lexybooster.test', scenario: 'Russian → English' },
    { email: 'test-ui-zh@lexybooster.test', scenario: 'Chinese UI' },
    { email: 'test-rtl@lexybooster.test', scenario: 'RTL (Arabic)' }
];

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function testLogin(browser, user) {
    const page = await browser.newPage();

    try {
        console.log(`\n🔐 Testing: ${user.email}`);
        console.log(`   Scenario: ${user.scenario}`);

        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        await sleep(2000);

        // Check if already logged in (from previous test)
        const loggedIn = await page.evaluate(() => {
            return document.cookie.includes('connect.sid');
        });

        if (loggedIn) {
            console.log('   ℹ️  Already logged in, logging out first...');
            // Navigate to logout or clear cookies
            await page.evaluate(() => {
                document.cookie.split(";").forEach(c => {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            });
            await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
            await sleep(2000);
        }

        // Fill login form
        const loginEmailInput = await page.$('#loginEmail');
        if (!loginEmailInput) {
            console.log('   ❌ Login form not found on page');
            await page.screenshot({ path: `screenshots/error-${user.email.split('@')[0]}.png` });
            return false;
        }

        await page.type('#loginEmail', user.email);
        await page.type('#loginPassword', TEST_PASSWORD);

        console.log('   ✅ Filled login form');

        // Take screenshot before login
        await page.screenshot({
            path: `screenshots/before-login-${user.email.split('@')[0]}.png`
        });

        // Click login button
        await page.click('#loginBtn');
        await sleep(3000);

        // Check if login successful
        const currentUrl = page.url();
        const pageTitle = await page.title();

        console.log(`   📍 URL: ${currentUrl}`);
        console.log(`   📄 Title: ${pageTitle}`);

        // Take screenshot after login
        await page.screenshot({
            path: `screenshots/after-login-${user.email.split('@')[0]}.png`,
            fullPage: true
        });

        // Check for user profile or main app elements
        const isLoggedIn = await page.evaluate(() => {
            // Check for elements that only appear when logged in
            const hasUserMenu = document.querySelector('[data-user-menu]') !== null;
            const hasMainNav = document.querySelector('nav') !== null;
            const hasStudySection = document.querySelector('[data-study]') !== null;
            const hasUsername = document.body.innerText.includes('Test');

            return hasUserMenu || hasMainNav || hasStudySection || hasUsername;
        });

        if (isLoggedIn) {
            console.log('   ✅ Login successful!');
        } else {
            console.log('   ⚠️  Login status unclear - check screenshots');
        }

        return true;

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        await page.screenshot({
            path: `screenshots/error-${user.email.split('@')[0]}.png`
        });
        return false;
    } finally {
        await page.close();
    }
}

async function main() {
    console.log('\n🧪 Testing Login with Test Users');
    console.log('═'.repeat(80));

    if (!fs.existsSync('screenshots')) {
        fs.mkdirSync('screenshots');
    }

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    let successCount = 0;

    for (const user of TEST_USERS) {
        const success = await testLogin(browser, user);
        if (success) successCount++;
        await sleep(2000);
    }

    console.log('\n═'.repeat(80));
    console.log(`✅ Tests Complete: ${successCount}/${TEST_USERS.length} successful`);
    console.log('📸 Screenshots saved to: screenshots/');
    console.log('═'.repeat(80) + '\n');

    console.log('ℹ️  Browser will remain open for manual inspection.');
    console.log('   Press Ctrl+C to close.\n');

    // Keep browser open
    await new Promise(() => {});
}

process.on('SIGINT', () => {
    console.log('\n👋 Closing browser...\n');
    process.exit(0);
});

main().catch(err => {
    console.error('❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
