#!/usr/bin/env node
/**
 * Master Test Runner
 * Runs all test suites and generates comprehensive report
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_SUITES = [
    // Critical - Database
    { name: 'Database Schema', path: 'tests/database/test-vocabulary-schema.js', critical: true },
    { name: 'Translation Coverage', path: 'tests/database/test-translation-coverage.js', critical: true },

    // Critical - Security
    { name: 'Security Tests', path: 'tests/security/test-security.js', critical: true },

    // Critical - Core Algorithms
    { name: 'SRS Algorithm', path: 'tests/algorithms/test-srs-algorithm.js', critical: true },
    { name: 'XP & Leveling', path: 'tests/gamification/test-xp-leveling.js', critical: true },
    { name: 'Streaks & Goals', path: 'tests/gamification/test-streaks-goals.js', critical: true },

    // Non-Critical - API
    { name: 'Word Lists API', path: 'tests/api/test-word-lists.js', critical: false },
    { name: 'Study Flow', path: 'tests/integration/test-study-flow.js', critical: false },
    { name: 'API Endpoints', path: 'tests/api/test-api-endpoints.js', critical: false },
    { name: 'Production Tests', path: 'tests/api/test-production.js', critical: false },
    { name: 'Validation Tests', path: 'tests/api/test-validation.js', critical: false },

    // Performance
    { name: 'Performance Benchmarks', path: 'tests/performance/test-benchmarks.js', critical: false },
];

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    suites: []
};

function runTest(testPath) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        const child = spawn('node', [testPath], {
            stdio: 'inherit',
            shell: true
        });

        child.on('exit', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            resolve({
                exitCode: code,
                duration: parseFloat(duration)
            });
        });

        child.on('error', (error) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            resolve({
                exitCode: 1,
                duration: parseFloat(duration),
                error: error.message
            });
        });
    });
}

async function runAllTests() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 FLUENTFLOW - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(70) + '\n');

    const startTime = Date.now();

    for (const suite of TEST_SUITES) {
        console.log(`\n${'━'.repeat(70)}`);
        console.log(`Running: ${suite.name} ${suite.critical ? '(CRITICAL)' : ''}`);
        console.log('━'.repeat(70));

        // Check if test file exists
        if (!fs.existsSync(suite.path)) {
            console.log(`⚠️  Test file not found: ${suite.path}\n`);
            results.skipped++;
            results.suites.push({
                name: suite.name,
                status: 'SKIPPED',
                critical: suite.critical,
                reason: 'File not found'
            });
            continue;
        }

        const result = await runTest(suite.path);

        results.total++;

        if (result.exitCode === 0) {
            results.passed++;
            results.suites.push({
                name: suite.name,
                status: 'PASS',
                critical: suite.critical,
                duration: result.duration
            });
        } else {
            results.failed++;
            results.suites.push({
                name: suite.name,
                status: 'FAIL',
                critical: suite.critical,
                duration: result.duration,
                error: result.error
            });
        }
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Generate Report
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70) + '\n');

    console.log(`Total Suites:    ${results.total}`);
    console.log(`✅ Passed:       ${results.passed}`);
    console.log(`❌ Failed:       ${results.failed}`);
    console.log(`⏭️  Skipped:      ${results.skipped}`);
    console.log(`⏱️  Duration:     ${totalDuration}s\n`);

    const successRate = results.total > 0
        ? ((results.passed / results.total) * 100).toFixed(1)
        : 0;
    console.log(`📈 Success Rate: ${successRate}%\n`);

    // Detailed Results
    console.log('━'.repeat(70));
    console.log('DETAILED RESULTS:\n');

    results.suites.forEach(suite => {
        const icon = suite.status === 'PASS' ? '✅' : suite.status === 'FAIL' ? '❌' : '⏭️';
        const critical = suite.critical ? ' [CRITICAL]' : '';
        const duration = suite.duration ? ` (${suite.duration}s)` : '';
        console.log(`${icon} ${suite.name}${critical}${duration}`);
        if (suite.error) {
            console.log(`   Error: ${suite.error}`);
        }
        if (suite.reason) {
            console.log(`   Reason: ${suite.reason}`);
        }
    });

    // Critical Failures
    const criticalFailures = results.suites.filter(s => s.critical && s.status === 'FAIL');
    if (criticalFailures.length > 0) {
        console.log('\n' + '━'.repeat(70));
        console.log('⚠️  CRITICAL FAILURES:\n');
        criticalFailures.forEach(suite => {
            console.log(`  ❌ ${suite.name}`);
        });
    }

    console.log('\n' + '='.repeat(70));

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
        console.log('='.repeat(70) + '\n');
        return 0;
    } else if (criticalFailures.length > 0) {
        console.log('\n🚨 CRITICAL TESTS FAILED - IMMEDIATE ATTENTION REQUIRED\n');
        console.log('='.repeat(70) + '\n');
        return 2;
    } else {
        console.log('\n⚠️  SOME TESTS FAILED - REVIEW NEEDED\n');
        console.log('='.repeat(70) + '\n');
        return 1;
    }
}

runAllTests()
    .then(exitCode => process.exit(exitCode))
    .catch(err => {
        console.error('\n❌ Test runner failed:', err);
        process.exit(1);
    });
