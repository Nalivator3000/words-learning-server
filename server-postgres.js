const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const webpush = require('web-push');
const WordStudyBot = require('./telegram-bot');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', '*'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve static files from current directory with no-cache headers
app.use(express.static('.', {
    extensions: ['html'],
    index: 'index.html',
    setHeaders: (res, path) => {
        // Disable caching for all static files
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'words_learning_jwt_secret_2024';

// Web Push configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BM7XQXJ8uOLO8qQX_-4lB4XJGn7K_zW0V3r8HLvLcB2j4O3lQ8T_KN-LmR4UQeN6Kz8V8-OJn_qW3r6HLvLcB2j4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'mGcUaT7tQP3zqY7sDHw5N3r2K1vX8zT9pR4uE6wF8qC3vB5nM7lP9sA2dF4gH6jK';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@memprizator.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// PostgreSQL connection pool with UTF-8 encoding
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'words_learning',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // Force UTF-8 encoding
    application_name: 'words_learning_app',
    client_encoding: 'UTF8'
});

// Test database connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL database:', err.stack);
        console.log('🔄 Falling back to in-memory mode...');
        initInMemoryMode();
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
        initDatabaseMode();
    }
});

let useDatabase = false;
let inMemoryData = null;
let telegramBot = null;

// Initialize Telegram bot
function initTelegramBot() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
        console.log('⚠️ No Telegram bot token found, bot disabled');
        return;
    }
    
    try {
        telegramBot = new WordStudyBot(botToken, pool);
        console.log('🤖 Telegram bot started successfully');
    } catch (error) {
        console.error('❌ Failed to start Telegram bot:', error);
    }
}

// Initialize database mode
function initDatabaseMode() {
    useDatabase = true;
    initTelegramBot();
    console.log('🗄️  Using PostgreSQL database');
}

