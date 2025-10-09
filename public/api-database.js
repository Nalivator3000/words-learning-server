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
            // Test API connection by getting word counts
            await this.getWordCounts();

            this.initialized = true;
            console.log('✅ API Database connection established');
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
        if (!window.userManager || !window.userManager.isLoggedIn()) {
            return { userId: null, languagePairId: null };
        }

        const user = window.userManager.getCurrentUser();
        const languagePair = window.userManager.getCurrentLanguagePair();

        return {
            userId: user?.id,
            languagePairId: languagePair?.id
        };
    }

    // Helper for API requests
    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API Error: ${response.status} - ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Words operations
    async addWords(words) {
        if (!words || !Array.isArray(words)) {
            throw new Error('Words array is required');
        }

        return await this.apiRequest('/words/bulk', {
            method: 'POST',
            body: JSON.stringify(words)
        });
    }

    async getWordsByStatus(status) {
        const params = new URLSearchParams();
        if (status) params.append('status', status);

        // Request large limit to get all words (default server limit is 50)
        params.append('limit', '10000');

        const result = await this.apiRequest(`/words?${params.toString()}`);
        return Array.isArray(result) ? result : [];
    }

    async getRandomWords(status, count = 10) {
        console.log(`🔍 getRandomWords: status="${status}", count=${count}`);

        try {
            // Use server endpoint for random words
            const result = await this.apiRequest(`/words/random/${status}/${count}`);
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
        return await this.apiRequest(`/words/random/review/${count}`);
    }

    async updateWordProgress(wordId, isCorrect, quizType) {
        return await this.apiRequest(`/words/${wordId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({
                correct: isCorrect,
                questionType: quizType
            })
        });
    }

    async getWordCounts() {
        return await this.apiRequest('/words/counts');
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

        const headers = ['Слово', 'Пример', 'Перевод', 'Перевод примера', 'Статус', 'Правильных ответов', 'Неправильных ответов', 'Дата добавления', 'Последнее изучение'];

        const rows = words.map(word => [
            word.word,
            word.example || '',
            word.translation,
            word.example_translation || word.exampleTranslation || '',
            this.getStatusText(word.status),
            word.correct_count || word.correctCount || 0,
            word.incorrect_count || word.incorrectCount || 0,
            word.date_added ? new Date(word.date_added).toLocaleDateString() : '',
            word.last_studied ? new Date(word.last_studied).toLocaleDateString() : ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    getStatusText(status) {
        const statusMap = {
            'studying': 'Изучается',
            'review_7': 'Повторение 7 дней',
            'review_30': 'Повторение 30 дней',
            'learned': 'Изучено'
        };
        return statusMap[status] || status;
    }

    // Word management methods
    async updateWordStatus(wordId, newStatus) {
        return await this.apiRequest(`/words/${wordId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
    }

    async updateWord(wordId, updates) {
        return await this.apiRequest(`/words/${wordId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteWord(wordId) {
        return await this.apiRequest(`/words/${wordId}`, {
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