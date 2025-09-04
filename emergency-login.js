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
    
    // Find login button and attach handler
    const loginBtn = document.getElementById('loginBtn');
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (!loginBtn || !emailField || !passwordField) {
        console.error('❌ Login elements not found!');
        return;
    }
    
    console.log('✅ Login elements found, attaching handlers...');
    
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
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password: ${password}`);
    
    if (!email || !password) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    // Simple hardcoded login for testing
    const validCredentials = [
        { email: 'root', password: 'root' },
        { email: 'nalivator3000@gmail.com', password: '1' },
        { email: 'test@test.com', password: 'test123' }
    ];
    
    const isValid = validCredentials.some(cred => 
        cred.email === email && cred.password === password
    );
    
    if (isValid) {
        console.log('✅ Login successful!');
        alert('Вход выполнен успешно! (emergency mode)');
        
        // Hide auth modal
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
        }
        
        // Show success message
        document.body.innerHTML += `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: green; color: white; padding: 20px; border-radius: 10px; z-index: 10000;">
                <h2>✅ Вход выполнен!</h2>
                <p>Email: ${email}</p>
                <p>Используется экстренный режим входа</p>
                <button onclick="location.reload()">Перезагрузить страницу</button>
            </div>
        `;
        
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

// Auto-initialize
waitForDOM();

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