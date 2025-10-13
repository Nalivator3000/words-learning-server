// Analytics and Statistics Module
// Provides detailed learning progress visualizations and insights

class Analytics {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.charts = {}; // Store chart instances
    }

    // Fetch aggregated learning progress data
    async getLearningProgress(userId, period = 'week') {
        try {
            const response = await fetch(`${this.apiUrl}/api/analytics/progress/${userId}?period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch learning progress');
            return await response.json();
        } catch (err) {
            console.error('Error fetching learning progress:', err);
            return [];
        }
    }

    // Fetch success rate by exercise type
    async getExerciseStats(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/api/analytics/exercise-stats/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch exercise stats');
            return await response.json();
        } catch (err) {
            console.error('Error fetching exercise stats:', err);
            return [];
        }
    }

    // Fetch most difficult words
    async getDifficultWords(userId, limit = 20) {
        try {
            const response = await fetch(`${this.apiUrl}/api/analytics/difficult-words/${userId}?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch difficult words');
            return await response.json();
        } catch (err) {
            console.error('Error fetching difficult words:', err);
            return [];
        }
    }

    // Fetch study time statistics
    async getStudyTime(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/api/analytics/study-time/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch study time');
            return await response.json();
        } catch (err) {
            console.error('Error fetching study time:', err);
            return { today: 0, week: 0, total: 0 };
        }
    }

    // Calculate fluency prediction (ML-based)
    async getFluencyPrediction(userId) {
        try {
            const response = await fetch(`${this.apiUrl}/api/analytics/fluency-prediction/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch fluency prediction');
            return await response.json();
        } catch (err) {
            console.error('Error fetching fluency prediction:', err);
            return null;
        }
    }

    // Render learning progress chart
    renderProgressChart(canvasId, progressData, period = 'week') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if any
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Prepare data
        const labels = progressData.map(d => {
            const date = new Date(d.date);
            if (period === 'week') {
                return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
            } else if (period === 'month') {
                return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
            } else {
                return date.toLocaleDateString('ru-RU', { month: 'short' });
            }
        });

        const xpData = progressData.map(d => d.xp_earned || 0);
        const wordsData = progressData.map(d => d.words_learned || 0);

        // Create chart
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'XP заработано',
                        data: xpData,
                        borderColor: 'rgba(139, 92, 246, 1)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Слов выучено',
                        data: wordsData,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'XP'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Слова'
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Render exercise success rate chart
    renderExerciseStatsChart(canvasId, exerciseStats) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if any
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // Prepare data
        const labels = exerciseStats.map(e => this.getExerciseTypeLabel(e.exercise_type));
        const successRates = exerciseStats.map(e => {
            const total = e.correct_count + e.incorrect_count;
            return total > 0 ? Math.round((e.correct_count / total) * 100) : 0;
        });
        const colors = successRates.map(rate => {
            if (rate >= 90) return 'rgba(16, 185, 129, 0.8)'; // Green
            if (rate >= 70) return 'rgba(251, 191, 36, 0.8)'; // Yellow
            return 'rgba(239, 68, 68, 0.8)'; // Red
        });

        // Create chart
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Процент успешности',
                    data: successRates,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const stat = exerciseStats[context.dataIndex];
                                const total = stat.correct_count + stat.incorrect_count;
                                return [
                                    `Успешность: ${context.parsed.y}%`,
                                    `Правильно: ${stat.correct_count}`,
                                    `Неправильно: ${stat.incorrect_count}`,
                                    `Всего: ${total}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Процент успешности (%)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Render difficult words list
    renderDifficultWords(containerId, difficultWords) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!difficultWords || difficultWords.length === 0) {
            container.innerHTML = '<p class="no-data">Нет данных о сложных словах</p>';
            return;
        }

        let html = '<div class="difficult-words-list">';

        difficultWords.forEach((word, index) => {
            const errorRate = word.total_attempts > 0
                ? Math.round((word.error_count / word.total_attempts) * 100)
                : 0;

            const difficultyClass = errorRate >= 70 ? 'very-hard' : errorRate >= 50 ? 'hard' : 'medium';

            html += `
                <div class="difficult-word-item ${difficultyClass}">
                    <div class="word-rank">${index + 1}</div>
                    <div class="word-content">
                        <div class="word-pair">
                            <span class="word-foreign">${word.word}</span>
                            <span class="word-arrow">→</span>
                            <span class="word-translation">${word.translation}</span>
                        </div>
                        <div class="word-stats">
                            <span class="word-stat">
                                <span class="stat-icon">❌</span>
                                ${word.error_count} ошибок
                            </span>
                            <span class="word-stat">
                                <span class="stat-icon">📊</span>
                                ${word.total_attempts} попыток
                            </span>
                            <span class="word-stat error-rate">
                                ${errorRate}% ошибок
                            </span>
                        </div>
                    </div>
                    <button class="practice-word-btn" data-word-id="${word.id}" title="Отработать это слово">
                        🎯
                    </button>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Add event listeners for practice buttons
        container.querySelectorAll('.practice-word-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wordId = e.currentTarget.getAttribute('data-word-id');
                this.practiceWord(wordId);
            });
        });
    }

    // Render study time statistics
    renderStudyTimeStats(containerId, studyTime) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const todayMinutes = Math.floor((studyTime.today || 0) / 60);
        const weekMinutes = Math.floor((studyTime.week || 0) / 60);
        const totalHours = Math.floor((studyTime.total || 0) / 3600);
        const totalMinutes = Math.floor(((studyTime.total || 0) % 3600) / 60);

        const avgDailyMinutes = Math.floor(weekMinutes / 7);

        container.innerHTML = `
            <div class="study-time-cards">
                <div class="time-card">
                    <div class="time-icon">⏱️</div>
                    <div class="time-value">${todayMinutes} мин</div>
                    <div class="time-label">Сегодня</div>
                </div>
                <div class="time-card">
                    <div class="time-icon">📅</div>
                    <div class="time-value">${weekMinutes} мин</div>
                    <div class="time-label">За неделю</div>
                </div>
                <div class="time-card">
                    <div class="time-icon">📈</div>
                    <div class="time-value">${avgDailyMinutes} мин</div>
                    <div class="time-label">В среднем в день</div>
                </div>
                <div class="time-card highlight">
                    <div class="time-icon">🕐</div>
                    <div class="time-value">${totalHours}ч ${totalMinutes}м</div>
                    <div class="time-label">Всего времени</div>
                </div>
            </div>
            <div class="time-insight">
                ${this.getStudyTimeInsight(todayMinutes, avgDailyMinutes)}
            </div>
        `;
    }

    // Render fluency prediction
    renderFluencyPrediction(containerId, prediction) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!prediction || !prediction.estimated_date) {
            container.innerHTML = `
                <div class="fluency-prediction no-prediction">
                    <div class="prediction-icon">🔮</div>
                    <div class="prediction-message">
                        <h4>Прогноз беглости недоступен</h4>
                        <p>Продолжайте учиться, чтобы получить прогноз!</p>
                    </div>
                </div>
            `;
            return;
        }

        const estimatedDate = new Date(prediction.estimated_date);
        const daysRemaining = Math.ceil((estimatedDate - new Date()) / (1000 * 60 * 60 * 24));
        const progressPercent = Math.min(100, Math.round(prediction.current_progress || 0));

        const confidenceClass = prediction.confidence >= 0.8 ? 'high' : prediction.confidence >= 0.5 ? 'medium' : 'low';

        container.innerHTML = `
            <div class="fluency-prediction ${confidenceClass}">
                <div class="prediction-header">
                    <div class="prediction-icon">🎯</div>
                    <h3>Прогноз достижения беглости</h3>
                </div>
                <div class="prediction-content">
                    <div class="prediction-date">
                        <div class="date-label">Ожидаемая дата</div>
                        <div class="date-value">${estimatedDate.toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</div>
                        <div class="days-remaining">
                            ${daysRemaining > 0 ? `Осталось ${daysRemaining} дней` : 'Цель достигнута!'}
                        </div>
                    </div>
                    <div class="prediction-progress">
                        <div class="progress-label">Текущий прогресс</div>
                        <div class="progress-bar-large">
                            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                            <span class="progress-text">${progressPercent}%</span>
                        </div>
                    </div>
                    <div class="prediction-stats">
                        <div class="prediction-stat">
                            <span class="stat-label">Уверенность модели</span>
                            <span class="stat-value">${Math.round(prediction.confidence * 100)}%</span>
                        </div>
                        <div class="prediction-stat">
                            <span class="stat-label">Текущий темп</span>
                            <span class="stat-value">${prediction.words_per_week || 0} слов/нед</span>
                        </div>
                    </div>
                    <div class="prediction-recommendation">
                        💡 ${this.getFluencyRecommendation(daysRemaining, prediction.words_per_week)}
                    </div>
                </div>
            </div>
        `;
    }

    // Get exercise type label in Russian
    getExerciseTypeLabel(type) {
        const labels = {
            'multiple_choice': 'Множественный выбор',
            'word_building': 'Составление слова',
            'typing': 'Набор текста',
            'flashcard': 'Карточки',
            'listening': 'Аудирование'
        };
        return labels[type] || type;
    }

    // Get study time insight message
    getStudyTimeInsight(todayMinutes, avgDailyMinutes) {
        if (todayMinutes === 0) {
            return '💭 <strong>Начните занятие сегодня!</strong> Всего 15 минут в день помогут достичь больших результатов.';
        }
        if (todayMinutes >= avgDailyMinutes * 1.5) {
            return '🎉 <strong>Отличная работа!</strong> Сегодня вы занимались больше обычного!';
        }
        if (todayMinutes < avgDailyMinutes * 0.5 && avgDailyMinutes > 0) {
            return '⚡ <strong>Ещё немного!</strong> Попробуйте достичь вашего среднего показателя.';
        }
        return '✨ <strong>Хороший темп!</strong> Продолжайте в том же духе.';
    }

    // Get fluency recommendation
    getFluencyRecommendation(daysRemaining, wordsPerWeek) {
        if (daysRemaining <= 0) {
            return 'Поздравляем! Вы достигли цели беглости. Продолжайте практиковаться для поддержания уровня.';
        }
        if (wordsPerWeek < 20) {
            return 'Увеличьте темп обучения до 20-30 слов в неделю для достижения цели быстрее.';
        }
        if (wordsPerWeek >= 50) {
            return 'Отличный темп! При таком прогрессе вы достигнете беглости раньше прогноза.';
        }
        return 'Хороший темп обучения! Старайтесь заниматься регулярно для достижения цели.';
    }

    // Practice specific difficult word
    practiceWord(wordId) {
        // Trigger study mode with specific word
        if (window.toast) {
            window.toast.info('Функция будет добавлена в следующем обновлении');
        }
        console.log('Practice word:', wordId);
    }
}

// Initialize global analytics instance
window.analytics = new Analytics(window.API_URL || 'http://localhost:3001');
