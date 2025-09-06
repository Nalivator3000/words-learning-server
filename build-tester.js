// Build Testing Automation Script
// This script can automatically test deployments and identify issues

class BuildTester {
    constructor() {
        this.buildInfo = {
            version: '08d6662',
            timestamp: '2025.01.09-17:10',
            mode: 'SINGLE-USER',
            user: 'ROOT'
        };
        this.testResults = [];
        this.deploymentChecks = [];
    }

    // Main build testing function
    async testCurrentBuild() {
        console.log('🏗️ Starting Build Test for version', this.buildInfo.version);
        
        const startTime = Date.now();
        
        try {
            // 1. Test basic page load
            await this.testPageLoad();
            
            // 2. Test all script loading
            await this.testScriptLoading();
            
            // 3. Test emergency login functionality
            await this.testEmergencyLogin();
            
            // 4. Run automated UI tests
            await this.runAutomatedUITests();
            
            // 5. Test responsive design (quick test)
            await this.testResponsiveDesign();
            
            // 6. Test build info display
            this.testBuildInfoDisplay();
            
            // 6. Test deployment-specific issues
            await this.testDeploymentIssues();
            
            const duration = Date.now() - startTime;
            this.generateBuildReport(duration);
            
        } catch (error) {
            console.error('❌ Critical error in build testing:', error);
            this.testResults.push({
                test: 'Build Test',
                status: 'FAILED',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Test if page loads correctly
    async testPageLoad() {
        console.log('📄 Testing page load...');
        
        const checks = [
            { name: 'HTML Document', check: () => document.readyState === 'complete' },
            { name: 'Title Present', check: () => document.title.includes('Rememberizor') },
            { name: 'Main Container', check: () => document.querySelector('.container') !== null },
            { name: 'Auth Modal', check: () => document.getElementById('authModal') !== null }
        ];

        checks.forEach(test => {
            try {
                const passed = test.check();
                this.testResults.push({
                    test: `Page Load: ${test.name}`,
                    status: passed ? 'PASSED' : 'FAILED',
                    timestamp: new Date().toISOString()
                });
                console.log(`${passed ? '✅' : '❌'} ${test.name}`);
            } catch (error) {
                this.testResults.push({
                    test: `Page Load: ${test.name}`,
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                console.error(`❌ ${test.name}: ${error.message}`);
            }
        });
    }

    // Test if all scripts loaded correctly
    async testScriptLoading() {
        console.log('📜 Testing script loading...');
        
        const requiredGlobals = [
            { name: 'Emergency Login', global: 'window.emergencyLogin' },
            { name: 'Database', global: 'window.database' },
            { name: 'User Manager', global: 'window.userManager' },
            { name: 'Language Manager', global: 'window.languageManager' },
            { name: 'Quiz Manager', global: 'window.quizManager' },
            { name: 'Test Framework', global: 'window.testFramework' },
            { name: 'Auto UI Tester', global: 'window.autoUITester' },
            { name: 'Responsive Tester', global: 'window.responsiveTester' },
            { name: 'Main App Class', global: 'window.LanguageLearningApp' },
            { name: 'Survival Mode Class', global: 'window.SurvivalMode' }
        ];

        requiredGlobals.forEach(test => {
            try {
                const exists = eval(test.global) !== undefined;
                this.testResults.push({
                    test: `Script Loading: ${test.name}`,
                    status: exists ? 'PASSED' : 'FAILED',
                    timestamp: new Date().toISOString()
                });
                console.log(`${exists ? '✅' : '❌'} ${test.name} (${test.global})`);
            } catch (error) {
                this.testResults.push({
                    test: `Script Loading: ${test.name}`,
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                console.error(`❌ ${test.name}: ${error.message}`);
            }
        });
    }

    // Test emergency login functionality
    async testEmergencyLogin() {
        console.log('🔐 Testing emergency login...');
        
        try {
            // Check if login elements exist
            const emailField = document.getElementById('loginEmail');
            const passwordField = document.getElementById('loginPassword');
            const loginBtn = document.getElementById('loginBtn');
            
            if (!emailField || !passwordField || !loginBtn) {
                this.testResults.push({
                    test: 'Emergency Login: Elements',
                    status: 'FAILED',
                    error: 'Login elements not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Test login function exists
            if (typeof window.emergencyLogin === 'function') {
                this.testResults.push({
                    test: 'Emergency Login: Function',
                    status: 'PASSED',
                    timestamp: new Date().toISOString()
                });
                console.log('✅ Emergency login function available');
            } else {
                this.testResults.push({
                    test: 'Emergency Login: Function',
                    status: 'FAILED',
                    error: 'Emergency login function not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Test credentials
            if (typeof window.testLogin === 'function') {
                console.log('🧪 Testing login with root credentials...');
                
                // Save current auth modal state
                const authModal = document.getElementById('authModal');
                const originalDisplay = authModal ? authModal.style.display : 'none';
                
                // Try login
                window.testLogin();
                
                // Wait a bit and check result
                await this.wait(1000);
                
                const isLoggedIn = authModal && authModal.style.display === 'none';
                this.testResults.push({
                    test: 'Emergency Login: Credentials',
                    status: isLoggedIn ? 'PASSED' : 'FAILED',
                    timestamp: new Date().toISOString()
                });
                console.log(`${isLoggedIn ? '✅' : '❌'} Login test`);
                
            }
            
        } catch (error) {
            this.testResults.push({
                test: 'Emergency Login: Test',
                status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.error('❌ Emergency login test error:', error);
        }
    }

    // Run the automated UI tests
    async runAutomatedUITests() {
        console.log('🤖 Running automated UI tests...');
        
        try {
            if (window.autoUITester) {
                await window.autoUITester.runFullUITest();
                const report = window.getUITestReport();
                
                if (report) {
                    this.testResults.push({
                        test: 'Automated UI Tests',
                        status: report.status,
                        details: `${report.errors} errors out of ${report.totalTests} tests`,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`${report.status === 'PASSED' ? '✅' : '❌'} UI Tests: ${report.successRate}% success rate`);
                } else {
                    this.testResults.push({
                        test: 'Automated UI Tests',
                        status: 'FAILED',
                        error: 'No test report generated',
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                this.testResults.push({
                    test: 'Automated UI Tests',
                    status: 'FAILED',
                    error: 'Auto UI Tester not available',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            this.testResults.push({
                test: 'Automated UI Tests',
                status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.error('❌ UI test error:', error);
        }
    }

    // Test build info display
    testBuildInfoDisplay() {
        console.log('🏷️ Testing build info display...');
        
        const buildElements = document.querySelectorAll('[style*="monospace"]');
        let buildInfoFound = false;
        
        buildElements.forEach(element => {
            if (element.textContent.includes('Build:') && element.textContent.includes(this.buildInfo.version)) {
                buildInfoFound = true;
            }
        });
        
        this.testResults.push({
            test: 'Build Info Display',
            status: buildInfoFound ? 'PASSED' : 'FAILED',
            timestamp: new Date().toISOString()
        });
        
        console.log(`${buildInfoFound ? '✅' : '❌'} Build info display`);
    }

    // Test deployment-specific issues
    async testDeploymentIssues() {
        console.log('🚀 Testing deployment-specific issues...');
        
        const deploymentTests = [
            {
                name: 'Cache Busting',
                test: () => {
                    const scripts = document.querySelectorAll('script[src*="?v="]');
                    return scripts.length > 5; // Should have cache busting parameters
                }
            },
            {
                name: 'No Cache Headers',
                test: () => {
                    const metaTags = document.querySelectorAll('meta[http-equiv="Cache-Control"]');
                    return metaTags.length > 0;
                }
            },
            {
                name: 'Console Errors',
                test: () => {
                    // This is a simplified check - in real deployment, you'd monitor console
                    return !window.console.error.toString().includes('native');
                }
            }
        ];

        deploymentTests.forEach(test => {
            try {
                const passed = test.test();
                this.testResults.push({
                    test: `Deployment: ${test.name}`,
                    status: passed ? 'PASSED' : 'FAILED',
                    timestamp: new Date().toISOString()
                });
                console.log(`${passed ? '✅' : '❌'} ${test.name}`);
            } catch (error) {
                this.testResults.push({
                    test: `Deployment: ${test.name}`,
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                console.error(`❌ ${test.name}: ${error.message}`);
            }
        });
    }

    // Generate comprehensive build report
    generateBuildReport(duration) {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAILED').length;
        const errorTests = this.testResults.filter(r => r.status === 'ERROR').length;
        const successRate = Math.round((passedTests / totalTests) * 100);

        const report = {
            buildInfo: this.buildInfo,
            timestamp: new Date().toISOString(),
            duration,
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                errors: errorTests,
                successRate
            },
            status: failedTests === 0 && errorTests === 0 ? 'PASSED' : 'FAILED',
            details: this.testResults,
            recommendations: this.generateRecommendations()
        };

        console.log('\n' + '='.repeat(70));
        console.log('🏗️ BUILD TEST REPORT');
        console.log('='.repeat(70));
        console.log(`📦 Version: ${this.buildInfo.version}`);
        console.log(`🕐 Duration: ${duration}ms`);
        console.log(`📊 Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`⚠️  Errors: ${errorTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`📋 Status: ${report.status}`);

        if (failedTests > 0 || errorTests > 0) {
            console.log('\n🔧 ISSUES FOUND:');
            this.testResults.filter(r => r.status !== 'PASSED').forEach((result, i) => {
                console.log(`${i + 1}. [${result.status}] ${result.test}: ${result.error || 'Failed'}`);
            });
            
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec}`);
            });
        }

        // Store report for external access
        window.lastBuildTestReport = report;
        localStorage.setItem('lastBuildTestReport', JSON.stringify(report));
        
        return report;
    }

    // Generate recommendations based on test results
    generateRecommendations() {
        const recommendations = [];
        const failures = this.testResults.filter(r => r.status === 'FAILED' || r.status === 'ERROR');
        
        if (failures.length === 0) {
            return ['✅ All tests passed! Build is ready for deployment.'];
        }

        // Analyze failure patterns
        const categories = {};
        failures.forEach(failure => {
            const category = failure.test.split(':')[0];
            if (!categories[category]) categories[category] = [];
            categories[category].push(failure);
        });

        Object.keys(categories).forEach(category => {
            const issues = categories[category];
            switch (category) {
                case 'Page Load':
                    recommendations.push('🔧 Fix page loading issues - check HTML structure and basic elements');
                    break;
                case 'Script Loading':
                    recommendations.push('🔧 Fix script loading - check for JavaScript errors and missing files');
                    break;
                case 'Emergency Login':
                    recommendations.push('🔧 Fix login functionality - check emergency login implementation');
                    break;
                case 'Automated UI Tests':
                    recommendations.push('🔧 Fix UI issues - run detailed UI tests to identify specific problems');
                    break;
                case 'Build Info Display':
                    recommendations.push('🔧 Fix build tracking - ensure build numbers are displayed correctly');
                    break;
                case 'Deployment':
                    recommendations.push('🔧 Fix deployment issues - check cache busting and headers');
                    break;
                default:
                    recommendations.push(`🔧 Fix ${category} issues`);
            }
        });

        return recommendations;
    }

    // Helper: wait function
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Quick deployment health check
    quickHealthCheck() {
        const checks = [
            { name: 'Page Loaded', check: document.readyState === 'complete' },
            { name: 'No JS Errors', check: !window.hasJSErrors },
            { name: 'Login Available', check: typeof window.emergencyLogin === 'function' },
            { name: 'Main App Available', check: typeof window.LanguageLearningApp !== 'undefined' }
        ];

        console.log('🩺 Quick Health Check:');
        checks.forEach(check => {
            const status = check.check ? '✅' : '❌';
            console.log(`${status} ${check.name}`);
        });

        return checks.every(check => check.check);
    }
    async testResponsiveDesign() {
        console.log('📱 Testing responsive design...');
        
        const responsiveResults = {
            section: 'Responsive Design',
            tests: []
        };

        try {
            // Проверяем наличие responsive tester
            if (typeof window.responsiveTester === 'undefined') {
                responsiveResults.tests.push({
                    test: 'Responsive Tester: Availability',
                    status: 'failed',
                    message: 'Responsive tester not loaded'
                });
                this.results.push(responsiveResults);
                return;
            }

            responsiveResults.tests.push({
                test: 'Responsive Tester: Availability',
                status: 'passed',
                message: 'Responsive tester loaded successfully'
            });

            // Быстрый тест популярных устройств
            console.log('  📱 Running quick responsive test...');
            const quickTestResults = await window.responsiveTester.quickTest();
            
            if (quickTestResults) {
                const summary = quickTestResults.summary;
                
                responsiveResults.tests.push({
                    test: 'Responsive Design: Quick Test',
                    status: summary.issues === 0 ? 'passed' : (summary.issues < 3 ? 'warning' : 'failed'),
                    message: `Tested ${summary.totalDevices} devices, ${summary.totalScreens} screens. Issues: ${summary.issues}, Warnings: ${summary.warnings}`,
                    details: {
                        devices: summary.totalDevices,
                        screens: summary.totalScreens,
                        issues: summary.issues,
                        warnings: summary.warnings,
                        duration: summary.duration
                    }
                });

                // Проверка мобильной совместимости
                const mobileDevices = Object.entries(quickTestResults.devices).filter(
                    ([, config]) => config.config.deviceType === 'mobile'
                );
                
                let mobileIssues = 0;
                for (const [, deviceData] of mobileDevices) {
                    for (const screenData of Object.values(deviceData.screens)) {
                        if (screenData.status === 'issues') {
                            mobileIssues++;
                        }
                    }
                }

                responsiveResults.tests.push({
                    test: 'Mobile Compatibility',
                    status: mobileIssues === 0 ? 'passed' : (mobileIssues < 2 ? 'warning' : 'failed'),
                    message: `${mobileIssues} mobile screen(s) have issues`
                });

            } else {
                responsiveResults.tests.push({
                    test: 'Responsive Design: Quick Test',
                    status: 'failed',
                    message: 'Quick test failed to run'
                });
            }

        } catch (error) {
            responsiveResults.tests.push({
                test: 'Responsive Design: Error',
                status: 'failed',
                message: 'Responsive test failed: ' + error.message
            });
        }

        this.results.push(responsiveResults);
        console.log('  ✅ Responsive design test completed');
    }
}

// Auto-run build test when page loads if parameter is set
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('buildtest') === 'true') {
        setTimeout(() => {
            console.log('🚀 Starting automatic build test (triggered by URL parameter)...');
            window.buildTester = new BuildTester();
            window.buildTester.testCurrentBuild();
        }, 5000); // Wait longer for all components to load
    }
});

// Create global instance
window.buildTester = new BuildTester();

// Export convenience functions - only for root users
function setupBuildTester() {
    const currentUser = localStorage.getItem('currentUser');
    const isRoot = currentUser && (currentUser.includes('"email":"root"') || currentUser.includes('"id":"root"'));
    
    if (isRoot) {
        window.runBuildTest = () => window.buildTester.testCurrentBuild();
        window.quickHealthCheck = () => window.buildTester.quickHealthCheck();
        window.getBuildTestReport = () => window.lastBuildTestReport;
        console.log('🏗️ Build Tester loaded! Use runBuildTest() for full test or quickHealthCheck() for quick check');
        console.log('💡 Add ?buildtest=true to URL for automatic testing on page load');
    }
}

// Set up build tester after login
setTimeout(setupBuildTester, 1600);