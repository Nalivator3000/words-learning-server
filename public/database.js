class Database {
    constructor() {
        this.db = null;
        this.version = 1;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('LanguageLearningDB', this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Words store
                if (!db.objectStoreNames.contains('words')) {
                    const wordsStore = db.createObjectStore('words', { keyPath: 'id', autoIncrement: true });
                    wordsStore.createIndex('status', 'status', { unique: false });
                    wordsStore.createIndex('nextReview', 'nextReview', { unique: false });
                }

                // User progress store
                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'wordId' });
                }
            };
        });
    }

    async addWords(words) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        const results = [];
        
        // Get current language pair info
        const currentUser = userManager ? userManager.getCurrentUser() : null;
        const currentPair = userManager ? userManager.getCurrentLanguagePair() : null;
        
        const languagePairId = currentPair ? currentPair.id : 'default';
        const userId = currentUser ? currentUser.id : 'anonymous';

        for (const word of words) {
            const wordData = {
                word: word.word,
                example: word.example,
                translation: word.translation,
                exampleTranslation: word.exampleTranslation,
                status: 'studying', // studying, review_7, review_30, learned
                correctCount: 0,
                incorrectCount: 0,
                attempts: [],
                dateAdded: new Date(),
                lastStudied: null,
                nextReview: null,
                reviewAttempts: 0,
                languagePairId: languagePairId, // New: associate with language pair
                userId: userId, // New: associate with user
                studyingLanguage: currentPair ? currentPair.fromLanguage : 'German',
                nativeLanguage: currentPair ? currentPair.toLanguage : 'Russian'
            };
            
            try {
                const result = await this.promisifyRequest(store.add(wordData));
                results.push(result);
            } catch (error) {
                console.error('Error adding word:', error);
            }
        }

        return results;
    }

    async getWordsByStatus(status) {
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        
        // Get current language pair and user context
        const currentUser = userManager ? userManager.getCurrentUser() : null;
        const currentPair = userManager ? userManager.getCurrentLanguagePair() : null;
        
        const allWords = await this.promisifyRequest(store.getAll());
        
        // Filter by status, language pair, and user
        return allWords.filter(word => {
            // Filter by status
            if (word.status !== status) return false;
            
            // Filter by current language pair if available
            if (currentPair && word.languagePairId && word.languagePairId !== currentPair.id) {
                return false;
            }
            
            // Filter by current user if available
            if (currentUser && word.userId && word.userId !== currentUser.id) {
                return false;
            }
            
            // For backward compatibility, include words without languagePairId/userId if no context
            if (!currentPair && !currentUser && !word.languagePairId && !word.userId) {
                return true;
            }
            
            // Include words that match current context or have no context (backward compatibility)
            return (!word.languagePairId || word.languagePairId === (currentPair ? currentPair.id : 'default')) &&
                   (!word.userId || word.userId === (currentUser ? currentUser.id : 'anonymous'));
        });
    }

    async getWordsForReview() {
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const index = store.index('nextReview');
        
        const now = new Date();
        const range = IDBKeyRange.upperBound(now);
        
        return this.promisifyRequest(index.getAll(range));
    }

    async updateWordProgress(wordId, isCorrect, quizType) {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        const word = await this.promisifyRequest(store.get(wordId));
        if (!word) return;

        const attempt = {
            date: new Date(),
            correct: isCorrect,
            quizType: quizType
        };
        
        word.attempts.push(attempt);
        word.lastStudied = new Date();

        if (isCorrect) {
            word.correctCount++;
            
            // Handle different statuses based on current status
            if (word.status === 'studying') {
                if (word.correctCount >= 3) {
                    // Move to 7-day review pool
                    word.status = 'review_7';
                    word.nextReview = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    word.reviewAttempts = 0;
                    console.log(`Word "${word.word}" moved to 7-day review, next review: ${word.nextReview}`);
                }
            } else if (word.status === 'review_7') {
                // Successfully answered in 7-day review
                word.reviewAttempts++;
                
                if (word.reviewAttempts >= 2) {
                    // Move to 30-day review pool
                    word.status = 'review_30';
                    word.nextReview = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    word.reviewAttempts = 0;
                    console.log(`Word "${word.word}" moved to 30-day review, next review: ${word.nextReview}`);
                }
            } else if (word.status === 'review_30') {
                // Successfully answered in 30-day review
                word.reviewAttempts++;
                
                if (word.reviewAttempts >= 2) {
                    // Mark as learned
                    word.status = 'learned';
                    word.nextReview = null;
                    console.log(`Word "${word.word}" marked as learned`);
                }
            }
        } else {
            word.incorrectCount++;
            
            // Handle incorrect answers in review phases
            if (word.status === 'review_7' || word.status === 'review_30') {
                word.reviewAttempts++;
                
                if (word.reviewAttempts >= 2) {
                    // Failed review - send back to studying
                    word.status = 'studying';
                    word.correctCount = Math.max(0, word.correctCount - 1); // Reduce progress slightly
                    word.nextReview = null;
                    word.reviewAttempts = 0;
                    console.log(`Word "${word.word}" failed review, moved back to studying`);
                }
            }
        }

        return this.promisifyRequest(store.put(word));
    }

    async getWordCounts() {
        const [studying, learned] = await Promise.all([
            this.getWordsByStatus('studying'),
            this.getWordsByStatus('learned')
        ]);

        const review7Words = await this.getWordsByStatus('review_7');
        const review30Words = await this.getWordsByStatus('review_30');
        
        // Count only words that are due for review
        const now = new Date();
        const dueReview7 = review7Words.filter(word => 
            !word.nextReview || new Date(word.nextReview) <= now
        );
        const dueReview30 = review30Words.filter(word => 
            !word.nextReview || new Date(word.nextReview) <= now
        );

        return {
            studying: studying.length,
            review: dueReview7.length + dueReview30.length,
            learned: learned.length,
            review7: dueReview7.length,
            review30: dueReview30.length
        };
    }

    async getAllWords() {
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        
        return this.promisifyRequest(store.getAll());
    }

    async clearAllData() {
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        return this.promisifyRequest(store.clear());
    }

    async getRandomWords(status, count = 10) {
        const words = await this.getWordsByStatus(status);
        const shuffled = words.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async getReviewWords(count = 10) {
        const review7Words = await this.getWordsByStatus('review_7');
        const review30Words = await this.getWordsByStatus('review_30');
        
        // Filter words that are due for review (nextReview date has passed or is null)
        const now = new Date();
        console.log('Getting review words, current time:', now);
        
        const dueWords = [...review7Words, ...review30Words].filter(word => {
            if (!word.nextReview) {
                console.log(`Word "${word.word}" has no nextReview date, including in review`);
                return true;
            }
            const reviewDate = new Date(word.nextReview);
            const isDue = reviewDate <= now;
            console.log(`Word "${word.word}" review date: ${reviewDate}, due: ${isDue}`);
            return isDue;
        });
        
        console.log(`Found ${dueWords.length} words due for review`);
        const shuffled = dueWords.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async exportWords(status = null) {
        let words;
        if (status) {
            words = await this.getWordsByStatus(status);
        } else {
            words = await this.getAllWords();
        }

        const csvContent = this.convertToCSV(words);
        return csvContent;
    }

    convertToCSV(words) {
        if (words.length === 0) return '';
        
        const headers = ['Слово', 'Пример', 'Перевод', 'Перевод примера', 'Статус', 'Правильных ответов', 'Неправильных ответов', 'Дата добавления', 'Последнее изучение'];
        
        const rows = words.map(word => [
            word.word,
            word.example,
            word.translation,
            word.exampleTranslation,
            this.getStatusText(word.status),
            word.correctCount,
            word.incorrectCount,
            word.dateAdded ? new Date(word.dateAdded).toLocaleDateString() : '',
            word.lastStudied ? new Date(word.lastStudied).toLocaleDateString() : ''
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

    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const database = new Database();