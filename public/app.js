class AudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = {};
        this.initVoices();
    }

    initVoices() {
        const loadVoices = () => {
            const allVoices = this.synth.getVoices();
            
            // Group voices by language
            this.voices = {
                'ru-RU': allVoices.find(v => v.lang.startsWith('ru')),
                'en-US': allVoices.find(v => v.lang.startsWith('en')),
                'de-DE': allVoices.find(v => v.lang.startsWith('de')),
                'es-ES': allVoices.find(v => v.lang.startsWith('es')),
                'fr-FR': allVoices.find(v => v.lang.startsWith('fr')),
                'it-IT': allVoices.find(v => v.lang.startsWith('it'))
            };
            
            // Fallback to first available voice if specific language not found
            if (!this.voices['ru-RU'] && allVoices.length > 0) this.voices['ru-RU'] = allVoices[0];
            if (!this.voices['en-US'] && allVoices.length > 0) this.voices['en-US'] = allVoices[0];
            if (!this.voices['de-DE'] && allVoices.length > 0) this.voices['de-DE'] = allVoices[0];
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
            text = `Не изучено 🌱`;
        } else if (score >= 90) {
            className = 'score-complete';
            text = `${correctCount}/100 баллов (${score}%) ✅`;
        } else if (score >= 70) {
            className = 'score-high';
            text = `${correctCount}/100 баллов (${score}%) 🔥`;
        } else if (score >= 50) {
            className = 'score-medium';
            text = `${correctCount}/100 баллов (${score}%) ⚡`;
        } else if (score >= 30) {
            className = 'score-low';
            text = `${correctCount}/100 баллов (${score}%) 📚`;
        } else {
            className = 'score-very-low';
            text = `${correctCount}/100 баллов (${score}%) 🌱`;
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
            this.showError('Ошибка инициализации приложения');
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
        document.getElementById('studyBtn').addEventListener('click', () => this.showSection('study'));
        document.getElementById('reviewBtn').addEventListener('click', () => this.showSection('review'));
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

        // Settings functionality
        document.getElementById('addLanguagePairBtn').addEventListener('click', () => this.showLanguagePairDialog());
        document.getElementById('lessonSizeInput').addEventListener('change', (e) => this.updateLessonSize(e.target.value));
        document.getElementById('syncBtn').addEventListener('click', () => this.syncWithServer());
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
            this.showAuthError('Пожалуйста, заполните все поля');
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

            // Load gamification stats
            await this.loadGamificationStats();
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
            const dateStudied = lastReviewed ? new Date(lastReviewed).toLocaleDateString('ru-RU') : 'Не изучалось';

            metaDiv.innerHTML = `📅 Добавлено: ${dateAdded} | 📚 Изучалось: ${dateStudied}`;

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

            item.appendChild(wordContent);
            item.appendChild(scoreContainer);
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
            const text = await file.text();
            const words = ImportManager.parseCSV(text);

            if (words.length === 0) {
                this.showImportStatus('Файл не содержит корректных данных', 'error');
                return;
            }

            await database.addWords(words);
            this.showImportStatus(`Успешно импортировано ${words.length} слов`, 'success');
            await this.updateStats();

        } catch (error) {
            console.error('CSV Import Error:', error);
            this.showImportStatus('Ошибка при импорте CSV файла', 'error');
        }

        // Reset file input
        event.target.value = '';
    }

    downloadCSVTemplate() {
        const template = `Слово,Пример,Перевод,Перевод примера
laufen,Ich laufe jeden Tag im Park.,Бегать,Я бегаю каждый день в парке.
sprechen,Er spricht drei Sprachen.,Говорить,Он говорит на трёх языках.
schreiben,Sie schreibt einen Brief.,Писать,Она пишет письмо.`;

        const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'words_template.csv';
        link.click();
        URL.revokeObjectURL(link.href);

        this.showImportStatus('Шаблон CSV скачан', 'success');
    }

    async handleGoogleSheetsImport() {
        const url = document.getElementById('googleSheetsUrl').value.trim();
        if (!url) {
            this.showImportStatus('Введите ссылку на Google Таблицы', 'error');
            return;
        }

        try {
            this.showImportStatus('Загрузка данных...', 'info');
            const words = await ImportManager.fetchGoogleSheets(url);

            console.log('📥 Received words from Google Sheets:', words);

            if (!words || words.length === 0) {
                this.showImportStatus('Таблица не содержит корректных данных', 'error');
                return;
            }

            await database.addWords(words);
            this.showImportStatus(`Успешно импортировано ${words.length} слов`, 'success');
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
    }

    showReviewInterface() {
        document.getElementById('reviewModeSelect').style.display = 'none';
        document.getElementById('reviewQuizArea').classList.remove('hidden');
    }

    renderQuestion(quizData) {
        const { question, questionNumber, totalQuestions, progress } = quizData;
        
        document.getElementById('questionCounter').textContent = `Вопрос ${questionNumber} из ${totalQuestions}`;
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
        } else if (question.type === 'wordBuilding') {
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
        } else if (question.type === 'wordBuilding') {
            this.renderWordBuildingInterface(question, answerArea);
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
        const result = await quizManager.checkAnswer(answer);
        this.showAnswerFeedback(result, 'feedback');
        this.disableChoiceButtons();
        
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

        this.showNextButton();
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

    async deleteWord(wordId) {
        // Feature temporarily disabled - requires server endpoint
        alert('Функция удаления временно недоступна');
        console.warn('deleteWord: Not implemented on server');
    }

    async moveWordToStatus(wordId, newStatus) {
        // Feature temporarily disabled - requires server endpoint
        alert('Функция перемещения временно недоступна');
        console.warn('moveWordToStatus: Not implemented on server');
    }

    async resetAllWordsToStudying() {
        // Feature temporarily disabled - requires server endpoint
        alert('Функция сброса прогресса временно недоступна');
        console.warn('resetAllWordsToStudying: Not implemented on server');
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
        wordInput.onkeydown = (e) => {
            if (e.key === 'Backspace' && wordInput.value.length > 0 && !wordInput.disabled) {
                e.preventDefault();
                this.handleWordBuildingBackspace(wordInput);
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
        tile.classList.add('used');
        wordInput.focus();
    }

    handleWordBuildingBackspace(wordInput) {
        if (wordInput.value.length === 0) return;

        // Get the last letter
        const lastLetter = wordInput.value.slice(-1);

        // Remove last letter from input
        wordInput.value = wordInput.value.slice(0, -1);

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
    }
    
    clearBuiltWord(wordInput, letterTiles) {
        if (wordInput.disabled) return;
        
        wordInput.value = '';
        letterTiles.querySelectorAll('.letter-tile').forEach(tile => {
            tile.disabled = false;
        });
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
    }

    renderLanguagePairs() {
        const container = document.getElementById('languagePairsList');
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

    showLanguagePairDialog() {
        // Get supported languages from language manager
        const supportedLangs = languageManager.getSupportedLanguages();
        const langOptions = Object.entries(supportedLangs).map(([code, name]) => name);
        
        // Create a better dialog for language selection
        const dialogHtml = `
            <div id="languagePairDialog" class="auth-modal">
                <div class="auth-content">
                    <h2>Создать языковую пару</h2>
                    <div class="auth-form active">
                        <label>
                            <span>Изучаемый язык:</span>
                            <select id="fromLanguageSelect" class="language-select">
                                ${langOptions.map(lang => `<option value="${lang}">${lang}</option>`).join('')}
                            </select>
                        </label>
                        
                        <label>
                            <span>Родной язык:</span>
                            <select id="toLanguageSelect" class="language-select">
                                ${langOptions.map(lang => `<option value="${lang}" ${lang === 'Russian' ? 'selected' : ''}>${lang}</option>`).join('')}
                            </select>
                        </label>
                        
                        <input type="text" id="pairNameInput" placeholder="Название пары (автоматически)" class="auth-form input">
                        
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button id="createPairBtn" class="auth-btn">Создать</button>
                            <button id="cancelPairBtn" class="auth-btn" style="background: #95a5a6;">Отмена</button>
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
                alert('Изучаемый и родной язык не могут быть одинаковыми');
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
            await userManager.createLanguagePair(fromLang, toLang, name);
            this.renderLanguagePairs();
        } catch (error) {
            console.error('Error creating language pair:', error);
            alert('Ошибка при создании языковой пары');
        }
    }

    async updateLessonSize(size) {
        try {
            await userManager.setLessonSize(parseInt(size));
        } catch (error) {
            console.error('Error updating lesson size:', error);
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
                        <div class="your-rank-title">Ваше место</div>
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LanguageLearningApp();
});