// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Production (Railway)
 * Tests against live production environment
 */
module.exports = defineConfig({
  testDir: '../tests/e2e',

  // Longer timeout for production (network latency)
  timeout: 60 * 1000, // 60 seconds

  // Test configuration
  expect: {
    timeout: 15000, // 15 seconds for assertions (increased for production)
  },

  // Run tests in files in parallel
  fullyParallel: false, // Sequential for production to avoid rate limits

  // Retry failed tests on production
  retries: 0,

  // Single worker for production to avoid overwhelming server
  workers: 1,

  // Global timeout for each test
  globalTimeout: 0, // No global timeout

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/production-report' }],
    ['../config/progress-reporter.js'], // Custom progress bar reporter
    ['json', { outputFile: 'test-results/production-results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Production URL - LexyBooster production site
    baseURL: process.env.PRODUCTION_URL || 'https://lexybooster.com',

    // Collect trace on failure for debugging
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Longer navigation timeout for production
    navigationTimeout: 45000,

    // Longer action timeout - gentler on production
    actionTimeout: 20000,

    // Force English locale for all tests
    locale: 'en-US',
  },

  // Configure projects - multiple devices for production testing
  projects: [
    // Desktop
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile devices
    {
      name: 'iPhone 12 Pro',
      use: { ...devices['iPhone 12 Pro'] },
    },

    {
      name: 'Pixel 5',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
