/**
 * i18n - Internationalization Manager
 * Centralized translation system using translations/source-texts.json
 */

class I18nManager {
    constructor() {
        this.currentLanguage = 'en'; // Default language
        this.translations = {}; // Will be loaded from JSON
        this.fallbackLanguage = 'en';

        // Detect system language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0]; // en-US -> en

        // Set initial language from localStorage or browser
        const savedLang = localStorage.getItem('uiLanguage');
        if (savedLang) {
            this.currentLanguage = savedLang;
        } else if (['ru', 'en', 'de', 'es', 'fr', 'it'].includes(langCode)) {
            this.currentLanguage = langCode;
        }
    }

    /**
     * Load translations from JSON file
     */
    async loadTranslations() {
        try {
            const response = await fetch('/translations/source-texts.json');
            if (!response.ok) {
                throw new Error(`Failed to load translations: ${response.status}`);
            }

            const data = await response.json();

            // Transform flat structure to nested by language
            // From: { "key": { "en": "text", "ru": "текст" } }
            // To: { "en": { "key": "text" }, "ru": { "key": "текст" } }
            this.translations = {};

            for (const [key, translations] of Object.entries(data)) {
                for (const [lang, text] of Object.entries(translations)) {
                    if (lang === 'source') continue; // Skip source field

                    if (!this.translations[lang]) {
                        this.translations[lang] = {};
                    }

                    if (text) { // Only add non-null translations
                        this.translations[lang][key] = text;
                    }
                }
            }

            console.log('✅ Translations loaded:', Object.keys(this.translations));
            return true;
        } catch (error) {
            console.error('❌ Failed to load translations:', error);
            return false;
        }
    }

    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @param {Object} params - Optional parameters for interpolation
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        // Try current language
        let text = this.translations[this.currentLanguage]?.[key];

        // Fallback to English if not found
        if (!text && this.currentLanguage !== this.fallbackLanguage) {
            text = this.translations[this.fallbackLanguage]?.[key];
        }

        // If still not found, return key in brackets
        if (!text) {
            console.warn(`⚠️  Translation missing: ${key} (${this.currentLanguage})`);
            return `[${key}]`;
        }

        // Interpolate parameters
        return this.interpolate(text, params);
    }

    /**
     * Interpolate parameters into text
     * Example: "Hello {name}" with { name: "World" } -> "Hello World"
     */
    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Set current language and update UI
     * @param {string} lang - Language code (en, ru, de, es, fr, it)
     */
    async setLanguage(lang) {
        if (!['ru', 'en', 'de', 'es', 'fr', 'it'].includes(lang)) {
            console.error(`❌ Unsupported language: ${lang}`);
            return false;
        }

        this.currentLanguage = lang;
        localStorage.setItem('uiLanguage', lang);

        // Update all elements with data-i18n attribute
        this.updateDOM();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));

        console.log(`✅ Language changed to: ${lang}`);
        return true;
    }

    /**
     * Update all DOM elements with translations
     */
    updateDOM() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.t(key);

            // Update text content or value depending on element type
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.getAttribute('placeholder') !== null) {
                    element.placeholder = text;
                } else {
                    element.value = text;
                }
            } else {
                element.textContent = text;
            }
        });

        // Update elements with data-i18n-html attribute (for HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = this.t(key);
        });

        // Update elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * Get all translations for current language
     */
    getAllTranslations() {
        return this.translations[this.currentLanguage] || {};
    }

    /**
     * Check if translation exists
     */
    hasTranslation(key) {
        return !!this.translations[this.currentLanguage]?.[key];
    }

    /**
     * Get translation coverage (percentage)
     */
    getCoverage(lang) {
        const totalKeys = Object.keys(this.translations.en || {}).length;
        const translatedKeys = Object.keys(this.translations[lang] || {}).length;
        return totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0;
    }
}

// Create global instance
const i18n = new I18nManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await i18n.loadTranslations();
        i18n.updateDOM();
    });
} else {
    // DOM already loaded
    i18n.loadTranslations().then(() => {
        i18n.updateDOM();
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}
