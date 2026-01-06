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
        const modal = document.getElementById('authModal');
        if (!modal) return;

        // Clear all hiding styles and show modal
        modal.style.removeProperty('display');
        modal.style.removeProperty('visibility');
        modal.style.removeProperty('opacity');
        modal.style.removeProperty('pointer-events');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.remove('hidden');
        modal.classList.add('active');

        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'none';
        }
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (!modal) return;

        // CRITICAL: Remove 'active' class FIRST (triggers CSS hiding)
        modal.classList.remove('active');
        modal.classList.add('hidden');

        // Force hide with !important styles and multiple methods for iOS Safari
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('pointer-events', 'none', 'important');
        modal.style.setProperty('z-index', '-1', 'important');

        // iOS Safari GPU acceleration fix - force behind everything
        modal.style.setProperty('transform', 'translateZ(-9999px)', 'important');
        modal.style.setProperty('-webkit-transform', 'translateZ(-9999px)', 'important');

        modal.setAttribute('aria-hidden', 'true');

        // Show dashboard container with proper z-index
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            container.style.zIndex = '1';
        }

        // NUCLEAR OPTION for iOS Safari: Schedule complete removal after animations
        setTimeout(() => {
            if (modal && modal.classList.contains('hidden')) {
                // Remove from DOM entirely as last resort
                const modalParent = modal.parentNode;
                if (modalParent) {
                    modalParent.removeChild(modal);
                    // Re-append to body but keep it hidden
                    document.body.appendChild(modal);
                }
            }
        }, 500);
    }

    showUserInterface() {
        if (this.currentUser) {
            const userInfoEl = document.getElementById('userInfo');
            // Only show user info for demo users
            if (this.isDemoUser()) {
                userInfoEl.textContent = this.currentUser.name;
                if (this.currentLanguagePair) {
                    userInfoEl.textContent += ` (${this.currentLanguagePair.name})`;
                }
                userInfoEl.style.display = '';
            } else {
                userInfoEl.textContent = '';
                userInfoEl.style.display = 'none';
            }
        }
    }

    isDemoUser() {
        if (!this.currentUser) return false;

        // Demo user IDs
        const demoUserIds = [1];

        // Demo usernames (case-insensitive)
        const demoUsernames = ['demo', 'test', 'admin'];

        if (demoUserIds.includes(this.currentUser.id)) {
            return true;
        }

        if (this.currentUser.name) {
            const name = this.currentUser.name.toLowerCase();
            if (demoUsernames.some(demo => name.includes(demo))) {
                return true;
            }
        }

        return false;
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
                this.currentLanguagePair = this.currentUser.languagePairs.find(lp => lp.active || lp.is_active) || this.currentUser.languagePairs[0];
            }

            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Check if user needs onboarding
            if (data.needsOnboarding) {
                console.log('🎯 User needs onboarding - showing onboarding modal');
                this.hideAuthModal();
                // Show onboarding modal instead of redirecting to old page
                if (window.onboardingManager) {
                    window.onboardingManager.show();
                }
                return true;
            }

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
            // Redirect to Google OAuth endpoint
            window.location.href = '/auth/google';
        } catch (error) {
            console.error('Google login error:', error);
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
                this.currentLanguagePair = this.currentUser.languagePairs.find(lp => lp.active || lp.is_active) || this.currentUser.languagePairs[0];
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
                method: 'PUT',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Activate language pair failed:', response.status, errorData);
                throw new Error(`Failed to activate language pair: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const activatedPair = await response.json();

            // Update local state
            this.currentUser.languagePairs.forEach(pair => {
                pair.active = pair.id === parseInt(pairId);
                pair.is_active = pair.active; // Keep backward compatibility
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
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Delete language pair failed:', response.status, errorData);
                throw new Error(`Failed to delete language pair: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            // Remove from local state
            this.currentUser.languagePairs = this.currentUser.languagePairs.filter(
                pair => pair.id !== parseInt(pairId)
            );

            // If deleted pair was active, activate first remaining pair
            if (!this.currentUser.languagePairs.find(lp => lp.active || lp.is_active)) {
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
                credentials: 'include',
                body: JSON.stringify({
                    lessonSize: Math.max(5, Math.min(50, size))
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Update lesson size failed:', response.status, errorData);
                throw new Error(`Failed to update lesson size: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const updatedPair = await response.json();
            this.currentLanguagePair.lesson_size = updatedPair.lesson_size;

            // Update in languagePairs array
            const pairIndex = this.currentUser.languagePairs.findIndex(lp => lp.active || lp.is_active);
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
