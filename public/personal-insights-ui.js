// Personal Insights UI - Personalized learning analytics
// Only accessible to whitelisted users

class PersonalInsightsUI {
    constructor() {
        this.userId = null;
        this.insights = [];
        this.period = 'month'; // 'week', 'month', 'all'
        this.initialized = false;
    }

    async init(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Personal Insights: Access denied');
            this.hideSection();
            return;
        }

        this.userId = userId;
        console.log('Personal Insights UI: Initializing for user', userId);

        try {
            await this.loadInsights();
            this.render();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Personal Insights UI:', error);
            this.showError(error.message);
        }
    }

    hideSection() {
        const section = document.getElementById('personalInsightsSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadInsights() {
        try {
            const response = await fetch(`/api/users/${this.userId}/insights?period=${this.period}&limit=5`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load insights');
            }
            const data = await response.json();
            this.insights = data.insights || [];
            console.log('Personal insights loaded:', this.insights);
        } catch (error) {
            console.error('Error loading insights:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('personalInsightsContent');
        if (!container) return;

        if (this.insights.length === 0) {
            container.innerHTML = `
                <div class="empty-insights">
                    <div class="empty-icon">📊</div>
                    <p data-i18n="no_insights_yet">Start learning to unlock personalized insights!</p>
                    <p class="empty-hint" data-i18n="insights_hint">Complete quizzes, learn words, and maintain streaks to see your learning patterns.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="insights-header">
                <h3 data-i18n="your_insights">Your Learning Insights</h3>
                <div class="period-selector">
                    <button class="period-btn ${this.period === 'week' ? 'active' : ''}" data-period="week">
                        <span data-i18n="this_week">This Week</span>
                    </button>
                    <button class="period-btn ${this.period === 'month' ? 'active' : ''}" data-period="month">
                        <span data-i18n="this_month">This Month</span>
                    </button>
                    <button class="period-btn ${this.period === 'all' ? 'active' : ''}" data-period="all">
                        <span data-i18n="all_time">All Time</span>
                    </button>
                </div>
            </div>

            <div class="insights-grid">
                ${this.insights.map(insight => this.renderInsight(insight)).join('')}
            </div>
        `;

        // Add event listeners for period buttons
        container.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.currentTarget.getAttribute('data-period');
                if (period) {
                    this.changePeriod(period);
                }
            });
        });

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderInsight(insight) {
        const priorityClass = `priority-${insight.priority}`;
        const iconSize = insight.priority === 'high' ? 'icon-large' : 'icon-medium';

        return `
            <div class="insight-card ${priorityClass}" data-insight-id="${insight.id}">
                <div class="insight-icon ${iconSize}">${insight.icon}</div>
                <div class="insight-content">
                    <h4 class="insight-title">${this.translateInsightTitle(insight)}</h4>
                    <p class="insight-description">${this.translateInsightDescription(insight)}</p>
                    ${this.renderInsightData(insight)}
                </div>
                <div class="insight-badge ${priorityClass}">
                    ${this.getPriorityLabel(insight.priority)}
                </div>
            </div>
        `;
    }

    translateInsightTitle(insight) {
        // Titles are dynamically generated on backend, so we keep them as is
        // In future, we can add i18n keys for common patterns
        return insight.title;
    }

    translateInsightDescription(insight) {
        // Descriptions are dynamically generated on backend, so we keep them as is
        return insight.description;
    }

    renderInsightData(insight) {
        const { type, data } = insight;

        switch (type) {
            case 'learning_time':
                return `
                    <div class="insight-stats">
                        <div class="stat-item">
                            <span class="stat-label" data-i18n="peak_hour">Peak Hour</span>
                            <span class="stat-value">${data.peak_hour}:00</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label" data-i18n="activities">Activities</span>
                            <span class="stat-value">${data.activities}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">XP</span>
                            <span class="stat-value">${data.xp}</span>
                        </div>
                    </div>
                `;

            case 'exercise_preference':
                return `
                    <div class="insight-stats">
                        <div class="stat-item">
                            <span class="stat-label" data-i18n="count">Count</span>
                            <span class="stat-value">${data.count}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">XP</span>
                            <span class="stat-value">${data.total_xp}</span>
                        </div>
                    </div>
                `;

            case 'progress':
                return `
                    <div class="insight-progress">
                        <div class="progress-comparison">
                            <div class="progress-bar-container">
                                <div class="progress-label">
                                    <span data-i18n="previous_period">Previous</span>
                                    <span>${data.previous_xp} XP</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill previous"
                                         style="width: ${Math.min(100, (data.previous_xp / data.current_xp) * 100)}%"></div>
                                </div>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-label">
                                    <span data-i18n="current_period">Current</span>
                                    <span>${data.current_xp} XP</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill current" style="width: 100%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="improvement-badge">
                            +${data.improvement_percentage}%
                        </div>
                    </div>
                `;

            case 'streak_pattern':
                return `
                    <div class="insight-stats">
                        <div class="stat-item">
                            <span class="stat-label" data-i18n="day">Day</span>
                            <span class="stat-value">${data.day_name}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label" data-i18n="activities">Activities</span>
                            <span class="stat-value">${data.activities}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">XP</span>
                            <span class="stat-value">${data.total_xp}</span>
                        </div>
                    </div>
                `;

            case 'achievement':
            case 'motivation':
                return `
                    <div class="insight-stats centered">
                        <div class="stat-item large">
                            <span class="stat-value highlight">${data.total_words || data.current_xp}</span>
                            <span class="stat-label">${data.total_words ? 'Words Learned' : 'XP Earned'}</span>
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    getPriorityLabel(priority) {
        const labels = {
            'high': '⭐',
            'medium': '✨',
            'low': '💡'
        };
        return labels[priority] || '';
    }

    async changePeriod(period) {
        if (this.period === period) return;

        this.period = period;
        try {
            await this.loadInsights();
            this.render();
        } catch (error) {
            console.error('Error changing period:', error);
            if (window.showToast) {
                showToast('Failed to load insights', 'error');
            }
        }
    }

    async refresh() {
        if (!userManager.hasGamificationAccess()) return;

        try {
            await this.loadInsights();
            this.render();
        } catch (error) {
            console.error('Error refreshing insights:', error);
        }
    }

    showError(message) {
        const container = document.getElementById('personalInsightsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p style="color: #ef4444;">${message}</p>
                <button class="action-btn retry-btn" style="margin-top: 1rem;">
                    <span data-i18n="try_again">Try Again</span>
                </button>
            </div>
        `;

        // Add event listener for retry button
        const retryBtn = container.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.refresh());
        }
    }
}

// Initialize
const personalInsightsUI = new PersonalInsightsUI();
window.personalInsightsUI = personalInsightsUI;
