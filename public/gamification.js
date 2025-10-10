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
            const response = await fetch(`${this.apiUrl}/api/gamification/stats/${userId}`);
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
            const response = await fetch(`${this.apiUrl}/api/gamification/xp-log/${userId}?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch XP log');

            return await response.json();
        } catch (err) {
            console.error('Error fetching XP log:', err);
            return [];
        }
    }

    // Fetch activity calendar data
    async getActivityCalendar(userId, days = 365) {
        try {
            const response = await fetch(`${this.apiUrl}/api/gamification/activity/${userId}?days=${days}`);
            if (!response.ok) throw new Error('Failed to fetch activity');

            this.activityData = await response.json();
            return this.activityData;
        } catch (err) {
            console.error('Error fetching activity:', err);
            return [];
        }
    }

    // Render XP/Level display in header
    renderStatsHeader(containerElement, stats) {
        if (!stats) return;

        const { level, totalXP, currentLevelXP, xpForNextLevel, progress, currentStreak } = stats;

        containerElement.innerHTML = `
            <div class="gamification-header">
                <div class="level-display">
                    <span class="level-badge">Ур. ${level}</span>
                    <div class="xp-bar-container" title="${currentLevelXP}/${xpForNextLevel} XP">
                        <div class="xp-bar" style="width: ${progress}%;"></div>
                    </div>
                    <span class="xp-text">${totalXP} XP</span>
                </div>
                <div class="streak-display" title="Текущий стрик">
                    🔥 ${currentStreak} ${this.getStreakDaysText(currentStreak)}
                </div>
            </div>
        `;
    }

    // Render detailed stats page
    renderStatsPage(containerElement, stats, xpLog, activityData) {
        if (!stats) return;

        const { level, totalXP, currentLevelXP, xpForNextLevel, progress, currentStreak, longestStreak, totalWordsLearned, totalQuizzesCompleted } = stats;

        containerElement.innerHTML = `
            <div class="gamification-stats">
                <!-- Level and XP Section -->
                <section class="stats-section">
                    <h2>📊 Уровень и опыт</h2>
                    <div class="level-card">
                        <div class="level-circle">
                            <span class="level-number">${level}</span>
                            <span class="level-label">УРОВЕНЬ</span>
                        </div>
                        <div class="xp-progress">
                            <div class="xp-bar-large">
                                <div class="xp-bar-fill" style="width: ${progress}%;"></div>
                                <span class="xp-bar-text">${currentLevelXP} / ${xpForNextLevel} XP</span>
                            </div>
                            <p class="xp-total">Всего опыта: <strong>${totalXP} XP</strong></p>
                        </div>
                    </div>
                </section>

                <!-- Streak Section -->
                <section class="stats-section">
                    <h2>🔥 Стрики</h2>
                    <div class="streak-cards">
                        <div class="streak-card">
                            <div class="streak-icon">🔥</div>
                            <div class="streak-value">${currentStreak}</div>
                            <div class="streak-label">Текущий стрик</div>
                        </div>
                        <div class="streak-card">
                            <div class="streak-icon">⭐</div>
                            <div class="streak-value">${longestStreak}</div>
                            <div class="streak-label">Рекорд</div>
                        </div>
                    </div>
                </section>

                <!-- Activity Calendar -->
                <section class="stats-section">
                    <h2>📅 Активность</h2>
                    <div id="activity-calendar"></div>
                </section>

                <!-- Achievement Stats -->
                <section class="stats-section">
                    <h2>🏆 Достижения</h2>
                    <div class="achievement-stats">
                        <div class="stat-item">
                            <span class="stat-icon">📚</span>
                            <span class="stat-value">${totalWordsLearned}</span>
                            <span class="stat-label">Слов выучено</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">✅</span>
                            <span class="stat-value">${totalQuizzesCompleted}</span>
                            <span class="stat-label">Упражнений выполнено</span>
                        </div>
                    </div>
                </section>

                <!-- XP History -->
                <section class="stats-section">
                    <h2>📜 История опыта</h2>
                    <div id="xp-log-container"></div>
                </section>
            </div>
        `;

        // Render activity calendar
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
                <span>Меньше</span>
                <div class="legend-box level-0"></div>
                <div class="legend-box level-1"></div>
                <div class="legend-box level-2"></div>
                <div class="legend-box level-3"></div>
                <div class="legend-box level-4"></div>
                <span>Больше</span>
            </div>
        `;

        containerElement.innerHTML = calendarHTML;
    }

    // Render XP log table
    renderXPLog(containerElement, xpLog) {
        if (!xpLog || xpLog.length === 0) {
            containerElement.innerHTML = '<p>Нет записей</p>';
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

    // Show XP earned notification
    showXPNotification(xpAmount, level, leveledUp = false) {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';

        if (leveledUp) {
            notification.innerHTML = `
                <div class="level-up-animation">
                    🎉 НОВЫЙ УРОВЕНЬ ${level}! 🎉
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
    }

    // Helper: Get streak days text
    getStreakDaysText(days) {
        if (days === 0) return 'дней';
        if (days === 1) return 'день';
        if (days >= 2 && days <= 4) return 'дня';
        return 'дней';
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
window.gamification = new Gamification(window.API_URL || 'http://localhost:3000');
