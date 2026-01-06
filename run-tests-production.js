#!/usr/bin/env node

/**
 * Production Test Runner for Railway
 * Run E2E tests against live production environment
 */

const { spawn } = require('child_process');

// LexyBooster production URL
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://lexybooster.com';

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║          Production Tests - Railway Environment             ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log(`🌐 Testing against: ${PRODUCTION_URL}\n`);

const testSuites = {
  'critical': {
    name: 'Critical Tests (Production)',
    tests: '01-authentication 04-import-deduplication',
    description: 'Auth + Deduplication (most important)',
    duration: '10-15 min',
  },
  'smoke': {
    name: 'Smoke Tests (Production)',
    tests: '01-authentication 02-word-sets-display',
    description: 'Quick smoke test for production',
    duration: '5-7 min',
  },
  'full': {
    name: 'Full E2E Suite (Production)',
    tests: '',
    description: 'All tests against production',
    duration: '60+ min',
  },
  'auth': {
    name: 'Authentication Only',
    tests: '01-authentication',
    description: 'Test all 39 user logins',
    duration: '3-5 min',
  },
  'import': {
    name: 'Import & Deduplication',
    tests: '04-import-deduplication',
    description: 'Critical deduplication tests',
    duration: '15-20 min',
  },
};

function printUsage() {
  console.log('Usage: node run-tests-production.js [suite]\n');
  console.log('Available test suites for PRODUCTION:\n');

  Object.keys(testSuites).forEach(key => {
    const suite = testSuites[key];
    console.log(`  ${key.padEnd(12)} - ${suite.description} (~${suite.duration})`);
  });

  console.log('\nExamples:');
  console.log('  node run-tests-production.js critical   # Recommended for production');
  console.log('  node run-tests-production.js smoke      # Quick check');
  console.log('  node run-tests-production.js auth       # Login tests only');
  console.log('\nEnvironment Variables:');
  console.log('  PRODUCTION_URL - Override production URL');
  console.log('  Example: PRODUCTION_URL=https://your-app.up.railway.app node run-tests-production.js critical');
  console.log('');
}

function runProductionTests(suiteName) {
  const suite = testSuites[suiteName];

  if (!suite) {
    console.error(`\n❌ Unknown test suite: ${suiteName}\n`);
    printUsage();
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Running: ${suite.name}`);
  console.log(`Description: ${suite.description}`);
  console.log(`Expected Duration: ${suite.duration}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Warn about production testing
  console.log('⚠️  WARNING: Testing against PRODUCTION environment');
  console.log('   - This will create real data in production database');
  console.log('   - Test users: test_de_en, test_hi_en, etc.');
  console.log('   - Password: test123\n');

  console.log('Starting tests in 3 seconds...\n');

  setTimeout(() => {
    const startTime = Date.now();

    // Build command
    let command = 'npx playwright test';

    if (suite.tests) {
      command += ` ${suite.tests}`;
    }

    command += ` --config=config/playwright.config.production.js`;

    // Add production URL as environment variable
    const env = {
      ...process.env,
      PRODUCTION_URL: PRODUCTION_URL,
      NODE_ENV: 'production',
    };

    console.log(`Command: ${command}\n`);

    const [cmd, ...args] = command.split(' ');

    const testProcess = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      env: env,
    });

    testProcess.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('\n═══════════════════════════════════════════════════════════════');

      if (code === 0) {
        console.log(`✅ Production tests PASSED in ${duration}s`);
        console.log('\n✨ Production environment is working correctly!');
      } else {
        console.log(`❌ Production tests FAILED in ${duration}s (exit code: ${code})`);
        console.log('\n⚠️  Production environment has issues!');
        console.log('   Check test report: npx playwright show-report test-results/production-report');
      }

      console.log('═══════════════════════════════════════════════════════════════\n');

      process.exit(code);
    });

    testProcess.on('error', (error) => {
      console.error(`\n❌ Error running production tests: ${error.message}\n`);
      process.exit(1);
    });
  }, 3000);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printUsage();
  process.exit(0);
}

const suiteName = args[0];
runProductionTests(suiteName);
