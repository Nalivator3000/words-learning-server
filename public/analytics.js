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
                        label: 'XP Earned',
                        data: xpData,
                        borderColor: 'rgba(139, 92, 246, 1)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Words Learned',
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
                            text: 'Words'
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
                    label: 'Success Rate',
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
                                    `Success: ${context.parsed.y}%`,
                                    `Correct: ${stat.correct_count}`,
                                    `Incorrect: ${stat.incorrect_count}`,
                                    `Total: ${total}`
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
                            text: 'Success Rate (%)'
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
            container.innerHTML = '<p class="no-data">No data on difficult words</p>';
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
                                ${word.error_count} errors
                            </span>
                            <span class="word-stat">
                                <span class="stat-icon">📊</span>
                                ${word.total_attempts} attempts
                            </span>
                            <span class="word-stat error-rate">
                                ${errorRate}% errors
                            </span>
                        </div>
                    </div>
                    <button class="practice-word-btn" data-word-id="${word.id}" title="Practice this word">
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
                    <div class="time-value">${todayMinutes} min</div>
                    <div class="time-label">Today</div>
                </div>
                <div class="time-card">
                    <div class="time-icon">📅</div>
                    <div class="time-value">${weekMinutes} min</div>
                    <div class="time-label">This Week</div>
                </div>
                <div class="time-card">
                    <div class="time-icon">📈</div>
                    <div class="time-value">${avgDailyMinutes} min</div>
                    <div class="time-label">Average per Day</div>
                </div>
                <div class="time-card highlight">
                    <div class="time-icon">🕐</div>
                    <div class="time-value">${totalHours}h ${totalMinutes}m</div>
                    <div class="time-label">Total Time</div>
                </div>
            </div>
            <div class="time-insight">
                ${this.getStudyTimeInsight(todayMinutes, avgDailyMinutes)}
            </div>
        `;
    }

    // Get exercise type label
    getExerciseTypeLabel(type) {
        const labels = {
            'multiple_choice': 'Multiple Choice',
            'word_building': 'Word Building',
            'typing': 'Typing',
            'flashcard': 'Flashcards',
            'listening': 'Listening'
        };
        return labels[type] || type;
    }

    // Get study time insight message
    getStudyTimeInsight(todayMinutes, avgDailyMinutes) {
        if (todayMinutes === 0) {
            return '💭 <strong>Start studying today!</strong> Just 15 minutes a day will help you achieve great results.';
        }
        if (todayMinutes >= avgDailyMinutes * 1.5) {
            return '🎉 <strong>Great work!</strong> You studied more than usual today!';
        }
        if (todayMinutes < avgDailyMinutes * 0.5 && avgDailyMinutes > 0) {
            return '⚡ <strong>A bit more!</strong> Try to reach your average.';
        }
        return '✨ <strong>Good pace!</strong> Keep it up!';
    }

    // Practice specific difficult word
    practiceWord(wordId) {
        // Trigger study mode with specific word
        if (window.toast) {
            window.toast.info('This feature will be added in the next update');
        }
        console.log('Practice word:', wordId);
    }
}

// Initialize global analytics instance
window.analytics = new Analytics(window.API_URL || window.location.origin);
