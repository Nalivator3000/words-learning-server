// Personal Rating UI - Weekly/Monthly XP History Charts
// Only accessible to whitelisted users

class PersonalRatingUI {
    constructor() {
        this.userId = null;
        this.weeklyData = null;
        this.monthlyData = null;
        this.currentView = 'weekly'; // 'weekly' or 'monthly'
        this.initialized = false;
    }

    async init(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Personal Rating: Access denied');
            this.hideSection();
            return;
        }

        this.userId = userId;
        console.log('Personal Rating UI: Initializing for user', userId);

        try {
            await this.loadWeeklyData();
            await this.loadMonthlyData();
            this.render();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Personal Rating UI:', error);
            this.showError(error.message);
        }
    }

    hideSection() {
        const section = document.getElementById('personalRatingSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadWeeklyData() {
        try {
            const response = await fetch(`/api/rating/${this.userId}/personal?period=weekly`);
            if (!response.ok) throw new Error('Failed to load weekly data');
            this.weeklyData = await response.json();
            console.log('Weekly data loaded:', this.weeklyData);
        } catch (error) {
            console.error('Error loading weekly data:', error);
            throw error;
        }
    }

    async loadMonthlyData() {
        try {
            const response = await fetch(`/api/rating/${this.userId}/personal?period=monthly`);
            if (!response.ok) throw new Error('Failed to load monthly data');
            this.monthlyData = await response.json();
            console.log('Monthly data loaded:', this.monthlyData);
        } catch (error) {
            console.error('Error loading monthly data:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('personalRatingContent');
        if (!container) return;

        const data = this.currentView === 'weekly' ? this.weeklyData : this.monthlyData;

        container.innerHTML = `
            <div class="rating-header">
                <div class="view-switcher">
                    <button
                        class="view-btn ${this.currentView === 'weekly' ? 'active' : ''}"
                        onclick="personalRatingUI.switchView('weekly')">
                        <span data-i18n="weekly">Weekly</span>
                    </button>
                    <button
                        class="view-btn ${this.currentView === 'monthly' ? 'active' : ''}"
                        onclick="personalRatingUI.switchView('monthly')">
                        <span data-i18n="monthly">Monthly</span>
                    </button>
                </div>
            </div>

            <div class="rating-stats">
                <div class="stat-card">
                    <h3 data-i18n="total_xp">Total XP</h3>
                    <p class="stat-value">${data.stats.total_xp.toLocaleString()}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="average_per_period">Average</h3>
                    <p class="stat-value">${Math.round(data.stats.avg_per_period)}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="current_period">Current</h3>
                    <p class="stat-value">${data.stats.current_period_xp}</p>
                </div>
                <div class="stat-card">
                    <h3 data-i18n="best_period">Best</h3>
                    <p class="stat-value">${data.stats.max_period_xp}</p>
                </div>
            </div>

            <div class="rating-chart">
                ${this.renderChart(data)}
            </div>
        `;

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderChart(data) {
        if (!data.history || data.history.length === 0) {
            return `
                <div class="empty-chart">
                    <p data-i18n="no_data_yet">No data available yet. Start learning to see your progress!</p>
                </div>
            `;
        }

        const maxXP = Math.max(...data.history.map(item => item.total_xp), 1);
        const bars = data.history.map((item, index) => {
            const height = (item.total_xp / maxXP) * 100;
            const isCurrentPeriod = item.period === data.stats.current_period;

            return `
                <div class="chart-bar-container">
                    <div class="chart-bar ${isCurrentPeriod ? 'current' : ''}"
                         style="height: ${Math.max(height, 5)}%;"
                         title="${item.period}: ${item.total_xp} XP">
                        <span class="bar-value">${item.total_xp}</span>
                    </div>
                    <span class="bar-label">${this.formatPeriodLabel(item.period)}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="chart-container">
                ${bars}
            </div>
        `;
    }

    formatPeriodLabel(period) {
        if (this.currentView === 'weekly') {
            // Format: "2025-W12" -> "W12"
            return period.split('-')[1];
        } else {
            // Format: "2025-01" -> "Jan"
            const [year, month] = period.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('en', { month: 'short' });
        }
    }

    switchView(view) {
        this.currentView = view;
        this.render();
    }

    async refresh() {
        if (!userManager.hasGamificationAccess()) return;

        try {
            await this.loadWeeklyData();
            await this.loadMonthlyData();
            this.render();
        } catch (error) {
            console.error('Error refreshing personal rating:', error);
        }
    }

    showError(message) {
        const container = document.getElementById('personalRatingContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <p style="color: #ef4444;">❌ ${message}</p>
                <button onclick="personalRatingUI.refresh()" class="action-btn" style="margin-top: 1rem;">
                    <span data-i18n="try_again">Try Again</span>
                </button>
            </div>
        `;
    }
}

// Initialize
const personalRatingUI = new PersonalRatingUI();
window.personalRatingUI = personalRatingUI;
