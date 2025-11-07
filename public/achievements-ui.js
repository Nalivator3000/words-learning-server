// Achievements UI - Collection of achievements with locked/unlocked states
// Only accessible to whitelisted users

class AchievementsUI {
    constructor() {
        this.userId = null;
        this.achievements = [];
        this.currentCategory = 'all';
        this.initialized = false;
    }

    async init(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Achievements UI: Access denied');
            this.hideSection();
            return;
        }

        this.userId = userId;
        console.log('Achievements UI: Initializing for user', userId);

        try {
            await this.loadAchievements();
            this.render();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Achievements UI:', error);
            this.showError(error.message);
        }
    }

    hideSection() {
        const section = document.getElementById('achievementsSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadAchievements() {
        try {
            const response = await fetch(`/api/achievements?userId=${this.userId}`);
            if (!response.ok) throw new Error('Failed to load achievements');

            this.achievements = await response.json();
            console.log('Achievements loaded:', this.achievements);
        } catch (error) {
            console.error('Error loading achievements:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('achievementsContent');
        if (!container) return;

        const stats = this.calculateStats();

        container.innerHTML = `
            <div class="achievements-container">
                <!-- Stats Header -->
                <div class="achievements-header">
                    <div class="achievements-stats-summary">
                        <div class="stats-main">
                            <div class="stats-icon">🏆</div>
                            <div class="stats-info">
                                <div class="stats-value">${stats.unlocked} / ${stats.total}</div>
                                <div class="stats-label" data-i18n="achievements_unlocked">Achievements Unlocked</div>
                            </div>
                        </div>
                        <div class="stats-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${stats.percentage}%"></div>
                            </div>
                            <div class="progress-text">${stats.percentage}% <span data-i18n="complete">Complete</span></div>
                        </div>
                    </div>
                </div>

                <!-- Category Tabs -->
                <div class="achievements-tabs">
                    <button class="tab-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">
                        <span data-i18n="all_categories">All</span>
                        <span class="tab-count">${this.getCountByCategory('all')}</span>
                    </button>
                    <button class="tab-btn ${this.currentCategory === 'learning' ? 'active' : ''}" data-category="learning">
                        <span data-i18n="learning_achievements">Learning</span>
                        <span class="tab-count">${this.getCountByCategory('learning')}</span>
                    </button>
                    <button class="tab-btn ${this.currentCategory === 'social' ? 'active' : ''}" data-category="social">
                        <span data-i18n="social_achievements">Social</span>
                        <span class="tab-count">${this.getCountByCategory('social')}</span>
                    </button>
                    <button class="tab-btn ${this.currentCategory === 'milestones' ? 'active' : ''}" data-category="milestones">
                        <span data-i18n="milestone_achievements">Milestones</span>
                        <span class="tab-count">${this.getCountByCategory('milestones')}</span>
                    </button>
                    <button class="tab-btn ${this.currentCategory === 'special' ? 'active' : ''}" data-category="special">
                        <span data-i18n="special_achievements">Special</span>
                        <span class="tab-count">${this.getCountByCategory('special')}</span>
                    </button>
                </div>

                <!-- Achievements Grid -->
                <div class="achievements-grid">
                    ${this.renderAchievements()}
                </div>
            </div>
        `;

        // Add event listeners for category tabs
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.getAttribute('data-category');
                if (category) {
                    this.switchCategory(category);
                }
            });
        });

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderAchievements() {
        const filteredAchievements = this.currentCategory === 'all'
            ? this.achievements
            : this.achievements.filter(a => a.category === this.currentCategory);

        if (filteredAchievements.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <p data-i18n="no_achievements_category">No achievements in this category</p>
                </div>
            `;
        }

        return filteredAchievements.map(achievement => this.renderAchievementCard(achievement)).join('');
    }

    renderAchievementCard(achievement) {
        const userProgress = achievement.user_progress || {};
        const isUnlocked = userProgress.is_unlocked || false;
        const progress = userProgress.progress || 0;
        const target = achievement.target || userProgress.target || 1;
        const progressPercent = Math.min(100, (progress / target) * 100);

        const difficultyColors = {
            'bronze': '#cd7f32',
            'silver': '#c0c0c0',
            'gold': '#ffd700',
            'platinum': '#e5e4e2',
            'diamond': '#b9f2ff'
        };

        const difficultyColor = difficultyColors[achievement.difficulty] || '#6366f1';

        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                ${isUnlocked ? `
                    <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                ` : `
                    <div class="achievement-icon locked-icon">🔒</div>
                `}

                <div class="achievement-info">
                    <div class="achievement-title">${isUnlocked ? achievement.title : '???'}</div>
                    <div class="achievement-description">
                        ${isUnlocked || !achievement.is_secret ? achievement.description : 'Hidden achievement'}
                    </div>

                    ${!isUnlocked && target > 1 ? `
                        <div class="achievement-progress">
                            <div class="progress-bar small">
                                <div class="progress-fill" style="width: ${progressPercent}%; background: ${difficultyColor};"></div>
                            </div>
                            <div class="progress-text">${progress} / ${target}</div>
                        </div>
                    ` : ''}
                </div>

                <div class="achievement-meta">
                    <div class="achievement-difficulty" style="background: ${difficultyColor}20; color: ${difficultyColor}; border-color: ${difficultyColor};">
                        ${achievement.difficulty}
                    </div>
                    ${isUnlocked && userProgress.unlockedat ? `
                        <div class="achievement-date">
                            ${new Date(userProgress.unlockedat).toLocaleDateString()}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    calculateStats() {
        const unlocked = this.achievements.filter(a => a.user_progress?.is_unlocked).length;
        const total = this.achievements.length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        return { unlocked, total, percentage };
    }

    getCountByCategory(category) {
        if (category === 'all') {
            return this.achievements.length;
        }
        return this.achievements.filter(a => a.category === category).length;
    }

    switchCategory(category) {
        if (this.currentCategory === category) return;
        this.currentCategory = category;
        this.render();
    }

    async refresh() {
        if (!userManager.hasGamificationAccess()) return;

        try {
            await this.loadAchievements();
            this.render();
        } catch (error) {
            console.error('Error refreshing achievements:', error);
        }
    }

    showError(message) {
        const container = document.getElementById('achievementsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p style="color: #ef4444;">${message}</p>
                <button class="action-btn retry-btn" id="retryAchievementsBtn">
                    <span data-i18n="try_again">Try Again</span>
                </button>
            </div>
        `;

        const retryBtn = document.getElementById('retryAchievementsBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.refresh());
        }
    }
}

// Initialize
const achievementsUI = new AchievementsUI();
window.achievementsUI = achievementsUI;
