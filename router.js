// Simple Router System for Rememberizor
// Enables each section to have its own URL

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.isInitialized = false;
        
        // Define routes for each section
        this.setupRoutes();
        
        // Listen for browser navigation
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });
        
        console.log('🧭 Router initialized');
    }
    
    setupRoutes() {
        // Define all available routes
        this.routes.set('/', {
            name: 'home',
            section: 'homeSection',
            button: 'homeBtn',
            title: 'Главная - Rememberizor v2.0',
            init: () => this.initHomePage()
        });
        
        this.routes.set('/import', {
            name: 'import',
            section: 'importSection', 
            button: 'importBtn',
            title: 'Импорт - Rememberizor v2.0',
            init: () => this.initImportPage()
        });
        
        this.routes.set('/study', {
            name: 'study',
            section: 'studySection',
            button: 'studyBtn', 
            title: 'Изучение - Rememberizor v2.0',
            init: () => this.initStudyPage()
        });
        
        this.routes.set('/review', {
            name: 'review',
            section: 'reviewSection',
            button: 'reviewBtn',
            title: 'Повторение - Rememberizor v2.0', 
            init: () => this.initReviewPage()
        });
        
        this.routes.set('/stats', {
            name: 'stats',
            section: 'statsSection',
            button: 'statsBtn',
            title: 'Статистика - Rememberizor v2.0',
            init: () => this.initStatsPage()
        });
        
        this.routes.set('/settings', {
            name: 'settings',
            section: 'settingsSection',
            button: 'settingsBtn',
            title: 'Настройки - Rememberizor v2.0',
            init: () => this.initSettingsPage()
        });
        
        console.log(`📋 Configured ${this.routes.size} routes`);
    }
    
    // Initialize router after DOM and login
    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Starting router initialization...');
        
        // Setup navigation event listeners
        this.setupNavigationListeners();
        
        // Navigate to current URL or default route
        const currentPath = window.location.pathname;
        if (this.routes.has(currentPath)) {
            this.navigateToRoute(currentPath, false); // Don't push to history
        } else {
            // Default to home if unknown route
            this.navigateToRoute('/', true);
        }
        
        this.isInitialized = true;
        console.log('✅ Router initialized successfully');
    }
    
    setupNavigationListeners() {
        // Attach click handlers to navigation buttons
        this.routes.forEach((route, path) => {
            const button = document.getElementById(route.button);
            if (button) {
                // Remove existing handlers and add router-based handler
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateToRoute(path, true);
                });
                
                console.log(`🔗 Navigation attached for ${route.name}`);
            }
        });
        
        // Handle user menu settings button
        const userMenuBtn = document.getElementById('userMenuBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        
        if (userMenuBtn && settingsBtn) {
            const newSettingsBtn = settingsBtn.cloneNode(true);
            settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
            
            newSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToRoute('/settings', true);
                // Close user menu
                const userMenu = document.getElementById('userMenu');
                if (userMenu) userMenu.classList.add('hidden');
            });
        }
    }
    
    navigateToRoute(path, pushToHistory = true) {
        const route = this.routes.get(path);
        if (!route) {
            console.error(`❌ Route not found: ${path}`);
            return;
        }
        
        console.log(`🧭 Navigating to: ${path} (${route.name})`);
        
        // Update browser history
        if (pushToHistory && window.location.pathname !== path) {
            window.history.pushState({ route: path }, route.title, path);
        }
        
        // Update document title
        document.title = route.title;
        
        // Hide all sections
        this.hideAllSections();
        
        // Show target section
        const section = document.getElementById(route.section);
        if (section) {
            section.classList.add('active');
            section.style.display = 'block';
        }
        
        // Update navigation buttons
        this.updateNavigationButtons(route.button);
        
        // Initialize page-specific functionality
        if (route.init) {
            try {
                route.init();
            } catch (error) {
                console.error(`❌ Error initializing ${route.name}:`, error);
            }
        }
        
        this.currentRoute = route;
        console.log(`✅ Navigation completed: ${route.name}`);
    }
    
    hideAllSections() {
        // Hide all main sections
        const sections = [
            'homeSection', 'importSection', 'studySection', 
            'reviewSection', 'statsSection', 'settingsSection'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.remove('active');
                section.style.display = 'none';
            }
        });
        
        // Hide special areas
        const specialAreas = ['quizArea', 'survivalArea'];
        specialAreas.forEach(areaId => {
            const area = document.getElementById(areaId);
            if (area) {
                area.classList.add('hidden');
            }
        });
    }
    
    updateNavigationButtons(activeButtonId) {
        // Remove active class from all nav buttons
        const navButtons = [
            'homeBtn', 'importBtn', 'studyBtn', 
            'reviewBtn', 'statsBtn', 'settingsBtn'
        ];
        
        navButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.classList.remove('active');
            }
        });
        
        // Add active class to current button
        const activeBtn = document.getElementById(activeButtonId);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    handlePopState(event) {
        // Handle browser back/forward buttons
        if (event.state && event.state.route) {
            this.navigateToRoute(event.state.route, false);
        } else {
            // Fallback to current URL
            const currentPath = window.location.pathname;
            if (this.routes.has(currentPath)) {
                this.navigateToRoute(currentPath, false);
            } else {
                this.navigateToRoute('/', false);
            }
        }
    }
    
    // Page initialization methods
    initHomePage() {
        console.log('🏠 Initializing home page...');
        
        // Update statistics if components are available
        if (window.database) {
            this.updateHomeStats();
        }
        
        // Setup quick action buttons
        this.setupQuickActions();
    }
    
    async updateHomeStats() {
        try {
            const studyingWords = await window.database.getWordsByStatus('studying');
            const reviewWords = await window.database.getWordsByStatus('review');
            const learnedWords = await window.database.getWordsByStatus('learned');
            
            const studyingCount = document.getElementById('studyingCount');
            const reviewCount = document.getElementById('reviewCount');
            const learnedCount = document.getElementById('learnedCount');
            
            if (studyingCount) studyingCount.textContent = studyingWords.length;
            if (reviewCount) reviewCount.textContent = reviewWords.length;
            if (learnedCount) learnedCount.textContent = learnedWords.length;
            
            console.log('✅ Home stats updated');
        } catch (error) {
            console.error('❌ Error updating home stats:', error);
        }
    }
    
    setupQuickActions() {
        const quickStudyBtn = document.getElementById('quickStudyBtn');
        const quickReviewBtn = document.getElementById('quickReviewBtn');
        
        if (quickStudyBtn) {
            quickStudyBtn.onclick = () => this.navigateToRoute('/study', true);
        }
        
        if (quickReviewBtn) {
            quickReviewBtn.onclick = () => this.navigateToRoute('/review', true);
        }
    }
    
    initImportPage() {
        console.log('📂 Initializing import page...');
        // Import page specific initialization
        // The main app handles import functionality
    }
    
    initStudyPage() {
        console.log('📚 Initializing study page...');
        
        // Reset study interface
        const studyModeSelect = document.getElementById('studyModeSelect');
        const quizArea = document.getElementById('quizArea');
        const survivalArea = document.getElementById('survivalArea');
        
        if (studyModeSelect) studyModeSelect.style.display = 'block';
        if (quizArea) quizArea.classList.add('hidden');
        if (survivalArea) survivalArea.classList.add('hidden');
    }
    
    initReviewPage() {
        console.log('🔄 Initializing review page...');
        
        // Update review counts if available
        if (window.database) {
            this.updateReviewStats();
        }
    }
    
    async updateReviewStats() {
        try {
            // This would need actual review logic implementation
            const review7Count = document.getElementById('review7Count');
            const review30Count = document.getElementById('review30Count');
            
            if (review7Count) review7Count.textContent = '0';
            if (review30Count) review30Count.textContent = '0';
            
        } catch (error) {
            console.error('❌ Error updating review stats:', error);
        }
    }
    
    initStatsPage() {
        console.log('📊 Initializing stats page...');
        
        // Update word lists if available
        if (window.database) {
            this.updateStatsLists();
        }
    }
    
    async updateStatsLists() {
        try {
            const studyingWords = await window.database.getWordsByStatus('studying');
            const reviewWords = await window.database.getWordsByStatus('review');
            const learnedWords = await window.database.getWordsByStatus('learned');
            
            const studyingListCount = document.getElementById('studyingListCount');
            const reviewListCount = document.getElementById('reviewListCount');
            const learnedListCount = document.getElementById('learnedListCount');
            
            if (studyingListCount) studyingListCount.textContent = studyingWords.length;
            if (reviewListCount) reviewListCount.textContent = reviewWords.length;
            if (learnedListCount) learnedListCount.textContent = learnedWords.length;
            
            console.log('✅ Stats lists updated');
        } catch (error) {
            console.error('❌ Error updating stats lists:', error);
        }
    }
    
    initSettingsPage() {
        console.log('⚙️ Initializing settings page...');
        // Settings page specific initialization
        // The main app handles settings functionality
    }
    
    // Public API methods
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    navigateTo(path) {
        this.navigateToRoute(path, true);
    }
    
    // Handle direct URL access (e.g., refreshing the page)
    handleDirectAccess() {
        const currentPath = window.location.pathname;
        
        // Check if user is logged in for protected routes
        const isLoggedIn = localStorage.getItem('currentUser') || localStorage.getItem('emergencyUser');
        
        if (!isLoggedIn && currentPath !== '/') {
            // Redirect to home if not logged in
            this.navigateToRoute('/', true);
            return;
        }
        
        // Navigate to current path
        if (this.routes.has(currentPath)) {
            this.navigateToRoute(currentPath, false);
        } else {
            this.navigateToRoute('/', true);
        }
    }
}

// Export for global access
window.Router = Router;