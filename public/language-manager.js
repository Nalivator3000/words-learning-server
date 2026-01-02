class LanguageManager {
    constructor() {
        this.currentUILanguage = 'en'  // Changed to English for screenshots;
        this.supportedLanguages = {
            'ru': 'Russian',
            'en': 'English',
            'de': 'German',
            'es': 'Spanish',
            'fr': 'French',
            'it': 'Italian',
            'pl': 'Polish',
            'ar': 'Arabic',
            'tr': 'Turkish',
            'ro': 'Romanian',
            'sr': 'Serbian',
            'uk': 'Ukrainian',
            'pt': 'Portuguese',
            'sw': 'Swahili'
        };

        this.languageCodes = {
            'Russian': 'ru',
            'English': 'en',
            'German': 'de',
            'Spanish': 'es',
            'French': 'fr',
            'Italian': 'it',
            'Polish': 'pl',
            'Arabic': 'ar',
            'Turkish': 'tr',
            'Romanian': 'ro',
            'Serbian': 'sr',
            'Ukrainian': 'uk',
            'Portuguese': 'pt',
            'Swahili': 'sw'
        };
        
        this.translations = {
            'ru': {
                // App
                'appTitle': 'LexyBooster',

                // Navigation
                'home': 'Главная',
                'import': 'Иmпорт',
                'study': 'Изучение',
                'review': 'Повторение',
                'statistics': 'Статистика',
                'settings': 'Настройки',
                
                // Auth
                'welcome': 'Добро пожаловать!',
                'login': 'Войти',
                'register': 'Регистрация',
                'name': 'Иmя',
                'email': 'Email',
                'password': 'Пароль',
                'confirmPassword': 'Подтвердите пароль',
                'loginWithGoogle': 'Войти через Google',
                'logout': 'Выйти',
                
                // Home
                'studyingWords': 'Изучаеmые слова',
                'reviewWords': 'For Review',
                'learnedWords': 'Learned',
                'quickStudy': 'Быстрое изучение',
                'quickReview': 'Быстрое повторение',
                
                // Study modes
                'selectMode': 'Выберите режиm изучения:',
                'multipleChoice': 'Выбор из вариантов',
                'reverseChoice': 'Обратный выбор',
                'wordBuilding': 'Word Building',
                'typing': 'Ввод с клавиатуры',
                'complexMode': 'Коmплексный режиm',
                
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
                'enterAnswer': 'Введите ответ...',
                'submit': 'Ответить',
                
                // Settings
                'languagePairs': 'Языковые пары',
                'studySettings': 'Настройки обучения',
                'wordsPerLesson': 'Количество слов в уроке:',
                'addLanguagePair': 'Добавить языковую пару',
                'sync': 'Синхронизировать с сервероm',
                'select': 'Выбрать',
                'delete': 'Удалить',
                
                // Import
                'importWords': 'Иmпорт слов',
                'fromCSV': 'From CSV File',
                'fromGoogleSheets': 'From Google Sheets',
                'selectFile': 'Select File',
                'import': 'Иmпорт',
                
                // Language creation dialog
                'studyingLanguage': 'Изучаеmый язык:',
                'nativeLanguage': 'Родной язык:',
                'pairName': 'Название пары:',
                
                // Messages
                'noWords': 'No words',
                'syncComplete': 'Synchronization завершена успешно',
                'syncError': 'Ошибка синхронизации',
                'syncing': 'Synchronization...',

                // Additional UI elements
                'uiLanguage': 'Язык интерфейса',
                'leaderboard': 'Рейтинг',
                'dashboard': 'Панель управления',
                'survivalMode': 'Режиm выживания',
                'startReview': 'Начать повторение',

                // Completion messages
                'quizCompleted': 'Квиз завершен!',
                'reviewCompleted': 'Повторение завершено!',
                'result': 'Результат',

                // Export and sync messages
                'exportingData': 'Экспорт данных...',
                'noDataToSync': 'Нет данных для синхронизации',
                'serverConnectionError': 'Ошибка связи с сервероm. Файл скачан для ручного иmпорта.',
                'syncAndExportError': 'Ошибка синхронизации и создания файла',
                'exportError': 'Ошибка при экспорте данных',
                'noDataToExport': 'No data to export',

                // Feature disabled messages
                'deleteFeatureDisabled': 'Функция удаления вреmенно недоступна',
                'moveFeatureDisabled': 'Функция переmещения вреmенно недоступна',
                'resetFeatureDisabled': 'Функция сброса прогресса вреmенно недоступна',

                // Voice settings
                'voicePlaying': '⏳ Воспроизведение...',
                'voiceTestButton': '🔊 Тест с текущиmи настройкаmи',

                // Word building
                'buildTheWord': 'Составьте слово...'
            },
            
            'en': {
                // App
                'appTitle': 'LexyBooster',

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
                'enterAnswer': 'Enter your answer...',
                'submit': 'Submit',
                
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
                'syncing': 'Syncing...',

                // Additional UI elements
                'uiLanguage': 'UI Language',
                'leaderboard': 'Leaderboard',
                'dashboard': 'Dashboard',
                'survivalMode': 'Survival Mode',
                'startReview': 'Start Review',

                // Completion messages
                'quizCompleted': 'Quiz completed!',
                'reviewCompleted': 'Review completed!',
                'result': 'Result',

                // Export and sync messages
                'exportingData': 'Exporting data...',
                'noDataToSync': 'No data to sync',
                'serverConnectionError': 'Server connection error. File downloaded for manual import.',
                'syncAndExportError': 'Sync and file creation error',
                'exportError': 'Error exporting data',
                'noDataToExport': 'No data to export',

                // Feature disabled messages
                'deleteFeatureDisabled': 'Delete feature temporarily unavailable',
                'moveFeatureDisabled': 'Move feature temporarily unavailable',
                'resetFeatureDisabled': 'Reset feature temporarily unavailable',

                // Voice settings
                'voicePlaying': '⏳ Playing...',
                'voiceTestButton': '🔊 Test with current settings',

                // Word building
                'buildTheWord': 'Build the word...'
            },
            
            'de': {
                // App
                'appTitle': 'LexyBooster',

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
                'syncing': 'Synchronisiere...',

                // Additional UI elements
                'uiLanguage': 'Benutzeroberflächensprache',
                'leaderboard': 'Bestenliste',
                'dashboard': 'Dashboard',
                'survivalMode': 'Überlebensmodus',
                'startReview': 'Wiederholung starten'
            },

            'es': {
                // App
                'appTitle': 'LexyBooster',

                // Navigation
                'home': 'Inicio',
                'import': 'Importar',
                'study': 'Estudiar',
                'review': 'Repasar',
                'statistics': 'Estadísticas',
                'settings': 'Configuración',

                // Auth
                'welcome': '¡Bienvenido!',
                'login': 'Iniciar sesión',
                'register': 'Registrarse',
                'name': 'Nombre',
                'email': 'Correo electrónico',
                'password': 'Contraseña',
                'confirmPassword': 'Confirmar contraseña',
                'loginWithGoogle': 'Iniciar sesión con Google',
                'logout': 'Cerrar sesión',

                // Home
                'studyingWords': 'Palabras en estudio',
                'reviewWords': 'Palabras para repasar',
                'learnedWords': 'Aprendidas',
                'quickStudy': 'Estudio rápido',
                'quickReview': 'Repaso rápido',

                // Study modes
                'selectMode': 'Seleccionar modo de estudio:',
                'multipleChoice': 'Opción múltiple',
                'reverseChoice': 'Opción inversa',
                'wordBuilding': 'Construcción de palabras',
                'typing': 'Escritura',
                'complexMode': 'Modo complejo',

                // Quiz
                'question': 'Pregunta',
                'of': 'de',
                'next': 'Siguiente',
                'finish': 'Terminar',
                'correct': '¡Correcto!',
                'incorrect': 'Incorrecto.',
                'correctAnswer': 'Respuesta correcta:',
                'showAnswer': 'Mostrar respuesta',
                'answer': 'Responder',
                'clear': 'Limpiar',

                // Settings
                'languagePairs': 'Pares de idiomas',
                'studySettings': 'Configuración de estudio',
                'wordsPerLesson': 'Palabras por lección:',
                'addLanguagePair': 'Agregar par de idiomas',
                'sync': 'Sincronizar con servidor',
                'select': 'Seleccionar',
                'delete': 'Eliminar',

                // Import
                'importWords': 'Importar palabras',
                'fromCSV': 'Desde archivo CSV',
                'fromGoogleSheets': 'Desde Google Sheets',
                'selectFile': 'Seleccionar archivo',
                'import': 'Importar',

                // Language creation dialog
                'studyingLanguage': 'Idioma a estudiar:',
                'nativeLanguage': 'Idioma nativo:',
                'pairName': 'Nombre del par:',

                // Messages
                'noWords': 'Sin palabras',
                'syncComplete': 'Sincronización completada exitosamente',
                'syncError': 'Error de sincronización',
                'syncing': 'Sincronizando...',

                // Additional UI elements
                'uiLanguage': 'Idioma de interfaz',
                'leaderboard': 'Tabla de clasificación',
                'dashboard': 'Panel de control',
                'survivalMode': 'Modo supervivencia',
                'startReview': 'Comenzar repaso'
            },

            'fr': {
                // App
                'appTitle': 'LexyBooster',

                // Navigation
                'home': 'Accueil',
                'import': 'Importer',
                'study': 'Étudier',
                'review': 'Réviser',
                'statistics': 'Statistiques',
                'settings': 'Paramètres',

                // Auth
                'welcome': 'Bienvenue !',
                'login': 'Se connecter',
                'register': 'S\'inscrire',
                'name': 'Nom',
                'email': 'Email',
                'password': 'Mot de passe',
                'confirmPassword': 'Confirmer le mot de passe',
                'loginWithGoogle': 'Se connecter avec Google',
                'logout': 'Se déconnecter',

                // Home
                'studyingWords': 'Mots à étudier',
                'reviewWords': 'Mots à réviser',
                'learnedWords': 'Appris',
                'quickStudy': 'Étude rapide',
                'quickReview': 'Révision rapide',

                // Study modes
                'selectMode': 'Sélectionner le mode d\'étude :',
                'multipleChoice': 'Choix multiple',
                'reverseChoice': 'Choix inverse',
                'wordBuilding': 'Construction de mots',
                'typing': 'Saisie',
                'complexMode': 'Mode complexe',

                // Quiz
                'question': 'Question',
                'of': 'de',
                'next': 'Suivant',
                'finish': 'Terminer',
                'correct': 'Correct !',
                'incorrect': 'Incorrect.',
                'correctAnswer': 'Réponse correcte :',
                'showAnswer': 'Afficher la réponse',
                'answer': 'Répondre',
                'clear': 'Effacer',

                // Settings
                'languagePairs': 'Paires de langues',
                'studySettings': 'Paramètres d\'étude',
                'wordsPerLesson': 'Mots par leçon :',
                'addLanguagePair': 'Ajouter une paire de langues',
                'sync': 'Synchroniser avec le serveur',
                'select': 'Sélectionner',
                'delete': 'Supprimer',

                // Import
                'importWords': 'Importer des mots',
                'fromCSV': 'Depuis un fichier CSV',
                'fromGoogleSheets': 'Depuis Google Sheets',
                'selectFile': 'Sélectionner un fichier',
                'import': 'Importer',

                // Language creation dialog
                'studyingLanguage': 'Langue à étudier :',
                'nativeLanguage': 'Langue maternelle :',
                'pairName': 'Nom de la paire :',

                // Messages
                'noWords': 'Aucun mot',
                'syncComplete': 'Synchronisation réussie',
                'syncError': 'Erreur de synchronisation',
                'syncing': 'Synchronisation en cours...',

                // Additional UI elements
                'uiLanguage': 'Langue de l\'interface',
                'leaderboard': 'Classement',
                'dashboard': 'Tableau de bord',
                'survivalMode': 'Mode survie',
                'startReview': 'Commencer la révision'
            },

            'it': {
                // App
                'appTitle': 'LexyBooster',

                // Navigation
                'home': 'Home',
                'import': 'Importa',
                'study': 'Studia',
                'review': 'Ripassa',
                'statistics': 'Statistiche',
                'settings': 'Impostazioni',

                // Auth
                'welcome': 'Benvenuto!',
                'login': 'Accedi',
                'register': 'Registrati',
                'name': 'Nome',
                'email': 'Email',
                'password': 'Password',
                'confirmPassword': 'Conferma password',
                'loginWithGoogle': 'Accedi con Google',
                'logout': 'Esci',

                // Home
                'studyingWords': 'Parole da studiare',
                'reviewWords': 'Parole da ripassare',
                'learnedWords': 'Apprese',
                'quickStudy': 'Studio rapido',
                'quickReview': 'Ripasso rapido',

                // Study modes
                'selectMode': 'Seleziona modalità di studio:',
                'multipleChoice': 'Scelta multipla',
                'reverseChoice': 'Scelta inversa',
                'wordBuilding': 'Costruzione di parole',
                'typing': 'Digitazione',
                'complexMode': 'Modalità complessa',

                // Quiz
                'question': 'Domanda',
                'of': 'di',
                'next': 'Avanti',
                'finish': 'Fine',
                'correct': 'Corretto!',
                'incorrect': 'Sbagliato.',
                'correctAnswer': 'Risposta corretta:',
                'showAnswer': 'Mostra risposta',
                'answer': 'Rispondi',
                'clear': 'Cancella',

                // Settings
                'languagePairs': 'Coppie di lingue',
                'studySettings': 'Impostazioni di studio',
                'wordsPerLesson': 'Parole per lezione:',
                'addLanguagePair': 'Aggiungi coppia di lingue',
                'sync': 'Sincronizza con il server',
                'select': 'Seleziona',
                'delete': 'Elimina',

                // Import
                'importWords': 'Importa parole',
                'fromCSV': 'Da file CSV',
                'fromGoogleSheets': 'Da Google Sheets',
                'selectFile': 'Seleziona file',
                'import': 'Importa',

                // Language creation dialog
                'studyingLanguage': 'Lingua da studiare:',
                'nativeLanguage': 'Lingua madre:',
                'pairName': 'Nome della coppia:',

                // Messages
                'noWords': 'Nessuna parola',
                'syncComplete': 'Sincronizzazione completata con successo',
                'syncError': 'Errore di sincronizzazione',
                'syncing': 'Sincronizzazione in corso...',

                // Additional UI elements
                'uiLanguage': 'Lingua dell\'interfaccia',
                'leaderboard': 'Classifica',
                'dashboard': 'Pannello di controllo',
                'survivalMode': 'Modalità sopravvivenza',
                'startReview': 'Inizia ripasso'
            }
        };
    }
    
    setUILanguage(languageCode) {
        if (this.supportedLanguages[languageCode]) {
            this.currentUILanguage = languageCode;

            // Delegate to new i18n system if available
            if (typeof i18n !== 'undefined' && i18n.setLanguage) {
                i18n.setLanguage(languageCode);
            }

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

        // Sync with new i18n system if available - wait for translations to load
        if (typeof i18n !== 'undefined' && i18n.setLanguage) {
            // Wait for translations to load before setting language
            window.addEventListener('translationsLoaded', () => {
                i18n.setLanguage(this.currentUILanguage);
            }, { once: true });
        }

        // Update UI on load
        setTimeout(() => this.updateUI(), 100);
    }
    
    // Audio language detection for TTS
    getAudioLanguageCode(text, languagePair) {
        if (!languagePair) {
            console.log('⚠️ No language pair, using default en-US');
            return 'en-US'; // Default fallback
        }

        // Convert language codes to full names
        // Database stores: from_lang = 'de', to_lang = 'ru'
        // detectLanguage expects: 'German', 'Russian'
        const studyingLang = this.getLanguageNameFromCode(languagePair.from_lang || languagePair.fromLanguage);
        const nativeLang = this.getLanguageNameFromCode(languagePair.to_lang || languagePair.toLanguage);

        console.log(`🔍 Language detection for "${text}"`);
        console.log(`   Language pair: ${studyingLang} (studying) ↔ ${nativeLang} (native)`);

        // Check if text is in studying language
        const isStudyingLang = this.detectLanguage(text, studyingLang);

        // Check if text is in native language
        const isNativeLang = this.detectLanguage(text, nativeLang);

        let audioCode;

        if (isNativeLang && !isStudyingLang) {
            // Text is clearly in native language - PRIORITY CHECK
            audioCode = this.getAudioCode(nativeLang);
            console.log(`   ✅ Detected NATIVE language → ${audioCode}`);
        } else if (isStudyingLang && !isNativeLang) {
            // Text is clearly in studying language
            audioCode = this.getAudioCode(studyingLang);
            console.log(`   ✅ Detected STUDYING language → ${audioCode}`);
        } else if (studyingLang === nativeLang) {
            // Same language pair (e.g., Spanish → Spanish)
            audioCode = this.getAudioCode(studyingLang);
            console.log(`   ✅ Same language pair → ${audioCode}`);
        } else if (isNativeLang) {
            // Both detected or ambiguous - prefer native language if detected
            audioCode = this.getAudioCode(nativeLang);
            console.log(`   ⚠️ Ambiguous, but native language detected → ${audioCode}`);
        } else {
            // Fallback to studying language
            audioCode = this.getAudioCode(studyingLang);
            console.log(`   ⚠️ Ambiguous, defaulting to STUDYING language → ${audioCode}`);
        }

        return audioCode;
    }

    detectLanguage(text, language) {
        if (!text || !language) return false;

        const lowerText = text.toLowerCase().trim();

        // Language-specific character patterns
        const patterns = {
            'Russian': /[а-яёА-ЯЁ]/,
            'English': /^[a-zA-Z\s\-'.,"!?0-9]+$/, // Pure Latin without accents
            'German': /[äöüßÄÖÜ]/,
            'Spanish': /[ñáéíóúüÑÁÉÍÓÚÜ¿¡]/,
            'French': /[àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/,
            'Italian': /[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/,
            'Portuguese': /[àáâãçéêíóôõúüÀÁÂÃÇÉÊÍÓÔÕÚÜ]/,
            'Chinese': /[\u4e00-\u9fff]/,
            'Japanese': /[\u3040-\u309f\u30a0-\u30ff]/,
            'Korean': /[\uac00-\ud7af]/,
            'Arabic': /[\u0600-\u06ff]/,
            'Polish': /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/,
            'Turkish': /[çğıİöşüÇĞÖŞÜ]/,
            'Romanian': /[ăâîșțĂÂÎȘȚ]/,
            'Serbian': /[а-яёђјљњћџА-ЯЁЂЈЉЊЋЏ]/,
            'Ukrainian': /[а-яґєіїА-ЯҐЄІЇ]/,
            'Swahili': /^[a-zA-Z\s\-'.,"!?0-9]+$/ // Uses Latin alphabet like English
        };

        // Common words dictionary for better detection
        const commonWords = {
            'German': ['der', 'die', 'das', 'ein', 'eine', 'und', 'ist', 'zu', 'mit', 'auf', 'für', 'von', 'dem', 'den', 'sich', 'nicht', 'auch', 'sein', 'werden', 'haben'],
            'Spanish': ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'hacer'],
            'French': ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au', 'pour', 'pas', 'par', 'sur'],
            'Italian': ['il', 'di', 'e', 'la', 'un', 'a', 'per', 'è', 'che', 'in', 'da', 'non', 'con', 'si', 'dei', 'alla', 'delle', 'gli', 'una', 'sono'],
            'Russian': ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'это', 'весь', 'то', 'мочь', 'такой', 'для', 'как', 'но', 'так', 'она'],
            'English': ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
            'Portuguese': ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais']
        };

        // Step 1: Check for language-specific characters
        const pattern = patterns[language];
        if (pattern && pattern.test(text)) {
            return true;
        }

        // Step 2: Check for common words in the language
        const words = commonWords[language];
        if (words) {
            const textWords = lowerText.split(/\s+/);
            // If any word in text matches common words, it's likely this language
            return textWords.some(word => words.includes(word));
        }

        return false;
    }

    // Backward compatibility alias
    detectNativeLanguage(text, nativeLanguage) {
        return this.detectLanguage(text, nativeLanguage);
    }

    // Convert language code to full language name
    // Input: 'de', 'ru', 'en', etc.
    // Output: 'German', 'Russian', 'English', etc.
    getLanguageNameFromCode(code) {
        if (!code) return null;

        const codeToName = {
            'de': 'German',
            'ru': 'Russian',
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'it': 'Italian',
            'pl': 'Polish',
            'pt': 'Portuguese',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'tr': 'Turkish',
            'ro': 'Romanian',
            'sr': 'Serbian',
            'uk': 'Ukrainian',
            'sw': 'Swahili',
            'hi': 'Hindi'
        };

        return codeToName[code.toLowerCase()] || null;
    }

    getAudioCode(language) {
        const audioCodes = {
            'Russian': 'ru-RU',
            'English': 'en-US',
            'German': 'de-DE',
            'Spanish': 'es-ES',
            'French': 'fr-FR',
            'Italian': 'it-IT',
            'Portuguese': 'pt-PT',
            'Chinese': 'zh-CN',
            'Japanese': 'ja-JP',
            'Korean': 'ko-KR',
            'Arabic': 'ar-SA',
            'Polish': 'pl-PL',
            'Turkish': 'tr-TR',
            'Romanian': 'ro-RO',
            'Serbian': 'sr-RS',
            'Ukrainian': 'uk-UA',
            'Swahili': 'sw-KE'
        };

        return audioCodes[language] || 'en-US';
    }
}

const languageManager = new LanguageManager();
