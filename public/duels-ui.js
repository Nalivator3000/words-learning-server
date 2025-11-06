// Duels UI - 1v1 competitive word battles with friends
// Only accessible to whitelisted users (feature level 10)

class DuelsUI {
    constructor() {
        this.userId = null;
        this.activeDuels = [];
        this.pendingDuels = [];
        this.history = [];
        this.stats = null;
        this.currentTab = 'active'; // 'active', 'pending', 'history', 'stats'
        this.initialized = false;
    }

    async init(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Duels: Access denied');
            this.hideSection();
            return;
        }

        this.userId = userId;
        console.log('Duels UI: Initializing for user', userId);

        try {
            await this.loadData();
            this.render();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Duels UI:', error);
            this.showError(error.message);
        }
    }

    hideSection() {
        const section = document.getElementById('duelsSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadData() {
        try {
            // Load active duels, pending requests, history, and stats
            const [activeRes, statsRes] = await Promise.all([
                fetch(`/api/duels/active/${this.userId}`),
                fetch(`/api/duels/stats/${this.userId}`)
            ]);

            if (!activeRes.ok || !statsRes.ok) {
                throw new Error('Failed to load duels data');
            }

            const activeData = await activeRes.json();
            this.stats = await statsRes.json();

            // Separate active and pending duels
            this.activeDuels = activeData.filter(d => d.status === 'active');
            this.pendingDuels = activeData.filter(d => d.status === 'pending');

            // Load history separately
            const historyRes = await fetch(`/api/duels/history/${this.userId}?limit=20`);
            if (historyRes.ok) {
                this.history = await historyRes.json();
            }

            console.log('Duels data loaded:', {
                active: this.activeDuels.length,
                pending: this.pendingDuels.length,
                history: this.history.length,
                stats: this.stats
            });
        } catch (error) {
            console.error('Error loading duels data:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('duelsContent');
        if (!container) return;

        // Count pending incoming challenges
        const incomingCount = this.pendingDuels.filter(d => d.opponent_id === this.userId).length;

        container.innerHTML = `
            <div class="duels-header">
                <div class="duels-stats-summary">
                    <div class="stat-card-mini">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-info">
                            <div class="stat-value">${this.stats?.total_wins || 0}</div>
                            <div class="stat-label" data-i18n="wins">Wins</div>
                        </div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <div class="stat-value">${this.stats?.total_duels || 0}</div>
                            <div class="stat-label" data-i18n="total_duels">Total</div>
                        </div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-info">
                            <div class="stat-value">${this.stats?.win_rate || 0}%</div>
                            <div class="stat-label" data-i18n="win_rate">Win Rate</div>
                        </div>
                    </div>
                </div>

                <button class="challenge-btn" id="newDuelBtn">
                    <span data-i18n="challenge_friend">⚔️ Challenge Friend</span>
                </button>
            </div>

            <div class="duels-tabs">
                <button class="tab-btn ${this.currentTab === 'active' ? 'active' : ''}" data-tab="active">
                    <span data-i18n="active_duels">Active</span>
                    ${this.activeDuels.length > 0 ? `<span class="tab-count">${this.activeDuels.length}</span>` : ''}
                </button>
                <button class="tab-btn ${this.currentTab === 'pending' ? 'active' : ''}" data-tab="pending">
                    <span data-i18n="pending_duels">Pending</span>
                    ${incomingCount > 0 ? `<span class="tab-badge">${incomingCount}</span>` : ''}
                </button>
                <button class="tab-btn ${this.currentTab === 'history' ? 'active' : ''}" data-tab="history">
                    <span data-i18n="duel_history">History</span>
                </button>
                <button class="tab-btn ${this.currentTab === 'stats' ? 'active' : ''}" data-tab="stats">
                    <span data-i18n="statistics">Stats</span>
                </button>
            </div>

            <div class="duels-content-area">
                ${this.renderTabContent()}
            </div>
        `;

        // Add event listeners
        this.attachEventListeners(container);

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderTabContent() {
        switch (this.currentTab) {
            case 'active':
                return this.renderActiveDuels();
            case 'pending':
                return this.renderPendingDuels();
            case 'history':
                return this.renderHistory();
            case 'stats':
                return this.renderStats();
            default:
                return '';
        }
    }

    renderActiveDuels() {
        if (this.activeDuels.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">⚔️</div>
                    <h3 data-i18n="no_active_duels">No active duels</h3>
                    <p data-i18n="challenge_friend_hint">Challenge a friend to start a duel!</p>
                    <button class="action-btn new-duel-btn">
                        <span data-i18n="challenge_friend">Challenge Friend</span>
                    </button>
                </div>
            `;
        }

        return `
            <div class="duels-list">
                ${this.activeDuels.map(duel => this.renderDuelCard(duel, 'active')).join('')}
            </div>
        `;
    }

    renderPendingDuels() {
        if (this.pendingDuels.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <h3 data-i18n="no_pending_duels">No pending duels</h3>
                    <p data-i18n="pending_duels_hint">Incoming and outgoing challenges will appear here</p>
                </div>
            `;
        }

        const incoming = this.pendingDuels.filter(d => d.opponent_id === this.userId);
        const outgoing = this.pendingDuels.filter(d => d.challenger_id === this.userId);

        return `
            <div class="pending-sections">
                ${incoming.length > 0 ? `
                    <div class="pending-section">
                        <h3 data-i18n="incoming_challenges">Incoming Challenges</h3>
                        <div class="duels-list">
                            ${incoming.map(duel => this.renderDuelCard(duel, 'incoming')).join('')}
                        </div>
                    </div>
                ` : ''}

                ${outgoing.length > 0 ? `
                    <div class="pending-section">
                        <h3 data-i18n="outgoing_challenges">Outgoing Challenges</h3>
                        <div class="duels-list">
                            ${outgoing.map(duel => this.renderDuelCard(duel, 'outgoing')).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderDuelCard(duel, type) {
        const isChallenger = duel.challenger_id === this.userId;
        const opponentName = isChallenger ? duel.opponent_username : duel.challenger_username;
        const opponentId = isChallenger ? duel.opponent_id : duel.challenger_id;

        return `
            <div class="duel-card ${type}" data-duel-id="${duel.id}">
                <div class="duel-opponent">
                    <div class="opponent-avatar">
                        <div class="avatar-placeholder">${opponentName.charAt(0).toUpperCase()}</div>
                    </div>
                    <div class="opponent-info">
                        <h4 class="opponent-name">${opponentName}</h4>
                        <p class="duel-meta">
                            ${duel.questions_count || 10} <span data-i18n="questions">questions</span>
                            • ${Math.floor((duel.time_limit_seconds || 120) / 60)} <span data-i18n="minutes">min</span>
                        </p>
                    </div>
                </div>

                <div class="duel-status">
                    ${this.renderDuelStatus(duel, type)}
                </div>

                <div class="duel-actions">
                    ${this.renderDuelActions(duel, type)}
                </div>
            </div>
        `;
    }

    renderDuelStatus(duel, type) {
        if (type === 'active') {
            const progress = this.calculateProgress(duel);
            return `
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <p class="progress-text">${progress}% <span data-i18n="completed">completed</span></p>
                </div>
            `;
        }

        if (type === 'incoming') {
            return `
                <span class="status-badge incoming" data-i18n="awaiting_response">Awaiting Response</span>
            `;
        }

        if (type === 'outgoing') {
            return `
                <span class="status-badge outgoing" data-i18n="waiting">Waiting...</span>
            `;
        }

        return '';
    }

    renderDuelActions(duel, type) {
        if (type === 'active') {
            return `
                <button class="action-btn continue-btn" data-duel-id="${duel.id}">
                    <span data-i18n="continue_duel">Continue</span>
                </button>
            `;
        }

        if (type === 'incoming') {
            return `
                <button class="action-btn accept-btn" data-duel-id="${duel.id}">
                    <span data-i18n="accept">Accept</span>
                </button>
                <button class="action-btn-small decline-btn" data-duel-id="${duel.id}">
                    <span data-i18n="decline">Decline</span>
                </button>
            `;
        }

        if (type === 'outgoing') {
            return `
                <button class="action-btn-small cancel-btn" data-duel-id="${duel.id}">
                    <span data-i18n="cancel">Cancel</span>
                </button>
            `;
        }

        return '';
    }

    renderHistory() {
        if (this.history.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <h3 data-i18n="no_history">No duel history</h3>
                    <p data-i18n="history_hint">Completed duels will appear here</p>
                </div>
            `;
        }

        return `
            <div class="history-list">
                ${this.history.map(duel => this.renderHistoryCard(duel)).join('')}
            </div>
        `;
    }

    renderHistoryCard(duel) {
        const isChallenger = duel.challenger_id === this.userId;
        const opponentName = isChallenger ? duel.opponent_username : duel.challenger_username;
        const isWinner = duel.winner_id === this.userId;
        const isDraw = !duel.winner_id;

        const result = isDraw ? 'draw' : (isWinner ? 'won' : 'lost');
        const resultIcon = isDraw ? '🤝' : (isWinner ? '🏆' : '❌');

        return `
            <div class="history-card ${result}">
                <div class="history-result">
                    <div class="result-icon">${resultIcon}</div>
                    <div class="result-text">
                        <span data-i18n="${result}">${result.toUpperCase()}</span>
                    </div>
                </div>

                <div class="history-opponent">
                    <span data-i18n="vs">vs</span> <strong>${opponentName}</strong>
                </div>

                <div class="history-score">
                    <span>${duel.challenger_score || 0}</span>
                    <span>:</span>
                    <span>${duel.opponent_score || 0}</span>
                </div>

                <div class="history-date">
                    ${this.formatDate(duel.completed_at || duel.created_at)}
                </div>
            </div>
        `;
    }

    renderStats() {
        if (!this.stats || this.stats.total_duels === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3 data-i18n="no_stats">No statistics yet</h3>
                    <p data-i18n="stats_hint">Complete duels to see your stats</p>
                </div>
            `;
        }

        return `
            <div class="stats-grid">
                <div class="stat-card-large">
                    <h3 data-i18n="total_duels">Total Duels</h3>
                    <div class="stat-value-large">${this.stats.total_duels}</div>
                </div>

                <div class="stat-card-large">
                    <h3 data-i18n="wins">Wins</h3>
                    <div class="stat-value-large win">${this.stats.total_wins}</div>
                </div>

                <div class="stat-card-large">
                    <h3 data-i18n="losses">Losses</h3>
                    <div class="stat-value-large loss">${this.stats.total_losses}</div>
                </div>

                <div class="stat-card-large">
                    <h3 data-i18n="draws">Draws</h3>
                    <div class="stat-value-large draw">${this.stats.total_draws}</div>
                </div>

                <div class="stat-card-large wide">
                    <h3 data-i18n="win_rate">Win Rate</h3>
                    <div class="win-rate-display">
                        <div class="win-rate-value">${this.stats.win_rate}%</div>
                        <div class="win-rate-bar">
                            <div class="win-rate-fill" style="width: ${this.stats.win_rate}%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card-large wide">
                    <h3 data-i18n="average_score">Average Score</h3>
                    <div class="stat-value-large">${this.stats.avg_score || 0}</div>
                </div>
            </div>
        `;
    }

    calculateProgress(duel) {
        // Estimate progress based on timestamps
        // This is a rough estimate - ideally we'd track actual answers count
        if (!duel.started_at) return 0;

        const now = new Date();
        const started = new Date(duel.started_at);
        const timeLimit = (duel.time_limit_seconds || 120) * 1000;
        const elapsed = now - started;

        return Math.min(100, Math.floor((elapsed / timeLimit) * 100));
    }

    attachEventListeners(container) {
        // Tab buttons
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // New duel button (in header and empty state)
        container.querySelectorAll('#newDuelBtn, .new-duel-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showNewDuelModal());
        });

        // Accept/Decline buttons
        container.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const duelId = e.currentTarget.getAttribute('data-duel-id');
                this.acceptDuel(parseInt(duelId));
            });
        });

        container.querySelectorAll('.decline-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const duelId = e.currentTarget.getAttribute('data-duel-id');
                this.declineDuel(parseInt(duelId));
            });
        });

        // Continue duel button
        container.querySelectorAll('.continue-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const duelId = e.currentTarget.getAttribute('data-duel-id');
                this.continueDuel(parseInt(duelId));
            });
        });
    }

    switchTab(tab) {
        if (this.currentTab === tab) return;
        this.currentTab = tab;
        this.render();
    }

    async showNewDuelModal() {
        // Show modal to select a friend to challenge
        // For now, show a simple prompt
        if (!window.friendsUI || !window.friendsUI.friends || window.friendsUI.friends.length === 0) {
            if (window.showToast) {
                showToast('You need friends to challenge! Add friends first.', 'warning');
            }
            // Switch to friends tab
            if (window.app) {
                window.app.showSection('friends');
            }
            return;
        }

        // Create a simple selection modal
        const friendsList = window.friendsUI.friends.map(f =>
            `<option value="${f.friend_id}">${f.username}</option>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'duel-modal';
        modal.innerHTML = `
            <div class="duel-modal-content">
                <h3 data-i18n="challenge_friend">Challenge Friend</h3>
                <select id="friendSelect" class="friend-select">
                    ${friendsList}
                </select>
                <div class="modal-actions">
                    <button class="action-btn" id="sendChallengeBtn">
                        <span data-i18n="send_challenge">Send Challenge</span>
                    </button>
                    <button class="action-btn-small" id="cancelModalBtn">
                        <span data-i18n="cancel">Cancel</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Update i18n for modal
        if (window.i18n) {
            i18n.updatePageTranslations();
        }

        // Add event listeners
        const sendBtn = modal.querySelector('#sendChallengeBtn');
        const cancelBtn = modal.querySelector('#cancelModalBtn');
        const friendSelect = modal.querySelector('#friendSelect');

        sendBtn.addEventListener('click', async () => {
            const friendId = parseInt(friendSelect.value);
            await this.challengeFriend(friendId);
            document.body.removeChild(modal);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    async challengeFriend(friendId) {
        try {
            const response = await fetch('/api/duels/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challenger_id: this.userId,
                    opponent_id: friendId,
                    questions_count: 10,
                    time_limit_seconds: 120
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send challenge');
            }

            if (window.showToast) {
                showToast('Challenge sent! ⚔️', 'success');
            }

            await this.refresh();
        } catch (error) {
            console.error('Error challenging friend:', error);
            if (window.showToast) {
                showToast(error.message, 'error');
            }
        }
    }

    async acceptDuel(duelId) {
        try {
            const response = await fetch(`/api/duels/${duelId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    accepted: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to accept duel');
            }

            if (window.showToast) {
                showToast('Challenge accepted! Let the battle begin! ⚔️', 'success');
            }

            await this.refresh();
        } catch (error) {
            console.error('Error accepting duel:', error);
            if (window.showToast) {
                showToast('Failed to accept challenge', 'error');
            }
        }
    }

    async declineDuel(duelId) {
        try {
            const response = await fetch(`/api/duels/${duelId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    accepted: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to decline duel');
            }

            if (window.showToast) {
                showToast('Challenge declined', 'info');
            }

            await this.refresh();
        } catch (error) {
            console.error('Error declining duel:', error);
            if (window.showToast) {
                showToast('Failed to decline challenge', 'error');
            }
        }
    }

    async continueDuel(duelId) {
        // Start duel gameplay
        if (window.duelGameplay) {
            await window.duelGameplay.start(duelId, this.userId);
        } else {
            console.error('Duel gameplay not loaded');
            if (window.showToast) {
                showToast('Error: Duel gameplay not available', 'error');
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    async refresh() {
        if (!userManager.hasGamificationAccess()) return;

        try {
            await this.loadData();
            this.render();
        } catch (error) {
            console.error('Error refreshing duels:', error);
        }
    }

    showError(message) {
        const container = document.getElementById('duelsContent');
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

        const retryBtn = container.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.refresh());
        }
    }
}

// Initialize
const duelsUI = new DuelsUI();
window.duelsUI = duelsUI;
