// Comprehensive Test Framework for Rememberizor
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.startTime = null;
        this.endTime = null;
    }

    // Test registration
    describe(suiteName, testSuite) {
        console.log(`\n📋 Test Suite: ${suiteName}`);
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null
        };

        const context = {
            beforeEach: (fn) => { suite.beforeEach = fn; },
            afterEach: (fn) => { suite.afterEach = fn; },
            test: (testName, testFn) => {
                suite.tests.push({ name: testName, fn: testFn });
            },
            it: (testName, testFn) => {
                suite.tests.push({ name: testName, fn: testFn });
            }
        };

        testSuite(context);
        this.tests.push(suite);
    }

    // Assertion methods
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected ${actual} to be null`);
                }
            },
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Expected ${actual} to be undefined`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toHaveLength: (expectedLength) => {
                if (actual.length !== expectedLength) {
                    throw new Error(`Expected length ${actual.length} to be ${expectedLength}`);
                }
            },
            toBeInstanceOf: (expectedClass) => {
                if (!(actual instanceof expectedClass)) {
                    throw new Error(`Expected ${actual} to be instance of ${expectedClass.name}`);
                }
            }
        };
    }

    // DOM testing utilities
    expectElement(selector) {
        const element = document.querySelector(selector);
        return {
            toExist: () => {
                if (!element) {
                    throw new Error(`Element with selector '${selector}' does not exist`);
                }
            },
            toHaveClass: (className) => {
                if (!element || !element.classList.contains(className)) {
                    throw new Error(`Element '${selector}' does not have class '${className}'`);
                }
            },
            toBeVisible: () => {
                if (!element || element.style.display === 'none' || element.classList.contains('hidden')) {
                    throw new Error(`Element '${selector}' is not visible`);
                }
            },
            toHaveText: (expectedText) => {
                if (!element || element.textContent.trim() !== expectedText) {
                    throw new Error(`Element '${selector}' text '${element?.textContent}' does not match '${expectedText}'`);
                }
            },
            toHaveValue: (expectedValue) => {
                if (!element || element.value !== expectedValue) {
                    throw new Error(`Element '${selector}' value '${element?.value}' does not match '${expectedValue}'`);
                }
            }
        };
    }

    // Mock functions
    createMock(originalObject, methodName) {
        const originalMethod = originalObject[methodName];
        const mock = {
            calls: [],
            returnValue: undefined,
            mockReturnValue: (value) => { mock.returnValue = value; },
            mockImplementation: (fn) => { mock.implementation = fn; },
            restore: () => { originalObject[methodName] = originalMethod; }
        };

        originalObject[methodName] = function(...args) {
            mock.calls.push(args);
            if (mock.implementation) {
                return mock.implementation.apply(this, args);
            }
            return mock.returnValue;
        };

        return mock;
    }

    // Async utilities
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitFor(condition, timeout = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (condition()) return;
            await this.wait(50);
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    }

    // Test runner
    async runTests() {
        this.startTime = Date.now();
        this.results = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;

        console.log('🚀 Starting test execution...\n');

        for (const suite of this.tests) {
            console.log(`\n📦 Running suite: ${suite.name}`);
            
            for (const test of suite.tests) {
                this.totalTests++;
                
                try {
                    // Run beforeEach if defined
                    if (suite.beforeEach) {
                        await suite.beforeEach();
                    }

                    // Run the test
                    await test.fn();
                    
                    // Run afterEach if defined
                    if (suite.afterEach) {
                        await suite.afterEach();
                    }

                    console.log(`  ✅ ${test.name}`);
                    this.passedTests++;
                    this.results.push({
                        suite: suite.name,
                        test: test.name,
                        status: 'passed',
                        error: null
                    });

                } catch (error) {
                    console.error(`  ❌ ${test.name}`);
                    console.error(`     ${error.message}`);
                    this.failedTests++;
                    this.results.push({
                        suite: suite.name,
                        test: test.name,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
        }

        this.endTime = Date.now();
        this.printSummary();
        return this.generateReport();
    }

    printSummary() {
        const duration = this.endTime - this.startTime;
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📈 Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.filter(r => r.status === 'failed').forEach(result => {
                console.log(`  - ${result.suite} > ${result.test}: ${result.error}`);
            });
        }
    }

    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            duration: this.endTime - this.startTime,
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.failedTests,
            successRate: Math.round((this.passedTests / this.totalTests) * 100),
            results: this.results
        };
    }

    // Visual test runner UI
    createTestUI() {
        const ui = document.createElement('div');
        ui.id = 'test-runner-ui';
        ui.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        `;

        ui.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #007bff;">🧪 Test Runner</h3>
                <button id="close-test-ui" style="background: none; border: none; font-size: 16px; cursor: pointer;">❌</button>
            </div>
            <button id="run-tests-btn" style="width: 100%; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px;">
                ▶️ Run All Tests
            </button>
            <div id="test-progress" style="display: none;">
                <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
                    <div id="progress-bar" style="height: 20px; background: #007bff; width: 0%; transition: width 0.3s;"></div>
                </div>
                <div id="test-status">Running tests...</div>
            </div>
            <div id="test-results" style="max-height: 200px; overflow-y: auto;"></div>
        `;

        document.body.appendChild(ui);

        // Event listeners
        document.getElementById('close-test-ui').onclick = () => ui.remove();
        document.getElementById('run-tests-btn').onclick = () => this.runUITests();

        return ui;
    }

    async runUITests() {
        const progressDiv = document.getElementById('test-progress');
        const progressBar = document.getElementById('progress-bar');
        const statusDiv = document.getElementById('test-status');
        const resultsDiv = document.getElementById('test-results');

        progressDiv.style.display = 'block';
        resultsDiv.innerHTML = '';

        // Run tests with UI updates
        const report = await this.runTests();

        // Update UI with results
        progressBar.style.width = '100%';
        statusDiv.textContent = `Completed: ${report.passed}/${report.total} passed`;

        const resultsHTML = `
            <div style="margin-top: 10px;">
                <div style="color: green;">✅ Passed: ${report.passed}</div>
                <div style="color: red;">❌ Failed: ${report.failed}</div>
                <div style="color: blue;">⏱️ Duration: ${report.duration}ms</div>
            </div>
        `;

        resultsDiv.innerHTML = resultsHTML;
    }
}

// Global test instance
window.testFramework = new TestFramework();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestFramework;
}