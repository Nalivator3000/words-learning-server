/**
 * Manual Word Addition UI
 * Phase 3.4: User can add custom words with translation suggestions
 */

class AddWordUI {
    constructor() {
        this.currentTranslations = [];
        this.selectedTranslations = [];
        this.init();
    }

    init() {
        // Add word button click handler
        const addWordBtn = document.getElementById('addWordBtn');
        if (addWordBtn) {
            addWordBtn.addEventListener('click', () => this.showAddWordModal());
        }

        // Don't create modal immediately - wait until it's needed
        // This ensures i18n is loaded before creating the modal
    }

    createModalIfNeeded() {
        if (document.getElementById('addWordModal')) return;

        const t = (key) => window.i18n ? window.i18n.t(key) : key;

        const modalHTML = `
            <div id="addWordModal" class="modal modal-closed">
                <div class="modal-content add-word-modal">
                    <button class="close-modal" type="button" aria-label="Close">&times;</button>
                    <h2 data-i18n="add_new_word">${t('add_new_word')}</h2>

                    <div class="add-word-form">
                        <!-- Step 1: Enter word -->
                        <div id="step1" class="add-word-step active">
                            <label for="newWord" data-i18n="word_in_learning_language">${t('word_in_learning_language')}</label>
                            <input type="text" id="newWord" placeholder="${t('enter_word')}" data-i18n-placeholder="enter_word" class="word-input">

                            <button class="btn-primary" onclick="window.addWordUI.getTranslations()" data-i18n="get_translations">
                                ${t('get_translations')}
                            </button>
                        </div>

                        <!-- Step 2: Select translation -->
                        <div id="step2" class="add-word-step" style="display: none;">
                            <div class="word-display">
                                <strong data-i18n="word_label">${t('word_label')}</strong> <span id="displayWord"></span>
                            </div>

                            <label data-i18n="select_translation">${t('select_translation')}</label>

                            <div id="translationSuggestions" class="translation-suggestions">
                                <!-- Suggestions will be inserted here -->
                            </div>

                            <div class="custom-translation">
                                <label for="customTranslation" data-i18n="or_enter_translation">${t('or_enter_translation')}</label>
                                <input type="text" id="customTranslation" placeholder="${t('enter_translation')}" data-i18n-placeholder="enter_translation">
                            </div>

                            <div class="form-actions">
                                <button class="btn-secondary" onclick="window.addWordUI.backToStep1()" data-i18n="back">
                                    ${t('back')}
                                </button>
                                <button class="btn-primary" onclick="window.addWordUI.showStep3()" data-i18n="next">
                                    ${t('next')}
                                </button>
                            </div>
                        </div>

                        <!-- Step 3: Optional details -->
                        <div id="step3" class="add-word-step" style="display: none;">
                            <div class="word-summary">
                                <p><strong data-i18n="word_label">${t('word_label')}</strong> <span id="summaryWord"></span></p>
                                <p><strong data-i18n="translation_label">${t('translation_label')}</strong> <span id="summaryTranslation"></span></p>
                            </div>

                            <label for="wordExample" data-i18n="example_usage">${t('example_usage')}</label>
                            <textarea id="wordExample" placeholder="${t('sentence_with_word')}" data-i18n-placeholder="sentence_with_word" rows="2"></textarea>

                            <label for="wordExampleTranslation" data-i18n="example_translation">${t('example_translation')}</label>
                            <textarea id="wordExampleTranslation" placeholder="${t('sentence_translation')}" data-i18n-placeholder="sentence_translation" rows="2"></textarea>

                            <label for="wordNotes" data-i18n="notes_optional">${t('notes_optional')}</label>
                            <textarea id="wordNotes" placeholder="${t('your_notes')}" data-i18n-placeholder="your_notes" rows="2"></textarea>

                            <div class="form-actions">
                                <button class="btn-secondary" onclick="window.addWordUI.backToStep2()" data-i18n="back">
                                    ${t('back')}
                                </button>
                                <button class="btn-success" onclick="window.addWordUI.saveWord()" data-i18n="save_word">
                                    ${t('save_word')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="addWordError" class="error-message"></div>
                    <div id="addWordSuccess" class="success-message"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listener for close button with setTimeout to ensure DOM is ready
        setTimeout(() => {
            const closeBtn = document.querySelector('#addWordModal .close-modal');
            console.log('Close button found:', closeBtn);
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    console.log('Close button clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                });
            }

            // Also close on clicking outside the modal
            const modal = document.getElementById('addWordModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        console.log('Clicked outside modal');
                        this.closeModal();
                    }
                });
            }
        }, 0);
    }

    showAddWordModal() {
        if (!userManager.currentUser) {
            const t = (key) => window.i18n ? window.i18n.t(key) : key;
            alert(t('please_login'));
            return;
        }

        // Create modal if it doesn't exist yet (lazy initialization)
        this.createModalIfNeeded();

        this.resetForm();
        const modal = document.getElementById('addWordModal');
        modal.classList.add('modal-open');
        modal.classList.remove('modal-closed');
        document.getElementById('newWord').focus();
    }

    closeModal() {
        console.log('closeModal called');
        const modal = document.getElementById('addWordModal');
        console.log('Modal element:', modal);
        if (modal) {
            modal.classList.add('modal-closed');
            modal.classList.remove('modal-open');
            console.log('Modal closed via class');
        }
        try {
            this.resetForm();
            console.log('Form reset successfully');
        } catch (error) {
            console.error('Error in resetForm:', error);
        }
    }

    resetForm() {
        document.getElementById('newWord').value = '';
        document.getElementById('customTranslation').value = '';
        document.getElementById('wordExample').value = '';
        document.getElementById('wordExampleTranslation').value = '';
        document.getElementById('wordNotes').value = '';
        document.getElementById('addWordError').textContent = '';
        document.getElementById('addWordSuccess').textContent = '';

        this.selectedTranslations = [];
        this.showStep(1);
    }

    showStep(step) {
        document.querySelectorAll('.add-word-step').forEach(el => el.style.display = 'none');
        document.getElementById(`step${step}`).style.display = 'block';
    }

    backToStep1() {
        this.showStep(1);
    }

    backToStep2() {
        this.showStep(2);
    }

    async getTranslations() {
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        const word = document.getElementById('newWord').value.trim();

        if (!word) {
            this.showError(t('please_enter_word'));
            return;
        }

        const languagePair = userManager.currentLanguagePair;
        if (!languagePair) {
            this.showError(t('select_language_pair'));
            return;
        }

        try {
            // Show loading
            this.showError(t('getting_translations'));

            const response = await fetch('/api/words/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word,
                    sourceLang: languagePair.from_lang,
                    targetLang: languagePair.to_lang
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentTranslations = data.suggestions || [];
                this.renderTranslationSuggestions();
                document.getElementById('displayWord').textContent = word;
                this.showError('');
                this.showStep(2);
            } else {
                this.showError(data.error || t('error_getting_translations'));
            }
        } catch (error) {
            console.error('Translation error:', error);
            this.showError(t('network_error_manual_translation'));
            // Still show step 2 so user can enter manual translation
            document.getElementById('displayWord').textContent = word;
            this.showStep(2);
        }
    }

    renderTranslationSuggestions() {
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        const container = document.getElementById('translationSuggestions');

        if (!this.currentTranslations || this.currentTranslations.length === 0) {
            container.innerHTML = `<p class="no-suggestions" data-i18n="no_suggestions_enter_manually">${t('no_suggestions_enter_manually')}</p>`;
            return;
        }

        container.innerHTML = this.currentTranslations.map((suggestion, index) => `
            <div class="translation-suggestion">
                <label>
                    <input type="checkbox"
                           value="${suggestion.translation}"
                           onchange="window.addWordUI.toggleTranslation('${suggestion.translation}')">
                    <span class="translation-text">${suggestion.translation}</span>
                </label>
                ${suggestion.context ? `<span class="context">${suggestion.context}</span>` : ''}
            </div>
        `).join('');
    }

    toggleTranslation(translation) {
        const index = this.selectedTranslations.indexOf(translation);
        if (index > -1) {
            this.selectedTranslations.splice(index, 1);
        } else {
            this.selectedTranslations.push(translation);
        }
    }

    showStep3() {
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        // Get selected or custom translation
        let finalTranslation = this.selectedTranslations.join('; ');

        const customTranslation = document.getElementById('customTranslation').value.trim();
        if (customTranslation) {
            finalTranslation = customTranslation;
        }

        if (!finalTranslation) {
            this.showError(t('please_select_or_enter_translation'));
            return;
        }

        const word = document.getElementById('newWord').value.trim();
        document.getElementById('summaryWord').textContent = word;
        document.getElementById('summaryTranslation').textContent = finalTranslation;

        this.showError('');
        this.showStep(3);
    }

    async saveWord() {
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        const word = document.getElementById('newWord').value.trim();
        let translation = this.selectedTranslations.join('; ');

        const customTranslation = document.getElementById('customTranslation').value.trim();
        if (customTranslation) {
            translation = customTranslation;
        }

        const example = document.getElementById('wordExample').value.trim();
        const exampleTranslation = document.getElementById('wordExampleTranslation').value.trim();
        const notes = document.getElementById('wordNotes').value.trim();

        if (!word || !translation) {
            this.showError(t('word_and_translation_required'));
            return;
        }

        const languagePair = userManager.currentLanguagePair;
        if (!languagePair) {
            this.showError(t('select_language_pair'));
            return;
        }

        try {
            const response = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word,
                    translation,
                    example,
                    exampleTranslation,
                    userId: userManager.currentUser.id,
                    languagePairId: languagePair.id,
                    isCustom: true,
                    source: 'manual_addition',
                    notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess(t('word_added_successfully'));
                setTimeout(() => {
                    this.closeModal();
                    // Reload words if we're on the words page
                    if (typeof window.app !== 'undefined' && window.app.updateStats) {
                        window.app.updateStats();
                    }
                }, 1500);
            } else {
                this.showError(data.error || t('error_adding_word'));
            }
        } catch (error) {
            console.error('Save word error:', error);
            this.showError(t('network_error_saving_word'));
        }
    }

    showError(message) {
        const errorEl = document.getElementById('addWordError');
        const successEl = document.getElementById('addWordSuccess');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = message ? 'block' : 'none';
        }
        if (successEl) {
            successEl.style.display = 'none';
        }
    }

    showSuccess(message) {
        const errorEl = document.getElementById('addWordError');
        const successEl = document.getElementById('addWordSuccess');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = message ? 'block' : 'none';
        }
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.addWordUI = new AddWordUI();
});
