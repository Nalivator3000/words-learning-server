class AudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = {};
        this.customVoices = this.loadCustomVoices();
        this.voiceSettings = this.loadVoiceSettings();
        this.allVoices = [];
        this.initVoices();
    }

    loadCustomVoices() {
        try {
            const saved = localStorage.getItem('customVoiceSettings');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load custom voice settings:', error);
            return {};
        }
    }

    loadVoiceSettings() {
        try {
            const saved = localStorage.getItem('voiceSettings');
            return saved ? JSON.parse(saved) : { rate: 0.8, pitch: 1.0, volume: 1.0 };
        } catch (error) {
            console.error('Failed to load voice settings:', error);
            return { rate: 0.8, pitch: 1.0, volume: 1.0 };
        }
    }

    saveVoiceSettings() {
        try {
            localStorage.setItem('voiceSettings', JSON.stringify(this.voiceSettings));
            console.log('✅ Voice settings saved:', this.voiceSettings);
        } catch (error) {
            console.error('Failed to save voice settings:', error);
        }
    }

    setVoiceRate(rate) {
        this.voiceSettings.rate = parseFloat(rate);
        this.saveVoiceSettings();
    }

    setVoicePitch(pitch) {
        this.voiceSettings.pitch = parseFloat(pitch);
        this.saveVoiceSettings();
    }

    setVoiceVolume(volume) {
        this.voiceSettings.volume = parseFloat(volume);
        this.saveVoiceSettings();
    }

    saveCustomVoices() {
        try {
            localStorage.setItem('customVoiceSettings', JSON.stringify(this.customVoices));
            console.log('✅ Custom voice settings saved');
        } catch (error) {
            console.error('Failed to save custom voice settings:', error);
        }
    }

    setCustomVoice(langCode, voiceName) {
        if (voiceName === 'auto') {
            delete this.customVoices[langCode];
        } else {
            this.customVoices[langCode] = voiceName;
        }
        this.saveCustomVoices();

        // Re-select voices with new custom settings
        const allVoices = this.synth.getVoices();
        this.selectVoicesForLanguages(allVoices);

        console.log(`🎯 Custom voice set for ${langCode}: ${voiceName}`);
    }

    getCustomVoice(langCode) {
        return this.customVoices[langCode] || 'auto';
    }

    initVoices() {
        const loadVoices = () => {
            this.allVoices = this.synth.getVoices();

            console.log(`🔊 AudioManager: Found ${this.allVoices.length} total voices`);

            this.selectVoicesForLanguages(this.allVoices);

            // Populate UI if it exists
            if (window.app && window.app.populateVoiceSelectors) {
                window.app.populateVoiceSelectors(this.allVoices);
            }
        };

        loadVoices();

        // Some browsers load voices asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    selectVoicesForLanguages(allVoices) {
        const languages = ['ru-RU', 'en-US', 'de-DE', 'es-ES', 'fr-FR', 'it-IT'];

        languages.forEach(langCode => {
            const customVoiceName = this.customVoices[langCode];

            if (customVoiceName) {
                // Use custom selected voice
                const customVoice = allVoices.find(v => v.name === customVoiceName);
                this.voices[langCode] = customVoice || this.selectBestVoice(allVoices, langCode.split('-')[0]);
                console.log(`✅ ${langCode}: ${this.voices[langCode]?.name} (custom)`);
            } else {
                // Use auto-selected best voice
                this.voices[langCode] = this.selectBestVoice(allVoices, langCode.split('-')[0]);
                if (this.voices[langCode]) {
                    console.log(`✅ ${langCode}: ${this.voices[langCode].name} (auto, local: ${this.voices[langCode].localService})`);
                } else {
                    console.warn(`⚠️ ${langCode}: No suitable voice found`);
                }
            }
        });
    }

    selectBestVoice(allVoices, languagePrefix) {
        // Filter voices for this language
        const languageVoices = allVoices.filter(v => v.lang.startsWith(languagePrefix));

        if (languageVoices.length === 0) {
            console.warn(`No voices found for language: ${languagePrefix}`);
            return null;
        }

        // Bad voice names to filter out (low quality TTS)
        const badVoicePatterns = [
            /espeak/i,
            /festival/i,
            /pico/i,
            /flite/i
        ];

        // Filter out known bad voices
        const goodVoices = languageVoices.filter(voice =>
            !badVoicePatterns.some(pattern => pattern.test(voice.name))
        );

        const voicesToConsider = goodVoices.length > 0 ? goodVoices : languageVoices;

        // Quality score function
        const scoreVoice = (voice) => {
            let score = 0;

            // Priority 1: Local voices (offline, faster)
            if (voice.localService) score += 100;

            // Priority 2: Exact language match (de-DE better than de-US)
            const exactMatch = {
                'ru': ['ru-RU', 'ru_RU'],
                'en': ['en-US', 'en-GB', 'en_US', 'en_GB'],
                'de': ['de-DE', 'de_DE'],
                'es': ['es-ES', 'es_ES'],
                'fr': ['fr-FR', 'fr_FR'],
                'it': ['it-IT', 'it_IT']
            };

            if (exactMatch[languagePrefix]?.some(lang => voice.lang.includes(lang))) {
                score += 50;
            }

            // Priority 3: Quality TTS engines (Google, Microsoft, Apple)
            const qualityEngines = [
                { pattern: /google/i, score: 40 },
                { pattern: /microsoft/i, score: 35 },
                { pattern: /apple/i, score: 35 },
                { pattern: /natural/i, score: 30 },
                { pattern: /premium/i, score: 30 },
                { pattern: /neural/i, score: 25 },
                { pattern: /enhanced/i, score: 20 }
            ];

            qualityEngines.forEach(({ pattern, score: engineScore }) => {
                if (pattern.test(voice.name)) score += engineScore;
            });

            // Slight preference for voices with the language in the name
            if (new RegExp(languagePrefix, 'i').test(voice.name)) {
                score += 10;
            }

            return score;
        };

        // Sort by score (highest first)
        const sortedVoices = voicesToConsider.sort((a, b) => scoreVoice(b) - scoreVoice(a));

        const bestVoice = sortedVoices[0];

        console.log(`🎯 Best voice for ${languagePrefix}: ${bestVoice.name} (score: ${scoreVoice(bestVoice)})`);

        return bestVoice;
    }

    speak(text, languageCode = null) {
        if (!text.trim()) {
            console.log('AudioManager: Empty text, skipping TTS');
            return;
        }
        
        // Auto-detect language if not provided
        if (!languageCode) {
            const currentPair = userManager ? userManager.getCurrentLanguagePair() : null;
            if (currentPair && languageManager) {
                languageCode = languageManager.getAudioLanguageCode(text, currentPair);
            } else {
                languageCode = 'de-DE'; // Default fallback
            }
        }
        
        console.log(`AudioManager: Speaking "${text}" in ${languageCode}`);
        
        // Stop any current speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageCode;
        utterance.rate = this.voiceSettings.rate; // User-configured speed
        utterance.pitch = this.voiceSettings.pitch; // User-configured pitch
        utterance.volume = this.voiceSettings.volume; // User-configured volume
        
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
        this.currentSection = 'home';
        this.currentQuizData = null;
        this.audioManager = new AudioManager();
        this.survivalMode = new SurvivalMode(this);
        this.init();
    }

    // New Points-Based Scoring System
    calculateWordScore(word) {
        // correctCount is the earned points (0-100)
        // totalPoints is always 100 (fixed maximum)
        const correctCount = word.correctcount || word.correctCount || 0;

        // Score IS the percentage (correctCount out of 100)
        return Math.min(100, Math.max(0, correctCount));
    }

    // Get score display with progress percentage and points
    getScoreDisplay(score, word) {
        let className, text;
        const correctCount = word.correctcount || word.correctCount || 0;

        if (correctCount === 0) {
            className = 'score-none';
            text = `${i18n.t('notStudied')} 🌱`;
        } else if (score >= 90) {
            className = 'score-complete';
            text = `${correctCount}/100 points (${score}%) ✅`;
        } else if (score >= 70) {
            className = 'score-high';
            text = `${correctCount}/100 points (${score}%) 🔥`;
        } else if (score >= 50) {
            className = 'score-medium';
            text = `${correctCount}/100 points (${score}%) ⚡`;
        } else if (score >= 30) {
            className = 'score-low';
            text = `${correctCount}/100 points (${score}%) 📚`;
        } else {
            className = 'score-very-low';
            text = `${correctCount}/100 points (${score}%) 🌱`;
        }

        return { className, text };
    }

    // Get points for question type
    getPointsForQuestionType(questionType) {
        const pointsMap = {
            'multipleChoice': 2,
            'reverseMultipleChoice': 2,
            'wordBuilding': 5,
            'typing': 10
        };

        return pointsMap[questionType] || 2; // Default to 2 points
    }

    async init() {
        try {
            await database.init();

            // Initialize language management
            languageManager.init();

            // Initialize user management
            const isLoggedIn = await userManager.init();

            this.setupEventListeners();
            this.setupAuthListeners();
            this.setupLanguageListeners();
            this.survivalMode.setupEventListeners();

            if (isLoggedIn) {
                this.showSection('home');
                await this.updateStats();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError(i18n.t('app_init_error'));
        }
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
        document.getElementById('wordListsBtn').addEventListener('click', () => this.showSection('wordLists'));
        document.getElementById('studyBtn').addEventListener('click', () => this.showSection('study'));
        document.getElementById('reviewBtn').addEventListener('click', () => this.showSection('review'));
        document.getElementById('challengesBtn').addEventListener('click', () => this.showSection('challenges'));

        // Gamification buttons (only visible for whitelisted users)
        if (userManager.hasGamificationAccess()) {
            document.getElementById('leaguesBtn').style.display = '';
            document.getElementById('leaguesBtn').addEventListener('click', () => this.showSection('leagues'));

            document.getElementById('weeklyChallengesBtn').style.display = '';
            document.getElementById('weeklyChallengesBtn').addEventListener('click', () => this.showSection('weeklyChallenges'));

            document.getElementById('personalRatingBtn').style.display = '';
            document.getElementById('personalRatingBtn').addEventListener('click', () => this.showSection('personalRating'));

            document.getElementById('personalInsightsBtn').style.display = '';
            document.getElementById('personalInsightsBtn').addEventListener('click', () => this.showSection('personalInsights'));

            document.getElementById('friendsBtn').style.display = '';
            document.getElementById('friendsBtn').addEventListener('click', () => this.showSection('friends'));

            document.getElementById('duelsBtn').style.display = '';
            document.getElementById('duelsBtn').addEventListener('click', () => this.showSection('duels'));

            document.getElementById('achievementsBtn').style.display = '';
            document.getElementById('achievementsBtn').addEventListener('click', () => this.showSection('achievements'));
        }

        document.getElementById('leaderboardBtn').addEventListener('click', () => this.showSection('leaderboard'));
        document.getElementById('statsBtn').addEventListener('click', () => this.showSection('stats'));

        // User menu - direct to settings
        document.getElementById('userMenuBtn').addEventListener('click', () => this.showSection('settings'));

        // Leaderboard tabs
        document.getElementById('globalLeaderboardTab').addEventListener('click', () => this.loadLeaderboard('global'));
        document.getElementById('weeklyLeaderboardTab').addEventListener('click', () => this.loadLeaderboard('weekly'));

        // Quick actions
        document.getElementById('quickStudyBtn').addEventListener('click', () => this.quickStart('study'));
        document.getElementById('quickReviewBtn').addEventListener('click', () => this.quickStart('review'));

        // Import functionality
        document.getElementById('downloadTemplateBtn').addEventListener('click', () => this.downloadCSVTemplate());
        document.getElementById('csvImportBtn').addEventListener('click', () => {
            document.getElementById('csvInput').click();
        });
        document.getElementById('csvInput').addEventListener('change', (e) => this.handleCSVImport(e));
        document.getElementById('googleImportBtn').addEventListener('click', () => this.handleGoogleSheetsImport());

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

        // Reset all progress functionality
        const resetBtn = document.getElementById('resetAllToStudyingBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetAllProgress());
        } else {
            console.warn('⚠️ resetAllToStudyingBtn not found during initial setup - will retry later');
            // Try again after a short delay (in case the element loads later)
            setTimeout(() => {
                const retryResetBtn = document.getElementById('resetAllToStudyingBtn');
                if (retryResetBtn) {
                    retryResetBtn.addEventListener('click', () => this.resetAllProgress());
                    console.log('✅ resetAllToStudyingBtn event listener added on retry');
                } else {
                    console.error('❌ resetAllToStudyingBtn still not found after retry');
                }
            }, 1000);
        }

        // Settings functionality
        document.getElementById('addLanguagePairBtn').addEventListener('click', () => this.showLanguagePairDialog());
        document.getElementById('lessonSizeInput').addEventListener('change', (e) => this.updateLessonSize(e.target.value));
        document.getElementById('syncBtn').addEventListener('click', () => this.syncWithServer());
        document.getElementById('saveDailyGoalsBtn').addEventListener('click', () => this.saveDailyGoals());

        // Voice settings functionality
        this.setupVoiceSettings();

        // Event delegation for dynamically loaded buttons
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'resetAllToStudyingBtn') {
                console.log('🔄 Reset button clicked via event delegation');
                this.resetAllProgress();
            }
        });
    }

    setupAuthListeners() {
        // Auth tab switching
        document.getElementById('loginTab').addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('registerTab').addEventListener('click', () => this.switchAuthTab('register'));
        
        // Auth form submissions
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());
        document.getElementById('googleLoginBtn').addEventListener('click', () => this.handleGoogleLogin());
        
        // Enter key support for auth forms
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('registerPasswordConfirm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });
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
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showAuthError(i18n.t('fill_all_fields'));
            return;
        }
        
        try {
            await userManager.login(email, password);
            this.showSection('home');
            await this.updateStats();
            await this.loadGamificationHeader(); // Load XP/level/streak display
        } catch (error) {
            this.showAuthError(error.message);
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerPasswordConfirm').value;
        const nativeLang = document.getElementById('registerNativeLang')?.value || 'en';
        const targetLang = document.getElementById('registerTargetLang')?.value || 'es';
        
        if (!name || !email || !password || !confirmPassword) {
            this.showAuthError(i18n.t('fill_all_fields'));
            return;
        }
        
        if (password !== confirmPassword) {
            this.showAuthError(i18n.t('passwords_not_match'));
            return;
        }
        
        if (password.length < 6) {
            this.showAuthError(i18n.t('password_min_length'));
            return;
        }
        
        try {
            await userManager.register(name, email, password, nativeLang, targetLang);
            this.showSection('home');
            await this.updateStats();
            await this.loadGamificationHeader(); // Load XP/level/streak display
        } catch (error) {
            this.showAuthError(error.message);
        }
    }

    async handleGoogleLogin() {
        try {
            await userManager.loginWithGoogle();
            this.showSection('home');
            await this.updateStats();
            await this.loadGamificationHeader(); // Load XP/level/streak display
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

        // Listen for language changes to re-render quiz if active
        window.addEventListener('languageChanged', () => {
            // For now, just log that language changed during quiz
            // TODO: Implement proper quiz re-render when language changes
            if (this.currentSection === 'study' || this.currentSection === 'review') {
                console.log('⚠️ Language changed during quiz. Please restart quiz to see translations.');
            }
        });
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
        } else if (sectionName === 'challenges') {
            await window.featuresUI.loadDailyChallenges();
        } else if (sectionName === 'streakFreeze') {
            await window.featuresUI.loadStreakFreezes();
        } else if (sectionName === 'bugReports') {
            await window.featuresUI.loadRecentBugReports();
        } else if (sectionName === 'leagues') {
            // Initialize Leagues UI (only for whitelisted users)
            if (window.leaguesUI && userManager.hasGamificationAccess()) {
                if (!window.leaguesUI.initialized) {
                    await window.leaguesUI.init(userManager.currentUser.id);
                } else {
                    await window.leaguesUI.refresh();
                }
            }
        } else if (sectionName === 'weeklyChallenges') {
            // Initialize Weekly Challenges UI (only for whitelisted users)
            if (window.weeklyChallengesUI && userManager.hasGamificationAccess()) {
                if (!window.weeklyChallengesUI.initialized) {
                    await window.weeklyChallengesUI.init(userManager.currentUser.id);
                } else {
                    await window.weeklyChallengesUI.refresh();
                }
            }
        } else if (sectionName === 'personalRating') {
            // Initialize Personal Rating UI (only for whitelisted users)
            if (window.personalRatingUI && userManager.hasGamificationAccess()) {
                if (!window.personalRatingUI.initialized) {
                    await window.personalRatingUI.init(userManager.currentUser.id);
                } else {
                    await window.personalRatingUI.refresh();
                }
            }
        } else if (sectionName === 'personalInsights') {
            // Initialize Personal Insights UI (only for whitelisted users)
            if (window.personalInsightsUI && userManager.hasGamificationAccess()) {
                if (!window.personalInsightsUI.initialized) {
                    await window.personalInsightsUI.init(userManager.currentUser.id);
                } else {
                    await window.personalInsightsUI.refresh();
                }
            }
        } else if (sectionName === 'friends') {
            // Initialize Friends UI (only for whitelisted users)
            if (window.friendsUI && userManager.hasGamificationAccess()) {
                if (!window.friendsUI.initialized) {
                    await window.friendsUI.init(userManager.currentUser.id);
                } else {
                    await window.friendsUI.refresh();
                }
            }
        } else if (sectionName === 'duels') {
            // Initialize Duels UI (only for whitelisted users)
            if (window.duelsUI && userManager.hasGamificationAccess()) {
                if (!window.duelsUI.initialized) {
                    await window.duelsUI.init(userManager.currentUser.id);
                } else {
                    await window.duelsUI.refresh();
                }
            }
        } else if (sectionName === 'profile') {
            // Initialize Profile UI (only for whitelisted users)
            // Profile is shown via profileUI.viewProfile(userId), not via navigation
            if (window.profileUI && userManager.hasGamificationAccess()) {
                if (!window.profileUI.initialized) {
                    await window.profileUI.init(userManager.currentUser.id);
                }
                // Profile content is already rendered by viewProfile()
            }
        } else if (sectionName === 'achievements') {
            // Initialize Achievements UI (only for whitelisted users)
            if (window.achievementsUI && userManager.hasGamificationAccess()) {
                if (!window.achievementsUI.initialized) {
                    await window.achievementsUI.init(userManager.currentUser.id);
                } else {
                    await window.achievementsUI.refresh();
                }
            }
        } else if (sectionName === 'wordLists') {
            // Initialize Word Lists UI
            if (window.wordListsUI) {
                const languagePair = userManager.getCurrentLanguagePair();
                if (!window.wordListsUI.initialized) {
                    await window.wordListsUI.init(userManager.currentUser.id, languagePair?.id);
                } else {
                    await window.wordListsUI.refresh();
                }
            }
        } else if (sectionName === 'leaderboard') {
            await this.loadLeaderboard('global');
        } else if (sectionName === 'stats') {
            await this.updateStatsPage();
        } else if (sectionName === 'settings') {
            await this.updateSettingsPage();
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

            // Load daily goals
            await this.loadDailyGoals();
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

            // Load analytics
            await this.loadAnalytics();

            // Load gamification stats
            await this.loadGamificationStats();
        } catch (error) {
            console.error('Error updating stats page:', error);
        }
    }

    async updateWordLists() {
        try {
            // Load all review statuses (review_1, review_3, review_7, review_14, review_30, review_60, review_120)
            const [studying, review1, review3, review7, review14, review30, review60, review120, learned] = await Promise.all([
                database.getWordsByStatus('studying'),
                database.getWordsByStatus('review_1'),
                database.getWordsByStatus('review_3'),
                database.getWordsByStatus('review_7'),
                database.getWordsByStatus('review_14'),
                database.getWordsByStatus('review_30'),
                database.getWordsByStatus('review_60'),
                database.getWordsByStatus('review_120'),
                database.getWordsByStatus('learned')
            ]);

            this.renderWordList('studyingList', studying);
            this.renderWordList('reviewList', [...review1, ...review3, ...review7, ...review14, ...review30, ...review60, ...review120]);
            this.renderWordList('learnedList', learned);
        } catch (error) {
            console.error('Error updating word lists:', error);
        }
    }

    renderWordList(containerId, words) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (words.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #6c757d;">${i18n?.t('noWords') || 'No words'}</p>`;
            return;
        }

        words.forEach(word => {
            const item = document.createElement('div');
            item.className = 'word-item';

            // Word content wrapper
            const wordContent = document.createElement('div');
            wordContent.className = 'word-content';

            // Main word info container
            const wordMain = document.createElement('div');
            wordMain.className = 'word-main';

            // Word with audio button only if it's German
            const wordDiv = document.createElement('div');
            wordDiv.className = 'word-text';
            wordDiv.style.display = 'flex';
            wordDiv.style.alignItems = 'center';
            wordDiv.style.gap = '10px';
            wordDiv.innerHTML = `<span><strong>${word.word}</strong></span>`;
            if (this.shouldShowAudioButton(word.word)) {
                wordDiv.appendChild(this.createAudioButton(word.word, 'audio-btn-small'));
            }

            // Translation (no audio)
            const translationDiv = document.createElement('div');
            translationDiv.className = 'word-translation';
            translationDiv.textContent = word.translation;

            wordMain.appendChild(wordDiv);
            wordMain.appendChild(translationDiv);

            // Meta info (dates, status)
            const metaDiv = document.createElement('div');
            metaDiv.className = 'word-meta';
            metaDiv.style.fontSize = '12px';
            metaDiv.style.color = '#6c757d';
            metaDiv.style.marginTop = '5px';

            const createdAt = word.createdat || word.createdAt;
            const lastReviewed = word.lastreviewdate || word.lastReviewDate;

            const dateAdded = createdAt ? new Date(createdAt).toLocaleDateString('ru-RU') : 'N/A';
            const dateStudied = lastReviewed ? new Date(lastReviewed).toLocaleDateString('ru-RU') : i18n.t('not_studied');

            metaDiv.innerHTML = `📅 Added: ${dateAdded} | 📚 Studied: ${dateStudied}`;

            wordContent.appendChild(wordMain);
            wordContent.appendChild(metaDiv);

            // Score display with progress bar
            const score = this.calculateWordScore(word);
            const scoreDisplay = this.getScoreDisplay(score, word);
            const scoreContainer = document.createElement('div');
            scoreContainer.className = 'word-score-container';

            const scoreDiv = document.createElement('div');
            scoreDiv.className = `word-score ${scoreDisplay.className}`;
            scoreDiv.textContent = scoreDisplay.text;

            // Progress bar
            const progressBar = document.createElement('div');
            progressBar.className = 'word-progress-bar';
            progressBar.style.cssText = 'width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; margin-top: 5px; overflow: hidden;';

            const progressFill = document.createElement('div');
            progressFill.style.cssText = `width: ${score}%; height: 100%; background: ${score >= 70 ? '#4caf50' : score >= 50 ? '#ff9800' : '#f44336'}; transition: width 0.3s;`;
            progressBar.appendChild(progressFill);

            scoreContainer.appendChild(scoreDiv);
            scoreContainer.appendChild(progressBar);

            // Action buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'word-actions';
            actionsDiv.style.cssText = 'display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap;';

            // Delete button (always shown)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'word-action-btn delete-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete word';
            deleteBtn.style.cssText = 'padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
            deleteBtn.onclick = async () => {
                if (confirm(`Delete word "${word.word}"?`)) {
                    await this.deleteWordFromList(word.id);
                }
            };
            actionsDiv.appendChild(deleteBtn);

            // Mark as learned button (if not already learned)
            if (word.status !== 'learned') {
                const learnedBtn = document.createElement('button');
                learnedBtn.className = 'word-action-btn learned-btn';
                learnedBtn.innerHTML = '✅';
                learnedBtn.title = 'Mark as learned';
                learnedBtn.style.cssText = 'padding: 5px 10px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
                learnedBtn.onclick = async () => {
                    await this.markWordAsLearned(word.id);
                };
                actionsDiv.appendChild(learnedBtn);
            }

            // Move to next review stage button (if in review)
            if (word.status === 'studying' || word.status === 'review_7') {
                const nextStageBtn = document.createElement('button');
                nextStageBtn.className = 'word-action-btn next-stage-btn';
                nextStageBtn.innerHTML = '⏭️';
                const nextStatus = word.status === 'studying' ? 'review (7 days)' : 'review (30 days)';
                nextStageBtn.title = `Move to ${nextStatus}`;
                nextStageBtn.style.cssText = 'padding: 5px 10px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
                nextStageBtn.onclick = async () => {
                    await this.moveWordToNextStage(word.id, word.status);
                };
                actionsDiv.appendChild(nextStageBtn);
            }

            console.log(`🔧 Rendering word "${word.word}" (status: ${word.status}) with ${actionsDiv.children.length} action button(s)`);

            item.appendChild(wordContent);
            item.appendChild(scoreContainer);
            item.appendChild(actionsDiv);
            container.appendChild(item);
        });
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
            const user = userManager.getCurrentUser();
            const languagePair = userManager.getCurrentLanguagePair();

            if (!user || !languagePair) {
                this.showImportStatus('Please select a language pair first', 'error');
                return;
            }

            const text = await file.text();
            const words = ImportManager.parseCSV(text);

            if (words.length === 0) {
                this.showImportStatus('File contains no valid data', 'error');
                return;
            }

            // Add userId and languagePairId to each word
            const wordsWithMetadata = words.map(word => ({
                ...word,
                userId: user.id,
                languagePairId: languagePair.id
            }));

            await database.addWords(wordsWithMetadata);
            this.showImportStatus(`Successfully imported ${words.length} words`, 'success');
            await this.updateStats();

        } catch (error) {
            console.error('CSV Import Error:', error);
            this.showImportStatus('Error importing CSV file', 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    downloadCSVTemplate() {
        const template = `Слово,Приmер,Перевод,Перевод приmера
laufen,Ich laufe jeden Tag im Park.,Бегать,Я бегаю каждый день в парке.
sprechen,Er spricht drei Sprachen.,Говорить,Он говорит на трёх языках.
schreiben,Sie schreibt einen Brief.,Писать,Она пишет письmо.`;

        const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'words_template.csv';
        link.click();
        URL.revokeObjectURL(link.href);

        this.showImportStatus(i18n.t('csv_template_downloaded'), 'success');
    }

    async handleGoogleSheetsImport() {
        const url = document.getElementById('googleSheetsUrl').value.trim();
        if (!url) {
            this.showImportStatus('Please enter Google Sheets URL', 'error');
            return;
        }

        try {
            const user = userManager.getCurrentUser();
            const languagePair = userManager.getCurrentLanguagePair();

            if (!user || !languagePair) {
                this.showImportStatus('Please select a language pair first', 'error');
                return;
            }

            this.showImportStatus('Loading data...', 'info');
            const words = await ImportManager.fetchGoogleSheets(url);

            console.log('📥 Received words from Google Sheets:', words);

            if (!words || words.length === 0) {
                this.showImportStatus('Spreadsheet contains no valid data', 'error');
                return;
            }

            // Add userId and languagePairId to each word
            const wordsWithMetadata = words.map(word => ({
                ...word,
                userId: user.id,
                languagePairId: languagePair.id
            }));

            await database.addWords(wordsWithMetadata);
            this.showImportStatus(`Successfully imported ${words.length} words`, 'success');
            await this.updateStats();

            // Clear input
            document.getElementById('googleSheetsUrl').value = '';

        } catch (error) {
            console.error('Google Sheets Import Error:', error);
            this.showImportStatus(error.message, 'error');
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
            console.log('🎮 Starting study quiz, type:', quizType);
            console.log('👤 Current user:', userManager.getCurrentUser());
            console.log('🌍 Current language pair:', userManager.getCurrentLanguagePair());

            const lessonSize = userManager.getLessonSize();
            console.log('📚 Lesson size:', lessonSize);

            this.currentQuizData = await quizManager.startQuiz('study', quizType, lessonSize);
            this.showQuizInterface();
            this.renderQuestion(this.currentQuizData);
        } catch (error) {
            console.error('Error starting study quiz:', error);

            // Show friendly message for no words
            if (error.message.includes('No words')) {
                if (window.showToast) {
                    showToast(i18n?.t('no_words_to_study') || 'No words to study. Please import some words first!', 'info');
                } else {
                    alert(i18n?.t('no_words_to_study') || 'No words to study. Please import some words first!');
                }
                // Redirect to import section
                this.showSection('import');
            } else {
                if (window.showToast) {
                    showToast(error.message, 'error');
                } else {
                    alert(error.message);
                }
            }
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

            // Show friendly message for no words
            if (error.message.includes('No words')) {
                if (window.showToast) {
                    showToast(i18n?.t('no_words_to_review') || 'No words to review. Study some words first!', 'info');
                } else {
                    alert(i18n?.t('no_words_to_review') || 'No words to review. Study some words first!');
                }
                // Redirect to study section
                this.showSection('study');
            } else {
                if (window.showToast) {
                    showToast(error.message, 'error');
                } else {
                    alert(error.message);
                }
            }
        }
    }

    showQuizInterface() {
        document.getElementById('studyModeSelect').style.display = 'none';
        document.getElementById('quizArea').classList.remove('hidden');
    }

    showReviewInterface() {
        document.getElementById('reviewModeSelect').style.display = 'none';
        document.getElementById('reviewQuizArea').classList.remove('hidden');
    }

    renderQuestion(quizData) {
        const { question, questionNumber, totalQuestions, progress } = quizData;
        
        document.getElementById('questionCounter').textContent = `${i18n?.t('question') || 'Question'} ${questionNumber} ${i18n?.t('of') || 'of'} ${totalQuestions}`;
        document.getElementById('progressFill').style.width = `${progress}%`;
        
        const questionTextEl = document.getElementById('questionText');
        questionTextEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <strong>${question.questionText}</strong>
            </div>
            ${question.example ? `<div style="display: flex; align-items: center; gap: 10px;">
                <small style="color: #6c757d; font-style: italic;">${question.example}</small>
            </div>` : ''}
        `;

        // Add audio buttons only for foreign text using language detection
        // But NOT for multiple choice questions where user needs to pick from options
        if (this.shouldShowAudioButton(question.questionText) && question.type !== 'multipleChoice') {
            const questionAudioBtn = this.createAudioButton(question.questionText);
            questionTextEl.querySelector('div:first-child').appendChild(questionAudioBtn);
        }

        if (question.example && this.shouldShowAudioButton(question.example)) {
            const exampleAudioBtn = this.createAudioButton(question.example);
            questionTextEl.querySelectorAll('div')[1]?.appendChild(exampleAudioBtn);
        }

        const answerArea = document.getElementById('answerArea');
        answerArea.innerHTML = '';

        if (question.type === 'multipleChoice' || question.type === 'reverseMultipleChoice') {
            question.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'choice-btn';
                button.dataset.choiceIndex = index;
                button.innerHTML = `<span class="choice-number">${index + 1}</span> ${choice.text}`;
                button.onclick = () => this.handleMultipleChoice(choice.text, button);
                answerArea.appendChild(button);
            });

            // Add skip button for multiple choice
            const skipBtnContainer = document.createElement('div');
            skipBtnContainer.style.marginTop = '1rem';
            skipBtnContainer.style.textAlign = 'center';

            const skipBtn = document.createElement('button');
            skipBtn.className = 'action-btn show-answer-btn';
            skipBtn.textContent = i18n.t('skip');
            skipBtn.onclick = () => this.skipMultipleChoice();
            skipBtnContainer.appendChild(skipBtn);

            answerArea.appendChild(skipBtnContainer);
        } else if (question.type === 'wordBuilding') {
            this.renderWordBuildingInterface(question, answerArea);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.placeholder = i18n.t('enterAnswer');
            input.dataset.enterPressed = 'false';
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.handleEnterPress(input);
                }
            };
            answerArea.appendChild(input);

            // Auto-focus on desktop only (not on mobile to prevent keyboard popup)
            // Check if device is not touch-enabled
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (!isTouchDevice) {
                // Small delay to ensure element is fully rendered
                setTimeout(() => {
                    input.focus();
                    console.log('🎯 Auto-focused typing input');
                }, 100);
            }

            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '1rem';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '1rem';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.flexWrap = 'wrap';

            const submitBtn = document.createElement('button');
            submitBtn.className = 'action-btn';
            submitBtn.textContent = i18n.t('submit');
            submitBtn.onclick = () => this.handleTypingAnswer(input.value, input);
            buttonContainer.appendChild(submitBtn);

            const showAnswerBtn = document.createElement('button');
            showAnswerBtn.className = 'action-btn show-answer-btn';
            showAnswerBtn.textContent = i18n.t('showAnswer');
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
        
        document.getElementById('reviewQuestionCounter').textContent = `${i18n?.t('question') || 'Question'} ${questionNumber} ${i18n?.t('of') || 'of'} ${totalQuestions}`;
        document.getElementById('reviewProgressFill').style.width = `${progress}%`;
        
        const questionTextEl = document.getElementById('reviewQuestionText');
        questionTextEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <strong>${question.questionText}</strong>
            </div>
            ${question.example ? `<div style="display: flex; align-items: center; gap: 10px;">
                <small style="color: #6c757d; font-style: italic;">${question.example}</small>
            </div>` : ''}
        `;

        // Add audio buttons only for German text using language detection
        // But NOT for multiple choice questions where user needs to pick from options
        if (this.isGermanText(question.questionText) && question.type !== 'multipleChoice') {
            const questionAudioBtn = this.createAudioButton(question.questionText);
            questionTextEl.querySelector('div:first-child').appendChild(questionAudioBtn);
        }

        if (question.example && this.isGermanText(question.example)) {
            const exampleAudioBtn = this.createAudioButton(question.example);
            questionTextEl.querySelectorAll('div')[1]?.appendChild(exampleAudioBtn);
        }

        const answerArea = document.getElementById('reviewAnswerArea');
        answerArea.innerHTML = '';

        if (question.type === 'multipleChoice' || question.type === 'reverseMultipleChoice') {
            question.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'choice-btn';
                button.dataset.choiceIndex = index;
                button.innerHTML = `<span class="choice-number">${index + 1}</span> ${choice.text}`;
                button.onclick = () => this.handleReviewMultipleChoice(choice.text, button);
                answerArea.appendChild(button);
            });

            // Add skip button for multiple choice in review mode
            const skipBtnContainer = document.createElement('div');
            skipBtnContainer.style.marginTop = '1rem';
            skipBtnContainer.style.textAlign = 'center';

            const skipBtn = document.createElement('button');
            skipBtn.className = 'action-btn show-answer-btn';
            skipBtn.textContent = i18n.t('skip');
            skipBtn.onclick = () => this.skipReviewMultipleChoice();
            skipBtnContainer.appendChild(skipBtn);

            answerArea.appendChild(skipBtnContainer);
        } else if (question.type === 'wordBuilding') {
            this.renderWordBuildingInterface(question, answerArea);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'text-input';
            input.placeholder = i18n.t('enterAnswer');
            input.dataset.enterPressed = 'false';
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.handleReviewEnterPress(input);
                }
            };
            answerArea.appendChild(input);

            // Auto-focus on desktop only (not on mobile to prevent keyboard popup)
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (!isTouchDevice) {
                setTimeout(() => {
                    input.focus();
                    console.log('🎯 Auto-focused review typing input');
                }, 100);
            }

            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '1rem';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '1rem';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.flexWrap = 'wrap';

            const submitBtn = document.createElement('button');
            submitBtn.className = 'action-btn';
            submitBtn.textContent = i18n.t('submit');
            submitBtn.onclick = () => this.handleReviewTypingAnswer(input.value, input);
            buttonContainer.appendChild(submitBtn);

            const showAnswerBtn = document.createElement('button');
            showAnswerBtn.className = 'action-btn show-answer-btn';
            showAnswerBtn.textContent = i18n.t('showAnswer');
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
        const result = await quizManager.checkAnswer(answer);
        this.showAnswerFeedback(result, 'feedback');
        this.disableChoiceButtons();

        // Hide skip button after answer is selected
        const skipBtn = document.querySelector('.show-answer-btn');
        if (skipBtn) {
            skipBtn.style.display = 'none';
        }

        if (result.correct) {
            buttonEl.classList.add('correct');
            // Add audio button to correct answer if it's foreign language
            if (this.shouldShowAudioButton(buttonEl.textContent)) {
                this.addAudioToButton(buttonEl, buttonEl.textContent);
            }
        } else {
            buttonEl.classList.add('incorrect');
            // Highlight correct answer and add audio if foreign language
            document.querySelectorAll('.choice-btn').forEach(btn => {
                if (btn.textContent === result.correctAnswer) {
                    btn.classList.add('correct');
                    if (this.shouldShowAudioButton(btn.textContent)) {
                        this.addAudioToButton(btn, btn.textContent);
                    }
                }
            });
        }

        // On last question, automatically finish after a short delay
        if (quizManager.isQuizComplete()) {
            setTimeout(() => this.finishStudy(), 1500);
        } else {
            this.showNextButton();
        }
    }

    async skipMultipleChoice() {
        // Submit empty answer to mark as skipped
        const result = await quizManager.checkAnswer('__SKIP__');

        // Show feedback indicating skipped
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `
            <div class="feedback-content skipped">
                <p><strong>${i18n.t('skipped')}</strong></p>
                <p>${i18n.t('correctAnswerWas')}: <strong>${result.correctAnswer}</strong></p>
            </div>
        `;
        feedback.className = 'feedback incorrect';

        // Highlight correct answer
        document.querySelectorAll('.choice-btn').forEach(btn => {
            const btnText = btn.textContent.replace(/^\d+\s*/, '').trim();
            if (btnText === result.correctAnswer) {
                btn.classList.add('correct');
                if (this.shouldShowAudioButton(result.correctAnswer)) {
                    this.addAudioToButton(btn, result.correctAnswer);
                }
            }
        });

        this.disableChoiceButtons();

        // Transform skip button into next/finish button
        const skipBtn = document.querySelector('.show-answer-btn');
        if (skipBtn) {
            skipBtn.classList.remove('show-answer-btn');
            skipBtn.classList.add('action-btn');

            if (quizManager.isQuizComplete()) {
                skipBtn.textContent = i18n.t('finish');
                skipBtn.onclick = () => this.finishStudy();
            } else {
                skipBtn.textContent = i18n.t('next');
                skipBtn.onclick = () => this.nextQuestion();
            }
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

        // Make field readonly instead of disabled (keeps focus and allows Enter key)
        inputEl.readOnly = true;
        // Disable all buttons in the container
        const buttonContainer = inputEl.parentElement.querySelector('div');
        if (buttonContainer) {
            buttonContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }

        // On last question, automatically finish after a short delay
        if (quizManager.isQuizComplete()) {
            setTimeout(() => this.finishStudy(), 1500);
        } else {
            this.showNextButton();
            // Keep focus on input for Enter key to work for next question
            inputEl.focus();
        }
    }

    async handleReviewMultipleChoice(answer, buttonEl) {
        const result = await quizManager.checkAnswer(answer);
        this.showAnswerFeedback(result, 'reviewFeedback');
        this.disableReviewChoiceButtons();

        // Hide skip button after answer is selected
        const skipBtn = document.querySelector('#reviewAnswerArea .show-answer-btn');
        if (skipBtn) {
            skipBtn.style.display = 'none';
        }

        if (result.correct) {
            buttonEl.classList.add('correct');
            // Add audio button to correct answer if it's foreign language
            if (this.shouldShowAudioButton(buttonEl.textContent)) {
                this.addAudioToButton(buttonEl, buttonEl.textContent);
            }
        } else {
            buttonEl.classList.add('incorrect');
            document.querySelectorAll('#reviewAnswerArea .choice-btn').forEach(btn => {
                if (btn.textContent === result.correctAnswer) {
                    btn.classList.add('correct');
                    if (this.shouldShowAudioButton(btn.textContent)) {
                        this.addAudioToButton(btn, btn.textContent);
                    }
                }
            });
        }

        // On last question, automatically finish after a short delay
        if (quizManager.isQuizComplete()) {
            setTimeout(() => this.finishReview(), 1500);
        } else {
            this.showReviewNextButton();
        }
    }

    async skipReviewMultipleChoice() {
        // Submit empty answer to mark as skipped
        const result = await quizManager.checkAnswer('__SKIP__');

        // Show feedback indicating skipped
        const feedback = document.getElementById('reviewFeedback');
        feedback.innerHTML = `
            <div class="feedback-content skipped">
                <p><strong>${i18n.t('skipped')}</strong></p>
                <p>${i18n.t('correctAnswerWas')}: <strong>${result.correctAnswer}</strong></p>
            </div>
        `;
        feedback.className = 'feedback incorrect';

        // Highlight correct answer
        document.querySelectorAll('#reviewAnswerArea .choice-btn').forEach(btn => {
            const btnText = btn.textContent.replace(/^\d+\s*/, '').trim();
            if (btnText === result.correctAnswer) {
                btn.classList.add('correct');
                if (this.shouldShowAudioButton(result.correctAnswer)) {
                    this.addAudioToButton(btn, result.correctAnswer);
                }
            }
        });

        this.disableReviewChoiceButtons();

        // Transform skip button into next/finish button
        const skipBtn = document.querySelector('#reviewAnswerArea .show-answer-btn');
        if (skipBtn) {
            skipBtn.classList.remove('show-answer-btn');
            skipBtn.classList.add('action-btn');

            if (quizManager.isQuizComplete()) {
                skipBtn.textContent = i18n.t('finish');
                skipBtn.onclick = () => this.finishReview();
            } else {
                skipBtn.textContent = i18n.t('next');
                skipBtn.onclick = () => this.nextReviewQuestion();
            }
        }
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

        // Make field readonly instead of disabled (keeps focus and allows Enter key)
        inputEl.readOnly = true;
        // Disable all buttons in the container
        const buttonContainer = inputEl.parentElement.querySelector('div');
        if (buttonContainer) {
            buttonContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }

        // On last question, automatically finish after a short delay
        if (quizManager.isQuizComplete()) {
            setTimeout(() => this.finishReview(), 1500);
        } else {
            this.showReviewNextButton();
            // Keep focus on input for Enter key to work for next question
            inputEl.focus();
        }
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
        if (!textToSpeak && result.feedback && result.feedback.includes(i18n.t('correct_answer'))) {
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
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishStudyBtn');

        if (quizManager.isQuizComplete()) {
            // On last question, show finish button instead of next
            nextBtn.classList.add('hidden');
            finishBtn.classList.remove('hidden');

            // Scroll to show the button on mobile
            this.scrollToButton(finishBtn);
        } else {
            // On regular questions, show next button
            nextBtn.classList.remove('hidden');
            finishBtn.classList.add('hidden');

            // Scroll to show the button on mobile
            this.scrollToButton(nextBtn);
        }
    }

    showReviewNextButton() {
        const nextBtn = document.getElementById('reviewNextBtn');
        const finishBtn = document.getElementById('finishReviewBtn');

        if (quizManager.isQuizComplete()) {
            // On last question, show finish button instead of next
            nextBtn.classList.add('hidden');
            finishBtn.classList.remove('hidden');

            // Scroll to show the button on mobile
            this.scrollToButton(finishBtn);
        } else {
            // On regular questions, show next button
            nextBtn.classList.remove('hidden');
            finishBtn.classList.add('hidden');

            // Scroll to show the button on mobile
            this.scrollToButton(nextBtn);
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
        const message = `${i18n.t('quizCompleted')}\n${i18n.t('result')}: ${results.score}/${results.totalQuestions} (${results.percentage}%)`;
        alert(message);

        this.resetQuizInterface();
        quizManager.reset();
        this.updateStats();
    }

    finishReview() {
        const results = quizManager.getQuizResults();
        const message = `${i18n.t('reviewCompleted')}\n${i18n.t('result')}: ${results.score}/${results.totalQuestions} (${results.percentage}%)`;
        alert(message);

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

    async deleteWord(wordId) {
        // Feature temporarily disabled - requires server endpoint
        alert(i18n.t('deleteFeatureDisabled'));
        console.warn('deleteWord: Not implemented on server');
    }

    async deleteWordFromList(wordId) {
        try {
            const response = await fetch(`/api/words/${wordId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete word');
            }

            if (window.showToast) {
                showToast('✅ Word deleted', 'success');
            }

            // Reload word lists and stats with delay to avoid rate limiting
            await this.updateWordLists();

            // Small delay before updating stats to avoid 429 errors
            await new Promise(resolve => setTimeout(resolve, 200));

            try {
                await this.updateStats();
            } catch (statsError) {
                console.warn('Stats update failed (non-critical):', statsError);
                // Don't show error to user - word was deleted successfully
            }

        } catch (error) {
            console.error('Error deleting word:', error);
            if (window.showToast) {
                showToast('❌ Failed to delete word', 'error');
            } else {
                alert('Failed to delete word');
            }
        }
    }

    async markWordAsLearned(wordId) {
        try {
            const response = await fetch(`/api/words/${wordId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'learned' })
            });

            if (!response.ok) {
                throw new Error('Failed to mark word as learned');
            }

            if (window.showToast) {
                showToast('✅ Word marked as learned', 'success');
            }

            // Reload word lists and stats with delay to avoid rate limiting
            await this.updateWordLists();

            // Small delay before updating stats to avoid 429 errors
            await new Promise(resolve => setTimeout(resolve, 200));

            try {
                await this.updateStats();
            } catch (statsError) {
                console.warn('Stats update failed (non-critical):', statsError);
                // Don't show error to user - word status was updated successfully
            }

        } catch (error) {
            console.error('Error marking word as learned:', error);
            if (window.showToast) {
                showToast('❌ Failed to mark as learned', 'error');
            } else {
                alert('Failed to mark word as learned');
            }
        }
    }

    async moveWordToNextStage(wordId, currentStatus) {
        try {
            // First, get the word to check its reviewCycle
            const word = await database.getWordById(wordId);
            if (!word) {
                throw new Error('Word not found');
            }

            // SRS interval schedule (in days) - same as server
            const srsIntervals = [1, 3, 7, 14, 30, 60, 120];

            let nextStatus;
            let reviewCycle = word.reviewcycle || word.reviewCycle || 0;

            if (currentStatus === 'studying') {
                // Move from studying to first review interval
                const intervalDays = srsIntervals[reviewCycle];
                nextStatus = `review_${intervalDays}`;
            } else if (currentStatus.startsWith('review_')) {
                // Already in review - move to next interval
                reviewCycle++;
                if (reviewCycle < srsIntervals.length) {
                    const intervalDays = srsIntervals[reviewCycle];
                    nextStatus = `review_${intervalDays}`;
                } else {
                    // Completed all cycles - mark as learned
                    nextStatus = 'learned';
                }
            } else {
                return; // No next stage
            }

            const response = await fetch(`/api/words/${wordId}/manual-advance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: nextStatus,
                    reviewCycle: nextStatus === 'learned' ? reviewCycle : reviewCycle
                })
            });

            if (!response.ok) {
                throw new Error('Failed to move word to next stage');
            }

            const statusName = nextStatus === 'learned'
                ? 'Learned'
                : `Review (${nextStatus.replace('review_', '')} days)`;
            if (window.showToast) {
                showToast(`✅ Moved to ${statusName}`, 'success');
            }

            // Reload word lists and stats with delay to avoid rate limiting
            await this.updateWordLists();

            // Small delay before updating stats to avoid 429 errors
            await new Promise(resolve => setTimeout(resolve, 200));

            try {
                await this.updateStats();
            } catch (statsError) {
                console.warn('Stats update failed (non-critical):', statsError);
                // Don't show error to user - word status was updated successfully
            }

        } catch (error) {
            console.error('Error moving word to next stage:', error);
            if (window.showToast) {
                showToast('❌ Failed to move word', 'error');
            } else {
                alert('Failed to move word to next stage');
            }
        }
    }

    async moveWordToStatus(wordId, newStatus) {
        // Feature temporarily disabled - requires server endpoint
        alert(i18n.t('moveFeatureDisabled'));
        console.warn('moveWordToStatus: Not implemented on server');
    }

    async resetAllWordsToStudying() {
        // Show confirmation dialog
        const confirmed = confirm(
            'Are you sure you want to reset ALL words to "studying" status and clear all progress?\n\n' +
            'This action is IRREVERSIBLE!\n\n' +
            'All XP, correct/incorrect counts, and review dates will be lost.'
        );

        if (!confirmed) {
            return;
        }

        try {
            const user = userManager.getCurrentUser();
            const languagePair = userManager.getCurrentLanguagePair();

            if (!user || !languagePair) {
                alert('Please select a language pair first.');
                return;
            }

            // Show loading indicator
            if (window.showToast) {
                showToast('Resetting all progress...', 'info');
            }

            const response = await fetch(
                `/api/words/bulk/reset-to-studying?userId=${user.id}&languagePairId=${languagePair.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to reset progress');
            }

            const result = await response.json();

            // Show success message
            if (window.showToast) {
                showToast(`✅ ${result.updatedCount} words reset to studying status!`, 'success');
            } else {
                alert(`Successfully reset ${result.updatedCount} words to studying status!`);
            }

            // Reload words and stats
            await this.loadWords();
            await this.updateStats();
            this.renderWords();

        } catch (error) {
            console.error('Error resetting progress:', error);
            if (window.showToast) {
                showToast('❌ Failed to reset progress', 'error');
            } else {
                alert('Failed to reset progress: ' + error.message);
            }
        }
    }

    async resetAllProgress() {
        // Alias for resetAllWordsToStudying
        await this.resetAllWordsToStudying();
    }

    async exportWords(status = null) {
        try {
            // Show loading indicator
            if (window.showToast) {
                showToast('Экспорт слов...', 'info');
            }

            const csvContent = await database.exportWords(status);

            if (!csvContent) {
                alert(i18n.t('noDataToExport'));
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

            // Show success message
            if (window.showToast) {
                showToast('✓ Экспорт завершен', 'success');
            }

        } catch (error) {
            console.error('Export error:', error);

            // Show user-friendly error message
            let errorMsg = i18n.t('exportError');
            if (error.message && error.message.includes('429')) {
                errorMsg = 'Слишком много запросов. Пожалуйста, подождите немного и попробуйте снова.';
            }

            if (window.showToast) {
                showToast(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
        }
    }

    handleEnterPress(inputEl) {
        // If field is readonly, it means answer was already submitted
        // Allow Enter to proceed to next question or finish
        if (inputEl.readOnly) {
            if (!document.getElementById('nextBtn').classList.contains('hidden')) {
                this.nextQuestion();
            } else if (!document.getElementById('finishStudyBtn').classList.contains('hidden')) {
                this.finishQuiz();
            }
            return;
        }

        // Field is editable - first Enter press
        if (inputEl.dataset.enterPressed === 'false') {
            inputEl.dataset.enterPressed = 'true';

            if (!inputEl.value.trim()) {
                // If field is empty, show answer
                this.showAnswer(inputEl);
            } else {
                // If field has input, submit answer
                this.handleTypingAnswer(inputEl.value, inputEl);
            }
        }
    }

    handleReviewEnterPress(inputEl) {
        // If field is readonly, it means answer was already submitted
        // Allow Enter to proceed to next question or finish
        if (inputEl.readOnly) {
            if (!document.getElementById('reviewNextBtn').classList.contains('hidden')) {
                this.nextReviewQuestion();
            } else if (!document.getElementById('finishReviewBtn').classList.contains('hidden')) {
                this.finishReview();
            }
            return;
        }

        // Field is editable - first Enter press
        if (inputEl.dataset.enterPressed === 'false') {
            inputEl.dataset.enterPressed = 'true';

            if (!inputEl.value.trim()) {
                // If field is empty, show answer
                this.showReviewAnswer(inputEl);
            } else {
                // If field has input, submit answer
                this.handleReviewTypingAnswer(inputEl.value, inputEl);
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
        wordInput.placeholder = i18n.t('buildTheWord');
        wordInput.dataset.enterPressed = 'false';

        // Prevent mobile keyboard from appearing automatically
        wordInput.readOnly = true;
        wordInput.inputMode = 'none'; // Prevent keyboard on mobile

        wordInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.handleWordBuildingEnter(wordInput, question);
            }
        };
        wordInput.onkeydown = (e) => {
            if (e.key === 'Backspace' && wordInput.value.length > 0 && !wordInput.disabled) {
                e.preventDefault();
                this.handleWordBuildingBackspace(wordInput);
            }
        };

        // Allow user to click and type manually if they want (desktop)
        wordInput.onclick = () => {
            if (!wordInput.disabled && window.innerWidth > 768) {
                wordInput.readOnly = false;
                wordInput.inputMode = 'text';
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
        clearBtn.textContent = i18n.t('clear');
        clearBtn.onclick = () => this.clearBuiltWord(wordInput, letterTiles);
        controls.appendChild(clearBtn);

        const submitBtn = document.createElement('button');
        submitBtn.className = 'action-btn';
        submitBtn.textContent = i18n.t('submit');
        submitBtn.onclick = () => this.handleWordBuildingSubmit(wordInput, question);
        controls.appendChild(submitBtn);

        const skipBtn = document.createElement('button');
        skipBtn.className = 'action-btn show-answer-btn';
        skipBtn.textContent = i18n.t('skip');
        skipBtn.onclick = () => this.skipWordBuilding(wordInput, question);
        controls.appendChild(skipBtn);
        
        wordBuildingArea.appendChild(controls);
        answerArea.appendChild(wordBuildingArea);
        // wordInput.focus(); // Disabled: Don't auto-focus to prevent keyboard popup on mobile
    }
    
    handleLetterClick(tile, wordInput) {
        if (tile.disabled || wordInput.disabled) return;

        // Temporarily remove readonly to update value
        const wasReadOnly = wordInput.readOnly;
        wordInput.readOnly = false;
        wordInput.value += tile.dataset.letter;
        if (wasReadOnly) {
            wordInput.readOnly = true; // Restore readonly state
        }

        tile.disabled = true;
        tile.classList.add('used');

        // Check if all letters are used and disable skip button
        this.updateSkipButtonState(wordInput);
        // wordInput.focus(); // Disabled: Don't auto-focus to prevent keyboard popup on mobile
    }

    handleWordBuildingBackspace(wordInput) {
        if (wordInput.value.length === 0) return;

        // Get the last letter
        const lastLetter = wordInput.value.slice(-1);

        // Temporarily remove readonly to update value
        const wasReadOnly = wordInput.readOnly;
        wordInput.readOnly = false;

        // Remove last letter from input
        wordInput.value = wordInput.value.slice(0, -1);

        if (wasReadOnly) {
            wordInput.readOnly = true; // Restore readonly state
        }

        // Find and re-enable the first disabled tile with this letter
        const letterTiles = wordInput.parentElement.querySelector('.letter-tiles');
        const tiles = letterTiles.querySelectorAll('.letter-tile');

        for (let tile of tiles) {
            if (tile.disabled && tile.dataset.letter === lastLetter) {
                tile.disabled = false;
                tile.classList.remove('used');
                break;
            }
        }

        // Re-enable skip button since not all letters are used
        this.updateSkipButtonState(wordInput);
    }
    
    clearBuiltWord(wordInput, letterTiles) {
        if (wordInput.disabled) return;

        // Temporarily remove readonly to update value
        const wasReadOnly = wordInput.readOnly;
        wordInput.readOnly = false;

        wordInput.value = '';

        if (wasReadOnly) {
            wordInput.readOnly = true; // Restore readonly state
        }

        letterTiles.querySelectorAll('.letter-tile').forEach(tile => {
            tile.disabled = false;
            tile.classList.remove('used');
        });

        // Re-enable skip button since not all letters are used
        this.updateSkipButtonState(wordInput);
        // wordInput.focus(); // Disabled: Don't auto-focus to prevent keyboard popup on mobile
    }

    updateSkipButtonState(wordInput) {
        if (!wordInput || wordInput.disabled) return;

        // Find the letter tiles and skip button
        const wordBuildingArea = wordInput.parentElement;
        if (!wordBuildingArea) return;

        const letterTiles = wordBuildingArea.querySelector('.letter-tiles');
        if (!letterTiles) return;

        const skipBtn = wordBuildingArea.querySelector('.show-answer-btn');
        if (!skipBtn) return;

        // Check if all tiles are used (disabled)
        const tiles = letterTiles.querySelectorAll('.letter-tile');
        const allTilesUsed = Array.from(tiles).every(tile => tile.disabled);

        // Disable skip button if all letters are used, enable otherwise
        if (allTilesUsed) {
            skipBtn.disabled = true;
            skipBtn.style.opacity = '0.5';
            skipBtn.style.cursor = 'not-allowed';
        } else {
            skipBtn.disabled = false;
            skipBtn.style.opacity = '1';
            skipBtn.style.cursor = 'pointer';
        }
    }

    handleWordBuildingEnter(wordInput, question) {
        if (wordInput.disabled) return;
        
        // If enter not pressed yet, submit answer or show answer if empty
        if (wordInput.dataset.enterPressed === 'false') {
            wordInput.dataset.enterPressed = 'true';
            
            if (!wordInput.value.trim()) {
                // If field is empty, skip question
                this.skipWordBuilding(wordInput, question);
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
        // Hide letter tiles and controls to save space on mobile
        const controls = wordInput.parentElement.querySelector('.word-building-controls');
        controls.style.display = 'none';
        const tiles = wordInput.parentElement.querySelector('.letter-tiles');
        tiles.style.display = 'none';

        // On last question, automatically finish after a short delay
        if (quizManager.isQuizComplete()) {
            setTimeout(() => this.finishStudy(), 1500);
        } else {
            this.showNextButton();
        }
    }
    
    async skipWordBuilding(wordInput, question) {
        // Submit empty answer to mark as skipped
        const result = await quizManager.checkAnswer('__SKIP__');

        wordInput.value = question.correctAnswer;
        wordInput.classList.add('incorrect');
        wordInput.disabled = true;

        // Hide letter tiles
        const tiles = wordInput.parentElement.querySelector('.letter-tiles');
        tiles.style.display = 'none';

        // Show feedback with audio button
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `
            <div class="feedback-content skipped">
                <p><strong>${i18n.t('skipped')}</strong></p>
                <p>${i18n.t('correctAnswerWas')}: <strong>${result.correctAnswer}</strong></p>
            </div>
        `;
        feedback.className = 'feedback incorrect';

        // Add audio button for the correct answer if it's German text
        if (result.correctAnswer && this.shouldShowAudioButton(result.correctAnswer)) {
            const audioBtn = this.createAudioButton(result.correctAnswer, 'audio-btn-small');
            audioBtn.style.marginLeft = '10px';
            feedback.appendChild(audioBtn);
        }

        // Transform skip button into next/finish button
        const skipBtn = wordInput.parentElement.querySelector('.show-answer-btn');
        if (skipBtn) {
            skipBtn.classList.remove('show-answer-btn');
            skipBtn.classList.add('action-btn');

            if (quizManager.isQuizComplete()) {
                skipBtn.textContent = i18n.t('finish');
                skipBtn.onclick = () => this.finishStudy();
            } else {
                skipBtn.textContent = i18n.t('next');
                skipBtn.onclick = () => this.nextQuestion();
            }
        }

        // Hide submit and clear buttons
        const controls = wordInput.parentElement.querySelector('.word-building-controls');
        const submitBtn = controls.querySelector('button:not(.clear-word-btn)');
        const clearBtn = controls.querySelector('.clear-word-btn');
        if (submitBtn) submitBtn.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
    }

    async showAnswer(inputEl) {
        // Get the current question
        const question = quizManager.questions[quizManager.currentQuestionIndex];

        // Show the correct answer in the input field
        inputEl.value = question.correctAnswer;
        inputEl.classList.add('incorrect');
        // Make field readonly instead of disabled (keeps focus and allows Enter key)
        inputEl.readOnly = true;

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

        // Keep focus on input for Enter key to work for next question
        inputEl.focus();
    }

    async showReviewAnswer(inputEl) {
        // Get the current question
        const question = quizManager.questions[quizManager.currentQuestionIndex];

        // Show the correct answer in the input field
        inputEl.value = question.correctAnswer;
        inputEl.classList.add('incorrect');
        // Make field readonly instead of disabled (keeps focus and allows Enter key)
        inputEl.readOnly = true;

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

        // Keep focus on input for Enter key to work for next question
        inputEl.focus();
    }

    scrollToButton(buttonElement) {
        // Scroll to make button visible on mobile devices
        if (!buttonElement) return;

        // Small delay to ensure DOM is updated
        setTimeout(() => {
            // Scroll button into view with some padding at the bottom
            buttonElement.scrollIntoView({
                behavior: 'smooth',
                block: 'end',  // Align to bottom of visible area
                inline: 'nearest'
            });

            // Add extra scroll padding on mobile for better visibility
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    window.scrollBy({
                        top: -20,  // Add 20px padding from bottom
                        behavior: 'smooth'
                    });
                }, 150);
            }
        }, 150);
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
        button.title = i18n.t('play_audio');
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
        audioBtn.title = i18n.t('play_audio');
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

        // Update language pairs list
        this.renderLanguagePairs();

        // Update lesson size input
        const lessonSize = userManager.getLessonSize();
        document.getElementById('lessonSizeInput').value = lessonSize;

        // Load daily goals
        await this.loadDailyGoals();
    }

    renderLanguagePairs() {
        const container = document.getElementById('languagePairsList');
        container.innerHTML = '';

        const user = userManager.getCurrentUser();
        if (!user || !user.languagePairs) return;

        user.languagePairs.forEach(pair => {
            // Skip pairs with invalid data
            if (!pair.fromLanguage || !pair.toLanguage || !pair.name) {
                console.warn('Skipping invalid language pair:', pair);
                return;
            }

            const item = document.createElement('div');
            item.className = `language-pair-item ${pair.active ? 'active' : ''}`;

            item.innerHTML = `
                <div class="language-pair-info">
                    <div class="language-pair-name">${pair.name}</div>
                    <div class="language-pair-stats">${pair.fromLanguage} → ${pair.toLanguage}</div>
                </div>
                <div class="language-pair-controls">
                    ${!pair.active ? `<button class="select-btn" data-pair-id="${pair.id}" data-i18n="select">Select</button>` : ''}
                    ${user.languagePairs.length > 1 ? `<button class="delete-btn" data-pair-id="${pair.id}" data-i18n="delete">Delete</button>` : ''}
                </div>
            `;

            container.appendChild(item);
        });

        // Add event listeners to buttons (CSP-compliant)
        container.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pairId = e.target.getAttribute('data-pair-id');
                this.selectLanguagePair(pairId);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pairId = e.target.getAttribute('data-pair-id');
                this.deleteLanguagePair(pairId);
            });
        });

        // Update translations for the newly added buttons
        if (typeof i18n !== 'undefined' && i18n.updateDOM) {
            i18n.updateDOM();
        }
    }

    async selectLanguagePair(pairId) {
        try {
            await userManager.setActiveLanguagePair(pairId);
            this.renderLanguagePairs();
            await this.updateStats();
        } catch (error) {
            console.error('Error selecting language pair:', error);
            alert(i18n?.t('error_selecting_pair') || 'Error selecting language pair');
        }
    }

    async deleteLanguagePair(pairId) {
        try {
            // Get word count for this pair
            const user = userManager.getCurrentUser();
            const pair = user.languagePairs.find(p => p.id === parseInt(pairId));

            if (!pair) {
                alert('Language pair not found');
                return;
            }

            // Check if pair has words by fetching from API
            const response = await fetch(`${window.location.origin}/api/users/${user.id}/language-pairs/${pairId}/word-count`);
            const data = await response.json();
            const wordCount = data.count || 0;

            // If pair has words, require typing "delete"
            if (wordCount > 0) {
                const message = `This language pair contains ${wordCount} word(s). All words and progress will be permanently deleted!\n\nType "delete" to confirm:`;
                const confirmation = prompt(message);

                if (confirmation !== 'delete') {
                    alert('Deletion cancelled. Type exactly "delete" to confirm.');
                    return;
                }
            } else {
                // Empty pair - just ask for simple confirmation
                if (!confirm(i18n?.t('confirm_delete_pair') || 'Are you sure you want to delete this language pair?')) {
                    return;
                }
            }

            await userManager.deleteLanguagePair(pairId);
            this.renderLanguagePairs();
            await this.updateStats();
            alert(`Language pair "${pair.name}" deleted successfully.`);
        } catch (error) {
            console.error('Error deleting language pair:', error);
            alert(error.message || i18n?.t('error_deleting_pair') || 'Error deleting language pair');
        }
    }

    showLanguagePairDialog() {
        // Get supported languages from language manager
        const supportedLangs = languageManager.getSupportedLanguages();
        const langOptions = Object.entries(supportedLangs).map(([code, name]) => name);
        
        // Helper function to safely get translation
        const t = (key, fallback) => {
            if (typeof i18n !== 'undefined' && i18n.t) {
                const translation = i18n.t(key);
                // Check if translation returned a key in brackets (missing translation)
                if (translation && !translation.startsWith('[')) {
                    return translation;
                }
            }
            return fallback;
        };

        // Create a better dialog for language selection
        const dialogHtml = `
            <div id="languagePairDialog" class="auth-modal">
                <div class="auth-content">
                    <h2>${t('create_language_pair', 'Create Language Pair')}</h2>
                    <div class="auth-form active">
                        <label>
                            <span>${t('target_language', 'Target language:')}</span>
                            <select id="fromLanguageSelect" class="language-select">
                                ${langOptions.map(lang => `<option value="${lang}">${lang}</option>`).join('')}
                            </select>
                        </label>

                        <label>
                            <span>${t('native_language', 'Native language:')}</span>
                            <select id="toLanguageSelect" class="language-select">
                                ${langOptions.map(lang => `<option value="${lang}" ${lang === 'Russian' ? 'selected' : ''}>${lang}</option>`).join('')}
                            </select>
                        </label>

                        <input type="text" id="pairNameInput" placeholder="${t('pair_name_placeholder', 'Pair name (automatic)')}" class="auth-form input">

                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button id="createPairBtn" class="auth-btn">${t('create', 'Create')}</button>
                            <button id="cancelPairBtn" class="auth-btn" style="background: #95a5a6;">${t('cancel', 'Cancel')}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHtml);

        // Set up event listeners
        const updateName = () => {
            const from = document.getElementById('fromLanguageSelect').value;
            const to = document.getElementById('toLanguageSelect').value;
            document.getElementById('pairNameInput').placeholder = `${from} - ${to}`;
        };
        
        document.getElementById('fromLanguageSelect').addEventListener('change', updateName);
        document.getElementById('toLanguageSelect').addEventListener('change', updateName);
        
        document.getElementById('createPairBtn').addEventListener('click', () => {
            const fromLang = document.getElementById('fromLanguageSelect').value;
            const toLang = document.getElementById('toLanguageSelect').value;
            const name = document.getElementById('pairNameInput').value || `${fromLang} - ${toLang}`;

            if (fromLang === toLang) {
                alert(i18n?.t('languages_cannot_be_same') || 'Target and native languages cannot be the same');
                return;
            }

            // Check for duplicates
            const user = userManager.getCurrentUser();
            const duplicate = user.languagePairs.find(pair =>
                pair.fromLanguage === fromLang && pair.toLanguage === toLang
            );

            if (duplicate) {
                alert(i18n?.t('language_pair_already_exists') || 'This language pair already exists');
                return;
            }

            this.createLanguagePair(fromLang, toLang, name);
            document.getElementById('languagePairDialog').remove();
        });
        
        document.getElementById('cancelPairBtn').addEventListener('click', () => {
            document.getElementById('languagePairDialog').remove();
        });
        
        updateName(); // Set initial name
    }

    async createLanguagePair(fromLang, toLang, name) {
        try {
            console.log('Creating language pair:', { fromLang, toLang, name });
            const result = await userManager.createLanguagePair(fromLang, toLang, name);
            console.log('Language pair created successfully:', result);
            this.renderLanguagePairs();
            // Also reload full data to be sure
            await this.loadData();
        } catch (error) {
            console.error('Error creating language pair:', error);
            alert(i18n?.t('error_creating_pair') || 'Error creating language pair: ' + error.message);
        }
    }

    async updateLessonSize(size) {
        try {
            await userManager.setLessonSize(parseInt(size));
        } catch (error) {
            console.error('Error updating lesson size:', error);
        }
    }

    async saveDailyGoals() {
        try {
            const user = userManager.getCurrentUser();
            if (!user) {
                this.showNotification('Please login first', 'error');
                return;
            }

            const xpGoal = parseInt(document.getElementById('dailyXPGoalInput').value);
            const wordsGoal = parseInt(document.getElementById('dailyWordsGoalInput').value);
            const exercisesGoal = parseInt(document.getElementById('dailyExercisesGoalInput').value);

            const response = await fetch(`/api/daily-goals/${user.id}/targets`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    xpGoal,
                    wordsGoal,
                    exercisesGoal
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save daily goals');
            }

            this.showNotification('Daily goals saved successfully!', 'success');

            // Refresh home page to show updated goals
            if (this.currentSection === 'homeSection') {
                await this.loadHome();
            }
        } catch (error) {
            console.error('Error saving daily goals:', error);
            this.showNotification('Failed to save daily goals', 'error');
        }
    }

    async loadDailyGoals() {
        try {
            const user = userManager.getCurrentUser();
            if (!user) return;

            const response = await fetch(`/api/daily-goals/${user.id}`);
            if (!response.ok) return;

            const goals = await response.json();

            // Set input values if goals exist
            if (goals && goals.length > 0) {
                const goal = goals[0]; // Assuming single row with all goals
                if (goal.xp_goal) document.getElementById('dailyXPGoalInput').value = goal.xp_goal;
                if (goal.words_goal) document.getElementById('dailyWordsGoalInput').value = goal.words_goal;
                if (goal.quizzes_goal) document.getElementById('dailyExercisesGoalInput').value = goal.quizzes_goal;
            }
        } catch (error) {
            console.error('Error loading daily goals:', error);
        }
    }

    async syncWithServer() {
        const statusEl = document.getElementById('syncStatus');
        statusEl.textContent = i18n.t('exportingData');
        statusEl.className = 'sync-status info';
        statusEl.style.display = 'block';
        
        try {
            // Export all words from current user's language pair
            const words = await database.getAllWords();
            
            if (words.length === 0) {
                statusEl.textContent = i18n.t('noDataToSync');
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
                statusEl.textContent = `Synchronization завершена! Иmпортировано: ${result.imported || exportData.length} слов`;
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
                
                statusEl.textContent = i18n.t('serverConnectionError');
                statusEl.className = 'sync-status error';
                
            } catch (fallbackError) {
                statusEl.textContent = i18n.t('syncAndExportError');
                statusEl.className = 'sync-status error';
            }
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }

    // ========== Analytics Methods ==========

    async loadAnalytics() {
        const user = userManager.getCurrentUser();
        if (!user || !window.analytics) return;

        try {
            // Load learning progress chart (default to week view)
            await this.loadProgressChart('week');

            // Load exercise success rate stats
            const exerciseStats = await window.analytics.getExerciseStats(user.id);
            window.analytics.renderExerciseStatsChart('exerciseStatsChart', exerciseStats);

            // Load study time statistics
            const studyTime = await window.analytics.getStudyTime(user.id);
            window.analytics.renderStudyTimeStats('studyTimeStats', studyTime);

            // Load difficult words
            const difficultWords = await window.analytics.getDifficultWords(user.id, 20);
            window.analytics.renderDifficultWords('difficultWordsList', difficultWords);

            // Add period selector event listeners
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    // Remove active class from all buttons
                    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    // Load chart with selected period
                    const period = e.target.getAttribute('data-period');
                    await this.loadProgressChart(period);
                });
            });
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    async loadProgressChart(period) {
        const user = userManager.getCurrentUser();
        if (!user || !window.analytics) return;

        try {
            const progressData = await window.analytics.getLearningProgress(user.id, period);
            window.analytics.renderProgressChart('progressChart', progressData, period);
        } catch (error) {
            console.error('Error loading progress chart:', error);
        }
    }

    // ========== Gamification Methods ==========

    async loadGamificationHeader() {
        const user = userManager.getCurrentUser();
        if (!user || !window.gamification) return;

        try {
            const stats = await window.gamification.getUserStats(user.id);
            const headerContainer = document.getElementById('gamificationHeader');
            if (headerContainer && stats) {
                window.gamification.renderStatsHeader(headerContainer, stats);
            }
        } catch (err) {
            console.error('Error loading gamification header:', err);
        }
    }

    async loadGamificationStats() {
        const user = userManager.getCurrentUser();
        if (!user || !window.gamification) return;

        try {
            const [stats, xpLog, activityData, achievementProgress] = await Promise.all([
                window.gamification.getUserStats(user.id),
                window.gamification.getXPLog(user.id, 50),
                window.gamification.getActivityCalendar(user.id, 365),
                window.gamification.getAchievementProgress(user.id)
            ]);

            const statsContainer = document.getElementById('gamificationStatsContainer');
            if (statsContainer && stats) {
                window.gamification.renderStatsPage(statsContainer, stats, xpLog, activityData);
            }

            // Render achievements
            const achievementsContainer = document.getElementById('achievements-container');
            if (achievementsContainer && achievementProgress) {
                window.gamification.renderAchievements(achievementsContainer, achievementProgress);
            }
        } catch (err) {
            console.error('Error loading gamification stats:', err);
        }
    }

    async loadLeaderboard(type = 'global') {
        const user = userManager.getCurrentUser();
        if (!user || !window.gamification) return;

        try {
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(`${type}LeaderboardTab`).classList.add('active');

            // Fetch data
            const [leaderboardData, userRank] = await Promise.all([
                type === 'global'
                    ? window.gamification.getGlobalLeaderboard(100)
                    : window.gamification.getWeeklyLeaderboard(100),
                window.gamification.getUserRank(user.id)
            ]);

            // Render leaderboard
            const leaderboardContainer = document.getElementById('leaderboardContainer');
            if (leaderboardContainer) {
                window.gamification.renderLeaderboard(leaderboardContainer, leaderboardData, user.id, type);
            }

            // Render user rank card
            const rankCard = document.getElementById('userRankCard');
            if (rankCard && userRank) {
                const rank = type === 'global' ? userRank.global : userRank.weekly;
                const xp = type === 'global' ? rank.total_xp : rank.weekly_xp;

                rankCard.innerHTML = `
                    <div class="your-rank-card">
                        <div class="your-rank-title">Your Rank</div>
                        <div class="your-rank-value">#${rank.rank || '—'}</div>
                        <div class="your-rank-xp">${(xp || 0).toLocaleString()} XP</div>
                    </div>
                `;
            }
        } catch (err) {
            console.error('Error loading leaderboard:', err);
        }
    }

    async loadDailyGoals() {
        const user = userManager.getCurrentUser();
        if (!user || !window.gamification) return;

        try {
            const goals = await window.gamification.getDailyGoals(user.id);
            const goalsContainer = document.getElementById('dailyGoalsContainer');

            if (goalsContainer && goals) {
                window.gamification.renderDailyGoals(goalsContainer, goals);
            }
        } catch (err) {
            console.error('Error loading daily goals:', err);
        }
    }

    setupVoiceSettings() {
        // Voice preview buttons
        document.querySelectorAll('.voice-preview-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const langCode = btn.dataset.lang;
                this.previewVoice(langCode);
            });
        });

        // Voice select dropdowns
        const languages = ['ru-RU', 'en-US', 'de-DE', 'es-ES', 'fr-FR', 'it-IT'];
        languages.forEach(langCode => {
            const select = document.getElementById(`voiceSelect-${langCode}`);
            if (select) {
                select.addEventListener('change', (e) => {
                    const voiceName = e.target.value;
                    this.audioManager.setCustomVoice(langCode, voiceName);
                });
            }
        });

        // Voice controls (rate, pitch, volume)
        const rateSlider = document.getElementById('voiceRateSlider');
        const pitchSlider = document.getElementById('voicePitchSlider');
        const volumeSlider = document.getElementById('voiceVolumeSlider');
        const testBtn = document.getElementById('testVoiceSettingsBtn');

        if (rateSlider) {
            // Set initial value from saved settings
            rateSlider.value = this.audioManager.voiceSettings.rate;
            document.getElementById('voiceRateValue').textContent = `${this.audioManager.voiceSettings.rate}x`;

            rateSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('voiceRateValue').textContent = `${value}x`;
                this.audioManager.setVoiceRate(value);
            });
        }

        if (pitchSlider) {
            // Set initial value from saved settings
            pitchSlider.value = this.audioManager.voiceSettings.pitch;
            document.getElementById('voicePitchValue').textContent = this.audioManager.voiceSettings.pitch;

            pitchSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('voicePitchValue').textContent = value;
                this.audioManager.setVoicePitch(value);
            });
        }

        if (volumeSlider) {
            // Set initial value from saved settings
            volumeSlider.value = this.audioManager.voiceSettings.volume;
            document.getElementById('voiceVolumeValue').textContent = `${Math.round(this.audioManager.voiceSettings.volume * 100)}%`;

            volumeSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('voiceVolumeValue').textContent = `${Math.round(value * 100)}%`;
                this.audioManager.setVoiceVolume(value);
            });
        }

        if (testBtn) {
            testBtn.addEventListener('click', () => {
                // Get current language pair to test with appropriate language
                const currentPair = userManager ? userManager.getCurrentLanguagePair() : null;
                let testText = 'Hallo! Dies ist ein Test der aktuellen Einstellungen.';
                let langCode = 'de-DE';

                if (currentPair) {
                    const testTexts = {
                        'German': { text: 'Hallo! Dies ist ein Test der aktuellen Einstellungen.', lang: 'de-DE' },
                        'English': { text: 'Hello! This is a test of the current settings.', lang: 'en-US' },
                        'Spanish': { text: 'Hola! Esta es una prueba de la configuración actual.', lang: 'es-ES' },
                        'French': { text: 'Bonjour! Ceci est un test des paramètres actuels.', lang: 'fr-FR' },
                        'Italian': { text: 'Ciao! Questo è un test delle impostazioni attuali.', lang: 'it-IT' },
                        'Russian': { text: i18n.t('voice_test_sample'), lang: 'ru-RU' }
                    };
                    const testData = testTexts[currentPair.fromLanguage];
                    if (testData) {
                        testText = testData.text;
                        langCode = testData.lang;
                    }
                }

                console.log(`🔊 Testing voice settings with: rate=${this.audioManager.voiceSettings.rate}, pitch=${this.audioManager.voiceSettings.pitch}, volume=${this.audioManager.voiceSettings.volume}`);

                // Disable button during playback
                testBtn.disabled = true;
                testBtn.textContent = i18n.t('voicePlaying');

                setTimeout(() => {
                    testBtn.disabled = false;
                    testBtn.textContent = i18n.t('voiceTestButton');
                }, 4000);

                this.audioManager.speak(testText, langCode);
            });
        }
    }

    populateVoiceSelectors(allVoices) {
        const languages = [
            { code: 'ru-RU', prefix: 'ru', sample: i18n.t('test_message') },
            { code: 'en-US', prefix: 'en', sample: 'Hello, this is a test message' },
            { code: 'de-DE', prefix: 'de', sample: 'Hallo, dies ist eine Testnachricht' },
            { code: 'es-ES', prefix: 'es', sample: 'Hola, este es un mensaje de prueba' },
            { code: 'fr-FR', prefix: 'fr', sample: 'Bonjour, ceci est un message de test' },
            { code: 'it-IT', prefix: 'it', sample: 'Ciao, questo è un messaggio di prova' }
        ];

        languages.forEach(({ code, prefix }) => {
            const select = document.getElementById(`voiceSelect-${code}`);
            if (!select) return;

            // Get voices for this language
            const langVoices = allVoices.filter(v => v.lang.startsWith(prefix));

            // Clear existing options except "Auto"
            select.innerHTML = `<option value="auto">${i18n?.t('autoRecommended') || 'Auto (recommended)'}</option>`;

            // Add available voices
            langVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name}${voice.localService ? ' 📍' : ' ☁️'}`;
                select.appendChild(option);
            });

            // Set current custom voice if any
            const customVoice = this.audioManager.getCustomVoice(code);
            if (customVoice && customVoice !== 'auto') {
                select.value = customVoice;
            }
        });

        console.log('✅ Voice selectors populated');
    }

    previewVoice(langCode) {
        const sampleText = {
            'ru-RU': i18n.t('russian_voice_sample'),
            'en-US': 'Hello! This is a sample of the English voice for learning foreign words.',
            'de-DE': 'Hallo! Dies ist ein Beispiel der deutschen Stimme zum Lernen von Fremdwörtern.',
            'es-ES': 'Hola! Este es un ejemplo de voz en español para aprender palabras extranjeras.',
            'fr-FR': 'Bonjour! Ceci est un exemple de voix française pour apprendre des mots étrangers.',
            'it-IT': 'Ciao! Questo è un esempio di voce italiana per imparare parole straniere.'
        };

        const text = sampleText[langCode] || 'Test voice';
        console.log(`🔊 Previewing voice for ${langCode}: "${text}"`);

        // Disable button during playback
        const btn = document.querySelector(`.voice-preview-btn[data-lang="${langCode}"]`);
        if (btn) {
            btn.disabled = true;
            setTimeout(() => {
                btn.disabled = false;
            }, 3000);
        }

        // Speak sample
        this.audioManager.speak(text, langCode);
    }
}