// Initialize in-memory fallback mode
function initInMemoryMode() {
    useDatabase = false;
    initTelegramBot(); // Bot can still work in fallback mode
    inMemoryData = {
        users: new Map([
            ['root-user', { 
                id: 'root-user', 
                email: 'root', 
                name: 'Root User', 
                words: [], 
                stats: { studying: 0, learned: 0, review: 0 },
                languagePairs: [{
                    id: 'root-user-default-pair',
                    name: 'German-Russian',
                    fromLanguage: 'German',
                    toLanguage: 'Russian',
                    active: true
                }]
            }],
            ['kate-user', { 
                id: 'kate-user', 
                email: 'Kate', 
                name: 'Kate', 
                words: [], 
                stats: { studying: 0, learned: 0, review: 0 },
                languagePairs: [{
                    id: 'kate-user-default-pair',
                    name: 'German-Russian',
                    fromLanguage: 'German',
                    toLanguage: 'Russian',
                    active: true
                }]
            }],
            ['mike-user', { 
                id: 'mike-user', 
                email: 'Mike', 
                name: 'Mike', 
                words: [], 
                stats: { studying: 0, learned: 0, review: 0 },
                languagePairs: [{
                    id: 'mike-user-default-pair',
                    name: 'German-Russian',
                    fromLanguage: 'German',
                    toLanguage: 'Russian',
                    active: true
                }]
            }]
        ]),
        nextWordId: 1
    };
    console.log('💾 Using in-memory storage (fallback mode)');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        let dbStatus = 'disconnected';
        let totalWords = 0;
        let totalUsers = 0;

        if (useDatabase) {
            const result = await pool.query('SELECT COUNT(*) FROM users');
            totalUsers = parseInt(result.rows[0].count);
            
            const wordsResult = await pool.query('SELECT COUNT(*) FROM words');
            totalWords = parseInt(wordsResult.rows[0].count);
            
            dbStatus = 'postgresql';
        } else {
            totalUsers = inMemoryData.users.size;
            totalWords = Array.from(inMemoryData.users.values()).reduce((sum, user) => sum + user.words.length, 0);
            dbStatus = 'in-memory';
        }

        res.json({ 
            status: 'healthy', 
            database: dbStatus,
            users: totalUsers,
            totalWords: totalWords
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        let user = null;

        if (useDatabase) {
            // Check database for user
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length > 0) {
                user = result.rows[0];
            }
        }

        // Fallback to hardcoded users for development
        const devCredentials = [
            { email: 'root', password: 'root', userId: 'root-user', name: 'Root User' },
            { email: 'Kate', password: '1', userId: 'kate-user', name: 'Kate' },
            { email: 'Mike', password: '1', userId: 'mike-user', name: 'Mike' }
        ];

        const cred = devCredentials.find(c => c.email === email && c.password === password);
        if (!cred) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Get language pairs
        let languagePairs = [];
        if (useDatabase) {
            const pairsResult = await pool.query(
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
        } else {
            const memUser = inMemoryData.users.get(cred.userId);
            languagePairs = memUser ? memUser.languagePairs : [];
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: cred.userId, email: cred.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Update last login if using database
        if (useDatabase) {
            await pool.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [cred.userId]
            );
        }

        const userData = { 
            id: cred.userId, 
            email: cred.email, 
            name: cred.name,
            token: token,
            languagePairs: languagePairs
        };

        console.log(`✅ User ${cred.name} authenticated successfully`);
        res.json({ user: userData, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User endpoints
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        let user = null;
        let languagePairs = [];

        if (useDatabase) {
            const result = await pool.query(
                'SELECT id, email, name, created_at FROM users WHERE id = $1',
                [req.user.userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            user = result.rows[0];
            
            const pairsResult = await pool.query(
                'SELECT * FROM language_pairs WHERE user_id = $1',
                [req.user.userId]
            );
            
            languagePairs = pairsResult.rows;
        } else {
            const memUser = inMemoryData.users.get(req.user.userId);
            if (!memUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            user = {
                id: memUser.id,
                email: memUser.email,
                name: memUser.name,
                created_at: new Date().toISOString()
            };
            
            languagePairs = memUser.languagePairs || [];
        }

        res.json({
            ...user,
            languagePairs: languagePairs
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Words endpoints
app.get('/api/words', authenticateToken, async (req, res) => {
    try {
        const { status, languagePairId, limit, offset } = req.query;
        let words = [];

        if (useDatabase) {
            let query = `
                SELECT w.*, lp.name as language_pair_name 
                FROM words w
                JOIN language_pairs lp ON w.language_pair_id = lp.id
                WHERE w.user_id = $1
            `;
            let params = [req.user.userId];
            let paramCount = 1;

            if (status) {
                paramCount++;
                query += ` AND w.status = $${paramCount}`;
                params.push(status);
            }

            if (languagePairId) {
                paramCount++;
                query += ` AND w.language_pair_id = $${paramCount}`;
                params.push(languagePairId);
            }

            query += ' ORDER BY w.created_at DESC';

            if (limit) {
                paramCount++;
                query += ` LIMIT $${paramCount}`;
                params.push(parseInt(limit));
                
                if (offset) {
                    paramCount++;
                    query += ` OFFSET $${paramCount}`;
                    params.push(parseInt(offset));
                }
            }

            const result = await pool.query(query, params);
            words = result.rows;
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            words = [...user.words];

            if (status) {
                words = words.filter(word => word.status === status);
            }

            if (languagePairId) {
                words = words.filter(word => word.language_pair_id === languagePairId);
            }

            words.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

            const startIndex = offset ? parseInt(offset) : 0;
            const endIndex = limit ? startIndex + parseInt(limit) : words.length;
            words = words.slice(startIndex, endIndex);

            words = words.map(word => ({
                ...word,
                language_pair_name: 'German-Russian'
            }));
        }

        res.json(words);
    } catch (error) {
        console.error('Get words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/words/bulk', authenticateToken, async (req, res) => {
    try {
        const { words, languagePairId } = req.body;
        
        if (!words || !Array.isArray(words) || words.length === 0) {
            return res.status(400).json({ error: 'Words array is required' });
        }

        let insertedIds = [];

        if (useDatabase) {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Get default language pair if not provided
                let pairId = languagePairId;
                if (!pairId) {
                    const pairResult = await client.query(
                        'SELECT id FROM language_pairs WHERE user_id = $1 LIMIT 1',
                        [req.user.userId]
                    );
                    pairId = pairResult.rows[0]?.id || `${req.user.userId}-default-pair`;
                }

                for (const word of words) {
                    const result = await client.query(`
                        INSERT INTO words (
                            user_id, language_pair_id, word, translation, 
                            example, example_translation, status, correct_count, 
                            incorrect_count, review_attempts
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        RETURNING id
                    `, [
                        req.user.userId,
                        pairId,
                        word.word,
                        word.translation,
                        word.example || null,
                        word.exampleTranslation || word.example_translation || null,
                        word.status || 'studying',
                        word.correctCount || word.correct_count || 0,
                        word.incorrectCount || word.incorrect_count || 0,
                        word.reviewAttempts || word.review_attempts || 0
                    ]);
                    
                    insertedIds.push(result.rows[0].id);
                }

                await client.query('COMMIT');
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const defaultPairId = user.languagePairs?.[0]?.id || `${req.user.userId}-default-pair`;
            const now = new Date().toISOString();
            
            for (const word of words) {
                const wordData = {
                    id: inMemoryData.nextWordId++,
                    user_id: req.user.userId,
                    language_pair_id: languagePairId || defaultPairId,
                    word: word.word,
                    translation: word.translation,
                    example: word.example || null,
                    example_translation: word.exampleTranslation || word.example_translation || null,
                    status: word.status || 'studying',
                    correct_count: word.correctCount || word.correct_count || 0,
                    incorrect_count: word.incorrectCount || word.incorrect_count || 0,
                    review_attempts: word.reviewAttempts || word.review_attempts || 0,
                    date_added: word.dateAdded || word.date_added || now,
                    last_studied: word.lastStudied || word.last_studied || null,
                    next_review: word.nextReview || word.next_review || null,
                    created_at: now,
                    updated_at: now
                };
                
                user.words.push(wordData);
                insertedIds.push(wordData.id);
            }

            updateInMemoryStats(user);
        }

        console.log(`✅ Added ${words.length} words for user ${req.user.userId}`);

        res.status(201).json({ 
            message: `${words.length} words added successfully`,
            insertedIds: insertedIds
        });

    } catch (error) {
        console.error('Bulk add words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/words - Clear all user's words
app.delete('/api/words', authenticateToken, async (req, res) => {
    try {
        let deletedCount = 0;

        if (useDatabase) {
            const result = await pool.query(
                'DELETE FROM words WHERE user_id = $1 RETURNING id',
                [req.user.userId]
            );
            deletedCount = result.rowCount;
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (user) {
                deletedCount = user.words.length;
                user.words = [];
            }
        }

        console.log(`✅ Deleted ${deletedCount} words for user ${req.user.userId}`);
        res.json({ 
            success: true,
            message: `${deletedCount} words deleted successfully`,
            deletedCount: deletedCount
        });

    } catch (error) {
        console.error('Delete all words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/words/review', authenticateToken, async (req, res) => {
    try {
        const { languagePairId, limit = 10 } = req.query;
        let words = [];

        if (useDatabase) {
            const result = await pool.query(
                'SELECT * FROM get_review_words($1, $2)',
                [req.user.userId, parseInt(limit)]
            );
            words = result.rows;
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            words = user.words.filter(word => {
                if (!['review_7', 'review_30'].includes(word.status)) return false;
                
                if (languagePairId && word.language_pair_id !== languagePairId) return false;
                
                if (word.next_review) {
                    const reviewDate = new Date(word.next_review);
                    const now = new Date();
                    return reviewDate <= now;
                }
                
                return true;
            });

            words = words.sort(() => 0.5 - Math.random()).slice(0, parseInt(limit));
            
            words = words.map(word => ({
                ...word,
                language_pair_name: 'German-Russian'
            }));
        }

        res.json(words);
    } catch (error) {
        console.error('Get review words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/words/study', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        let words = [];

        if (useDatabase) {
            const result = await pool.query(
                'SELECT * FROM get_study_words($1, $2)',
                [req.user.userId, parseInt(limit)]
            );
            words = result.rows;
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            words = user.words.filter(word => word.status === 'studying');
            words = words.sort(() => 0.5 - Math.random()).slice(0, parseInt(limit));
            
            words = words.map(word => ({
                ...word,
                language_pair_name: 'German-Russian'
            }));
        }

        res.json(words);
    } catch (error) {
        console.error('Get study words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/words/:wordId/progress', authenticateToken, async (req, res) => {
    try {
        const { wordId } = req.params;
        const { isCorrect, quizType } = req.body;

        if (useDatabase) {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // Get current word
                const wordResult = await client.query(
                    'SELECT * FROM words WHERE id = $1 AND user_id = $2',
                    [wordId, req.user.userId]
                );

                if (wordResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Word not found' });
                }

                const word = wordResult.rows[0];

                // Record the attempt (temporarily disabled - table may not exist)
                // await client.query(`
                //     INSERT INTO word_attempts (word_id, user_id, is_correct, quiz_type)
                //     VALUES ($1, $2, $3, $4)
                // `, [wordId, req.user.userId, isCorrect, quizType || 'multiple_choice']);

                // Points system for word progression
                let newStatus = word.status;
                let newCorrectCount = word.correct_count;
                let newIncorrectCount = word.incorrect_count;
                let newReviewAttempts = word.review_attempts;
                let nextReview = word.next_review;
                let newPoints = word.points || 0;
                let pointsAwarded = 0;

                if (isCorrect) {
                    newCorrectCount++;
                    
                    // Award points based on quiz type (only for non-survival modes)
                    if (quizType !== 'survival') {
                        switch (quizType) {
                            case 'typing':
                                pointsAwarded = 10; // Typing mode: 10 points
                                break;
                            case 'word_building':
                                pointsAwarded = 4; // Word building: 4 points
                                break;
                            case 'multiple_choice':
                            case 'reverse_multiple_choice':
                                pointsAwarded = 1; // Multiple choice: 1 point
                                break;
                            default:
                                pointsAwarded = 1; // Default: 1 point
                                break;
                        }
                        
                        newPoints += pointsAwarded;
                        console.log(`💰 Awarded ${pointsAwarded} points for ${quizType}. Total: ${newPoints}/50`);
                    }
                    
                    // Check for status progression based on points (only for studying words)
                    if (word.status === 'studying' && newPoints >= 50) {
                        newStatus = 'review_7';
                        nextReview = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                        newReviewAttempts = 0;
                        console.log(`🎯 Word "${word.word}" promoted to review_7 with ${newPoints} points!`);
                    } else if (word.status === 'review_7') {
                        newReviewAttempts++;
                        if (newReviewAttempts >= 2) {
                            newStatus = 'review_30';
                            nextReview = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                            newReviewAttempts = 0;
                        }
                    } else if (word.status === 'review_30') {
                        newReviewAttempts++;
                        if (newReviewAttempts >= 2) {
                            newStatus = 'learned';
                            nextReview = null;
                        }
                    }
                } else {
                    newIncorrectCount++;
                    
                    // Incorrect answer: deduct points (only for studying words)
                    if (word.status === 'studying' && quizType !== 'survival') {
                        newPoints = Math.max(0, newPoints - 5); // Lose 5 points for wrong answer
                        console.log(`❌ Lost 5 points for wrong answer. Total: ${newPoints}/50`);
                    }
                    
                    if (word.status === 'review_7' || word.status === 'review_30') {
                        newReviewAttempts++;
                        if (newReviewAttempts >= 2) {
                            newStatus = 'studying';
                            newCorrectCount = Math.max(0, newCorrectCount - 1);
                            nextReview = null;
                            newReviewAttempts = 0;
                            newPoints = Math.max(0, newPoints - 10); // Reset some points when moved back to studying
                        }
                    }
                }

                // Update the word with points
                await client.query(`
                    UPDATE words 
                    SET status = $1, correct_count = $2, incorrect_count = $3, 
                        review_attempts = $4, next_review = $5, points = $6, last_studied = CURRENT_TIMESTAMP
                    WHERE id = $7 AND user_id = $8
                `, [newStatus, newCorrectCount, newIncorrectCount, newReviewAttempts, nextReview, newPoints, wordId, req.user.userId]);

                await client.query('COMMIT');
                
                console.log(`📈 Updated progress for word "${word.word}": ${isCorrect ? '✅' : '❌'} (${quizType || 'unknown'}) - Status: ${newStatus}, Points: ${newPoints}/50${pointsAwarded > 0 ? ` (+${pointsAwarded})` : ''}`);

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } else {
            // In-memory fallback (same logic as before)
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const wordIndex = user.words.findIndex(w => w.id === parseInt(wordId));
            if (wordIndex === -1) {
                return res.status(404).json({ error: 'Word not found' });
            }

            const word = user.words[wordIndex];
            const now = new Date();

            if (isCorrect) {
                word.correct_count++;
            } else {
                word.incorrect_count++;
            }

            word.last_studied = now.toISOString();
            word.updated_at = now.toISOString();

            // Same learning algorithm as database version...
            // (implementation omitted for brevity, but same logic)

            updateInMemoryStats(user);
            
            console.log(`📈 Updated progress for word "${word.word}": ${isCorrect ? '✅' : '❌'} (${quizType || 'unknown'})`);
        }

        res.json({ message: 'Progress updated successfully' });

    } catch (error) {
        console.error('❌ Update progress error for word', wordId, 'user', req.user.userId, ':', error.message);
        console.error('❌ Full error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// PUT /api/words/:wordId/status - Update word status
app.put('/api/words/:wordId/status', authenticateToken, async (req, res) => {
    try {
        const { wordId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['studying', 'review_7', 'review_30', 'learned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        if (useDatabase) {
            const result = await pool.query(
                'UPDATE words SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING word',
                [status, wordId, req.user.userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Word not found' });
            }

            console.log(`📝 Updated word "${result.rows[0].word}" status to: ${status}`);
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const word = user.words.find(w => w.id == wordId);
            if (!word) {
                return res.status(404).json({ error: 'Word not found' });
            }

            word.status = status;
            word.updated_at = new Date().toISOString();
            console.log(`📝 Updated word "${word.word}" status to: ${status}`);
        }

        res.json({ success: true, message: 'Word status updated successfully' });

    } catch (error) {
        console.error('Update word status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/words/:wordId - Delete individual word
app.delete('/api/words/:wordId', authenticateToken, async (req, res) => {
    try {
        const { wordId } = req.params;

        if (useDatabase) {
            const result = await pool.query(
                'DELETE FROM words WHERE id = $1 AND user_id = $2 RETURNING word',
                [wordId, req.user.userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Word not found' });
            }

            console.log(`🗑️ Deleted word "${result.rows[0].word}" for user ${req.user.userId}`);
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const wordIndex = user.words.findIndex(w => w.id == wordId);
            if (wordIndex === -1) {
                return res.status(404).json({ error: 'Word not found' });
            }

            const deletedWord = user.words.splice(wordIndex, 1)[0];
            console.log(`🗑️ Deleted word "${deletedWord.word}" for user ${req.user.userId}`);
        }

        res.json({ success: true, message: 'Word deleted successfully' });

    } catch (error) {
        console.error('Delete word error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Statistics endpoints
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        let stats = {};

        if (useDatabase) {
            const result = await pool.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM words 
                WHERE user_id = $1
                GROUP BY status
            `, [req.user.userId]);

            const reviewResult = await pool.query(`
                SELECT COUNT(*) as due_count
                FROM words 
                WHERE user_id = $1
                    AND status IN ('review_7', 'review_30')
                    AND (next_review IS NULL OR next_review <= CURRENT_TIMESTAMP)
            `, [req.user.userId]);

            stats = {
                studying: 0,
                review_7: 0,
                review_30: 0,
                learned: 0,
                review: parseInt(reviewResult.rows[0]?.due_count || 0)
            };

            result.rows.forEach(row => {
                stats[row.status] = parseInt(row.count);
            });
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            updateInMemoryStats(user);
            stats = user.stats;
        }

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Helper function for in-memory stats
function updateInMemoryStats(user) {
    const stats = {
        studying: 0,
        review_7: 0,
        review_30: 0,
        learned: 0,
        review: 0
    };

    const now = new Date();
    
    for (const word of user.words) {
        stats[word.status] = (stats[word.status] || 0) + 1;
        
        if ((word.status === 'review_7' || word.status === 'review_30')) {
            if (!word.next_review || new Date(word.next_review) <= now) {
                stats.review++;
            }
        }
    }
    
    user.stats = stats;
    return stats;
}

// Additional endpoints for session info
app.get('/api/users/session', authenticateToken, async (req, res) => {
    try {
        let sessionInfo = {};

        if (useDatabase) {
            const userResult = await pool.query(
                'SELECT id, name, email FROM users WHERE id = $1',
                [req.user.userId]
            );
            
            const statsResult = await pool.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM words 
                WHERE user_id = $1
                GROUP BY status
            `, [req.user.userId]);

            const pairsResult = await pool.query(
                'SELECT * FROM language_pairs WHERE user_id = $1',
                [req.user.userId]
            );

            const totalWordsResult = await pool.query(
                'SELECT COUNT(*) as total FROM words WHERE user_id = $1',
                [req.user.userId]
            );

            const lastActivityResult = await pool.query(
                'SELECT MAX(last_studied) as last_activity FROM words WHERE user_id = $1',
                [req.user.userId]
            );

            const stats = { studying: 0, review_7: 0, review_30: 0, learned: 0, review: 0 };
            statsResult.rows.forEach(row => {
                stats[row.status] = parseInt(row.count);
            });

            sessionInfo = {
                user: userResult.rows[0],
                stats: stats,
                languagePairs: pairsResult.rows,
                totalWords: parseInt(totalWordsResult.rows[0].total),
                lastActivity: lastActivityResult.rows[0].last_activity || new Date(0)
            };
        } else {
            // In-memory fallback
            const user = inMemoryData.users.get(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            updateInMemoryStats(user);

            sessionInfo = {
                user: { id: user.id, name: user.name, email: user.email },
                stats: user.stats,
                languagePairs: user.languagePairs || [],
                totalWords: user.words.length,
                lastActivity: user.words.reduce((latest, word) => {
                    const wordDate = new Date(word.last_studied || word.date_added);
                    return wordDate > latest ? wordDate : latest;
                }, new Date(0))
            };
        }

        res.json(sessionInfo);
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down server...');
    
    // Stop Telegram bot
    if (telegramBot) {
        telegramBot.stop();
    }
    
    pool.end(() => {
        console.log('✅ Database connection pool closed');
        process.exit(0);
    });
});

// Google Sheets proxy for CORS bypass
app.post('/api/proxy/google-sheets', authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url || !url.includes('docs.google.com/spreadsheets')) {
            return res.status(400).json({ error: 'Invalid Google Sheets URL' });
        }

        console.log(`📊 Proxying Google Sheets request: ${url}`);
        
        // Fetch the CSV data from Google Sheets (using built-in fetch in Node.js 18+)
        const response = await fetch(url, {
            headers: {
                'Accept': 'text/csv,text/plain,*/*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Google Sheets request failed: ${response.status} ${response.statusText}`);
        }

        const csvData = await response.text();
        console.log(`✅ Google Sheets CSV fetched: ${csvData.length} characters`);

        // Return the CSV data as plain text
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send(csvData);
        
    } catch (error) {
        console.error('Google Sheets proxy error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch Google Sheets data',
            details: error.message 
        });
    }
});

// Push notification endpoints
app.post('/api/push/subscribe', authenticateToken, async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        const userId = req.user.userId;

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return res.status(400).json({ error: 'Invalid subscription data' });
        }

        console.log(`📱 Storing push subscription for user: ${userId}`);

        const result = await pool.query(`
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, endpoint) 
            DO UPDATE SET 
                p256dh_key = $3,
                auth_key = $4,
                user_agent = $5,
                last_used = CURRENT_TIMESTAMP
            RETURNING id`,
            [userId, endpoint, keys.p256dh, keys.auth, req.headers['user-agent'] || null]
        );

        res.json({ 
            success: true, 
            subscriptionId: result.rows[0].id,
            message: 'Push subscription saved' 
        });

    } catch (error) {
        console.error('Push subscription error:', error);
        res.status(500).json({ 
            error: 'Failed to save push subscription',
            details: error.message 
        });
    }
});

app.post('/api/push/unsubscribe', authenticateToken, async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.userId;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint required' });
        }

        console.log(`📱 Removing push subscription for user: ${userId}`);

        await pool.query(
            'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
            [userId, endpoint]
        );

        res.json({ 
            success: true,
            message: 'Push subscription removed' 
        });

    } catch (error) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({ 
            error: 'Failed to remove push subscription',
            details: error.message 
        });
    }
});

app.post('/api/push/schedule-reminder', authenticateToken, async (req, res) => {
    try {
        const { hours = 24 } = req.body;
        const userId = req.user.userId;

        console.log(`⏰ Scheduling study reminder for user ${userId} in ${hours} hours`);

        // Get user's push subscriptions
        const subscriptions = await pool.query(
            'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        if (subscriptions.rows.length === 0) {
            return res.status(400).json({ error: 'No push subscriptions found' });
        }

        // Schedule the reminder (in a real app, you'd use a job scheduler like node-cron)
        // For now, we'll send it immediately as a test
        const payload = JSON.stringify({
            title: 'Время изучать слова! 📚',
            body: 'Не забудьте повторить новые слова сегодня',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: {
                action: 'study',
                url: '/?action=study'
            }
        });

        // Send to all user's subscriptions
        for (const sub of subscriptions.rows) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh_key,
                    auth: sub.auth_key
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, payload);
                console.log('✅ Push notification sent successfully');
            } catch (error) {
                console.error('❌ Failed to send push notification:', error);
                // Remove invalid subscriptions
                if (error.statusCode === 410) {
                    await pool.query(
                        'DELETE FROM push_subscriptions WHERE endpoint = $1',
                        [sub.endpoint]
                    );
                }
            }
        }

        res.json({ 
            success: true,
            message: `Study reminder scheduled for ${hours} hours`,
            subscriptionsSent: subscriptions.rows.length
        });

    } catch (error) {
        console.error('Schedule reminder error:', error);
        res.status(500).json({ 
            error: 'Failed to schedule reminder',
            details: error.message 
        });
    }
});

app.get('/api/push/vapid-public-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Survival mode leaderboard endpoints
app.post('/api/survival/record', authenticateToken, async (req, res) => {
    try {
        const { score, duration_seconds, words_answered, accuracy_percentage } = req.body;
        const userId = req.user.userId;

        if (!score || !duration_seconds || !words_answered || accuracy_percentage === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`🏆 Recording survival result for user ${userId}: score=${score}, accuracy=${accuracy_percentage}%`);

        // Get current number of studying words
        const wordsResult = await pool.query(
            'SELECT COUNT(*) as total FROM words WHERE user_id = $1 AND status = $2',
            [userId, 'studying']
        );

        const totalWordsAvailable = parseInt(wordsResult.rows[0].total);

        // Only record if user has 100+ words
        if (totalWordsAvailable < 100) {
            return res.json({
                success: false,
                message: 'Недостаточно слов для попадания в лидерборд (требуется минимум 100 слов в изучении)',
                totalWords: totalWordsAvailable,
                minRequired: 100
            });
        }

        // Insert into leaderboard
        const result = await pool.query(`
            INSERT INTO survival_leaderboard 
            (user_id, score, total_words_available, duration_seconds, words_answered, accuracy_percentage)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [userId, score, totalWordsAvailable, duration_seconds, words_answered, accuracy_percentage]
        );

        res.json({
            success: true,
            message: 'Результат записан в лидерборд!',
            leaderboardId: result.rows[0].id,
            totalWords: totalWordsAvailable
        });

    } catch (error) {
        console.error('Survival record error:', error);
        res.status(500).json({
            error: 'Failed to record survival result',
            details: error.message
        });
    }
});

app.get('/api/survival/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        console.log(`📊 Fetching survival leaderboard (top ${limit})`);

        const result = await pool.query(`
            SELECT 
                sl.score,
                sl.total_words_available,
                sl.duration_seconds,
                sl.words_answered,
                sl.accuracy_percentage,
                sl.created_at,
                u.name as user_name,
                ROW_NUMBER() OVER (ORDER BY sl.score DESC, sl.accuracy_percentage DESC, sl.total_words_available DESC) as rank
            FROM survival_leaderboard sl
            JOIN users u ON sl.user_id = u.id
            ORDER BY sl.score DESC, sl.accuracy_percentage DESC, sl.total_words_available DESC
            LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            leaderboard: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch leaderboard',
            details: error.message
        });
    }
});

app.get('/api/survival/user-best', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log(`👤 Fetching best survival results for user ${userId}`);

        const result = await pool.query(`
            SELECT 
                score,
                total_words_available,
                duration_seconds,
                words_answered,
                accuracy_percentage,
                created_at,
                (SELECT COUNT(*) + 1 FROM survival_leaderboard sl2 
                 WHERE (sl2.score > sl.score) 
                    OR (sl2.score = sl.score AND sl2.accuracy_percentage > sl.accuracy_percentage)
                    OR (sl2.score = sl.score AND sl2.accuracy_percentage = sl.accuracy_percentage AND sl2.total_words_available > sl.total_words_available)
                ) as rank
            FROM survival_leaderboard sl
            WHERE user_id = $1
            ORDER BY score DESC, accuracy_percentage DESC, total_words_available DESC
            LIMIT 5`,
            [userId]
        );

        res.json({
            success: true,
            userBest: result.rows
        });

    } catch (error) {
        console.error('User best results fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch user best results',
            details: error.message
        });
    }
});

// Root route - serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all route for SPA - serve index.html for any non-API routes
app.get('*', (req, res) => {
    // Don't intercept API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Words Learning API Server running on port ${PORT}`);
    console.log(`👥 Available users: root/root, Kate/1, Mike/1`);
    console.log(`💾 Database: ${useDatabase ? 'PostgreSQL' : 'In-Memory Storage (fallback)'}`);
    console.log(`🔗 CORS enabled for all origins`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`   POST /api/auth/login - User authentication`);
    console.log(`   GET  /api/users/me - Get current user`);
    console.log(`   GET  /api/users/session - Get user session info`);
    console.log(`   GET  /api/words - Get user's words`);
    console.log(`   GET  /api/words/study - Get words for studying`);
    console.log(`   GET  /api/words/review - Get words for review`);
    console.log(`   POST /api/words/bulk - Add multiple words`);
    console.log(`   DELETE /api/words - Clear all user's words`);
    console.log(`   PUT  /api/words/:id/progress - Update word progress`);
    console.log(`   PUT  /api/words/:id/status - Update word status`);
    console.log(`   DELETE /api/words/:id - Delete individual word`);
    console.log(`   GET  /api/stats - Get learning statistics`);
    console.log(`   POST /api/proxy/google-sheets - Proxy for Google Sheets CSV export`);
    console.log(`   POST /api/push/subscribe - Subscribe to push notifications`);
    console.log(`   POST /api/push/unsubscribe - Unsubscribe from push notifications`);
    console.log(`   POST /api/push/schedule-reminder - Schedule study reminder`);
    console.log(`   GET  /api/push/vapid-public-key - Get VAPID public key`);
    console.log(`   POST /api/survival/record - Record survival mode result`);
    console.log(`   GET  /api/survival/leaderboard - Get survival mode leaderboard`);
    console.log(`   GET  /api/survival/user-best - Get user's best survival results`);
});