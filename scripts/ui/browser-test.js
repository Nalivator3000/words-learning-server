#!/usr/bin/env node
/**
 * Interactive Browser Testing with Puppeteer
 * Opens lexybooster.com in a real browser for UI testing
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://lexybooster.com';

async function takeScreenshot(page, name) {
    const filename = `screenshots/${name}-${Date.now()}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`   📸 Screenshot saved: ${filename}`);
    return filename;
}

async function testHomePage(page) {
    console.log('\n📄 Testing Home Page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Get page title
    const title = await page.title();
    console.log(`   ✅ Title: "${title}"`);

    // Check for main elements
    const checks = [
        { selector: 'body', name: 'Body element' },
        { selector: 'header', name: 'Header' },
        { selector: 'nav', name: 'Navigation' },
        { selector: 'main', name: 'Main content' },
    ];

    for (const check of checks) {
        const element = await page.$(check.selector);
        if (element) {
            console.log(`   ✅ ${check.name} found`);
        } else {
            console.log(`   ❌ ${check.name} missing`);
        }
    }

    await takeScreenshot(page, 'homepage');
}

async function testNavigation(page) {
    console.log('\n🧭 Testing Navigation...');

    // Find all navigation links
    const links = await page.$$eval('a', anchors =>
        anchors.map(a => ({ text: a.textContent.trim(), href: a.href }))
    );

    console.log(`   📊 Found ${links.length} links`);

    // Show first 10 links
    links.slice(0, 10).forEach((link, i) => {
        console.log(`   ${i + 1}. ${link.text || '(no text)'} → ${link.href}`);
    });
}

async function testLanguageSelection(page) {
    console.log('\n🌐 Testing Language Selection...');

    // Try to find language selector
    const languageButtons = await page.$$('[data-language], .language-btn, button[class*="language"]');

    if (languageButtons.length > 0) {
        console.log(`   ✅ Found ${languageButtons.length} language buttons`);

        // Get text from each button
        for (let i = 0; i < Math.min(languageButtons.length, 10); i++) {
            const text = await page.evaluate(el => el.textContent, languageButtons[i]);
            console.log(`   ${i + 1}. ${text.trim()}`);
        }
    } else {
        console.log('   ⚠️  No language buttons found (might use different selector)');
    }
}

async function testAPIIntegration(page) {
    console.log('\n🔌 Testing API Integration...');

    // Intercept network requests
    const apiCalls = [];

    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/')) {
            apiCalls.push({
                url: url.replace(BASE_URL, ''),
                status: response.status(),
                type: response.request().resourceType()
            });
        }
    });

    // Reload page to capture API calls
    await page.reload({ waitUntil: 'networkidle2' });

    if (apiCalls.length > 0) {
        console.log(`   ✅ Captured ${apiCalls.length} API calls:`);
        apiCalls.forEach(call => {
            const status = call.status === 200 ? '✅' : '❌';
            console.log(`   ${status} ${call.url} (${call.status})`);
        });
    } else {
        console.log('   ⚠️  No API calls detected');
    }
}

async function testConsoleErrors(page) {
    console.log('\n🐛 Testing Console Errors...');

    const errors = [];
    const warnings = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        } else if (msg.type() === 'warning') {
            warnings.push(msg.text());
        }
    });

    await page.reload({ waitUntil: 'networkidle2' });

    if (errors.length > 0) {
        console.log(`   ❌ Found ${errors.length} console errors:`);
        errors.slice(0, 5).forEach((err, i) => {
            console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
        });
    } else {
        console.log('   ✅ No console errors');
    }

    if (warnings.length > 0) {
        console.log(`   ⚠️  Found ${warnings.length} warnings`);
    }
}

async function main() {
    console.log('\n🌐 LexyBooster Interactive Browser Test');
    console.log('═'.repeat(80));
    console.log(`URL: ${BASE_URL}`);
    console.log('═'.repeat(80));

    // Create screenshots directory
    const fs = require('fs');
    if (!fs.existsSync('screenshots')) {
        fs.mkdirSync('screenshots');
    }

    const browser = await puppeteer.launch({
        headless: false, // Show browser window
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();

        // Run tests
        await testHomePage(page);
        await testNavigation(page);
        await testLanguageSelection(page);
        await testAPIIntegration(page);
        await testConsoleErrors(page);

        console.log('\n═'.repeat(80));
        console.log('✅ All tests completed!');
        console.log('\nBrowser will stay open for manual testing...');
        console.log('Press Ctrl+C to close the browser and exit.');
        console.log('═'.repeat(80) + '\n');

        // Keep browser open for manual inspection
        await new Promise(() => {}); // Never resolves - keeps running

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await browser.close();
        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
    console.log('\n\n👋 Closing browser...\n');
    process.exit(0);
});

main();
