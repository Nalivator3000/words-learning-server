// Word Lists UI - Browse and import curated word collections
// Displays lists by category, difficulty, topic, and language

class WordListsUI {
    constructor() {
        this.userId = null;
        this.languagePairId = null;
        this.languagePair = null;
        this.wordLists = [];
        this.currentFilter = {
            category: '',
            difficulty: '',
            topic: ''
        };
        this.selectedList = null;
        this.initialized = false;
    }

    async init(userId, languagePairId) {
        this.userId = userId;
        this.languagePairId = languagePairId;
        console.log('Word Lists UI: Initializing for user', userId, 'with language pair', languagePairId);

        try {
            // Load language pair information
            await this.loadLanguagePair();
            await this.loadWordLists();
            this.render();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Word Lists UI:', error);
            this.showError(error.message);
        }
    }

    async loadLanguagePair() {
        try {
            const response = await fetch(`/api/language-pair/${this.languagePairId}`);
            if (!response.ok) throw new Error('Failed to load language pair');

            this.languagePair = await response.json();
            console.log('Language pair loaded:', this.languagePair);
        } catch (error) {
            console.error('Error loading language pair:', error);
            throw error;
        }
    }

    async loadWordLists() {
        try {
            let url = '/api/word-lists';
            const params = new URLSearchParams();

            // Always filter by the user's selected language pair (both from_lang and to_lang)
            if (this.languagePair) {
                if (this.languagePair.from_lang) {
                    params.append('from_lang', this.languagePair.from_lang);
                }
                if (this.languagePair.to_lang) {
                    params.append('to_lang', this.languagePair.to_lang);
                }
            }

            if (this.currentFilter.category) params.append('category', this.currentFilter.category);
            if (this.currentFilter.difficulty) params.append('difficulty', this.currentFilter.difficulty);
            if (this.currentFilter.topic) params.append('topic', this.currentFilter.topic);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load word lists');

            this.wordLists = await response.json();
            console.log('Word lists loaded:', this.wordLists);
        } catch (error) {
            console.error('Error loading word lists:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('wordListsContent');
        if (!container) return;

        const languageName = this.languagePair ? this.languagePair.name : 'Loading...';
        const fromLang = this.languagePair ? this.languagePair.from_lang.toUpperCase() : '';

        container.innerHTML = `
            <div class="word-lists-container">
                <!-- Current Language Info -->
                <div class="current-language-info">
                    <span class="language-label" data-i18n="showing_lists_for">Showing lists for:</span>
                    <span class="language-value">${languageName} (${fromLang})</span>
                </div>

                <!-- Filters -->
                <div class="word-lists-filters">
                    <div class="filter-group">
                        <label data-i18n="difficulty">Difficulty</label>
                        <select id="difficultyFilter" class="filter-select">
                            <option value="" data-i18n="all_levels">All Levels</option>
                            <option value="beginner" ${this.currentFilter.difficulty === 'beginner' ? 'selected' : ''} data-i18n="beginner">Beginner</option>
                            <option value="intermediate" ${this.currentFilter.difficulty === 'intermediate' ? 'selected' : ''} data-i18n="intermediate">Intermediate</option>
                            <option value="advanced" ${this.currentFilter.difficulty === 'advanced' ? 'selected' : ''} data-i18n="advanced">Advanced</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label data-i18n="topic">Topic</label>
                        <select id="topicFilter" class="filter-select">
                            <option value="" data-i18n="all_topics">All Topics</option>
                            <option value="food" ${this.currentFilter.topic === 'food' ? 'selected' : ''} data-i18n="topic_food">Food</option>
                            <option value="travel" ${this.currentFilter.topic === 'travel' ? 'selected' : ''} data-i18n="topic_travel">Travel</option>
                            <option value="business" ${this.currentFilter.topic === 'business' ? 'selected' : ''} data-i18n="topic_business">Business</option>
                            <option value="daily_life" ${this.currentFilter.topic === 'daily_life' ? 'selected' : ''} data-i18n="topic_daily_life">Daily Life</option>
                            <option value="nature" ${this.currentFilter.topic === 'nature' ? 'selected' : ''} data-i18n="topic_nature">Nature</option>
                        </select>
                    </div>

                    <button id="resetFiltersBtn" class="action-btn secondary-btn">
                        <span data-i18n="reset_filters">Reset Filters</span>
                    </button>
                </div>

                <!-- Lists Grid -->
                <div class="word-lists-grid">
                    ${this.renderWordLists()}
                </div>
            </div>

            <!-- Word List Detail Modal -->
            <div id="wordListModal" class="modal" style="display: none;">
                <div class="modal-content word-list-modal">
                    <div class="modal-header">
                        <h3 id="modalListTitle"></h3>
                        <button class="close-btn" id="closeModalBtn">&times;</button>
                    </div>
                    <div id="modalListContent" class="modal-body">
                        <!-- Dynamic content -->
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachEventListeners();

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderWordLists() {
        if (this.wordLists.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <p data-i18n="no_word_lists">No word lists found</p>
                </div>
            `;
        }

        return this.wordLists.map(list => this.renderWordListCard(list)).join('');
    }

    renderWordListCard(list) {
        const difficultyColors = {
            'beginner': '#22c55e',
            'intermediate': '#f59e0b',
            'advanced': '#ef4444'
        };

        const difficultyColor = difficultyColors[list.difficulty_level] || '#6366f1';

        return `
            <div class="word-list-card" data-list-id="${list.id}">
                <div class="list-card-header">
                    <div class="list-icon">📖</div>
                    <div class="list-badges">
                        <span class="list-badge difficulty" style="background: ${difficultyColor}20; color: ${difficultyColor};">
                            ${list.difficulty_level || 'Beginner'}
                        </span>
                        ${list.topic ? `<span class="list-badge topic">${list.topic}</span>` : ''}
                    </div>
                </div>

                <div class="list-card-body">
                    <h4 class="list-title">${list.name}</h4>
                    <p class="list-description">${list.description || 'No description'}</p>

                    <div class="list-meta">
                        <div class="meta-item">
                            <span class="meta-icon">🌐</span>
                            <span class="meta-text">${list.from_lang.toUpperCase()} → ${list.to_lang.toUpperCase()}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-icon">📝</span>
                            <span class="meta-text">${list.word_count} <span data-i18n="words">words</span></span>
                        </div>
                        ${list.usage_count > 0 ? `
                            <div class="meta-item">
                                <span class="meta-icon">👥</span>
                                <span class="meta-text">${list.usage_count} <span data-i18n="users">users</span></span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="list-card-footer">
                    <button class="action-btn secondary-btn view-list-btn" data-list-id="${list.id}">
                        <span data-i18n="view_list">View List</span>
                    </button>
                    <button class="action-btn primary-btn import-list-btn" data-list-id="${list.id}">
                        <span data-i18n="import_list">Import</span>
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Filter listeners
        const difficultyFilter = document.getElementById('difficultyFilter');
        const topicFilter = document.getElementById('topicFilter');
        const resetBtn = document.getElementById('resetFiltersBtn');

        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => {
                this.currentFilter.difficulty = e.target.value;
                this.refresh();
            });
        }

