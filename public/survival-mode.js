class SurvivalMode {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.score = 0;
        this.errors = 0;
        this.maxErrors = 3;
        this.timeLimit = 5; // seconds
        this.currentTime = this.timeLimit;
        this.timer = null;
        this.timerAnimation = null;
        this.currentQuestion = null;
        this.words = [];
        this.usedWords = [];
        this.gameEnded = false;
        this.selectedChoice = 1; // Track selected choice for keyboard navigation
    }

    async start() {
        try {
            // Get all studying words for current language pair
            this.words = await database.getWordsByStatus('studying');
            
            if (this.words.length < 4) {
                throw new Error('Нужно minиmуm 4 слова для режиmа выживания');
            }

            this.isActive = true;
            this.gameEnded = false;
            this.score = 0;
            this.errors = 0;
            this.usedWords = [];

            this.showSurvivalInterface();
            this.updateStats();
            this.nextQuestion();

        } catch (error) {
            console.error('Error starting survival mode:', error);
            alert(error.message);
        }
    }

    showSurvivalInterface() {
        // Hide other interfaces
        document.getElementById('studyModeSelect').style.display = 'none';
        document.getElementById('quizArea').classList.add('hidden');
        
        // Show survival interface
        document.getElementById('survivalArea').classList.remove('hidden');
        
        // Hide end game buttons
        document.getElementById('survivalRestart').classList.add('hidden');
        document.getElementById('survivalExit').classList.add('hidden');
        
        // Clear feedback
        document.getElementById('survivalFeedback').textContent = '';
        document.getElementById('survivalFeedback').className = 'survival-feedback';
    }

    updateStats() {
        document.getElementById('survivalScore').textContent = this.score;
        document.getElementById('survivalErrors').textContent = `${this.errors}/${this.maxErrors}`;
        document.getElementById('survivalTime').textContent = this.currentTime;
    }

    nextQuestion() {
        if (this.gameEnded) return;

        // Reset timer
        this.currentTime = this.timeLimit;
        this.updateStats();
        
        // Clear previous feedback and styles
        document.getElementById('survivalFeedback').textContent = '';
        document.getElementById('survivalFeedback').className = 'survival-feedback';

        // Generate question
        this.generateQuestion();
        
        // Enable choices and reset selection
        this.selectedChoice = 1;
        document.getElementById('choice1').disabled = false;
        document.getElementById('choice2').disabled = false;
        document.getElementById('choice1').className = 'survival-choice selected';
        document.getElementById('choice2').className = 'survival-choice';

        // Start timer
        this.startTimer();
    }

    generateQuestion() {
        // Filter out used words, reset if all used
        let availableWords = this.words.filter(w => !this.usedWords.includes(w.id));
        if (availableWords.length < 2) {
            this.usedWords = []; // Reset used words
            availableWords = this.words;
        }

        // Pick random correct answer
        const correctIndex = Math.floor(Math.random() * availableWords.length);
        const correctWord = availableWords[correctIndex];
        
        // Pick random incorrect answer (different from correct)
        let incorrectWord;
        do {
            const incorrectIndex = Math.floor(Math.random() * availableWords.length);
            incorrectWord = availableWords[incorrectIndex];
        } while (incorrectWord.id === correctWord.id);

        // Mark words as used
        this.usedWords.push(correctWord.id);

        // Randomly decide which choice gets the correct answer
        const correctPosition = Math.random() < 0.5 ? 1 : 2;

        this.currentQuestion = {
            nativeText: correctWord.translation, // Question in native language
            correctAnswer: correctWord.word, // Correct foreign word
            correctPosition: correctPosition,
            correctId: correctWord.id
        };

        // Display question (native language)
        document.getElementById('survivalQuestion').textContent = this.currentQuestion.nativeText;

        // Set up choices (foreign language words)
        const choice1 = document.getElementById('choice1');
        const choice2 = document.getElementById('choice2');

        if (correctPosition === 1) {
            choice1.textContent = correctWord.word;
            choice1.dataset.correct = 'true';
            choice2.textContent = incorrectWord.word;
            choice2.dataset.correct = 'false';
        } else {
            choice1.textContent = incorrectWord.word;
            choice1.dataset.correct = 'false';
            choice2.textContent = correctWord.word;
            choice2.dataset.correct = 'true';
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        if (this.timerAnimation) clearInterval(this.timerAnimation);

        this.currentTime = this.timeLimit;
        let progress = 100; // Start at 100%

        const leftBar = document.getElementById('timerBarLeft');
        const rightBar = document.getElementById('timerBarRight');

        // Reset bars to full width and positions
        leftBar.style.width = '50%';
        leftBar.style.left = '0%';
        rightBar.style.width = '50%';
        rightBar.style.right = '0%';

        this.timerAnimation = setInterval(() => {
            progress -= (100 / (this.timeLimit * 10)); // Decrease by small steps for smooth animation
            
            // Calculate how much each bar should shrink (from 50% to 0%)
            const barWidth = Math.max(0, (progress / 2));

            // Left bar shrinks from left edge (moves right toward center)
            leftBar.style.width = `${barWidth}%`;
            leftBar.style.left = `${50 - barWidth}%`; // Move right edge toward center
            
            // Right bar shrinks from right edge (moves left toward center) 
            rightBar.style.width = `${barWidth}%`;
            rightBar.style.right = `${50 - barWidth}%`; // Move left edge toward center

            if (progress <= 0) {
                this.timeUp();
            }
        }, 100);

        this.timer = setInterval(() => {
            this.currentTime--;
            this.updateStats();

            if (this.currentTime <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.timerAnimation) {
            clearInterval(this.timerAnimation);
            this.timerAnimation = null;
        }
    }

    timeUp() {
        this.stopTimer();
        this.handleIncorrectAnswer('Вреmя вышло!', 'timeout');
    }

    handleAnswer(choice) {
        if (this.gameEnded) return;

        this.stopTimer();
        
        const isCorrect = choice.dataset.correct === 'true';
        
        // Disable both choices and remove selection
        document.getElementById('choice1').disabled = true;
        document.getElementById('choice2').disabled = true;
        document.getElementById('choice1').classList.remove('selected');
        document.getElementById('choice2').classList.remove('selected');

        if (isCorrect) {
            this.handleCorrectAnswer(choice);
        } else {
            this.handleIncorrectAnswer('Неправильно!', 'incorrect', choice);
        }
    }

    updateSelection() {
        // Update visual selection
        document.getElementById('choice1').classList.remove('selected');
        document.getElementById('choice2').classList.remove('selected');
        document.getElementById(`choice${this.selectedChoice}`).classList.add('selected');
    }

    selectChoice(choiceNumber) {
        if (this.gameEnded) return;
        
        this.selectedChoice = choiceNumber;
        this.updateSelection();
    }

    confirmSelection() {
        if (this.gameEnded) return;
        
        const choiceElement = document.getElementById(`choice${this.selectedChoice}`);
        if (choiceElement && !choiceElement.disabled) {
            this.handleAnswer(choiceElement);
        }
    }

    handleCorrectAnswer(choice) {
        this.score++;
        this.updateStats();

        // Visual feedback
        choice.classList.add('correct');
        document.getElementById('survivalFeedback').textContent = 'Правильно! +1 очко';
        document.getElementById('survivalFeedback').className = 'survival-feedback correct';

        // Update word progress
        if (this.currentQuestion && this.currentQuestion.correctId) {
            database.updateWordProgress(this.currentQuestion.correctId, true, 'survival');
        }

        // Audio feedback for correct answer
        if (this.app.shouldShowAudioButton(this.currentQuestion.correctAnswer)) {
            this.app.audioManager.speak(this.currentQuestion.correctAnswer);
        }

        // Continue after short delay
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    handleIncorrectAnswer(message, type, choice = null) {
        this.errors++;
        this.updateStats();

        // Visual feedback
        if (choice) {
            choice.classList.add('incorrect');
            // Highlight correct answer
            const choices = [document.getElementById('choice1'), document.getElementById('choice2')];
            choices.forEach(c => {
                if (c.dataset.correct === 'true') {
                    c.classList.add('correct');
                }
            });
        }

        document.getElementById('survivalFeedback').textContent = `${message} Правильный ответ: ${this.currentQuestion.correctAnswer}`;
        document.getElementById('survivalFeedback').className = `survival-feedback ${type}`;

        // Update word progress (mark as incorrect)
        if (this.currentQuestion && this.currentQuestion.correctId) {
            database.updateWordProgress(this.currentQuestion.correctId, false, 'survival');
        }

        // Check game over
        if (this.errors >= this.maxErrors) {
            setTimeout(() => {
                this.endGame();
            }, 2000);
        } else {
            // Continue after delay
            setTimeout(() => {
                this.nextQuestion();
            }, 2000);
        }
    }

    endGame() {
        this.gameEnded = true;
        this.isActive = false;
        this.stopTimer();

        // Clear timer bars
        const leftBar = document.getElementById('timerBarLeft');
        const rightBar = document.getElementById('timerBarRight');
        leftBar.style.width = '0%';
        leftBar.style.left = '50%';
        rightBar.style.width = '0%';
        rightBar.style.right = '50%';

        // Show game over screen
        const survivalArea = document.getElementById('survivalArea');
        survivalArea.innerHTML = `
            <div class="game-over">
                <h3>🔥 Игра окончена!</h3>
                <div class="final-stats">
                    <p><strong>Финальный счёт:</strong> ${this.score} очков</p>
                    <p><strong>Ошибки:</strong> ${this.errors}/${this.maxErrors}</p>
                    <p><strong>Точность:</strong> ${Math.round((this.score / (this.score + this.errors)) * 100) || 0}%</p>
                </div>
                <div style="margin-top: 2rem;">
                    <button id="survivalRestart" class="action-btn" style="margin: 0.5rem;">Начать заново</button>
                    <button id="survivalExit" class="action-btn" style="margin: 0.5rem; background: #95a5a6;">Выйти</button>
                </div>
            </div>
        `;

        // Set up restart and exit handlers
        document.getElementById('survivalRestart').onclick = () => this.restart();
        document.getElementById('survivalExit').onclick = () => this.exit();
    }

    restart() {
        // Reset survival area HTML
        document.getElementById('survivalArea').innerHTML = `
            <div class="survival-stats">
                <div class="survival-stat">
                    <span class="stat-label">Счёт:</span>
                    <span id="survivalScore" class="stat-value">0</span>
                </div>
                <div class="survival-stat">
                    <span class="stat-label">Ошибки:</span>
                    <span id="survivalErrors" class="stat-value">0/3</span>
                </div>
                <div class="survival-stat">
                    <span class="stat-label">Вреmя:</span>
                    <span id="survivalTime" class="stat-value">5</span>
                </div>
            </div>
            
            <div class="survival-timer">
                <div id="timerBarLeft" class="timer-bar left"></div>
                <div id="timerBarRight" class="timer-bar right"></div>
            </div>
            
            <div id="survivalQuestion" class="survival-question"></div>
            
            <div id="survivalChoices" class="survival-choices">
                <button id="choice1" class="survival-choice">Слово 1</button>
                <button id="choice2" class="survival-choice">Слово 2</button>
            </div>
            
            <div id="survivalFeedback" class="survival-feedback"></div>
        `;

        // Restart the game
        this.start();
    }

    exit() {
        this.isActive = false;
        this.gameEnded = true;
        this.stopTimer();

        // Hide survival interface
        document.getElementById('survivalArea').classList.add('hidden');
        
        // Show study mode select
        document.getElementById('studyModeSelect').style.display = 'block';
    }

    // Setup choice event listeners
    setupEventListeners() {
        document.getElementById('choice1').onclick = () => {
            this.selectChoice(1);
            this.confirmSelection();
        };

        document.getElementById('choice2').onclick = () => {
            this.selectChoice(2);
            this.confirmSelection();
        };

        // Mouse hover to update selection
        document.getElementById('choice1').onmouseenter = () => {
            if (this.isActive && !this.gameEnded) {
                this.selectChoice(1);
            }
        };

        document.getElementById('choice2').onmouseenter = () => {
            if (this.isActive && !this.gameEnded) {
                this.selectChoice(2);
            }
        };

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.isActive && !this.gameEnded) {
                if (e.key === '1') {
                    e.preventDefault();
                    this.selectChoice(1);
                    this.confirmSelection();
                } else if (e.key === '2') {
                    e.preventDefault();
                    this.selectChoice(2);
                    this.confirmSelection();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.selectChoice(1);
                    this.confirmSelection(); // Auto-confirm with arrows
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.selectChoice(2);
                    this.confirmSelection(); // Auto-confirm with arrows
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectChoice(1);
                    this.confirmSelection(); // Auto-confirm with arrows
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectChoice(2);
                    this.confirmSelection(); // Auto-confirm with arrows
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.confirmSelection();
                }
            }
        });
    }
}