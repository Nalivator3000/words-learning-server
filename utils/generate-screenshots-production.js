/**
 * Automated Screenshot Generator for Google Play Store (PRODUCTION)
 *
 * This script uses Puppeteer to automatically capture screenshots
 * of the FluentFlow app at 1080x2400px resolution from production URL.
 *
 * Requirements:
 * - npm install puppeteer --save-dev
 * - Production app running at Railway
 * - Demo account with data already created
 *
 * Usage:
 * node generate-screenshots-production.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const APP_URL = 'https://words-learning-server-copy-production.up.railway.app';
const OUTPUT_DIR = path.join(__dirname, 'public', 'store-assets', 'screenshots');
const VIEWPORT = { width: 1080, height: 2400, deviceScaleFactor: 2 };

// Helper function to replace deprecated waitForTimeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Demo account credentials
const DEMO_ACCOUNT = {
    email: 'demo@fluentflow.app',
    password: 'DemoPassword123!'
};

const SCREENSHOTS = [
    {
        name: '01-home-dashboard',
        description: 'Home Dashboard with Stats',
        waitAfterLogin: 3000,
        action: async (page) => {
            // Wait for dashboard to fully load
            await page.waitForSelector('.stats-grid, .stat-card', { timeout: 10000 });
            await sleep(2000);
        }
    },
    {
        name: '02-study-mode',
        description: 'Study Mode - Multiple Choice',
        action: async (page) => {
            // Click Study button
            const studyBtn = await page.$('#studyBtn, button[data-translate="study"]');
            if (studyBtn) {
                await studyBtn.click();
                await sleep(1500);

                // Click multiple choice mode
                const modeBtn = await page.$('#multipleChoiceBtn, button[data-translate="multipleChoice"]');
                if (modeBtn) {
                    await modeBtn.click();
                    await sleep(2000);
                }
            }
        }
    },
    {
        name: '03-review-section',
        description: 'Review Section',
        action: async (page) => {
            // Go back to home first
            const homeBtn = await page.$('#homeBtn, button[data-translate="home"]');
            if (homeBtn) {
                await homeBtn.click();
                await sleep(1000);
            }

            // Click Review button
            const reviewBtn = await page.$('#reviewBtn, button[data-translate="review"]');
            if (reviewBtn) {
                await reviewBtn.click();
                await sleep(2000);
            }
        }
    },
    {
        name: '04-statistics',
        description: 'Statistics & Analytics',
        action: async (page) => {
            // Go back to home first
            const homeBtn = await page.$('#homeBtn, button[data-translate="home"]');
            if (homeBtn) {
                await homeBtn.click();
                await sleep(1000);
            }

            // Click Statistics button
            const statsBtn = await page.$('#statsBtn, button[data-translate="statistics"]');
            if (statsBtn) {
                await statsBtn.click();
                await sleep(3000); // Wait for charts
            }
        }
    },
    {
        name: '05-leaderboard',
        description: 'Leaderboard Rankings',
        action: async (page) => {
            // Click Leaderboard button
            const leaderboardBtn = await page.$('#leaderboardBtn');
            if (leaderboardBtn) {
                await leaderboardBtn.click();
                await sleep(2000);
            }
        }
    },
    {
        name: '06-achievements',
        description: 'Achievements & Gamification',
        action: async (page) => {
            // Go to stats section first
            const statsBtn = await page.$('#statsBtn, button[data-translate="statistics"]');
            if (statsBtn) {
                await statsBtn.click();
                await sleep(2000);

                // Scroll to gamification section
                await page.evaluate(() => {
                    const gamificationSection = document.querySelector('#gamificationStatsContainer, .gamification-section');
                    if (gamificationSection) {
                        gamificationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
                await sleep(2000);
            }
        }
    },
    {
        name: '07-dark-mode',
        description: 'Dark Mode Theme',
        action: async (page) => {
            // Toggle dark mode
            const themeToggle = await page.$('#themeToggle, .theme-toggle');
            if (themeToggle) {
                await themeToggle.click();
                await sleep(1000);
            }

            // Go to home
            const homeBtn = await page.$('#homeBtn, button[data-translate="home"]');
            if (homeBtn) {
                await homeBtn.click();
                await sleep(1500);
            }
        }
    },
    {
        name: '08-settings',
        description: 'Settings & Preferences',
        action: async (page) => {
            // Toggle back to light mode first (optional)
            const themeToggle = await page.$('#themeToggle, .theme-toggle');
            if (themeToggle) {
                await themeToggle.click();
                await sleep(500);
            }

            // Click user menu / settings
            const userMenuBtn = await page.$('#userMenuBtn, .settings-btn');
            if (userMenuBtn) {
                await userMenuBtn.click();
                await sleep(500);

                // Click settings option
                const settingsBtn = await page.$('#settingsBtn, button[data-translate="settings"]');
                if (settingsBtn) {
                    await settingsBtn.click();
                    await sleep(2000);
                }
            }
        }
    }
];

async function login(page) {
    console.log('🔐 Logging in to production...');

    try {
        // Wait for login modal or form
        await page.waitForSelector('#loginEmail, input[type="email"]', { timeout: 10000 });

        // Type credentials
        await page.type('#loginEmail, input[type="email"]', DEMO_ACCOUNT.email);
        await page.type('#loginPassword, input[type="password"]', DEMO_ACCOUNT.password);

        // Click login button
        await page.click('#loginBtn, button[data-translate="login"]');

        // Wait for dashboard to load (wait for auth modal to disappear)
        await page.waitForFunction(
            () => {
                const modal = document.querySelector('#authModal');
                return modal && (modal.style.display === 'none' || !modal.classList.contains('active'));
            },
            { timeout: 10000 }
        );

        console.log('✅ Logged in successfully');

        // Additional wait for data to load
        await sleep(2000);

    } catch (error) {
        console.error('❌ Login failed:', error.message);
        console.log('ℹ️  Make sure:');
        console.log('   1. Production app is accessible:', APP_URL);
        console.log('   2. Demo account exists:', DEMO_ACCOUNT.email);
        console.log('   3. Account has demo activity (run add-demo-activity.js)');
        throw error;
    }
}

async function setEnglishLanguage(page) {
    console.log('🌐 Setting UI language to English...');

    try {
        // Open user menu
        const userMenuBtn = await page.$('#userMenuBtn, .settings-btn');
        if (userMenuBtn) {
            await userMenuBtn.click();
            await sleep(500);

            // Click settings
            const settingsBtn = await page.$('#settingsBtn, button[data-translate="settings"]');
            if (settingsBtn) {
                await settingsBtn.click();
                await sleep(1000);

                // Select English from dropdown
                const languageSelect = await page.$('#uiLanguageSelect');
                if (languageSelect) {
                    await languageSelect.select('en');
                    await sleep(1500); // Wait for UI to update
                    console.log('✅ Language set to English');
                }

                // Go back to home
                const homeBtn = await page.$('#homeBtn, button[data-translate="home"]');
                if (homeBtn) {
                    await homeBtn.click();
                    await sleep(1000);
                }
            }
        }
    } catch (error) {
        console.warn('⚠️  Could not set English language:', error.message);
        console.log('   Continuing with current language...');
    }
}

async function generateScreenshots() {
    console.log('🚀 Starting screenshot generation from PRODUCTION...\n');
    console.log(`📱 Viewport: ${VIEWPORT.width}x${VIEWPORT.height}px (scale: ${VIEWPORT.deviceScaleFactor}x)`);
    console.log(`🌐 Production URL: ${APP_URL}`);
    console.log(`👤 Demo Account: ${DEMO_ACCOUNT.email}`);
    console.log(`📁 Output: ${OUTPUT_DIR}\n`);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log('📁 Created output directory\n');
    }

    let browser;
    try {
        // Launch browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Set to true for background execution
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ],
            defaultViewport: VIEWPORT
        });

        const page = await browser.newPage();
        await page.setViewport(VIEWPORT);

        console.log('✅ Browser launched\n');

        // Navigate to app
        console.log('📱 Loading production app...');
        await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ App loaded\n');

        // Login
        await login(page);

        // Set language to English
        await setEnglishLanguage(page);

        // Take screenshots
        console.log('\n📸 Capturing screenshots...\n');
        for (let i = 0; i < SCREENSHOTS.length; i++) {
            const screenshot = SCREENSHOTS[i];
            console.log(`📸 [${i + 1}/${SCREENSHOTS.length}] ${screenshot.description}...`);

            try {
                // Execute action
                if (screenshot.action) {
                    await screenshot.action(page);
                }

                // Wait if specified
                if (screenshot.waitAfterLogin && i === 0) {
                    await sleep(screenshot.waitAfterLogin);
                }

                // Take screenshot
                const outputPath = path.join(OUTPUT_DIR, `${screenshot.name}.png`);
                await page.screenshot({
                    path: outputPath,
                    fullPage: false
                });

                const stats = fs.statSync(outputPath);
                console.log(`   ✅ Saved: ${screenshot.name}.png (${(stats.size / 1024).toFixed(2)} KB)\n`);

            } catch (error) {
                console.error(`   ❌ Failed: ${error.message}\n`);
            }
        }

        console.log('✅ All screenshots generated!\n');
        console.log(`📁 Location: ${OUTPUT_DIR}`);
        console.log('\n📋 Next steps:');
        console.log('   1. Review screenshots in public/store-assets/screenshots/');
        console.log('   2. Verify dimensions: 1080x2400px');
        console.log('   3. Check English UI language');
        console.log('   4. Upload to Google Play Console\n');

    } catch (error) {
        console.error('\n❌ Screenshot generation failed:', error);
        console.log('\nℹ️  Troubleshooting:');
        console.log('   - Is production app accessible?', APP_URL);
        console.log('   - Does demo account exist?', DEMO_ACCOUNT.email);
        console.log('   - Has demo activity been added? (node add-demo-activity.js)');
        console.log('   - Check browser console for errors');
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🌐 Browser closed');
        }
    }
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
    console.log('✅ Puppeteer found\n');
} catch (e) {
    console.error('❌ Puppeteer is not installed!\n');
    console.log('📦 Install it with:');
    console.log('   npm install --save-dev puppeteer\n');
    console.log('ℹ️  This will download Chromium (~170-300 MB)');
    console.log('   Or use manual screenshot capture via Chrome DevTools\n');
    process.exit(1);
}

// Run
generateScreenshots().catch(console.error);
