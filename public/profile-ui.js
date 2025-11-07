// Profile UI - Public user profiles
// Only accessible to whitelisted users

class ProfileUI {
    constructor() {
        this.currentUserId = null;
        this.viewingUserId = null;
        this.profileData = null;
        this.initialized = false;
    }

    async init(currentUserId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Profile UI: Access denied');
            this.hideSection();
            return;
        }

        this.currentUserId = currentUserId;
        console.log('Profile UI: Initialized for user', currentUserId);
        this.initialized = true;
    }

    hideSection() {
        const section = document.getElementById('profileSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async viewProfile(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Profile UI: Access denied');
            return;
        }

        this.viewingUserId = userId;

        try {
            await this.loadProfile(userId);
            this.render();

            // Show profile section
            if (window.app) {
                window.app.showSection('profile');
            }
        } catch (error) {
            console.error('Error viewing profile:', error);
            this.showError(error.message);
        }
    }

    async loadProfile(userId) {
        try {
            const response = await fetch(`/api/profiles/${userId}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load profile');
            }

            this.profileData = await response.json();
            console.log('Profile loaded:', this.profileData);

            // Load showcase achievements
            await this.loadShowcase(userId);

        } catch (error) {
            console.error('Error loading profile:', error);
            throw error;
        }
    }

    async loadShowcase(userId) {
        try {
            const response = await fetch(`/api/profiles/${userId}/showcase`);
            if (!response.ok) throw new Error('Failed to load showcase');

            this.profileData.showcase = await response.json();
        } catch (error) {
            console.error('Error loading showcase:', error);
            this.profileData.showcase = [];
        }
    }

    render() {
        const container = document.getElementById('profileContent');
        if (!container || !this.profileData) return;

        const isOwnProfile = this.viewingUserId === this.currentUserId;
        const profile = this.profileData;
        const stats = profile.stats || {};
        const counts = profile.counts || {};

        container.innerHTML = `
            <div class="profile-container">
                <!-- Profile Header -->
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${this.renderAvatar(profile)}
                    </div>

                    <div class="profile-info">
                        <div class="profile-name-row">
                            <h2 class="profile-username">${profile.username || profile.name}</h2>
                            <span class="profile-level">Lvl ${stats.level || 1}</span>
                        </div>

                        <p class="profile-bio">${profile.bio || 'No bio yet'}</p>

                        <div class="profile-meta">
                            <span class="meta-item">
                                <span class="meta-icon">👥</span>
                                <span>${counts.friends || 0}</span>
                                <span data-i18n="friends_title">Friends</span>
                            </span>
                            <span class="meta-item">
                                <span class="meta-icon">🌍</span>
                                <span>${counts.language_pairs || 0}</span>
                                <span data-i18n="languages">Languages</span>
                            </span>
                            <span class="meta-item">
                                <span class="meta-icon">👁️</span>
                                <span>${profile.profile_views || 0}</span>
                                <span data-i18n="views">Views</span>
                            </span>
                        </div>
                    </div>

                    ${isOwnProfile ? `
                        <button class="edit-profile-btn" id="editProfileBtn">
                            <span data-i18n="edit_profile">Edit Profile</span>
                        </button>
                    ` : ''}
                </div>

                <!-- Stats Grid -->
                <div class="profile-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-value">${stats.total_xp || 0}</div>
                        <div class="stat-label" data-i18n="total_xp">Total XP</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-value">${stats.total_words_learned || 0}</div>
                        <div class="stat-label" data-i18n="words_learned">Words Learned</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value">${stats.current_streak || 0}</div>
                        <div class="stat-label" data-i18n="current_streak">Day Streak</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${stats.quizzes_completed || 0}</div>
                        <div class="stat-label" data-i18n="quizzes_completed">Quizzes</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">💯</div>
                        <div class="stat-value">${stats.perfect_quizzes || 0}</div>
                        <div class="stat-label" data-i18n="perfect_quizzes">Perfect</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value">${counts.achievements || 0}</div>
                        <div class="stat-label" data-i18n="achievements">Achievements</div>
                    </div>
                </div>

                <!-- Achievements Showcase -->
                ${this.renderShowcase()}

                <!-- Back Button -->
                <button class="back-btn" id="backFromProfileBtn">
                    <span data-i18n="back">Back</span>
                </button>
            </div>
        `;

        // Add event listeners
        const backBtn = document.getElementById('backFromProfileBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }

        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editProfile());
        }

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderAvatar(profile) {
        if (profile.avatar_url) {
            return `<img src="${profile.avatar_url}" alt="${profile.username}">`;
        } else {
            const initial = (profile.username || profile.name || '?')[0].toUpperCase();
            return `<div class="avatar-placeholder">${initial}</div>`;
        }
    }

    renderShowcase() {
        if (!this.profileData.showcase || this.profileData.showcase.length === 0) {
            return `
                <div class="achievements-showcase">
                    <h3 data-i18n="achievements_showcase">Featured Achievements</h3>
                    <div class="empty-showcase">
                        <p data-i18n="no_showcase">No achievements showcased yet</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="achievements-showcase">
                <h3 data-i18n="achievements_showcase">Featured Achievements</h3>
                <div class="showcase-grid">
                    ${this.profileData.showcase.slice(0, 6).map(ach => `
                        <div class="showcase-achievement">
                            <div class="achievement-icon">${ach.icon || '🏆'}</div>
                            <div class="achievement-info">
                                <div class="achievement-title">${ach.title}</div>
                                <div class="achievement-description">${ach.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    editProfile() {
        // Navigate to settings page for profile editing
        if (window.app) {
            window.app.showSection('settings');
        }
        if (window.showToast) {
            showToast('Profile editing in Settings', 'info');
        }
    }

    goBack() {
        // Go back to previous section (usually friends)
        if (window.app) {
            window.app.showSection('friends');
        }
    }

    showError(message) {
        const container = document.getElementById('profileContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p style="color: #ef4444;">${message}</p>
                <button class="action-btn retry-btn" id="backFromProfileBtn">
                    <span data-i18n="back">Back</span>
                </button>
            </div>
        `;

        const backBtn = document.getElementById('backFromProfileBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    }
}

// Initialize
const profileUI = new ProfileUI();
window.profileUI = profileUI;
