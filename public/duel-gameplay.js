// Duel Gameplay - 1v1 Quiz Battle System

class DuelGameplay {
    constructor() {
        this.duelId = null;
        this.userId = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.startTime = null;
        this.questionStartTime = null;
        this.timeLimit = 120; // seconds
        this.timerInterval = null;
        this.duelData = null;
        this.isChallenger = false;
    }

    async start(duelId, userId) {
        this.duelId = duelId;
        this.userId = userId;

        try {
            // Get duel details first
            const duelResponse = await fetch(`/api/duels/${duelId}`);
            if (!duelResponse.ok) throw new Error('Failed to load duel');
            this.duelData = await duelResponse.json();

            this.isChallenger = this.duelData.challenger_id === userId;
            this.timeLimit = this.duelData.time_limit_seconds || 120;

            // Start the duel and get questions
            const startResponse = await fetch(`/api/duels/${duelId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!startResponse.ok) {
                const error = await startResponse.json();
                throw new Error(error.error || 'Failed to start duel');
            }

            const startData = await startResponse.json();
            this.questions = startData.words || [];

            if (this.questions.length === 0) {
                throw new Error('No questions available for this duel');
            }

            this.startTime = Date.now();
            this.render();
            this.startTimer();
            this.showQuestion();

        } catch (error) {
            console.error('Error starting duel:', error);
            this.showError(error.message);
        }
    }

    render() {
        const container = document.getElementById('duelsContent');
        if (!container) return;

        const opponent = this.isChallenger
            ? { name: this.duelData.opponent_name, score: this.duelData.opponent_score }
            : { name: this.duelData.challenger_name, score: this.duelData.challenger_score };

        container.innerHTML = `
            <div class="duel-gameplay">
                <!-- Duel Header -->
                <div class="duel-gameplay-header">
                    <div class="duel-players">
                        <div class="player-info you">
                            <div class="player-avatar">
                                <span class="avatar-icon">👤</span>
                            </div>
                            <div class="player-details">
                                <span class="player-name" data-i18n="you">You</span>
                                <span class="player-score">${this.score}</span>
                            </div>
                        </div>

                        <div class="vs-divider">
                            <span>VS</span>
                        </div>

                        <div class="player-info opponent">
                            <div class="player-avatar">
                                <span class="avatar-icon">👤</span>
                            </div>
                            <div class="player-details">
                                <span class="player-name">${opponent.name}</span>
                                <span class="player-score">${opponent.score}</span>
                            </div>
                        </div>
                    </div>

                    <div class="duel-timer">
                        <span class="timer-icon">⏱️</span>
                        <span class="timer-value" id="duelTimer">--:--</span>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="duel-progress">
                    <div class="progress-text">
                        <span data-i18n="question">Question</span>
                        <span id="currentQuestion">${this.currentQuestionIndex + 1}</span> /
                        <span id="totalQuestions">${this.questions.length}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="duelProgressFill" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Question Container -->
                <div class="duel-question-container" id="duelQuestionContainer">
                    <!-- Question will be rendered here -->
                </div>

                <!-- Exit Button -->
                <button class="exit-duel-btn" id="exitDuelBtn">
                    <span data-i18n="exit_duel">Exit Duel</span>
                </button>
            </div>
        `;

        // Add event listener for exit button
        document.getElementById('exitDuelBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                this.exit();
            }
        });

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    showQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.finishDuel();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const container = document.getElementById('duelQuestionContainer');
        if (!container) return;

        this.questionStartTime = Date.now();

        // Generate answer options (correct + 3 random wrong answers)
        const correctAnswer = question.translation;
        const wrongAnswers = this.generateWrongAnswers(correctAnswer, 3);
        const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

        container.innerHTML = `
            <div class="duel-question-card">
                <div class="question-word">
                    <h2>${question.word}</h2>
                </div>

                <div class="question-options">
                    ${allAnswers.map((answer, index) => `
                        <button class="option-btn" data-answer="${answer}" data-correct="${answer === correctAnswer}">
                            ${answer}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners for answer buttons
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.submitAnswer(e.currentTarget));
        });

        // Update progress
        this.updateProgress();
    }

    generateWrongAnswers(correctAnswer, count) {
        // Get random words from questions as wrong answers
        const wrongAnswers = [];
        const availableWords = this.questions
            .map(q => q.translation)
            .filter(t => t !== correctAnswer);

        while (wrongAnswers.length < count && availableWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            const wrongAnswer = availableWords.splice(randomIndex, 1)[0];
            wrongAnswers.push(wrongAnswer);
        }

        // If not enough unique answers, generate some generic ones
        while (wrongAnswers.length < count) {
            wrongAnswers.push(`Answer ${wrongAnswers.length + 1}`);
        }

        return wrongAnswers;
    }

    async submitAnswer(button) {
        // Disable all buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
        });

        const selectedAnswer = button.getAttribute('data-answer');
        const isCorrect = button.getAttribute('data-correct') === 'true';
        const answerTimeMs = Date.now() - this.questionStartTime;

        // Visual feedback
        if (isCorrect) {
            button.classList.add('correct');
            this.score++;
        } else {
            button.classList.add('wrong');
            // Highlight correct answer
            document.querySelectorAll('.option-btn').forEach(btn => {
                if (btn.getAttribute('data-correct') === 'true') {
                    btn.classList.add('correct');
                }
            });
        }

        // Submit answer to backend
        try {
            const question = this.questions[this.currentQuestionIndex];
            const response = await fetch(`/api/duels/${this.duelId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    wordId: question.id,
                    isCorrect: isCorrect,
                    answerTimeMs: answerTimeMs
                })
            });

            if (!response.ok) {
                console.error('Failed to submit answer');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
        }

        // Move to next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.showQuestion();
        }, 1500);
    }

    updateProgress() {
        const progressFill = document.getElementById('duelProgressFill');
        const currentQuestionSpan = document.getElementById('currentQuestion');

        if (progressFill) {
            const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }

        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = this.currentQuestionIndex + 1;
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const remaining = Math.max(0, this.timeLimit - elapsed);

            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            const timerElement = document.getElementById('duelTimer');

            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                // Change color when time is running out
                if (remaining <= 30) {
                    timerElement.style.color = '#ef4444';
                } else if (remaining <= 60) {
                    timerElement.style.color = '#f59e0b';
                }
            }

            if (remaining === 0) {
                this.finishDuel();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    async finishDuel() {
        this.stopTimer();

        try {
            // Get final duel state
            const response = await fetch(`/api/duels/${this.duelId}`);
            if (!response.ok) throw new Error('Failed to get duel result');

            const finalDuel = await response.json();
            this.showResults(finalDuel);

        } catch (error) {
            console.error('Error finishing duel:', error);
            this.showError('Failed to load duel results');
        }
    }

    showResults(finalDuel) {
        const container = document.getElementById('duelsContent');
        if (!container) return;

        const myScore = this.isChallenger ? finalDuel.challenger_score : finalDuel.opponent_score;
        const opponentScore = this.isChallenger ? finalDuel.opponent_score : finalDuel.challenger_score;
        const opponentName = this.isChallenger ? finalDuel.opponent_name : finalDuel.challenger_name;

        let result = 'draw';
        let resultTitle = 'Draw!';
        let resultIcon = '🤝';
        let resultClass = 'draw';

        if (myScore > opponentScore) {
            result = 'win';
            resultTitle = 'Victory!';
            resultIcon = '🏆';
            resultClass = 'win';
        } else if (myScore < opponentScore) {
            result = 'loss';
            resultTitle = 'Defeat';
            resultIcon = '😔';
            resultClass = 'loss';
        }

        container.innerHTML = `
            <div class="duel-results ${resultClass}">
                <div class="results-icon">${resultIcon}</div>
                <h2 class="results-title" data-i18n="duel_${result}">${resultTitle}</h2>

                <div class="results-scores">
                    <div class="score-card you">
                        <span class="score-label" data-i18n="you">You</span>
                        <span class="score-value">${myScore}</span>
                    </div>

                    <div class="score-divider">-</div>

                    <div class="score-card opponent">
                        <span class="score-label">${opponentName}</span>
                        <span class="score-value">${opponentScore}</span>
                    </div>
                </div>

                <div class="results-stats">
                    <div class="stat-item">
                        <span class="stat-label" data-i18n="questions_answered">Questions</span>
                        <span class="stat-value">${this.questions.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label" data-i18n="accuracy">Accuracy</span>
                        <span class="stat-value">${Math.round((myScore / this.questions.length) * 100)}%</span>
                    </div>
                </div>

                <div class="results-actions">
                    <button class="action-btn primary" id="backToDuelsBtn">
                        <span data-i18n="back_to_duels">Back to Duels</span>
                    </button>
                </div>
            </div>
        `;

        // Add event listener
        document.getElementById('backToDuelsBtn').addEventListener('click', () => {
            this.exit();
        });

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }

        // Show toast
        if (window.showToast) {
            if (result === 'win') {
                showToast('🏆 Victory! +100 XP', 'success');
            } else if (result === 'loss') {
                showToast('Better luck next time!', 'info');
            } else {
                showToast('Draw! Well matched!', 'info');
            }
        }
    }

    showError(message) {
        const container = document.getElementById('duelsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p style="color: #ef4444;">${message}</p>
                <button class="action-btn retry-btn" id="backToDuelsBtn">
                    <span data-i18n="back_to_duels">Back to Duels</span>
                </button>
            </div>
        `;

        document.getElementById('backToDuelsBtn').addEventListener('click', () => {
            this.exit();
        });
    }

    exit() {
        this.stopTimer();
        // Refresh duels list
        if (window.duelsUI) {
            window.duelsUI.refresh();
        }
    }
}

// Initialize
const duelGameplay = new DuelGameplay();
window.duelGameplay = duelGameplay;
