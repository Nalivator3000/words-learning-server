// Language Pairs Configuration for Memprizator v2.0
// Supports universal language learning with predefined popular pairs

export const LANGUAGE_PAIRS_CONFIG = {
    // Popular language pairs with metadata
    popularPairs: [
        // English as target language
        {
            id: 'ru-en',
            name: 'Русский → English',
            fromLanguage: 'Russian',
            fromLanguageCode: 'ru',
            toLanguage: 'English', 
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇷🇺→🇺🇸'
        },
        {
            id: 'de-en',
            name: 'Deutsch → English',
            fromLanguage: 'German',
            fromLanguageCode: 'de',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇩🇪→🇺🇸'
        },
        {
            id: 'fr-en',
            name: 'Français → English',
            fromLanguage: 'French',
            fromLanguageCode: 'fr',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇫🇷→🇺🇸'
        },
        {
            id: 'es-en',
            name: 'Español → English',
            fromLanguage: 'Spanish',
            fromLanguageCode: 'es',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'easy',
            flag: '🇪🇸→🇺🇸'
        },
        {
            id: 'it-en',
            name: 'Italiano → English',
            fromLanguage: 'Italian',
            fromLanguageCode: 'it',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇮🇹→🇺🇸'
        },
        {
            id: 'pt-en',
            name: 'Português → English',
            fromLanguage: 'Portuguese',
            fromLanguageCode: 'pt',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇵🇹→🇺🇸'
        },
        {
            id: 'ja-en',
            name: '日本語 → English',
            fromLanguage: 'Japanese',
            fromLanguageCode: 'ja',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'advanced',
            difficulty: 'hard',
            flag: '🇯🇵→🇺🇸'
        },
        {
            id: 'ko-en',
            name: '한국어 → English',
            fromLanguage: 'Korean',
            fromLanguageCode: 'ko',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'advanced',
            difficulty: 'hard',
            flag: '🇰🇷→🇺🇸'
        },
        {
            id: 'zh-en',
            name: '中文 → English',
            fromLanguage: 'Chinese',
            fromLanguageCode: 'zh',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'ltr',
            category: 'advanced',
            difficulty: 'hard',
            flag: '🇨🇳→🇺🇸'
        },
        {
            id: 'ar-en',
            name: 'العربية → English',
            fromLanguage: 'Arabic',
            fromLanguageCode: 'ar',
            toLanguage: 'English',
            toLanguageCode: 'en',
            direction: 'rtl',
            category: 'advanced',
            difficulty: 'hard',
            flag: '🇸🇦→🇺🇸'
        },

        // Russian as target language
        {
            id: 'en-ru',
            name: 'English → Русский',
            fromLanguage: 'English',
            fromLanguageCode: 'en',
            toLanguage: 'Russian',
            toLanguageCode: 'ru',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇺🇸→🇷🇺'
        },
        {
            id: 'de-ru',
            name: 'Deutsch → Русский',
            fromLanguage: 'German',
            fromLanguageCode: 'de',
            toLanguage: 'Russian',
            toLanguageCode: 'ru',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇩🇪→🇷🇺'
        },
        {
            id: 'fr-ru',
            name: 'Français → Русский',
            fromLanguage: 'French',
            fromLanguageCode: 'fr',
            toLanguage: 'Russian',
            toLanguageCode: 'ru',
            direction: 'ltr',
            category: 'popular',
            difficulty: 'medium',
            flag: '🇫🇷→🇷🇺'
        },

        // Other popular combinations
        {
            id: 'de-fr',
            name: 'Deutsch → Français',
            fromLanguage: 'German',
            fromLanguageCode: 'de',
            toLanguage: 'French',
            toLanguageCode: 'fr',
            direction: 'ltr',
            category: 'european',
            difficulty: 'medium',
            flag: '🇩🇪→🇫🇷'
        },
        {
            id: 'es-pt',
            name: 'Español → Português',
            fromLanguage: 'Spanish',
            fromLanguageCode: 'es',
            toLanguage: 'Portuguese',
            toLanguageCode: 'pt',
            direction: 'ltr',
            category: 'romance',
            difficulty: 'easy',
            flag: '🇪🇸→🇵🇹'
        }
    ],

    // Language database with complete information
    languages: {
        'en': { name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr', family: 'Germanic' },
        'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', direction: 'ltr', family: 'Slavic' },
        'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr', family: 'Germanic' },
        'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr', family: 'Romance' },
        'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr', family: 'Romance' },
        'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', direction: 'ltr', family: 'Romance' },
        'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', direction: 'ltr', family: 'Romance' },
        'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr', family: 'Japonic' },
        'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', direction: 'ltr', family: 'Koreanic' },
        'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', direction: 'ltr', family: 'Sino-Tibetan' },
        'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl', family: 'Semitic' },
        'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', direction: 'ltr', family: 'Indo-European' },
        'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', direction: 'ltr', family: 'Turkic' },
        'pl': { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', direction: 'ltr', family: 'Slavic' },
        'nl': { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', direction: 'ltr', family: 'Germanic' },
        'sv': { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', direction: 'ltr', family: 'Germanic' },
        'no': { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', direction: 'ltr', family: 'Germanic' },
        'da': { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', direction: 'ltr', family: 'Germanic' },
        'fi': { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', direction: 'ltr', family: 'Uralic' },
        'he': { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', direction: 'rtl', family: 'Semitic' },
        'th': { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', direction: 'ltr', family: 'Tai-Kadai' },
        'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', direction: 'ltr', family: 'Austroasiatic' }
    },

    // Categories for organization
    categories: {
        popular: { name: 'Popular', icon: '🔥', description: 'Most commonly learned language pairs' },
        european: { name: 'European', icon: '🇪🇺', description: 'European language combinations' },
        romance: { name: 'Romance', icon: '💕', description: 'Romance language family' },
        advanced: { name: 'Advanced', icon: '🎓', description: 'Challenging languages for advanced learners' },
        asian: { name: 'Asian', icon: '🌏', description: 'Asian language combinations' },
        custom: { name: 'Custom', icon: '⚙️', description: 'User-created language pairs' }
    }
};

// Helper functions for language pair management
export const LanguagePairHelper = {
    /**
     * Get all popular language pairs
     */
    getPopularPairs() {
        return LANGUAGE_PAIRS_CONFIG.popularPairs.filter(pair => pair.category === 'popular');
    },

    /**
     * Get language pairs by category
     */
    getPairsByCategory(category) {
        return LANGUAGE_PAIRS_CONFIG.popularPairs.filter(pair => pair.category === category);
    },

    /**
     * Create a custom language pair
     */
    createCustomPair(fromLangCode, toLangCode, customName = null) {
        const fromLang = LANGUAGE_PAIRS_CONFIG.languages[fromLangCode];
        const toLang = LANGUAGE_PAIRS_CONFIG.languages[toLangCode];
        
        if (!fromLang || !toLang) {
            throw new Error('Unsupported language codes');
        }

        const pairId = `${fromLangCode}-${toLangCode}`;
        const name = customName || `${fromLang.nativeName} → ${toLang.nativeName}`;

        return {
            id: pairId,
            name: name,
            fromLanguage: fromLang.name,
            fromLanguageCode: fromLangCode,
            toLanguage: toLang.name,
            toLanguageCode: toLangCode,
            direction: fromLang.direction === 'rtl' ? 'rtl' : 'ltr',
            category: 'custom',
            difficulty: 'medium',
            flag: `${fromLang.flag}→${toLang.flag}`
        };
    },

    /**
     * Validate language pair
     */
    validatePair(pair) {
        const required = ['id', 'name', 'fromLanguage', 'toLanguage', 'fromLanguageCode', 'toLanguageCode'];
        return required.every(field => pair[field] && pair[field].length > 0);
    },

    /**
     * Get supported language codes
     */
    getSupportedLanguages() {
        return Object.keys(LANGUAGE_PAIRS_CONFIG.languages);
    },

    /**
     * Check if language supports RTL
     */
    isRTL(languageCode) {
        const lang = LANGUAGE_PAIRS_CONFIG.languages[languageCode];
        return lang && lang.direction === 'rtl';
    }
};