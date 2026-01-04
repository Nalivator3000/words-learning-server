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
                        <!-- Step 1: Enter word(s) -->
                        <div id="step1" class="add-word-step active">
                            <label for="newWord" data-i18n="word_in_native_language">${t('word_in_native_language')}</label>
                            <textarea id="newWord" placeholder="${t('enter_words_bulk')}" data-i18n-placeholder="enter_words_bulk" class="word-input" rows="4"></textarea>
                            <p class="help-text" data-i18n="bulk_import_hint">${t('bulk_import_hint')}</p>

                            <button class="btn-primary" onclick="window.addWordUI.getTranslations()" data-i18n="get_translations">
                                ${t('get_translations')}
                            </button>
                        </div>

                        <!-- Step 2: Select translation -->
                        <div id="step2" class="add-word-step" style="display: none;">
                            <div id="translationSuggestions" class="translation-suggestions">
                                <!-- Suggestions will be inserted here -->
                            </div>

                            <input type="text" id="customTranslation" placeholder="${t('enter_translation')}" data-i18n-placeholder="enter_translation" class="word-input">

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
                            <textarea id="wordExample" placeholder="${t('sentence_with_word')}" data-i18n-placeholder="sentence_with_word" rows="2"></textarea>
                            <textarea id="wordExampleTranslation" placeholder="${t('sentence_translation')}" data-i18n-placeholder="sentence_translation" rows="2"></textarea>
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
        const input = document.getElementById('newWord').value.trim();

        if (!input) {
            this.showError(t('please_enter_word'));
            return;
        }

        const languagePair = userManager.currentLanguagePair;
        if (!languagePair) {
            this.showError(t('select_language_pair'));
            return;
        }

        // Parse input - support newlines, commas, and spaces
        const words = input
            .split(/[\n,\s]+/)
            .map(w => w.trim())
            .filter(w => w.length > 0);

        // If multiple words, do bulk import
        if (words.length > 1) {
            await this.bulkImport(words, languagePair);
            return;
        }

        // Single word - normal flow
        const word = words[0];

        try {
            // Show step 2 immediately with loading indicator
            this.showStep(2);

            const translationContainer = document.getElementById('translationSuggestions');
            if (translationContainer) {
                translationContainer.innerHTML = '<div class="loading-spinner">⏳ ' + t('getting_translations') + '...</div>';
            }

            // User enters word in NATIVE language (to_lang)
            // We translate TO learning language (from_lang)
            const response = await fetch('/api/words/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word,
                    sourceLang: languagePair.toLanguage,  // Native language (what user types)
                    targetLang: languagePair.fromLanguage // Learning language (what we translate to)
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentTranslations = data.suggestions || [];
                this.renderTranslationSuggestions();
                this.showError('');
            } else {
                this.currentTranslations = [];
                this.renderTranslationSuggestions();
            }
        } catch (error) {
            console.error('Translation error:', error);
            // Still show step 2 so user can enter manual translation
            this.currentTranslations = [];
            this.renderTranslationSuggestions();
        }
    }

    async bulkImport(words, languagePair) {
        const t = (key) => window.i18n ? window.i18n.t(key) : key;

        this.showError(`⏳ ${t('bulk_importing')} ${words.length} ${t('words')}...`);

        let successCount = 0;
        let failCount = 0;

        for (const nativeWord of words) {
            try {
                // Translate each word
                const response = await fetch('/api/words/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        word: nativeWord,
                        sourceLang: languagePair.toLanguage,
                        targetLang: languagePair.fromLanguage
                    })
                });

                const data = await response.json();
                const learningWord = data.suggestions?.[0]?.translation || nativeWord;

                // Save word immediately
                const saveResponse = await fetch('/api/words', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        word: learningWord,
                        translation: nativeWord,
                        example: '',
                        exampleTranslation: '',
                        userId: userManager.currentUser.id,
                        languagePairId: languagePair.id,
                        isCustom: true,
                        source: 'bulk_import',
                        notes: ''
                    })
                });

                if (saveResponse.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                console.error(`Failed to import word: ${nativeWord}`, error);
                failCount++;
            }

            // Update progress
            this.showError(`⏳ ${successCount + failCount}/${words.length} ${t('processed')}...`);
        }

        // Show final result
        this.showSuccess(`✅ ${t('bulk_import_complete')}: ${successCount} ${t('added')}, ${failCount} ${t('failed')}`);

        setTimeout(() => {
            this.closeModal();
            if (typeof window.app !== 'undefined' && window.app.updateStats) {
                window.app.updateStats();
            }
        }, 2000);
    }

    renderTranslationSuggestions() {
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        const container = document.getElementById('translationSuggestions');

        if (!this.currentTranslations || this.currentTranslations.length === 0) {
            // Don't show anything - user will use custom translation field
            container.innerHTML = '';
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

        this.showError('');
        this.showStep(3);
    }

    async saveWord() {
        const t = (key) => window.i18n ? window.i18n.t(key) : key;
        const nativeWord = document.getElementById('newWord').value.trim(); // User's native language
        let learningWord = this.selectedTranslations.join('; '); // Learning language

        const customTranslation = document.getElementById('customTranslation').value.trim();
        if (customTranslation) {
            learningWord = customTranslation;
        }

        const example = document.getElementById('wordExample').value.trim();
        const exampleTranslation = document.getElementById('wordExampleTranslation').value.trim();
        const notes = document.getElementById('wordNotes').value.trim();

        if (!nativeWord || !learningWord) {
            this.showError(t('word_and_translation_required'));
            return;
        }

        const languagePair = userManager.currentLanguagePair;
        if (!languagePair) {
            this.showError(t('select_language_pair'));
            return;
        }

        try {
            // Swap: word should be in learning language, translation in native
            const response = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: learningWord,         // Learning language (from_lang)
                    translation: nativeWord,    // Native language (to_lang)
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
