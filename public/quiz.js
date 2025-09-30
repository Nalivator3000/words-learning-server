class QuizManager {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.questions = [];
        this.mode = null; // 'study' or 'review'
        this.quizType = null; // 'multiple' or 'typing'
    }

    async startQuiz(mode, quizType, questionCount = 10) {
        this.mode = mode;
        this.quizType = quizType;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.questions = [];

        // Get words based on mode
        let words;
        if (mode === 'study') {
            words = await database.getRandomWords('studying', questionCount);
        } else if (mode === 'review') {
            words = await database.getReviewWords(questionCount);
        }

        if (words.length === 0) {
            throw new Error('Нет слов для изучения');
        }

        // Prepare questions
        for (const word of words) {
            let question;
            if (quizType === 'multiple') {
                question = await this.createMultipleChoiceQuestion(word, words);
            } else if (quizType === 'reverse_multiple') {
                question = await this.createReverseMultipleChoiceQuestion(word, words);
            } else if (quizType === 'word_building') {
                question = this.createWordBuildingQuestion(word);
            } else if (quizType === 'typing') {
                question = this.createTypingQuestion(word);
            } else if (quizType === 'complex') {
                // For complex mode, we'll create all 4 types for each word
                const multipleQ = await this.createMultipleChoiceQuestion(word, words);
                const reverseQ = await this.createReverseMultipleChoiceQuestion(word, words);
                const buildingQ = this.createWordBuildingQuestion(word);
                const typingQ = this.createTypingQuestion(word);
                
                this.questions.push(multipleQ, reverseQ, buildingQ, typingQ);
                continue; // Skip the normal push below
            }
            this.questions.push(question);
        }

        this.currentQuiz = {
            mode,
            quizType,
            totalQuestions: this.questions.length,
            startTime: new Date()
        };

        return this.getCurrentQuestion();
    }

    async createMultipleChoiceQuestion(correctWord, allWords) {
        // Get 3 random incorrect answers from the same word list
        const incorrectWords = allWords
            .filter(w => w.id !== correctWord.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        const choices = [
            { text: correctWord.word, correct: true, wordId: correctWord.id },
            ...incorrectWords.map(w => ({ text: w.word, correct: false, wordId: w.id }))
        ];

        // Shuffle choices
        choices.sort(() => 0.5 - Math.random());

        return {
            type: 'multipleChoice',
            questionText: correctWord.translation,
            example: correctWord.exampleTranslation,
            choices: choices,
            correctAnswer: correctWord.word,
            wordId: correctWord.id
        };
    }

    async createReverseMultipleChoiceQuestion(correctWord, allWords) {
        // Get 3 random incorrect answers from the same word list
        const incorrectWords = allWords
            .filter(w => w.id !== correctWord.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        const choices = [
            { text: correctWord.translation, correct: true, wordId: correctWord.id },
            ...incorrectWords.map(w => ({ text: w.translation, correct: false, wordId: w.id }))
        ];

        // Shuffle choices
        choices.sort(() => 0.5 - Math.random());

        return {
            type: 'reverseMultipleChoice',
            questionText: correctWord.word,
            example: correctWord.example,
            choices: choices,
            correctAnswer: correctWord.translation,
            wordId: correctWord.id
        };
    }

    createWordBuildingQuestion(word) {
        // Create shuffled letters for the word (without extra letters)
        const letters = word.word.toLowerCase().split('');

        // Shuffle the letters
        const shuffledLetters = [...letters].sort(() => 0.5 - Math.random());

        return {
            type: 'wordBuilding',
            questionText: word.translation,
            example: word.exampleTranslation,
            letters: shuffledLetters,
            correctAnswer: word.word,
            wordId: word.id
        };
    }

    createTypingQuestion(word) {
        return {
            type: 'typing',
            questionText: word.translation,
            example: word.exampleTranslation,
            correctAnswer: word.word,
            wordId: word.id
        };
    }

    getCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            return null;
        }
        return {
            question: this.questions[this.currentQuestionIndex],
            questionNumber: this.currentQuestionIndex + 1,
            totalQuestions: this.questions.length,
            progress: ((this.currentQuestionIndex + 1) / this.questions.length) * 100
        };
    }

    async checkAnswer(userAnswer) {
        const question = this.questions[this.currentQuestionIndex];
        let isCorrect = false;
        let isPartiallyCorrect = false;
        let feedback = '';

        if (question.type === 'multipleChoice' || question.type === 'reverseMultipleChoice') {
            isCorrect = userAnswer === question.correctAnswer;
            feedback = isCorrect ? 
                'Правильно!' : 
                `Неправильно. Правильный ответ: ${question.correctAnswer}`;
        } else if (question.type === 'wordBuilding') {
            const result = this.checkTypingAnswerDetailed(userAnswer, question.correctAnswer);
            isCorrect = result.correct;
            isPartiallyCorrect = result.partiallyCorrect;
            
            if (isCorrect) {
                feedback = 'Правильно!';
            } else if (isPartiallyCorrect) {
                feedback = `Почти правильно! Правильный ответ: ${question.correctAnswer}`;
            } else {
                feedback = `Неправильно. Правильный ответ: ${question.correctAnswer}`;
            }
        } else if (question.type === 'typing') {
            const result = this.checkTypingAnswerDetailed(userAnswer, question.correctAnswer);
            isCorrect = result.correct;
            isPartiallyCorrect = result.partiallyCorrect;
            
            if (isCorrect) {
                feedback = 'Правильно!';
            } else if (isPartiallyCorrect) {
                feedback = `Почти правильно! Правильный ответ: ${question.correctAnswer}`;
            } else {
                feedback = `Неправильно. Правильный ответ: ${question.correctAnswer}`;
            }
        }

        if (isCorrect || isPartiallyCorrect) {
            this.score++;
        }

        // Update word progress in database (treat partial as correct for progress)
        await database.updateWordProgress(question.wordId, isCorrect || isPartiallyCorrect, question.type);

        return {
            correct: isCorrect,
            partiallyCorrect: isPartiallyCorrect,
            feedback: feedback,
            correctAnswer: question.correctAnswer,
            userAnswer: userAnswer
        };
    }

    checkTypingAnswerDetailed(userAnswer, correctAnswer) {
        // Normalize strings for comparison
        const normalize = (str) => {
            return str.toLowerCase()
                .trim()
                .replace(/[äöüß]/g, (match) => {
                    const replacements = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss' };
                    return replacements[match] || match;
                })
                .replace(/[^\w\s]/g, ''); // Remove punctuation
        };

        const normalizedUser = normalize(userAnswer);
        const normalizedCorrect = normalize(correctAnswer);

        // Exact match
        if (normalizedUser === normalizedCorrect) {
            return { correct: true, partiallyCorrect: false };
        }

        // Check for German article errors
        const articleResult = this.checkGermanArticles(userAnswer.toLowerCase().trim(), correctAnswer.toLowerCase().trim());
        if (articleResult.partialMatch) {
            return { correct: false, partiallyCorrect: true };
        }

        // Check for German ei/ie swap
        if (this.checkGermanEiIeSwap(userAnswer.toLowerCase().trim(), correctAnswer.toLowerCase().trim())) {
            return { correct: false, partiallyCorrect: true };
        }

        // Allow for minor typos using Levenshtein distance
        const distance = this.levenshteinDistance(normalizedUser, normalizedCorrect);
        const maxAllowedDistance = Math.floor(normalizedCorrect.length * 0.2); // Allow 20% error
        
        if (distance <= maxAllowedDistance && distance <= 2) {
            return { correct: false, partiallyCorrect: true };
        }

        return { correct: false, partiallyCorrect: false };
    }

    checkGermanArticles(userAnswer, correctAnswer) {
        const germanArticles = ['der', 'die', 'das', 'den', 'dem', 'des'];
        
        // Extract words from both answers
        const userWords = userAnswer.split(/\s+/);
        const correctWords = correctAnswer.split(/\s+/);
        
        if (userWords.length !== correctWords.length) {
            return { partialMatch: false };
        }

        let hasArticleError = false;
        let otherWordsMatch = true;

        for (let i = 0; i < userWords.length; i++) {
            const userWord = userWords[i];
            const correctWord = correctWords[i];
            
            // Check if this word is an article position
            if (germanArticles.includes(correctWord)) {
                if (userWord !== correctWord) {
                    // Wrong or missing article
                    if (germanArticles.includes(userWord)) {
                        // Wrong article (partial credit)
                        hasArticleError = true;
                    } else {
                        // Missing article or completely wrong word
                        return { partialMatch: false };
                    }
                }
            } else {
                // Non-article word - must match exactly (normalized)
                const normalizeWord = (word) => word.replace(/[äöüß]/g, (match) => {
                    const replacements = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss' };
                    return replacements[match] || match;
                });
                
                if (normalizeWord(userWord) !== normalizeWord(correctWord)) {
                    otherWordsMatch = false;
                    break;
                }
            }
        }

        return { partialMatch: hasArticleError && otherWordsMatch };
    }

    checkGermanEiIeSwap(userAnswer, correctAnswer) {
        // Check if the only difference is ei/ie swaps
        const userWords = userAnswer.split(/\s+/);
        const correctWords = correctAnswer.split(/\s+/);
        
        if (userWords.length !== correctWords.length) {
            return false;
        }

        let hasEiIeSwap = false;
        
        for (let i = 0; i < userWords.length; i++) {
            const userWord = userWords[i];
            const correctWord = correctWords[i];
            
            if (userWord === correctWord) {
                continue; // Words are identical
            }
            
            // Check if the difference is only ei/ie swap
            const userWithSwap = userWord.replace(/ei/g, '###IE###').replace(/ie/g, 'ei').replace(/###IE###/g, 'ie');
            
            if (userWithSwap === correctWord) {
                hasEiIeSwap = true;
            } else {
                // This word has other differences, not just ei/ie
                return false;
            }
        }
        
        return hasEiIeSwap;
    }

    // Keep the old function for backward compatibility
    checkTypingAnswer(userAnswer, correctAnswer) {
        const result = this.checkTypingAnswerDetailed(userAnswer, correctAnswer);
        return result.correct || result.partiallyCorrect;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        return this.getCurrentQuestion();
    }

    isQuizComplete() {
        return this.currentQuestionIndex >= this.questions.length;
    }

    getQuizResults() {
        return {
            score: this.score,
            totalQuestions: this.questions.length,
            percentage: Math.round((this.score / this.questions.length) * 100),
            duration: new Date() - this.currentQuiz.startTime,
            mode: this.mode,
            quizType: this.quizType
        };
    }

    reset() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.questions = [];
        this.mode = null;
        this.quizType = null;
    }
}

