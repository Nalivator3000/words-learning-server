class UserManager {
    constructor() {
        this.currentUser = null;
        this.currentLanguagePair = null;
        this.initialized = false;
        this.apiUrl = window.location.origin;
    }

    async init() {
        try {
            // Check if user is already logged in (via localStorage session)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                await this.loadUserLanguagePairs();
                this.hideAuthModal();
                this.showUserInterface();

                // Initialize features UI with user info
                if (window.featuresUI) {
                    window.featuresUI.setUser(this.currentUser.id, this.currentLanguagePair?.id);
                }

                this.initialized = true;
                return true;
            }

            this.showAuthModal();
            this.initialized = true;
            return false;
        } catch (error) {
            console.error('Error initializing user manager:', error);
            this.showAuthModal();
            this.initialized = true;
            return false;
        }
    }

    showAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
        document.querySelector('.container').style.display = 'none';
    }

    hideAuthModal() {
        document.getElementById('authModal').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
    }

    showUserInterface() {
        if (this.currentUser) {
            document.getElementById('userInfo').textContent = this.currentUser.name;
            if (this.currentLanguagePair) {
                document.getElementById('userInfo').textContent += ` (${this.currentLanguagePair.name})`;
            }
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();

            this.currentUser = data.user;
            this.currentUser.languagePairs = data.languagePairs || [];

            // Set active language pair
            if (this.currentUser.languagePairs.length > 0) {
                this.currentLanguagePair = this.currentUser.languagePairs.find(lp => lp.is_active) || this.currentUser.languagePairs[0];
            }

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            this.hideAuthModal();
            this.showUserInterface();

            // Initialize features UI with user info
            if (window.featuresUI) {
                window.featuresUI.setUser(this.currentUser.id, this.currentLanguagePair?.id);
            }

            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(name, email, password, nativeLang, targetLang) {
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, nativeLang, targetLang })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            const data = await response.json();

            this.currentUser = data.user;
            this.currentUser.languagePairs = [data.languagePair];
            this.currentLanguagePair = data.languagePair;

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            this.hideAuthModal();
            this.showUserInterface();

            // Initialize features UI with user info
            if (window.featuresUI) {
                window.featuresUI.setUser(this.currentUser.id, this.currentLanguagePair?.id);
            }

            return true;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async loginWithGoogle() {
        try {
            // Check if Google API is loaded
            if (typeof google === 'undefined' || !google.accounts) {
                // Fallback to demo version if Google API not available
                return this.loginWithGoogleDemo();
            }

            // Real Google OAuth implementation (TODO: implement server-side)
            return this.loginWithGoogleDemo();

        } catch (error) {
            console.error('Google login error:', error);
            // Fallback to demo
            return this.loginWithGoogleDemo();
        }
    }

    async loginWithGoogleDemo() {
        try {
            // Demo version for local testing
            alert(i18n.t('google_login_not_implemented'));
            return false;
        } catch (error) {
            console.error('Google login demo error:', error);
            throw error;
        }
    }

    logout() {
        this.currentUser = null;
        this.currentLanguagePair = null;
        localStorage.removeItem('currentUser');
        this.showAuthModal();
    }

    hashPassword(password) {
        // Simple hash function (same as server-side)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    async loadUserLanguagePairs() {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`${this.apiUrl}/api/users/${this.currentUser.id}/language-pairs`);

            if (!response.ok) {
                throw new Error('Failed to load language pairs');
            }

            const languagePairs = await response.json();

            // Normalize field names from database (from_lang → fromLanguage)
            this.currentUser.languagePairs = languagePairs.map(pair => ({
                ...pair,
                fromLanguage: pair.from_lang || pair.fromLanguage,
                toLanguage: pair.to_lang || pair.toLanguage,
                active: pair.is_active || pair.active
            }));

            // Set active language pair
            if (this.currentUser.languagePairs.length > 0) {
                this.currentLanguagePair = this.currentUser.languagePairs.find(lp => lp.is_active) || this.currentUser.languagePairs[0];
            }

            this.showUserInterface();
        } catch (error) {
            console.error('Error loading language pairs:', error);
        }
    }

    async createLanguagePair(fromLang, toLang, name) {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`${this.apiUrl}/api/users/${this.currentUser.id}/language-pairs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name || `${fromLang} - ${toLang}`,
                    from_lang: fromLang,
                    to_lang: toLang
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create language pair');
            }

            const newPair = await response.json();

            // Normalize field names from database
            const normalizedPair = {
                ...newPair,
                fromLanguage: newPair.from_lang || newPair.fromLanguage,
                toLanguage: newPair.to_lang || newPair.toLanguage,
                active: newPair.is_active || newPair.active
            };

            this.currentUser.languagePairs.push(normalizedPair);

            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            return normalizedPair;
        } catch (error) {
            console.error('Error creating language pair:', error);
            throw error;
        }
    }

    async setActiveLanguagePair(pairId) {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`${this.apiUrl}/api/users/${this.currentUser.id}/language-pairs/${pairId}/activate`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Failed to activate language pair');
            }

            const activatedPair = await response.json();

            // Update local state
            this.currentUser.languagePairs.forEach(pair => {
                pair.is_active = pair.id === parseInt(pairId);
            });

            this.currentLanguagePair = activatedPair;

            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            this.showUserInterface();

            // Trigger app refresh with new language pair
            if (window.app && window.app.updateStats) {
                await window.app.updateStats();
            }
        } catch (error) {
            console.error('Error activating language pair:', error);
            throw error;
        }
    }

    async deleteLanguagePair(pairId) {
        if (!this.currentUser || !this.currentUser.languagePairs) return;

        try {
            const response = await fetch(`${this.apiUrl}/api/users/${this.currentUser.id}/language-pairs/${pairId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete language pair');
            }

            // Remove from local state
            this.currentUser.languagePairs = this.currentUser.languagePairs.filter(
                pair => pair.id !== parseInt(pairId)
            );

            // If deleted pair was active, activate first remaining pair
            if (!this.currentUser.languagePairs.find(lp => lp.is_active)) {
                if (this.currentUser.languagePairs.length > 0) {
                    await this.setActiveLanguagePair(this.currentUser.languagePairs[0].id);
                }
            }

            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            this.showUserInterface();
        } catch (error) {
            console.error('Error deleting language pair:', error);
            throw error;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentLanguagePair() {
        return this.currentLanguagePair;
    }

    getLessonSize() {
        return this.currentLanguagePair ? this.currentLanguagePair.lesson_size : 10;
    }

    async setLessonSize(size) {
        if (!this.currentUser || !this.currentLanguagePair) return;

        try {
            const response = await fetch(`${this.apiUrl}/api/users/${this.currentUser.id}/lesson-size`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lessonSize: Math.max(5, Math.min(50, size))
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update lesson size');
            }

            const updatedPair = await response.json();
            this.currentLanguagePair.lesson_size = updatedPair.lesson_size;

            // Update in languagePairs array
            const pairIndex = this.currentUser.languagePairs.findIndex(lp => lp.is_active);
            if (pairIndex !== -1) {
                this.currentUser.languagePairs[pairIndex].lesson_size = updatedPair.lesson_size;
            }

            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('Error setting lesson size:', error);
            throw error;
        }
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    hasGamificationAccess() {
        if (!this.currentUser) return false;

        // Whitelisted users for gamification features
        const allowedUsers = [
            1, // Demo user
            // Add more user IDs here as needed
        ];

        // Whitelisted usernames (case-insensitive)
        const allowedUsernames = [
            'demo',
            'test',
            'admin'
        ];

        // Check by user ID
        if (allowedUsers.includes(this.currentUser.id)) {
            return true;
        }

        // Check by username
        if (this.currentUser.username) {
            const username = this.currentUser.username.toLowerCase();
            if (allowedUsernames.includes(username)) {
                return true;
            }
        }

        return false;
    }
}

const userManager = new UserManager();
window.userManager = userManager;
