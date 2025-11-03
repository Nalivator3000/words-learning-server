// features-ui.js - UI for Daily Challenges, Streak Freeze, and Bug Reports

class FeaturesUI {
    constructor() {
        this.userId = null;
        this.currentLanguagePairId = null;
        this.initializeEventListeners();
    }

    setUser(userId, languagePairId) {
        this.userId = userId;
        this.currentLanguagePairId = languagePairId;
    }

    initializeEventListeners() {
        // Navigation button for challenges
        const challengesBtn = document.getElementById('challengesBtn');
        if (challengesBtn) {
            challengesBtn.addEventListener('click', () => {
                this.loadDailyChallenges();
            });
        }

        // Streak Freeze buttons
        const useFreezeBtn = document.getElementById('useFreezeBtn');
        if (useFreezeBtn) {
            useFreezeBtn.addEventListener('click', () => this.useStreakFreeze());
        }

        const claimFreeFreezeBtn = document.getElementById('claimFreeFreezeBtn');
        if (claimFreeFreezeBtn) {
            claimFreeFreezeBtn.addEventListener('click', () => this.claimFreeFreeze());
        }

        // Bug Report form
        const bugReportForm = document.getElementById('bugReportForm');
        if (bugReportForm) {
            bugReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitBugReport();
            });