// ========================================
// GESTURE SWIPE HANDLER (2025 UX Feature)
// ========================================

class SwipeHandler {
    constructor() {
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.maxVerticalDistance = 100;
        this.init();
    }

    init() {
        // Add swipe listeners to quiz areas
        const swipeAreas = [
            document.getElementById('quizArea'),
            document.getElementById('reviewQuizArea'),
            document.getElementById('survivalArea')
        ];

        swipeAreas.forEach(area => {
            if (area) {
                area.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
                area.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
            }
        });
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.touchEndY = e.changedTouches[0].screenY;
        this.handleSwipe();
    }

    handleSwipe() {
        const horizontalDistance = this.touchEndX - this.touchStartX;
        const verticalDistance = Math.abs(this.touchEndY - this.touchStartY);

        // Ignore vertical scrolls
        if (verticalDistance > this.maxVerticalDistance) {
            return;
        }

        // Swipe Right (Next)
        if (horizontalDistance < -this.minSwipeDistance) {
            this.triggerNext();
        }

        // Swipe Left (Previous - if applicable)
        if (horizontalDistance > this.minSwipeDistance) {
            // Optional: add previous question functionality
            console.log('👈 Swipe left detected');
        }
    }

    triggerNext() {
        console.log('👉 Swipe right detected - triggering next');

        // Find visible next button and click it
        const nextBtn = document.getElementById('nextBtn');
        const reviewNextBtn = document.getElementById('reviewNextBtn');
        const survivalNext = document.getElementById('survivalNext');

        if (nextBtn && !nextBtn.classList.contains('hidden') && !nextBtn.disabled) {
            nextBtn.click();
        } else if (reviewNextBtn && !reviewNextBtn.classList.contains('hidden') && !reviewNextBtn.disabled) {
            reviewNextBtn.click();
        } else if (survivalNext && !survivalNext.classList.contains('hidden') && !survivalNext.disabled) {
            survivalNext.click();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LanguageLearningApp();
    window.swipeHandler = new SwipeHandler();
    console.log('👆 Swipe gestures enabled! Swipe right to go to next question.');
});