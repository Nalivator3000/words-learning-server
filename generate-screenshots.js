/**
 * Automated Screenshot Generator for Google Play Store
 *
 * This script uses Puppeteer to automatically capture screenshots
 * of the FluentFlow app at 1080x2400px resolution.
 *
 * Requirements:
 * - npm install puppeteer --save-dev
 * - App running at http://localhost:3001
 * - Test account with data already created
 *
 * Usage:
 * node generate-screenshots.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const APP_URL = 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, 'public', 'store-assets', 'screenshots');
const VIEWPORT = { width: 1080, height: 2400, deviceScaleFactor: 3 };

// Test account credentials (create these in your app first!)
const TEST_ACCOUNT = {
    email: 'demo@fluentflow.app',
    password: 'DemoPassword123!'
};

const SCREENSHOTS = [
    {
        name: 'screenshot-01-home-dashboard',
        path: '/',
        description: 'Home Dashboard',
        waitFor: '.dashboard', // CSS selector to wait for
        delay: 1000 // Additional delay in ms
    },
    {
        name: 'screenshot-02-study-mode',
        path: '/',
        description: 'Study Mode',
        action: async (page) => {
            // Click "Study" button
            await page.click('button:has-text("Study")');
            await page.waitForTimeout(1500);
        },
        delay: 1000
    },
    {
        name: 'screenshot-03-srs-review',
        path: '/',
        description: 'SRS Review',
        action: async (page) => {
            // Click "Review" button
            await page.click('button:has-text("Review")');
            await page.waitForTimeout(1500);
        },
        delay: 1000
    },
    {
        name: 'screenshot-04-statistics',
        path: '/',
        description: 'Statistics Dashboard',
        action: async (page) => {
            // Click "Stats" or navigate to statistics page
            await page.click('a[href*="stats"], button:has-text("Stats")');
            await page.waitForTimeout(2000); // Wait for charts to render
        },
        delay: 1000
    },
    {
        name: 'screenshot-05-achievements',
        path: '/',
        description: 'Achievements & Gamification',
        action: async (page) => {
            // Click on achievements/profile icon
            await page.click('[data-screen="achievements"], button:has-text("Achievements")');
            await page.waitForTimeout(1500);
        },
        delay: 1000
    },
    {
        name: 'screenshot-06-dark-mode',
        path: '/',
        description: 'Dark Mode Home',
        action: async (page) => {
            // Toggle dark mode
            await page.click('[data-action="toggle-theme"], button[title*="theme"]');
            await page.waitForTimeout(1000);
            // Navigate back to home
            await page.click('a[href="/"], button:has-text("Home")');
            await page.waitForTimeout(1000);
        },
        delay: 1000
    },
    {
        name: 'screenshot-07-import-words',
        path: '/',
        description: 'Import Words',
        action: async (page) => {
            // Click "Import" button
            await page.click('button:has-text("Import"), a[href*="import"]');
            await page.waitForTimeout(1500);
        },
        delay: 1000
    },
    {
        name: 'screenshot-08-settings',
        path: '/',
        description: 'Settings',
        action: async (page) => {
            // Click settings icon/button
            await page.click('[data-screen="settings"], button:has-text("Settings"), a[href*="settings"]');
            await page.waitForTimeout(1500);
        },
        delay: 1000
    }
];

async function login(page) {
    console.log('🔐 Logging in...');

    try {
        // Wait for login form
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });

        // Enter credentials
        await page.type('input[type="email"], input[name="email"]', TEST_ACCOUNT.email);
        await page.type('input[type="password"], input[name="password"]', TEST_ACCOUNT.password);

        // Click login button
        await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

        // Wait for dashboard to load
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

        console.log('✅ Logged in successfully');
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        console.log('ℹ️  Make sure:');
        console.log('   1. App is running at', APP_URL);
        console.log('   2. Test account exists:', TEST_ACCOUNT.email);
        console.log('   3. CSS selectors match your login form');
        throw error;
    }
}

async function takeScreenshot(browser, screenshot, index) {
    const page = await browser.newPage();

    try {
        // Set viewport to Android phone size
        await page.setViewport(VIEWPORT);

        console.log(`\n📸 [${index + 1}/${SCREENSHOTS.length}] ${screenshot.description}...`);

        // Navigate to page
        await page.goto(APP_URL + screenshot.path, { waitUntil: 'networkidle2' });

        // Login if needed (only on first screenshot)
        if (index === 0) {
            const isLoggedIn = await page.$('.dashboard, [data-logged-in="true"]');
            if (!isLoggedIn) {
                await login(page);
            }
        }

        // Execute custom action if defined
        if (screenshot.action) {
            try {
                await screenshot.action(page);
            } catch (actionError) {
                console.warn(`⚠️  Action failed for ${screenshot.name}:`, actionError.message);
                console.log('   Continuing with screenshot anyway...');
            }
        }

        // Wait for specific element if defined
        if (screenshot.waitFor) {
            try {
                await page.waitForSelector(screenshot.waitFor, { timeout: 5000 });
            } catch (waitError) {
                console.warn(`⚠️  Element "${screenshot.waitFor}" not found, continuing...`);
            }
        }

        // Additional delay for animations
        if (screenshot.delay) {
            await page.waitForTimeout(screenshot.delay);
        }

        // Take screenshot
        const outputPath = path.join(OUTPUT_DIR, `${screenshot.name}.png`);
        await page.screenshot({
            path: outputPath,
            fullPage: false // Only capture viewport
        });

        const stats = fs.statSync(outputPath);
        console.log(`   ✅ Saved: ${screenshot.name}.png (${(stats.size / 1024).toFixed(2)} KB)`);

    } catch (error) {
        console.error(`   ❌ Failed to capture ${screenshot.name}:`, error.message);
    } finally {
        await page.close();
    }
}

async function generateScreenshots() {
    console.log('🚀 Starting screenshot generation...\n');
    console.log(`📱 Viewport: ${VIEWPORT.width}x${VIEWPORT.height}px`);
    console.log(`🌐 App URL: ${APP_URL}`);
    console.log(`📁 Output: ${OUTPUT_DIR}\n`);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log('📁 Created output directory\n');
    }

    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Set to true for production
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null
        });

        console.log('🌐 Browser launched\n');

        // Take each screenshot
        for (let i = 0; i < SCREENSHOTS.length; i++) {
            await takeScreenshot(browser, SCREENSHOTS[i], i);
        }

        console.log('\n✅ All screenshots generated!');
        console.log(`📁 Location: ${OUTPUT_DIR}`);
        console.log('\n📋 Next steps:');
        console.log('   1. Review screenshots in public/store-assets/screenshots/');
        console.log('   2. Verify dimensions: 1080x2400px');
        console.log('   3. Upload to Google Play Console');

    } catch (error) {
        console.error('\n❌ Screenshot generation failed:', error);
        console.log('\nℹ️  Troubleshooting:');
        console.log('   - Is the app running? (npm start)');
        console.log('   - Does test account exist?', TEST_ACCOUNT.email);
        console.log('   - Are CSS selectors correct for your app?');
        console.log('   - Check SCREENSHOTS_GUIDE.md for manual capture instructions');
    } finally {
        if (browser) {
            await browser.close();
            console.log('\n🌐 Browser closed');
        }
    }
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
} catch (e) {
    console.error('❌ Puppeteer is not installed!');
    console.log('\n📦 Install it with:');
    console.log('   npm install --save-dev puppeteer');
    console.log('\nℹ️  Or capture screenshots manually using Chrome DevTools');
    console.log('   See SCREENSHOTS_GUIDE.md for instructions');
    process.exit(1);
}

// Run
generateScreenshots().catch(console.error);
