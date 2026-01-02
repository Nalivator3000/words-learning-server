/**
 * Authentication Form Validation
 * - Password strength indicator
 * - Email validation
 * - Real-time feedback
 */

class AuthValidation {
    constructor() {
        this.init();
    }

    init() {
        // Initialize password strength indicator
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // Initialize email validation
        const registerEmail = document.getElementById('registerEmail');
        if (registerEmail) {
            registerEmail.addEventListener('blur', (e) => this.validateEmail(e.target.value));
            registerEmail.addEventListener('input', () => {
                // Clear validation message while typing
                const validationEl = document.getElementById('emailValidation');
                if (validationEl) {
                    validationEl.textContent = '';
                    validationEl.className = 'validation-message';
                }
            });
        }

        // Terms and Privacy links
        document.getElementById('termsLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTerms();
        });

        document.getElementById('privacyLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacy();
        });
    }

    /**
     * Check password strength
     * @param {string} password - The password to check
     */
    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');

        if (!password) {
            strengthBar.className = 'strength-fill';
            strengthText.textContent = '';
            strengthText.className = 'strength-text';
            return;
        }

        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        else if (password.length < 6) {
            feedback.push(window.i18n ? window.i18n.t('password_min_chars') : 'minimum 6 characters');
        }

        // Complexity checks
        if (/[a-z]/.test(password)) strength += 1; // lowercase
        if (/[A-Z]/.test(password)) strength += 1; // uppercase
        if (/[0-9]/.test(password)) strength += 1; // numbers
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // special chars

        // Determine strength level
        let level = 'weak';
        let text = window.i18n ? window.i18n.t('password_weak') : 'Weak password';

        if (strength >= 5) {
            level = 'strong';
            text = window.i18n ? window.i18n.t('password_strong') : 'Strong password';
        } else if (strength >= 3) {
            level = 'medium';
            text = window.i18n ? window.i18n.t('password_medium') : 'Medium password';
        }

        // Add feedback
        if (level === 'weak' || level === 'medium') {
            const suggestions = [];
            if (!/[A-Z]/.test(password)) suggestions.push(window.i18n ? window.i18n.t('uppercase_letters') : 'uppercase letters');
            if (!/[0-9]/.test(password)) suggestions.push(window.i18n ? window.i18n.t('numbers') : 'numbers');
            if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push(window.i18n ? window.i18n.t('special_chars') : 'special characters');

            if (suggestions.length > 0) {
                const addText = window.i18n ? window.i18n.t('add_suggestion') : 'add';
                text += ' (' + addText + ' ' + suggestions.join(', ') + ')';
            }
        }

        // Update UI
        strengthBar.className = `strength-fill ${level}`;
        strengthText.className = `strength-text ${level}`;
        strengthText.textContent = text;
    }

    /**
     * Validate email format
     * @param {string} email - The email to validate
     */
    validateEmail(email) {
        const validationEl = document.getElementById('emailValidation');
        if (!validationEl) return;

        if (!email) {
            validationEl.textContent = '';
            validationEl.className = 'validation-message';
            return;
        }

        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailRegex.test(email)) {
            validationEl.textContent = '✓ ' + (window.i18n ? window.i18n.t('email_valid') : 'Email looks correct');
            validationEl.className = 'validation-message valid';
        } else {
            validationEl.textContent = '✗ ' + (window.i18n ? window.i18n.t('email_invalid') : 'Invalid email format');
            validationEl.className = 'validation-message invalid';
        }
    }

    /**
     * Show Terms of Service
     */
    showTerms() {
        const termsText = window.i18n ? window.i18n.t('terms_of_service_text') :
            'Terms of Service:\n\n' +
            '1. You agree to use the application for language learning.\n' +
            '2. You will not use the application for illegal purposes.\n' +
            '3. We may change the terms with user notification.\n\n' +
            'Full version of terms will be available in future updates.';
        alert(termsText);
    }

    /**
     * Show Privacy Policy
     */
    showPrivacy() {
        const privacyText = window.i18n ? window.i18n.t('privacy_policy_text') :
            'Privacy Policy:\n\n' +
            '1. We only collect necessary data (name, email, learning progress).\n' +
            '2. Your data is stored on secure servers.\n' +
            '3. We do not sell your data to third parties.\n' +
            '4. You can delete your account at any time.\n\n' +
            'Full version of the policy will be available in future updates.';
        alert(privacyText);
    }
}

// Initialize on page load, after translations are loaded
function initAuthValidation() {
    window.authValidation = new AuthValidation();
}

// Wait for translations to load before initializing
if (window.i18n && window.i18n.translations && Object.keys(window.i18n.translations).length > 0) {
    // Translations already loaded
    initAuthValidation();
} else {
    // Wait for translations to load
    window.addEventListener('translationsLoaded', initAuthValidation);

    // Fallback: if translations don't load within 2 seconds, initialize anyway
    setTimeout(() => {
        if (!window.authValidation) {
            console.warn('⚠️  Auth validation initialized without translations');
            initAuthValidation();
        }
    }, 2000);
}
