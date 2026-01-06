/**
 * Custom Playwright Reporter with Progress Bar
 * Shows beautiful progress bar in console for all tests
 */

class ProgressReporter {
  constructor(options = {}) {
    this.options = options;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    this.currentTest = 0;
    this.startTime = null;
    this.testResults = [];
  }

  onBegin(config, suite) {
    this.startTime = Date.now();
    this.totalTests = suite.allTests().length;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              E2E Tests - Progress Report                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`📊 Total tests: ${this.totalTests}`);
    console.log(`🚀 Starting at: ${new Date().toLocaleTimeString()}`);
    console.log('');

    this.drawProgressBar();
  }

  onTestEnd(test, result) {
    this.currentTest++;

    if (result.status === 'passed') {
      this.passedTests++;
    } else if (result.status === 'failed') {
      this.failedTests++;
      this.testResults.push({
        title: test.title,
        project: test.parent.project().name,
        error: result.error?.message || 'Unknown error'
      });
    } else if (result.status === 'skipped') {
      this.skippedTests++;
    }

    this.drawProgressBar();
  }

  onEnd(result) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('                    Test Results Summary');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`✅ Passed:  ${this.passedTests}/${this.totalTests} (${this.getPercentage(this.passedTests)}%)`);
    console.log(`❌ Failed:  ${this.failedTests}/${this.totalTests} (${this.getPercentage(this.failedTests)}%)`);
    console.log(`⊝  Skipped: ${this.skippedTests}/${this.totalTests} (${this.getPercentage(this.skippedTests)}%)`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('');

    if (this.failedTests > 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('                    Failed Tests');
      console.log('═══════════════════════════════════════════════════════════════\n');

      this.testResults.forEach((testResult, index) => {
        console.log(`${index + 1}. [${testResult.project}] ${testResult.title}`);
        console.log(`   Error: ${testResult.error.split('\n')[0]}`);
        console.log('');
      });
    }

    if (this.passedTests === this.totalTests) {
      console.log('🎉 All tests passed! Great job! 🎉\n');
    } else if (this.failedTests > 0) {
      console.log(`⚠️  ${this.failedTests} test(s) failed. Check details above.\n`);
    }
  }

  drawProgressBar() {
    const barWidth = 50;
    const progress = Math.min(1.0, this.currentTest / this.totalTests); // Cap at 100%
    const filledWidth = Math.floor(progress * barWidth);
    const emptyWidth = Math.max(0, barWidth - filledWidth); // Prevent negative values

    const percentage = Math.min(100, (progress * 100)).toFixed(1);

    // Build progress bar
    const filledBar = '█'.repeat(filledWidth);
    const emptyBar = '░'.repeat(emptyWidth);

    // Status indicators
    const passIcon = '✓';
    const failIcon = '✗';

    // Clear previous line and draw new progress bar
    process.stdout.write('\r\x1b[K'); // Clear line

    const statusText = `${passIcon} ${this.passedTests} | ${failIcon} ${this.failedTests}`;
    const progressText = `[${filledBar}${emptyBar}] ${percentage}% (${this.currentTest}/${this.totalTests})`;

    process.stdout.write(`  ${progressText} ${statusText}`);
  }

  getPercentage(count) {
    if (this.totalTests === 0) return 0;
    return ((count / this.totalTests) * 100).toFixed(1);
  }

  printsToStdio() {
    return true;
  }
}

module.exports = ProgressReporter;
