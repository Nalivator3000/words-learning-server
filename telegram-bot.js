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
                },
                encoding: 'utf8'
            },
            // Force UTF-8 for all requests
            baseApiUrl: 'https://api.telegram.org',
            filepath: true
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
            { command: 'register', description: 'Зарегистрировать новый аккаунт' },
            { command: 'study', description: 'Изучение новых слов (выбор из вариантов)' },
            { command: 'type', description: 'Изучение новых слов (ввод с клавиатуры)' },
            { command: 'review', description: 'Повторение изученных слов' },
            { command: 'import', description: 'Импорт словаря из CSV' },
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

        // Register command
        this.bot.onText(/\/register/, (msg) => {
            this.handleRegister(msg);
        });

        // Import command
        this.bot.onText(/\/import/, (msg) => {
            this.handleImport(msg);
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

        // Handle text messages (for typing exercises and registration)
        this.bot.on('message', (msg) => {
            // Skip if it's a command
            if (msg.text && msg.text.startsWith('/')) return;
            
            // Check if user is in registration or import flow
            const chatId = msg.chat.id;
            const session = this.userSessions.get(chatId);
            
            if (session && session.registrationStep) {
                this.handleRegistrationInput(msg);
                return;
            }
            
            if (session && session.importStep) {
                this.handleImportInput(msg);
                return;
            }
            
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

Я помогу вам изучать немецкие слова.

🆕 **Новый пользователь?**
/register - Зарегистрировать аккаунт

🔑 **Уже есть аккаунт?**
/login логин пароль
Например: /login root root

📚 **После входа доступны команды:**
/study - Изучение с выбором ответа
/type - Изучение с вводом перевода
/import - Импорт словаря из CSV
/review - Повторение изученных слов
/stats - Статистика обучения
/help - Помощь`;

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
📥 /import - Импорт словаря (CSV/Google Таблицы)
📊 /stats - Ваша статистика`);
            } else {
                await this.bot.sendMessage(chatId, '❌ Неверные учетные данные. Попробуйте еще раз.');
            }
        } catch (error) {
            console.error('Login error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка входа. Попробуйте позже.');
        }
    }

    async handleRegister(msg) {
        const chatId = msg.chat.id;
        
        // Start registration process
        this.userSessions.set(chatId, {
            registrationStep: 'email',
            registrationData: {}
        });
        
        await this.bot.sendMessage(chatId, `👤 Регистрация нового аккаунта

📧 Введите email (логин):
Например: myemail@example.com`);
    }

    async handleRegistrationInput(msg) {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);
        const text = msg.text.trim();
        
        if (!session || !session.registrationStep) return;
        
        try {
            switch (session.registrationStep) {
                case 'email':
                    // Validate email format
                    if (!text.includes('@') || text.length < 3) {
                        await this.bot.sendMessage(chatId, '❌ Неверный формат email. Попробуйте еще раз:');
                        return;
                    }
                    
                    session.registrationData.email = text;
                    session.registrationStep = 'name';
                    
                    await this.bot.sendMessage(chatId, `✅ Email: ${text}

👤 Введите ваше имя:
Например: Иван Петров`);
                    break;
                    
                case 'name':
                    if (text.length < 2) {
                        await this.bot.sendMessage(chatId, '❌ Имя слишком короткое. Попробуйте еще раз:');
                        return;
                    }
                    
                    session.registrationData.name = text;
                    session.registrationStep = 'password';
                    
                    await this.bot.sendMessage(chatId, `✅ Имя: ${text}

🔒 Введите пароль:
Минимум 4 символа`);
                    break;
                    
                case 'password':
                    if (text.length < 4) {
                        await this.bot.sendMessage(chatId, '❌ Пароль слишком короткий (минимум 4 символа). Попробуйте еще раз:');
                        return;
                    }
                    
                    session.registrationData.password = text;
                    session.registrationStep = 'confirmPassword';
                    
                    await this.bot.sendMessage(chatId, `🔒 Подтвердите пароль:
Введите пароль еще раз`);
                    break;
                    
                case 'confirmPassword':
                    if (text !== session.registrationData.password) {
                        await this.bot.sendMessage(chatId, '❌ Пароли не совпадают. Введите пароль еще раз:');
                        return;
                    }
                    
                    // Complete registration
                    await this.completeRegistration(chatId, session.registrationData);
                    break;
            }
            
            // Update session
            this.userSessions.set(chatId, session);
            
        } catch (error) {
            console.error('Registration input error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка обработки. Попробуйте /register еще раз.');
            
            // Clear registration session
            const cleanSession = this.userSessions.get(chatId);
            if (cleanSession) {
                delete cleanSession.registrationStep;
                delete cleanSession.registrationData;
                this.userSessions.set(chatId, cleanSession);
            }
        }
    }

    async completeRegistration(chatId, data) {
        try {
            // Create user in database
            const user = await this.registerUser(data.email, data.password, data.name);
            
            if (user) {
                // Automatically log in the new user
                this.userSessions.set(chatId, {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    languagePairId: user.languagePairs?.[0]?.id || `${user.id}-default-pair`
                });
                
                await this.bot.sendMessage(chatId, `🎉 Регистрация успешна!

✅ Добро пожаловать, ${user.name}!
📧 Email: ${user.email}
🔑 Вы автоматически вошли в систему

Доступные команды:
📚 /study - Изучение новых слов
⌨️ /type - Ввод перевода
📥 /import - Импорт словаря
📊 /stats - Статистика`);
            } else {
                await this.bot.sendMessage(chatId, '❌ Ошибка регистрации. Возможно, пользователь уже существует.');
            }
            
        } catch (error) {
            console.error('Registration completion error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка регистрации. Попробуйте позже или обратитесь к администратору.');
        }
        
        // Clear registration session
        const session = this.userSessions.get(chatId);
        if (session) {
            delete session.registrationStep;
            delete session.registrationData;
            this.userSessions.set(chatId, session);
        }
    }

    async handleImport(msg) {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);
        
        if (!session || !session.userId) {
            await this.bot.sendMessage(chatId, '❌ Сначала войдите в систему: /login логин пароль или /register');
            return;
        }
        
        // Start import process
        session.importStep = 'csv';
        this.userSessions.set(chatId, session);
        
        const keyboard = {
            inline_keyboard: [
                [{ text: '📋 CSV текст', callback_data: 'import_csv' }],
                [{ text: '📊 Google Таблица', callback_data: 'import_google' }],
                [{ text: '❌ Отмена', callback_data: 'import_cancel' }]
            ]
        };

        await this.bot.sendMessage(chatId, `📥 Импорт словаря

Выберите способ импорта:

📋 **CSV текст** - вставить данные прямо в чат
📊 **Google Таблица** - импорт по ссылке

Формат данных:
• CSV: \`слово,перевод,пример\`
• Google Таблица: первая колонка - слово, вторая - перевод, третья - пример (необязательно)`, 
        {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }

    async handleImportInput(msg) {
        const chatId = msg.chat.id;
        const session = this.userSessions.get(chatId);
        const text = msg.text.trim();
        
        if (!session || !session.importStep || !session.userId) return;
        
        try {
            if (session.importStep === 'csv') {
                await this.processCsvImport(chatId, text, session);
            } else if (session.importStep === 'google') {
                await this.processGoogleSheetsImport(chatId, text, session);
            }
        } catch (error) {
            console.error('Import input error:', error);
            await this.bot.sendMessage(chatId, '❌ Ошибка импорта. Проверьте формат данных и попробуйте еще раз.');
        }
        
        // Clear import session
        delete session.importStep;
        this.userSessions.set(chatId, session);
    }

    async processCsvImport(chatId, csvText, session) {
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            await this.bot.sendMessage(chatId, '❌ Пустые данные. Попробуйте еще раз с /import');
            return;
        }
        
        const words = [];
        let errors = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const parts = line.split(',').map(p => p.trim());
            
            if (parts.length >= 2) {
                const word = parts[0];
                const translation = parts[1];
                const example = parts[2] || '';
                
                if (word && translation) {
                    words.push({
                        word: word,
                        translation: translation,
                        example: example,
                        exampleTranslation: '',
                        status: 'studying'
                    });
                } else {
                    errors.push(`Строка ${i + 1}: пустое слово или перевод`);
                }
            } else {
                errors.push(`Строка ${i + 1}: неверный формат (нужно: слово,перевод)`);
            }
        }
        
        if (words.length === 0) {
            await this.bot.sendMessage(chatId, `❌ Не найдено валидных слов для импорта.
            
Ошибки:
${errors.join('\n')}`);
            return;
        }
        
        // Import words to database
        let successCount = 0;
        
        for (const word of words) {
            try {
                await this.addWordToDatabase(session.userId, session.languagePairId, word);
                successCount++;
            } catch (error) {
                errors.push(`Ошибка добавления "${word.word}": ${error.message}`);
            }
        }
        
        let resultMessage = `📥 Импорт завершен!

✅ Успешно импортировано: ${successCount} слов
📝 Всего строк обработано: ${lines.length}`;

        if (errors.length > 0) {
            resultMessage += `\n\n⚠️ Ошибки (${errors.length}):\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
                resultMessage += `\n... и еще ${errors.length - 5} ошибок`;
            }
        }
        
        resultMessage += `\n\n🎯 Теперь можете изучать слова: /study`;
        
        await this.bot.sendMessage(chatId, resultMessage);
    }

    async processGoogleSheetsImport(chatId, googleSheetsUrl, session) {
        // Validate Google Sheets URL
        const sheetUrlRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
        const match = googleSheetsUrl.match(sheetUrlRegex);
        
        if (!match) {
            await this.bot.sendMessage(chatId, '❌ Неверная ссылка на Google Таблицу. Убедитесь, что ссылка имеет формат:\nhttps://docs.google.com/spreadsheets/d/ID/edit');
            return;
        }
        
        const spreadsheetId = match[1];
        const csvExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
        
        try {
            await this.bot.sendMessage(chatId, '⏳ Загружаю данные из Google Таблицы...');
            
            // Use node-fetch or similar to fetch the CSV data
            const https = require('https');
            const http = require('http');
            const url = require('url');
            
            const csvData = await new Promise((resolve, reject) => {
                const parsedUrl = url.parse(csvExportUrl);
                const httpModule = parsedUrl.protocol === 'https:' ? https : http;
                
                const req = httpModule.get(csvExportUrl, (res) => {
                    if (res.statusCode === 200) {
                        let data = '';
                        res.setEncoding('utf8');
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(data));
                    } else if (res.statusCode === 302 || res.statusCode === 301) {
                        // Handle redirects
                        const location = res.headers.location;
                        if (location) {
                            const redirectReq = httpModule.get(location, (redirectRes) => {
                                if (redirectRes.statusCode === 200) {
                                    let data = '';
                                    redirectRes.setEncoding('utf8');
                                    redirectRes.on('data', chunk => data += chunk);
                                    redirectRes.on('end', () => resolve(data));
                                } else {
                                    reject(new Error(`HTTP ${redirectRes.statusCode}`));
                                }
                            });
                            redirectReq.on('error', reject);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: No redirect location`));
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: Убедитесь, что таблица публично доступна`));
                    }
                });
                
                req.on('error', reject);
                req.setTimeout(10000, () => {
                    req.destroy();
                    reject(new Error('Таймаут запроса. Проверьте ссылку и доступность таблицы.'));
                });
            });
            
            // Process CSV data similarly to processCsvImport
            const lines = csvData.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                await this.bot.sendMessage(chatId, '❌ Таблица пуста или недоступна. Убедитесь, что таблица публично доступна и содержит данные.');
                return;
            }
            
            const words = [];
            let errors = [];
            let successCount = 0;
            
            // Skip header row if it looks like a header
            let startIndex = 0;
            if (lines.length > 1) {
                const firstLine = lines[0].toLowerCase();
                if (firstLine.includes('слово') || firstLine.includes('word') || 
                    firstLine.includes('немецк') || firstLine.includes('german') ||
                    firstLine.includes('перевод') || firstLine.includes('translation')) {
                    startIndex = 1;
                }
            }
            
            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Parse CSV with proper comma handling (handle quotes)
                const parts = this.parseCSVLine(line);
                
                if (parts.length >= 2) {
                    const word = parts[0]?.trim();
                    const translation = parts[1]?.trim();
                    const example = parts[2]?.trim() || '';
                    
                    if (word && translation) {
                        words.push({
                            word: word,
                            translation: translation,
                            example: example,
                            exampleTranslation: '',
                            status: 'studying'
                        });
                    } else {
                        errors.push(`Строка ${i + 1}: пустое слово или перевод`);
                    }
                } else {
                    errors.push(`Строка ${i + 1}: недостаточно данных (нужно минимум 2 колонки)`);
                }
            }
            
            if (words.length === 0) {
                await this.bot.sendMessage(chatId, '❌ Не найдено подходящих данных для импорта. Проверьте формат таблицы.');
                return;
            }
            
            // Add words to database
            for (const word of words) {
                try {
                    await this.addWordToDatabase(session.userId, session.languagePairId, word);
                    successCount++;
                } catch (error) {
                    errors.push(`Ошибка добавления "${word.word}": ${error.message}`);
                }
            }
            
            let resultMessage = `📊 Импорт из Google Таблицы завершен!

