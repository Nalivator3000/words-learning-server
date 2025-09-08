const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

// Ensure UTF-8 encoding
process.env.LANG = 'en_US.UTF-8';
process.env.LC_ALL = 'en_US.UTF-8';

class WordStudyBot {
    constructor(token, dbPool) {
        this.bot = new TelegramBot(token, { 
            polling: true,
            request: {
                agentOptions: {
                    keepAlive: true,
                    family: 4
                }
            }
        });
        this.pool = dbPool;
        this.userSessions = new Map(); // Store active quiz sessions
        
        this.setupCommands();
        this.setupHandlers();
        
        console.log('🤖 Telegram bot initialized');
    }

    setupCommands() {
        // Set bot commands
        this.bot.setMyCommands([
            { command: 'start', description: 'Начать изучение слов' },
            { command: 'login', description: 'Войти в аккаунт (логин пароль)' },
            { command: 'study', description: 'Изучение новых слов (выбор из вариантов)' },
            { command: 'type', description: 'Изучение новых слов (ввод с клавиатуры)' },
            { command: 'review', description: 'Повторение изученных слов' },
            { command: 'stats', description: 'Статистика изучения' },
            { command: 'help', description: 'Помощь' }
        ]);
    }

    setupHandlers() {
        // Start command
        this.bot.onText(/\/start/, (msg) => {
            this.handleStart(msg);
        });

        // Login command
        this.bot.onText(/\/login (.+)/, (msg, match) => {
            this.handleLogin(msg, match[1]);
        });

        // Study commands
        this.bot.onText(/\/study/, (msg) => {
            this.handleStudy(msg, 'multiple_choice');
        });

        this.bot.onText(/\/type/, (msg) => {
            this.handleStudy(msg, 'typing');
        });

        // Review command
        this.bot.onText(/\/review/, (msg) => {
            this.handleReview(msg);
        });

        // Stats command
        this.bot.onText(/\/stats/, (msg) => {
            this.handleStats(msg);
        });

        // Help command
        this.bot.onText(/\/help/, (msg) => {
            this.handleHelp(msg);
        });

        // Handle callback queries (button presses)
        this.bot.on('callback_query', (query) => {
            this.handleCallbackQuery(query);
        });

        // Handle text messages (for typing exercises)
        this.bot.on('message', (msg) => {
            // Skip if it's a command
            if (msg.text && msg.text.startsWith('/')) return;
            
            this.handleTextMessage(msg);
        });

        // Error handling
        this.bot.on('error', (error) => {
            console.error('Telegram Bot Error:', error);
        });

        // Polling error handling
        this.bot.on('polling_error', (error) => {
            console.error('Telegram Bot Polling Error:', error);
        });
    }

    async handleStart(msg) {
        const chatId = msg.chat.id;
        const welcomeText = `🎓 Добро пожаловать в WordStudyBot!

Я помогу вам изучать немецкие слова. Для начала войдите в свой аккаунт:

/login логин пароль

Например: /login root root

После входа доступны команды:
📚 /study - Изучение с выбором ответа
⌨️ /type - Изучение с вводом перевода  
🔄 /review - Повторение изученных слов
📊 /stats - Статистика обучения
❓ /help - Помощь`;

        await this.bot.sendMessage(chatId, welcomeText);
    }

    async handleLogin(msg, credentials) {
        const chatId = msg.chat.id;
        const parts = credentials.trim().split(' ');
        
        if (parts.length !== 2) {
            await this.bot.sendMessage(chatId, '❌ Неправильный формат. Используйте: /login логин пароль');
            return;
        }

        const [email, password] = parts;
        
        try {
            // Authenticate user (same logic as web app)
            const user = await this.authenticateUser(email, password);
            
            if (user) {
                // Store user session
                this.userSessions.set(chatId, {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    languagePairId: user.languagePairs?.[0]?.id || 'root-user-default-pair'
                });
                
                await this.bot.sendMessage(chatId, `✅ Успешный вход! Добро пожаловать, ${user.name}!

Доступные команды:
📚 /study - Изучение новых слов (выбор из вариантов)
⌨️ /type - Изучение новых слов (ввод перевода)
🔄 /review - Повторение изученных слов
📊 /stats - Ваша статистика`);
            } else {
                await this.bot.sendMessage(chatId, '❌ Неверные учетные данные. Попробуйте еще раз.');
            }
        } catch (error) {
            console.error('Login error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка входа. Попробуйте позже.');
        }
    }

    async handleStudy(msg, quizType) {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);
        
