class Database {
    constructor() {
        this.apiUrl = window.location.origin; // Use same origin as the app
    }

    async init() {
        // No initialization needed for server-based storage
        console.log('Database: Using server-based storage at', this.apiUrl);
        return Promise.resolve();
    }

    getUserContext() {
        // Get current user and language pair from userManager
        if (!window.userManager || !window.userManager.isLoggedIn()) {
            return { userId: null, languagePairId: null };
        }

        const user = window.userManager.getCurrentUser();
        const languagePair = window.userManager.getCurrentLanguagePair();

        return {
            userId: user ? user.id : null,
            languagePairId: languagePair ? languagePair.id : null
        };
    }

    async addWords(words) {
        try {
            const response = await fetch(`${this.apiUrl}/api/words/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(words)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Words added:', result.message);
            return result;
        } catch (error) {
            console.error('Error adding words:', error);
            throw error;
        }
    }

    async getWordsByStatus(status) {
        try {
            const { userId, languagePairId } = this.getUserContext();
            const params = new URLSearchParams({ status });

            if (userId) params.append('userId', userId);
            if (languagePairId) params.append('languagePairId', languagePairId);

            const response = await fetch(`${this.apiUrl}/api/words?${params}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const words = await response.json();
            return words;
        } catch (error) {
            console.error('Error getting words by status:', error);
            return [];
        }
    }

    async updateWordProgress(wordId, isCorrect, quizType) {
        try {
            const { userId, languagePairId } = this.getUserContext();

            const response = await fetch(`${this.apiUrl}/api/words/${wordId}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    correct: isCorrect,
                    questionType: quizType,
                    userId: userId,
                    languagePairId: languagePairId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Update word progress failed:', response.status, errorData);
                throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const result = await response.json();
            console.log('Progress updated:', result.message);
            return result;
        } catch (error) {
            console.error('Error updating word progress:', error);
            throw error;
        }
    }

    async getWordCounts() {
        try {
            const { userId, languagePairId } = this.getUserContext();
            const params = new URLSearchParams();

            if (userId) params.append('userId', userId);
            if (languagePairId) params.append('languagePairId', languagePairId);

            const response = await fetch(`${this.apiUrl}/api/words/counts?${params}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const counts = await response.json();
            return counts;
        } catch (error) {
            console.error('Error getting word counts:', error);
            return {
                studying: 0,
                review: 0,
                learned: 0,
                review7: 0,
                review30: 0
            };
        }
    }

    async getAllWords() {
        try {
            const { userId, languagePairId } = this.getUserContext();
            const params = new URLSearchParams();

            if (userId) params.append('userId', userId);
            if (languagePairId) params.append('languagePairId', languagePairId);

            const response = await fetch(`${this.apiUrl}/api/words?${params}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const words = await response.json();
            return words;
        } catch (error) {
            console.error('Error getting all words:', error);
            return [];
        }
    }

    async getRandomWords(status, count = 10) {
        try {
            const { userId, languagePairId } = this.getUserContext();
            const params = new URLSearchParams();

            if (userId) params.append('userId', userId);
            if (languagePairId) params.append('languagePairId', languagePairId);

            const response = await fetch(`${this.apiUrl}/api/words/random/${status}/${count}?${params}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const words = await response.json();
            console.log(`🎯 getRandomWords: returning ${words.length} words for quiz`);
            return words;
        } catch (error) {
            console.error('Error getting random words:', error);
            return [];
        }
    }

    async getReviewWords(count = 10) {
        try {
            const { userId, languagePairId } = this.getUserContext();
            const params = new URLSearchParams();

            if (userId) params.append('userId', userId);
            if (languagePairId) params.append('languagePairId', languagePairId);

            const response = await fetch(`${this.apiUrl}/api/words/random/review/${count}?${params}`);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const words = await response.json();
            console.log(`Found ${words.length} words for review`);
            return words;
        } catch (error) {
            console.error('Error getting review words:', error);
            return [];
        }
    }

    async exportWords(status = null) {
        try {
            const endpoint = status ?
                `${this.apiUrl}/api/words/export/${status}` :
                `${this.apiUrl}/api/words/export`;

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const csvContent = await response.text();
            return csvContent;
        } catch (error) {
            console.error('Error exporting words:', error);
            return null;
        }
    }

    // Legacy method for compatibility - not used with server storage
    async clearAllData() {
        console.warn('clearAllData: Not supported with server storage');
        return Promise.resolve();
    }

    // Legacy method for compatibility
    promisifyRequest(request) {
        return Promise.resolve(request);
    }
}

const database = new Database();
