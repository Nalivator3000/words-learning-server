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
    timeout: 10000, // 10 seconds for assertions
  },

  // Run tests in files in parallel
  fullyParallel: false, // Sequential for production to avoid rate limits

  // Retry failed tests on production
  retries: 2,

  // Single worker for production to avoid overwhelming server
  workers: 1,

  // Global timeout for entire test run
  globalTimeout: 0,

  // Delay between tests to respect rate limits
  globalSetup: null,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/production-report' }],
    ['../config/progress-reporter.js'], // Custom progress bar reporter
    ['json', { outputFile: 'test-results/production-results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Production URL - SET THIS TO YOUR RAILWAY URL
    baseURL: process.env.PRODUCTION_URL || 'https://your-app.up.railway.app',

    // Collect trace on failure for debugging
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Longer navigation timeout for production
    navigationTimeout: 30000,

    // Longer action timeout - gentler on production
    actionTimeout: 15000,
  },

  // Configure projects - fewer devices for production testing
  projects: [
    // Desktop only for production smoke tests
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },

    // One mobile device for mobile testing
    {
      name: 'iPhone 12 Pro',
      use: { ...devices['iPhone 12 Pro'] },
    },
  ],
});
