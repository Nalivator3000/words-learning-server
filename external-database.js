// External Database API Client
// This replaces the local IndexedDB with server-side database calls

class ExternalDatabase {
    constructor() {
        // Use configuration-based API URL
        this.baseUrl = window.appConfig ? window.appConfig.apiUrl : 'http://localhost:3000/api';
        this.token = null;
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.initialized = false;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Database connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('⚠️ Database connection lost - using offline mode');
        });
    }

    // Initialize with stored authentication token
    async init() {
        try {
            // Try to get stored authentication data
            const storedUser = localStorage.getItem('currentUser');
            const emergencyUser = localStorage.getItem('emergencyUser');
            
            const userData = storedUser ? JSON.parse(storedUser) : 
                           emergencyUser ? JSON.parse(emergencyUser) : null;
            
            if (userData) {
                this.token = userData.token;
                this.currentUser = userData;
                
                // Test connection if online
                if (this.isOnline) {
                    try {
                        await this.testConnection();
                        console.log('✅ External database connection established');
                    } catch (error) {
                        console.warn('⚠️ External database not available, using fallback mode');
                        return this.initFallback();
                    }
                }
                
                this.initialized = true;
                return true;
            }
            
            console.log('ℹ️ No user authentication found for external database');
            this.initialized = true;
            return false;
            
        } catch (error) {
            console.error('❌ External database initialization failed:', error);
            return this.initFallback();
        }
    }

    // Fallback to local IndexedDB if external database is not available
    async initFallback() {
        console.log('🔄 Falling back to local IndexedDB');
        
        // Use the existing database instance if available
        if (window.database && typeof window.database.init === 'function') {
            await window.database.init();
            this.fallbackMode = true;
            this.initialized = true;
            return true;
        }
        
        console.error('❌ No fallback database available');
        return false;
    }

    // Test connection to external API
    async testConnection() {
        const response = await fetch(`${this.baseUrl}/health`);
        if (!response.ok) {
            throw new Error('Health check failed');
        }
        return await response.json();
    }

    // Authentication with external API
    async authenticate(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Authentication failed');
            }

            const data = await response.json();
            this.token = data.token;
            this.currentUser = data.user;
            
            // Store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            console.log('✅ External database authentication successful');
            return data.user;
            
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            throw error;
        }
    }

    // Get request headers with authentication
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // API request helper with fallback
    async apiRequest(endpoint, options = {}) {
        // Use fallback if in fallback mode or offline
        if (this.fallbackMode || !this.isOnline) {
            return this.fallbackRequest(endpoint, options);
        }
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API request failed');
            }

            return await response.json();
            
        } catch (error) {
            console.warn(`⚠️ API request failed, trying fallback: ${error.message}`);
            return this.fallbackRequest(endpoint, options);
        }
    }

    // Fallback to local database operations
    async fallbackRequest(endpoint, options) {
        if (!window.database) {
            throw new Error('No fallback database available');
        }
        
        console.log(`🔄 Using fallback database for: ${endpoint}`);
        
        // Map API endpoints to local database methods
        if (endpoint === '/words' && options.method === 'GET') {
            return await window.database.getAllWords();
        } else if (endpoint === '/stats') {
            return await window.database.getWordCounts();
        } else if (endpoint.includes('/words/bulk') && options.method === 'POST') {
            const { words } = JSON.parse(options.body);
            const results = await window.database.addWords(words);
            return { message: `${words.length} words added successfully`, insertedIds: results };
        }
        
        throw new Error(`Fallback not implemented for: ${endpoint}`);
    }

    // Words operations
    async addWords(words) {
        if (!words || !Array.isArray(words)) {
            throw new Error('Words array is required');
        }

        const languagePairId = this.currentUser?.languagePairs?.[0]?.id || 'default-pair';
        
        return await this.apiRequest('/words/bulk', {
            method: 'POST',
            body: JSON.stringify({
                words: words,
                languagePairId: languagePairId
            })
        });
    }

    async getWordsByStatus(status) {
        const languagePairId = this.currentUser?.languagePairs?.[0]?.id;
        const params = new URLSearchParams();
        
        if (status) params.append('status', status);
        if (languagePairId) params.append('languagePairId', languagePairId);
        
        const words = await this.apiRequest(`/words?${params.toString()}`);
        return Array.isArray(words) ? words : [];
    }

    async getRandomWords(status, count = 10) {
        const words = await this.getWordsByStatus(status);
        const shuffled = words.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async getReviewWords(count = 10) {
        const languagePairId = this.currentUser?.languagePairs?.[0]?.id;
        const params = new URLSearchParams();
        
        params.append('limit', count.toString());
        if (languagePairId) params.append('languagePairId', languagePairId);
        
        return await this.apiRequest(`/words/review?${params.toString()}`);
    }

    async updateWordProgress(wordId, isCorrect, quizType) {
        return await this.apiRequest(`/words/${wordId}/progress`, {
            method: 'PUT',
            body: JSON.stringify({
                isCorrect: isCorrect,
                quizType: quizType
            })
        });
    }

    async getWordCounts() {
        const languagePairId = this.currentUser?.languagePairs?.[0]?.id;
        const params = new URLSearchParams();
        
        if (languagePairId) params.append('languagePairId', languagePairId);
        
        return await this.apiRequest(`/stats?${params.toString()}`);
    }

    async getAllWords() {
        return await this.getWordsByStatus(); // Get all words regardless of status
    }

    async clearAllData() {
        // This would require implementing a delete endpoint on the server
        console.warn('⚠️ Clear all data not implemented for external database');
        return Promise.resolve();
    }

    async exportWords(status = null) {
        const words = status ? await this.getWordsByStatus(status) : await this.getAllWords();
        return this.convertToCSV(words);
    }

    // Backup operations
    async createBackup() {
        try {
            const backupData = await this.apiRequest('/backup/export');
            
            // Store backup locally as well
            localStorage.setItem('wordsLearningBackup', JSON.stringify(backupData));
            localStorage.setItem('wordsLearningLastBackup', Date.now().toString());
            
            console.log(`✅ External backup created: ${backupData.wordCount} words`);
            return true;
            
        } catch (error) {
            console.error('❌ External backup creation failed:', error);
            return false;
        }
    }

    async restoreFromBackup(backupData) {
        try {
            await this.apiRequest('/backup/restore', {
                method: 'POST',
                body: JSON.stringify({ backupData })
            });
            
            console.log(`✅ External backup restored: ${backupData.wordCount} words`);
            return true;
            
        } catch (error) {
            console.error('❌ External backup restore failed:', error);
            return false;
        }
    }

    // Utility methods (same as original Database class)
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

    // Word management methods (for editor)
    async updateWordStatus(wordId, newStatus) {
        // This would require implementing an update endpoint
        console.warn('⚠️ Update word status not implemented for external database');
        return Promise.resolve();
    }
    
    async deleteWord(wordId) {
        // This would require implementing a delete endpoint
        console.warn('⚠️ Delete word not implemented for external database');
        return Promise.resolve();
    }

    // Migration helper - transfer data from local to external database
    async migrateFromLocalDatabase() {
        try {
            if (!window.database || this.fallbackMode) {
                console.log('ℹ️ No local database to migrate from');
                return { success: false, message: 'No local database available' };
            }

            console.log('🔄 Starting migration from local to external database...');
            
            // Get all words from local database
            const localWords = await window.database.getAllWords();
            
            if (localWords.length === 0) {
                console.log('ℹ️ No words to migrate');
                return { success: true, message: 'No words to migrate' };
            }

            // Add words to external database
            const result = await this.addWords(localWords);
            
            console.log(`✅ Migration completed: ${localWords.length} words transferred`);
            return { success: true, message: `Migrated ${localWords.length} words successfully` };
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return { success: false, message: error.message };
        }
    }

    // Check if external database is available and working
    async isAvailable() {
        if (!this.isOnline) return false;
        
        try {
            await this.testConnection();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
const externalDatabase = new ExternalDatabase();

// Export for global access
window.externalDatabase = externalDatabase;

console.log('🌐 External Database Client loaded');
console.log('💡 Available functions:');
console.log('   externalDatabase.authenticate(email, password) - Authenticate with server');
console.log('   externalDatabase.migrateFromLocalDatabase() - Migrate local data to server');
console.log('   externalDatabase.addWords(words) - Add words to server');
console.log('   externalDatabase.createBackup() - Create server backup');
console.log('   externalDatabase.isAvailable() - Check server availability');