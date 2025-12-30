#!/usr/bin/env node
/**
 * Open LexyBooster site in Puppeteer browser for testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('\n🚀 Launching browser...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    console.log('📍 Opening https://lexybooster.com\n');
    await page.goto('https://lexybooster.com', {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    await sleep(2000);

    // Get page info
    const title = await page.title();
    console.log(`✅ Title: ${title}`);

    // Get URL
    const url = page.url();
    console.log(`✅ URL: ${url}`);

    // Count elements
    try {
        const buttonCount = await page.$$eval('button', btns => btns.length);
        console.log(`✅ Buttons: ${buttonCount}`);

        const linkCount = await page.$$eval('a', links => links.length);
        console.log(`✅ Links: ${linkCount}`);

        const inputCount = await page.$$eval('input', inputs => inputs.length);
        console.log(`✅ Inputs: ${inputCount}`);
    } catch (e) {
        console.log('⚠️  Could not count elements:', e.message);
    }

    // Take screenshot
    if (!fs.existsSync('screenshots')) {
        fs.mkdirSync('screenshots');
    }
    const screenshotPath = `screenshots/lexybooster-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot: ${screenshotPath}`);

    // Get page text
    try {
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('\n📝 Page text (first 200 chars):');
        console.log(pageText.substring(0, 200));
    } catch (e) {
        console.log('⚠️  Could not get page text');
    }

    console.log('\n═'.repeat(60));
    console.log('✅ Browser opened successfully!');
    console.log('   The browser window will stay open.');
    console.log('   Press Ctrl+C to close it.');
    console.log('═'.repeat(60) + '\n');

    // Keep running
    await new Promise(() => {});
}

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...\n');
    process.exit(0);
});

main().catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