        if (topicFilter) {
            topicFilter.addEventListener('change', (e) => {
                this.currentFilter.topic = e.target.value;
                this.refresh();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.currentFilter = {
                    category: '',
                    difficulty: '',
                    topic: ''
                };
                this.refresh();
            });
        }

        // View list buttons
        document.querySelectorAll('.view-list-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = e.currentTarget.getAttribute('data-list-id');
                if (listId) {
                    await this.viewWordList(parseInt(listId));
                }
            });
        });

        // Import list buttons
        document.querySelectorAll('.import-list-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = e.currentTarget.getAttribute('data-list-id');
                if (listId) {
                    await this.importWordList(parseInt(listId));
                }
            });
        });

        // Modal close button
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
    }

    async viewWordList(listId) {
        try {
            const response = await fetch(`/api/word-lists/${listId}`);
            if (!response.ok) throw new Error('Failed to load word list details');

            const list = await response.json();
            this.selectedList = list;

            const modal = document.getElementById('wordListModal');
            const modalTitle = document.getElementById('modalListTitle');
            const modalContent = document.getElementById('modalListContent');

            if (modal && modalTitle && modalContent) {
                modalTitle.textContent = list.name;

                modalContent.innerHTML = `
                    <div class="word-list-detail">
                        <div class="list-detail-info">
                            <p class="list-detail-description">${list.description || 'No description'}</p>
                            <div class="list-detail-meta">
                                <span><strong>${list.word_count}</strong> <span data-i18n="words">words</span></span>
                                <span><strong>${list.from_lang.toUpperCase()}</strong> → <strong>${list.to_lang.toUpperCase()}</strong></span>
                                <span><strong>${list.difficulty_level}</strong></span>
                                ${list.topic ? `<span><strong>${list.topic}</strong></span>` : ''}
                            </div>
                        </div>

                        <div class="words-list">
                            ${list.words.map((word, index) => `
                                <div class="word-item">
                                    <div class="word-number">${index + 1}</div>
                                    <div class="word-content">
                                        <div class="word-main">
                                            <strong>${word.word}</strong>
                                            <span class="word-translation">${word.translation}</span>
                                        </div>
                                        ${word.example ? `
                                            <div class="word-example">
                                                <div class="example-text">${word.example}</div>
                                                ${word.exampletranslation ? `<div class="example-translation">${word.exampletranslation}</div>` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="modal-actions">
                            <button class="action-btn primary-btn" id="importFromModalBtn">
                                <span data-i18n="import_list">Import List</span>
                            </button>
                        </div>
                    </div>
                `;

                modal.style.display = 'flex';

                // Add import button listener
                const importBtn = document.getElementById('importFromModalBtn');
                if (importBtn) {
                    importBtn.addEventListener('click', () => {
                        this.importWordList(listId);
                    });
                }

                // Update i18n
                if (window.i18n) {
                    i18n.updatePageTranslations();
                }
            }
        } catch (error) {
            console.error('Error viewing word list:', error);
            if (window.showToast) {
                showToast('Failed to load word list details', 'error');
            }
        }
    }

    async importWordList(listId) {
        if (!this.userId || !this.languagePairId) {
            if (window.showToast) {
                showToast('Please select a language pair first', 'error');
            }
            return;
        }

        try {
            const response = await fetch(`/api/word-lists/${listId}/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    languagePairId: this.languagePairId
                })
            });

            if (!response.ok) throw new Error('Failed to import word list');

            const result = await response.json();

            if (window.showToast) {
                showToast(`Successfully imported ${result.imported_count} words!`, 'success');
            }

            this.closeModal();

            // Refresh word manager if available
            if (window.wordManager) {
                await window.wordManager.loadWords();
                window.wordManager.renderWords();
            }
        } catch (error) {
            console.error('Error importing word list:', error);
            if (window.showToast) {
                showToast('Failed to import word list', 'error');
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('wordListModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.selectedList = null;
    }

    async refresh() {
        try {
            await this.loadWordLists();
            this.render();
        } catch (error) {
            console.error('Error refreshing word lists:', error);
        }
    }

    showError(message) {
        const container = document.getElementById('wordListsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p style="color: #ef4444;">${message}</p>
                <button class="action-btn retry-btn" id="retryWordListsBtn">
                    <span data-i18n="try_again">Try Again</span>
                </button>
            </div>
        `;

        const retryBtn = document.getElementById('retryWordListsBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.refresh());
        }
    }
}

// Initialize
const wordListsUI = new WordListsUI();
window.wordListsUI = wordListsUI;
