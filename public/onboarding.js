// Onboarding Wizard Manager
class OnboardingManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.selections = {
            nativeLang: 'en',
            targetLang: 'de',
            dailyGoalMinutes: 15,
            theme: 'dark'
        };
    }

    init() {
        this.setupEventListeners();
        console.log('✅ OnboardingManager initialized');
    }

    setupEventListeners() {
        // Step 1: Language selection Next button
        document.getElementById('onboardingNext1')?.addEventListener('click', () => {
            this.selections.nativeLang = document.getElementById('onboardingNativeLang').value;
            this.selections.targetLang = document.getElementById('onboardingTargetLang').value;

            // Validate: native and target languages should be different
            if (this.selections.nativeLang === this.selections.targetLang) {
                alert('Please select different languages for native and target.');
                return;
            }

            this.goToStep(2);
        });

        // Step 2: Daily goal selection
        document.querySelectorAll('.time-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selection from all buttons
                document.querySelectorAll('.time-option').forEach(b => b.classList.remove('selected'));
                // Add selection to clicked button
                btn.classList.add('selected');
                this.selections.dailyGoalMinutes = parseInt(btn.dataset.minutes);
            });
        });

        document.getElementById('onboardingBack2')?.addEventListener('click', () => {
            this.goToStep(1);
        });

        document.getElementById('onboardingNext2')?.addEventListener('click', () => {
            this.goToStep(3);
        });

        // Step 3: Theme selection
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selection from all buttons
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('selected'));
                // Add selection to clicked button
                btn.classList.add('selected');
                this.selections.theme = btn.dataset.theme;

                // Apply theme immediately for preview
                if (window.themeManager) {
                    window.themeManager.setTheme(this.selections.theme);
                }
            });
        });

        document.getElementById('onboardingBack3')?.addEventListener('click', () => {
            this.goToStep(2);
        });

        document.getElementById('onboardingFinish')?.addEventListener('click', async () => {
            await this.completeOnboarding();
        });
    }

    goToStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show target step
        document.getElementById(`onboardingStep${stepNumber}`).classList.add('active');

        // Update progress indicators
        document.querySelectorAll('.progress-step').forEach((indicator, index) => {
            const step = index + 1;
            indicator.classList.remove('active', 'completed');

            if (step === stepNumber) {
                indicator.classList.add('active');
            } else if (step < stepNumber) {
                indicator.classList.add('completed');
            }
        });

        // Update progress lines
        document.querySelectorAll('.progress-line').forEach((line, index) => {
            if (index + 1 < stepNumber) {
                line.classList.add('completed');
            } else {
                line.classList.remove('completed');
            }
        });

        this.currentStep = stepNumber;
    }

    async completeOnboarding() {
        console.log('🎯 Completing onboarding with selections:', this.selections);

        try {
            // Send onboarding data to server
            const response = await fetch('/api/auth/complete-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nativeLang: this.selections.nativeLang,
                    targetLang: this.selections.targetLang,
                    dailyGoalMinutes: this.selections.dailyGoalMinutes,
                    theme: this.selections.theme
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to complete onboarding');
            }

            const data = await response.json();
            console.log('✅ Onboarding completed:', data);

            // Update userManager with language pair
            if (window.userManager && data.languagePair) {
                window.userManager.currentUser.languagePairs = [data.languagePair];
                window.userManager.currentLanguagePair = data.languagePair;
            }

            // Close onboarding modal
            this.hide();

            // Reload page to apply all settings
            window.location.reload();

        } catch (error) {
            console.error('❌ Failed to complete onboarding:', error);
            alert(`Failed to complete setup: ${error.message}`);
        }
    }

    show() {
        // Reset to step 1
        this.currentStep = 1;
        this.goToStep(1);

        // Show modal
        const modal = document.getElementById('onboardingModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hide() {
        const modal = document.getElementById('onboardingModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Check if user needs onboarding
    async checkNeedsOnboarding(userId) {
        try {
            const response = await fetch(`/api/user/needs-onboarding?userId=${userId}`);
            const data = await response.json();
            return data.needsOnboarding;
        } catch (error) {
            console.error('Failed to check onboarding status:', error);
            return false;
        }
    }
}

// Create global instance
window.onboardingManager = new OnboardingManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.onboardingManager.init();
    });
} else {
    window.onboardingManager.init();
}

console.log('🎓 Onboarding module loaded');