✅ Успешно импортировано: ${successCount} слов
📝 Всего строк обработано: ${lines.length - startIndex}`;

            if (errors.length > 0) {
                resultMessage += `\n\n⚠️ Ошибки (${errors.length}):\n${errors.slice(0, 5).join('\n')}`;
                if (errors.length > 5) {
                    resultMessage += `\n... и еще ${errors.length - 5} ошибок`;
                }
            }
            
            resultMessage += `\n\n🎯 Теперь можете изучать слова: /study`;
            
            await this.bot.sendMessage(chatId, resultMessage);
            
        } catch (error) {
            console.error('Google Sheets import error:', error);
            await this.bot.sendMessage(chatId, `❌ Ошибка загрузки Google Таблицы: ${error.message}

💡 Возможные причины:
• Таблица не является публично доступной
• Неверная ссылка на таблицу  
• Проблемы с подключением к интернету
• Таблица пуста или удалена

Попробуйте еще раз с /import или используйте импорт CSV.`);
        }
    }

    // Helper method to properly parse CSV lines with quoted values
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // Handle double quotes as escape
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
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

    async handleImportCallback(query) {
        const chatId = query.message.chat.id;
        const session = this.userSessions.get(chatId);
        
        if (!session || !session.userId) {
            await this.bot.answerCallbackQuery(query.id, '❌ Сначала войдите в систему');
            return;
        }
        
        const action = query.data.split('_')[1]; // csv, google, cancel
        
        try {
            switch (action) {
                case 'csv':
                    session.importStep = 'csv';
                    this.userSessions.set(chatId, session);
                    
                    await this.bot.answerCallbackQuery(query.id);
                    await this.bot.editMessageText(`📋 Импорт из CSV

