// Onboarding Manager - Interactive tutorial for new users
class OnboardingManager {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.completedOnboarding = this.loadCompletedState();

        this.initSteps();
    }

    loadCompletedState() {
        try {
            const completed = localStorage.getItem('onboardingCompleted');
            return completed === 'true';
        } catch (error) {
            console.error('Failed to load onboarding state:', error);
            return false;
        }
    }

    saveCompletedState() {
        try {
            localStorage.setItem('onboardingCompleted', 'true');
            console.log('✅ Onboarding marked as completed');
        } catch (error) {
            console.error('Failed to save onboarding state:', error);
        }
    }

    initSteps() {
        this.steps = [
            {
                target: '#authBtn',
                title: '👋 Добро пожаловать в FluentFlow!',
                description: i18n.t('onboarding_step1'),
                position: 'bottom',
                action: 'click'
            },
            {
                target: '.nav-btn[data-section="import"]',
                title: '📚 Иmпорт слов',
                description: i18n.t('onboarding_step2'),
                position: 'bottom',
                action: null
            },
            {
                target: '.nav-btn[data-section="study"]',
                title: '📖 Режиm обучения',
                description: i18n.t('onboarding_step3'),
                position: 'bottom',
                action: null
            },
            {
                target: '.nav-btn[data-section="review"]',
                title: '🎯 Режиm повторения',
                description: i18n.t('onboarding_step4'),
                position: 'bottom',
                action: null
            },
            {
                target: '.nav-btn[data-section="stats"]',
                title: '📊 Статистика и гейmификация',
                description: i18n.t('onboarding_step5'),
                position: 'bottom',
                action: null
            },
            {
                target: '#settingsBtn',
                title: '⚙️ Настройки',
                description: i18n.t('onboarding_step6'),
                position: 'bottom',
                action: null
            },
            {
                target: '#themeToggle',
                title: '🌙 Теmная теmа',
                description: i18n.t('onboarding_step7'),
                position: 'left',
                action: null
            },
            {
                target: null,
                title: '🎉 Готово!',
                description: i18n.t('onboarding_step8'),
                position: 'center',
                action: null
            }
        ];
    }

    shouldShowOnboarding() {
        return !this.completedOnboarding;
    }

    start() {
        if (this.isActive) return;

        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(this.currentStep);
    }

    createOverlay() {
        // Create dark overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        document.body.appendChild(this.overlay);

        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        document.body.appendChild(this.tooltip);
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        const target = step.target ? document.querySelector(step.target) : null;

        // Update tooltip content
        this.tooltip.innerHTML = `
            <div class="onboarding-content">
                <h3>${step.title}</h3>
                <p>${step.description}</p>
                <div class="onboarding-progress">
                    <span>${stepIndex + 1} / ${this.steps.length}</span>
                </div>
                <div class="onboarding-buttons">
                    ${stepIndex > 0 ? '<button class="onboarding-btn-secondary" id="onboardingPrevBtn">← Назад</button>' : ''}
                    <button class="onboarding-btn-primary" id="onboardingNextBtn">
                        ${stepIndex === this.steps.length - 1 ? i18n.t('finish') : i18n.t('next')}
                    </button>
                    <button class="onboarding-btn-skip" id="onboardingSkipBtn">Пропустить</button>
                </div>
            </div>
        `;

        // Position tooltip
        if (target) {
            this.highlightElement(target);
            this.positionTooltip(target, step.position);
        } else {
            // Center tooltip for final step
            this.tooltip.classList.add('onboarding-center');
            this.overlay.style.background = 'rgba(0, 0, 0, 0.85)';
        }

        // Add event listeners
        this.attachButtonListeners();
    }

    highlightElement(element) {
        const rect = element.getBoundingClientRect();

        // Remove previous highlight
        const oldHighlight = document.querySelector('.onboarding-highlight');
        if (oldHighlight) oldHighlight.remove();

        // Create highlight
        const highlight = document.createElement('div');
        highlight.className = 'onboarding-highlight';
        highlight.style.position = 'fixed';
        highlight.style.top = `${rect.top - 8}px`;
        highlight.style.left = `${rect.left - 8}px`;
        highlight.style.width = `${rect.width + 16}px`;
        highlight.style.height = `${rect.height + 16}px`;
        highlight.style.borderRadius = '12px';
        highlight.style.border = '3px solid #8B5CF6';
        highlight.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 92, 246, 0.6)';
        highlight.style.pointerEvents = 'none';
        highlight.style.zIndex = '9998';
        highlight.style.transition = 'all 0.3s ease';

        document.body.appendChild(highlight);
    }

    positionTooltip(target, position) {
        const rect = target.getBoundingClientRect();
        this.tooltip.classList.remove('onboarding-center');

        // Reset position
        this.tooltip.style.top = '';
        this.tooltip.style.left = '';
        this.tooltip.style.bottom = '';
        this.tooltip.style.right = '';
        this.tooltip.style.transform = '';

        const offset = 20;

        switch (position) {
            case 'top':
                this.tooltip.style.bottom = `${window.innerHeight - rect.top + offset}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
                this.tooltip.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                this.tooltip.style.top = `${rect.bottom + offset}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
                this.tooltip.style.transform = 'translateX(-50%)';
                break;
            case 'left':
                this.tooltip.style.top = `${rect.top + rect.height / 2}px`;
                this.tooltip.style.right = `${window.innerWidth - rect.left + offset}px`;
                this.tooltip.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                this.tooltip.style.top = `${rect.top + rect.height / 2}px`;
                this.tooltip.style.left = `${rect.right + offset}px`;
                this.tooltip.style.transform = 'translateY(-50%)';
                break;
            case 'center':
            default:
                this.tooltip.classList.add('onboarding-center');
                break;
        }
    }

    attachButtonListeners() {
        const nextBtn = document.getElementById('onboardingNextBtn');
        const prevBtn = document.getElementById('onboardingPrevBtn');
        const skipBtn = document.getElementById('onboardingSkipBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }
    }

    next() {
        this.currentStep++;
        this.showStep(this.currentStep);
    }

    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    skip() {
        if (confirm(i18n.t('skip_tutorial_confirm'))) {
            this.complete();
        }
    }

    complete() {
        this.isActive = false;
        this.saveCompletedState();
        this.completedOnboarding = true;

        // Remove elements
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        const highlight = document.querySelector('.onboarding-highlight');
        if (highlight) highlight.remove();

        // Show completion message
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const message = document.createElement('div');
        message.className = 'onboarding-completion';
        message.innerHTML = `
            <div class="onboarding-completion-content">
                <div class="onboarding-completion-icon">🎉</div>
                <h2>Поздравляеm!</h2>
                <p>Вы завершили обучение и готовы начать изучение языка!</p>
                <p class="onboarding-first-achievement">🏆 Получено достижение: "Первые шаги"</p>
            </div>
        `;
        document.body.appendChild(message);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 500);
        }, 4000);

        // Award first achievement if gamification is available
        if (window.gamification && window.userManager) {
            const user = window.userManager.getCurrentUser();
            if (user) {
                window.gamification.checkAchievements(user.id, 'onboarding_complete');
            }
        }
    }

    reset() {
        localStorage.removeItem('onboardingCompleted');
        this.completedOnboarding = false;
        console.log('🔄 Onboarding reset - will show on next page load');
    }

    // Method to restart onboarding manually
    restart() {
        this.reset();
        this.start();
    }
}

// Initialize onboarding manager
window.onboardingManager = new OnboardingManager();

// Auto-start onboarding for new users
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the page to fully load
    setTimeout(() => {
        if (window.onboardingManager.shouldShowOnboarding()) {
            window.onboardingManager.start();
        }
    }, 1000);

    // Restart onboarding button
    const restartBtn = document.getElementById('restartOnboardingBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            window.onboardingManager.restart();
        });
    }
});
