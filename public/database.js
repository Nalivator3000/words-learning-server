class Database {
    constructor() {
        this.baseURL = window.location.origin;
    }

    async init() {
        // No initialization needed for server version
        console.log('Database connected to server');
    }

    async addWords(words) {
        const response = await fetch(`${this.baseURL}/api/words/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(words)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add words');
        }

        return await response.json();
    }

    async getWordCounts() {
        const response = await fetch(`${this.baseURL}/api/words/counts`);
        
        if (!response.ok) {
            throw new Error('Failed to get word counts');
        }

        return await response.json();
    }

    async getRandomWords(status, count) {
        const response = await fetch(`${this.baseURL}/api/words/random/${status}/${count}`);
        
        if (!response.ok) {
            throw new Error('Failed to get random words');
        }

        return await response.json();
    }

    async getReviewWords(count) {
        return await this.getRandomWords('review', count);
    }

    async getWordsByStatus(status) {
        let queryStatus = status;
        if (status === 'review_7' || status === 'review_30') {
            // Get both review types for the review list
            const response7 = await fetch(`${this.baseURL}/api/words?status=review_7&limit=1000`);
            const response30 = await fetch(`${this.baseURL}/api/words?status=review_30&limit=1000`);
            
            if (!response7.ok || !response30.ok) {
                throw new Error('Failed to get words by status');
            }
            
            const words7 = await response7.json();
            const words30 = await response30.json();
            
            return [...words7, ...words30];
        }
        
        const response = await fetch(`${this.baseURL}/api/words?status=${queryStatus}&limit=1000`);
        
        if (!response.ok) {
            throw new Error('Failed to get words by status');
        }

        return await response.json();
    }

    async updateWordProgress(wordId, correct, questionType) {
        const response = await fetch(`${this.baseURL}/api/words/${wordId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correct: correct,
                questionType: questionType
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update word progress');
        }

        return await response.json();
    }

    async exportWords(status = null) {
        let url = `${this.baseURL}/api/words/export`;
        if (status) {
            url += `/${status}`;
        } else {
            url += '/all';
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to export words');
        }

        return await response.text();
    }

    // Import words from CSV file
    async importWordsFromFile(file) {
        const formData = new FormData();
        formData.append('csvFile', file);

        const response = await fetch(`${this.baseURL}/api/words/import`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to import words');
        }

        return await response.json();
    }

    // Import progress from JSON file (from browser export)
    async importProgressFromFile(file) {
        const formData = new FormData();
        formData.append('progressFile', file);

        const response = await fetch(`${this.baseURL}/api/words/import-progress`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to import progress');
        }

        return await response.json();
    }
}

const database = new Database();