#!/usr/bin/env node
/**
 * Complete navigation testing with screenshots
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

async function testNavigationItem(page, name, buttonId, sectionId, index) {
    console.log(`\n${index}. Testing: ${name}`);

    try {
        // Click navigation button using JavaScript (more reliable)
        const clicked = await page.evaluate(btnId => {
            const btn = document.querySelector(`#${btnId}`);
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }, buttonId);

        if (!clicked) {
            console.log(`   ❌ Button #${buttonId} not found`);
            return false;
        }

        await sleep(2000);

        // Check if section is visible
        const section = await page.$(`#${sectionId}`);
        if (section) {
            const isVisible = await page.evaluate(sel => {
                const el = document.querySelector(sel);
                return el && el.offsetParent !== null;
            }, `#${sectionId}`);

            if (isVisible) {
                console.log(`   ✅ ${name} section visible`);
            } else {
                console.log(`   ⚠️  ${name} section exists but not visible`);
            }
        } else {
            console.log(`   ❌ Section #${sectionId} not found`);
        }

        // Scroll to bottom
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await sleep(500);

        // Take screenshot at top
        const filename = `screenshots/navigation/${String(index).padStart(2, '0')}-${name.toLowerCase().replace(/\s+/g, '-')}-top.png`;
        await page.screenshot({ path: filename, fullPage: false });
        console.log(`   📸 Saved: ${filename}`);

        // Scroll to middle
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await sleep(500);

        const filenameMiddle = `screenshots/navigation/${String(index).padStart(2, '0')}-${name.toLowerCase().replace(/\s+/g, '-')}-middle.png`;
        await page.screenshot({ path: filenameMiddle, fullPage: false });
        console.log(`   📸 Saved: ${filenameMiddle}`);

        // Scroll to bottom
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await sleep(500);

        const filenameBottom = `screenshots/navigation/${String(index).padStart(2, '0')}-${name.toLowerCase().replace(/\s+/g, '-')}-bottom.png`;
        await page.screenshot({ path: filenameBottom, fullPage: false });
        console.log(`   📸 Saved: ${filenameBottom}`);

        // Get page info
        const pageInfo = await page.evaluate(() => {
            return {
                buttons: document.querySelectorAll('button').length,
                inputs: document.querySelectorAll('input, select, textarea').length,
                links: document.querySelectorAll('a').length
            };
        });

        console.log(`   📊 Elements: ${pageInfo.buttons} buttons, ${pageInfo.inputs} inputs, ${pageInfo.links} links`);

        return true;

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('\n🧭 Complete Navigation Test - LexyBooster\n');
    console.log('═'.repeat(80) + '\n');

    if (!fs.existsSync('screenshots/navigation')) {
        fs.mkdirSync('screenshots/navigation', { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        await login(page);

        // All navigation items to test
        const navItems = [
            { name: 'Home', buttonId: 'homeBtn', sectionId: 'homeSection' },
            { name: 'Import', buttonId: 'importBtn', sectionId: 'importSection' },
            { name: 'Word Lists', buttonId: 'wordListsBtn', sectionId: 'wordListsSection' },
            { name: 'Study', buttonId: 'studyBtn', sectionId: 'studySection' },
            { name: 'Review', buttonId: 'reviewBtn', sectionId: 'reviewSection' },
            { name: 'Challenges', buttonId: 'challengesBtn', sectionId: 'challengesSection' },
            { name: 'Leagues', buttonId: 'leaguesBtn', sectionId: 'leaguesSection' },
            { name: 'Weekly', buttonId: 'weeklyChallengesBtn', sectionId: 'weeklyChallengesSection' },
            { name: 'Rating', buttonId: 'personalRatingBtn', sectionId: 'personalRatingSection' },
            { name: 'Insights', buttonId: 'personalInsightsBtn', sectionId: 'personalInsightsSection' },
            { name: 'Friends', buttonId: 'friendsBtn', sectionId: 'friendsSection' },
            { name: 'Duels', buttonId: 'duelsBtn', sectionId: 'duelsSection' },
            { name: 'Achievements', buttonId: 'achievementsBtn', sectionId: 'achievementsSection' },
            { name: 'Leaderboard', buttonId: 'leaderboardBtn', sectionId: 'leaderboardSection' },
            { name: 'Statistics', buttonId: 'statsBtn', sectionId: 'statsSection' },
            { name: 'Settings', buttonId: 'settingsNavBtn', sectionId: 'settingsSection' }
        ];

        let successCount = 0;
        for (let i = 0; i < navItems.length; i++) {
            const success = await testNavigationItem(
                page,
                navItems[i].name,
                navItems[i].buttonId,
                navItems[i].sectionId,
                i + 1
            );
            if (success) successCount++;
            await sleep(1000);
        }

        console.log('\n\n═'.repeat(80));
        console.log(`✅ Navigation Test Complete!`);
        console.log(`   Success: ${successCount}/${navItems.length} pages tested`);
        console.log(`   Screenshots: ${successCount * 3} images saved`);
        console.log('📸 Location: screenshots/navigation/');
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
