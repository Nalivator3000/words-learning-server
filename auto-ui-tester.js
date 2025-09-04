// Automated UI Testing System for Rememberizor
// This script automatically tests all interface elements and functionality

class AutoUITester {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
        this.errors = [];
        this.isRunning = false;
        this.testLog = [];
        this.startTime = null;
    }

    // Main automated test runner
    async runFullUITest() {
        console.log('🤖 Starting Automated UI Test Suite...');
        this.startTime = Date.now();
        this.isRunning = true;
        this.testResults = [];
        this.errors = [];
        this.testLog = [];

        try {
            // Test sequence
            await this.testLogin();
            await this.testNavigationButtons();
            await this.testHomeSection();
            await this.testImportSection();
            await this.testStudySection();
            await this.testSurvivalMode();
            await this.testReviewSection();
            await this.testStatsSection();
            await this.testSettingsSection();
            await this.testUserControls();
            
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Critical error during UI testing:', error);
            this.errors.push({
                test: 'General',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            this.isRunning = false;
        }
    }

    // Helper: wait for element
    async waitForElement(selector, timeout = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await this.wait(100);
        }
        throw new Error(`Element ${selector} not found within ${timeout}ms`);
    }

    // Helper: wait
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper: click element safely
    async safeClick(selector, testName) {
        try {
            const element = await this.waitForElement(selector, 3000);
            if (element.disabled) {
                this.log(`⚠️ Element ${selector} is disabled in ${testName}`);
                return false;
            }
            element.click();
            await this.wait(500); // Wait for potential UI changes
            this.log(`✅ Clicked ${selector} in ${testName}`);
            return true;
        } catch (error) {
            this.logError(testName, `Failed to click ${selector}: ${error.message}`);
            return false;
        }
    }

    // Helper: check if element exists and is visible
    checkElement(selector, testName, required = true) {
        const element = document.querySelector(selector);
        if (!element) {
            if (required) {
                this.logError(testName, `Required element ${selector} not found`);
            } else {
                this.log(`⚠️ Optional element ${selector} not found in ${testName}`);
            }
            return false;
        }

        const isVisible = element.offsetParent !== null && !element.classList.contains('hidden');
        if (!isVisible && required) {
            this.logError(testName, `Element ${selector} exists but is not visible`);
            return false;
        }

        this.log(`✅ Element ${selector} found and ${isVisible ? 'visible' : 'hidden'} in ${testName}`);
        return true;
    }

    // Test login functionality
    async testLogin() {
        this.currentTest = 'Login';
        this.log('🔐 Testing login functionality...');

        try {
            // Check if we're already logged in
            const authModal = document.getElementById('authModal');
            if (!authModal || authModal.style.display === 'none') {
                this.log('✅ Already logged in, skipping login test');
                return;
            }

            // Test emergency login
            this.checkElement('#loginEmail', 'Login', true);
            this.checkElement('#loginPassword', 'Login', true);
            this.checkElement('#loginBtn', 'Login', true);

            // Fill in credentials
            const emailField = document.getElementById('loginEmail');
            const passwordField = document.getElementById('loginPassword');
            
            if (emailField && passwordField) {
                emailField.value = 'root';
                passwordField.value = 'root';
                this.log('✅ Filled login credentials');
            }

            // Click login button
            await this.safeClick('#loginBtn', 'Login');
            await this.wait(1000); // Wait for login process

            // Check if login successful
            if (authModal.style.display === 'none') {
                this.log('✅ Login successful');
            } else {
                this.logError('Login', 'Login appeared to fail - modal still visible');
            }

        } catch (error) {
            this.logError('Login', error.message);
        }
    }

    // Test navigation buttons and routing
    async testNavigationButtons() {
        this.currentTest = 'Navigation';
        this.log('🧭 Testing navigation buttons and routing...');

        const navButtons = [
            { id: '#homeBtn', name: 'Home', path: '/' },
            { id: '#importBtn', name: 'Import', path: '/import' },
            { id: '#studyBtn', name: 'Study', path: '/study' },
            { id: '#reviewBtn', name: 'Review', path: '/review' },
            { id: '#statsBtn', name: 'Stats', path: '/stats' }
        ];

        for (const button of navButtons) {
            await this.safeClick(button.id, `Navigation-${button.name}`);
            await this.wait(500);
            
            // Check if button becomes active
            const element = document.querySelector(button.id);
            if (element && element.classList.contains('active')) {
                this.log(`✅ Navigation to ${button.name} successful`);
            }
            
            // Check URL routing
            if (window.router && window.location.pathname === button.path) {
                this.log(`✅ URL routing to ${button.path} successful`);
            }
        }
    }

    // Test home section
    async testHomeSection() {
        this.currentTest = 'Home Section';
        this.log('🏠 Testing home section...');

        await this.safeClick('#homeBtn', 'Home Section');
        
        this.checkElement('#homeSection', 'Home Section');
        this.checkElement('#studyingCount', 'Home Section');
        this.checkElement('#reviewCount', 'Home Section');
        this.checkElement('#learnedCount', 'Home Section');
        this.checkElement('#quickStudyBtn', 'Home Section');
        this.checkElement('#quickReviewBtn', 'Home Section');

        // Test quick action buttons
        await this.safeClick('#quickStudyBtn', 'Home Section');
        await this.wait(500);
        await this.safeClick('#quickReviewBtn', 'Home Section');
    }

    // Test import section
    async testImportSection() {
        this.currentTest = 'Import Section';
        this.log('📂 Testing import section...');

        await this.safeClick('#importBtn', 'Import Section');
        
        this.checkElement('#importSection', 'Import Section');
        this.checkElement('#csvImportBtn', 'Import Section');
        this.checkElement('#googleSheetsUrl', 'Import Section');
        this.checkElement('#googleImportBtn', 'Import Section');

        // Test import buttons (without actual file/URL)
        await this.safeClick('#csvImportBtn', 'Import Section');
        await this.safeClick('#googleImportBtn', 'Import Section');
    }

    // Test study section and modes
    async testStudySection() {
        this.currentTest = 'Study Section';
        this.log('📚 Testing study section...');

        await this.safeClick('#studyBtn', 'Study Section');
        
        this.checkElement('#studySection', 'Study Section');
        this.checkElement('#studyModeSelect', 'Study Section');

        // Test all study mode buttons
        const studyModes = [
            '#multipleChoiceBtn',
            '#reverseMultipleChoiceBtn', 
            '#wordBuildingBtn',
            '#typingBtn',
            '#complexModeBtn'
        ];

        for (const mode of studyModes) {
            await this.safeClick(mode, 'Study Section');
            await this.wait(500);
            
            // Check if quiz area appears
            const quizArea = document.getElementById('quizArea');
            if (quizArea && !quizArea.classList.contains('hidden')) {
                this.log(`✅ Study mode activated quiz area`);
                
                // Try to go back to mode select
                await this.safeClick('#studyBtn', 'Study Section');
                await this.wait(300);
            }
        }
    }

    // Test survival mode specifically
    async testSurvivalMode() {
        this.currentTest = 'Survival Mode';
        this.log('🏆 Testing survival mode...');

        await this.safeClick('#studyBtn', 'Survival Mode');
        await this.wait(300);

        this.checkElement('#survivalBtn', 'Survival Mode');
        
        // Click survival mode button
        const clicked = await this.safeClick('#survivalBtn', 'Survival Mode');
        if (clicked) {
            await this.wait(1000);
            
            // Check survival interface elements
            this.checkElement('#survivalArea', 'Survival Mode');
            this.checkElement('#survivalQuestion', 'Survival Mode', false);
            this.checkElement('#choice1', 'Survival Mode', false);
            this.checkElement('#choice2', 'Survival Mode', false);
            this.checkElement('#survivalScore', 'Survival Mode', false);
            
            // Test keyboard controls
            this.log('⌨️ Testing survival mode keyboard controls...');
            
            // Simulate some key presses
            const testKeys = ['1', '2', 'ArrowLeft', 'ArrowRight'];
            for (const key of testKeys) {
                const event = new KeyboardEvent('keydown', { key });
                document.dispatchEvent(event);
                await this.wait(100);
            }
            
            // Exit survival mode
            const exitBtn = document.getElementById('survivalExit');
            if (exitBtn) {
                await this.safeClick('#survivalExit', 'Survival Mode');
            } else {
                // Try to exit by clicking study button
                await this.safeClick('#studyBtn', 'Survival Mode');
            }
        }
    }

    // Test review section
    async testReviewSection() {
        this.currentTest = 'Review Section';
        this.log('🔄 Testing review section...');

        await this.safeClick('#reviewBtn', 'Review Section');
        
        this.checkElement('#reviewSection', 'Review Section');
        this.checkElement('#startReviewBtn', 'Review Section');
        this.checkElement('#review7Count', 'Review Section');
        this.checkElement('#review30Count', 'Review Section');

        // Test start review button
        await this.safeClick('#startReviewBtn', 'Review Section');
    }

    // Test stats section
    async testStatsSection() {
        this.currentTest = 'Stats Section';
        this.log('📊 Testing stats section...');

        await this.safeClick('#statsBtn', 'Stats Section');
        
        this.checkElement('#statsSection', 'Stats Section');
        this.checkElement('#fetchImagesBtn', 'Stats Section');
        this.checkElement('#imageStatsBtn', 'Stats Section');

        // Test export buttons
        const exportButtons = [
            '#exportStudyingBtn',
            '#exportReviewBtn', 
            '#exportLearnedBtn',
            '#exportAllBtn'
        ];

        for (const btn of exportButtons) {
            await this.safeClick(btn, 'Stats Section');
            await this.wait(200);
        }

        // Test image buttons
        await this.safeClick('#fetchImagesBtn', 'Stats Section');
        await this.wait(500);
        await this.safeClick('#imageStatsBtn', 'Stats Section');
    }

    // Test settings section  
    async testSettingsSection() {
        this.currentTest = 'Settings Section';
        this.log('⚙️ Testing settings section...');

        // Open settings via user menu
        await this.safeClick('#userMenuBtn', 'Settings Section');
        await this.wait(200);
        await this.safeClick('#settingsBtn', 'Settings Section');
        
        this.checkElement('#settingsSection', 'Settings Section');
        this.checkElement('#uiLanguageSelect', 'Settings Section');
        this.checkElement('#addLanguagePairBtn', 'Settings Section');
        this.checkElement('#lessonSizeInput', 'Settings Section');
        this.checkElement('#syncBtn', 'Settings Section');

        // Test settings controls
        await this.safeClick('#addLanguagePairBtn', 'Settings Section');
        await this.safeClick('#syncBtn', 'Settings Section');

        // Test language selector
        const langSelect = document.getElementById('uiLanguageSelect');
        if (langSelect) {
            const originalValue = langSelect.value;
            langSelect.value = 'en';
            langSelect.dispatchEvent(new Event('change'));
            await this.wait(300);
            langSelect.value = originalValue;
            langSelect.dispatchEvent(new Event('change'));
            this.log('✅ Tested language selector');
        }
    }

    // Test user controls
    async testUserControls() {
        this.currentTest = 'User Controls';
        this.log('👤 Testing user controls...');

        this.checkElement('#userInfo', 'User Controls');
        this.checkElement('#userMenuBtn', 'User Controls');

        // Test user menu
        await this.safeClick('#userMenuBtn', 'User Controls');
        await this.wait(200);
        
        this.checkElement('#userMenu', 'User Controls', false);
        this.checkElement('#settingsBtn', 'User Controls', false);
        this.checkElement('#logoutBtn', 'User Controls', false);

        // Close menu by clicking outside
        document.body.click();
        await this.wait(200);
    }

    // Logging helpers
    log(message) {
        console.log(`[AutoTester] ${message}`);
        this.testLog.push({
            test: this.currentTest,
            message,
            timestamp: new Date().toISOString(),
            type: 'info'
        });
    }

    logError(testName, message) {
        console.error(`[AutoTester] ❌ ${testName}: ${message}`);
        this.errors.push({
            test: testName,
            error: message,
            timestamp: new Date().toISOString()
        });
        this.testLog.push({
            test: testName,
            message: `❌ ${message}`,
            timestamp: new Date().toISOString(),
            type: 'error'
        });
    }

    // Generate comprehensive test report
    generateTestReport() {
        const duration = Date.now() - this.startTime;
        const totalTests = this.testLog.length;
        const errors = this.errors.length;
        const successRate = Math.round(((totalTests - errors) / totalTests) * 100);

        const report = {
            timestamp: new Date().toISOString(),
            duration,
            totalTests,
            errors: errors,
            successRate,
            status: errors === 0 ? 'PASSED' : 'FAILED',
            details: this.testLog,
            errorSummary: this.errors
        };

        console.log('\n' + '='.repeat(60));
        console.log('🤖 AUTOMATED UI TEST REPORT');
        console.log('='.repeat(60));
        console.log(`🕐 Duration: ${duration}ms`);
        console.log(`📊 Tests: ${totalTests}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`📋 Status: ${report.status}`);

        if (errors > 0) {
            console.log('\n❌ ERRORS FOUND:');
            this.errors.forEach((error, i) => {
                console.log(`${i + 1}. [${error.test}] ${error.error}`);
            });
        }

        // Store report for external access
        window.lastUITestReport = report;
        localStorage.setItem('lastUITestReport', JSON.stringify(report));
        
        return report;
    }

    // Get test recommendations based on errors
    getRecommendations() {
        if (this.errors.length === 0) {
            return ['✅ All tests passed! No recommendations.'];
        }

        const recommendations = [];
        const errorTypes = {};

        // Categorize errors
        this.errors.forEach(error => {
            const category = error.test;
            if (!errorTypes[category]) errorTypes[category] = [];
            errorTypes[category].push(error.error);
        });

        // Generate recommendations
        Object.keys(errorTypes).forEach(category => {
            recommendations.push(`🔧 Fix ${category}: ${errorTypes[category].join(', ')}`);
        });

        return recommendations;
    }
}

// Auto-run test when page loads (with delay for all components to load)
document.addEventListener('DOMContentLoaded', () => {
    // Only run auto-test if URL parameter is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autotest') === 'true') {
        setTimeout(() => {
            console.log('🚀 Starting automatic UI test (triggered by URL parameter)...');
            window.autoUITester = new AutoUITester();
            window.autoUITester.runFullUITest();
        }, 3000);
    }
});

// Create global instance for manual testing
window.autoUITester = new AutoUITester();

// Export convenience functions
window.runUITest = () => window.autoUITester.runFullUITest();
window.getUITestReport = () => window.lastUITestReport;

console.log('🤖 Auto UI Tester loaded! Use runUITest() to start manual test or add ?autotest=true to URL for automatic testing');