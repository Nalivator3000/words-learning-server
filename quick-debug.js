// Quick Debug and Test Runner
console.log('🐛 Quick Debug Script Loaded');

// Wait for page to load then run diagnostics
setTimeout(() => {
    runQuickDiagnostics();
}, 2000);

function runQuickDiagnostics() {
    console.log('\n🔍 === QUICK DIAGNOSTICS ===\n');
    
    // 1. Check DOM elements
    console.log('1️⃣ Checking DOM Elements:');
    const criticalElements = [
        'loginBtn', 'registerBtn', 'loginEmail', 'loginPassword',
        'googleLoginBtn', 'homeBtn', 'studyBtn', 'reviewBtn', 'statsBtn'
    ];
    
    criticalElements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`  ${el ? '✅' : '❌'} #${id} ${el ? 'exists' : 'NOT FOUND'}`);
    });
    
    // 2. Check global objects
    console.log('\n2️⃣ Checking Global Objects:');
    const globalObjects = [
        'app', 'database', 'userManager', 'languageManager', 
        'quizManager', 'testFramework', 'ImageFetcher'
    ];
    
    globalObjects.forEach(obj => {
        const exists = window[obj] !== undefined;
        console.log(`  ${exists ? '✅' : '❌'} window.${obj} ${exists ? 'exists' : 'NOT FOUND'}`);
    });
    
    // 3. Test login button specifically
    console.log('\n3️⃣ Testing Login Button:');
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        console.log('  ✅ Login button exists');
        console.log(`  📎 Event listeners: ${getEventListeners ? getEventListeners(loginBtn).length : 'unknown'}`);
        console.log(`  🎯 Button type: ${loginBtn.type}`);
        console.log(`  🎨 Button classes: ${loginBtn.className}`);
        
        // Try to trigger click manually
        console.log('  🖱️ Attempting manual click...');
        try {
            loginBtn.click();
            console.log('  ✅ Click executed without error');
        } catch (error) {
            console.error('  ❌ Click failed:', error.message);
        }
    } else {
        console.error('  ❌ Login button not found!');
    }
    
    // 4. Test app initialization
    console.log('\n4️⃣ Testing App Initialization:');
    if (window.app) {
        console.log('  ✅ App object exists');
        console.log(`  🔧 App methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(window.app)).length}`);
        
        // Test handleLogin method
        if (typeof window.app.handleLogin === 'function') {
            console.log('  ✅ handleLogin method exists');
        } else {
            console.error('  ❌ handleLogin method missing!');
        }
    } else {
        console.error('  ❌ App object not found!');
    }
    
    // 5. Test user input
    console.log('\n5️⃣ Testing User Input Fields:');
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField && passwordField) {
        console.log('  ✅ Input fields exist');
        
        // Set test values
        emailField.value = 'test@test.com';
        passwordField.value = 'test123';
        
        console.log(`  📧 Email value: "${emailField.value}"`);
        console.log(`  🔒 Password value: "${passwordField.value}"`);
    } else {
        console.error('  ❌ Input fields missing!');
    }
    
    console.log('\n🏁 Diagnostics complete. Check console for detailed results.');
    
    // Show results in alert too
    showDiagnosticsUI();
}

function showDiagnosticsUI() {
    const results = {
        loginBtn: !!document.getElementById('loginBtn'),
        app: !!window.app,
        userManager: !!window.userManager,
        handleLogin: !!(window.app && typeof window.app.handleLogin === 'function')
    };
    
    const status = Object.values(results).every(Boolean) ? '✅ All OK' : '❌ Issues Found';
    
    const ui = document.createElement('div');
    ui.style.cssText = `
        position: fixed; top: 50px; left: 50px; 
        background: white; border: 2px solid #007bff; 
        padding: 20px; border-radius: 8px; z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: monospace; font-size: 12px;
    `;
    
    ui.innerHTML = `
        <h3>🐛 Quick Diagnostics</h3>
        <div><strong>Status: ${status}</strong></div>
        <div>Login Button: ${results.loginBtn ? '✅' : '❌'}</div>
        <div>App Object: ${results.app ? '✅' : '❌'}</div>
        <div>User Manager: ${results.userManager ? '✅' : '❌'}</div>
        <div>Handle Login: ${results.handleLogin ? '✅' : '❌'}</div>
        <br>
        <button onclick="this.parentElement.remove()">Close</button>
        <button onclick="window.runManualLoginTest()">Test Login</button>
    `;
    
    document.body.appendChild(ui);
}

// Manual login test
window.runManualLoginTest = function() {
    console.log('\n🧪 === MANUAL LOGIN TEST ===');
    
    try {
        // Set test credentials
        const emailField = document.getElementById('loginEmail');
        const passwordField = document.getElementById('loginPassword');
        
        if (emailField && passwordField) {
            emailField.value = 'nalivator3000@gmail.com';
            passwordField.value = '1';
            
            console.log('📧 Set test credentials');
            
            // Try to call handleLogin directly
            if (window.app && typeof window.app.handleLogin === 'function') {
                console.log('🔐 Calling handleLogin directly...');
                window.app.handleLogin();
            } else {
                console.error('❌ Cannot call handleLogin - method not found');
            }
        } else {
            console.error('❌ Input fields not found');
        }
    } catch (error) {
        console.error('❌ Manual login test failed:', error);
    }
};