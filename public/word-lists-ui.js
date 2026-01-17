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

    // Translate word set title dynamically
    translateSetTitle(set) {
        const title = set.title || set.name || '';

        // Parse pattern: "German A1: family" or "Spanish B2: travel" or "German A1: General 2"
        const match = title.match(/^(\w+)\s+([ABC][12]):\s*(.+)$/);

        if (!match) return title; // Return as-is if doesn't match pattern

        const [, sourceLang, level, themeWithNumber] = match;

        // Check if theme has a number at the end (e.g., "General 2", "General 10")
        const themeMatch = themeWithNumber.match(/^(.+?)\s+(\d+)$/);

        let theme, partNumber;
        if (themeMatch) {
            // Has a part number: "General 2" -> theme="General", partNumber="2"
            theme = themeMatch[1];
            partNumber = themeMatch[2];
        } else {
            // No part number: "family" -> theme="family"
            theme = themeWithNumber;
            partNumber = null;
        }

        // Map language names to translation keys
        const langKey = `lang_${sourceLang.toLowerCase()}`;
        const themeKey = `topic_${theme.toLowerCase().replace(/\s+/g, '_')}`;

        // Build translated title
        const translatedLang = i18n.t(langKey) || sourceLang;
        const translatedTheme = i18n.t(themeKey) || theme;

        // If has part number, append it
        if (partNumber) {
            return `${translatedLang} ${level}: ${translatedTheme} ${partNumber}`;
        } else {
            return `${translatedLang} ${level}: ${translatedTheme}`;
        }
    }

    // Translate word set description
    translateSetDescription(set) {
        const description = set.description || '';

        // Pattern: "A1 level vocabulary: family"
        const match = description.match(/^([ABC][12])\s+level vocabulary:\s*(.+)$/i);

        if (!match) return description;

        const [, level, theme] = match;
        const themeKey = `topic_${theme.toLowerCase().replace(/\s+/g, '_')}`;
        const translatedTheme = i18n.t(themeKey) || theme;

        return `${level} ${i18n.t('level')} ${i18n.t('vocabulary')}: ${translatedTheme}`;
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
                if (this.languagePair.fromLanguage) {
                    params.append('from_lang', this.languagePair.fromLanguage);
                }
                if (this.languagePair.toLanguage) {
                    params.append('to_lang', this.languagePair.toLanguage);
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
            console.log(`📋 [WORD-SETS] loadWordSets() called`);
            console.log(`📋 [WORD-SETS] this.languagePair:`, this.languagePair);

            // Build language pair code
            // IMPORTANT: The FIRST part should be the language being LEARNED
            // In the DB: from_lang = language being learned, to_lang = native language
            // After transformation: fromLanguage = learning, toLanguage = native
            // For user learning Spanish from English (hi→en in DB):
            // - fromLanguage = hi (learning)
            // - toLanguage = en (native)
            // - We need Hindi word sets, so: "hi-en"
            const langPairCode = this.languagePair
                ? `${this.languagePair.fromLanguage}-${this.languagePair.toLanguage}`
                : null;

            console.log(`📋 [WORD-SETS] Built langPairCode: ${langPairCode} (learning ${this.languagePair?.fromLanguage} from ${this.languagePair?.toLanguage})`);

            if (!langPairCode) {
                console.warn(`❌ [WORD-SETS] No language pair code, aborting`);
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

            console.log(`📋 [WORD-SETS] Fetching from URL: ${url}`);
            console.log(`📋 [WORD-SETS] Language pair code: ${langPairCode}`);

            const response = await fetch(url);
            console.log(`📋 [WORD-SETS] Response status: ${response.status} ${response.statusText}`);
            console.log(`📋 [WORD-SETS] Response ok: ${response.ok}`);

            if (!response.ok) {
                console.warn('❌ [WORD-SETS] Word sets not available, response not ok');
                const errorText = await response.text();
                console.warn('❌ [WORD-SETS] Error response:', errorText);
                this.wordSets = [];
                return;
            }

            this.wordSets = await response.json();
            console.log(`✅ [WORD-SETS] Word sets loaded:`, this.wordSets);
            console.log(`✅ [WORD-SETS] Count: ${this.wordSets.length}`);
        } catch (error) {
            console.warn('Error loading word sets:', error);
            this.wordSets = [];
        }
    }

    render() {
        const container = document.getElementById('wordListsContent');
        if (!container) return;

        const languageName = this.languagePair ? this.languagePair.name : 'Loading...';
        const fromLang = (this.languagePair && this.languagePair.fromLanguage) ? this.languagePair.fromLanguage.toUpperCase() : '';

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
                ${this.renderWordLists()}
            </div>

        `;

        // Add event listeners
        this.attachEventListeners();

        // Create modal outside of main container for proper z-index stacking
        this.createModal();

        // Load word previews for all sets
        this.loadWordPreviews();

        // Update i18n
        if (window.i18n) {
            i18n.updateDOM();
        }

        // Debug: Check how many import buttons exist
        const importButtons = document.querySelectorAll('.import-set-btn');
        console.log(`🔘 Found ${importButtons.length} import buttons on page`);
        if (importButtons.length > 0) {
            console.log('📋 First button:', importButtons[0]);
            console.log('📋 First button data-set-id:', importButtons[0].getAttribute('data-set-id'));
        }
    }

    async loadWordPreviews() {
        const previewContainers = document.querySelectorAll('.word-preview');
        const setIds = Array.from(previewContainers)
            .map(c => c.dataset.setId)
            .filter(id => id);

        if (setIds.length === 0) return;

        // Batch request - get all previews at once
        try {
            const response = await fetch('/api/word-sets/previews/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ setIds, limit: 3 })
            });

            if (!response.ok) {
                console.warn('Batch preview API not available, falling back to individual requests');
                await this.loadWordPreviewsIndividually();
                return;
            }

            const previews = await response.json();

            // Update all containers with their previews
            previewContainers.forEach(container => {
                const setId = container.dataset.setId;
                const data = previews[setId];

                if (data && data.preview && data.preview.length > 0) {
                    const previewHTML = data.preview.map(word =>
                        `<span class="preview-word">${word.word}</span>`
                    ).join('');

                    container.innerHTML = `
                        <div class="preview-words">
                            ${previewHTML}
                            ${data.preview.length < data.wordCount ? '<span class="preview-more">...</span>' : ''}
                        </div>
                    `;
                } else {
                    container.innerHTML = '';
                }
            });
        } catch (error) {
            console.error('Error loading batch previews:', error);
            await this.loadWordPreviewsIndividually();
        }
    }

    async loadWordPreviewsIndividually() {
        const previewContainers = document.querySelectorAll('.word-preview');
        const BATCH_SIZE = 5; // Process 5 at a time
        const DELAY_MS = 100; // 100ms delay between batches

        const containers = Array.from(previewContainers);

        for (let i = 0; i < containers.length; i += BATCH_SIZE) {
            const batch = containers.slice(i, i + BATCH_SIZE);

            // Process batch in parallel
            await Promise.all(batch.map(async (container) => {
                const setId = container.dataset.setId;
                if (!setId) return;

                try {
                    const response = await fetch(`/api/word-sets/${setId}/preview?limit=3`);
                    if (!response.ok) throw new Error('Failed to load preview');

                    const data = await response.json();

                    if (data.preview && data.preview.length > 0) {
                        const previewHTML = data.preview.map(word =>
                            `<span class="preview-word">${word.word}</span>`
                        ).join('');

                        container.innerHTML = `
                            <div class="preview-words">
                                ${previewHTML}
                                ${data.preview.length < data.wordCount ? '<span class="preview-more">...</span>' : ''}
                            </div>
                        `;
                    } else {
                        container.innerHTML = '';
                    }
                } catch (error) {
                    console.error(`Error loading preview for set ${setId}:`, error);
                    container.innerHTML = '';
                }
            }));

            // Delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < containers.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
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

        // Combine all cards into a single grid
        const allCards = [];

        // Add CEFR word sets
        if (hasWordSets) {
            this.wordSets.forEach(set => {
                allCards.push(this.renderWordSetCard(set));
            });
        }

        // Add traditional word lists
        if (hasWordLists) {
            this.wordLists.forEach(list => {
                allCards.push(this.renderWordListCard(list));
            });
        }

        return `
            <div class="word-lists-unified-grid">
                ${allCards.join('')}
            </div>
        `;
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
            <div class="word-list-card" data-set-id="${set.id}">
                <div class="list-card-header">
                    <div class="list-icon">📖</div>
                    <div class="list-badges">
                        <span class="list-badge difficulty" style="background: ${levelColor}20; color: ${levelColor};">
                            ${set.level}
                        </span>
                        ${set.theme ? `<span class="list-badge topic">${set.theme}</span>` : ''}
                    </div>
                </div>

                <div class="list-card-body">
                    <h4 class="list-title">${this.translateSetTitle(set)}</h4>
                    <p class="list-description">${this.translateSetDescription(set) || i18n.t('no_description') || 'No description'}</p>

                    <div class="word-preview" data-set-id="${set.id}">
                        <div class="preview-loading">Loading preview...</div>
                    </div>

                    <div class="list-meta">
                        <div class="meta-item">
                            <span class="meta-icon">📝</span>
                            <span class="meta-text">${set.word_count || 0} <span data-i18n="words">words</span></span>
                        </div>
                    </div>
                </div>

                <div class="list-card-footer">
                    <button class="action-btn secondary-btn view-set-btn" data-set-id="${set.id}">
                        <span data-i18n="view_list">View List</span>
                    </button>
                    <button class="action-btn primary-btn import-set-btn" data-set-id="${set.id}">
                        <span data-i18n="import_list">Import</span>
                    </button>
                </div>
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

        // View set buttons (for CEFR word sets)
        document.querySelectorAll('.view-set-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const setId = e.currentTarget.getAttribute('data-set-id');
                if (setId) {
                    await this.viewWordSet(parseInt(setId));
                }
            });
        });

        // Import set buttons (for CEFR word sets)
        document.querySelectorAll('.import-set-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const setId = e.currentTarget.getAttribute('data-set-id');
                console.log('🔘 Import button clicked! Set ID:', setId);
                console.log('📋 Button element:', e.currentTarget);
                console.log('👤 User ID:', this.userId);
                console.log('🌍 Language Pair ID:', this.languagePairId);
                if (setId) {
                    console.log('✅ Starting import for set:', setId);
                    await this.importWordSet(parseInt(setId));
                } else {
                    console.error('❌ No setId found on button!');
                }
            });
        });
    }

    async viewWordList(listId) {
        try {
            // Build URL with native language parameter if available
            let url = `/api/word-lists/${listId}`;
            if (this.languagePair && this.languagePair.toLanguage) {
                url += `?native_lang=${this.languagePair.toLanguage}`;
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
                                    <button class="add-single-word-btn"
                                            data-word="${this.escapeHtml(word.word || '')}"
                                            data-translation="${this.escapeHtml(word.translation || '')}"
                                            data-example="${this.escapeHtml(word.example || '')}"
                                            data-example-translation="${this.escapeHtml(word.exampletranslation || word.exampleTranslation || '')}"
                                            title="${i18n.t('add_to_dictionary') || 'Add to dictionary'}"
                                            aria-label="${i18n.t('add_to_dictionary') || 'Add to dictionary'}">
                                        +
                                    </button>
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

                // Attach event listeners to add-single-word buttons
                this.attachSingleWordButtonListeners();

                // Update i18n
                if (window.i18n) {
                    i18n.updateDOM();
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

    async viewWordSet(setId) {
        try {
            // Build URL with language pair parameters if available
            let url = `/api/word-sets/${setId}`;
            const params = new URLSearchParams();

            if (this.languagePair) {
                if (this.languagePair.fromLanguage && this.languagePair.toLanguage) {
                    const langPairCode = `${this.languagePair.fromLanguage}-${this.languagePair.toLanguage}`;
                    params.append('languagePair', langPairCode);
                }
                if (this.languagePair.toLanguage) {
                    params.append('native_lang', this.languagePair.toLanguage);
                }
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            console.log(`📖 [WORD-SETS] Fetching word set ${setId} from: ${url}`);

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
                throw new Error('Failed to load word set details');
            }

            const wordSet = await response.json();
            console.log('📖 Word set loaded:', wordSet);
            this.selectedList = wordSet;

            const modal = document.getElementById('wordListModal');
            const modalTitle = document.getElementById('modalListTitle');
            const modalContent = document.getElementById('modalListContent');

            if (!modal || !modalTitle || !modalContent) {
                throw new Error('Modal elements not found');
            }

            modalTitle.textContent = wordSet.name;

            modalContent.innerHTML = `
                <div class="word-list-detail">
                    <div class="list-detail-info">
                        <p class="list-detail-description">${wordSet.description || 'No description'}</p>
                        <div class="list-detail-meta">
                            <span><strong>${wordSet.word_count || 0}</strong> <span data-i18n="words">words</span></span>
                            <span><strong>Level:</strong> ${wordSet.level}</span>
                            ${wordSet.theme ? `<span><strong>Theme:</strong> ${wordSet.theme}</span>` : ''}
                        </div>
                    </div>

                    <div class="words-list">
                        ${(wordSet.words || []).map((word, index) => `
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
                                <button class="add-single-word-btn"
                                        data-word="${this.escapeHtml(word.word || '')}"
                                        data-translation="${this.escapeHtml(word.translation || '')}"
                                        data-example="${this.escapeHtml(word.example || '')}"
                                        data-example-translation="${this.escapeHtml(word.exampletranslation || word.exampleTranslation || '')}"
                                        title="${i18n.t('add_to_dictionary') || 'Add to dictionary'}"
                                        aria-label="${i18n.t('add_to_dictionary') || 'Add to dictionary'}">
                                    +
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            modal.style.display = 'flex';

            // Attach event listeners to add-single-word buttons
            this.attachSingleWordButtonListeners();

            // Update i18n in modal
            if (window.i18n) {
                i18n.updateDOM();
            }
        } catch (error) {
            console.error('Error viewing word set:', error);
            if (window.showToast) {
                showToast(error.message || 'Failed to load word set', 'error');
            }
        }
    }

    attachSingleWordButtonListeners() {
        // Only attach to buttons inside the modal to avoid duplicates
        const modal = document.getElementById('wordListModal');
        if (!modal) {
            console.error('❌ Modal not found for attaching button listeners');
            return;
        }

        const addButtons = modal.querySelectorAll('.add-single-word-btn');
        console.log(`🔘 Found ${addButtons.length} single word buttons in modal`);

        addButtons.forEach((button, index) => {
            // Store data attributes before any manipulation
            const wordData = {
                word: button.getAttribute('data-word'),
                translation: button.getAttribute('data-translation'),
                example: button.getAttribute('data-example'),
                exampleTranslation: button.getAttribute('data-example-translation')
            };

            console.log(`🔘 Button ${index + 1} original data:`, wordData);

            // Remove any existing listeners by cloning
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            console.log(`🔘 Attaching listener to button ${index + 1}`);
            newButton.addEventListener('click', async (e) => {
                console.log('🖱️ Single word button clicked!');
                console.log('📝 Using stored word data:', wordData);
                e.preventDefault();
                e.stopPropagation();

                const btn = e.currentTarget;

                // Disable button while processing
                btn.disabled = true;
                btn.textContent = '...';

                const success = await this.addSingleWordToUserDictionary(wordData);

                if (success) {
                    // Visual feedback: change to checkmark
                    btn.textContent = '✓';
                    btn.classList.add('added');
                    btn.style.backgroundColor = '#10b981';
                    btn.style.color = 'white';

                    // Re-enable after 2 seconds
                    setTimeout(() => {
                        btn.disabled = false;
                    }, 2000);
                } else {
                    // Restore button state on error
                    btn.disabled = false;
                    btn.textContent = '+';
                }
            });
        });
    }

    async importWordSet(setId) {
        console.log('📦 importWordSet called with setId:', setId);
        console.log('👤 this.userId:', this.userId);
        console.log('🌍 this.languagePairId:', this.languagePairId);

        if (!this.userId || !this.languagePairId) {
            console.error('❌ Missing userId or languagePairId!');
            if (window.showToast) {
                showToast('Please select a language pair first', 'error');
            }
            return;
        }

        try {
            console.log('📤 Showing import toast...');
            if (window.showToast) {
                showToast('Importing word set...', 'info');
            }

            const url = `/api/word-sets/${setId}/import`;
            const body = {
                userId: this.userId,
                languagePairId: this.languagePairId
            };

            console.log('🌐 Fetching:', url);
            console.log('📝 Request body:', body);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);

            if (!response.ok) {
                console.error('❌ Response not OK:', response.status);
                let errorMessage = 'Failed to import word set';

                // Special handling for rate limiting (429)
                if (response.status === 429) {
                    errorMessage = 'Too many requests. Please wait a moment before importing more word sets.';
                    console.error('⏱️ Rate limited!');
                    throw new Error(errorMessage);
                }

                try {
                    const error = await response.json();
                    console.error('📄 Error response JSON:', error);
                    errorMessage = error.error || errorMessage;
                } catch (e) {
                    // Handle non-JSON responses
                    console.error('⚠️ Could not parse error as JSON:', e);
                    const text = await response.text();
                    console.error('📄 Error response text:', text);
                    if (text.includes('Too many')) {
                        errorMessage = 'Too many requests. Please wait a moment and try again.';
                    }
                }
                throw new Error(errorMessage);
            }

            console.log('✅ Response OK, parsing JSON...');
            const result = await response.json();
            console.log('📊 Import result:', result);

            // Show appropriate message based on import results
            let message;
            let messageKey;

            if (result.imported > 0 && result.skipped > 0) {
                messageKey = 'import_success_partial';
                message = window.i18n ?
                    window.i18n.t('import_success_partial', { imported: result.imported, skipped: result.skipped }) :
                    `Imported ${result.imported} new words (${result.skipped} already in your collection)`;
            } else if (result.imported > 0) {
                messageKey = 'import_success';
                message = window.i18n ?
                    window.i18n.t('import_success', { count: result.imported }) :
                    `Successfully imported ${result.imported} words!`;
            } else if (result.skipped > 0) {
                messageKey = 'import_already_in_collection';
                message = window.i18n ?
                    window.i18n.t('import_already_in_collection', { count: result.skipped }) :
                    `All ${result.skipped} words from this set are already in your collection`;
            } else {
                messageKey = 'import_no_words';
                message = window.i18n ?
                    window.i18n.t('import_no_words') :
                    'No words to import from this set';
            }

            console.log('💬 Success message:', message);
            console.log('🔔 window.showToast exists?', typeof window.showToast);

            // Show notification banner at top of page
            this.showNotificationBanner(message, 'success', result);

            if (window.showToast) {
                console.log('🔔 Calling showToast with:', message);
                const toastResult = showToast(message, 'success', 5000);
                console.log('🔔 showToast returned:', toastResult);
            } else {
                console.error('❌ window.showToast is not available!');
            }

            console.log('🔄 Refreshing word manager and stats...');

            // Update stats counters
            if (window.app && window.app.updateStats) {
                console.log('📊 Updating stats...');
                await window.app.updateStats();
            } else {
                console.warn('⚠️ window.app.updateStats not available');
            }

            // Visual feedback: change button to indicate imported
            const importBtn = document.querySelector(`button[data-set-id="${setId}"]`);
            if (importBtn && result.imported > 0) {
                importBtn.textContent = '✓ Imported';
                importBtn.classList.remove('primary-btn');
                importBtn.classList.add('secondary-btn');
                importBtn.disabled = true;
                importBtn.style.opacity = '0.6';
                console.log('✅ Updated button visual state');
            } else if (importBtn && result.skipped > 0 && result.imported === 0) {
                importBtn.textContent = '✓ Already imported';
                importBtn.style.opacity = '0.5';
                console.log('ℹ️ Marked button as already imported');
            }

            console.log('✅ Import complete!');
        } catch (error) {
            console.error('❌ Error importing word set:', error);
            console.error('📚 Error stack:', error.stack);

            const errorMessage = error.message || 'Failed to import word set';

            if (window.showToast) {
                console.log('🔔 Showing error toast:', errorMessage);
                showToast(errorMessage, 'error', 5000);
            } else {
                console.error('❌ window.showToast not available! Using alert fallback');
                alert(`❌ ${errorMessage}`);
            }
        }
    }

    showNotificationBanner(message, type, importResult) {
        // Remove existing banner if any
        const existingBanner = document.querySelector('.import-notification-banner');
        if (existingBanner) {
            existingBanner.remove();
        }

        // Create banner
        const banner = document.createElement('div');
        banner.className = `import-notification-banner ${type}`;
        banner.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s ease-out;
            animation: slideDown 0.3s ease-out;
        `;

        const icon = type === 'success' ? '✓' : '✕';

        let detailsText = '';
        if (importResult && importResult.imported > 0) {
            detailsText = window.i18n ?
                window.i18n.t('import_new_words', { count: importResult.imported }) :
                `+${importResult.imported} new words`;
        }
        if (importResult && importResult.skipped > 0) {
            const skippedText = `(${importResult.skipped} already in collection)`;
            detailsText += detailsText ? ` ${skippedText}` : skippedText;
        }

        const details = detailsText ?
            `<div style="font-size: 14px; font-weight: 400; margin-top: 4px;">
                ${detailsText}
            </div>` : '';

        banner.innerHTML = `
            <span style="font-size: 24px;">${icon}</span>
            <div>
                <div>${message}</div>
                ${details}
            </div>
            <button onclick="this.parentElement.style.opacity='0';this.parentElement.style.transform='translateX(-50%) translateY(-20px)';setTimeout(()=>this.parentElement.remove(),300)" style="
                background: rgba(0,0,0,0.2);
                border: 2px solid rgba(255,255,255,0.5);
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 22px;
                font-weight: bold;
                line-height: 1;
                padding: 0;
                flex-shrink: 0;
                transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(0,0,0,0.4)';this.style.borderColor='rgba(255,255,255,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.2)';this.style.borderColor='rgba(255,255,255,0.5)'">×</button>
        `;

        document.body.appendChild(banner);

        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (banner.parentElement) {
                banner.style.opacity = '0';
                banner.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => banner.remove(), 300);
            }
        }, 6000);

        console.log('📢 Notification banner shown');
    }

    closeModal() {
        const modal = document.getElementById('wordListModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.selectedList = null;
    }

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async addSingleWordToUserDictionary(wordData) {
        console.log('➕ Adding single word:', wordData);
        console.log('👤 userId:', this.userId);
        console.log('🌍 languagePairId:', this.languagePairId);

        if (!this.userId || !this.languagePairId) {
            console.error('❌ Missing userId or languagePairId!');
            if (window.showToast) {
                showToast('Please select a language pair first', 'error');
            }
            return false;
        }

        try {
            console.log('📤 Sending request to /api/words...');
            const response = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    word: wordData.word,
                    translation: wordData.translation,
                    example: wordData.example,
                    exampleTranslation: wordData.exampleTranslation,
                    userId: this.userId,
                    languagePairId: this.languagePairId,
                    isCustom: true,
                    source: 'word_set_import'
                })
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response OK?', response.ok);
            const data = await response.json();
            console.log('📊 Response data:', JSON.stringify(data));

            if (response.ok) {
                console.log('✅ Word added successfully! Updating stats...');
                if (window.showToast) {
                    showToast(i18n.t('word_added_successfully') || 'Word added successfully!', 'success');
                }

                // Update stats counters
                if (window.app && window.app.updateStats) {
                    console.log('📊 Calling updateStats()...');
                    await window.app.updateStats();
                    console.log('📊 updateStats() complete!');
                }

                return true;
            } else {
                console.error('❌ Failed to add word! Status:', response.status);
                console.error('❌ Error message:', data.error);
                if (window.showToast) {
                    showToast(data.error || 'Failed to add word', 'error');
                }
                return false;
            }
        } catch (error) {
            console.error('❌ Error adding single word:', error);
            if (window.showToast) {
                showToast('Network error while adding word', 'error');
            }
            return false;
        }
    }

    async refresh(languagePairId = null) {
        try {
            // If new language pair ID provided, update and reload language pair info
            if (languagePairId && languagePairId !== this.languagePairId) {
                this.languagePairId = languagePairId;
                await this.loadLanguagePair();
            }
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
