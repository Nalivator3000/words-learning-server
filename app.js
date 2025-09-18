class PushNotificationManager {
    constructor() {
        this.vapidPublicKey = null;
        this.subscription = null;
        this.isSubscribed = false;
        this.swRegistration = null;
    }

    async init(swRegistration) {
        if (!('PushManager' in window)) {
            console.warn('Push messaging is not supported');
            return false;
        }

        this.swRegistration = swRegistration;
        
        // Fetch VAPID public key from server
        try {
            const response = await fetch('/api/push/vapid-public-key');
            const data = await response.json();
            this.vapidPublicKey = data.publicKey;
        } catch (error) {
            console.error('Failed to fetch VAPID public key:', error);
            return false;
        }
        
        // Check current subscription status
        try {
            this.subscription = await swRegistration.pushManager.getSubscription();
            this.isSubscribed = !(this.subscription === null);
            
            if (this.isSubscribed) {
                console.log('User is subscribed to push notifications');
                await this.sendSubscriptionToBackend(this.subscription);
            } else {
                console.log('User is not subscribed to push notifications');
            }
            
            return true;
        } catch (error) {
            console.error('Error during push notification init:', error);
            return false;
        }
    }

    async subscribeUser() {
        if (!this.swRegistration) {
            console.error('Service worker not registered');
            return false;
        }

        try {
            const applicationServerKey = this.urlB64ToUint8Array(this.vapidPublicKey);
            this.subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            console.log('User subscribed to push notifications:', this.subscription);
            this.isSubscribed = true;

            await this.sendSubscriptionToBackend(this.subscription);
            return true;
        } catch (error) {
            console.error('Failed to subscribe user: ', error);
            return false;
        }
    }

    async unsubscribeUser() {
        if (!this.subscription) {
            console.log('No subscription to unsubscribe');
            return true;
        }

        try {
            await this.subscription.unsubscribe();
            await this.removeSubscriptionFromBackend(this.subscription);
            
            this.subscription = null;
            this.isSubscribed = false;
            console.log('User unsubscribed from push notifications');
            return true;
        } catch (error) {
            console.error('Error unsubscribing: ', error);
            return false;
        }
    }

    async sendSubscriptionToBackend(subscription) {
        try {
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                },
                body: JSON.stringify(subscription)
            });

            if (!response.ok) {
                throw new Error('Bad status code from server.');
            }
        } catch (error) {
            console.error('Error sending subscription to backend:', error);
        }
    }

    async removeSubscriptionFromBackend(subscription) {
        try {
            const response = await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                },
                body: JSON.stringify(subscription)
            });

            if (!response.ok) {
                throw new Error('Bad status code from server.');
            }
        } catch (error) {
            console.error('Error removing subscription from backend:', error);
        }
    }

    urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async requestPermission() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted');
            return true;
        } else {
            console.log('Notification permission denied');
            return false;
        }
    }

    async scheduleStudyReminder(hours = 24) {
        if (!this.isSubscribed) {
            console.log('User not subscribed to push notifications');
            return false;
        }

        try {
            await fetch('/api/push/schedule-reminder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                },
                body: JSON.stringify({ hours })
            });
            console.log(`Study reminder scheduled for ${hours} hours`);
            return true;
        } catch (error) {
            console.error('Error scheduling reminder:', error);
            return false;
        }
    }
}

class AudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = {};
        this.initVoices();
    }

    initVoices() {
        const loadVoices = () => {
            const allVoices = this.synth.getVoices();
            
            // Create dynamic voice mapping based on available voices
            this.voices = {};
            
            // Language code mappings for TTS
            const languageMapping = {
                'en': 'en-US',
                'ru': 'ru-RU', 
                'de': 'de-DE',
                'fr': 'fr-FR',
                'es': 'es-ES',
                'it': 'it-IT',
                'pt': 'pt-PT',
                'ja': 'ja-JP',
                'ko': 'ko-KR',
                'zh': 'zh-CN',
                'ar': 'ar-SA',
                'hi': 'hi-IN',
                'tr': 'tr-TR',
                'pl': 'pl-PL',
                'nl': 'nl-NL',
                'sv': 'sv-SE',
                'no': 'no-NO',
                'da': 'da-DK',
                'fi': 'fi-FI',
                'he': 'he-IL',
                'th': 'th-TH',
                'vi': 'vi-VN'
            };
            
            // Map each language to its best available voice
            Object.entries(languageMapping).forEach(([shortCode, fullCode]) => {
                // Try to find exact match first
                let voice = allVoices.find(v => v.lang === fullCode);
                
                // If not found, try language prefix match
                if (!voice) {
                    voice = allVoices.find(v => v.lang.startsWith(shortCode));
                }
                
                // Store with both codes for compatibility
                if (voice) {
                    this.voices[fullCode] = voice;
                    this.voices[shortCode] = voice;
                }
            });
            
            // Fallback to first available voice for any unmapped languages
            const fallbackVoice = allVoices.length > 0 ? allVoices[0] : null;
            Object.values(languageMapping).forEach(code => {
                if (!this.voices[code] && fallbackVoice) {
                    this.voices[code] = fallbackVoice;
                }
            });
        };

        loadVoices();
        
        // Some browsers load voices asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    speak(text, languageCode = null) {
        if (!text.trim()) {
            console.log('AudioManager: Empty text, skipping TTS');
            return;
        }
        
        // Auto-detect language if not provided
        if (!languageCode) {
            const currentPair = userManager ? userManager.getCurrentLanguagePair() : null;
            if (currentPair) {
                // Try to detect language based on current language pair
                // Default to the 'from' language (language being studied)
                const fromCode = currentPair.fromLanguageCode;
                const toCode = currentPair.toLanguageCode;
                
                // Simple text-based detection - you might want to improve this
                languageCode = this.detectLanguage(text, fromCode, toCode) || `${fromCode}-${fromCode.toUpperCase()}`;
            } else {
                languageCode = 'de-DE'; // Default fallback
            }
        }
        
        console.log(`AudioManager: Speaking "${text}" in ${languageCode}`);
        
        // Stop any current speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageCode;
        utterance.rate = 0.8; // Slightly slower for learning
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Use appropriate voice for language
        const voice = this.voices[languageCode];
        if (voice) {
            utterance.voice = voice;
            console.log(`AudioManager: Using voice "${voice.name}" for ${languageCode}`);
        } else {
            console.warn(`AudioManager: No voice found for ${languageCode}, using default`);
        }
        
        // Add error handling
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
        };
        
        utterance.onend = () => {
            console.log('AudioManager: Speech finished');
        };
        
        this.synth.speak(utterance);
    }

    stop() {
        this.synth.cancel();
    }

    // Simple language detection based on character patterns
    detectLanguage(text, fromCode, toCode) {
        const cleanText = text.toLowerCase().trim();
        
        // Character-based detection patterns
        const patterns = {
            'ru': /[а-яё]/,
            'ar': /[\u0600-\u06FF]/,
            'zh': /[\u4e00-\u9fff]/,
            'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/,
            'ko': /[\uac00-\ud7af]/,
            'he': /[\u0590-\u05ff]/,
            'th': /[\u0e00-\u0e7f]/,
            'hi': /[\u0900-\u097f]/
        };
        
        // Check patterns first (more reliable for non-Latin scripts)
        for (const [code, pattern] of Object.entries(patterns)) {
            if (pattern.test(cleanText)) {
                return this.getFullLanguageCode(code);
            }
        }
        
        // For Latin-based languages, prefer the current language pair context
        if (fromCode && toCode) {
            // If text contains typical patterns of the 'from' language, use that
            return this.getFullLanguageCode(fromCode);
        }
        
        return null;
    }
    
    // Convert short language code to full TTS language code
    getFullLanguageCode(shortCode) {
        const mapping = {
            'en': 'en-US',
            'ru': 'ru-RU',
            'de': 'de-DE',
            'fr': 'fr-FR',
            'es': 'es-ES',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'zh': 'zh-CN',
            'ar': 'ar-SA',
            'hi': 'hi-IN',
            'tr': 'tr-TR',
            'pl': 'pl-PL',
            'nl': 'nl-NL',
            'sv': 'sv-SE',
            'no': 'no-NO',
            'da': 'da-DK',
            'fi': 'fi-FI',
            'he': 'he-IL',
            'th': 'th-TH',
            'vi': 'vi-VN'
        };
        
        return mapping[shortCode] || shortCode;
    }
    
    // Check if TTS is available
    isAvailable() {
        return 'speechSynthesis' in window;
    }
    
    // Get available voices for debugging
    getAvailableVoices() {
        return this.synth.getVoices().map(voice => ({
            name: voice.name,
            lang: voice.lang,
            localService: voice.localService
        }));
    }
}

class LanguageLearningApp {
    constructor() {
        console.log('🏗️ Initializing LanguageLearningApp...');
        
        try {
            this.currentSection = 'home';
            this.currentQuizData = null;
            this.audioManager = new AudioManager();
            this.pushManager = new PushNotificationManager();
            
            // Initialize survival mode safely
            if (typeof SurvivalMode !== 'undefined') {
                this.survivalMode = new SurvivalMode(this);
                console.log('✅ Survival mode initialized');
            } else {
                console.warn('⚠️ SurvivalMode class not available');
                this.survivalMode = null;
            }
            
            this.init();
            console.log('✅ LanguageLearningApp initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing LanguageLearningApp:', error);
            throw error; // Re-throw so emergency login can catch it
        }
    }

    verifyDOMElements() {
        const criticalElements = [
            'loginBtn', 'registerBtn', 'loginEmail', 'loginPassword',
            'homeBtn', 'studyBtn', 'reviewBtn', 'statsBtn'
        ];

        const missing = [];
        for (const id of criticalElements) {
            if (!document.getElementById(id)) {
                missing.push(id);
            }
        }

        if (missing.length > 0) {
            console.error('❌ Missing critical DOM elements:', missing);
            alert('Ошибка загрузки интерфейса. Перезагрузите страницу.');
            return false;
        }

        console.log('✅ All critical DOM elements found');
        return true;
    }

    async init() {
        try {
            console.log('🔧 Initializing app components...');
            
            // Verify DOM elements exist
            this.verifyDOMElements();
            
            // Initialize PostgreSQL database connection
            console.log('🌐 Initializing PostgreSQL database connection...');
            await this.initExternalDatabase();
            
            // Check if we have database connection
            if (!window.externalDatabase) {
                this.showServerConnectionError();
                return;
            }
            
            // Set external database as the primary database
            window.database = window.externalDatabase;
            console.log('✅ Using PostgreSQL as primary database');
            
            
            // Initialize language management
            languageManager.init();
            
            // Initialize user management
            const isLoggedIn = await userManager.init();

            // Initialize push notifications if user is logged in
            if (isLoggedIn && 'serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await this.pushManager.init(registration);
                    console.log('✅ Push notifications initialized');
                } catch (error) {
                    console.warn('⚠️ Push notifications initialization failed:', error);
                }
            }
            
            console.log('🔌 Setting up event listeners...');
            this.setupEventListeners();
            this.setupAuthListeners();
            this.setupLanguageListeners();
            this.setupThemeToggle();
            this.survivalMode.setupEventListeners();
            
            if (isLoggedIn) {
                this.showSection('home');
                await this.updateStats();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Ошибка инициализации приложения');
        }
    }

    async initExternalDatabase() {
        if (!window.externalDatabase) {
            throw new Error('External database module not loaded. Check external-database.js');
        }

        console.log('🔗 Checking external database connection...');
        console.log(`📡 API URL: ${window.externalDatabase.baseUrl}`);
        
        // Test if external database is available
        try {
            const isAvailable = await window.externalDatabase.isAvailable();
            console.log(`🌐 Server availability check: ${isAvailable}`);
            
            if (!isAvailable) {
                // Try alternative connection methods
                console.log('⚠️ Primary connection failed, trying direct health check...');
                try {
                    const response = await fetch(`${window.externalDatabase.baseUrl}/health`);
                    if (response.ok) {
                        console.log('✅ Direct health check successful');
                    } else {
                        throw new Error(`Health check returned: ${response.status} ${response.statusText}`);
                    }
                } catch (directError) {
                    console.error('❌ Direct health check failed:', directError);
                    throw new Error(`PostgreSQL server not accessible at: ${window.externalDatabase.baseUrl}. Please start the server with 'node server-postgres.js'`);
                }
            }
        } catch (error) {
            console.error('❌ Database availability check error:', error);
            throw error;
        }

        // Initialize external database
        await window.externalDatabase.init();
        console.log('✅ External database initialized successfully');

        // Show login modal - no automatic authentication
        console.log('🔐 User authentication required');
    }

