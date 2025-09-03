// Google OAuth Configuration
// This file contains the configuration for Google OAuth integration

class OAuthConfig {
    constructor() {
        // Google OAuth settings
        this.GOOGLE_CLIENT_ID = this.getGoogleClientId();
        this.AUTHORIZED_DOMAINS = [
            'localhost',
            '127.0.0.1',
            'words-learning-server-production.up.railway.app',
            // Add your Railway domain here when you get it
        ];
        
        this.initialized = false;
    }
    
    getGoogleClientId() {
        // Check environment variables first (for production)
        if (typeof window !== 'undefined' && window.GOOGLE_CLIENT_ID) {
            return window.GOOGLE_CLIENT_ID;
        }
        
        // Fallback to hardcoded value (replace this after getting real client ID)
        return 'YOUR_GOOGLE_CLIENT_ID_HERE'; // 🔴 Replace this with real client ID
    }
    
    isGoogleOAuthConfigured() {
        return this.GOOGLE_CLIENT_ID && 
               this.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE' &&
               this.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' &&
               this.isGoogleAPILoaded();
    }
    
    isGoogleAPILoaded() {
        return typeof google !== 'undefined' && 
               google.accounts && 
               google.accounts.id;
    }
    
    getCurrentDomain() {
        if (typeof window === 'undefined') return 'localhost';
        return window.location.hostname;
    }
    
    isDomainAuthorized() {
        const currentDomain = this.getCurrentDomain();
        return this.AUTHORIZED_DOMAINS.some(domain => 
            currentDomain === domain || currentDomain.endsWith(domain)
        );
    }
    
    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (this.isGoogleAPILoaded()) {
                resolve(true);
                return;
            }
            
            // Create script element to load Google API
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                // Wait a bit for the API to initialize
                setTimeout(() => {
                    if (this.isGoogleAPILoaded()) {
                        console.log('✅ Google API loaded successfully');
                        resolve(true);
                    } else {
                        console.error('❌ Google API failed to initialize');
                        reject(new Error('Google API initialization failed'));
                    }
                }, 500);
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Google API script');
                reject(new Error('Failed to load Google API'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    async initializeGoogleOAuth() {
        try {
            if (this.initialized) return true;
            
            // Check if domain is authorized
            if (!this.isDomainAuthorized()) {
                console.warn('⚠️ Current domain not in authorized domains list');
                return false;
            }
            
            // Load Google API if not already loaded
            if (!this.isGoogleAPILoaded()) {
                await this.loadGoogleAPI();
            }
            
            // Check if we have valid client ID
            if (!this.isGoogleOAuthConfigured()) {
                console.warn('⚠️ Google OAuth not properly configured');
                return false;
            }
            
            this.initialized = true;
            console.log('✅ Google OAuth initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Google OAuth initialization failed:', error);
            return false;
        }
    }
    
    getDebugInfo() {
        return {
            clientId: this.GOOGLE_CLIENT_ID,
            configured: this.isGoogleOAuthConfigured(),
            apiLoaded: this.isGoogleAPILoaded(),
            domain: this.getCurrentDomain(),
            domainAuthorized: this.isDomainAuthorized(),
            initialized: this.initialized
        };
    }
}

// Create global instance
const oauthConfig = new OAuthConfig();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        oauthConfig.initializeGoogleOAuth();
    });
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.oauthConfig = oauthConfig;
}