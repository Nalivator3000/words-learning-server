// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for LexyBooster
 * Phase 1: Mobile Web UI Testing
 */
module.exports = defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test configuration
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3001',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile devices - Priority for Phase 1
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] }, // 375x667
    },
    {
      name: 'iPhone 12 Pro',
      use: { ...devices['iPhone 12 Pro'] }, // 390x844
    },
    {
      name: 'iPhone 14 Pro Max',
      use: { ...devices['iPhone 14 Pro Max'] }, // 430x932
    },
    {
      name: 'Galaxy S21',
      use: {
        ...devices['Galaxy S8'], // Similar to S21
        viewport: { width: 360, height: 800 },
      },
    },

    // Tablets
    {
      name: 'iPad Mini',
      use: { ...devices['iPad Mini'] }, // 768x1024
    },
    {
      name: 'iPad Pro',
      use: { ...devices['iPad Pro 11'] }, // 834x1194
    },
  ],

  // Run your local dev server before starting the tests
  // Comment out if server is already running manually
  // webServer: {
  //   command: 'npm start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