    setupEventListeners() {
        // Global keydown handler for quiz navigation and shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (this.currentSection === 'study' || this.currentSection === 'review')) {
                this.handleGlobalEnterPress(e);
            } else if (['1', '2', '3', '4'].includes(e.key) && (this.currentSection === 'study' || this.currentSection === 'review')) {
                this.handleNumberKeyPress(e);
            }
        });

        // Navigation
        document.getElementById('homeBtn').addEventListener('click', () => this.showSection('home'));
        document.getElementById('importBtn').addEventListener('click', () => this.showSection('import'));
        document.getElementById('studyBtn').addEventListener('click', () => this.showSection('study'));
        document.getElementById('reviewBtn').addEventListener('click', () => this.showSection('review'));
        document.getElementById('statsBtn').addEventListener('click', () => this.showSection('stats'));
        
        // User menu
        document.getElementById('userMenuBtn').addEventListener('click', () => this.toggleUserMenu());
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSection('settings');
            this.hideUserMenu();
        });
        document.getElementById('logoutBtn').addEventListener('click', () => {
            userManager.logout();
            this.hideUserMenu();
        });

        // Quick actions
        document.getElementById('quickStudyBtn').addEventListener('click', () => this.quickStart('study'));
        document.getElementById('quickReviewBtn').addEventListener('click', () => this.quickStart('review'));

        // Import functionality
        document.getElementById('csvImportBtn').addEventListener('click', () => {
            document.getElementById('csvInput').click();
        });
        document.getElementById('csvInput').addEventListener('change', (e) => this.handleCSVImport(e));
        document.getElementById('googleImportBtn').addEventListener('click', () => this.handleGoogleSheetsImport());

        // Database management functionality
        document.getElementById('importGermanBtn').addEventListener('click', () => this.handleImportGerman());
        document.getElementById('checkWordCountBtn').addEventListener('click', () => this.handleCheckWordCount());
        document.getElementById('clearDatabaseBtn').addEventListener('click', () => this.handleClearDatabase());
        

        // Study mode
        document.getElementById('multipleChoiceBtn').addEventListener('click', () => this.startStudyQuiz('multiple'));
        document.getElementById('reverseMultipleChoiceBtn').addEventListener('click', () => this.startStudyQuiz('reverse_multiple'));
        document.getElementById('wordBuildingBtn').addEventListener('click', () => this.startStudyQuiz('word_building'));
        document.getElementById('typingBtn').addEventListener('click', () => this.startStudyQuiz('typing'));
        document.getElementById('survivalBtn').addEventListener('click', () => this.startSurvivalMode());
        document.getElementById('complexModeBtn').addEventListener('click', () => this.startStudyQuiz('complex'));

        // Review mode
        document.getElementById('startReviewBtn').addEventListener('click', () => this.startReviewQuiz());

        // Quiz navigation
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('finishStudyBtn').addEventListener('click', () => this.finishQuiz());
        document.getElementById('reviewNextBtn').addEventListener('click', () => this.nextReviewQuestion());
        document.getElementById('finishReviewBtn').addEventListener('click', () => this.finishReview());

        // Export functionality
        document.getElementById('exportStudyingBtn').addEventListener('click', () => this.exportWords('studying'));
        document.getElementById('exportReviewBtn').addEventListener('click', () => this.exportWords('review'));
        document.getElementById('exportLearnedBtn').addEventListener('click', () => this.exportWords('learned'));
        document.getElementById('exportAllBtn').addEventListener('click', () => this.exportWords());
        
        // Image functionality
        document.getElementById('fetchImagesBtn').addEventListener('click', () => this.startImageFetching());
        document.getElementById('imageStatsBtn').addEventListener('click', () => this.showImageStats());
        
        // Settings functionality
        const addLanguagePairBtn = document.getElementById('addLanguagePairBtn');
        if (addLanguagePairBtn) addLanguagePairBtn.addEventListener('click', () => this.showLanguagePairDialog());
        
        const lessonSizeInput = document.getElementById('lessonSizeInput');
        if (lessonSizeInput) lessonSizeInput.addEventListener('change', (e) => this.updateLessonSize(e.target.value));
        
        const saveLessonSizeBtn = document.getElementById('saveLessonSizeBtn');
        if (saveLessonSizeBtn) saveLessonSizeBtn.addEventListener('click', () => this.saveLessonSize());
        
        const editWordsBtn = document.getElementById('editWordsBtn');
        if (editWordsBtn) editWordsBtn.addEventListener('click', () => this.toggleWordEditor());
        
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) syncBtn.addEventListener('click', () => this.syncWithServer());
        
        // Leaderboard buttons
        document.getElementById('showLeaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('showMyBestBtn').addEventListener('click', () => this.showMyBestResults());
    }

    setupAuthListeners() {
        // Auth tab switching
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        if (loginTab) loginTab.addEventListener('click', () => this.switchAuthTab('login'));
        if (registerTab) registerTab.addEventListener('click', () => this.switchAuthTab('register'));
        
        // Auth form submissions
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        
        if (loginBtn) loginBtn.addEventListener('click', () => this.handleLogin());
        if (registerBtn) registerBtn.addEventListener('click', () => this.handleRegister());
        if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
        
        // Enter key support for auth forms
        const loginPassword = document.getElementById('loginPassword');
        const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
        
        if (loginPassword) {
            loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
        
        if (registerPasswordConfirm) {
            registerPasswordConfirm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleRegister();
            });
        }
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.getElementById(`${tab}Tab`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
        
        // Clear error message
        document.getElementById('authError').textContent = '';
    }

    async handleLogin() {
        console.log('🔐 Login button clicked!');
        
        const emailEl = document.getElementById('loginEmail');
        const passwordEl = document.getElementById('loginPassword');
        
        if (!emailEl || !passwordEl) {
            console.error('Login elements not found!');
            this.showAuthError('Ошибка интерфейса. Перезагрузите страницу.');
            return;
        }
        
        const email = emailEl.value;
        const password = passwordEl.value;
        
        console.log(`Attempting login with email: ${email}`);
        
        if (!email || !password) {
            console.log('Empty email or password');
            this.showAuthError('Пожалуйста, заполните все поля');
            return;
        }
        
        try {
            console.log('Calling userManager.login...');
            await userManager.login(email, password);
            console.log('Login successful!');
            this.showSection('home');
            await this.updateStats();
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthError(error.message);
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerPasswordConfirm').value;
        
        if (!name || !email || !password || !confirmPassword) {
            this.showAuthError('Пожалуйста, заполните все поля');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showAuthError('Пароли не совпадают');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthError('Пароль должен быть не менее 6 символов');
            return;
        }
        
        try {
            await userManager.register(name, email, password);
            this.showSection('home');
            await this.updateStats();
        } catch (error) {
            this.showAuthError(error.message);
        }
    }

    async handleGoogleLogin() {
        try {
            await userManager.loginWithGoogle();
            this.showSection('home');
            await this.updateStats();
        } catch (error) {
            this.showAuthError(error.message);
        }
    }

    showAuthError(message) {
        document.getElementById('authError').textContent = message;
    }

    setupLanguageListeners() {
        // UI Language selector
        document.getElementById('uiLanguageSelect').addEventListener('change', (e) => {
            languageManager.setUILanguage(e.target.value);
        });
        
        // Set current UI language in selector
        document.getElementById('uiLanguageSelect').value = languageManager.getUILanguage();
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        themeToggle.checked = savedTheme === 'dark';
        
        // Listen for theme toggle changes
        themeToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        
        // Save theme preference
        localStorage.setItem('theme', theme);
        
        console.log(`🎨 Theme set to: ${theme}`);
    }

    toggleUserMenu() {
        const menu = document.getElementById('userMenu');
        menu.classList.toggle('hidden');
    }

    hideUserMenu() {
        document.getElementById('userMenu').classList.add('hidden');
    }

    async showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${sectionName}Btn`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(`${sectionName}Section`).classList.add('active');

        this.currentSection = sectionName;

        // Update data for specific sections
        if (sectionName === 'home') {
            await this.updateStats();
        } else if (sectionName === 'review') {
            await this.updateReviewStats();
        } else if (sectionName === 'stats') {
            await this.updateStatsPage();
        } else if (sectionName === 'settings') {
            await this.updateSettingsPage();
        } else if (sectionName === 'import') {
            this.updateImportSection();
        }

        // Reset quiz states
        this.resetQuizInterface();
    }

    async updateStats() {
        try {
            const counts = await database.getWordCounts();
            document.getElementById('studyingCount').textContent = counts.studying;
            document.getElementById('reviewCount').textContent = counts.review;
            document.getElementById('learnedCount').textContent = counts.learned;

            // Enable/disable quick action buttons
            document.getElementById('quickStudyBtn').disabled = counts.studying === 0;
            document.getElementById('quickReviewBtn').disabled = counts.review === 0;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async updateReviewStats() {
        try {
            const counts = await database.getWordCounts();
            document.getElementById('review7Count').textContent = counts.review7;
            document.getElementById('review30Count').textContent = counts.review30;

            document.getElementById('startReviewBtn').disabled = counts.review === 0;
        } catch (error) {
            console.error('Error updating review stats:', error);
        }
    }

    async updateStatsPage() {
        try {
            const counts = await database.getWordCounts();
            
            // Update counts
            document.getElementById('studyingListCount').textContent = counts.studying;
            document.getElementById('reviewListCount').textContent = counts.review;
            document.getElementById('learnedListCount').textContent = counts.learned;

            // Update word lists
            await this.updateWordLists();
        } catch (error) {
            console.error('Error updating stats page:', error);
        }
    }

    async updateWordLists() {
        try {
            const [studying, review7, review30, learned] = await Promise.all([
                database.getWordsByStatus('studying'),
                database.getWordsByStatus('review_7'),
                database.getWordsByStatus('review_30'),
                database.getWordsByStatus('learned')
            ]);

            this.renderWordList('studyingList', studying);
            this.renderWordList('reviewList', [...review7, ...review30]);
            this.renderWordList('learnedList', learned);
        } catch (error) {
            console.error('Error updating word lists:', error);
        }
    }

    renderWordList(containerId, words) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (words.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">Нет слов</p>';
            return;
        }

        words.forEach(word => {
            const item = document.createElement('div');
            item.className = 'word-item';
            item.style.position = 'relative';
            item.style.padding = '10px';
            item.style.border = '1px solid #e0e0e0';
            item.style.borderRadius = '5px';
            item.style.marginBottom = '5px';
            item.style.backgroundColor = '#f9f9f9';
            
            // Content container
            const contentDiv = document.createElement('div');
            contentDiv.className = 'word-content';
            contentDiv.style.display = 'flex';
            contentDiv.style.flexDirection = 'column';
            contentDiv.style.gap = '5px';
            
            // Word with audio button only if it's German
            const wordDiv = document.createElement('div');
            wordDiv.className = 'word';
            wordDiv.style.display = 'flex';
            wordDiv.style.alignItems = 'center';
            wordDiv.style.gap = '10px';
            wordDiv.innerHTML = `<strong>${word.word}</strong>`;
            if (this.shouldShowAudioButton(word.word)) {
                wordDiv.appendChild(this.createAudioButton(word.word, 'audio-btn-small'));
            }
            
            // Translation (no audio)
            const translationDiv = document.createElement('div');
            translationDiv.className = 'translation';
            translationDiv.style.color = '#333';
            translationDiv.textContent = word.translation;
            
            // Example with audio only if it's German, translation without audio
            const exampleDiv = document.createElement('div');
            exampleDiv.className = 'example';
            exampleDiv.style.display = 'flex';
            exampleDiv.style.alignItems = 'center';
            exampleDiv.style.gap = '10px';
            exampleDiv.style.fontSize = '0.9em';
            exampleDiv.style.color = '#666';
            if (word.example) {
                exampleDiv.innerHTML = `<span><em>${word.example}</em></span>`;
                if (this.shouldShowAudioButton(word.example)) {
                    exampleDiv.appendChild(this.createAudioButton(word.example, 'audio-btn-small'));
                }
                if (word.exampleTranslation) {
                    exampleDiv.innerHTML += ` <span style="color: #999;"> - ${word.exampleTranslation}</span>`;
                }
            }
            
            // Actions container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'word-actions';
            actionsDiv.style.position = 'absolute';
            actionsDiv.style.top = '5px';
            actionsDiv.style.right = '5px';
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '3px';
            actionsDiv.style.opacity = '0.7';
            
            // Move to studying button
            if (word.status !== 'studying') {
                const studyingBtn = document.createElement('button');
                studyingBtn.className = 'word-action-btn';
                studyingBtn.innerHTML = '📚';
                studyingBtn.title = 'Перевести в изучаемые';
                studyingBtn.style.cssText = 'background: #4CAF50; color: white; border: none; border-radius: 3px; padding: 3px 6px; font-size: 12px; cursor: pointer;';
                studyingBtn.onclick = () => this.moveWordToStatus(word.id, 'studying');
                actionsDiv.appendChild(studyingBtn);
            }
            
            // Move to review button  
            if (word.status !== 'review_7' && word.status !== 'review_30') {
                const reviewBtn = document.createElement('button');
                reviewBtn.className = 'word-action-btn';
                reviewBtn.innerHTML = '🔄';
                reviewBtn.title = 'Перевести на повторение';
                reviewBtn.style.cssText = 'background: #2196F3; color: white; border: none; border-radius: 3px; padding: 3px 6px; font-size: 12px; cursor: pointer;';
                reviewBtn.onclick = () => this.moveWordToStatus(word.id, 'review_7');
                actionsDiv.appendChild(reviewBtn);
            }
            
            // Move to learned button
            if (word.status !== 'learned') {
                const learnedBtn = document.createElement('button');
                learnedBtn.className = 'word-action-btn';
                learnedBtn.innerHTML = '✅';
                learnedBtn.title = 'Отметить как изученное';
                learnedBtn.style.cssText = 'background: #009688; color: white; border: none; border-radius: 3px; padding: 3px 6px; font-size: 12px; cursor: pointer;';
                learnedBtn.onclick = () => this.moveWordToStatus(word.id, 'learned');
                actionsDiv.appendChild(learnedBtn);
            }
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'word-action-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Удалить слово';
            deleteBtn.style.cssText = 'background: #f44336; color: white; border: none; border-radius: 3px; padding: 3px 6px; font-size: 12px; cursor: pointer;';
            deleteBtn.onclick = () => this.deleteWord(word.id, word.word);
            actionsDiv.appendChild(deleteBtn);
            
            contentDiv.appendChild(wordDiv);
            contentDiv.appendChild(translationDiv);
            contentDiv.appendChild(exampleDiv);
            
            item.appendChild(contentDiv);
            item.appendChild(actionsDiv);
            container.appendChild(item);
        });
    }

    async moveWordToStatus(wordId, newStatus) {
        try {
            if (window.externalDatabase) {
                // Call API to update word status
                const response = await fetch(`${window.externalDatabase.baseUrl}/words/${wordId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${window.externalDatabase.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Refresh word lists and stats
                await Promise.all([
                    this.updateWordLists(),
                    this.updateStats()
                ]);
                
                this.showNotification(`Слово переведено в категорию "${this.getStatusDisplayName(newStatus)}"`, 'success', 2000);
            } else {
                throw new Error('Database connection not available');
            }
        } catch (error) {
            console.error('Error moving word:', error);
            this.showNotification(`Ошибка перемещения слова: ${error.message}`, 'error', 3000);
        }
    }

    async deleteWord(wordId, wordText) {
        const confirmed = confirm(`Вы уверены, что хотите удалить слово "${wordText}"?\n\nЭто действие нельзя отменить.`);
        if (!confirmed) return;

        try {
            if (window.externalDatabase) {
                // Call API to delete word
                const response = await fetch(`${window.externalDatabase.baseUrl}/words/${wordId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${window.externalDatabase.token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Refresh word lists and stats
                await Promise.all([
                    this.updateWordLists(),
                    this.updateStats()
                ]);
                
                this.showNotification(`Слово "${wordText}" удалено`, 'success', 2000);
            } else {
                throw new Error('Database connection not available');
            }
        } catch (error) {
            console.error('Error deleting word:', error);
            this.showNotification(`Ошибка удаления слова: ${error.message}`, 'error', 3000);
        }
    }

    getStatusDisplayName(status) {
        switch (status) {
            case 'studying': return 'изучаемые';
            case 'review_7': 
            case 'review_30': return 'повторение';
            case 'learned': return 'изученные';
            default: return status;
        }
    }

    async quickStart(mode) {
        this.showSection(mode);
        if (mode === 'study') {
            await this.startStudyQuiz('multiple');
        } else {
            await this.startReviewQuiz();
        }
    }

    async handleCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.showImportStatus('Читаем CSV файл...', 'info');
            
            if (!window.database) {
                this.showImportStatus('❌ База данных недоступна. Пожалуйста, войдите в систему.', 'error');
                return;
            }

            const text = await file.text();
            console.log('CSV file content length:', text.length);
            
            const words = ImportManager.parseCSV(text);
            console.log('Parsed words:', words.length);
            
            if (words.length === 0) {
                this.showImportStatus('Файл не содержит корректных данных. Убедитесь, что файл имеет колонки: Слово, Пример, Перевод, Перевод примера', 'error');
                return;
            }

            this.showImportStatus(`Добавляем ${words.length} слов в базу данных...`, 'info');
            await window.database.addWords(words);
            this.showImportStatus(`✅ Успешно импортировано ${words.length} слов`, 'success');
            await this.updateStats();
            
        } catch (error) {
            console.error('CSV Import Error:', error);
            this.showImportStatus(`❌ Ошибка при импорте CSV файла: ${error.message}`, 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    async handleGoogleSheetsImport() {
        const url = document.getElementById('googleSheetsUrl').value.trim();
        if (!url) {
            this.showImportStatus('Введите ссылку на Google Таблицы', 'error');
            return;
        }

        try {
            this.showImportStatus('Проверяем подключение к базе данных...', 'info');
            
            if (!window.database) {
                this.showImportStatus('❌ База данных недоступна. Пожалуйста, войдите в систему.', 'error');
                return;
            }

            this.showImportStatus('Загружаем данные из Google Таблиц...', 'info');
            console.log('Fetching Google Sheets:', url);
            
            const words = await ImportManager.fetchGoogleSheets(url);
            console.log('Google Sheets words parsed:', words.length);
            
            if (words.length === 0) {
                this.showImportStatus('Таблица не содержит корректных данных. Убедитесь, что таблица публично доступна и имеет колонки: Слово, Пример, Перевод, Перевод примера', 'error');
                return;
            }

            this.showImportStatus(`Добавляем ${words.length} слов в базу данных...`, 'info');
            await window.database.addWords(words);
            this.showImportStatus(`✅ Успешно импортировано ${words.length} слов из Google Таблиц`, 'success');
            await this.updateStats();
            
            // Clear input
            document.getElementById('googleSheetsUrl').value = '';
            
        } catch (error) {
            console.error('Google Sheets Import Error:', error);
            this.showImportStatus(`❌ ${error.message}`, 'error');
        }
    }

    showImportStatus(message, type) {
        const statusEl = document.getElementById('importStatus');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
    }

    async startStudyQuiz(quizType) {
        try {
            const lessonSize = userManager.getLessonSize();
            this.currentQuizData = await quizManager.startQuiz('study', quizType, lessonSize);
            this.showQuizInterface();
            this.renderQuestion(this.currentQuizData);
        } catch (error) {
            console.error('Error starting study quiz:', error);
            alert(error.message);
        }
    }

    async startReviewQuiz() {
        try {
            // Alternate between multiple choice and typing for review
            const quizType = Math.random() > 0.5 ? 'multiple' : 'typing';
            const lessonSize = userManager.getLessonSize();
            this.currentQuizData = await quizManager.startQuiz('review', quizType, lessonSize);
            this.showReviewInterface();
            this.renderReviewQuestion(this.currentQuizData);
        } catch (error) {
            console.error('Error starting review quiz:', error);
            alert(error.message);
        }
    }

    showQuizInterface() {
        document.getElementById('studyModeSelect').style.display = 'none';
        document.getElementById('quizArea').classList.remove('hidden');
        this.activateMobileExerciseMode();
    }

    showReviewInterface() {
        document.getElementById('reviewModeSelect').style.display = 'none';
        document.getElementById('reviewQuizArea').classList.remove('hidden');
        this.activateMobileExerciseMode();
    }

    renderQuestion(quizData) {
        const { question, questionNumber, totalQuestions, progress } = quizData;
        
        document.getElementById('questionCounter').textContent = `Вопрос ${questionNumber} из ${totalQuestions}`;
        document.getElementById('progressFill').style.width = `${progress}%`;
        
        const questionTextEl = document.getElementById('questionText');
        
        // Create image element if available
        const imageHtml = question.imageUrl ? 
            `<div class="question-image-container" style="text-align: center; margin-bottom: 15px;">
                <img src="${question.imageUrl}" alt="${question.questionText}" 
                     style="max-width: 200px; max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"
                     onerror="this.style.display='none'">
            </div>` : '';
        
        questionTextEl.innerHTML = `
            ${imageHtml}
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <strong>${question.questionText}</strong>
                ${question.points !== undefined && question.status === 'studying' ? 
                    `<span class="word-points">⭐ ${question.points || 0}/50</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <small style="color: #6c757d; font-style: italic;">${question.example}</small>
            </div>
        `;
        
        // Add audio buttons only for foreign text using language detection
        // But NOT for multiple choice questions where user needs to pick from options
        if (this.shouldShowAudioButton(question.questionText) && question.type !== 'multiple') {
            const questionAudioBtn = this.createAudioButton(question.questionText);
            questionTextEl.querySelector('div:first-child').appendChild(questionAudioBtn);
        }
        
        if (question.example && this.shouldShowAudioButton(question.example)) {
            const exampleAudioBtn = this.createAudioButton(question.example);
            questionTextEl.querySelector('div:last-child').appendChild(exampleAudioBtn);
        }

        const answerArea = document.getElementById('answerArea');
        answerArea.innerHTML = '';

        if (question.type === 'multiple' || question.type === 'reverse_multiple') {
            question.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'choice-btn';
                button.dataset.choiceIndex = index;
                button.innerHTML = `<span class="choice-number">${index + 1}</span> ${choice.text}`;
                button.onclick = () => this.handleMultipleChoice(choice.text, button);
                answerArea.appendChild(button);
            });
        } else if (question.type === 'word_building') {
            this.renderWordBuildingInterface(question, answerArea);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.placeholder = 'Введите ответ...';
            input.dataset.enterPressed = 'false';
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.handleEnterPress(input);
                }
            };
            answerArea.appendChild(input);
            input.focus();

            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '1rem';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '1rem';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.flexWrap = 'wrap';

            const submitBtn = document.createElement('button');
            submitBtn.className = 'action-btn';
            submitBtn.textContent = 'Ответить';
            submitBtn.onclick = () => this.handleTypingAnswer(input.value, input);
            buttonContainer.appendChild(submitBtn);

            const showAnswerBtn = document.createElement('button');
            showAnswerBtn.className = 'action-btn show-answer-btn';
            showAnswerBtn.textContent = 'Показать ответ';
            showAnswerBtn.onclick = () => this.showAnswer(input);
            buttonContainer.appendChild(showAnswerBtn);

            answerArea.appendChild(buttonContainer);
        }

        // Clear feedback area
        document.getElementById('feedback').innerHTML = '';
        document.getElementById('feedback').className = 'feedback';
        document.getElementById('nextBtn').classList.add('hidden');
        document.getElementById('finishStudyBtn').classList.add('hidden');
    }

    renderReviewQuestion(quizData) {
        const { question, questionNumber, totalQuestions, progress } = quizData;
        
        document.getElementById('reviewQuestionCounter').textContent = `Вопрос ${questionNumber} из ${totalQuestions}`;
        document.getElementById('reviewProgressFill').style.width = `${progress}%`;
        
        const questionTextEl = document.getElementById('reviewQuestionText');
        
        // Create image element if available
        const imageHtml = question.imageUrl ? 
            `<div class="question-image-container" style="text-align: center; margin-bottom: 15px;">
                <img src="${question.imageUrl}" alt="${question.questionText}" 
                     style="max-width: 200px; max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"
                     onerror="this.style.display='none'">
            </div>` : '';
        
        questionTextEl.innerHTML = `
            ${imageHtml}
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <strong>${question.questionText}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <small style="color: #6c757d; font-style: italic;">${question.example}</small>
            </div>
        `;
        
        // Add audio buttons only for German text using language detection
        // But NOT for multiple choice questions where user needs to pick from options
        if (this.isGermanText(question.questionText) && question.type !== 'multiple') {
            const questionAudioBtn = this.createAudioButton(question.questionText);
            questionTextEl.querySelector('div:first-child').appendChild(questionAudioBtn);
        }
        
        if (question.example && this.isGermanText(question.example)) {
            const exampleAudioBtn = this.createAudioButton(question.example);
            questionTextEl.querySelector('div:last-child').appendChild(exampleAudioBtn);
        }

        const answerArea = document.getElementById('reviewAnswerArea');
        answerArea.innerHTML = '';

        if (question.type === 'multiple') {
            question.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'choice-btn';
                button.dataset.choiceIndex = index;
                button.innerHTML = `<span class="choice-number">${index + 1}</span> ${choice.text}`;
                button.onclick = () => this.handleReviewMultipleChoice(choice.text, button);
                answerArea.appendChild(button);
            });
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.placeholder = 'Введите ответ...';
            input.dataset.enterPressed = 'false';
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.handleReviewEnterPress(input);
                }
            };
            answerArea.appendChild(input);
            input.focus();

            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '1rem';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '1rem';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.flexWrap = 'wrap';

            const submitBtn = document.createElement('button');
            submitBtn.className = 'action-btn';
            submitBtn.textContent = 'Ответить';
            submitBtn.onclick = () => this.handleReviewTypingAnswer(input.value, input);
            buttonContainer.appendChild(submitBtn);

            const showAnswerBtn = document.createElement('button');
            showAnswerBtn.className = 'action-btn show-answer-btn';
            showAnswerBtn.textContent = 'Показать ответ';
            showAnswerBtn.onclick = () => this.showReviewAnswer(input);
            buttonContainer.appendChild(showAnswerBtn);

            answerArea.appendChild(buttonContainer);
        }

        // Clear feedback area
        document.getElementById('reviewFeedback').innerHTML = '';
        document.getElementById('reviewFeedback').className = 'feedback';
        document.getElementById('reviewNextBtn').classList.add('hidden');
        document.getElementById('finishReviewBtn').classList.add('hidden');
    }

    async handleMultipleChoice(answer, buttonEl) {
        try {
            const result = await quizManager.checkAnswer(answer);
            this.showAnswerFeedback(result, 'feedback');
            this.disableChoiceButtons();
        
            if (result.correct) {
            buttonEl.classList.add('correct');
            // Add audio button to correct answer if it's foreign language
            if (this.shouldShowAudioButton(answer)) {
                this.addAudioToButton(buttonEl, answer);
            }
        } else {
            buttonEl.classList.add('incorrect');
            // Highlight correct answer and add audio if foreign language
            document.querySelectorAll('.choice-btn').forEach(btn => {
                const btnText = btn.textContent.replace(/^\d+\.\s*/, ''); // Remove number prefix
                if (btnText === result.correctAnswer) {
                    btn.classList.add('correct');
                    if (this.shouldShowAudioButton(result.correctAnswer)) {
                        this.addAudioToButton(btn, result.correctAnswer);
                    }
                }
            });
            }

            this.showNextButton();
        } catch (error) {
            console.error('Error in handleMultipleChoice:', error);
        }
    }

    async handleTypingAnswer(answer, inputEl) {
        if (!answer.trim()) return;
        
        const result = await quizManager.checkAnswer(answer);
        this.showAnswerFeedback(result, 'feedback');
        
        if (result.correct) {
            inputEl.classList.add('correct');
        } else if (result.partiallyCorrect) {
            inputEl.classList.add('partial');
        } else {
            inputEl.classList.add('incorrect');
        }
        
        // Audio button will be added in feedback, no need for duplicate button here
        
        inputEl.disabled = true;
        // Disable all buttons in the container
        const buttonContainer = inputEl.parentElement.querySelector('div');
        if (buttonContainer) {
            buttonContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }
        this.showNextButton();
    }

    async handleReviewMultipleChoice(answer, buttonEl) {
        const result = await quizManager.checkAnswer(answer);
        this.showAnswerFeedback(result, 'reviewFeedback');
        this.disableReviewChoiceButtons();
        
        if (result.correct) {
            buttonEl.classList.add('correct');
            // Add audio button to correct answer if it's foreign language
            if (this.shouldShowAudioButton(answer)) {
                this.addAudioToButton(buttonEl, answer);
            }
        } else {
            buttonEl.classList.add('incorrect');
            document.querySelectorAll('#reviewAnswerArea .choice-btn').forEach(btn => {
                const btnText = btn.textContent.replace(/^\d+\.\s*/, ''); // Remove number prefix
                if (btnText === result.correctAnswer) {
                    btn.classList.add('correct');
                    if (this.shouldShowAudioButton(result.correctAnswer)) {
                        this.addAudioToButton(btn, result.correctAnswer);
                    }
                }
            });
        }

        this.showReviewNextButton();
    }

    async handleReviewTypingAnswer(answer, inputEl) {
        if (!answer.trim()) return;
        
        const result = await quizManager.checkAnswer(answer);
        this.showAnswerFeedback(result, 'reviewFeedback');
        
        if (result.correct) {
            inputEl.classList.add('correct');
        } else if (result.partiallyCorrect) {
            inputEl.classList.add('partial');
        } else {
            inputEl.classList.add('incorrect');
        }
        
        // Audio button will be added in feedback, no need for duplicate button here
        
        inputEl.disabled = true;
        // Disable all buttons in the container
        const buttonContainer = inputEl.parentElement.querySelector('div');
        if (buttonContainer) {
            buttonContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }
        this.showReviewNextButton();
    }

    showAnswerFeedback(result, feedbackId) {
        const feedbackEl = document.getElementById(feedbackId);
        feedbackEl.innerHTML = ''; // Clear previous content
        
        // Create feedback text element
        const feedbackText = document.createElement('span');
        feedbackText.textContent = result.feedback;
        feedbackEl.appendChild(feedbackText);
        
        // Add audio button only if we have German correct answer
        let textToSpeak = null;
        
        // Only add audio if we have correctAnswer and it's foreign language
        // Do NOT add audio for native language feedback messages
        if (result.correctAnswer && this.shouldShowAudioButton(result.correctAnswer)) {
            textToSpeak = result.correctAnswer;
        }
        
        // Special case: extract foreign word from "Правильный ответ: [foreign word]" pattern
        if (!textToSpeak && result.feedback && result.feedback.includes('Правильный ответ:')) {
            const match = result.feedback.match(/Правильный ответ:\s*(.+?)$/);
            if (match) {
                const extractedText = match[1].trim();
                console.log('Extracted text from feedback:', extractedText);
                if (this.shouldShowAudioButton(extractedText)) {
                    textToSpeak = extractedText;
                    console.log('Using extracted foreign text:', textToSpeak);
                }
            }
        }
        
        // If we found German text to speak, add audio button
        if (textToSpeak) {
            const audioBtn = this.createAudioButton(textToSpeak, 'audio-btn-small');
            audioBtn.style.marginLeft = '10px';
            feedbackEl.appendChild(audioBtn);
        }
        
        let feedbackClass = 'incorrect';
        if (result.correct) {
            feedbackClass = 'correct';
        } else if (result.partiallyCorrect) {
            feedbackClass = 'partial';
        }
        
        feedbackEl.className = `feedback ${feedbackClass}`;
    }

    disableChoiceButtons() {
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        });
    }

    disableReviewChoiceButtons() {
        document.querySelectorAll('#reviewAnswerArea .choice-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        });
    }

    showNextButton() {
        if (quizManager.isQuizComplete()) {
            document.getElementById('finishStudyBtn').classList.remove('hidden');
        } else {
            document.getElementById('nextBtn').classList.remove('hidden');
        }
    }

    showReviewNextButton() {
        if (quizManager.isQuizComplete()) {
            document.getElementById('finishReviewBtn').classList.remove('hidden');
        } else {
            document.getElementById('reviewNextBtn').classList.remove('hidden');
        }
    }

    nextQuestion() {
        this.currentQuizData = quizManager.nextQuestion();
        if (this.currentQuizData) {
            this.renderQuestion(this.currentQuizData);
        } else {
            // Quiz is complete, show finish button
            document.getElementById('finishStudyBtn').classList.remove('hidden');
        }
    }

    nextReviewQuestion() {
        this.currentQuizData = quizManager.nextQuestion();
        if (this.currentQuizData) {
            this.renderReviewQuestion(this.currentQuizData);
        } else {
            // Quiz is complete, show finish button
            document.getElementById('finishReviewBtn').classList.remove('hidden');
        }
    }

    finishQuiz() {
        const results = quizManager.getQuizResults();
        alert(`Квиз завершен!\nРезультат: ${results.score}/${results.totalQuestions} (${results.percentage}%)`);
        
        this.resetQuizInterface();
        quizManager.reset();
        this.updateStats();
    }

    finishReview() {
        const results = quizManager.getQuizResults();
        alert(`Повторение завершено!\nРезультат: ${results.score}/${results.totalQuestions} (${results.percentage}%)`);
        
        this.resetReviewInterface();
        quizManager.reset();
        this.updateStats();
        this.updateReviewStats();
    }

    async startSurvivalMode() {
        try {
            await this.survivalMode.start();
        } catch (error) {
            console.error('Error starting survival mode:', error);
            alert(error.message);
        }
    }

    resetQuizInterface() {
        document.getElementById('studyModeSelect').style.display = 'block';
        document.getElementById('quizArea').classList.add('hidden');
        document.getElementById('survivalArea').classList.add('hidden');
    }

    resetReviewInterface() {
        document.getElementById('reviewModeSelect').style.display = 'block';
        document.getElementById('reviewQuizArea').classList.add('hidden');
    }

    async exportWords(status = null) {
        try {
            const csvContent = await database.exportWords(status);
            
            if (!csvContent) {
                alert('Нет данных для экспорта');
                return;
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            const filename = status ? 
                `words_${status}_${new Date().toISOString().split('T')[0]}.csv` :
                `all_words_${new Date().toISOString().split('T')[0]}.csv`;
            
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Ошибка при экспорте данных');
        }
    }

    handleEnterPress(inputEl) {
        if (inputEl.disabled) return;
        
        // If enter not pressed yet, submit answer or show answer if empty
        if (inputEl.dataset.enterPressed === 'false') {
            inputEl.dataset.enterPressed = 'true';
            
            if (!inputEl.value.trim()) {
                // If field is empty, show answer
                this.showAnswer(inputEl);
            } else {
                // If field has input, submit answer
                this.handleTypingAnswer(inputEl.value, inputEl);
            }
        } else {
            // Second enter press - go to next question
            if (!document.getElementById('nextBtn').classList.contains('hidden')) {
                this.nextQuestion();
            } else if (!document.getElementById('finishStudyBtn').classList.contains('hidden')) {
                this.finishQuiz();
            }
        }
    }

    handleReviewEnterPress(inputEl) {
        if (inputEl.disabled) return;
        
        // If enter not pressed yet, submit answer or show answer if empty
        if (inputEl.dataset.enterPressed === 'false') {
            inputEl.dataset.enterPressed = 'true';
            
            if (!inputEl.value.trim()) {
                // If field is empty, show answer
                this.showReviewAnswer(inputEl);
            } else {
                // If field has input, submit answer
                this.handleReviewTypingAnswer(inputEl.value, inputEl);
            }
        } else {
            // Second enter press - go to next question
            if (!document.getElementById('reviewNextBtn').classList.contains('hidden')) {
                this.nextReviewQuestion();
            } else if (!document.getElementById('finishReviewBtn').classList.contains('hidden')) {
                this.finishReview();
            }
        }
    }

    renderWordBuildingInterface(question, answerArea) {
        // Create word building area
        const wordBuildingArea = document.createElement('div');
        wordBuildingArea.className = 'word-building-area';
        
        // Input field for typing or displaying built word
        const wordInput = document.createElement('input');
        wordInput.type = 'text';
        wordInput.className = 'word-building-input';
        wordInput.placeholder = 'Составьте слово...';
        wordInput.dataset.enterPressed = 'false';
        wordInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.handleWordBuildingEnter(wordInput, question);
            }
        };
        
        // Handle backspace to return letters to tile pool
        wordInput.onkeydown = (e) => {
            if (e.key === 'Backspace' && wordInput.value.length > 0 && !wordInput.disabled) {
                e.preventDefault(); // Prevent default backspace
                this.handleLetterDelete(wordInput, letterTiles);
            }
        };
        wordBuildingArea.appendChild(wordInput);
        
        // Letter tiles
        const letterTiles = document.createElement('div');
        letterTiles.className = 'letter-tiles';
        
        question.letters.forEach((letter, index) => {
            const tile = document.createElement('button');
            tile.className = 'letter-tile';
            tile.textContent = letter;
            tile.dataset.letter = letter;
            tile.dataset.index = index;
            tile.onclick = () => this.handleLetterClick(tile, wordInput);
            letterTiles.appendChild(tile);
        });
        
        wordBuildingArea.appendChild(letterTiles);
        
        // Control buttons
        const controls = document.createElement('div');
        controls.className = 'word-building-controls';
        
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-word-btn';
        clearBtn.textContent = 'Очистить';
        clearBtn.onclick = () => this.clearBuiltWord(wordInput, letterTiles);
        controls.appendChild(clearBtn);
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'action-btn';
        submitBtn.textContent = 'Ответить';
        submitBtn.onclick = () => this.handleWordBuildingSubmit(wordInput, question);
        controls.appendChild(submitBtn);
        
        const showAnswerBtn = document.createElement('button');
        showAnswerBtn.className = 'action-btn show-answer-btn';
        showAnswerBtn.textContent = 'Показать ответ';
        showAnswerBtn.onclick = () => this.showWordBuildingAnswer(wordInput, question);
        controls.appendChild(showAnswerBtn);
        
        wordBuildingArea.appendChild(controls);
        answerArea.appendChild(wordBuildingArea);
        wordInput.focus();
    }
    
    handleLetterClick(tile, wordInput) {
        if (tile.disabled || wordInput.disabled) return;
        
        wordInput.value += tile.dataset.letter;
        tile.disabled = true;
        wordInput.focus();
    }
    
    clearBuiltWord(wordInput, letterTiles) {
        if (wordInput.disabled) return;
        
        wordInput.value = '';
        letterTiles.querySelectorAll('.letter-tile').forEach(tile => {
            tile.disabled = false;
        });
        wordInput.focus();
    }
    
    handleLetterDelete(wordInput, letterTiles) {
        if (wordInput.disabled || wordInput.value.length === 0) return;
        
        // Get the last letter from input
        const lastLetter = wordInput.value.slice(-1);
        
        // Remove last letter from input
        wordInput.value = wordInput.value.slice(0, -1);
        
        // Find the first disabled tile with this letter and re-enable it
        const disabledTiles = letterTiles.querySelectorAll('.letter-tile:disabled');
        for (const tile of disabledTiles) {
            if (tile.dataset.letter === lastLetter) {
                tile.disabled = false;
                break; // Only re-enable the first matching tile
            }
        }
        
        wordInput.focus();
    }
    
    handleWordBuildingEnter(wordInput, question) {
        if (wordInput.disabled) return;
        
        // If enter not pressed yet, submit answer or show answer if empty
        if (wordInput.dataset.enterPressed === 'false') {
            wordInput.dataset.enterPressed = 'true';
            
            if (!wordInput.value.trim()) {
                // If field is empty, show answer
                this.showWordBuildingAnswer(wordInput, question);
            } else {
                // If field has input, submit answer
                this.handleWordBuildingSubmit(wordInput, question);
            }
        } else {
            // Second enter press - go to next question
            if (!document.getElementById('nextBtn').classList.contains('hidden')) {
                this.nextQuestion();
            } else if (!document.getElementById('finishStudyBtn').classList.contains('hidden')) {
                this.finishQuiz();
            }
        }
    }
    
    async handleWordBuildingSubmit(wordInput, question) {
        if (wordInput.disabled || !wordInput.value.trim()) return;
        
        const result = await quizManager.checkAnswer(wordInput.value);
        this.showAnswerFeedback(result, 'feedback');
        
        if (result.correct) {
            wordInput.classList.add('correct');
        } else if (result.partiallyCorrect) {
            wordInput.classList.add('partial');
        } else {
            wordInput.classList.add('incorrect');
        }
        
        // Audio button will be added in feedback, no need for duplicate button here
        
        wordInput.disabled = true;
        // Disable all controls
        const controls = wordInput.parentElement.querySelector('.word-building-controls');
        controls.querySelectorAll('button').forEach(btn => btn.disabled = true);
        const tiles = wordInput.parentElement.querySelector('.letter-tiles');
        tiles.querySelectorAll('.letter-tile').forEach(tile => tile.disabled = true);
        
        this.showNextButton();
    }
    
    async showWordBuildingAnswer(wordInput, question) {
        wordInput.value = question.correctAnswer;
        wordInput.classList.add('incorrect');
        wordInput.disabled = true;
        
        // Disable all controls
        const controls = wordInput.parentElement.querySelector('.word-building-controls');
        controls.querySelectorAll('button').forEach(btn => btn.disabled = true);
        const tiles = wordInput.parentElement.querySelector('.letter-tiles');
        tiles.querySelectorAll('.letter-tile').forEach(tile => tile.disabled = true);
        
        // Record as incorrect answer
        await database.updateWordProgress(question.wordId, false, question.type);
        
        // Show feedback
        const feedback = `Правильный ответ: ${question.correctAnswer}`;
        this.showAnswerFeedback({ 
            correct: false, 
            partiallyCorrect: false, 
            feedback: feedback,
            correctAnswer: question.correctAnswer
        }, 'feedback');
        
        this.showNextButton();
    }

    async showAnswer(inputEl) {
        // Get the current question
        const question = quizManager.questions[quizManager.currentQuestionIndex];
        
        // Show the correct answer in the input field
        inputEl.value = question.correctAnswer;
        inputEl.classList.add('incorrect');
        inputEl.disabled = true;
        
        // Disable all buttons
        const buttonContainer = inputEl.parentElement.querySelector('div');
        if (buttonContainer) {
            buttonContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }
        
        // Record as incorrect answer
        await database.updateWordProgress(question.wordId, false, question.type);
        
        // Show feedback
        const feedback = `Правильный ответ: ${question.correctAnswer}`;
        this.showAnswerFeedback({ 
            correct: false, 
            partiallyCorrect: false, 
            feedback: feedback,
            correctAnswer: question.correctAnswer
        }, 'feedback');
        
        this.showNextButton();
    }

    async showReviewAnswer(inputEl) {
        // Get the current question
        const question = quizManager.questions[quizManager.currentQuestionIndex];
        
        // Show the correct answer in the input field
        inputEl.value = question.correctAnswer;
        inputEl.classList.add('incorrect');
        inputEl.disabled = true;
        
        // Disable all buttons
        const buttonContainer = inputEl.parentElement.querySelector('div');
        if (buttonContainer) {
            buttonContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }
        
        // Record as incorrect answer
        await database.updateWordProgress(question.wordId, false, question.type);
        
        // Show feedback
        const feedback = `Правильный ответ: ${question.correctAnswer}`;
        this.showAnswerFeedback({ 
            correct: false, 
            partiallyCorrect: false, 
            feedback: feedback,
            correctAnswer: question.correctAnswer
        }, 'reviewFeedback');
        
        this.showReviewNextButton();
    }

    shouldShowAudioButton(text) {
        if (!text || !text.trim()) return false;
        
        // Check if TTS is available
        if (!this.audioManager.isAvailable()) {
            return false;
        }
        
        // Get current language pair
        const currentPair = userManager ? userManager.getCurrentLanguagePair() : null;
        if (!currentPair) return false;
        
        // Use language manager to detect if this text should have audio
        const isNativeLanguage = languageManager ? 
            languageManager.detectNativeLanguage(text, currentPair.toLanguage) : false;
        
        // Show audio button for studying language (foreign language)
        // Don't show for native language translations
        return !isNativeLanguage;
    }

    createAudioButton(text, className = 'audio-btn') {
        const button = document.createElement('button');
        button.className = className;
        button.innerHTML = '🔊';
        button.title = 'Озвучить';
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.audioManager.speak(text);
        };
        return button;
    }

    addAudioToButton(buttonEl, text) {
        // Check if audio button already exists
        if (buttonEl.querySelector('.audio-btn-inline')) return;
        
        const audioBtn = document.createElement('span');
        audioBtn.className = 'audio-btn-inline';
        audioBtn.innerHTML = ' 🔊';
        audioBtn.title = 'Озвучить';
        audioBtn.style.cursor = 'pointer';
        audioBtn.style.marginLeft = '8px';
        audioBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.audioManager.speak(text);
        };
        buttonEl.appendChild(audioBtn);
    }


    showError(message) {
        alert(message);
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        // Simple notification using alert for now
        // In a real implementation, you'd create a toast notification
        if (type === 'success') {
            console.log(`✅ ${message}`);
        } else if (type === 'error') {
            console.error(`❌ ${message}`);
        } else {
            console.log(`ℹ️ ${message}`);
        }
        
        // You can replace this with a proper toast notification system
        if (type === 'success') {
            // Show a brief alert for important success messages
            setTimeout(() => alert(message), 500);
        }
    }

    showServerConnectionError() {
        // Hide all content and show connection error
        document.body.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                padding: 20px; 
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8f9fa;
            ">
                <div style="
                    max-width: 600px;
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                ">
                    <h1 style="color: #e74c3c; margin-bottom: 20px;">
                        🚫 Нет подключения к серверу
                    </h1>
                    
                    <p style="color: #34495e; font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                        Приложение не может подключиться к серверу базы данных PostgreSQL.
                    </p>
                    
                    <div style="text-align: left; background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                        <h3 style="color: #2c3e50; margin-bottom: 15px;">Для исправления:</h3>
                        <ol style="color: #34495e; line-height: 1.8;">
                            <li><strong>Откройте командную строку</strong> в папке приложения</li>
                            <li><strong>Запустите сервер:</strong> <code style="background: #e8f4fd; padding: 2px 6px; border-radius: 3px;">npm start</code></li>
                            <li><strong>Обновите эту страницу</strong> после запуска сервера</li>
                        </ol>
                    </div>
                    
                    <button onclick="window.location.reload()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">
                        🔄 Обновить страницу
                    </button>
                    
                    <a href="/migrate-indexeddb-to-postgres.html" style="
                        display: inline-block;
                        background: #27ae60;
                        color: white;
                        text-decoration: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-size: 16px;
                    ">
                        📥 Миграция данных
                    </a>
                    
                    <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
                        Приложение теперь использует только PostgreSQL базу данных для синхронизации с Telegram ботом.
                    </p>
                </div>
            </div>
        `;
    }

    handleGlobalEnterPress(e) {
        // Check if we're in quiz mode and if next/finish buttons are visible
        const isInQuiz = !document.getElementById('quizArea').classList.contains('hidden') || 
                        !document.getElementById('reviewQuizArea').classList.contains('hidden');
        
        if (!isInQuiz) return;
        
        // Check if there's an active input field that should handle the Enter
        const activeElement = document.activeElement;
        const isInputActive = activeElement && (
            activeElement.tagName === 'INPUT' && 
            !activeElement.disabled && 
            activeElement.dataset.enterPressed === 'false'
        );
        
        // If input is active and hasn't been processed yet, let it handle the enter
        if (isInputActive) return;
        
        // Otherwise, handle navigation
        if (this.currentSection === 'study') {
            const nextBtn = document.getElementById('nextBtn');
            const finishBtn = document.getElementById('finishStudyBtn');
            
            if (!finishBtn.classList.contains('hidden')) {
                e.preventDefault();
                this.finishQuiz();
            } else if (!nextBtn.classList.contains('hidden')) {
                e.preventDefault();
                this.nextQuestion();
            }
        } else if (this.currentSection === 'review') {
            const nextBtn = document.getElementById('reviewNextBtn');
            const finishBtn = document.getElementById('finishReviewBtn');
            
            if (!finishBtn.classList.contains('hidden')) {
                e.preventDefault();
                this.finishReview();
            } else if (!nextBtn.classList.contains('hidden')) {
                e.preventDefault();
                this.nextReviewQuestion();
            }
        }
    }

    handleNumberKeyPress(e) {
        // Only handle number keys if we're in a multiple choice quiz
        const isInQuiz = !document.getElementById('quizArea').classList.contains('hidden') || 
                        !document.getElementById('reviewQuizArea').classList.contains('hidden');
        
        if (!isInQuiz) return;

        // Check if we have multiple choice buttons
        const choiceButtons = document.querySelectorAll('.choice-btn:not([disabled])');
        if (choiceButtons.length === 0) return;

        const choiceIndex = parseInt(e.key) - 1; // Convert 1-4 to 0-3
        if (choiceIndex < 0 || choiceIndex >= choiceButtons.length) return;

        const button = choiceButtons[choiceIndex];
        if (button && !button.disabled) {
            e.preventDefault();
            button.click();
        }
    }

    async updateSettingsPage() {
        if (!userManager.isLoggedIn()) return;
        
        // Initialize language pair manager if interface elements exist
        await this.initLanguagePairManager();
        
        // Update language pairs list (legacy)
        this.renderLanguagePairs();
        
        // Update lesson size input
        const lessonSizeInput = document.getElementById('lessonSizeInput');
        if (lessonSizeInput) {
            const lessonSize = userManager.getLessonSize();
            lessonSizeInput.value = lessonSize;
        }
    }

    renderLanguagePairs() {
        const container = document.getElementById('languagePairsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        const user = userManager.getCurrentUser();
        if (!user || !user.languagePairs) return;
        
        user.languagePairs.forEach(pair => {
            const item = document.createElement('div');
            item.className = `language-pair-item ${pair.active ? 'active' : ''}`;
            
            item.innerHTML = `
                <div class="language-pair-info">
                    <div class="language-pair-name">${pair.name}</div>
                    <div class="language-pair-stats">${pair.fromLanguage} → ${pair.toLanguage}</div>
                </div>
                <div class="language-pair-controls">
                    ${!pair.active ? `<button class="select-btn" onclick="app.selectLanguagePair('${pair.id}')">Выбрать</button>` : ''}
                    ${user.languagePairs.length > 1 ? `<button class="delete-btn" onclick="app.deleteLanguagePair('${pair.id}')">Удалить</button>` : ''}
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    async selectLanguagePair(pairId) {
        try {
            await userManager.setActiveLanguagePair(pairId);
            this.renderLanguagePairs();
            await this.updateStats();
        } catch (error) {
            console.error('Error selecting language pair:', error);
            alert('Ошибка при выборе языковой пары');
        }
    }

    async deleteLanguagePair(pairId) {
        if (!confirm('Вы уверены, что хотите удалить эту языковую пару? Все связанные с ней данные будут потеряны.')) {
            return;
        }
        
        try {
            await userManager.deleteLanguagePair(pairId);
            this.renderLanguagePairs();
            await this.updateStats();
        } catch (error) {
            console.error('Error deleting language pair:', error);
            alert(error.message || 'Ошибка при удалении языковой пары');
        }
    }

    async initLanguagePairManager() {
        // Check if language pair interface exists before initializing
        const languagePairInterface = document.querySelector('.language-pair-tabs, #popularPairsTab');
        if (!languagePairInterface) {
            console.log('Language pair interface not found, skipping initialization');
            return;
        }
        
        // Initialize language pair tabs
        this.setupLanguagePairEventListeners();
        
        // Load and render popular pairs by default
        this.showLanguagePairTab('popular');
    }

    setupLanguagePairEventListeners() {
        // Tab switching
        const popularTab = document.getElementById('popularPairsTab');
        const customTab = document.getElementById('customPairsTab');
        const manageTab = document.getElementById('managePairsTab');
        
        if (popularTab) popularTab.addEventListener('click', () => this.showLanguagePairTab('popular'));
        if (customTab) customTab.addEventListener('click', () => this.showLanguagePairTab('custom'));
        if (manageTab) manageTab.addEventListener('click', () => this.showLanguagePairTab('manage'));

        // Add language pair button
        const addBtn = document.getElementById('addLanguagePairBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.showCustomPairDialog());

        // Modal close
        const modal = document.getElementById('customPairModal');
        const closeBtn = modal?.querySelector('.close-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideCustomPairDialog());

        // Custom pair creation
        const createBtn = document.getElementById('createCustomPairBtn');
        if (createBtn) createBtn.addEventListener('click', () => this.createCustomPair());

        // Cancel button
        const cancelBtn = document.getElementById('cancelCustomPairBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideCustomPairDialog());

        // Language selection change handlers
        const fromSelect = document.getElementById('fromLanguageSelect');
        const toSelect = document.getElementById('toLanguageSelect');
        
        if (fromSelect) fromSelect.addEventListener('change', () => this.updateCustomPairPreview());
        if (toSelect) toSelect.addEventListener('change', () => this.updateCustomPairPreview());
        
        // Update custom pair name input handler
        const customPairNameInput = document.getElementById('customPairName');
        if (customPairNameInput) {
            customPairNameInput.addEventListener('input', () => this.updateCustomPairPreview());
        }
    }

    showLanguagePairTab(tabName) {
        try {
            // Update tab buttons
            document.querySelectorAll('.language-pair-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            const activeTab = document.getElementById(`${tabName}PairsTab`);
            if (activeTab) activeTab.classList.add('active');

            // Update content
            document.querySelectorAll('.language-pair-content').forEach(content => {
                content.classList.remove('active');
            });
            const activeContent = document.getElementById(`${tabName}PairsContent`);
            if (activeContent) activeContent.classList.add('active');

            // Load appropriate content
            switch (tabName) {
                case 'popular':
                    this.renderPopularPairs();
                    break;
                case 'custom':
                    this.renderCustomPairs();
                    break;
                case 'manage':
                    this.renderManagePairs();
                    break;
            }
        } catch (error) {
            console.warn('Error showing language pair tab:', error);
        }
    }

    async renderPopularPairs() {
        const container = document.getElementById('popularPairsGrid');
        if (!container) return;

        try {
            // Import language pairs config dynamically
            const { LANGUAGE_PAIRS_CONFIG } = await import('./language-pairs-config.js');
            
            container.innerHTML = '';
            
            LANGUAGE_PAIRS_CONFIG.popularPairs.forEach(pair => {
                const pairElement = document.createElement('div');
                pairElement.className = 'popular-pair-item';
                pairElement.innerHTML = `
                    <div class="pair-flag">${pair.flag}</div>
                    <div class="pair-name">${pair.name}</div>
                    <div class="pair-difficulty difficulty-${pair.difficulty}">${this.getDifficultyLabel(pair.difficulty)}</div>
                    <button class="select-pair-btn" onclick="app.selectPopularPair('${pair.id}')">
                        Выбрать
                    </button>
                `;
                container.appendChild(pairElement);
            });
        } catch (error) {
            console.error('Error rendering popular pairs:', error);
            container.innerHTML = '<div class="error-message">Ошибка загрузки языковых пар</div>';
        }
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            'easy': 'Легкий',
            'medium': 'Средний',
            'hard': 'Сложный'
        };
        return labels[difficulty] || 'Средний';
    }

    async selectPopularPair(pairId) {
        try {
            const { LANGUAGE_PAIRS_CONFIG } = await import('./language-pairs-config.js');
            const selectedPair = LANGUAGE_PAIRS_CONFIG.popularPairs.find(p => p.id === pairId);
            
            if (!selectedPair) {
                throw new Error('Language pair not found');
            }

            // Create or activate this language pair for the user
            await this.createLanguagePair(
                selectedPair.fromLanguageCode,
                selectedPair.toLanguageCode,
                selectedPair.name,
                selectedPair
            );

            // Show success message
            this.showNotification('Языковая пара активирована!', 'success');
            
        } catch (error) {
            console.error('Error selecting popular pair:', error);
            this.showNotification('Ошибка при выборе языковой пары', 'error');
        }
    }

    renderCustomPairs() {
        const container = document.getElementById('customPairsGrid');
        if (!container) return;

        const user = userManager.getCurrentUser();
        const customPairs = user?.languagePairs?.filter(p => p.category === 'custom') || [];

        if (customPairs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌍</div>
                    <h3>Нет пользовательских пар</h3>
                    <p>Создайте свою собственную языковую пару</p>
                    <button class="create-pair-btn" onclick="app.showCustomPairDialog()">
                        Создать пару
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        customPairs.forEach(pair => {
            const pairElement = document.createElement('div');
            pairElement.className = 'custom-pair-item';
            pairElement.innerHTML = `
                <div class="pair-info">
                    <div class="pair-flag">${pair.flag || '🌍'}</div>
                    <div class="pair-name">${pair.name}</div>
                    <div class="pair-languages">${pair.fromLanguage} → ${pair.toLanguage}</div>
                </div>
                <div class="pair-actions">
                    <button class="select-pair-btn" onclick="app.selectLanguagePair('${pair.id}')">
                        ${pair.active ? 'Активна' : 'Выбрать'}
                    </button>
                    <button class="delete-pair-btn" onclick="app.deleteCustomPair('${pair.id}')">
                        🗑️
                    </button>
                </div>
            `;
            container.appendChild(pairElement);
        });
    }

    renderManagePairs() {
        const container = document.getElementById('managePairsGrid');
        if (!container) return;

        const user = userManager.getCurrentUser();
        const allPairs = user?.languagePairs || [];

        if (allPairs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>Нет языковых пар</h3>
                    <p>Выберите языковую пару из популярных или создайте свою</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        allPairs.forEach(pair => {
            const pairElement = document.createElement('div');
            pairElement.className = `manage-pair-item ${pair.active ? 'active' : ''}`;
            pairElement.innerHTML = `
                <div class="pair-header">
                    <div class="pair-flag">${pair.flag || '🌍'}</div>
                    <div class="pair-info">
                        <div class="pair-name">${pair.name}</div>
                        <div class="pair-meta">${pair.fromLanguage} → ${pair.toLanguage}</div>
                        ${pair.active ? '<span class="active-badge">Активна</span>' : ''}
                    </div>
                </div>
                <div class="pair-stats">
                    <div class="stat-item">
                        <span class="stat-value">${pair.studyingCount || 0}</span>
                        <span class="stat-label">Изучается</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${pair.reviewCount || 0}</span>
                        <span class="stat-label">На повторении</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${pair.learnedCount || 0}</span>
                        <span class="stat-label">Изучено</span>
                    </div>
                </div>
                <div class="pair-actions">
                    ${!pair.active ? `<button class="select-pair-btn" onclick="app.selectLanguagePair('${pair.id}')">Активировать</button>` : ''}
                    ${allPairs.length > 1 ? `<button class="delete-pair-btn" onclick="app.deleteLanguagePair('${pair.id}')">Удалить</button>` : ''}
                </div>
            `;
            container.appendChild(pairElement);
        });
    }

    showCustomPairDialog() {
        const modal = document.getElementById('customPairModal');
        if (!modal) return;

        // Populate language selects
        this.populateLanguageSelects();
        
        // Reset form
        document.getElementById('customPairName').value = '';
        this.updateCustomPairPreview();
        
        modal.classList.add('active');
    }

    hideCustomPairDialog() {
        const modal = document.getElementById('customPairModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async populateLanguageSelects() {
        try {
            const { LANGUAGE_PAIRS_CONFIG } = await import('./language-pairs-config.js');
            
            const fromSelect = document.getElementById('fromLanguageSelect');
            const toSelect = document.getElementById('toLanguageSelect');
            
            if (!fromSelect || !toSelect) return;

            const languageOptions = Object.entries(LANGUAGE_PAIRS_CONFIG.languages)
                .map(([code, lang]) => `<option value="${code}">${lang.nativeName} (${lang.name})</option>`)
                .join('');

            fromSelect.innerHTML = languageOptions;
            toSelect.innerHTML = languageOptions;
            
            // Set defaults
            fromSelect.value = 'de'; // German
            toSelect.value = 'ru'; // Russian
            
            this.updateCustomPairPreview();
        } catch (error) {
            console.error('Error populating language selects:', error);
        }
    }

    async updateCustomPairPreview() {
        try {
            const { LANGUAGE_PAIRS_CONFIG } = await import('./language-pairs-config.js');
            
            const fromCode = document.getElementById('fromLanguageSelect').value;
            const toCode = document.getElementById('toLanguageSelect').value;
            const nameInput = document.getElementById('customPairName');
            const preview = document.getElementById('pairPreview');
            
            if (!fromCode || !toCode || !preview) return;

            const fromLang = LANGUAGE_PAIRS_CONFIG.languages[fromCode];
            const toLang = LANGUAGE_PAIRS_CONFIG.languages[toCode];
            
            if (!fromLang || !toLang) return;

            const defaultName = `${fromLang.nativeName} → ${toLang.nativeName}`;
            const flag = `${fromLang.flag}→${toLang.flag}`;
            
            nameInput.placeholder = defaultName;
            preview.innerHTML = `
                <div class="preview-flag">${flag}</div>
                <div class="preview-name">${nameInput.value || defaultName}</div>
                <div class="preview-languages">${fromLang.name} → ${toLang.name}</div>
            `;
        } catch (error) {
            console.error('Error updating pair preview:', error);
        }
    }

    async createCustomPair() {
        try {
            const fromCode = document.getElementById('fromLanguageSelect').value;
            const toCode = document.getElementById('toLanguageSelect').value;
            const customName = document.getElementById('customPairName').value;
            
            if (fromCode === toCode) {
                this.showNotification('Исходный и целевой язык не могут быть одинаковыми', 'error');
                return;
            }

            const { LanguagePairHelper } = await import('./language-pairs-config.js');
            const pairConfig = LanguagePairHelper.createCustomPair(fromCode, toCode, customName);
            
            await this.createLanguagePair(fromCode, toCode, pairConfig.name, pairConfig);
            
            this.hideCustomPairDialog();
            this.showNotification('Языковая пара создана!', 'success');
            
            // Refresh the custom pairs view
            if (document.getElementById('customPairsTab').classList.contains('active')) {
                this.renderCustomPairs();
            }
        } catch (error) {
            console.error('Error creating custom pair:', error);
            this.showNotification('Ошибка при создании языковой пары', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showLanguagePairDialog() {
        // Redirect to the modern interface
        this.showSection('settings');
        setTimeout(() => {
            this.showLanguagePairTab('popular');
        }, 100);
    }

    async createLanguagePair(fromLangCode, toLangCode, name, pairConfig = null) {
        try {
            // If pairConfig is provided (from popular pairs), use it
            if (pairConfig) {
                await userManager.createLanguagePair(fromLangCode, toLangCode, name, pairConfig);
            } else {
                // Create simple language pair
                await userManager.createLanguagePair(fromLangCode, toLangCode, name);
            }
            
            this.renderLanguagePairs();
            
            // Refresh all views
            this.showLanguagePairTab(document.querySelector('.language-pair-tab.active')?.id?.replace('PairsTab', '') || 'popular');
        } catch (error) {
            console.error('Error creating language pair:', error);
            alert('Ошибка при создании языковой пары');
        }
    }

    async deleteCustomPair(pairId) {
        if (!confirm('Вы уверены, что хотите удалить эту языковую пару? Все связанные с ней данные будут потеряны.')) {
            return;
        }
        
        try {
            await userManager.deleteLanguagePair(pairId);
            
            // Refresh views
            this.renderCustomPairs();
            this.renderManagePairs();
            await this.updateStats();
            
            this.showNotification('Языковая пара удалена', 'success');
        } catch (error) {
            console.error('Error deleting custom pair:', error);
            this.showNotification('Ошибка при удалении языковой пары', 'error');
        }
    }

    async updateLessonSize(size) {
        try {
            await userManager.setLessonSize(parseInt(size));
        } catch (error) {
            console.error('Error updating lesson size:', error);
        }
    }

    async saveLessonSize() {
        const input = document.getElementById('lessonSizeInput');
        const size = parseInt(input.value);
        
        if (size < 5 || size > 50) {
            alert('Размер урока должен быть от 5 до 50 слов');
            return;
        }
        
        try {
            await userManager.setLessonSize(size);
            
            // Visual feedback
            const button = document.getElementById('saveLessonSizeBtn');
            const originalText = button.textContent;
            button.textContent = '✅ Сохранено!';
            button.style.background = '#4CAF50';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
            
            console.log(`💾 Lesson size saved: ${size} words per lesson`);
        } catch (error) {
            console.error('Error saving lesson size:', error);
            alert('Ошибка при сохранении настройки');
        }
    }

    async syncWithServer() {
        const statusEl = document.getElementById('syncStatus');
        statusEl.textContent = 'Экспорт данных...';
        statusEl.className = 'sync-status info';
        statusEl.style.display = 'block';
        
        try {
            // Export all words from current user's language pair
            const words = await database.getAllWords();
            
            if (words.length === 0) {
                statusEl.textContent = 'Нет данных для синхронизации';
                statusEl.className = 'sync-status error';
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 3000);
                return;
            }
            
            // Transform data for server
            const exportData = words.map(word => ({
                word: word.word,
                translation: word.translation,
                example: word.example || '',
                exampleTranslation: word.exampleTranslation || '',
                status: word.status,
                correctCount: word.correctCount || 0,
                totalCount: (word.correctCount || 0) + (word.incorrectCount || 0),
                createdAt: word.dateAdded || new Date().toISOString(),
                updatedAt: word.lastStudied || new Date().toISOString(),
                languagePair: userManager.getCurrentLanguagePair()?.name || 'Default',
                userId: userManager.getCurrentUser()?.id || 'anonymous'
            }));
            
            statusEl.textContent = `Отправка ${exportData.length} слов на сервер...`;
            
            // Create FormData for upload
            const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const formData = new FormData();
            formData.append('progressFile', jsonBlob, 'progress-export.json');
            
            // Try to send to server
            const response = await fetch('https://words-learning-server-production.up.railway.app/api/words/import-progress', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                statusEl.textContent = `Синхронизация завершена! Импортировано: ${result.imported || exportData.length} слов`;
                statusEl.className = 'sync-status success';
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
            
        } catch (networkError) {
            console.error('Sync error:', networkError);
            
            // Fallback: download file for manual import
            try {
                const words = await database.getAllWords();
                const exportData = words.map(word => ({
                    word: word.word,
                    translation: word.translation,
                    example: word.example || '',
                    exampleTranslation: word.exampleTranslation || '',
                    status: word.status,
                    correctCount: word.correctCount || 0,
                    totalCount: (word.correctCount || 0) + (word.incorrectCount || 0),
                    createdAt: word.dateAdded || new Date().toISOString(),
                    updatedAt: word.lastStudied || new Date().toISOString(),
                    languagePair: userManager.getCurrentLanguagePair()?.name || 'Default',
                    userId: userManager.getCurrentUser()?.id || 'anonymous'
                }));
                
                const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { 
                    type: 'application/json' 
                });
                
                const url = URL.createObjectURL(jsonBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `words-progress-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                statusEl.textContent = 'Ошибка связи с сервером. Файл скачан для ручного импорта.';
                statusEl.className = 'sync-status error';
                
            } catch (fallbackError) {
                statusEl.textContent = 'Ошибка синхронизации и создания файла';
                statusEl.className = 'sync-status error';
            }
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }

    // Image management methods
    async startImageFetching() {
        if (window.imageBatchProcessor) {
            await window.imageBatchProcessor.startProcessing();
        } else {
            alert('Модуль загрузки изображений не доступен. Убедитесь, что скрипты загружены правильно.');
        }
    }

    async showImageStats() {
        if (window.imageBatchProcessor) {
            const stats = await window.imageBatchProcessor.getImageStats();
            alert(`📊 Статистика изображений:\n\n` +
                  `Всего слов: ${stats.total}\n` +
                  `С изображениями: ${stats.withImages}\n` +
                  `Без изображений: ${stats.withoutImages}\n` +
                  `Покрытие: ${stats.percentage}%`);
        } else {
            alert('Модуль статистики изображений не доступен.');
        }
    }

    // Database management methods
    async handleImportGerman() {
        console.log('🇩🇪 Importing German vocabulary...');
        
        const importStatus = document.getElementById('importStatus');
        if (importStatus) {
            importStatus.innerHTML = '<div style="color: #2196F3;">🔄 Импортирование немецких слов...</div>';
        }

        try {
            if (typeof window.importGermanVocab === 'function') {
                await window.importGermanVocab();
                
                if (importStatus) {
                    importStatus.innerHTML = '<div style="color: #4CAF50;">✅ Успешно импортировано 118 немецких слов!</div>';
                }
                
                // Update home page statistics if we're on home page
                if (window.router && window.router.currentRoute && window.router.currentRoute.name === 'home') {
                    window.router.navigateTo('/');
                }
                
            } else {
                throw new Error('Import function not available');
            }
        } catch (error) {
            console.error('❌ Import failed:', error);
            if (importStatus) {
                importStatus.innerHTML = `<div style="color: #f44336;">❌ Ошибка импорта: ${error.message}</div>`;
            }
        }
    }

    async handleCheckWordCount() {
        console.log('📊 Checking word count...');
        
        const importStatus = document.getElementById('importStatus');
        if (importStatus) {
            importStatus.innerHTML = '<div style="color: #2196F3;">🔄 Подсчёт слов...</div>';
        }

        try {
            if (typeof window.checkWordCount === 'function') {
                const stats = await window.checkWordCount();
                
                if (stats && importStatus) {
                    importStatus.innerHTML = `
                        <div style="color: #4CAF50;">
                            📊 <strong>Слова в базе данных:</strong><br>
                            📚 Изучаемые: ${stats.studying}<br>
                            🔄 На повторении: ${stats.review}<br>
                            ✅ Изученные: ${stats.learned}<br>
                            📈 <strong>Всего: ${stats.total}</strong>
                        </div>
                    `;
                }
            } else {
                throw new Error('Check word count function not available');
            }
        } catch (error) {
            console.error('❌ Word count check failed:', error);
            if (importStatus) {
                importStatus.innerHTML = `<div style="color: #f44336;">❌ Ошибка подсчёта: ${error.message}</div>`;
            }
        }
    }

    async handleClearDatabase() {
        console.log('🗑️ Clearing database...');
        
        // Double confirmation for safety
        const confirmed1 = confirm('⚠️ Вы уверены, что хотите удалить ВСЕ слова из базы данных?\n\nЭто действие НЕЛЬЗЯ отменить!');
        if (!confirmed1) return;
        
        const confirmed2 = confirm('🚨 ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!\n\nВы действительно хотите БЕЗВОЗВРАТНО удалить все слова?\n\nНажмите "OK" только если вы полностью уверены.');
        if (!confirmed2) return;

        const importStatus = document.getElementById('importStatus');
        if (importStatus) {
            importStatus.innerHTML = '<div style="color: #f44336;">🗑️ Очистка базы данных...</div>';
        }

        try {
            if (window.externalDatabase) {
                // Call API to clear all words
                const response = await fetch(`${window.externalDatabase.baseUrl}/words`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${window.externalDatabase.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                if (importStatus) {
                    importStatus.innerHTML = '<div style="color: #4CAF50;">✅ База данных очищена. Все слова удалены.</div>';
                }
                
                // Update statistics
                await this.updateStats();
                
            } else {
                throw new Error('Database connection not available');
            }
        } catch (error) {
            console.error('❌ Database clear failed:', error);
            if (importStatus) {
                importStatus.innerHTML = `<div style="color: #f44336;">❌ Ошибка очистки: ${error.message}</div>`;
            }
        }
    }
    
    // Word Editor functionality
    async toggleWordEditor() {
        const editor = document.getElementById('wordEditor');
        const btn = document.getElementById('editWordsBtn');
        
        if (editor.classList.contains('hidden')) {
            btn.textContent = '⌛ Загрузка...';
            btn.disabled = true;
            
            await this.loadWordEditor();
            editor.classList.remove('hidden');
            
            btn.textContent = '✕ Закрыть редактор';
            btn.disabled = false;
        } else {
            editor.classList.add('hidden');
            btn.textContent = '📝 Редактировать слова';
        }
    }
    
    async loadWordEditor() {
        try {
            const words = await database.getAllWords();
            const editorContent = document.getElementById('wordEditorContent');
            
            if (words.length === 0) {
                editorContent.innerHTML = '<p style="text-align: center; color: #666;">Нет слов для редактирования</p>';
                return;
            }
            
            const studyingWords = words.filter(w => w.status === 'studying');
            const reviewWords = words.filter(w => w.status === 'review');
            const learnedWords = words.filter(w => w.status === 'learned');
            
            editorContent.innerHTML = `
                <div class="word-editor-header">
                    <div class="word-editor-stats">
                        <strong>Всего слов: ${words.length}</strong> | 
                        📚 Изучаемые: ${studyingWords.length} | 
                        🔄 Повторение: ${reviewWords.length} | 
                        ✅ Изучено: ${learnedWords.length}
                    </div>
                    <button class="close-editor-btn" onclick="window.app.toggleWordEditor()">✕ Закрыть</button>
                </div>
                <div class="word-list">
                    ${words.map(word => this.createWordItem(word)).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading word editor:', error);
            document.getElementById('wordEditorContent').innerHTML = '<p style="color: #f44336;">Ошибка загрузки редактора слов</p>';
        }
    }
    
    createWordItem(word) {
        const statusLabels = {
            'studying': 'Изучается',
            'review': 'Повторение', 
            'learned': 'Изучено'
        };
        
        return `
            <div class="word-item" data-word-id="${word.id}">
                <div class="word-details">
                    <div class="word-text">${word.word}</div>
                    <div class="word-translation">${word.translation}</div>
                    <div class="word-meta">
                        <span class="word-status ${word.status}">${statusLabels[word.status] || word.status}</span>
                        ${word.status === 'studying' ? `<span class="word-points">⭐ ${word.points || 0}/50</span>` : ''}
                    </div>
                </div>
                <div class="word-actions">
                    ${word.status !== 'studying' ? '<button class="word-action-btn move-studying" onclick="window.app.moveWord(' + word.id + ', \'studying\')">📚 В изучение</button>' : ''}
                    ${word.status !== 'review' ? '<button class="word-action-btn move-review" onclick="window.app.moveWord(' + word.id + ', \'review\')">🔄 В повторение</button>' : ''}
                    ${word.status !== 'learned' ? '<button class="word-action-btn move-learned" onclick="window.app.moveWord(' + word.id + ', \'learned\')">✅ В изученные</button>' : ''}
                    <button class="word-action-btn delete" onclick="window.app.deleteWord(${word.id})">🗑️ Удалить</button>
                </div>
            </div>
        `;
    }
    
    async moveWord(wordId, newStatus) {
        try {
            await database.updateWordStatus(wordId, newStatus);
            console.log(`✅ Word ${wordId} moved to ${newStatus}`);
            
            // Reload editor to show changes
            await this.loadWordEditor();
            
            // Show feedback
            this.showWordActionFeedback(`Слово перемещено в "${newStatus === 'studying' ? 'Изучение' : newStatus === 'review' ? 'Повторение' : 'Изучено'}"`);
            
        } catch (error) {
            console.error('Error moving word:', error);
            alert('Ошибка при перемещении слова');
        }
    }
    
    async deleteWord(wordId) {
        if (!confirm('Вы уверены, что хотите удалить это слово?')) return;
        
        try {
            await database.deleteWord(wordId);
            console.log(`✅ Word ${wordId} deleted`);
            
            // Reload editor to show changes
            await this.loadWordEditor();
            
            // Show feedback
            this.showWordActionFeedback('Слово удалено');
            
        } catch (error) {
            console.error('Error deleting word:', error);
            alert('Ошибка при удалении слова');
        }
    }
    
    showWordActionFeedback(message) {
        const editorHeader = document.querySelector('.word-editor-header');
        if (!editorHeader) return;
        
        const feedback = document.createElement('div');
        feedback.style.cssText = 'position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #4CAF50; color: white; padding: 8px 15px; border-radius: 5px; font-size: 0.9em; z-index: 1000;';
        feedback.textContent = message;
        
        editorHeader.style.position = 'relative';
        editorHeader.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }
    
    // Mobile exercise mode management
    activateMobileExerciseMode() {
        // Check if we're on mobile
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-exercise-mode');
            console.log('📱 Mobile exercise mode activated');
        }
    }
    
    exitExerciseMode() {
        console.log('🚪 Exiting exercise mode...');
        
        // Remove mobile exercise mode
        document.body.classList.remove('mobile-exercise-mode');
        
        // Hide all quiz areas
        const quizArea = document.getElementById('quizArea');
        const reviewQuizArea = document.getElementById('reviewQuizArea');
        const survivalArea = document.getElementById('survivalArea');
        
        if (quizArea) quizArea.classList.add('hidden');
        if (reviewQuizArea) reviewQuizArea.classList.add('hidden');
        if (survivalArea) survivalArea.classList.add('hidden');
        
        // Show mode selection areas
        const studyModeSelect = document.getElementById('studyModeSelect');
        const reviewModeSelect = document.getElementById('reviewModeSelect');
        
        if (studyModeSelect) studyModeSelect.style.display = 'block';
        if (reviewModeSelect) reviewModeSelect.style.display = 'block';
        
        // Stop survival mode if active
        if (this.survivalMode && this.survivalMode.isActive) {
            this.survivalMode.endGame();
        }
        
        // Navigate back to appropriate section
        if (window.router) {
            const currentSection = document.querySelector('.section.active');
            if (currentSection) {
                const sectionId = currentSection.id;
                if (sectionId === 'studySection') {
                    window.router.navigateTo('/study');
                } else if (sectionId === 'reviewSection') {
                    window.router.navigateTo('/review');
                } else {
                    window.router.navigateTo('/');
                }
            } else {
                window.router.navigateTo('/');
            }
        }
    }



    // Update import section (removed user role restriction for database management)
    updateImportSection() {
        // Database management is now available for all users
        // Only test functions are restricted to root users
    }

    // Leaderboard functionality
    async showLeaderboard() {
        try {
            console.log('📊 Fetching survival mode leaderboard...');
            
            const response = await fetch('/api/survival/leaderboard?limit=20');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch leaderboard');
            }
            
            const container = document.getElementById('leaderboardContainer');
            const content = document.getElementById('leaderboardContent');
            
            if (data.leaderboard.length === 0) {
                content.innerHTML = `
                    <div class="leaderboard-empty">
                        <p>🏆 Лидерборд пуст</p>
                        <p style="font-size: 0.9em; color: #666;">
                            Первыми войдут пользователи, которые пройдут режим выживания с 100+ словами в изучении
                        </p>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <h4>🏆 Топ-20 лидерборда режима выживания</h4>
                    <div class="leaderboard-list">
                        ${data.leaderboard.map((entry, index) => `
                            <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                                <div class="rank">${entry.rank}</div>
                                <div class="player-info">
                                    <div class="player-name">${this.escapeHtml(entry.user_name)}</div>
                                    <div class="player-stats">
                                        📊 ${entry.score} очков • 
                                        🎯 ${entry.accuracy_percentage}% точность • 
                                        📚 ${entry.total_words_available} слов • 
                                        ⏱️ ${Math.floor(entry.duration_seconds / 60)}:${(entry.duration_seconds % 60).toString().padStart(2, '0')}
                                    </div>
                                    <div class="player-date">${new Date(entry.created_at).toLocaleDateString('ru-RU')}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            container.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            this.showError('Ошибка загрузки лидерборда');
        }
    }
    
    async showMyBestResults() {
        try {
            console.log('👤 Fetching user best survival results...');
            
            const response = await fetch('/api/survival/user-best', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch user results');
            }
            
            const container = document.getElementById('leaderboardContainer');
            const content = document.getElementById('leaderboardContent');
            
            if (data.userBest.length === 0) {
                content.innerHTML = `
                    <div class="leaderboard-empty">
                        <p>🎯 У вас пока нет результатов</p>
                        <p style="font-size: 0.9em; color: #666;">
                            Пройдите режим выживания с 100+ словами в изучении, чтобы попасть в лидерборд
                        </p>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <h4>👤 Ваши лучшие результаты в режиме выживания</h4>
                    <div class="leaderboard-list">
                        ${data.userBest.map((entry, index) => `
                            <div class="leaderboard-item user-result ${index === 0 ? 'best-result' : ''}">
                                <div class="rank">#${entry.rank}</div>
                                <div class="player-info">
                                    <div class="player-name">
                                        ${index === 0 ? '🏆 ' : ''}Ваш результат ${index === 0 ? '(лучший)' : '#' + (index + 1)}
                                    </div>
                                    <div class="player-stats">
                                        📊 ${entry.score} очков • 
                                        🎯 ${entry.accuracy_percentage}% точность • 
                                        📚 ${entry.total_words_available} слов • 
                                        ⏱️ ${Math.floor(entry.duration_seconds / 60)}:${(entry.duration_seconds % 60).toString().padStart(2, '0')}
                                    </div>
                                    <div class="player-date">${new Date(entry.created_at).toLocaleDateString('ru-RU')}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            container.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error fetching user results:', error);
            this.showError('Ошибка загрузки ваших результатов');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing app...');
    try {
        window.app = new LanguageLearningApp();
        
        // Initialize router if available and user is logged in
        setTimeout(() => {
            const isLoggedIn = localStorage.getItem('currentUser') || localStorage.getItem('emergencyUser');
            if (isLoggedIn && typeof Router !== 'undefined' && !window.router) {
                window.router = new Router();
                window.router.init();
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Main app initialization failed:', error);
        // Emergency login will handle fallback
    }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    console.log('📄 Document still loading, waiting for DOMContentLoaded...');
} else {
    console.log('📄 Document already loaded, initializing app immediately...');
    try {
        window.app = new LanguageLearningApp();
        
        // Initialize router if available and user is logged in
        setTimeout(() => {
            const isLoggedIn = localStorage.getItem('currentUser') || localStorage.getItem('emergencyUser');
            if (isLoggedIn && typeof Router !== 'undefined' && !window.router) {
                window.router = new Router();
                window.router.init();
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Main app initialization failed:', error);
        // Emergency login will handle fallback
    }
}