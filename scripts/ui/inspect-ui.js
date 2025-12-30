#!/usr/bin/env node
/**
 * Simple UI Inspector using Puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://lexybooster.com';

async function main() {
    console.log('\n🌐 Opening LexyBooster in browser...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox']
    });

    const page = await browser.newPage();

    console.log('📍 Navigating to', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Get basic info
    const title = await page.title();
    console.log(`✅ Page title: "${title}"`);

    // Get page HTML structure
    const bodyHTML = await page.evaluate(() => {
        return document.body ? document.body.innerHTML.substring(0, 500) : 'No body';
    });

    console.log('\n📄 Page Content Preview:');
    console.log(bodyHTML.substring(0, 200) + '...\n');

    // Check for specific elements
    console.log('🔍 Checking UI elements...\n');

    const elements = [
        { selector: 'header', name: 'Header' },
        { selector: 'nav', name: 'Navigation' },
        { selector: 'main', name: 'Main content' },
        { selector: 'footer', name: 'Footer' },
        { selector: 'button', name: 'Buttons' },
        { selector: 'input', name: 'Input fields' },
        { selector: '[class*="language"]', name: 'Language elements' },
        { selector: '[class*="word"]', name: 'Word elements' },
    ];

    for (const el of elements) {
        try {
            const count = await page.$$eval(el.selector, els => els.length);
            if (count > 0) {
                console.log(`✅ ${el.name}: ${count} found`);
            } else {
                console.log(`❌ ${el.name}: none found`);
            }
        } catch (e) {
            console.log(`⚠️  ${el.name}: error checking`);
        }
    }

    // Take screenshot
    const screenshotDir = 'screenshots';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    const screenshotPath = `${screenshotDir}/lexybooster-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    // Get all text content
    const allText = await page.evaluate(() => document.body.innerText);
    console.log('\n📝 Page text content (first 300 chars):');
    console.log(allText.substring(0, 300).trim());

    console.log('\n═'.repeat(80));
    console.log('✅ Inspection complete!');
    console.log('\n🌐 Browser is now open for manual inspection.');
    console.log('   You can interact with the page directly.');
    console.log('   Press Ctrl+C when done to close.');
    console.log('═'.repeat(80) + '\n');

    // Keep browser open
    await new Promise(() => {});
}

process.on('SIGINT', () => {
    console.log('\n👋 Closing browser...\n');
    process.exit(0);
});

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
