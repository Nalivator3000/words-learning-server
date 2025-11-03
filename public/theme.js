// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggleBtn = null;
        this.themeIcon = null;
        this.currentTheme = 'light';

        // Icons for different themes
        this.icons = {
            light: '🌙',
            dark: '☀️'
        };
    }

    init() {
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggleBtn?.querySelector('.theme-icon');

        // Load saved theme or detect system preference
        this.loadTheme();

        // Add event listener
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    loadTheme() {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;

        // Update HTML attribute
        document.documentElement.setAttribute('data-theme', theme);

        // Update icon
        if (this.themeIcon) {
            this.themeIcon.textContent = this.icons[theme];
        }

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);

        // Add animation to the icon
        if (this.themeIcon) {
            this.themeIcon.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                this.themeIcon.style.transform = 'rotate(0deg)';
            }, 300);
        }
    }

    getTheme() {
        return this.currentTheme;
    }
}

// PWA Install Prompt Manager
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
    }

    init() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the default install prompt
            e.preventDefault();

            // Store the event for later use
            this.deferredPrompt = e;

            // Show custom install button
            //             this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ Running as PWA');
        }
    }

    showInstallButton() {
        // Create install button if it doesn't exist
        if (!this.installButton) {
            this.installButton = document.createElement('button');
            this.installButton.id = 'pwa-install-btn';
            this.installButton.className = 'pwa-install-button';
            this.installButton.innerHTML = `
                <span class="install-icon">📱</span>
                <span class="install-text">${i18n.t('install_app')}</span>
            `;
            this.installButton.addEventListener('click', () => this.installApp());

            // Add to body
            document.body.appendChild(this.installButton);

            // Show with animation after a delay
            setTimeout(() => {
                this.installButton.classList.add('show');
            }, 3000);
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.classList.remove('show');
            setTimeout(() => {
                this.installButton.remove();
                this.installButton = null;
            }, 300);
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log(`User response to install prompt: ${outcome}`);

        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
        } else {
            console.log('❌ User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        this.deferredPrompt = null;
        this.hideInstallButton();
    }
}

// Create global instances
window.themeManager = new ThemeManager();
window.pwaInstallManager = new PWAInstallManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager.init();
        window.pwaInstallManager.init();
    });
} else {
    window.themeManager.init();
    window.pwaInstallManager.init();
}
