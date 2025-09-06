// Emergency Login System - Minimal working version
console.log('🚨 Emergency Login System Loading...');

// Wait for DOM to be ready
function waitForDOM() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEmergencyLogin);
    } else {
        initEmergencyLogin();
    }
}

function initEmergencyLogin() {
    console.log('🔧 Initializing emergency login...');
    
    // Check if main app is already working
    if (window.app && window.userManager) {
        console.log('✅ Main app already initialized, emergency login not needed');
        return;
    }
    
    // Find login button and attach handler
    const loginBtn = document.getElementById('loginBtn');
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (!loginBtn || !emailField || !passwordField) {
        console.log('ℹ️ Login elements not found, will retry later');
        // Retry after a delay
        setTimeout(initEmergencyLogin, 1000);
        return;
    }
    
    console.log('✅ Login elements found, attaching emergency handlers...');
    
    // Remove any existing handlers
    loginBtn.replaceWith(loginBtn.cloneNode(true));
    const newLoginBtn = document.getElementById('loginBtn');
    
    // Attach click handler
    newLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleEmergencyLogin();
    });
    
    // Attach enter key handler
    passwordField.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEmergencyLogin();
        }
    });
    
    console.log('✅ Emergency login handlers attached!');
}

function handleEmergencyLogin() {
    console.log('🔐 EMERGENCY LOGIN TRIGGERED!');
    
    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        console.log('✅ User already logged in, skipping emergency login');
        return;
    }
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password: ${password}`);
    
    if (!email || !password) {
        // Only show alert if this is an actual login attempt (not empty form on page load)
        if (document.activeElement === document.getElementById('loginBtn') || 
            document.activeElement === document.getElementById('loginEmail') || 
            document.activeElement === document.getElementById('loginPassword')) {
            alert('Пожалуйста, заполните все поля');
        }
        return;
    }
    
    // Simple hardcoded login for testing
    const validCredentials = [
        { email: 'root', password: 'root' },
        { email: 'Kate', password: '1' },
        { email: 'Mike', password: '1' }
    ];
    
    const isValid = validCredentials.some(cred => 
        cred.email === email && cred.password === password
    );
    
    if (isValid) {
        console.log('✅ Login successful!');
        
        // Hide auth modal
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
        }
        
        // Create simple user session
        const userData = {
            id: 'root-user',
            name: email, // Use actual username instead of 'Root User'
            email: email,
            loginTime: new Date().toISOString()
        };
        
        // Store user data
        localStorage.setItem('emergencyUser', JSON.stringify(userData));
        
        console.log('🚀 Initializing main app...');
        
        // Try to initialize the main app if it exists
        setTimeout(() => {
            initializeMainApp(userData);
        }, 100);
        
    } else {
        console.log('❌ Login failed!');
        alert('Неверные данные для входа');
        
        // Show error
        const authError = document.getElementById('authError');
        if (authError) {
            authError.textContent = 'Неверный email или пароль';
            authError.style.color = 'red';
        }
    }
}

// Initialize main app after emergency login
function initializeMainApp(userData) {
    console.log('🔧 Starting main app initialization...');
    
    try {
        // Set up emergency user in localStorage for other components
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Try to initialize main app components
        if (typeof window.LanguageLearningApp !== 'undefined') {
            console.log('🚀 Found main app class, attempting initialization...');
            
            try {
                // Create main app instance carefully
                window.app = new window.LanguageLearningApp();
                console.log('✅ Main app initialized successfully!');
                return; // Success, exit early
            } catch (appError) {
                console.error('❌ Main app initialization failed:', appError);
                console.log('🔧 Falling back to manual component initialization...');
            }
        }
        
        // Manual initialization fallback
        if (typeof window.database !== 'undefined' && typeof window.userManager !== 'undefined') {
            console.log('🔧 Main app class not found, trying individual components...');
            
            // Set up user manager with emergency user
            if (window.userManager) {
                window.userManager.currentUser = {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    languagePairs: [{
                        id: 'default-pair',
                        name: 'German-Russian',
                        fromLanguage: 'German',
                        toLanguage: 'Russian'
                    }]
                };
                window.userManager.currentLanguagePair = window.userManager.currentUser.languagePairs[0];
                console.log('✅ User manager configured');
            }
            
            // Update UI to show user info
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                userInfo.textContent = `👤 ${userData.name}`;
            }
            
            // Show main app sections and ensure container is visible
            const container = document.querySelector('.container');
            if (container) {
                container.style.display = 'block';
            }
            
            const sections = ['homeSection', 'importSection', 'studySection', 'reviewSection', 'statsSection'];
            sections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = 'block';
                }
            });
            
            // Show navigation
            const nav = document.querySelector('nav');
            if (nav) {
                nav.style.display = 'block';
            }
            
            // Show header user controls
            const headerUser = document.querySelector('.header-user');
            if (headerUser) {
                headerUser.style.display = 'block';
            }
            
            console.log('✅ Manual initialization completed');
            
        } else {
            console.warn('⚠️ Main app components not found, providing basic UI...');
            showBasicEmergencyInterface();
        }
        
        // Load and show home section by default
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            // Simulate home button click to activate navigation
            if (homeBtn.onclick) {
                homeBtn.onclick();
            } else {
                // Manual activation if no click handler
                homeBtn.classList.add('active');
                const homeSection = document.getElementById('homeSection');
                if (homeSection) {
                    homeSection.classList.add('active');
                    homeSection.style.display = 'block';
                }
                // Hide other sections
                ['importSection', 'studySection', 'reviewSection', 'statsSection', 'settingsSection'].forEach(id => {
                    const section = document.getElementById(id);
                    if (section) {
                        section.classList.remove('active');
                        section.style.display = 'none';
                    }
                });
            }
        }
        
        // Initialize router for multi-page navigation
        this.initializeRouter();
        
    } catch (error) {
        console.error('❌ Error initializing main app:', error);
        showBasicEmergencyInterface();
    }
}

// Initialize router for URL-based navigation
function initializeRouter() {
    console.log('🧭 Initializing router...');
    
    if (typeof Router !== 'undefined') {
        // Create router instance
        window.router = new Router();
        
        // Initialize router after small delay to ensure DOM is ready
        setTimeout(() => {
            window.router.init();
        }, 300);
        
        console.log('✅ Router initialized');
    } else {
        console.warn('⚠️ Router class not available, falling back to basic navigation');
        setupBasicNavigation();
    }
}

// Setup basic navigation if main app navigation isn't working
function setupBasicNavigation() {
    const navButtons = [
        { id: 'homeBtn', section: 'homeSection' },
        { id: 'importBtn', section: 'importSection' },
        { id: 'studyBtn', section: 'studySection' },
        { id: 'reviewBtn', section: 'reviewSection' },
        { id: 'statsBtn', section: 'statsSection' }
    ];
    
    navButtons.forEach(({ id, section }) => {
        const button = document.getElementById(id);
        if (button && !button.onclick) {
            button.onclick = () => {
                // Remove active class from all nav buttons
                navButtons.forEach(({ id: otherId }) => {
                    const otherBtn = document.getElementById(otherId);
                    if (otherBtn) otherBtn.classList.remove('active');
                });
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Hide all sections
                navButtons.forEach(({ section: otherSection }) => {
                    const otherSec = document.getElementById(otherSection);
                    if (otherSec) {
                        otherSec.classList.remove('active');
                        otherSec.style.display = 'none';
                    }
                });
                
                // Show target section
                const targetSection = document.getElementById(section);
                if (targetSection) {
                    targetSection.classList.add('active');
                    targetSection.style.display = 'block';
                }
                
                console.log(`📍 Emergency navigation: switched to ${section}`);
            };
        }
    });
    
    console.log('🧭 Basic navigation handlers attached');
}

// Fallback basic interface if main app fails
function showBasicEmergencyInterface() {
    console.log('📋 Setting up basic emergency interface...');
    
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <header>
                <h1>Memorizator v2.0 - Emergency Mode</h1>
                <div class="header-user">
                    <span class="user-info" id="emergencyUserInfo">👤 Emergency Mode</span>
                    <button onclick="location.reload()" class="user-menu-btn">🔄</button>
                </div>
            </header>
            <main>
                <section class="section active">
                    <h2>🚨 Emergency Mode Active</h2>
                    <p>The main application components are not available. Please check the console for errors.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="location.reload()" class="action-btn">🔄 Reload Page</button>
                        <button onclick="localStorage.clear(); location.reload();" class="action-btn" style="background: #e74c3c; margin-left: 10px;">🗑️ Clear Data & Reload</button>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h3>🔧 Debug Info:</h3>
                        <p><strong>User:</strong> ${JSON.parse(localStorage.getItem('emergencyUser') || '{}').name || 'Unknown'}</p>
                        <p><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Database Available:</strong> ${typeof window.database !== 'undefined' ? '✅' : '❌'}</p>
                        <p><strong>User Manager Available:</strong> ${typeof window.userManager !== 'undefined' ? '✅' : '❌'}</p>
                        <p><strong>Main App Available:</strong> ${typeof window.LanguageLearningApp !== 'undefined' ? '✅' : '❌'}</p>
                    </div>
                </section>
            </main>
        `;
        
        // Update emergency user info with actual username
        const emergencyUserInfo = document.getElementById('emergencyUserInfo');
        if (emergencyUserInfo && userData) {
            emergencyUserInfo.textContent = `👤 ${userData.name} (Emergency)`;
        }
    }
}

// Auto-initialize with delay to let main app start first
setTimeout(() => {
    waitForDOM();
}, 2000); // Wait 2 seconds for main app to initialize

// Export for manual testing
window.emergencyLogin = handleEmergencyLogin;
window.testLogin = function() {
    document.getElementById('loginEmail').value = 'root';
    document.getElementById('loginPassword').value = 'root';
    handleEmergencyLogin();
};

console.log('🚨 Emergency Login System Ready!');
console.log('💡 Use testLogin() to test with default credentials');
console.log('💡 Use emergencyLogin() to manually trigger login');