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
        } else if (['ru', 'en', 'de', 'es', 'fr', 'it', 'pl', 'ar', 'tr', 'ro', 'sr', 'uk', 'pt', 'sw', 'hi'].includes(langCode)) {
            this.currentLanguage = langCode;
        }
    }

    /**
     * Load translations from JSON file
     */
    async loadTranslations() {
        try {
            // Add cache-busting parameter to force fresh fetch
            const cacheBuster = Date.now();
            const response = await fetch(`/translations/source-texts.json?v=${cacheBuster}`, {
                cache: 'no-cache'
            });
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
     * Get plural form of a word based on count
     * @param {string} key - Base translation key (e.g., 'day')
     * @param {number} count - Number for pluralization
     * @returns {string} Pluralized text with count
     */
    plural(key, count) {
        const lang = this.currentLanguage;

        // Get the plural form index based on language rules
        const pluralFormIndex = this.getPluralFormIndex(count, lang);

        // Try to find the specific plural form key
        let pluralKey = key;
        if (pluralFormIndex === 0) {
            // Singular form - try key_one, key_singular, or just key
            pluralKey = this.translations[lang]?.[`${key}_one`] ? `${key}_one` :
                       this.translations[lang]?.[`${key}_singular`] ? `${key}_singular` : key;
        } else if (pluralFormIndex === 1) {
            // Plural form - try key_other, key_plural, keys, or key + 's'
            pluralKey = this.translations[lang]?.[`${key}_other`] ? `${key}_other` :
                       this.translations[lang]?.[`${key}_plural`] ? `${key}_plural` :
                       this.translations[lang]?.[`${key}s`] ? `${key}s` : key;
        } else if (pluralFormIndex === 2) {
            // Some languages have a special form for few (2-4 in Slavic languages)
            pluralKey = this.translations[lang]?.[`${key}_few`] ? `${key}_few` :
                       this.translations[lang]?.[`${key}_other`] ? `${key}_other` : key;
        }

        const text = this.t(pluralKey);
        return `${count} ${text}`;
    }

    /**
     * Get plural form index based on language-specific rules
     * @param {number} n - The count
     * @param {string} lang - Language code
     * @returns {number} Plural form index (0=one, 1=other, 2=few, etc.)
     */
    getPluralFormIndex(n, lang) {
        // English, German, Spanish, Italian, Portuguese: singular (1) vs plural (other)
        if (['en', 'de', 'es', 'it', 'pt', 'sw'].includes(lang)) {
            return n === 1 ? 0 : 1;
        }

        // Russian, Ukrainian, Serbian, Polish: complex rules
        // 1, 21, 31... = one
        // 2-4, 22-24, 32-34... = few
        // 5-20, 25-30... = many/other
        if (['ru', 'uk', 'sr', 'pl'].includes(lang)) {
            const mod10 = n % 10;
            const mod100 = n % 100;

            if (mod10 === 1 && mod100 !== 11) {
                return 0; // one: 1 день
            } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
                return 2; // few: 2 дня
            } else {
                return 1; // other: 5 дней
            }
        }

        // Hindi: singular (1) vs plural (other)
        if (lang === 'hi') {
            return n === 1 ? 0 : 1;
        }

        // Arabic: complex rules with special forms for 0, 1, 2, 3-10, 11-99, 100+
        if (lang === 'ar') {
            if (n === 0) return 0;
            if (n === 1) return 0;
            if (n === 2) return 2;
            if (n >= 3 && n <= 10) return 1;
            return 1;
        }

        // French: 0-1 are singular, rest plural
        if (lang === 'fr') {
            return n === 0 || n === 1 ? 0 : 1;
        }

        // Turkish, Romanian: singular vs plural
        if (['tr', 'ro'].includes(lang)) {
            return n === 1 ? 0 : 1;
        }

        // Default: simple singular/plural
        return n === 1 ? 0 : 1;
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
     * @param {string} lang - Language code (en, ru, de, es, fr, it, pl, ar, tr, ro, sr, uk, pt, sw)
     */
    async setLanguage(lang) {
        if (!['ru', 'en', 'de', 'es', 'fr', 'it', 'pl', 'ar', 'tr', 'ro', 'sr', 'uk', 'pt', 'sw', 'hi'].includes(lang)) {
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
window.i18n = i18n; // Expose globally

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await i18n.loadTranslations();
        i18n.updateDOM();
        // Dispatch event when translations are ready
        window.dispatchEvent(new CustomEvent('translationsLoaded'));
    });
} else {
    // DOM already loaded
    i18n.loadTranslations().then(() => {
        i18n.updateDOM();
        // Dispatch event when translations are ready
        window.dispatchEvent(new CustomEvent('translationsLoaded'));
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}
