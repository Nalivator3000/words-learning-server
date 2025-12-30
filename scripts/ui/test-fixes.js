#!/usr/bin/env node
/**
 * Test UI fixes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function main() {
    console.log('\n🔧 Testing UI Fixes...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    console.log('📍 Opening https://lexybooster.com');
    await page.goto('https://lexybooster.com', {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    // Wait for auth modal
    await new Promise(r => setTimeout(r, 2000));

    // Extract updated styles
    const styles = await page.evaluate(() => {
        const result = {};

        // Auth tabs
        const authTabs = document.querySelector('.auth-tabs');
        if (authTabs) {
            const computed = window.getComputedStyle(authTabs);
            result.authTabs = {
                gap: computed.gap,
                display: computed.display
            };
        }

        // Auth divider
        const authDivider = document.querySelector('.auth-divider');
        if (authDivider) {
            const computed = window.getComputedStyle(authDivider);
            result.authDivider = {
                display: computed.display,
                margin: computed.margin,
                background: computed.background,
                height: computed.height
            };
        }

        return result;
    });

    console.log('\n✅ Updated Styles:\n');
    console.log('Auth Tabs:');
    console.log('  Gap:', styles.authTabs.gap, styles.authTabs.gap !== 'normal' ? '✅' : '❌');
    console.log('  Display:', styles.authTabs.display);

    console.log('\nAuth Divider:');
    console.log('  Display:', styles.authDivider.display);
    console.log('  Margin:', styles.authDivider.margin);
    console.log('  Background:', styles.authDivider.background);

    // Take screenshot
    if (!fs.existsSync('screenshots')) {
        fs.mkdirSync('screenshots');
    }
    const screenshotPath = `screenshots/fixed-ui-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`\n📸 Screenshot: ${screenshotPath}`);
    console.log('\n✅ Test complete! Check the browser window.');
    console.log('Press Ctrl+C to close.\n');

    await new Promise(() => {});
}

process.on('SIGINT', () => {
    console.log('\n👋 Closing...\n');
    process.exit(0);
});

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
