const fs = require('fs');

const resultsPath = './config/test-results/production-results.json';
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('='.repeat(80));
console.log('FAILED TESTS ANALYSIS');
console.log('='.repeat(80));
console.log('');

let failedCount = 0;
let timedOutCount = 0;
let passedCount = 0;

// Collect all failed tests
const failedTests = [];

results.suites.forEach(suite => {
  if (suite.suites) {
    suite.suites.forEach(subSuite => {
      if (subSuite.specs) {
        subSuite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            test.results.forEach(result => {
              if (result.status === 'failed') {
                failedCount++;
                failedTests.push({
                  title: spec.title,
                  file: spec.file,
                  project: test.projectName,
                  status: result.status,
                  error: result.error?.message || 'No error message',
                  duration: result.duration
                });
              } else if (result.status === 'timedOut') {
                timedOutCount++;
                failedTests.push({
                  title: spec.title,
                  file: spec.file,
                  project: test.projectName,
                  status: result.status,
                  error: result.error?.message || 'Timeout',
                  duration: result.duration
                });
              } else if (result.status === 'passed') {
                passedCount++;
              }
            });
          });
        });
      }
    });
  }
});

console.log(`Total Tests: ${passedCount + failedCount + timedOutCount}`);
console.log(`✅ Passed: ${passedCount}`);
console.log(`❌ Failed: ${failedCount}`);
console.log(`⏱️  Timed Out: ${timedOutCount}`);
console.log('');

if (failedTests.length > 0) {
  console.log('FAILED TEST DETAILS:');
  console.log('='.repeat(80));

  failedTests.forEach((test, i) => {
    console.log('');
    console.log(`${i + 1}. ${test.title}`);
    console.log(`   File: ${test.file.replace(/\\/g, '/').split('tests/e2e/')[1] || test.file}`);
    console.log(`   Project: ${test.project}`);
    console.log(`   Status: ${test.status}`);
    console.log(`   Duration: ${(test.duration / 1000).toFixed(2)}s`);
    console.log(`   Error: ${test.error.substring(0, 200)}${test.error.length > 200 ? '...' : ''}`);
  });
}

console.log('');
console.log('='.repeat(80));
