// Gamification Client-Side Logic
// Handles XP, levels, streaks, and activity tracking

class Gamification {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currentStats = null;
        this.activityData = null;
    }

    // Fetch user stats (XP, level, streaks)
    async getUserStats(userId) {
        try {
            const response = await fetch(`/api/gamification/stats/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch stats');

            this.currentStats = await response.json();
            return this.currentStats;
        } catch (err) {
            console.error('Error fetching user stats:', err);
            return null;
        }
    }

    // Fetch XP history
    async getXPLog(userId, limit = 50) {
        try {
            const response = await fetch(`/api/gamification/xp-log/${userId}?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch XP log');

            return await response.json();
        } catch (err) {
            console.error('Error fetching XP log:', err);
            return [];
        }
    }

    // Fetch activity calendar data
    async getActivityCalendar(userId, days = 365) {
        console.log(`📅 Fetching activity calendar for user ${userId}, days: ${days}`);
        try {
            const response = await fetch(`/api/gamification/activity/${userId}?days=${days}`);
            if (!response.ok) {
                console.error('❌ Activity API response not OK:', response.status, response.statusText);
                throw new Error('Failed to fetch activity');
            }

            this.activityData = await response.json();
            console.log(`✅ Activity data received: ${this.activityData.length} days`, this.activityData);
            return this.activityData;
        } catch (err) {
            console.error('❌ Error fetching activity:', err);
            return [];
        }
    }

    // Fetch all achievements
    async getAllAchievements() {
        try {
            const response = await fetch(`/api/gamification/achievements`);
            if (!response.ok) throw new Error('Failed to fetch achievements');

            return await response.json();
        } catch (err) {
            console.error('Error fetching achievements:', err);
            return [];
        }
    }

    // Fetch user's unlocked achievements
    async getUserAchievements(userId) {
        try {
            const response = await fetch(`/api/gamification/achievements/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user achievements');

            return await response.json();
        } catch (err) {
            console.error('Error fetching user achievements:', err);
            return [];
        }
    }

    // Fetch achievement progress
    async getAchievementProgress(userId) {
        try {
            const response = await fetch(`/api/gamification/achievements/${userId}/progress`);
            if (!response.ok) throw new Error('Failed to fetch achievement progress');

            return await response.json();
        } catch (err) {
            console.error('Error fetching achievement progress:', err);
            return [];
        }
    }

    // Fetch global leaderboard
    async getGlobalLeaderboard(limit = 100) {
        try {
            const response = await fetch(`/api/gamification/leaderboard/global?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch global leaderboard');

            return await response.json();
        } catch (err) {
            console.error('Error fetching global leaderboard:', err);
            return [];
        }
    }

    // Fetch weekly leaderboard
    async getWeeklyLeaderboard(limit = 100) {
        try {
            const response = await fetch(`/api/gamification/leaderboard/weekly?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch weekly leaderboard');

            return await response.json();
        } catch (err) {
            console.error('Error fetching weekly leaderboard:', err);
            return [];
        }
    }

    // Fetch user's rank
    async getUserRank(userId) {
        try {
            const response = await fetch(`/api/gamification/leaderboard/rank/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch user rank');

            return await response.json();
        } catch (err) {
            console.error('Error fetching user rank:', err);
            return { global: { rank: null }, weekly: { rank: null } };
        }
    }

    // Fetch daily goals
    async getDailyGoals(userId) {
        try {
            const response = await fetch(`/api/gamification/daily-goals/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch daily goals');

            return await response.json();
        } catch (err) {
            console.error('Error fetching daily goals:', err);
            return null;
        }
    }

    // Update daily goal targets
    async updateDailyGoals(userId, xpGoal, wordsGoal, quizzesGoal) {
        try {
            const response = await fetch(`/api/gamification/daily-goals/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xpGoal, wordsGoal, quizzesGoal })
            });

            if (!response.ok) throw new Error('Failed to update daily goals');
            return await response.json();
        } catch (err) {
            console.error('Error updating daily goals:', err);
            return null;
        }
    }

    // Render XP/Level display in header
    renderStatsHeader(containerElement, stats) {
        if (!stats) return;

        const { level, totalXP, currentLevelXP, xpForNextLevel, progress, currentStreak } = stats;

        containerElement.innerHTML = `
            <div class="gamification-header">
                <div class="level-display">
                    <span class="level-badge">Lvl. ${level}</span>
                    <div class="xp-bar-container" title="${currentLevelXP}/${xpForNextLevel} XP">
                        <div class="xp-bar" style="width: ${progress}%;"></div>
                    </div>
                    <span class="xp-text">${totalXP} XP</span>
                </div>
                <div class="streak-display" title="Current Streak">
                    🔥 ${currentStreak} ${i18n.t(currentStreak === 1 ? 'day' : 'days')}
                </div>
            </div>
        `;
    }

    // Render detailed stats page
    renderStatsPage(containerElement, stats, xpLog, activityData) {
        console.log('📊 renderStatsPage called with:', { stats, xpLogLength: xpLog?.length, activityDataLength: activityData?.length });
        if (!stats) return;

        const { level, totalXP, currentLevelXP, xpForNextLevel, progress, currentStreak, longestStreak, totalWordsLearned, totalQuizzesCompleted } = stats;

        containerElement.innerHTML = `
            <div class="gamification-stats">
                <!-- Streak Section -->
                <section class="stats-section">
                    <h2>🔥 Streaks</h2>
                    <div class="streak-cards">
                        <div class="streak-card">
                            <div class="streak-icon">🔥</div>
                            <div class="streak-value">${currentStreak}</div>
                            <div class="streak-label">Current Streak</div>
                        </div>
                        <div class="streak-card">
                            <div class="streak-icon">⭐</div>
                            <div class="streak-value">${longestStreak}</div>
                            <div class="streak-label">Record</div>
                        </div>
                    </div>
                </section>

                <!-- Activity Calendar -->
                <section class="stats-section">
                    <h2>📅 Activity</h2>
                    <div id="activity-calendar"></div>
                </section>

                <!-- Achievement Stats -->
                <section class="stats-section">
                    <h2>🏆 Statistics</h2>
                    <div class="achievement-stats">
                        <div class="stat-item">
                            <span class="stat-icon">📚</span>
                            <span class="stat-value">${totalWordsLearned}</span>
                            <span class="stat-label">Words Learned</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">✅</span>
                            <span class="stat-value">${totalQuizzesCompleted}</span>
                            <span class="stat-label">Exercises Completed</span>
                        </div>
                    </div>
                </section>

                <!-- Achievements Section -->
                <section class="stats-section">
                    <h2>🏅 Achievements</h2>
                    <div id="achievements-container"></div>
                </section>

                <!-- XP History -->
                <section class="stats-section">
                    <h2>📜 XP History</h2>
                    <div id="xp-log-container"></div>
                </section>
            </div>
        `;

        // Render activity calendar
        console.log('📅 Checking activity data:', { hasData: activityData && activityData.length > 0, dataLength: activityData?.length });
        if (activityData && activityData.length > 0) {
            this.renderActivityCalendar(document.getElementById('activity-calendar'), activityData);
        }

        // Render XP log
        if (xpLog && xpLog.length > 0) {
            this.renderXPLog(document.getElementById('xp-log-container'), xpLog);
        }
    }

    // Render activity calendar (GitHub-style heatmap)
    renderActivityCalendar(containerElement, activityData) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 364); // Last 365 days

        // Create map of dates to activity
        const activityMap = {};
        activityData.forEach(day => {
            activityMap[day.activity_date] = day.xp_earned || 0;
        });

        let calendarHTML = '<div class="activity-heatmap">';

        // Create 52 weeks
        for (let week = 0; week < 52; week++) {
            calendarHTML += '<div class="heatmap-week">';

            // Create 7 days
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);

                if (currentDate > today) {
                    calendarHTML += '<div class="heatmap-day empty"></div>';
                    continue;
                }

                const dateStr = currentDate.toISOString().split('T')[0];
                const xp = activityMap[dateStr] || 0;

                // Determine intensity level (0-4)
                let intensity = 0;
                if (xp > 0) intensity = 1;
                if (xp >= 50) intensity = 2;
                if (xp >= 100) intensity = 3;
                if (xp >= 200) intensity = 4;

                calendarHTML += `<div class="heatmap-day level-${intensity}"
                    title="${dateStr}: ${xp} XP"
                    data-date="${dateStr}"
                    data-xp="${xp}"></div>`;
            }

            calendarHTML += '</div>';
        }

        calendarHTML += '</div>';
        calendarHTML += `
            <div class="heatmap-legend">
                <span>Less</span>
                <div class="legend-box level-0"></div>
                <div class="legend-box level-1"></div>
                <div class="legend-box level-2"></div>
                <div class="legend-box level-3"></div>
                <div class="legend-box level-4"></div>
                <span>More</span>
            </div>
        `;

        containerElement.innerHTML = calendarHTML;
    }

    // Render XP log table
    renderXPLog(containerElement, xpLog) {
        if (!xpLog || xpLog.length === 0) {
            containerElement.innerHTML = '<p>No records</p>';
            return;
        }

        let logHTML = '<div class="xp-log-list">';

        xpLog.forEach(entry => {
            const date = new Date(entry.createdat);
            const timeStr = date.toLocaleString('ru-RU', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const icon = this.getXPActionIcon(entry.action_type);

            logHTML += `
                <div class="xp-log-entry">
                    <span class="xp-icon">${icon}</span>
                    <span class="xp-description">${entry.description || entry.action_type}</span>
                    <span class="xp-time">${timeStr}</span>
                    <span class="xp-amount">+${entry.xp_amount} XP</span>
                </div>
            `;
        });

        logHTML += '</div>';
        containerElement.innerHTML = logHTML;
    }

    // Render achievements grid
    renderAchievements(containerElement, achievementProgress) {
        if (!achievementProgress || achievementProgress.length === 0) {
            containerElement.innerHTML = '<p>No achievements available</p>';
            return;
        }

        // Group by category
        const categories = {
            'streak': { name: '🔥 Streaks', achievements: [] },
            'words': { name: '📚 Words', achievements: [] },
            'level': { name: '⬆️ Levels', achievements: [] },
            'quiz': { name: '✏️ Exercises', achievements: [] },
            'special': { name: '⭐ Special', achievements: [] }
        };

        achievementProgress.forEach(ach => {
            if (categories[ach.category]) {
                categories[ach.category].achievements.push(ach);
            }
        });

        let html = '';

        Object.values(categories).forEach(cat => {
            if (cat.achievements.length === 0) return;

            html += `<div class="achievement-category">
                <h3>${cat.name}</h3>
                <div class="achievement-grid">`;

            cat.achievements.forEach(ach => {
                const locked = !ach.unlocked;
                const iconOpacity = locked ? '0.3' : '1';
                const progressWidth = ach.progress || 0;

                html += `
                    <div class="achievement-card ${locked ? 'locked' : 'unlocked'}">
                        <div class="achievement-icon" style="opacity: ${iconOpacity};">
                            ${ach.icon}
                        </div>
                        <div class="achievement-info">
                            <div class="achievement-name">${ach.name}</div>
                            <div class="achievement-description">${ach.description}</div>
                            ${locked ? `
                                <div class="achievement-progress-bar">
                                    <div class="achievement-progress-fill" style="width: ${progressWidth}%;"></div>
                                </div>
                                <div class="achievement-progress-text">${ach.currentValue || 0} / ${ach.requirement_value}</div>
                            ` : `
                                <div class="achievement-unlocked-badge">✅ Unlocked</div>
                            `}
                            <div class="achievement-xp">+${ach.xp_reward} XP</div>
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        containerElement.innerHTML = html;
    }

    // Render leaderboard
    renderLeaderboard(containerElement, leaderboardData, currentUserId, type = 'global') {
        if (!leaderboardData || leaderboardData.length === 0) {
            containerElement.innerHTML = '<p>Leaderboard is empty</p>';
            return;
        }

        const title = type === 'global' ? '🌍 Global Leaderboard' : '📅 Weekly Leaderboard';
        const xpField = type === 'global' ? 'total_xp' : 'weekly_xp';

        let html = `
            <div class="leaderboard">
                <h3 class="leaderboard-title">${title}</h3>
                <div class="leaderboard-list">
        `;

        leaderboardData.forEach((user, index) => {
            const isCurrentUser = user.id === currentUserId;
            const rank = user.rank || (index + 1);
            const xp = user[xpField] || 0;

            // Medal for top 3
            let medal = '';
            if (rank === 1) medal = '🥇';
            else if (rank === 2) medal = '🥈';
            else if (rank === 3) medal = '🥉';

            html += `
                <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}">
                    <div class="leaderboard-rank">${medal || `#${rank}`}</div>
                    <div class="leaderboard-user-info">
                        <div class="leaderboard-username">
                            ${user.name}
                            ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
                        </div>
                        <div class="leaderboard-stats">
                            Lvl. ${user.level} • ${user.current_streak || 0}🔥
                            ${type === 'weekly' ? `• ${user.weekly_words || 0} words` : ''}
                        </div>
                    </div>
                    <div class="leaderboard-xp">${xp.toLocaleString()} XP</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        containerElement.innerHTML = html;
    }

    // Render daily goals
    renderDailyGoals(containerElement, goals) {
        if (!goals) {
            containerElement.innerHTML = '';
            return;
        }

        const xpProgress = Math.min(100, Math.round((goals.xp_progress / goals.xp_goal) * 100));
        const wordsProgress = Math.min(100, Math.round((goals.words_progress / goals.words_goal) * 100));
        const quizzesProgress = Math.min(100, Math.round((goals.quizzes_progress / goals.quizzes_goal) * 100));

        const allCompleted = goals.completed;

        containerElement.innerHTML = `
            <div class="daily-goals-card ${allCompleted ? 'completed' : ''}">
                <div class="daily-goals-header">
                    <h3>🎯 ${i18n.t('daily_goals_title')}</h3>
                    ${allCompleted ? `<span class="goals-completed-badge">✅ ${i18n.t('goals_completed')}</span>` : ''}
                </div>
                <div class="daily-goals-list">
                    <div class="goal-item ${goals.xp_progress >= goals.xp_goal ? 'completed' : ''}">
                        <div class="goal-icon">⭐</div>
                        <div class="goal-info">
                            <div class="goal-label">${i18n.t('daily_xp')}</div>
                            <div class="goal-progress-text">${goals.xp_progress} / ${goals.xp_goal}</div>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${xpProgress}%;"></div>
                        </div>
                    </div>
                    <div class="goal-item ${goals.words_progress >= goals.words_goal ? 'completed' : ''}">
                        <div class="goal-icon">📚</div>
                        <div class="goal-info">
                            <div class="goal-label">${i18n.t('words_learned')}</div>
                            <div class="goal-progress-text">${goals.words_progress} / ${goals.words_goal}</div>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${wordsProgress}%;"></div>
                        </div>
                    </div>
                    <div class="goal-item ${goals.quizzes_progress >= goals.quizzes_goal ? 'completed' : ''}">
                        <div class="goal-icon">✏️</div>
                        <div class="goal-info">
                            <div class="goal-label">${i18n.t('exercises_completed')}</div>
                            <div class="goal-progress-text">${goals.quizzes_progress} / ${goals.quizzes_goal}</div>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${quizzesProgress}%;"></div>
                        </div>
                    </div>
                </div>
                ${allCompleted ? `<div class="goals-reward">🎁 ${i18n.t('goals_bonus')}</div>` : ''}
            </div>
        `;
    }

    // Show XP earned notification
    // DISABLED: XP notifications disabled to avoid interrupting learning flow
    showXPNotification(xpAmount, level, leveledUp = false) {
        // Notification disabled - XP is still earned but not shown as popup
        return;

        /* DISABLED CODE:
        const notification = document.createElement('div');
        notification.className = 'xp-notification';

        if (leveledUp) {
            notification.innerHTML = `
                <div class="level-up-animation">
                    🎉 NEW LEVEL ${level}! 🎉
                    <div class="xp-earned">+${xpAmount} XP</div>
                </div>
            `;
            notification.classList.add('level-up');
        } else {
            notification.innerHTML = `
                <div class="xp-earned-animation">
                    +${xpAmount} XP
                </div>
            `;
        }

        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 3000);
        */
    }

    // Show achievement unlocked notification
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';

        notification.innerHTML = `
            <div class="achievement-unlock-animation">
                <div class="achievement-unlock-icon">${achievement.icon}</div>
                <div class="achievement-unlock-title">🏆 Achievement Unlocked!</div>
                <div class="achievement-unlock-name">${achievement.name}</div>
                <div class="achievement-unlock-xp">+${achievement.xp_reward} XP</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // Helper: Get streak days text
    getStreakDaysText(days) {
        if (days === 1) return 'day';
        return 'days';
    }

    // Helper: Get icon for XP action type
    getXPActionIcon(actionType) {
        const iconMap = {
            'quiz_answer': '✏️',
            'word_learned': '🎓',
            'streak_bonus': '🔥',
            'daily_goal': '🎯',
            'achievement': '🏆'
        };
        return iconMap[actionType] || '⭐';
    }
}

// Initialize global gamification instance
window.gamification = new Gamification(window.API_URL || window.location.origin);
