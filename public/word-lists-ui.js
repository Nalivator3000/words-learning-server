// Word Lists UI - Browse and import curated word collections
// Displays lists by category, difficulty, topic, and language

class WordListsUI {
    constructor() {
        this.userId = null;
        this.languagePairId = null;
        this.languagePair = null;
        this.wordLists = [];
        this.wordSets = [];  // CEFR word sets
        this.currentFilter = {
            category: '',
            difficulty: '',
            topic: '',
            level: ''  // For CEFR levels (A1, A2, B1, B2, C1, C2)
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
            // Load both traditional word lists and CEFR word sets
            await Promise.all([
                this.loadTraditionalWordLists(),
                this.loadWordSets()
            ]);
        } catch (error) {
            console.error('Error loading word lists:', error);
            throw error;
        }
    }

    async loadTraditionalWordLists() {
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
            if (this.currentFilter.level) params.append('difficulty', this.currentFilter.level);  // CEFR level filter
            if (this.currentFilter.topic) params.append('topic', this.currentFilter.topic);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            // Add cache-busting parameter
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}_t=${Date.now()}`;

            console.log('📋 Fetching word lists from:', url);
            const response = await fetch(url, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) {
                console.warn('Traditional word lists not available');
                this.wordLists = [];
                return;
            }

            this.wordLists = await response.json();
            console.log('✅ Traditional word lists loaded:', this.wordLists.length, 'lists');
            console.log('Lists:', this.wordLists.map(l => l.name));
        } catch (error) {
            console.warn('Error loading traditional word lists:', error);
            this.wordLists = [];
        }
    }

    async loadWordSets() {
        try {
            // Build language pair code (e.g., "de-en")
            const langPairCode = this.languagePair
                ? `${this.languagePair.from_lang}-${this.languagePair.to_lang}`
                : null;

            if (!langPairCode) {
                this.wordSets = [];
                return;
            }

            let url = `/api/word-sets?languagePair=${langPairCode}`;

            // Add CEFR level filter if set
            if (this.currentFilter.level) {
                url += `&level=${this.currentFilter.level}`;
            }

            // Add theme filter if set
            if (this.currentFilter.theme) {
                url += `&theme=${this.currentFilter.theme}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                console.warn('Word sets not available');
                this.wordSets = [];
                return;
            }

            this.wordSets = await response.json();
            console.log('Word sets loaded:', this.wordSets);
        } catch (error) {
            console.warn('Error loading word sets:', error);
            this.wordSets = [];
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
                        <label>CEFR Level</label>
                        <select id="cefrLevelFilter" class="filter-select">
                            <option value="">All Levels</option>
                            <option value="A1" ${this.currentFilter.level === 'A1' ? 'selected' : ''}>A1 - Beginner</option>
                            <option value="A2" ${this.currentFilter.level === 'A2' ? 'selected' : ''}>A2 - Elementary</option>
                            <option value="B1" ${this.currentFilter.level === 'B1' ? 'selected' : ''}>B1 - Intermediate</option>
                            <option value="B2" ${this.currentFilter.level === 'B2' ? 'selected' : ''}>B2 - Upper-Intermediate</option>
                            <option value="C1" ${this.currentFilter.level === 'C1' ? 'selected' : ''}>C1 - Advanced</option>
                            <option value="C2" ${this.currentFilter.level === 'C2' ? 'selected' : ''}>C2 - Proficient</option>
                        </select>
                    </div>

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

        `;

        // Add event listeners
        this.attachEventListeners();

        // Create modal outside of main container for proper z-index stacking
        this.createModal();

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderWordLists() {
        const hasWordSets = this.wordSets && this.wordSets.length > 0;
        const hasWordLists = this.wordLists && this.wordLists.length > 0;

        if (!hasWordSets && !hasWordLists) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <p data-i18n="no_word_lists">No word lists found</p>
                    <small style="color: rgba(255,255,255,0.6); margin-top: 8px; display: block;">
                        Try running: node populate-cefr-word-sets.js
                    </small>
                </div>
            `;
        }

        let html = '';

        // Render CEFR Word Sets first
        if (hasWordSets) {
            html += `
                <div class="word-sets-section">
                    <h3 style="margin: 1rem 0; color: rgba(255,255,255,0.9); font-size: 1.1rem;">
                        📖 CEFR Word Sets
                    </h3>
                    <div class="word-sets-grid">
                        ${this.wordSets.map(set => this.renderWordSetCard(set)).join('')}
                    </div>
                </div>
            `;
        }

        // Render Traditional Word Lists
        if (hasWordLists) {
            html += `
                <div class="traditional-lists-section" style="margin-top: 2rem;">
                    <h3 style="margin: 1rem 0; color: rgba(255,255,255,0.9); font-size: 1.1rem;">
                        📚 Traditional Word Lists
                    </h3>
                    <div class="traditional-lists-grid">
                        ${this.wordLists.map(list => this.renderWordListCard(list)).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    renderWordSetCard(set) {
        const levelColors = {
            'A1': '#22c55e',  // Green
            'A2': '#84cc16',  // Lime
            'B1': '#eab308',  // Yellow
            'B2': '#f97316',  // Orange
            'C1': '#ef4444',  // Red
            'C2': '#a855f7'   // Purple
        };

        const levelColor = levelColors[set.level] || '#6366f1';

        return `
            <div class="word-set-card" data-set-id="${set.id}" style="cursor: pointer;">
                <div class="list-card-header">
                    <div class="list-title-row">
                        <h4 class="list-title">${set.name}</h4>
                        <span class="list-level-badge" style="background: ${levelColor};">
                            ${set.level}
                        </span>
                    </div>
                    <p class="list-description">${set.description || 'No description available'}</p>
                </div>

                <div class="list-card-stats">
                    <div class="stat-item">
                        <span class="stat-icon">📝</span>
                        <span class="stat-value">${set.word_count || 0}</span>
                        <span class="stat-label">words</span>
                    </div>
                    ${set.theme ? `
                        <div class="stat-item">
                            <span class="stat-icon">🏷️</span>
                            <span class="stat-value">${set.theme}</span>
                        </div>
                    ` : ''}
                </div>

                <button class="import-btn" onclick="window.wordListsUI.importWordSet(${set.id}); event.stopPropagation();">
                    ⬇️ Import
                </button>
            </div>
        `;
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

    createModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('wordListModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal at body level (not inside wordListsContent)
        const modalHTML = `
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

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Attach modal event listeners
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Close modal when clicking on backdrop
        const modal = document.getElementById('wordListModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    attachEventListeners() {
        // Filter listeners
        const cefrLevelFilter = document.getElementById('cefrLevelFilter');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const topicFilter = document.getElementById('topicFilter');
        const resetBtn = document.getElementById('resetFiltersBtn');

        if (cefrLevelFilter) {
            cefrLevelFilter.addEventListener('change', (e) => {
                this.currentFilter.level = e.target.value;
                this.refresh();
            });
        }

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
                    topic: '',
                    level: ''
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
    }

    async viewWordList(listId) {
        try {
            // Build URL with native language parameter if available
            let url = `/api/word-lists/${listId}`;
            if (this.languagePair && this.languagePair.from_lang) {
                url += `?native_lang=${this.languagePair.from_lang}`;
            }

            const response = await fetch(url, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error('Failed to load word list details');
            }

            const list = await response.json();
            console.log('📋 Word list loaded:', list);
            console.log('📋 Words array length:', list.words ? list.words.length : 'NO WORDS ARRAY');
            console.log('📋 Words data:', list.words);
            if (list.words && list.words.length > 0) {
                console.log('📋 First word:', list.words[0]);
                console.log('📋 First word keys:', Object.keys(list.words[0]));
            } else {
                console.warn('⚠️ No words in list!');
            }
            this.selectedList = list;

            const modal = document.getElementById('wordListModal');
            const modalTitle = document.getElementById('modalListTitle');
            const modalContent = document.getElementById('modalListContent');

            if (!modal) {
                console.error('❌ Modal element not found: wordListModal');
                throw new Error('Modal element not found');
            }
            if (!modalTitle) {
                console.error('❌ Modal title element not found: modalListTitle');
            }
            if (!modalContent) {
                console.error('❌ Modal content element not found: modalListContent');
            }

            if (modal && modalTitle && modalContent) {
                console.log('✅ All modal elements found, displaying modal...');
                modalTitle.textContent = list.name;

                modalContent.innerHTML = `
                    <div class="word-list-detail">
                        <div class="list-detail-info">
                            <p class="list-detail-description">${list.description || 'No description'}</p>
                            <div class="list-detail-meta">
                                <span><strong>${list.word_count || 0}</strong> <span data-i18n="words">words</span></span>
                                ${list.from_lang && list.to_lang ? `<span><strong>${list.from_lang.toUpperCase()}</strong> → <strong>${list.to_lang.toUpperCase()}</strong></span>` : ''}
                                ${list.difficulty_level ? `<span><strong>${list.difficulty_level}</strong></span>` : ''}
                                ${list.topic ? `<span><strong>${list.topic}</strong></span>` : ''}
                            </div>
                        </div>

                        <div class="words-list">
                            ${(list.words || []).map((word, index) => `
                                <div class="word-item">
                                    <div class="word-number">${index + 1}</div>
                                    <div class="word-content">
                                        <div class="word-main">
                                            <strong>${word.word || 'N/A'}</strong>
                                            <span class="word-translation">${word.translation || 'N/A'}</span>
                                        </div>
                                        ${word.example ? `
                                            <div class="word-example">
                                                <div class="example-text">${word.example}</div>
                                                ${word.exampletranslation || word.exampleTranslation ? `<div class="example-translation">${word.exampletranslation || word.exampleTranslation}</div>` : ''}
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

                console.log('📺 Setting modal display to flex...');
                modal.style.display = 'flex';
                console.log('📺 Modal display set:', modal.style.display);
                console.log('📺 Modal computed style:', window.getComputedStyle(modal).display);

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

    async importWordSet(setId) {
        if (!this.userId || !this.languagePairId) {
            if (window.showToast) {
                showToast('Please select a language pair first', 'error');
            }
            return;
        }

        try {
            if (window.showToast) {
                showToast('Importing word set...', 'info');
            }

            const response = await fetch(`/api/word-sets/${setId}/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    languagePairId: this.languagePairId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to import word set');
            }

            const result = await response.json();

            const message = result.skipped > 0
                ? `Imported ${result.imported} new words (${result.skipped} already in your collection)`
                : `Successfully imported ${result.imported} words!`;

            if (window.showToast) {
                showToast(message, 'success');
            }

            // Refresh word manager and stats if available
            if (window.wordManager) {
                await window.wordManager.loadWords();
                window.wordManager.renderWords();
            }

            if (window.app && window.app.updateStats) {
                await window.app.updateStats();
            }
        } catch (error) {
            console.error('Error importing word set:', error);
            if (window.showToast) {
                showToast(error.message || 'Failed to import word set', 'error');
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