class ImportManager {
    static parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const words = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles quotes)
            const columns = this.parseCSVLine(line);
            
            if (columns.length >= 4) {
                words.push({
                    word: columns[0].trim(),
                    example: columns[1].trim(),
                    translation: columns[2].trim(),
                    exampleTranslation: columns[3].trim()
                });
            }
        }

        return words;
    }

    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    static async fetchGoogleSheets(url) {
        try {
            // Use server proxy to avoid CORS issues
            const response = await fetch('/api/import/google-sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            return result.words || [];
        } catch (error) {
            // Fallback to direct access if server endpoint doesn't exist
            console.warn('Server proxy failed, trying direct access:', error.message);
            return await this.fetchGoogleSheetsDirect(url);
        }
    }

    static async fetchGoogleSheetsDirect(url) {
        try {
            // Convert Google Sheets URL to CSV export URL
            let csvUrl = url;

            if (url.includes('docs.google.com/spreadsheets')) {
                // Extract the spreadsheet ID
                const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                if (match) {
                    const spreadsheetId = match[1];
                    csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
                }
            }

            const response = await fetch(csvUrl, {
                mode: 'cors',
                headers: {
                    'Accept': 'text/csv,text/plain,*/*'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            throw new Error(`Ошибка при загрузке Google Таблиц: ${error.message}`);
        }
    }
}

const quizManager = new QuizManager();