        if (!session) {
            await this.bot.sendMessage(chatId, '❌ Сначала войдите в систему: /login логин пароль');
            return;
        }

        try {
            // Get words for studying
            const words = await this.getStudyWords(session.userId, session.languagePairId);
            
            if (words.length === 0) {
                await this.bot.sendMessage(chatId, '🎉 У вас нет новых слов для изучения! Попробуйте /review для повторения.');
                return;
            }

            // Start quiz session
            const quizSession = {
                type: quizType,
                words: words.slice(0, 10), // Limit to 10 words
                currentIndex: 0,
                correctAnswers: 0,
                startTime: Date.now()
            };

            this.userSessions.set(chatId, { ...session, quiz: quizSession });
            
            await this.sendQuestion(chatId, quizSession);
        } catch (error) {
            console.error('Study error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при загрузке слов. Попробуйте позже.');
        }
    }

    async handleReview(msg) {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);
        
        if (!session) {
            await this.bot.sendMessage(chatId, '❌ Сначала войдите в систему: /login логин пароль');
            return;
        }

        try {
            // Get words for review
            const words = await this.getReviewWords(session.userId, session.languagePairId);
            
            if (words.length === 0) {
                await this.bot.sendMessage(chatId, '✨ У вас нет слов для повторения! Попробуйте /study для изучения новых.');
                return;
            }

            // Start review session (always multiple choice for review)
            const quizSession = {
                type: 'multiple_choice',
                words: words.slice(0, 10),
                currentIndex: 0,
                correctAnswers: 0,
                startTime: Date.now()
            };

            this.userSessions.set(chatId, { ...session, quiz: quizSession });
            
            await this.sendQuestion(chatId, quizSession);
        } catch (error) {
            console.error('Review error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при загрузке слов для повторения.');
        }
    }

    async sendQuestion(chatId, quizSession) {
        const currentWord = quizSession.words[quizSession.currentIndex];
        const questionNum = quizSession.currentIndex + 1;
        const totalQuestions = quizSession.words.length;
        
        if (quizSession.type === 'multiple_choice') {
            // Generate 4 options (1 correct + 3 wrong)
            const options = await this.generateOptions(currentWord, quizSession.words);
            const correctAnswerIndex = options.indexOf(currentWord.translation);
            
            const keyboard = {
                inline_keyboard: options.map((option, index) => [{
                    text: option,
                    callback_data: `answer_${index}_${index === correctAnswerIndex ? 'correct' : 'wrong'}`
                }])
            };
            
            const questionText = `📖 Вопрос ${questionNum}/${totalQuestions}

🇩🇪 **${currentWord.word}**
${currentWord.example ? `\n_${currentWord.example}_` : ''}

Выберите правильный перевод:`;

            // Force UTF-8 encoding for message
            const messageOptions = {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            };
            
            // Ensure question text is properly encoded
            const encodedQuestionText = Buffer.from(questionText, 'utf8').toString('utf8');
            
            await this.bot.sendMessage(chatId, encodedQuestionText, messageOptions);
            
        } else if (quizSession.type === 'typing') {
            const questionText = `⌨️ Вопрос ${questionNum}/${totalQuestions}

🇩🇪 **${currentWord.word}**
${currentWord.example ? `\n_${currentWord.example}_` : ''}
${currentWord.example_translation ? `\n${currentWord.example_translation}` : ''}

Введите перевод на русском языке:`;

            await this.bot.sendMessage(chatId, questionText, {
                parse_mode: 'Markdown'
            });
        }
    }

    async generateOptions(correctWord, allWords) {
        // For now, use only hardcoded Russian words to test encoding
        // This eliminates any database encoding issues
        
        // Map known German words to Russian for testing
        const testTranslations = {
            'der Hund': 'собака',
            'das Haus': 'дом', 
            'die Katze': 'кошка',
            'das Auto': 'машина',
            'der Baum': 'дерево'
        };
        
        // Try to get correct translation from our test map, fallback to original
        const correctTranslation = testTranslations[correctWord.word] || correctWord.translation;
        
        // Use hardcoded Russian words as options to test encoding
        const allRussianOptions = [
            'собака', 'дом', 'кошка', 'машина', 'дерево',
            'время', 'человек', 'работа', 'место', 'день', 
            'жизнь', 'вода', 'земля', 'рука', 'голова'
        ];
        
        // Start with correct answer
        const options = [correctTranslation];
        
        // Add 3 random wrong options
        const wrongOptions = allRussianOptions.filter(opt => opt !== correctTranslation);
        const shuffledWrong = wrongOptions.sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < 3 && i < shuffledWrong.length; i++) {
            options.push(shuffledWrong[i]);
        }
        
        console.log('🔍 Debug - Test options (all hardcoded Russian):', options);
        
        // Shuffle options
        return options.sort(() => 0.5 - Math.random());
    }

    async handleCallbackQuery(query) {
        const chatId = query.message.chat.id;
        const session = this.userSessions.get(chatId);
        
        if (!session?.quiz) {
            await this.bot.answerCallbackQuery(query.id, 'Сессия истекла. Начните новый урок.');
            return;
        }

        const [, , result] = query.data.split('_');
        const isCorrect = result === 'correct';
        const quizSession = session.quiz;
        const currentWord = quizSession.words[quizSession.currentIndex];

        // Update progress
        await this.updateWordProgress(currentWord.id, session.userId, isCorrect, 'multiple_choice');
        
        if (isCorrect) {
            quizSession.correctAnswers++;
            await this.bot.answerCallbackQuery(query.id, '✅ Правильно!');
        } else {
            await this.bot.answerCallbackQuery(query.id, `❌ Неправильно. Правильный ответ: ${currentWord.translation}`);
        }

        // Move to next question or finish
        quizSession.currentIndex++;
        
        if (quizSession.currentIndex < quizSession.words.length) {
            await this.sendQuestion(chatId, quizSession);
        } else {
            await this.finishQuiz(chatId, session);
        }
    }

    async handleTextMessage(msg) {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);
        
        if (!session?.quiz || session.quiz.type !== 'typing') {
            return; // Not in a typing quiz
        }

        const userAnswer = msg.text.trim().toLowerCase();
        const quizSession = session.quiz;
        const currentWord = quizSession.words[quizSession.currentIndex];
        const correctAnswer = currentWord.translation.toLowerCase();
        
        const isCorrect = userAnswer === correctAnswer;
        
        // Update progress
        await this.updateWordProgress(currentWord.id, session.userId, isCorrect, 'typing');
        
        let responseText;
        if (isCorrect) {
            quizSession.correctAnswers++;
            responseText = '✅ Правильно!';
        } else {
            responseText = `❌ Неправильно. Правильный ответ: **${currentWord.translation}**`;
        }
        
        await this.bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
        
        // Move to next question or finish
        quizSession.currentIndex++;
        
        if (quizSession.currentIndex < quizSession.words.length) {
            setTimeout(() => this.sendQuestion(chatId, quizSession), 1500);
        } else {
            setTimeout(() => this.finishQuiz(chatId, session), 1500);
        }
    }

    async finishQuiz(chatId, session) {
        const quizSession = session.quiz;
        const score = Math.round((quizSession.correctAnswers / quizSession.words.length) * 100);
        const duration = Math.round((Date.now() - quizSession.startTime) / 1000);
        
        const resultText = `🏆 Урок завершен!

📊 Результаты:
• Правильных ответов: ${quizSession.correctAnswers}/${quizSession.words.length}
• Точность: ${score}%
• Время: ${duration} секунд

${score >= 80 ? '🎉 Отличная работа!' : 
  score >= 60 ? '👍 Хорошо, но можно лучше!' : 
  '💪 Не сдавайтесь, продолжайте учиться!'}

Команды:
📚 /study - Новые слова (выбор)
⌨️ /type - Новые слова (ввод)
🔄 /review - Повторение
📊 /stats - Статистика`;

        await this.bot.sendMessage(chatId, resultText);
        
        // Clear quiz session
        delete session.quiz;
        this.userSessions.set(chatId, session);
    }

    async handleStats(msg) {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);
        
        if (!session) {
            await this.bot.sendMessage(chatId, '❌ Сначала войдите в систему: /login логин пароль');
            return;
        }

        try {
            const stats = await this.getUserStats(session.userId, session.languagePairId);
            
            const statsText = `📊 Ваша статистика

👤 Пользователь: ${session.name}
📚 Всего слов: ${stats.total_words || 0}
🎯 Изучается: ${stats.studying_words || 0}
⏰ На повторение: ${stats.review_words || 0}
✅ Изучено: ${stats.learned_words || 0}

🔥 Продолжайте изучение!`;

            await this.bot.sendMessage(chatId, statsText);
        } catch (error) {
            console.error('Stats error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка при загрузке статистики.');
        }
    }

    async handleHelp(msg) {
        const chatId = msg.chat.id;
        const helpText = `❓ Помощь по WordStudyBot

🔐 **Вход в систему:**
/login логин пароль

📚 **Обучение:**
/study - Изучение новых слов с выбором из 4 вариантов
/type - Изучение с вводом перевода с клавиатуры
/review - Повторение изученных слов

📊 **Информация:**
/stats - Ваша статистика обучения
/help - Эта справка

💡 **Советы:**
• Регулярно повторяйте слова для лучшего запоминания
• Используйте разные типы упражнений
• Не торопитесь, думайте над ответом

🎓 Удачи в изучении немецкого языка!`;

        await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    }

    // Database methods
    async authenticateUser(email, password) {
        try {
            // First try database
            if (this.pool) {
                const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
                if (result.rows.length > 0) {
                    // In real app, you'd check password hash here
                    const user = result.rows[0];
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        languagePairs: [{ id: 'root-user-default-pair' }] // Simplified
                    };
                }
            }

            // Fallback to hardcoded users
            const devCredentials = [
                { email: 'root', password: 'root', userId: 'root-user', name: 'Root User' },
                { email: 'kate', password: '1', userId: 'kate-user', name: 'Kate' },
                { email: 'mike', password: '1', userId: 'mike-user', name: 'Mike' }
            ];

            const user = devCredentials.find(u => u.email === email && u.password === password);
            if (user) {
                return {
                    id: user.userId,
                    email: user.email,
                    name: user.name,
                    languagePairs: [{ id: `${user.userId}-default-pair` }]
                };
            }

            return null;
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }

    async getStudyWords(userId, languagePairId, limit = 20) {
        try {
            if (this.pool) {
                // Set client encoding to UTF-8
                await this.pool.query('SET client_encoding = UTF8');
                
                const result = await this.pool.query(
                    'SELECT * FROM words WHERE user_id = $1 AND language_pair_id = $2 AND status = $3 ORDER BY RANDOM() LIMIT $4',
                    [userId, languagePairId, 'studying', limit]
                );
                
                // Debug: log the first word to check encoding
                if (result.rows.length > 0) {
                    console.log('🔍 Debug - First word from DB:', {
                        word: result.rows[0].word,
                        translation: result.rows[0].translation,
                        translation_buffer: Buffer.from(result.rows[0].translation).toString('hex')
                    });
                }
                
                return result.rows;
            }
            return [];
        } catch (error) {
            console.error('Error getting study words:', error);
            return [];
        }
    }

    async getReviewWords(userId, languagePairId, limit = 20) {
        try {
            if (this.pool) {
                const result = await this.pool.query(
                    'SELECT * FROM words WHERE user_id = $1 AND language_pair_id = $2 AND status IN ($3, $4) ORDER BY RANDOM() LIMIT $5',
                    [userId, languagePairId, 'review_7', 'review_30', limit]
                );
                return result.rows;
            }
            return [];
        } catch (error) {
            console.error('Error getting review words:', error);
            return [];
        }
    }

    async updateWordProgress(wordId, userId, isCorrect, quizType) {
        try {
            if (this.pool) {
                // Update word progress
                if (isCorrect) {
                    await this.pool.query(
                        'UPDATE words SET correct_count = correct_count + 1, last_studied = NOW() WHERE id = $1 AND user_id = $2',
                        [wordId, userId]
                    );
                } else {
                    await this.pool.query(
                        'UPDATE words SET incorrect_count = incorrect_count + 1, last_studied = NOW() WHERE id = $1 AND user_id = $2',
                        [wordId, userId]
                    );
                }

                // Log attempt
                await this.pool.query(
                    'INSERT INTO word_attempts (word_id, user_id, is_correct, quiz_type) VALUES ($1, $2, $3, $4)',
                    [wordId, userId, isCorrect, quizType]
                );
            }
        } catch (error) {
            console.error('Error updating word progress:', error);
        }
    }

    async getUserStats(userId, languagePairId) {
        try {
            if (this.pool) {
                const result = await this.pool.query(`
                    SELECT 
                        COUNT(*) as total_words,
                        COUNT(CASE WHEN status = 'studying' THEN 1 END) as studying_words,
                        COUNT(CASE WHEN status IN ('review_7', 'review_30') THEN 1 END) as review_words,
                        COUNT(CASE WHEN status = 'learned' THEN 1 END) as learned_words
                    FROM words 
                    WHERE user_id = $1 AND language_pair_id = $2
                `, [userId, languagePairId]);
                
                return result.rows[0] || {};
            }
            return {};
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {};
        }
    }

    stop() {
        if (this.bot) {
            this.bot.stopPolling();
            console.log('🤖 Telegram bot stopped');
        }
    }
}

module.exports = WordStudyBot;