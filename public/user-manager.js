class UserManager {
    constructor() {
        this.currentUser = null;
        this.currentLanguagePair = null;
        this.initialized = false;
    }

    async init() {
        try {
            // Check if user is already logged in
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                await this.loadUserLanguagePairs();
                this.hideAuthModal();
                this.showUserInterface();
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
            // For now, use local storage authentication
            // In real implementation, this would be server-side
            const users = this.getStoredUsers();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                throw new Error('Пользователь не найден');
            }

            // Simple password check (in real app, use proper hashing)
            if (user.password !== this.hashPassword(password)) {
                throw new Error('Неверный пароль');
            }

            this.currentUser = { ...user };
            delete this.currentUser.password; // Don't keep password in memory
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            await this.loadUserLanguagePairs();
            
            this.hideAuthModal();
            this.showUserInterface();
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(name, email, password) {
        try {
            const users = this.getStoredUsers();
            
            // Check if user already exists
            if (users.find(u => u.email === email)) {
                throw new Error('Пользователь с таким email уже существует');
            }

            const newUser = {
                id: Date.now().toString(),
                name,
                email,
                password: this.hashPassword(password),
                createdAt: new Date().toISOString(),
                languagePairs: []
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Auto-login after registration
            this.currentUser = { ...newUser };
            delete this.currentUser.password;
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            await this.loadUserLanguagePairs();
            
            this.hideAuthModal();
            this.showUserInterface();
            
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async loginWithGoogle() {
        try {
            // Initialize Google OAuth configuration
            const isConfigured = await oauthConfig.initializeGoogleOAuth();
            
            if (!isConfigured) {
                // Use demo version since Google OAuth is not properly configured
                console.log('Google OAuth not configured, using demo login');
                console.log('Debug info:', oauthConfig.getDebugInfo());
                return this.loginWithGoogleDemo();
            }

            // Real Google OAuth implementation (only when properly configured)
            return new Promise((resolve, reject) => {
                google.accounts.id.initialize({
                    client_id: oauthConfig.GOOGLE_CLIENT_ID,
                    callback: async (response) => {
                        try {
                            // Decode JWT token to get user info
                            const payload = JSON.parse(atob(response.credential.split('.')[1]));
                            
                            const googleUser = {
                                id: 'google_' + payload.sub,
                                name: payload.name,
                                email: payload.email,
                                picture: payload.picture,
                                provider: 'google',
                                createdAt: new Date().toISOString(),
                                languagePairs: []
                            };

                            this.currentUser = googleUser;
                            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                            
                            // Also save to users list
                            const users = this.getStoredUsers();
                            if (!users.find(u => u.email === googleUser.email)) {
                                users.push({...googleUser, password: null});
                                localStorage.setItem('users', JSON.stringify(users));
                            }
                            
                            await this.loadUserLanguagePairs();
                            this.hideAuthModal();
                            this.showUserInterface();
                            
                            resolve(true);
                        } catch (error) {
                            reject(error);
                        }
                    }
                });

                // Show Google sign-in prompt
                google.accounts.id.prompt();
            });
            
        } catch (error) {
            console.error('Google login error:', error);
            // Fallback to demo
            return this.loginWithGoogleDemo();
        }
    }

    async loginWithGoogleDemo() {
        try {
            // Demo version for testing (Google OAuth not configured)
            // Show a brief message to user
            const confirmDemo = confirm(
                '🔧 Google OAuth ещё не настроен для этого домена.\n\n' +
                '✅ Будет использован демо-режим авторизации.\n\n' +
                'Продолжить с демо-аккаунтом?'
            );
            
            if (!confirmDemo) {
                return false;
            }
            
            const googleUser = {
                id: 'google_demo_' + Date.now(),
                name: '👤 Demo Google User',
                email: 'demo@google.com',
                provider: 'google_demo',
                createdAt: new Date().toISOString(),
                languagePairs: []
            };

            this.currentUser = googleUser;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Also save to users list
            const users = this.getStoredUsers();
            if (!users.find(u => u.email === googleUser.email)) {
                users.push({...googleUser, password: null});
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            await this.loadUserLanguagePairs();
            this.hideAuthModal();
            this.showUserInterface();
            
            return true;
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

    getStoredUsers() {
        try {
            return JSON.parse(localStorage.getItem('users') || '[]');
        } catch {
            return [];
        }
    }

    hashPassword(password) {
        // Simple hash function for demo (use proper hashing in production)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    async loadUserLanguagePairs() {
        if (!this.currentUser) return;
        
        try {
            // Load language pairs for current user
            const users = this.getStoredUsers();
            const user = users.find(u => u.id === this.currentUser.id);
            
            if (user && user.languagePairs && user.languagePairs.length > 0) {
                this.currentUser.languagePairs = user.languagePairs;
                
                // Set first language pair as active if none selected
                if (!this.currentLanguagePair) {
                    this.currentLanguagePair = user.languagePairs.find(lp => lp.active) || user.languagePairs[0];
                }
            } else {
                // Create default language pair (German-Russian)
                const defaultPair = {
                    id: Date.now().toString(),
                    name: 'Немецкий - Русский',
                    fromLanguage: 'German',
                    toLanguage: 'Russian',
                    active: true,
                    lessonSize: 10,
                    createdAt: new Date().toISOString()
                };
                
                this.currentUser.languagePairs = [defaultPair];
                this.currentLanguagePair = defaultPair;
                
                await this.saveUserData();
            }
            
            this.showUserInterface();
        } catch (error) {
            console.error('Error loading language pairs:', error);
        }
    }

    async saveUserData() {
        if (!this.currentUser) return;
        
        try {
            // Update user in storage
            const users = this.getStoredUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...this.currentUser };
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            // Update current user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    async createLanguagePair(fromLang, toLang, name) {
        if (!this.currentUser) return;
        
        const newPair = {
            id: Date.now().toString(),
            name: name || `${fromLang} - ${toLang}`,
            fromLanguage: fromLang,
            toLanguage: toLang,
            active: false,
            lessonSize: 10,
            createdAt: new Date().toISOString()
        };
        
        this.currentUser.languagePairs = this.currentUser.languagePairs || [];
        this.currentUser.languagePairs.push(newPair);
        
        await this.saveUserData();
        return newPair;
    }

    async setActiveLanguagePair(pairId) {
        if (!this.currentUser || !this.currentUser.languagePairs) return;
        
        // Deactivate all pairs
        this.currentUser.languagePairs.forEach(pair => {
            pair.active = pair.id === pairId;
        });
        
        this.currentLanguagePair = this.currentUser.languagePairs.find(pair => pair.id === pairId);
        
        await this.saveUserData();
        this.showUserInterface();
        
        // Trigger app refresh with new language pair
        if (window.app && window.app.updateStats) {
            await window.app.updateStats();
        }
    }

    async deleteLanguagePair(pairId) {
        if (!this.currentUser || !this.currentUser.languagePairs) return;
        
        // Don't delete if it's the only pair
        if (this.currentUser.languagePairs.length <= 1) {
            throw new Error('Нельзя удалить единственную языковую пару');
        }
        
        const pairToDelete = this.currentUser.languagePairs.find(pair => pair.id === pairId);
        if (!pairToDelete) return;
        
        // Remove the pair
        this.currentUser.languagePairs = this.currentUser.languagePairs.filter(pair => pair.id !== pairId);
        
        // If deleted pair was active, activate first remaining pair
        if (pairToDelete.active) {
            this.currentUser.languagePairs[0].active = true;
            this.currentLanguagePair = this.currentUser.languagePairs[0];
        }
        
        await this.saveUserData();
        this.showUserInterface();
        
        // Clear words data for this language pair (implement in database)
        // TODO: Implement database cleanup for language pair
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentLanguagePair() {
        return this.currentLanguagePair;
    }

    getLessonSize() {
        return this.currentLanguagePair ? this.currentLanguagePair.lessonSize : 10;
    }

    async setLessonSize(size) {
        if (!this.currentLanguagePair) return;
        
        this.currentLanguagePair.lessonSize = Math.max(5, Math.min(50, size));
        await this.saveUserData();
    }

    isLoggedIn() {
        return !!this.currentUser;
    }
}

const userManager = new UserManager();