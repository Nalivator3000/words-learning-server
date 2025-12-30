#!/usr/bin/env node
/**
 * Inspect navigation structure and capture all menu pages
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://lexybooster.com';
const TEST_EMAIL = 'test-en-de@lexybooster.test';
const TEST_PASSWORD = 'Test123!@#';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function login(page) {
    console.log('🔐 Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    await page.type('#loginEmail', TEST_EMAIL);
    await page.type('#loginPassword', TEST_PASSWORD);
    await page.click('#loginBtn');
    await sleep(4000);

    console.log('✅ Logged in\n');
}

async function inspectDOM(page) {
    console.log('🔍 Inspecting DOM structure...\n');

    const structure = await page.evaluate(() => {
        const result = {
            navigation: [],
            buttons: [],
            sections: [],
            mainContent: null
        };

        // Find navigation elements
        const navs = document.querySelectorAll('nav, [role="navigation"], .nav, .menu, .navigation');
        navs.forEach((nav, idx) => {
            const links = Array.from(nav.querySelectorAll('a, button')).map(el => ({
                text: el.textContent.trim(),
                tag: el.tagName.toLowerCase(),
                id: el.id,
                class: el.className,
                href: el.href || '',
                onclick: el.onclick ? 'has onclick' : ''
            }));

            result.navigation.push({
                index: idx,
                id: nav.id,
                class: nav.className,
                itemCount: links.length,
                items: links
            });
        });

        // Find all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            const text = btn.textContent.trim();
            if (text.length > 0 && text.length < 50) {
                result.buttons.push({
                    text: text,
                    id: btn.id,
                    class: btn.className,
                    parent: btn.parentElement?.tagName.toLowerCase()
                });
            }
        });

        // Find main sections
        const sections = document.querySelectorAll('section, main, [role="main"], .page, .content, [data-page]');
        sections.forEach(section => {
            result.sections.push({
                tag: section.tagName.toLowerCase(),
                id: section.id,
                class: section.className,
                dataPage: section.dataset?.page || ''
            });
        });

        // Get main content area
        const main = document.querySelector('main, [role="main"], #app, #root');
        if (main) {
            result.mainContent = {
                id: main.id,
                class: main.className,
                childCount: main.children.length
            };
        }

        return result;
    });

    console.log('📋 Navigation Elements Found:', structure.navigation.length);
    structure.navigation.forEach((nav, idx) => {
        console.log(`\n  Nav #${idx + 1} (${nav.itemCount} items):`);
        console.log(`    ID: ${nav.id || 'none'}`);
        console.log(`    Class: ${nav.class || 'none'}`);
        nav.items.forEach(item => {
            console.log(`    - ${item.text} [${item.tag}${item.id ? '#' + item.id : ''}${item.class ? '.' + item.class.split(' ')[0] : ''}]`);
        });
    });

    console.log('\n\n🔘 Action Buttons Found:', structure.buttons.length);
    const uniqueButtons = [...new Set(structure.buttons.map(b => b.text))];
    uniqueButtons.slice(0, 20).forEach(text => {
        const btn = structure.buttons.find(b => b.text === text);
        console.log(`  - "${text}" [${btn.id || 'no-id'}]`);
    });

    console.log('\n\n📄 Main Sections Found:', structure.sections.length);
    structure.sections.forEach(section => {
        console.log(`  - ${section.tag}${section.id ? '#' + section.id : ''}${section.dataPage ? ' [data-page=' + section.dataPage + ']' : ''}`);
    });

    console.log('\n\n🎯 Main Content Area:');
    if (structure.mainContent) {
        console.log(`  ID: ${structure.mainContent.id || 'none'}`);
        console.log(`  Class: ${structure.mainContent.class || 'none'}`);
        console.log(`  Children: ${structure.mainContent.childCount}`);
    }

    return structure;
}

async function captureAllPages(page) {
    console.log('\n\n📸 Capturing all visible pages...\n');

    if (!fs.existsSync('screenshots/navigation')) {
        fs.mkdirSync('screenshots/navigation', { recursive: true });
    }

    // Capture current page
    const pageTitle = await page.title();
    console.log(`📄 Current page: ${pageTitle}`);
    await page.screenshot({
        path: 'screenshots/navigation/00-initial-view.png',
        fullPage: true
    });
    console.log('  ✅ Saved: 00-initial-view.png');

    // Try to find and click common navigation items
    const commonNavItems = [
        { name: 'Home', selectors: ['a[href="/"]', 'button:contains("Home")', '[data-page="home"]', '#homeBtn', '.home-btn'] },
        { name: 'Import', selectors: ['a[href*="import"]', 'button:contains("Import")', '[data-page="import"]', '#importBtn'] },
        { name: 'Study', selectors: ['a[href*="study"]', 'button:contains("Study")', '[data-page="study"]', '#studyBtn'] },
        { name: 'Review', selectors: ['a[href*="review"]', 'button:contains("Review")', '[data-page="review"]', '#reviewBtn'] },
        { name: 'Statistics', selectors: ['a[href*="stats"]', 'button:contains("Statistics")', '[data-page="stats"]', '#statsBtn'] },
        { name: 'Settings', selectors: ['a[href*="settings"]', 'button:contains("Settings")', '[data-page="settings"]', '#settingsBtn'] }
    ];

    for (let i = 0; i < commonNavItems.length; i++) {
        const item = commonNavItems[i];
        console.log(`\n  Trying to navigate to: ${item.name}`);

        let clicked = false;
        for (const selector of item.selectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    console.log(`    Found with selector: ${selector}`);
                    await element.click();
                    await sleep(2000);
                    clicked = true;
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }

        if (clicked) {
            const filename = `screenshots/navigation/${i + 1}-${item.name.toLowerCase()}.png`;
            await page.screenshot({ path: filename, fullPage: true });
            console.log(`    ✅ Saved: ${filename}`);
        } else {
            console.log(`    ⚠️  Could not find navigation for ${item.name}`);
        }
    }
}

async function main() {
    console.log('\n🔍 Navigation Inspector - LexyBooster\n');
    console.log('═'.repeat(80) + '\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        await login(page);
        await inspectDOM(page);
        await captureAllPages(page);

        console.log('\n\n═'.repeat(80));
        console.log('✅ Inspection complete!');
        console.log('📸 Screenshots saved to: screenshots/navigation/');
        console.log('═'.repeat(80) + '\n');

        console.log('ℹ️  Browser will remain open for manual inspection.');
        console.log('   Press Ctrl+C to close.\n');

        // Keep browser open
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        await page.screenshot({ path: 'screenshots/navigation/error.png' });
    }
}

process.on('SIGINT', () => {
    console.log('\n👋 Closing...\n');
    process.exit(0);
});

main().catch(err => {
    console.error('❌ Fatal Error:', err.message);
    process.exit(1);
});
