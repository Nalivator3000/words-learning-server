#!/usr/bin/env node

/**
 * Test Runner Script
 * Quick way to run different test suites
 */

const { spawn } = require('child_process');

const testSuites = {
  // E2E Tests
  'auth': {
    name: 'Authentication Tests',
    command: 'npx playwright test 01-authentication',
    description: 'Login/logout for all 39 test users',
  },
  'display': {
    name: 'Word Sets Display Tests',
    command: 'npx playwright test 02-word-sets-display',
    description: 'Verify word sets display correctly',
  },
  'filtering': {
    name: 'Filtering & Sorting Tests',
    command: 'npx playwright test 03-filtering-sorting',
    description: 'Test filters and search',
  },
  'import': {
    name: 'Import & Deduplication Tests (CRITICAL)',
    command: 'npx playwright test 04-import-deduplication',
    description: 'Test import and duplicate prevention',
  },
  'journeys': {
    name: 'User Journey Tests',
    command: 'npx playwright test 05-user-journeys',
    description: 'End-to-end user scenarios',
  },
  'api': {
    name: 'API Integration Tests',
    command: 'npx playwright test 06-api-integration',
    description: 'Test API endpoints',
  },
  'e2e': {
    name: 'All E2E Tests',
    command: 'npm run test:e2e',
    description: 'Run all Playwright E2E tests',
  },

  // Mobile Tests
  'mobile': {
    name: 'Mobile E2E Tests',
    command: 'npm run test:e2e:mobile',
    description: 'Run tests on mobile devices (iPhone, Galaxy)',
  },

  // Critical Tests
  'critical': {
    name: 'Critical Tests Only',
    command: 'npx playwright test 01-authentication 04-import-deduplication',
    description: 'Run only critical tests (auth + deduplication)',
  },

  // Quick Tests
  'quick': {
    name: 'Quick Smoke Tests',
    command: 'npx playwright test 01-authentication --project="Desktop Chrome"',
    description: 'Fast smoke test on desktop only',
  },

  // Backend Tests
  'backend': {
    name: 'All Backend Tests',
    command: 'npm run test:all',
    description: 'Run all Node.js backend tests',
  },

  // UI Mode
  'ui': {
    name: 'Playwright UI Mode',
    command: 'npm run test:e2e:ui',
    description: 'Run tests in interactive UI mode',
  },

  // Report
  'report': {
    name: 'Show Test Report',
    command: 'npm run test:e2e:report',
    description: 'Open HTML test report',
  },
};

function printUsage() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              LexyBooster Test Runner                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('Usage: node run-tests.js [suite]\n');

  console.log('Available test suites:\n');

  console.log('E2E Tests:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  auth        - ${testSuites.auth.description}`);
  console.log(`  display     - ${testSuites.display.description}`);
  console.log(`  filtering   - ${testSuites.filtering.description}`);
  console.log(`  import      - ${testSuites.import.description} ⭐`);
  console.log(`  journeys    - ${testSuites.journeys.description}`);
  console.log(`  api         - ${testSuites.api.description}`);
  console.log(`  e2e         - ${testSuites.e2e.description}`);
  console.log('');

  console.log('Mobile Tests:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  mobile      - ${testSuites.mobile.description}`);
  console.log('');

  console.log('Quick Tests:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  critical    - ${testSuites.critical.description} ⭐`);
  console.log(`  quick       - ${testSuites.quick.description}`);
  console.log('');

  console.log('Backend Tests:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  backend     - ${testSuites.backend.description}`);
  console.log('');

  console.log('Utilities:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  ui          - ${testSuites.ui.description}`);
  console.log(`  report      - ${testSuites.report.description}`);
  console.log('');

  console.log('Examples:');
  console.log('  node run-tests.js critical    # Run critical tests only');
  console.log('  node run-tests.js import      # Run deduplication tests');
  console.log('  node run-tests.js e2e         # Run all E2E tests');
  console.log('  node run-tests.js ui          # Open interactive UI');
  console.log('');

  console.log('Note: Server must be running on http://localhost:3001');
  console.log('      Start with: npm start');
  console.log('');
}

function runTests(suiteName) {
  const suite = testSuites[suiteName];

  if (!suite) {
    console.error(`\n❌ Unknown test suite: ${suiteName}\n`);
    printUsage();
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Running: ${suite.name.padEnd(48)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`Description: ${suite.description}`);
  console.log(`Command: ${suite.command}\n`);

  const startTime = Date.now();

  // Parse command
  const [cmd, ...args] = suite.command.split(' ');

  const testProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true
  });

  testProcess.on('close', (code) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n─────────────────────────────────────────────────────────────');

    if (code === 0) {
      console.log(`✅ Tests passed in ${duration}s`);
    } else {
      console.log(`❌ Tests failed in ${duration}s (exit code: ${code})`);
    }

    console.log('─────────────────────────────────────────────────────────────\n');

    process.exit(code);
  });

  testProcess.on('error', (error) => {
    console.error(`\n❌ Error running tests: ${error.message}\n`);
    process.exit(1);
  });
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printUsage();
  process.exit(0);
}

const suiteName = args[0];
runTests(suiteName);
