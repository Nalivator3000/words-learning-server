// API Database Client for PostgreSQL Server
// Replaces IndexedDB with server API calls

class APIDatabase {
    constructor() {
        this.baseUrl = ''; // Same origin
        this.initialized = false;
        console.log('🌐 API Database Client initialized');
    }

    async init() {
        try {
            // Test API connection by getting word counts ONLY if user is logged in
            const { userId } = this.getUserContext();

            if (userId) {
                await this.getWordCounts();
                console.log('✅ API Database connection established');
            } else {
                console.log('⏭️ API Database initialized (user not logged in yet)');
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ API Database initialization failed:', error);
            this.initialized = true; // Still continue, might work for other operations
            return true;
        }
    }

    // Get current user context
    getUserContext() {
        // Get current user and language pair from userManager
        console.log('🔍 getUserContext - window.userManager exists?', !!window.userManager);

        if (!window.userManager) {
            console.error('❌ window.userManager is not defined!');
            return { userId: null, languagePairId: null };
        }

        const isLoggedIn = window.userManager.isLoggedIn();
        console.log('🔍 getUserContext - isLoggedIn?', isLoggedIn);

        if (!isLoggedIn) {
            console.error('❌ User is not logged in!');
            return { userId: null, languagePairId: null };
        }

        const user = window.userManager.getCurrentUser();
        const languagePair = window.userManager.getCurrentLanguagePair();

        console.log('👤 Current user:', user);
        console.log('🌍 Current language pair:', languagePair);

        return {
            userId: user?.id,
            languagePairId: languagePair?.id
        };
    }

    // Helper for API requests with retry logic for rate limiting
    async apiRequest(endpoint, options = {}, retries = 3, retryDelay = 1000) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include',
                ...options
            });

            if (!response.ok) {
                // Handle rate limiting (429) with exponential backoff
                if (response.status === 429) {
                    if (retries > 0) {
                        console.warn(`⚠️ Rate limited (429), retrying in ${retryDelay}ms... (${retries} retries left)`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        // Exponential backoff: double the delay for next retry
                        return await this.apiRequest(endpoint, options, retries - 1, retryDelay * 2);
                    } else {
                        // No more retries left - show user-friendly message
                        console.error('❌ Rate limit exceeded. Please slow down.');
                        throw new Error('RATE_LIMIT_EXCEEDED');
                    }
                }

                const error = await response.text();
                throw new Error(`API Error: ${response.status} - ${error}`);
            }

            return await response.json();
        } catch (error) {
            // Don't log network errors twice
            if (error.message !== 'RATE_LIMIT_EXCEEDED') {
                console.error(`❌ API request failed: ${endpoint}`, error);
            }
            throw error;
        }
    }

    // Words operations
    async addWords(words) {
        if (!words || !Array.isArray(words)) {
            throw new Error('Words array is required');
        }

        return await this.apiRequest('/api/words/bulk', {
            method: 'POST',
            body: JSON.stringify(words)
        });
    }

    async getWordsByStatus(status) {
        const { userId, languagePairId } = this.getUserContext();

        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (languagePairId) params.append('languagePairId', languagePairId);
        if (status) params.append('status', status);

        // Request large limit to get all words (default server limit is 50)
        params.append('limit', '10000');

        const result = await this.apiRequest(`/api/words?${params.toString()}`);
        return Array.isArray(result) ? result : [];
    }

    async getRandomWords(status, count = 10) {
        console.log(`🔍 getRandomWords: status="${status}", count=${count}`);

        try {
            // Get user context
            const { userId, languagePairId } = this.getUserContext();

            console.log(`🔍 getRandomWords: userId=${userId}, languagePairId=${languagePairId}`);
            console.log(`🔍 getRandomWords: userId type=${typeof userId}, languagePairId type=${typeof languagePairId}`);

            if (!userId || !languagePairId) {
                throw new Error(`Missing userId (${userId}) or languagePairId (${languagePairId})`);
            }

            // Use server endpoint for random words with user context
            const params = new URLSearchParams({ userId, languagePairId });
            console.log(`🔍 getRandomWords: URL params = ${params.toString()}`);
            const result = await this.apiRequest(`/api/words/random/${status}/${count}?${params.toString()}`);
            console.log(`🎯 getRandomWords: returning ${result.length} words from server`);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('❌ Server random words failed, using fallback:', error);

            // Fallback: get all words and shuffle client-side
            const words = await this.getWordsByStatus(status);
            const uniqueWords = [...new Map(words.map(w => [w.id, w])).values()];
            const shuffled = uniqueWords.sort(() => 0.5 - Math.random());
            const result = shuffled.slice(0, count);

            console.log(`🎯 getRandomWords fallback: returning ${result.length} words`);
            return result;
        }
    }

    async getReviewWords(count = 10) {
        // Get user context
        const { userId, languagePairId } = this.getUserContext();

        if (!userId || !languagePairId) {
            throw new Error('Missing userId or languagePairId');
        }

        const params = new URLSearchParams({ userId, languagePairId });
        return await this.apiRequest(`/api/words/random/review/${count}?${params.toString()}`);
    }

    async getProportionalWords(count = 10) {
        // Get proportionally distributed words from all statuses
        const { userId, languagePairId } = this.getUserContext();

        if (!userId || !languagePairId) {
            throw new Error('Missing userId or languagePairId');
        }

        const params = new URLSearchParams({ userId, languagePairId });
        return await this.apiRequest(`/api/words/random-proportional/${count}?${params.toString()}`);
    }

    async getWordById(wordId) {
        return await this.apiRequest(`/api/words/${wordId}`);
    }

    async updateWordProgress(wordId, isCorrect, quizType) {
        const { userId, languagePairId } = this.getUserContext();

        if (!userId || !languagePairId) {
            console.error('❌ updateWordProgress: missing context', { userId, languagePairId, wordId });
            return { success: false, error: 'Missing user context' };
        }

        return await this.apiRequest(`/api/words/${wordId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({
                correct: isCorrect,
                questionType: quizType,
                userId: userId,
                languagePairId: languagePairId
            })
        });
    }

    async deleteWord(wordId) {
        return await this.apiRequest(`/api/words/${wordId}`, {
            method: 'DELETE'
        });
    }

    async updateWordStatus(wordId, newStatus) {
        return await this.apiRequest(`/api/words/${wordId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
    }

    async resetAllWordsToStudying() {
        const { userId, languagePairId } = this.getUserContext();
        if (!userId || !languagePairId) {
            throw new Error('User context not available');
        }

        return await this.apiRequest(`/api/words/bulk/reset-to-studying?userId=${userId}&languagePairId=${languagePairId}`, {
            method: 'PUT'
        });
    }

    async checkExpiredReviews() {
        const { userId, languagePairId } = this.getUserContext();
        if (!userId || !languagePairId) {
            console.warn('Cannot check expired reviews: user context not available');
            return { expiredCount: 0 };
        }

        return await this.apiRequest(`/api/words/check-expired-reviews?userId=${userId}&languagePairId=${languagePairId}`, {
            method: 'POST'
        });
    }

    async getWordCounts() {
        const { userId, languagePairId } = this.getUserContext();

        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (languagePairId) params.append('languagePairId', languagePairId);

        return await this.apiRequest(`/api/words/counts?${params.toString()}`);
    }

    async getAllWords() {
        return await this.getWordsByStatus(); // Get all words regardless of status
    }

    async clearAllData() {
        return await this.apiRequest('/words', { method: 'DELETE' });
    }

    async exportWords(status = null) {
        const words = status ? await this.getWordsByStatus(status) : await this.getAllWords();
        return this.convertToCSV(words);
    }

    // Utility methods
    convertToCSV(words) {
        if (!words || words.length === 0) return '';

        const rows = words.map(word => [
            word.word,
            word.example || '',
            word.translation,
            word.example_translation || word.exampleTranslation || '',
            word.total_points || word.totalPoints || word.totalpoints || 0,
            this.getStatusText(word.status),
            word.correct_count || word.correctCount || 0,
            word.incorrect_count || word.incorrectCount || 0,
            word.date_added ? new Date(word.date_added).toLocaleDateString() : '',
            word.last_studied ? new Date(word.last_studied).toLocaleDateString() : ''
        ]);

        const csvContent = rows
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    getStatusText(status) {
        // Try to use i18n if available
        if (window.i18n) {
            const statusKey = `status_${status}`;
            const translated = window.i18n.t(statusKey);
            // If translation exists (not in brackets like [status_xyz]), use it
            if (translated && !translated.startsWith('[')) {
                return translated;
            }
        }

        // Fallback to English status names
        const statusMap = {
            'studying': 'Studying',
            'review': 'Review',
            'review_7': 'Review (7 days)',
            'review_30': 'Review (30 days)',
            'learned': 'Learned'
        };
        return statusMap[status] || status;
    }

    // Word management methods
    async updateWordStatus(wordId, newStatus) {
        return await this.apiRequest(`/api/words/${wordId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
    }

    async updateWord(wordId, updates) {
        return await this.apiRequest(`/api/words/${wordId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteWord(wordId) {
        return await this.apiRequest(`/api/words/${wordId}`, {
            method: 'DELETE'
        });
    }
}

// Create global instance
const database = new APIDatabase();

console.log('🌐 API Database Client loaded');
console.log('💡 Available database functions:');
console.log('   database.init() - Initialize API connection');
console.log('   database.addWords(words) - Add words to database');
console.log('   database.getAllWords() - Get all words');
console.log('   database.getWordCounts() - Get word statistics');