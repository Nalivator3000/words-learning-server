// Leagues UI - Competitive League System with Leaderboards
// Only accessible to whitelisted users

class LeaguesUI {
    constructor() {
        this.userId = null;
        this.currentLeague = null;
        this.leaderboard = [];
        this.tiers = [];
        this.initialized = false;
    }

    async init(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Leagues: Access denied');
            this.hideLeaguesSection();
            return;
        }

        this.userId = userId;
        console.log('Leagues UI: Initializing for user', userId);

        try {
            await this.loadTiers();
            await this.loadCurrentLeague();
            await this.loadLeaderboard();
            this.renderLeaguesUI();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Leagues UI:', error);
        }
    }

    hideLeaguesSection() {
        const section = document.getElementById('leaguesSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadTiers() {
        try {
            const response = await fetch(`/api/leagues/tiers`);
            if (!response.ok) throw new Error('Failed to load tiers');
            this.tiers = await response.json();
            console.log('Loaded tiers:', this.tiers);
        } catch (error) {
            console.error('Error loading tiers:', error);
            throw error;
        }
    }

    async loadCurrentLeague() {
        try {
            const response = await fetch(`/api/leagues/current/${this.userId}`);
            if (!response.ok) throw new Error('Failed to load current league');
            this.currentLeague = await response.json();
            console.log('Current league:', this.currentLeague);
        } catch (error) {
            console.error('Error loading current league:', error);
            throw error;
        }
    }

    async loadLeaderboard() {
        try {
            if (!this.currentLeague) return;

            const response = await fetch(`/api/leagues/leaderboard/${this.currentLeague.league_tier}?limit=50`);
            if (!response.ok) throw new Error('Failed to load leaderboard');
            this.leaderboard = await response.json();
            console.log('Leaderboard:', this.leaderboard);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            throw error;
        }
    }

    renderLeaguesUI() {
        const container = document.getElementById('leaguesContent');
        if (!container) return;

        container.innerHTML = `
            <div class="leagues-header">
                <div class="current-league-badge">
                    <div class="league-icon" style="font-size: 3rem;">${this.currentLeague.icon}</div>
                    <div class="league-info">
                        <h2>${this.currentLeague.league_tier} League</h2>
                        <div class="league-xp">
                            <strong>${this.currentLeague.week_xp || 0} XP</strong> this week
                        </div>
                        <div class="week-info">
                            <small>Week of ${new Date(this.currentLeague.week_start_date).toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>

                <div class="league-tiers-nav">
                    ${this.tiers.map(tier => `
                        <button
                            class="tier-btn ${tier.tier_name === this.currentLeague.league_tier ? 'active' : ''}"
                            onclick="leaguesUI.switchTier('${tier.tier_name}')"
                            title="${tier.tier_name} (${tier.min_xp_required}+ XP)"
                            style="background: ${tier.color}20; border-color: ${tier.color};">
                            <span style="font-size: 1.5rem;">${tier.icon}</span>
                            <span class="tier-name">${tier.tier_name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="leaderboard-container">
                <h3 data-i18n="leaderboard">Leaderboard</h3>
                <div class="leaderboard-list">
                    ${this.leaderboard.map((entry, index) => this.renderLeaderboardEntry(entry, index)).join('')}
                </div>
            </div>

            <div class="league-rules">
                <h4 data-i18n="howItWorks">How it works</h4>
                <ul>
                    <li data-i18n="leagueRule1">Earn XP during the week to climb the leaderboard</li>
                    <li data-i18n="leagueRule2">Top 20% get promoted to the next league</li>
                    <li data-i18n="leagueRule3">Bottom 20% get demoted to the previous league</li>
                    <li data-i18n="leagueRule4">Week resets every Monday</li>
                </ul>
            </div>
        `;

        // Update i18n for new elements
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderLeaderboardEntry(entry, index) {
        const isCurrentUser = entry.user_id === this.userId;
        const rankClass = index < 3 ? `top-${index + 1}` : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        return `
            <div class="leaderboard-entry ${rankClass} ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank">
                    ${medal || `#${index + 1}`}
                </div>
                <div class="user-info">
                    ${entry.avatar_url ?
                        `<img src="${entry.avatar_url}" alt="${entry.username}" class="avatar">` :
                        `<div class="avatar-placeholder">${(entry.username || entry.name || '?')[0].toUpperCase()}</div>`
                    }
                    <div class="user-details">
                        <div class="username">${entry.username || entry.name || 'User'} ${isCurrentUser ? '(You)' : ''}</div>
                        <div class="user-level">Level ${entry.level || 1}</div>
                    </div>
                </div>
                <div class="user-xp">
                    <strong>${entry.week_xp}</strong> XP
                </div>
            </div>
        `;
    }

    async switchTier(tierName) {
        if (!userManager.hasGamificationAccess()) return;

        try {
            // Load leaderboard for the selected tier
            const response = await fetch(`/api/leagues/leaderboard/${tierName}?limit=50`);
            if (!response.ok) throw new Error('Failed to load leaderboard');
            this.leaderboard = await response.json();

            // Update the current view (but don't change user's actual league)
            const tierInfo = this.tiers.find(t => t.tier_name === tierName);
            const tempLeague = {
                ...this.currentLeague,
                league_tier: tierName,
                icon: tierInfo.icon,
                color: tierInfo.color
            };

            // Temporarily store original league
            const originalLeague = this.currentLeague;
            this.currentLeague = tempLeague;

            // Re-render
            this.renderLeaguesUI();

            // Restore original league (for badge display)
            this.currentLeague = originalLeague;
        } catch (error) {
            console.error('Error switching tier:', error);
        }
    }

    async refresh() {
        if (!userManager.hasGamificationAccess()) return;

        try {
            await this.loadCurrentLeague();
            await this.loadLeaderboard();
            this.renderLeaguesUI();
        } catch (error) {
            console.error('Error refreshing leagues:', error);
        }
    }
}

// Initialize
const leaguesUI = new LeaguesUI();
window.leaguesUI = leaguesUI;