Отправьте данные в формате:
\`\`\`
слово,перевод,пример
der Hund,собака,Der Hund ist freundlich
das Haus,дом,Das Haus ist groß
die Katze,кошка,Die Katze schläft
\`\`\`

Или упрощенно:
\`\`\`
Hund,собака
Haus,дом
Katze,кошка
\`\`\`

Отправьте данные следующим сообщением:`, {
                        chat_id: chatId,
                        message_id: query.message.message_id,
                        parse_mode: 'Markdown'
                    });
                    break;
                    
                case 'google':
                    session.importStep = 'google';
                    this.userSessions.set(chatId, session);
                    
                    await this.bot.answerCallbackQuery(query.id);
                    await this.bot.editMessageText(`📊 Импорт из Google Таблицы

Отправьте ссылку на Google Таблицу в формате:
\`https://docs.google.com/spreadsheets/d/ID/edit\`

**Важно:**
1. Таблица должна быть **публично доступна** для просмотра
2. Первая колонка: немецкие слова
3. Вторая колонка: русские переводы  
4. Третья колонка: примеры (необязательно)

**Как сделать таблицу публичной:**
1. Откройте таблицу → Файл → Доступ → Разрешить доступ всем у кого есть ссылка
2. Выберите "Читатель"
3. Скопируйте ссылку и отправьте её сюда

Отправьте ссылку следующим сообщением:`, {
                        chat_id: chatId,
                        message_id: query.message.message_id,
                        parse_mode: 'Markdown'
                    });
                    break;
                    
                case 'cancel':
                    delete session.importStep;
                    this.userSessions.set(chatId, session);
                    
                    await this.bot.answerCallbackQuery(query.id, '❌ Импорт отменен');
                    await this.bot.editMessageText('❌ Импорт отменен', {
                        chat_id: chatId,
                        message_id: query.message.message_id
                    });
                    break;
            }
        } catch (error) {
            console.error('Import callback error:', error);
            await this.bot.answerCallbackQuery(query.id, '❌ Ошибка обработки');
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
                wrongWords: [], // Track words with mistakes for repeat
                isReviewPhase: false, // Flag to indicate if we're in the review phase
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
                wrongWords: [], // Track words with mistakes for repeat
                isReviewPhase: false, // Flag to indicate if we're in the review phase
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
            
            const questionText = `${quizSession.isReviewPhase ? '🔄 Повтор' : '📖 Вопрос'} ${questionNum}/${totalQuestions}

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
            const questionText = `${quizSession.isReviewPhase ? '🔄 Повтор' : '⌨️ Вопрос'} ${questionNum}/${totalQuestions}

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
        try {
            // Use the correct translation from the database
            const correctTranslation = correctWord.translation;
            
            // Start with correct answer
            const options = [correctTranslation];
            
            // Try to get other translations from the same user's words to use as wrong options
            let wrongOptions = [];
            
            if (this.pool && allWords && allWords.length > 1) {
                // Get wrong options from other words in the current word set
                wrongOptions = allWords
                    .filter(word => word.id !== correctWord.id && word.translation !== correctTranslation)
                    .map(word => word.translation)
                    .slice(0, 10); // Take first 10 different translations
            }
            
            // If we don't have enough wrong options from user's words, 
            // get random translations from the database
            if (wrongOptions.length < 3 && this.pool) {
                try {
                    const result = await this.pool.query(`
                        SELECT DISTINCT translation 
                        FROM words 
                        WHERE translation != $1 
                        AND translation IS NOT NULL 
                        AND translation != ''
                        ORDER BY RANDOM() 
                        LIMIT 10
                    `, [correctTranslation]);
                    
                    const dbOptions = result.rows.map(row => row.translation);
                    wrongOptions = [...wrongOptions, ...dbOptions];
                } catch (error) {
                    console.warn('Could not fetch wrong options from DB:', error.message);
                }
            }
            
            // Fallback to hardcoded Russian words if still not enough options
            if (wrongOptions.length < 3) {
                const fallbackWords = [
                    'собака', 'кошка', 'машина', 'дерево', 'дом', 'вода',
                    'время', 'человек', 'работа', 'жизнь', 'место', 'день',
                    'школа', 'книга', 'стол', 'окно', 'рука', 'голова'
                ];
                const fallbackOptions = fallbackWords.filter(word => 
                    word !== correctTranslation && !wrongOptions.includes(word)
                );
                wrongOptions = [...wrongOptions, ...fallbackOptions];
            }
            
            // Remove duplicates and shuffle wrong options
            wrongOptions = [...new Set(wrongOptions)];
            wrongOptions.sort(() => 0.5 - Math.random());
            
            // Add 3 wrong options
            for (let i = 0; i < 3 && i < wrongOptions.length; i++) {
                options.push(wrongOptions[i]);
            }
            
            console.log('🔍 Debug - Generated options for', correctWord.word, ':', options);
            
            // Shuffle all options
            return options.sort(() => 0.5 - Math.random());
            
        } catch (error) {
            console.error('Error generating options:', error);
            
            // Emergency fallback
            return [
                correctWord.translation,
                'собака', 'дом', 'машина'
            ].sort(() => 0.5 - Math.random());
        }
    }

    async handleCallbackQuery(query) {
        const chatId = query.message.chat.id;
        const session = this.userSessions.get(chatId);
        
        // Handle import callbacks
        if (query.data.startsWith('import_')) {
            await this.handleImportCallback(query);
            return;
        }
        
        if (!session?.quiz) {
            await this.bot.answerCallbackQuery(query.id, 'Сессия истекла. Начните новый урок.');
            return;
        }

        const [, , result] = query.data.split('_');
        const isCorrect = result === 'correct';
        const quizSession = session.quiz;
        const currentWord = quizSession.words[quizSession.currentIndex];

        // Update progress only if not in review phase (reviewing mistakes)
        if (!quizSession.isReviewPhase) {
            await this.updateWordProgress(currentWord.id, session.userId, isCorrect, 'multiple_choice');
        }
        
        if (isCorrect) {
            quizSession.correctAnswers++;
            await this.bot.answerCallbackQuery(query.id, '✅ Правильно!');
        } else {
            await this.bot.answerCallbackQuery(query.id, `❌ Неправильно. Правильный ответ: ${currentWord.translation}`);
            
            // Add word to review list if not already there and not in review phase
            if (!quizSession.isReviewPhase && !quizSession.wrongWords.some(w => w.id === currentWord.id)) {
                quizSession.wrongWords.push(currentWord);
            }
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
        
        // Update progress only if not in review phase (reviewing mistakes)
        if (!quizSession.isReviewPhase) {
            await this.updateWordProgress(currentWord.id, session.userId, isCorrect, 'typing');
        }
        
        let responseText;
        if (isCorrect) {
            quizSession.correctAnswers++;
            responseText = '✅ Правильно!';
        } else {
            responseText = `❌ Неправильно. Правильный ответ: **${currentWord.translation}**`;
            
            // Add word to review list if not already there and not in review phase
            if (!quizSession.isReviewPhase && !quizSession.wrongWords.some(w => w.id === currentWord.id)) {
                quizSession.wrongWords.push(currentWord);
            }
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
        
        // Check if we have wrong words to repeat and we're not already in review phase
        if (quizSession.wrongWords.length > 0 && !quizSession.isReviewPhase) {
            // Start review phase with wrong words
            await this.bot.sendMessage(chatId, `🔄 Повторим слова с ошибками (${quizSession.wrongWords.length}):`);
            
            // Save original length for final results calculation
            quizSession.originalLength = quizSession.words.length;
            
            // Prepare for review phase
            quizSession.isReviewPhase = true;
            quizSession.words = [...quizSession.wrongWords]; // Copy wrong words for review
            quizSession.currentIndex = 0;
            quizSession.wrongWords = []; // Reset wrong words list for this review
            
            // Start reviewing wrong words
            await this.sendQuestion(chatId, quizSession);
            return;
        }
        
        // Calculate final results
        const originalWordsLength = quizSession.isReviewPhase ? 
            (quizSession.originalLength || quizSession.words.length) : quizSession.words.length;
        const score = Math.round((quizSession.correctAnswers / originalWordsLength) * 100);
        const duration = Math.round((Date.now() - quizSession.startTime) / 1000);
        
        let resultText = `🏆 Урок завершен!

📊 Результаты:
• Правильных ответов: ${quizSession.correctAnswers}/${originalWordsLength}
• Точность: ${score}%
• Время: ${duration} секунд`;

        // Add review phase completion message if applicable
        if (quizSession.isReviewPhase) {
            const reviewWordsCount = quizSession.originalLength - originalWordsLength + quizSession.words.length;
            resultText += `\n🔄 Повторено слов с ошибками: ${quizSession.words.length}`;
        }

        resultText += `

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
                    const user = result.rows[0];
                    
                    // Get user's language pairs from database
                    const pairsResult = await this.pool.query(
                        'SELECT * FROM language_pairs WHERE user_id = $1 ORDER BY is_active DESC, created_at ASC',
                        [user.id]
                    );
                    
                    const languagePairs = pairsResult.rows.map(row => ({
                        id: row.id,
                        name: row.name,
                        fromLanguage: row.from_language,
                        toLanguage: row.to_language,
                        active: row.is_active
                    }));
                    
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        languagePairs: languagePairs
                    };
                }
            }

            // Fallback to hardcoded users (same as server logic)
            const devCredentials = [
                { email: 'root', password: 'root', userId: 'root-user', name: 'Root User' },
                { email: 'Kate', password: '1', userId: 'kate-user', name: 'Kate' },
                { email: 'Mike', password: '1', userId: 'mike-user', name: 'Mike' }
            ];

            const cred = devCredentials.find(c => c.email === email && c.password === password);
            if (cred) {
                // Get language pairs for hardcoded users
                let languagePairs = [];
                if (this.pool) {
                    try {
                        const pairsResult = await this.pool.query(
                            'SELECT * FROM language_pairs WHERE user_id = $1 ORDER BY is_active DESC, created_at ASC',
                            [cred.userId]
                        );
                        languagePairs = pairsResult.rows.map(row => ({
                            id: row.id,
                            name: row.name,
                            fromLanguage: row.from_language,
                            toLanguage: row.to_language,
                            active: row.is_active
                        }));
                    } catch (error) {
                        console.warn('Could not fetch language pairs:', error.message);
                        // Fallback language pair
                        languagePairs = [{
                            id: `${cred.userId}-default-pair`,
                            name: 'German-Russian',
                            fromLanguage: 'German',
                            toLanguage: 'Russian',
                            active: true
                        }];
                    }
                } else {
                    // Fallback for when no database connection
                    languagePairs = [{
                        id: `${cred.userId}-default-pair`,
                        name: 'German-Russian',
                        fromLanguage: 'German',
                        toLanguage: 'Russian',
                        active: true
                    }];
                }
                
                return {
                    id: cred.userId,
                    email: cred.email,
                    name: cred.name,
                    languagePairs: languagePairs
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

    async registerUser(email, password, name) {
        try {
            if (this.pool) {
                // Generate user ID
                const userId = `${email.split('@')[0]}-user`.toLowerCase();
                
                // Check if user already exists
                const existsResult = await this.pool.query('SELECT id FROM users WHERE email = $1 OR id = $2', [email, userId]);
                if (existsResult.rows.length > 0) {
                    throw new Error('Пользователь с таким email уже существует');
                }
                
                // Create user
                await this.pool.query(
                    'INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, NOW())',
                    [userId, email, name, password] // In production, hash the password
                );
                
                // Create default language pair
                const languagePairId = `${userId}-default-pair`;
                await this.pool.query(`
                    INSERT INTO language_pairs (id, user_id, name, from_language, to_language, is_active, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                `, [languagePairId, userId, 'German-Russian', 'German', 'Russian', true]);
                
                console.log(`✅ User registered: ${email} (${userId})`);
                
                return {
                    id: userId,
                    email: email,
                    name: name,
                    languagePairs: [{
                        id: languagePairId,
                        name: 'German-Russian',
                        fromLanguage: 'German',
                        toLanguage: 'Russian',
                        active: true
                    }]
                };
            }
            
            throw new Error('База данных недоступна');
            
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async addWordToDatabase(userId, languagePairId, wordData) {
        try {
            if (this.pool) {
                // Check if word already exists for this user
                const existsResult = await this.pool.query(
                    'SELECT id FROM words WHERE user_id = $1 AND word = $2',
                    [userId, wordData.word]
                );
                
                if (existsResult.rows.length > 0) {
                    throw new Error(`Слово "${wordData.word}" уже существует`);
                }
                
                // Add word to database
                const result = await this.pool.query(`
                    INSERT INTO words (
                        user_id, language_pair_id, word, translation, 
                        example, example_translation, status, correct_count, 
                        incorrect_count, review_attempts, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                    RETURNING id
                `, [
                    userId,
                    languagePairId,
                    wordData.word,
                    wordData.translation,
                    wordData.example || '',
                    wordData.exampleTranslation || '',
                    wordData.status || 'studying',
                    0,
                    0,
                    0
                ]);
                
                return result.rows[0].id;
            }
            
            throw new Error('База данных недоступна');
            
        } catch (error) {
            console.error('Add word error:', error);
            throw error;
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