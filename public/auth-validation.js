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
            feedback.push('минимум 6 символов');
        }

        // Complexity checks
        if (/[a-z]/.test(password)) strength += 1; // lowercase
        if (/[A-Z]/.test(password)) strength += 1; // uppercase
        if (/[0-9]/.test(password)) strength += 1; // numbers
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // special chars

        // Determine strength level
        let level = 'weak';
        let text = 'Слабый пароль';

        if (strength >= 5) {
            level = 'strong';
            text = 'Надёжный пароль';
        } else if (strength >= 3) {
            level = 'medium';
            text = 'Средний пароль';
        }

        // Add feedback
        if (level === 'weak' || level === 'medium') {
            const suggestions = [];
            if (!/[A-Z]/.test(password)) suggestions.push('заглавные буквы');
            if (!/[0-9]/.test(password)) suggestions.push('цифры');
            if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('спецсимволы');

            if (suggestions.length > 0) {
                text += ' (добавьте ' + suggestions.join(', ') + ')';
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
            validationEl.textContent = '✓ Email выглядит корректно';
            validationEl.className = 'validation-message valid';
        } else {
            validationEl.textContent = '✗ Некорректный формат email';
            validationEl.className = 'validation-message invalid';
        }
    }

    /**
     * Show Terms of Service
     */
    showTerms() {
        alert('Условия использования:\n\n' +
            '1. Вы соглашаетесь использовать приложение для изучения языков.\n' +
            '2. Вы не будете использовать приложение в незаконных целях.\n' +
            '3. Мы можем изменять условия с уведомлением пользователей.\n\n' +
            'Полная версия условий будет доступна в будущих обновлениях.');
    }

    /**
     * Show Privacy Policy
     */
    showPrivacy() {
        alert('Политика конфиденциальности:\n\n' +
            '1. Мы собираем только необходимые данные (имя, email, прогресс обучения).\n' +
            '2. Ваши данные хранятся на защищённых серверах.\n' +
            '3. Мы не продаём ваши данные третьим лицам.\n' +
            '4. Вы можете удалить свой аккаунт в любой момент.\n\n' +
            'Полная версия политики будет доступна в будущих обновлениях.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.authValidation = new AuthValidation();
});
