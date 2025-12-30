#!/usr/bin/env node
/**
 * Test UI across different screen resolutions and devices
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://lexybooster.com';
const TEST_EMAIL = 'test-en-de@lexybooster.test';
const TEST_PASSWORD = 'Test123!@#';

// Device configurations
const DEVICES = [
    // Desktop resolutions
    {
        name: 'Desktop-4K',
        width: 3840,
        height: 2160,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        isMobile: false
    },
    {
        name: 'Desktop-FullHD',
        width: 1920,
        height: 1080,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        isMobile: false
    },
    {
        name: 'Desktop-HD',
        width: 1366,
        height: 768,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        isMobile: false
    },
    {
        name: 'Laptop-MacBook',
        width: 1440,
        height: 900,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        isMobile: false
    },
    // Tablets
    {
        name: 'iPad-Pro-12.9',
        width: 1024,
        height: 1366,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        isMobile: true
    },
    {
        name: 'iPad-Air',
        width: 820,
        height: 1180,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        isMobile: true
    },
    {
        name: 'Samsung-Galaxy-Tab',
        width: 800,
        height: 1280,
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        isMobile: true
    },
    // Mobile phones
    {
        name: 'iPhone-15-Pro-Max',
        width: 430,
        height: 932,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        isMobile: true
    },
    {
        name: 'iPhone-SE',
        width: 375,
        height: 667,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        isMobile: true
    },
    {
        name: 'Samsung-Galaxy-S23',
        width: 360,
        height: 780,
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
        isMobile: true
    },
    {
        name: 'Google-Pixel-7',
        width: 412,
        height: 915,
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
        isMobile: true
    },
    {
        name: 'Xiaomi-Redmi-Note',
        width: 393,
        height: 851,
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
        isMobile: true
    }
];

// Pages to test
const TEST_PAGES = [
    { name: 'Login', url: BASE_URL, needsAuth: false },
    { name: 'Home', buttonId: 'homeBtn', needsAuth: true },
    { name: 'Study', buttonId: 'studyBtn', needsAuth: true },
    { name: 'Statistics', buttonId: 'statsBtn', needsAuth: true },
    { name: 'Settings', buttonId: 'settingsNavBtn', needsAuth: true }
];

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function login(page) {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    const loginEmail = await page.$('#loginEmail');
    if (loginEmail) {
        await page.type('#loginEmail', TEST_EMAIL);
        await page.type('#loginPassword', TEST_PASSWORD);
        await page.evaluate(() => {
            document.querySelector('#loginBtn').click();
        });
        await sleep(4000);
    }
}

async function testDeviceResolution(browser, device) {
    console.log(`\n📱 Testing: ${device.name} (${device.width}x${device.height})`);

    const page = await browser.newPage();

    try {
        // Set viewport and user agent
        await page.setViewport({
            width: device.width,
            height: device.height,
            isMobile: device.isMobile,
            hasTouch: device.isMobile
        });
        await page.setUserAgent(device.userAgent);

        // Login
        await login(page);

        const deviceDir = `screenshots/responsive/${device.name}`;
        if (!fs.existsSync(deviceDir)) {
            fs.mkdirSync(deviceDir, { recursive: true });
        }

        // Test each page
        for (const testPage of TEST_PAGES) {
            if (!testPage.needsAuth || testPage.buttonId) {
                console.log(`   📄 ${testPage.name}...`);

                if (testPage.buttonId) {
                    // Navigate to page
                    await page.evaluate(btnId => {
                        const btn = document.querySelector(`#${btnId}`);
                        if (btn) btn.click();
                    }, testPage.buttonId);
                    await sleep(2000);
                }

                // Capture screenshot - portrait
                const filename = `${deviceDir}/${testPage.name.toLowerCase()}.png`;
                await page.screenshot({
                    path: filename,
                    fullPage: false
                });
                console.log(`      ✅ ${filename}`);

                // If mobile, also test landscape
                if (device.isMobile && device.width < device.height) {
                    await page.setViewport({
                        width: device.height,
                        height: device.width,
                        isMobile: true,
                        hasTouch: true
                    });
                    await sleep(1000);

                    const filenameLandscape = `${deviceDir}/${testPage.name.toLowerCase()}-landscape.png`;
                    await page.screenshot({
                        path: filenameLandscape,
                        fullPage: false
                    });
                    console.log(`      ✅ ${filenameLandscape} (landscape)`);

                    // Restore portrait
                    await page.setViewport({
                        width: device.width,
                        height: device.height,
                        isMobile: true,
                        hasTouch: true
                    });
                }
            }
        }

        console.log(`   ✅ ${device.name} complete`);
        return true;

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    } finally {
        await page.close();
    }
}

async function generateReport(results) {
    const report = `# Responsive Design Test Report

**Date:** ${new Date().toISOString().split('T')[0]}
**Total Devices Tested:** ${results.length}

## Results Summary

${results.map((r, i) => `${i + 1}. **${r.device}** (${r.width}x${r.height}) - ${r.success ? '✅ PASSED' : '❌ FAILED'}`).join('\n')}

## Device Categories

### Desktop (${results.filter(r => r.category === 'Desktop').length} devices)
${results.filter(r => r.category === 'Desktop').map(r => `- ${r.device}: ${r.success ? '✅' : '❌'}`).join('\n')}

### Tablets (${results.filter(r => r.category === 'Tablet').length} devices)
${results.filter(r => r.category === 'Tablet').map(r => `- ${r.device}: ${r.success ? '✅' : '❌'}`).join('\n')}

### Mobile Phones (${results.filter(r => r.category === 'Mobile').length} devices)
${results.filter(r => r.category === 'Mobile').map(r => `- ${r.device}: ${r.success ? '✅' : '❌'}`).join('\n')}

## Screenshots

All screenshots saved to: \`screenshots/responsive/\`

Each device folder contains:
- Login screen
- Home page
- Study page
- Statistics page
- Settings page
- Landscape variants (mobile devices only)

---

**Generated by:** LexyBooster UI Test Suite
`;

    fs.writeFileSync('screenshots/responsive/REPORT.md', report);
    console.log('\n📝 Report saved: screenshots/responsive/REPORT.md');
}

async function main() {
    console.log('\n📱 Responsive Design Testing - LexyBooster\n');
    console.log('═'.repeat(80));
    console.log(`\nTesting ${DEVICES.length} different devices/resolutions:`);
    console.log(`  - Desktop: ${DEVICES.filter(d => !d.isMobile).length} devices`);
    console.log(`  - Tablets: ${DEVICES.filter(d => d.isMobile && d.width >= 700).length} devices`);
    console.log(`  - Phones: ${DEVICES.filter(d => d.isMobile && d.width < 700).length} devices`);
    console.log('\n' + '═'.repeat(80));

    if (!fs.existsSync('screenshots/responsive')) {
        fs.mkdirSync('screenshots/responsive', { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true, // Run headless for faster testing
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const results = [];

    for (const device of DEVICES) {
        const success = await testDeviceResolution(browser, device);

        const category = device.isMobile
            ? (device.width >= 700 ? 'Tablet' : 'Mobile')
            : 'Desktop';

        results.push({
            device: device.name,
            width: device.width,
            height: device.height,
            category,
            success
        });

        await sleep(1000);
    }

    await browser.close();

    console.log('\n\n═'.repeat(80));
    console.log('✅ Responsive Testing Complete!');
    console.log(`   Tested: ${results.filter(r => r.success).length}/${results.length} devices`);
    console.log(`   Screenshots: ~${results.length * TEST_PAGES.length * 1.5} images`);
    console.log('═'.repeat(80) + '\n');

    await generateReport(results);

    console.log('\n📊 Summary:');
    console.log(`   ✅ Passed: ${results.filter(r => r.success).length}`);
    console.log(`   ❌ Failed: ${results.filter(r => !r.success).length}`);
    console.log('\n📸 All screenshots: screenshots/responsive/\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
