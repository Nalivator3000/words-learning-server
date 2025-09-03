class LanguageManager {
    constructor() {
        this.currentUILanguage = 'ru';
        this.supportedLanguages = {
            'ru': 'Russian',
            'en': 'English',
            'de': 'German',
            'es': 'Spanish',
            'fr': 'French',
            'it': 'Italian'
        };
        
        this.languageCodes = {
            'Russian': 'ru',
            'English': 'en',
            'German': 'de',
            'Spanish': 'es',
            'French': 'fr',
            'Italian': 'it'
        };
        
        this.translations = {
            'ru': {
                // Navigation
                'home': 'Главная',
                'import': 'Импорт',
                'study': 'Изучение',
                'review': 'Повторение',
                'statistics': 'Статистика',
                'settings': 'Настройки',
                
                // Auth
                'welcome': 'Добро пожаловать!',
                'login': 'Войти',
                'register': 'Регистрация',
                'name': 'Имя',
                'email': 'Email',
                'password': 'Пароль',
                'confirmPassword': 'Подтвердите пароль',
                'loginWithGoogle': 'Войти через Google',
                'logout': 'Выйти',
                
                // Home
                'studyingWords': 'Изучаемые слова',
                'reviewWords': 'На повторении',
                'learnedWords': 'Изучено',
                'quickStudy': 'Быстрое изучение',
                'quickReview': 'Быстрое повторение',
                
                // Study modes
                'selectMode': 'Выберите режим изучения:',
                'multipleChoice': 'Выбор из вариантов',
                'reverseChoice': 'Обратный выбор',
                'wordBuilding': 'Составление слова',
                'typing': 'Ввод с клавиатуры',
                'complexMode': 'Комплексный режим',
                
                // Quiz
                'question': 'Вопрос',
                'of': 'из',
                'next': 'Далее',
                'finish': 'Завершить',
                'correct': 'Правильно!',
                'incorrect': 'Неправильно.',
                'correctAnswer': 'Правильный ответ:',
                'showAnswer': 'Показать ответ',
                'answer': 'Ответить',
                'clear': 'Очистить',
                
                // Settings
                'languagePairs': 'Языковые пары',
                'studySettings': 'Настройки обучения',
                'wordsPerLesson': 'Количество слов в уроке:',
                'addLanguagePair': 'Добавить языковую пару',
                'sync': 'Синхронизировать с сервером',
                'select': 'Выбрать',
                'delete': 'Удалить',
                
                // Import
                'importWords': 'Импорт слов',
                'fromCSV': 'Из CSV файла',
                'fromGoogleSheets': 'Из Google Таблиц',
                'selectFile': 'Выбрать файл',
                'import': 'Импорт',
                
                // Language creation dialog
                'studyingLanguage': 'Изучаемый язык:',
                'nativeLanguage': 'Родной язык:',
                'pairName': 'Название пары:',
                
                // Messages
                'noWords': 'Нет слов',
                'syncComplete': 'Синхронизация завершена успешно',
                'syncError': 'Ошибка синхронизации',
                'syncing': 'Синхронизация...'
            },
            
            'en': {
                // Navigation
                'home': 'Home',
                'import': 'Import',
                'study': 'Study',
                'review': 'Review',
                'statistics': 'Statistics',
                'settings': 'Settings',
                
                // Auth
                'welcome': 'Welcome!',
                'login': 'Login',
                'register': 'Register',
                'name': 'Name',
                'email': 'Email',
                'password': 'Password',
                'confirmPassword': 'Confirm Password',
                'loginWithGoogle': 'Login with Google',
                'logout': 'Logout',
                
                // Home
                'studyingWords': 'Studying Words',
                'reviewWords': 'Review Words',
                'learnedWords': 'Learned',
                'quickStudy': 'Quick Study',
                'quickReview': 'Quick Review',
                
                // Study modes
                'selectMode': 'Select study mode:',
                'multipleChoice': 'Multiple Choice',
                'reverseChoice': 'Reverse Choice',
                'wordBuilding': 'Word Building',
                'typing': 'Typing',
                'complexMode': 'Complex Mode',
                
                // Quiz
                'question': 'Question',
                'of': 'of',
                'next': 'Next',
                'finish': 'Finish',
                'correct': 'Correct!',
                'incorrect': 'Incorrect.',
                'correctAnswer': 'Correct answer:',
                'showAnswer': 'Show Answer',
                'answer': 'Answer',
                'clear': 'Clear',
                
                // Settings
                'languagePairs': 'Language Pairs',
                'studySettings': 'Study Settings',
                'wordsPerLesson': 'Words per lesson:',
                'addLanguagePair': 'Add Language Pair',
                'sync': 'Sync with Server',
                'select': 'Select',
                'delete': 'Delete',
                
                // Import
                'importWords': 'Import Words',
                'fromCSV': 'From CSV File',
                'fromGoogleSheets': 'From Google Sheets',
                'selectFile': 'Select File',
                'import': 'Import',
                
                // Language creation dialog
                'studyingLanguage': 'Studying Language:',
                'nativeLanguage': 'Native Language:',
                'pairName': 'Pair Name:',
                
                // Messages
                'noWords': 'No words',
                'syncComplete': 'Sync completed successfully',
                'syncError': 'Sync error',
                'syncing': 'Syncing...'
            },
            
            'de': {
                // Navigation
                'home': 'Startseite',
                'import': 'Importieren',
                'study': 'Lernen',
                'review': 'Wiederholen',
                'statistics': 'Statistiken',
                'settings': 'Einstellungen',
                
                // Auth
                'welcome': 'Willkommen!',
                'login': 'Anmelden',
                'register': 'Registrieren',
                'name': 'Name',
                'email': 'E-Mail',
                'password': 'Passwort',
                'confirmPassword': 'Passwort bestätigen',
                'loginWithGoogle': 'Mit Google anmelden',
                'logout': 'Abmelden',
                
                // Home
                'studyingWords': 'Lernende Wörter',
                'reviewWords': 'Wiederholung',
                'learnedWords': 'Gelernt',
                'quickStudy': 'Schnell lernen',
                'quickReview': 'Schnell wiederholen',
                
                // Study modes
                'selectMode': 'Lernmodus wählen:',
                'multipleChoice': 'Multiple Choice',
                'reverseChoice': 'Umgekehrte Wahl',
                'wordBuilding': 'Wort bilden',
                'typing': 'Tippen',
                'complexMode': 'Komplexer Modus',
                
                // Quiz
                'question': 'Frage',
                'of': 'von',
                'next': 'Weiter',
                'finish': 'Beenden',
                'correct': 'Richtig!',
                'incorrect': 'Falsch.',
                'correctAnswer': 'Richtige Antwort:',
                'showAnswer': 'Antwort zeigen',
                'answer': 'Antworten',
                'clear': 'Löschen',
                
                // Settings
                'languagePairs': 'Sprachpaare',
                'studySettings': 'Lerneinstellungen',
                'wordsPerLesson': 'Wörter pro Lektion:',
                'addLanguagePair': 'Sprachpaar hinzufügen',
                'sync': 'Mit Server synchronisieren',
                'select': 'Auswählen',
                'delete': 'Löschen',
                
                // Import
                'importWords': 'Wörter importieren',
                'fromCSV': 'Aus CSV-Datei',
                'fromGoogleSheets': 'Aus Google Sheets',
                'selectFile': 'Datei auswählen',
                'import': 'Importieren',
                
                // Language creation dialog
                'studyingLanguage': 'Lernsprache:',
                'nativeLanguage': 'Muttersprache:',
                'pairName': 'Paar-Name:',
                
                // Messages
                'noWords': 'Keine Wörter',
                'syncComplete': 'Synchronisation erfolgreich abgeschlossen',
                'syncError': 'Synchronisationsfehler',
                'syncing': 'Synchronisiere...'
            }
        };
    }
    
    setUILanguage(languageCode) {
        if (this.supportedLanguages[languageCode]) {
            this.currentUILanguage = languageCode;
            this.updateUI();
            localStorage.setItem('uiLanguage', languageCode);
        }
    }
    
    getUILanguage() {
        return this.currentUILanguage;
    }
    
    t(key) {
        return this.translations[this.currentUILanguage]?.[key] || key;
    }
    
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
    
    getLanguageCode(languageName) {
        return this.languageCodes[languageName] || 'en';
    }
    
    getLanguageName(languageCode) {
        return this.supportedLanguages[languageCode] || languageCode;
    }
    
    updateUI() {
        // Update all translatable elements
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.placeholder) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document language
        document.documentElement.lang = this.currentUILanguage;
        
        // Update page title
        document.title = this.t('appTitle') || 'Language Learning App';
    }
    
    init() {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('uiLanguage');
        if (savedLanguage && this.supportedLanguages[savedLanguage]) {
            this.currentUILanguage = savedLanguage;
        }
        
        // Update UI on load
        setTimeout(() => this.updateUI(), 100);
    }
    
    // Audio language detection for TTS
    getAudioLanguageCode(text, languagePair) {
        if (!languagePair) return 'de-DE'; // Default fallback
        
        const studyingLang = languagePair.fromLanguage;
        const nativeLang = languagePair.toLanguage;
        
        // Enhanced language detection
        const isNativeLanguage = this.detectNativeLanguage(text, nativeLang);
        
        if (isNativeLanguage) {
            return this.getAudioCode(nativeLang);
        } else {
            return this.getAudioCode(studyingLang);
        }
    }
    
    detectNativeLanguage(text, nativeLanguage) {
        if (!text || !nativeLanguage) return false;
        
        // Language-specific character patterns
        const patterns = {
            'Russian': /[а-яё]/i,
            'English': /^[a-zA-Z\s\-'.,"!?]+$/,
            'German': /[äöüßÄÖÜ]|^[a-zA-Z\s\-'.,"!?]+$/,
            'Spanish': /[ñáéíóúüÑÁÉÍÓÚÜ]|^[a-zA-Z\s\-'.,"!?]+$/,
            'French': /[àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]|^[a-zA-Z\s\-'.,"!?]+$/,
            'Italian': /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]|^[a-zA-Z\s\-'.,"!?]+$/
        };
        
        const pattern = patterns[nativeLanguage];
        return pattern ? pattern.test(text) : false;
    }
    
    getAudioCode(language) {
        const audioCodes = {
            'Russian': 'ru-RU',
            'English': 'en-US',
            'German': 'de-DE',
            'Spanish': 'es-ES',
            'French': 'fr-FR',
            'Italian': 'it-IT'
        };
        
        return audioCodes[language] || 'en-US';
    }
}

const languageManager = new LanguageManager();