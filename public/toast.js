// Toast Notification System
// Beautiful, animated toast notifications for user feedback

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.maxToasts = 5;
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (default: 4000)
     * @param {object} options - Additional options (icon, action, etc.)
     */
    show(message, type = 'info', duration = 4000, options = {}) {
        // Debug logging
        console.log('🍞 Toast.show called:', { message, type, duration, messageType: typeof message });

        // Limit max toasts
        if (this.toasts.length >= this.maxToasts) {
            this.removeOldest();
        }

        const toast = this.createToast(message, type, duration, options);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    createToast(message, type, duration, options) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Ensure message is a string and not empty
        const safeMessage = (message !== null && message !== undefined) ? String(message) : 'Notification';

        // Icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        const icon = options.icon || icons[type] || 'ℹ';

        // Build toast HTML
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${options.title ? `<div class="toast-title">${options.title}</div>` : ''}
                <div class="toast-message">${safeMessage}</div>
            </div>
            ${options.action ? `<button class="toast-action">${options.action}</button>` : ''}
            <button class="toast-close">✕</button>
        `;

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast);
        });

        // Action button handler
        if (options.action && options.onAction) {
            const actionBtn = toast.querySelector('.toast-action');
            actionBtn.addEventListener('click', () => {
                options.onAction();
                this.remove(toast);
            });
        }

        return toast;
    }

    remove(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.remove('show');
        toast.classList.add('removing');

        setTimeout(() => {
            if (toast.parentNode) {
                this.container.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    removeOldest() {
        if (this.toasts.length > 0) {
            this.remove(this.toasts[0]);
        }
    }

    removeAll() {
        [...this.toasts].forEach(toast => {
            this.remove(toast);
        });
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', 4000, options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', 5000, options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', 4500, options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', 4000, options);
    }

    // Achievement toast with special styling
    achievement(title, description, icon = '🏆') {
        return this.show(description, 'success', 6000, {
            title: title,
            icon: icon
        });
    }

    // Loading toast (doesn't auto-dismiss)
    loading(message) {
        const toast = this.show(message, 'info', 0, {
            icon: '⏳'
        });
        toast.classList.add('toast-loading');
        return toast;
    }

    // Update loading toast to success or error
    updateLoading(loadingToast, message, type = 'success') {
        if (!loadingToast) return;

        const icons = {
            success: '✓',
            error: '✕'
        };

        const iconEl = loadingToast.querySelector('.toast-icon');
        const messageEl = loadingToast.querySelector('.toast-message');

        if (iconEl) iconEl.textContent = icons[type] || '✓';
        if (messageEl) messageEl.textContent = message;

        loadingToast.classList.remove('toast-loading', 'toast-info');
        loadingToast.classList.add(`toast-${type}`);

        setTimeout(() => {
            this.remove(loadingToast);
        }, 3000);
    }
}

// Initialize global toast manager
window.toast = new ToastManager();

// Also expose convenience methods globally
window.showToast = (message, type, duration, options) => {
    return window.toast.show(message, type, duration, options);
};
