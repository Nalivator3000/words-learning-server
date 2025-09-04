// Comprehensive Test Suite for Rememberizor
// This file contains all functional and UI tests

// Wait for all components to load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        runAllTests();
    }, 1000);
});

function runAllTests() {
    const { describe, expect, expectElement } = window.testFramework;

    // ===========================================
    // DATABASE TESTS
    // ===========================================
    describe('Database Operations', ({ test, beforeEach }) => {
        beforeEach(async () => {
            // Clean up database before each test
            if (window.db) {
                const transaction = window.db.transaction(['words'], 'readwrite');
                const store = transaction.objectStore('words');
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        });

        test('Database should initialize successfully', async () => {
            expect(window.database).toBeTruthy();
            expect(window.db).toBeTruthy();
        });

        test('Should add word to database', async () => {
            const testWord = {
                word: 'das Haus',
                translation: 'дом',
                example: 'Das Haus ist groß',
                exampleTranslation: 'Дом большой'
            };

            const result = await window.database.addWords([testWord]);
            expect(result).toBeTruthy();
        });

        test('Should retrieve words by status', async () => {
            const testWords = [
                { word: 'test1', translation: 'тест1', example: 'ex1', exampleTranslation: 'пример1' },
                { word: 'test2', translation: 'тест2', example: 'ex2', exampleTranslation: 'пример2' }
            ];

            await window.database.addWords(testWords);
            const studyingWords = await window.database.getWordsByStatus('studying');
            expect(studyingWords.length).toBe(2);
        });

        test('Should update word progress correctly', async () => {
            const testWord = {
                word: 'test',
                translation: 'тест',
                example: 'example',
                exampleTranslation: 'пример'
            };

            await window.database.addWords([testWord]);
            const words = await window.database.getWordsByStatus('studying');
            const wordId = words[0].id;

            await window.database.updateWordProgress(wordId, true);
            const updatedWords = await window.database.getWordsByStatus('studying');
            expect(updatedWords[0].correctCount).toBe(1);
        });
    });

    // ===========================================
    // USER MANAGEMENT TESTS
    // ===========================================
    describe('User Management', ({ test, beforeEach }) => {
        beforeEach(() => {
            // Clear user data
            localStorage.removeItem('users');
            localStorage.removeItem('currentUser');
            if (window.userManager) {
                window.userManager.currentUser = null;
                window.userManager.currentLanguagePair = null;
            }
        });

        test('Should register new user successfully', async () => {
            const result = await window.userManager.register('Test User', 'test@test.com', 'password123');
            expect(result.success).toBeTruthy();
            expect(window.userManager.currentUser.name).toBe('Test User');
        });

        test('Should login existing user', async () => {
            await window.userManager.register('Test User', 'test@test.com', 'password123');
            window.userManager.logout();

            const result = await window.userManager.login('test@test.com', 'password123');
            expect(result.success).toBeTruthy();
            expect(window.userManager.currentUser.email).toBe('test@test.com');
        });

        test('Should reject invalid login credentials', async () => {
            await window.userManager.register('Test User', 'test@test.com', 'password123');
            window.userManager.logout();

            try {
                await window.userManager.login('test@test.com', 'wrongpassword');
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect(error.message).toContain('Неверный');
            }
        });

        test('Should create language pair', async () => {
            await window.userManager.register('Test User', 'test@test.com', 'password123');
            const pair = await window.userManager.createLanguagePair('German', 'Russian', 'German-Russian');
            
            expect(pair.fromLanguage).toBe('German');
            expect(pair.toLanguage).toBe('Russian');
            expect(pair.name).toBe('German-Russian');
        });
    });

    // ===========================================
    // QUIZ MANAGER TESTS
    // ===========================================
    describe('Quiz Manager', ({ test, beforeEach }) => {
        beforeEach(async () => {
            // Setup test words
            const testWords = [
                { word: 'der Hund', translation: 'собака', example: 'Der Hund bellt', exampleTranslation: 'Собака лает' },
                { word: 'die Katze', translation: 'кошка', example: 'Die Katze schläft', exampleTranslation: 'Кошка спит' },
                { word: 'das Auto', translation: 'машина', example: 'Das Auto fährt', exampleTranslation: 'Машина едет' },
                { word: 'das Haus', translation: 'дом', example: 'Das Haus ist groß', exampleTranslation: 'Дом большой' }
            ];

            if (window.database) {
                await window.database.addWords(testWords);
            }
        });

        test('Should create multiple choice question', async () => {
            const quizData = await window.quizManager.startQuiz('study', 'multiple', 2);
            expect(quizData.question.type).toBe('multiple');
            expect(quizData.question.choices).toHaveLength(4);
            expect(quizData.question.questionText).toBeTruthy();
        });

        test('Should create typing question', async () => {
            const quizData = await window.quizManager.startQuiz('study', 'typing', 2);
            expect(quizData.question.type).toBe('typing');
            expect(quizData.question.correctAnswer).toBeTruthy();
        });

        test('Should track quiz progress', async () => {
            await window.quizManager.startQuiz('study', 'multiple', 2);
            const firstQuestion = window.quizManager.getCurrentQuestion();
            expect(firstQuestion.questionNumber).toBe(1);
            expect(firstQuestion.totalQuestions).toBe(2);
        });

        test('Should handle correct and incorrect answers', async () => {
            await window.quizManager.startQuiz('study', 'multiple', 2);
            const question = window.quizManager.getCurrentQuestion().question;
            const correctChoice = question.choices.find(c => c.correct);
            
            const result = window.quizManager.submitAnswer(correctChoice.text);
            expect(result.correct).toBeTruthy();
            expect(window.quizManager.score).toBe(1);
        });
    });

    // ===========================================
    // SURVIVAL MODE TESTS
    // ===========================================
    describe('Survival Mode', ({ test, beforeEach }) => {
        beforeEach(async () => {
            // Setup test words for survival mode
            const testWords = Array.from({ length: 10 }, (_, i) => ({
                word: `word${i}`,
                translation: `слово${i}`,
                example: `example${i}`,
                exampleTranslation: `пример${i}`
            }));

            if (window.database) {
                await window.database.addWords(testWords);
            }

            if (window.app && window.app.survivalMode) {
                window.app.survivalMode.isActive = false;
                window.app.survivalMode.gameEnded = false;
            }
        });

        test('Should initialize survival mode', async () => {
            if (window.app && window.app.survivalMode) {
                await window.app.survivalMode.start();
                expect(window.app.survivalMode.isActive).toBeTruthy();
                expect(window.app.survivalMode.score).toBe(0);
                expect(window.app.survivalMode.errors).toBe(0);
            }
        });

        test('Should generate survival questions', async () => {
            if (window.app && window.app.survivalMode) {
                await window.app.survivalMode.start();
                expect(window.app.survivalMode.currentQuestion).toBeTruthy();
                expect(window.app.survivalMode.currentQuestion.nativeText).toBeTruthy();
                expect(window.app.survivalMode.currentQuestion.correctAnswer).toBeTruthy();
            }
        });

        test('Should handle survival mode button click', () => {
            const survivalBtn = document.getElementById('survivalBtn');
            if (survivalBtn) {
                expect(survivalBtn).toBeTruthy();
                expect(survivalBtn.textContent).toContain('Режим выживания');
            }
        });

        test('Should have proper survival UI elements', () => {
            expectElement('#survivalArea').toExist();
            expectElement('#survivalQuestion').toExist();
            expectElement('#choice1').toExist();
            expectElement('#choice2').toExist();
            expectElement('#survivalScore').toExist();
            expectElement('#survivalErrors').toExist();
        });
    });

    // ===========================================
    // IMAGE SYSTEM TESTS  
    // ===========================================
    describe('Image System', ({ test }) => {
        test('ImageFetcher should initialize', () => {
            if (window.ImageFetcher) {
                const fetcher = new window.ImageFetcher();
                expect(fetcher).toBeInstanceOf(window.ImageFetcher);
                expect(fetcher.imageCache).toBeInstanceOf(Map);
            }
        });

        test('Should clean words correctly', () => {
            if (window.ImageFetcher) {
                const fetcher = new window.ImageFetcher();
                expect(fetcher.cleanWord('der Hund')).toBe('hund');
                expect(fetcher.cleanWord('die Katze (fem.)')).toBe('katze');
                expect(fetcher.cleanWord('"das Auto"')).toBe('das auto');
            }
        });

        test('Should detect word types', () => {
            if (window.ImageFetcher) {
                const fetcher = new window.ImageFetcher();
                expect(fetcher.getWordType('laufen')).toBe('verb');
                expect(fetcher.getWordType('der Hund')).toBe('noun');
                expect(fetcher.getWordType('бегать')).toBe('verb');
            }
        });

        test('Image batch processor should exist', () => {
            if (window.imageBatchProcessor) {
                expect(window.imageBatchProcessor).toBeTruthy();
                expect(typeof window.imageBatchProcessor.getImageStats).toBe('function');
            }
        });
    });

    // ===========================================
    // LANGUAGE MANAGER TESTS
    // ===========================================
    describe('Language Manager', ({ test }) => {
        test('Should initialize with default language', () => {
            if (window.languageManager) {
                expect(window.languageManager.currentLanguage).toBeTruthy();
                expect(window.languageManager.translations).toBeTruthy();
            }
        });

        test('Should translate text correctly', () => {
            if (window.languageManager) {
                const translation = window.languageManager.translate('login');
                expect(translation).toBeTruthy();
                expect(typeof translation).toBe('string');
            }
        });

        test('Should detect language for audio', () => {
            if (window.languageManager) {
                const languagePair = { fromLanguage: 'German', toLanguage: 'Russian' };
                const audioLang = window.languageManager.getAudioLanguageCode('der Hund', languagePair);
                expect(audioLang).toBeTruthy();
            }
        });
    });

    // ===========================================
    // UI COMPONENT TESTS
    // ===========================================
    describe('UI Components', ({ test }) => {
        test('Authentication modal should exist', () => {
            expectElement('#authModal').toExist();
            expectElement('#loginForm').toExist();
            expectElement('#registerForm').toExist();
        });

        test('Navigation buttons should exist', () => {
            expectElement('#homeBtn').toExist();
            expectElement('#importBtn').toExist();
            expectElement('#studyBtn').toExist();
            expectElement('#reviewBtn').toExist();
            expectElement('#statsBtn').toExist();
        });

        test('Study mode buttons should exist', () => {
            expectElement('#multipleChoiceBtn').toExist();
            expectElement('#reverseMultipleChoiceBtn').toExist();
            expectElement('#wordBuildingBtn').toExist();
            expectElement('#typingBtn').toExist();
            expectElement('#survivalBtn').toExist();
            expectElement('#complexModeBtn').toExist();
        });

        test('Import section should exist', () => {
            expectElement('#csvInput').toExist();
            expectElement('#csvImportBtn').toExist();
            expectElement('#googleSheetsUrl').toExist();
            expectElement('#googleImportBtn').toExist();
        });

        test('Settings controls should exist', () => {
            expectElement('#uiLanguageSelect').toExist();
            expectElement('#addLanguagePairBtn').toExist();
            expectElement('#lessonSizeInput').toExist();
            expectElement('#syncBtn').toExist();
        });

        test('Image management controls should exist', () => {
            expectElement('#fetchImagesBtn').toExist();
            expectElement('#imageStatsBtn').toExist();
        });

        test('Quiz area should exist', () => {
            expectElement('#quizArea').toExist();
            expectElement('#questionCounter').toExist();
            expectElement('#questionText').toExist();
            expectElement('#answerArea').toExist();
            expectElement('#nextBtn').toExist();
        });

        test('Survival mode UI should exist', () => {
            expectElement('#survivalArea').toExist();
            expectElement('#survivalQuestion').toExist();
            expectElement('#survivalChoices').toExist();
            expectElement('#choice1').toExist();
            expectElement('#choice2').toExist();
        });
    });

    // ===========================================
    // INTEGRATION TESTS
    // ===========================================
    describe('Integration Tests', ({ test }) => {
        test('App should initialize all managers', () => {
            expect(window.app).toBeTruthy();
            expect(window.database).toBeTruthy();
            expect(window.userManager).toBeTruthy();
            expect(window.languageManager).toBeTruthy();
            expect(window.quizManager).toBeTruthy();
        });

        test('Audio manager should be available', () => {
            if (window.app && window.app.audioManager) {
                expect(window.app.audioManager.isAvailable()).toBeTruthy();
                expect(typeof window.app.audioManager.speak).toBe('function');
            }
        });

        test('Global event listeners should be attached', () => {
            // Test that clicking navigation works
            const homeBtn = document.getElementById('homeBtn');
            if (homeBtn) {
                expect(homeBtn.onclick).toBeTruthy();
            }
        });
    });

    // ===========================================
    // PERFORMANCE TESTS
    // ===========================================
    describe('Performance Tests', ({ test }) => {
        test('Database operations should be fast', async () => {
            const startTime = Date.now();
            const testWords = Array.from({ length: 100 }, (_, i) => ({
                word: `perfTest${i}`,
                translation: `тест${i}`,
                example: `example${i}`,
                exampleTranslation: `пример${i}`
            }));

            if (window.database) {
                await window.database.addWords(testWords);
                const duration = Date.now() - startTime;
                expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
            }
        });

        test('Quiz generation should be fast', async () => {
            const startTime = Date.now();
            
            if (window.quizManager) {
                await window.quizManager.startQuiz('study', 'multiple', 10);
                const duration = Date.now() - startTime;
                expect(duration).toBeLessThan(1000); // Should complete within 1 second
            }
        });
    });

    // Run the test UI
    setTimeout(() => {
        window.testFramework.createTestUI();
    }, 500);
}

// Export for manual testing
window.runAllTests = runAllTests;