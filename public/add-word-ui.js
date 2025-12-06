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

        // Initialize modal if it doesn't exist
        this.createModalIfNeeded();
    }

    createModalIfNeeded() {
        if (document.getElementById('addWordModal')) return;

        const modalHTML = `
            <div id="addWordModal" class="modal" style="display: none;">
                <div class="modal-content add-word-modal">
                    <span class="close-modal" onclick="window.addWordUI.closeModal()">&times;</span>
                    <h2>Добавить новое слово</h2>

                    <div class="add-word-form">
                        <!-- Step 1: Enter word -->
                        <div id="step1" class="add-word-step active">
                            <label for="newWord">Слово на изучаемом языке:</label>
                            <input type="text" id="newWord" placeholder="Введите слово" class="word-input">

                            <button class="btn-primary" onclick="window.addWordUI.getTranslations()">
                                Получить переводы
                            </button>
                        </div>

                        <!-- Step 2: Select translation -->
                        <div id="step2" class="add-word-step" style="display: none;">
                            <div class="word-display">
                                <strong>Слово:</strong> <span id="displayWord"></span>
                            </div>

                            <label>Выберите перевод(ы) или введите свой:</label>

                            <div id="translationSuggestions" class="translation-suggestions">
                                <!-- Suggestions will be inserted here -->
                            </div>

                            <div class="custom-translation">
                                <label for="customTranslation">Или введите свой перевод:</label>
                                <input type="text" id="customTranslation" placeholder="Введите перевод">
                            </div>

                            <div class="form-actions">
                                <button class="btn-secondary" onclick="window.addWordUI.backToStep1()">
                                    Назад
                                </button>
                                <button class="btn-primary" onclick="window.addWordUI.showStep3()">
                                    Далее
                                </button>
                            </div>
                        </div>

                        <!-- Step 3: Optional details -->
                        <div id="step3" class="add-word-step" style="display: none;">
                            <div class="word-summary">
                                <p><strong>Слово:</strong> <span id="summaryWord"></span></p>
                                <p><strong>Перевод:</strong> <span id="summaryTranslation"></span></p>
                            </div>

                            <label for="wordExample">Пример использования (необязательно):</label>
                            <textarea id="wordExample" placeholder="Предложение с этим словом" rows="2"></textarea>

                            <label for="wordExampleTranslation">Перевод примера (необязательно):</label>
                            <textarea id="wordExampleTranslation" placeholder="Перевод предложения" rows="2"></textarea>

                            <label for="wordNotes">Заметки (необязательно):</label>
                            <textarea id="wordNotes" placeholder="Ваши заметки, мнемоники, ассоциации" rows="2"></textarea>

                            <div class="form-actions">
                                <button class="btn-secondary" onclick="window.addWordUI.backToStep2()">
                                    Назад
                                </button>
                                <button class="btn-success" onclick="window.addWordUI.saveWord()">
                                    Сохранить слово
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
    }

    showAddWordModal() {
        if (!userManager.currentUser) {
            alert('Пожалуйста, войдите в систему');
            return;
        }

        this.resetForm();
        document.getElementById('addWordModal').style.display = 'flex';
        document.getElementById('newWord').focus();
    }

    closeModal() {
        document.getElementById('addWordModal').style.display = 'none';
        this.resetForm();
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
        const word = document.getElementById('newWord').value.trim();

        if (!word) {
            this.showError('Пожалуйста, введите слово');
            return;
        }

        const languagePair = userManager.currentLanguagePair;
        if (!languagePair) {
            this.showError('Выберите языковую пару');
            return;
        }

        try {
            // Show loading
            this.showError('Получаем переводы...');

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
                this.showError(data.error || 'Ошибка получения переводов');
            }
        } catch (error) {
            console.error('Translation error:', error);
            this.showError('Ошибка сети. Вы можете ввести перевод вручную.');
            // Still show step 2 so user can enter manual translation
            document.getElementById('displayWord').textContent = word;
            this.showStep(2);
        }
    }

    renderTranslationSuggestions() {
        const container = document.getElementById('translationSuggestions');

        if (!this.currentTranslations || this.currentTranslations.length === 0) {
            container.innerHTML = '<p class="no-suggestions">Нет автоматических предложений. Введите перевод вручную ниже.</p>';
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
        // Get selected or custom translation
        let finalTranslation = this.selectedTranslations.join('; ');

        const customTranslation = document.getElementById('customTranslation').value.trim();
        if (customTranslation) {
            finalTranslation = customTranslation;
        }

        if (!finalTranslation) {
            this.showError('Пожалуйста, выберите или введите перевод');
            return;
        }

        const word = document.getElementById('newWord').value.trim();
        document.getElementById('summaryWord').textContent = word;
        document.getElementById('summaryTranslation').textContent = finalTranslation;

        this.showError('');
        this.showStep(3);
    }

    async saveWord() {
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
            this.showError('Слово и перевод обязательны');
            return;
        }

        const languagePair = userManager.currentLanguagePair;
        if (!languagePair) {
            this.showError('Выберите языковую пару');
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
                this.showSuccess('✓ Слово успешно добавлено!');
                setTimeout(() => {
                    this.closeModal();
                    // Reload words if we're on the words page
                    if (typeof window.app !== 'undefined' && window.app.updateStats) {
                        window.app.updateStats();
                    }
                }, 1500);
            } else {
                this.showError(data.error || 'Ошибка добавления слова');
            }
        } catch (error) {
            console.error('Save word error:', error);
            this.showError('Ошибка сети при сохранении слова');
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
