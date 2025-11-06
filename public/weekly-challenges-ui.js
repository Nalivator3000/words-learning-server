// Weekly Challenges UI - 3 types of weekly challenges
// Only accessible to whitelisted users

class WeeklyChallengesUI {
    constructor() {
        this.userId = null;
        this.challenges = [];
        this.stats = null;
        this.initialized = false;
    }

    async init(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Weekly Challenges: Access denied');
            this.hideSection();
            return;
        }

        this.userId = userId;
        console.log('Weekly Challenges UI: Initializing for user', userId);

        try {
            await this.loadChallenges();
            await this.loadStats();
            this.render();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Weekly Challenges UI:', error);
            this.showError(error.message);
        }
    }

    hideSection() {
        const section = document.getElementById('weeklyChallengesSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadChallenges() {
        try {
            const response = await fetch(`/api/weekly-challenges/${this.userId}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to load weekly challenges');
            }
            this.challenges = await response.json();
            console.log('Weekly challenges loaded:', this.challenges);
        } catch (error) {
            console.error('Error loading weekly challenges:', error);
            throw error;
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`/api/weekly-challenges/stats/${this.userId}`);
            if (!response.ok) throw new Error('Failed to load stats');
            this.stats = await response.json();
            console.log('Weekly challenges stats:', this.stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = { completed_this_week: 0, total_completed: 0, streak: 0 };
        }
    }

    render() {
        const container = document.getElementById('weeklyChallengesContent');
        if (!container) return;

        if (this.challenges.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p data-i18n="no_weekly_challenges">No weekly challenges available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="weekly-challenges-header">
                <div class="week-info">
                    <h3 data-i18n="week_of">Week of</h3>
                    <p>${new Date(this.challenges[0].week_start_date).toLocaleDateString()}</p>
                </div>
                <div class="weekly-stats">
                    <div class="stat-item">
                        <span class="stat-value">${this.stats.completed_this_week || 0}/3</span>
                        <span class="stat-label" data-i18n="completed_this_week">Completed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.stats.total_completed || 0}</span>
                        <span class="stat-label" data-i18n="total_completed">Total</span>
                    </div>
                </div>
            </div>

            <div class="weekly-challenges-list">
                ${this.challenges.map(challenge => this.renderChallenge(challenge)).join('')}
            </div>
        `;

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderChallenge(challenge) {
        const progress = Math.min(100, (challenge.current_progress / challenge.target_value) * 100);
        const isCompleted = challenge.is_completed;
        const isClaimed = challenge.is_claimed;

        const difficultyColors = {
            'easy': '#10b981',
            'medium': '#f59e0b',
            'hard': '#ef4444'
        };

        const difficultyColor = difficultyColors[challenge.difficulty] || '#6366f1';

        return `
            <div class="weekly-challenge-card ${isCompleted ? 'completed' : ''}" data-challenge-id="${challenge.id}">
                <div class="challenge-header">
                    <div class="challenge-title-row">
                        <h4>${challenge.title}</h4>
                        <span class="difficulty-badge" style="background: ${difficultyColor}20; color: ${difficultyColor}; border-color: ${difficultyColor};">
                            ${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                        </span>
                    </div>
                    <p class="challenge-description">${challenge.description}</p>
                </div>

                <div class="challenge-progress">
                    <div class="progress-info">
                        <span class="progress-text">
                            <strong>${challenge.current_progress}</strong> / ${challenge.target_value}
                        </span>
                        <span class="progress-percentage">${Math.round(progress)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${difficultyColor};"></div>
                    </div>
                </div>

                <div class="challenge-footer">
                    <div class="challenge-rewards">
                        <span class="reward-item">
                            <span class="reward-icon">⭐</span>
                            <span class="reward-value">${challenge.reward_xp} XP</span>
                        </span>
                        <span class="reward-item">
                            <span class="reward-icon">💰</span>
                            <span class="reward-value">${challenge.reward_coins} coins</span>
                        </span>
                    </div>
                    ${this.renderChallengeButton(challenge)}
                </div>
            </div>
        `;
    }

    renderChallengeButton(challenge) {
        if (challenge.is_claimed) {
            return `
                <button class="claim-btn claimed" disabled>
                    <span data-i18n="claimed">✓ Claimed</span>
                </button>
            `;
        } else if (challenge.is_completed) {
            return `
                <button class="claim-btn" onclick="weeklyChallengesUI.claimReward(${challenge.id})">
                    <span data-i18n="claim_reward">Claim Reward</span>
                </button>
            `;
        } else {
            return `
                <button class="claim-btn" disabled>
                    <span data-i18n="in_progress">In Progress...</span>
                </button>
            `;
        }
    }

    async claimReward(challengeId) {
        try {
            const response = await fetch(`/api/weekly-challenges/${challengeId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to claim reward');
            }

            const result = await response.json();
            console.log('Reward claimed:', result);

            // Show success message
            if (window.showToast) {
                showToast(`🎉 +${result.reward_xp} XP, +${result.reward_coins} coins!`, 'success');
            }

            // Reload challenges and stats
            await this.loadChallenges();
            await this.loadStats();
            this.render();

            // Update gamification header
            if (window.app && window.app.loadGamificationHeader) {
                await window.app.loadGamificationHeader();
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
            if (window.showToast) {
                showToast(error.message, 'error');
            }
        }
    }

    async refresh() {
        if (!userManager.hasGamificationAccess()) return;

        try {
            await this.loadChallenges();
            await this.loadStats();
            this.render();
        } catch (error) {
            console.error('Error refreshing weekly challenges:', error);
        }
    }

    showError(message) {
        const container = document.getElementById('weeklyChallengesContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <p style="color: #ef4444;">❌ ${message}</p>
                <button onclick="weeklyChallengesUI.refresh()" class="action-btn" style="margin-top: 1rem;">
                    <span data-i18n="try_again">Try Again</span>
                </button>
            </div>
        `;
    }
}

// Initialize
const weeklyChallengesUI = new WeeklyChallengesUI();
window.weeklyChallengesUI = weeklyChallengesUI;
