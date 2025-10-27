const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const APP_URL = 'https://words-learning-server-copy-production.up.railway.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const MOBILE_VIEWPORT = {
  width: 1080,
  height: 2400,
  deviceScaleFactor: 2
};

// Test user credentials (demo account created by create-test-account.js)
const TEST_USER = {
  email: 'demo@fluentflow.app',
  password: 'DemoPassword123!'
};

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function login(page) {
  console.log('🔐 Logging in...');

  try {
    await page.goto(APP_URL, {
      waitUntil: 'load',  // Just wait for page load, not network idle
      timeout: 120000  // 2 minutes for initial page load (Railway cold start)
    });

    console.log('   Page loaded, waiting for login form...');

    // Wait for login form to appear
    await page.waitForSelector('#loginEmail', { timeout: 20000 });

    console.log('   Filling in credentials...');
    await page.type('#loginEmail', TEST_USER.email, { delay: 50 });
    await page.type('#loginPassword', TEST_USER.password, { delay: 50 });

    console.log('   Clicking login button...');
    await page.click('#loginBtn');

    // Wait for home screen elements to appear (instead of waiting for modal to hide)
    await page.waitForSelector('#homeBtn', { timeout: 20000 });

    console.log('   Waiting for app to fully load...');
    await page.waitForTimeout(3000);  // Give app time to initialize

    console.log('✅ Logged in successfully');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function takeScreenshot(page, name, description) {
  console.log(`📸 Taking screenshot: ${name}`);

  // Wait a bit for animations to complete
  await page.waitForTimeout(1000);

  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({
    path: filepath,
    fullPage: false
  });

  console.log(`   ✅ Saved: ${filepath}`);
  return filepath;
}

async function generateScreenshots() {
  console.log('🚀 Starting screenshot generation...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 180000  // 3 minutes protocol timeout
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(MOBILE_VIEWPORT);

    // Set longer default timeout for all operations
    page.setDefaultTimeout(60000);

    // Login first
    await login(page);

    // 1. Home Screen / Dashboard
    console.log('\n📱 Screenshot 1: Home Screen');
    await page.waitForSelector('.app-header');
    await takeScreenshot(page, '01-home-dashboard', 'Home screen with statistics, streak, and level');

    // 2. Study Mode - Light Theme
    console.log('\n📱 Screenshot 2: Study Mode (Light)');
    await page.click('#studyBtn');
    await page.waitForTimeout(500);
    await page.waitForSelector('.mode-btn');
    await page.click('.mode-btn'); // Click first mode (Multiple Choice)
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-study-mode-light', 'Study mode with word card in light theme');

    // 3. Study Mode - Dark Theme
    console.log('\n📱 Screenshot 3: Study Mode (Dark)');
    // Toggle dark mode
    await page.evaluate(() => {
      const themeToggle = document.querySelector('.theme-toggle');
      if (themeToggle) themeToggle.click();
    });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '03-study-mode-dark', 'Study mode in dark theme');

    // Switch back to light theme
    await page.evaluate(() => {
      const themeToggle = document.querySelector('.theme-toggle');
      if (themeToggle) themeToggle.click();
    });
    await page.waitForTimeout(500);

    // 4. Word Building Exercise
    console.log('\n📱 Screenshot 4: Word Building');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);
    await page.click('#studyBtn');
    await page.waitForTimeout(500);
    const modeButtons = await page.$$('.mode-btn');
    if (modeButtons.length > 1) {
      await modeButtons[1].click(); // Word Building
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '04-word-building', 'Word building exercise');
    }

    // 5. SRS Review Screen
    console.log('\n📱 Screenshot 5: SRS Review');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);

    // Check if review is available
    const reviewBtn = await page.$('#reviewBtn');
    if (reviewBtn) {
      const isDisabled = await page.evaluate(btn => btn.disabled, reviewBtn);
      if (!isDisabled) {
        await page.click('#reviewBtn');
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '05-srs-review', 'SRS review screen');
      } else {
        console.log('   ⚠️  No reviews available, using study mode instead');
        await page.click('#studyBtn');
        await page.waitForTimeout(500);
        await page.click('.mode-btn');
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '05-srs-review', 'Study screen (review not available)');
      }
    }

    // 6. Statistics Dashboard
    console.log('\n📱 Screenshot 6: Statistics');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);
    await page.click('#statsBtn');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '06-statistics', 'Statistics dashboard with charts');

    // 7. Import Screen
    console.log('\n📱 Screenshot 7: Import');
    await page.click('#importBtn');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '07-import', 'Import screen with language pairs');

    // 8. Settings / Profile
    console.log('\n📱 Screenshot 8: Settings');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);

    // Click settings icon
    const settingsBtn = await page.$('.settings-btn');
    if (settingsBtn) {
      await settingsBtn.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '08-settings', 'Settings and profile');
    } else {
      // If no settings, take another home screenshot in dark mode
      await page.evaluate(() => {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) themeToggle.click();
      });
      await page.waitForTimeout(500);
      await takeScreenshot(page, '08-settings', 'Home screen in dark theme');
    }

    console.log('\n✅ All screenshots generated successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
generateScreenshots().catch(console.error);
