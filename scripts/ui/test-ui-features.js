#!/usr/bin/env node
/**
 * Interactive UI Feature Testing
 * Tests specific features on lexybooster.com
 */

const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLanguageSelector(page) {
    console.log('\n🌐 Testing Language Selector...');

    // Look for language buttons/flags
    const languages = await page.$$eval('[data-language], button[class*="lang"], .flag', els =>
        els.map(el => ({ text: el.textContent.trim(), class: el.className }))
    );

    if (languages.length > 0) {
        console.log(`✅ Found ${languages.length} language options:`);
        languages.forEach((lang, i) => {
            console.log(`   ${i + 1}. ${lang.text} (${lang.class})`);
        });
    } else {
        console.log('⚠️  No language buttons found, checking for other selectors...');

        // Try different selectors
        const allButtons = await page.$$eval('button', btns =>
            btns.map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 30)
        );

        console.log(`\n📋 All buttons on page (${allButtons.length} total):`);
        allButtons.slice(0, 20).forEach((btn, i) => {
            console.log(`   ${i + 1}. "${btn}"`);
        });
    }
}

async function testWordLists(page) {
    console.log('\n📚 Testing Word Lists...');

    // Check for word-related elements
    const wordElements = await page.$$eval('[class*="word"], [data-word]', els => els.length);
    console.log(`✅ Word elements found: ${wordElements}`);

    // Check for list elements
    const listElements = await page.$$eval('ul, ol, [class*="list"]', els => els.length);
    console.log(`✅ List elements found: ${listElements}`);
}

async function checkAPIEndpoints(page) {
    console.log('\n🔌 Checking API Endpoints...');

    const requests = [];

    page.on('request', request => {
        if (request.url().includes('/api/')) {
            requests.push({
                method: request.method(),
                url: request.url()
            });
        }
    });

    console.log('   Reloading page to capture API calls...');
    await page.reload({ waitUntil: 'networkidle0' });
    await sleep(2000);

    if (requests.length > 0) {
        console.log(`\n✅ Captured ${requests.length} API requests:`);
        requests.forEach((req, i) => {
            console.log(`   ${i + 1}. ${req.method} ${req.url.replace('https://lexybooster.com', '')}`);
        });
    } else {
        console.log('⚠️  No API requests detected');
    }
}

async function inspectElements(page) {
    console.log('\n🔍 Inspecting Page Structure...');

    const structure = await page.evaluate(() => {
        const result = {};

        // Count different element types
        result.divs = document.querySelectorAll('div').length;
        result.buttons = document.querySelectorAll('button').length;
        result.inputs = document.querySelectorAll('input').length;
        result.forms = document.querySelectorAll('form').length;
        result.images = document.querySelectorAll('img').length;
        result.scripts = document.querySelectorAll('script').length;
        result.styles = document.querySelectorAll('link[rel="stylesheet"]').length;

        // Get all unique classes
        const allElements = document.querySelectorAll('*');
        const classes = new Set();
        allElements.forEach(el => {
            if (el.className && typeof el.className === 'string') {
                el.className.split(' ').forEach(c => {
                    if (c.trim()) classes.add(c.trim());
                });
            }
        });

        result.uniqueClasses = Array.from(classes).slice(0, 30); // First 30 classes

        return result;
    });

    console.log('\n📊 Element counts:');
    Object.entries(structure).forEach(([key, value]) => {
        if (key !== 'uniqueClasses') {
            console.log(`   ${key}: ${value}`);
        }
    });

    console.log('\n🎨 CSS classes found (first 30):');
    structure.uniqueClasses.forEach((cls, i) => {
        console.log(`   ${i + 1}. ${cls}`);
    });
}

async function interactiveCommands(page) {
    console.log('\n💻 Interactive Mode');
    console.log('═'.repeat(60));
    console.log('Commands:');
    console.log('  1 - Test language selector');
    console.log('  2 - Test word lists');
    console.log('  3 - Check API endpoints');
    console.log('  4 - Inspect page structure');
    console.log('  5 - Take screenshot');
    console.log('  6 - Get current URL');
    console.log('  7 - Click element by text');
    console.log('  q - Quit');
    console.log('═'.repeat(60) + '\n');

    while (true) {
        const command = await question('\n> Enter command: ');

        switch (command.trim()) {
            case '1':
                await testLanguageSelector(page);
                break;

            case '2':
                await testWordLists(page);
                break;

            case '3':
                await checkAPIEndpoints(page);
                break;

            case '4':
                await inspectElements(page);
                break;

            case '5':
                const timestamp = Date.now();
                await page.screenshot({ path: `screenshots/manual-${timestamp}.png`, fullPage: true });
                console.log(`✅ Screenshot saved: screenshots/manual-${timestamp}.png`);
                break;

            case '6':
                console.log(`✅ Current URL: ${page.url()}`);
                break;

            case '7':
                const text = await question('   Enter text to click: ');
                try {
                    await page.click(`text=${text}`);
                    console.log(`✅ Clicked element with text: "${text}"`);
                    await sleep(1000);
                } catch (e) {
                    console.log(`❌ Could not find element with text: "${text}"`);
                }
                break;

            case 'q':
            case 'quit':
            case 'exit':
                return;

            default:
                console.log('❌ Unknown command');
        }
    }
}

async function main() {
    console.log('\n🌐 LexyBooster UI Testing Tool');
    console.log('═'.repeat(60));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    console.log('\n📍 Opening https://lexybooster.com...');
    await page.goto('https://lexybooster.com', {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    const title = await page.title();
    console.log(`✅ Page loaded: ${title}`);

    // Run initial inspection
    await inspectElements(page);

    // Interactive mode
    await interactiveCommands(page);

    console.log('\n👋 Closing browser...\n');
    await browser.close();
    rl.close();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
