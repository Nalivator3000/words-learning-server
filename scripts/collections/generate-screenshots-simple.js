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

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, name, description) {
  console.log(`📸 Taking screenshot: ${name}`);
  await page.waitForTimeout(1500);  // Wait for animations

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
  console.log('📋 Instructions:');
  console.log('   1. A browser window will open');
  console.log('   2. Please log in manually with demo@fluentflow.app / DemoPassword123!');
  console.log('   3. After login, press ENTER in this terminal to continue\n');

  const browser = await puppeteer.launch({
    headless: false,  // Show browser for manual login
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(MOBILE_VIEWPORT);

    // Open app
    console.log('🌐 Opening app...');
    await page.goto(APP_URL, { waitUntil: 'load', timeout: 60000 });

    // Wait for user to log in manually
    console.log('\n⏸️  PAUSED: Please log in manually in the browser window');
    console.log('   Email: demo@fluentflow.app');
    console.log('   Password: DemoPassword123!');
    console.log('   Press ENTER when logged in and ready...');

    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('\n✅ Continuing with screenshot generation...\n');

    // 1. Home Screen / Dashboard
    console.log('📱 Screenshot 1: Home Screen');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '01-home-dashboard', 'Home screen with statistics');

    // 2. Study Mode - Light Theme
    console.log('\n📱 Screenshot 2: Study Mode (Light)');
    await page.click('#studyBtn');
    await page.waitForTimeout(500);
    await page.waitForSelector('.mode-btn', { timeout: 10000 });
    await page.click('.mode-btn');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-study-mode-light', 'Study mode light theme');

    // 3. Study Mode - Dark Theme
    console.log('\n📱 Screenshot 3: Study Mode (Dark)');
    await page.evaluate(() => {
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '03-study-mode-dark', 'Study mode dark theme');

    // Switch back to light theme
    await page.evaluate(() => {
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) toggle.click();
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
      await modeButtons[1].click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '04-word-building', 'Word building exercise');
    } else {
      console.log('   ⚠️  Word Building not available, using first mode');
      await modeButtons[0].click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '04-word-building', 'Alternative exercise mode');
    }

    // 5. Typing Mode or SRS Review
    console.log('\n📱 Screenshot 5: Typing/Review');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);

    const reviewBtn = await page.$('#reviewBtn');
    if (reviewBtn) {
      const isDisabled = await page.evaluate(btn => btn.disabled, reviewBtn);
      if (!isDisabled) {
        await page.click('#reviewBtn');
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '05-srs-review', 'SRS review screen');
      } else {
        console.log('   ℹ️  No reviews available, using Typing mode');
        await page.click('#studyBtn');
        await page.waitForTimeout(500);
        const modes = await page.$$('.mode-btn');
        if (modes.length > 2) {
          await modes[2].click();  // Typing mode
        } else {
          await modes[0].click();
        }
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '05-typing-mode', 'Typing mode exercise');
      }
    }

    // 6. Statistics Dashboard
    console.log('\n📱 Screenshot 6: Statistics');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);
    await page.click('#statsBtn');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '06-statistics', 'Statistics dashboard');

    // 7. Import Screen
    console.log('\n📱 Screenshot 7: Import');
    await page.click('#importBtn');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '07-import', 'Import screen');

    // 8. Home in Dark Mode
    console.log('\n📱 Screenshot 8: Dark Theme Home');
    await page.click('#homeBtn');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '08-dark-theme-home', 'Home screen dark theme');

    console.log('\n✅ All screenshots generated successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}\n`);

    console.log('Press ENTER to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error('❌ Error generating screenshots:', error.message);
    console.log('\n📸 Screenshots may be partially generated.');
    console.log('   Check the screenshots folder for what was created.');
  } finally {
    await browser.close();
    process.exit(0);
  }
}

// Run the script
generateScreenshots().catch(console.error);