            // Character counter
            const bugDescription = document.getElementById('bugDescription');
            const charCount = document.getElementById('charCount');
            if (bugDescription && charCount) {
                bugDescription.addEventListener('input', () => {
                    const remaining = 2000 - bugDescription.value.length;
                    charCount.textContent = remaining;
                });
            }
        }
    }

    // ==================== DAILY CHALLENGES ====================

    async loadDailyChallenges() {
        if (!this.userId) {
            showToast('error', i18n.t('login_required'));
            return;
        }

        const container = document.getElementById('challengesContainer');
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>' + i18n.t('loading') + '</p></div>';

        try {
            const response = await fetch(`${API_URL}/api/challenges/daily/${this.userId}`);
            const data = await response.json();

            if (data.challenges && data.challenges.length > 0) {
                this.renderChallenges(data.challenges);
                this.updateChallengesStats(data.challenges);
            } else {
                container.innerHTML = '<p>' + i18n.t('no_challenges_today') + '</p>';
            }
        } catch (error) {
            console.error('Error loading challenges:', error);
            container.innerHTML = '<p class="error">' + i18n.t('error_loading_challenges') + '</p>';
            showToast('error', i18n.t('error_loading_challenges'));
        }
    }

    renderChallenges(challenges) {
        const container = document.getElementById('challengesContainer');

        const challengesHTML = challenges.map(challenge => {
            const progress = (challenge.current_progress / challenge.target_value) * 100;
            const isCompleted = challenge.completed;
            const canClaim = isCompleted && !challenge.reward_claimed;
            const difficulty = challenge.difficulty;
            const difficultyColor = {
                easy: '#10B981',
                medium: '#F59E0B',
                hard: '#EF4444'
            }[difficulty] || '#6366F1';

            return `
                <div class="challenge-card ${isCompleted ? 'completed' : ''}" style="border-left: 4px solid ${difficultyColor}">
                    <div class="challenge-header">
                        <h3>${challenge.title}</h3>
                        <span class="challenge-difficulty" style="background: ${difficultyColor}">
                            ${i18n.t('challenge_' + difficulty)}
                        </span>
                    </div>
                    <p class="challenge-description">${challenge.description}</p>

                    <div class="challenge-progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <p class="challenge-progress-text">
                        ${i18n.t('challenge_progress')}: ${challenge.current_progress}/${challenge.target_value}
                    </p>

                    <div class="challenge-reward">
                        <span>💰 ${challenge.reward_coins} ${i18n.t('coins')}</span>
                        <span>⭐ ${challenge.reward_xp} XP</span>
                    </div>

                    ${canClaim ? `
                        <button class="action-btn claim-reward-btn" data-challenge-id="${challenge.id}">
                            🎁 ${i18n.t('challenge_claim_reward')}
                        </button>
                    ` : ''}

                    ${isCompleted && challenge.reward_claimed ? `
                        <div class="challenge-completed-badge">
                            ✅ ${i18n.t('challenge_completed')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = challengesHTML;

        // Add event listeners to claim buttons
        container.querySelectorAll('.claim-reward-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const challengeId = btn.getAttribute('data-challenge-id');
                this.claimChallengeReward(challengeId);
            });
        });
    }

    updateChallengesStats(challenges) {
        const completed = challenges.filter(c => c.completed).length;
        const total = challenges.length;

        document.getElementById('challengesCompletedToday').textContent = `${completed}/${total}`;

        // TODO: Load streak and total from API
        // For now, just show placeholder
    }

    async claimChallengeReward(challengeId) {
        try {
            const response = await fetch(`${API_URL}/api/challenges/claim-reward/${challengeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId })
            });

            const data = await response.json();

            if (data.success) {
                showToast('success', `🎁 +${data.reward.coins} монет, +${data.reward.xp} XP!`);
                this.loadDailyChallenges(); // Reload to update UI

                // Update gamification header
                if (window.gamificationManager) {
                    window.gamificationManager.loadGamificationData();
                }
            } else {
                showToast('error', data.message || i18n.t('error_claiming_reward'));
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
            showToast('error', i18n.t('error_claiming_reward'));
        }
    }

    // ==================== STREAK FREEZE ====================

    async loadStreakFreezes() {
        if (!this.userId) return;

        try {
            const response = await fetch(`${API_URL}/api/streak-freeze/${this.userId}`);
            const data = await response.json();

            this.renderActiveFreezes(data.freezes || []);
            this.updateFreezeButton(data.freezes || []);

            // Load history
            await this.loadFreezeHistory();
        } catch (error) {
            console.error('Error loading freezes:', error);
            document.getElementById('activeFreezes').innerHTML =
                '<p class="error">' + i18n.t('error_loading_freezes') + '</p>';
        }
    }

    renderActiveFreezes(freezes) {
        const container = document.getElementById('activeFreezes');

        if (freezes.length === 0) {
            container.innerHTML = `<p class="no-data">${i18n.t('no_active_freezes')}</p>`;
            return;
        }

        const freezesHTML = freezes.map(freeze => {
            const expiresDate = new Date(freeze.expires_at).toLocaleDateString();
            const daysLeft = Math.ceil((new Date(freeze.expires_at) - new Date()) / (1000 * 60 * 60 * 24));

            return `
                <div class="freeze-card">
                    <div class="freeze-icon">❄️</div>
                    <div class="freeze-info">
                        <h4>${freeze.freeze_days} ${i18n.t('days_short')}</h4>
                        <p>${i18n.t('freeze_expires')}: ${expiresDate}</p>
                        <p class="freeze-days-left">${daysLeft} ${i18n.t('freeze_days_left')}</p>
                    </div>
                    <div class="freeze-status active">
                        ${i18n.t('freeze_active')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = freezesHTML;
    }

    updateFreezeButton(freezes) {
        const btn = document.getElementById('useFreezeBtn');
        const status = document.getElementById('freezeStatus');

        if (freezes.length > 0) {
            btn.disabled = false;
            status.textContent = `✅ ${i18n.t('available')}: ${freezes.length}`;
            status.style.color = '#10B981';
        } else {
            btn.disabled = true;
            status.textContent = `❌ ${i18n.t('freeze_not_available')}`;
            status.style.color = '#EF4444';
        }
    }

    async useStreakFreeze() {
        if (!this.userId) return;

        try {
            const response = await fetch(`${API_URL}/api/streak-freeze/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    usageType: 'manual'
                })
            });

            const data = await response.json();

            if (data.success) {
                showToast('success', i18n.t('freeze_used_successfully'));
                this.loadStreakFreezes(); // Reload
            } else {
                showToast('error', data.message || i18n.t('freeze_not_available'));
            }
        } catch (error) {
            console.error('Error using freeze:', error);
            showToast('error', i18n.t('error_using_freeze'));
        }
    }

    async claimFreeFreeze() {
        if (!this.userId) return;

        try {
            const response = await fetch(`${API_URL}/api/streak-freeze/${this.userId}/claim-free`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                showToast('success', i18n.t('free_freeze_claimed'));
                this.loadStreakFreezes(); // Reload
            } else {
                showToast('error', data.message || i18n.t('error_claiming_freeze'));
            }
        } catch (error) {
            console.error('Error claiming free freeze:', error);
            showToast('error', i18n.t('error_claiming_freeze'));
        }
    }

    async loadFreezeHistory() {
        if (!this.userId) return;

        try {
            const response = await fetch(`${API_URL}/api/streak-freeze/${this.userId}/history`);
            const data = await response.json();

            this.renderFreezeHistory(data.history || []);
        } catch (error) {
            console.error('Error loading freeze history:', error);
        }
    }

    renderFreezeHistory(history) {
        const container = document.getElementById('freezeHistory');

        if (history.length === 0) {
            container.innerHTML = `<p class="no-data">${i18n.t('no_history')}</p>`;
            return;
        }

        const historyHTML = history.slice(0, 10).map(item => {
            const date = new Date(item.used_on_date || item.created_at).toLocaleDateString();
            const type = item.usage_type === 'auto' ? '🤖' : '👤';

            return `
                <div class="history-item">
                    <span class="history-icon">${type}</span>
                    <span class="history-date">${date}</span>
                    <span class="history-days">${item.freeze_days} ${i18n.t('days_short')}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = historyHTML;
    }

    // ==================== BUG REPORTS ====================

    async submitBugReport() {
        if (!this.userId) {
            showToast('error', i18n.t('login_required'));
            return;
        }

        const form = document.getElementById('bugReportForm');
        const title = document.getElementById('bugTitle').value;
        const description = document.getElementById('bugDescription').value;
        const severity = document.getElementById('bugSeverity').value;
        const steps = document.getElementById('bugSteps').value;

        if (!title || !description) {
            showToast('error', i18n.t('fill_required_fields'));
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/bugs/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    title,
                    description,
                    severity,
                    stepsToReproduce: steps,
                    userAgent: navigator.userAgent,
                    currentUrl: window.location.href
                })
            });

            const data = await response.json();

            if (data.success) {
                showToast('success', i18n.t('bug_report_sent'));
                form.reset();
                document.getElementById('charCount').textContent = '2000';
                this.loadRecentBugReports(); // Reload list
            } else {
                showToast('error', data.message || i18n.t('error_sending_report'));
            }
        } catch (error) {
            console.error('Error submitting bug report:', error);
            showToast('error', i18n.t('error_sending_report'));
        }
    }

    async loadRecentBugReports() {
        if (!this.userId) return;

        const container = document.getElementById('recentBugReports');
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        try {
            const response = await fetch(`${API_URL}/api/bugs/user/${this.userId}?limit=5`);
            const data = await response.json();

            this.renderBugReports(data.reports || []);
        } catch (error) {
            console.error('Error loading bug reports:', error);
            container.innerHTML = '<p class="error">' + i18n.t('error_loading_reports') + '</p>';
        }
    }

    renderBugReports(reports) {
        const container = document.getElementById('recentBugReports');

        if (reports.length === 0) {
            container.innerHTML = `<p class="no-data">${i18n.t('no_bug_reports')}</p>`;
            return;
        }

        const reportsHTML = reports.map(report => {
            const date = new Date(report.created_at).toLocaleDateString();
            const statusColors = {
                new: '#6366F1',
                in_progress: '#F59E0B',
                resolved: '#10B981',
                closed: '#6B7280'
            };
            const statusColor = statusColors[report.status] || '#6B7280';

            return `
                <div class="bug-report-card" style="border-left: 4px solid ${statusColor}">
                    <div class="bug-header">
                        <h4>${report.title}</h4>
                        <span class="bug-status" style="background: ${statusColor}">
                            ${i18n.t('bug_status_' + report.status)}
                        </span>
                    </div>
                    <p class="bug-date">${date}</p>
                    <p class="bug-severity">
                        ${i18n.t('bug_severity')}: ${i18n.t('severity_' + report.severity)}
                    </p>
                </div>
            `;
        }).join('');

        container.innerHTML = reportsHTML;
    }
}

// Initialize Features UI
const featuresUI = new FeaturesUI();

// Export for use in other modules
window.featuresUI = featuresUI;
