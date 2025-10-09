const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload setup
const upload = multer({ dest: 'uploads/' });

// Initialize database
async function initDatabase() {
    try {
        // Create users table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                provider VARCHAR(50) DEFAULT 'local',
                picture TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create language_pairs table
        await db.query(`
            CREATE TABLE IF NOT EXISTS language_pairs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                from_lang VARCHAR(50) NOT NULL,
                to_lang VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT false,
                lesson_size INTEGER DEFAULT 10,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Modify words table to include user and language pair reference
        await db.query(`
            CREATE TABLE IF NOT EXISTS words (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                language_pair_id INTEGER REFERENCES language_pairs(id) ON DELETE CASCADE,
                word VARCHAR(255) NOT NULL,
                translation VARCHAR(255) NOT NULL,
                example TEXT,
                exampleTranslation TEXT,
                status VARCHAR(50) DEFAULT 'studying',
                correctCount INTEGER DEFAULT 0,
                totalCount INTEGER DEFAULT 0,
                lastReviewDate TIMESTAMP,
                nextReviewDate TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('PostgreSQL database initialized');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Helper function for simple password hashing (same as client-side)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// API Routes

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
        }

        // Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        // Create user
        const hashedPassword = hashPassword(password);
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, createdat',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];

        // Create default language pair
        const langPairResult = await db.query(
            'INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user.id, 'Немецкий → Русский', 'de', 'ru', true]
        );

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdat
            },
            languagePair: langPairResult.rows[0]
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }

        const user = result.rows[0];
        const hashedPassword = hashPassword(password);

        if (user.password !== hashedPassword) {
            return res.status(401).json({ error: 'Неверный пароль' });
        }

        // Get user's language pairs
        const langPairsResult = await db.query(
            'SELECT * FROM language_pairs WHERE user_id = $1 ORDER BY is_active DESC, createdat ASC',
            [user.id]
        );

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                picture: user.picture,
                createdAt: user.createdat
            },
            languagePairs: langPairsResult.rows
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Language pairs endpoints
app.get('/api/users/:userId/language-pairs', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query(
            'SELECT * FROM language_pairs WHERE user_id = $1 ORDER BY is_active DESC, createdat ASC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/:userId/language-pairs', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, from_lang, to_lang } = req.body;

        const result = await db.query(
            'INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, name, from_lang, to_lang, false]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:userId/language-pairs/:pairId/activate', async (req, res) => {
    try {
        const { userId, pairId } = req.params;

        // Deactivate all pairs for this user
        await db.query('UPDATE language_pairs SET is_active = false WHERE user_id = $1', [userId]);

        // Activate the selected pair
        const result = await db.query(
            'UPDATE language_pairs SET is_active = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [pairId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Language pair not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:userId/language-pairs/:pairId', async (req, res) => {
    try {
        const { userId, pairId } = req.params;

        // Check if this is the last language pair
        const countResult = await db.query(
            'SELECT COUNT(*) FROM language_pairs WHERE user_id = $1',
            [userId]
        );

        if (parseInt(countResult.rows[0].count) <= 1) {
            return res.status(400).json({ error: 'Нельзя удалить последнюю языковую пару' });
        }

        await db.query('DELETE FROM language_pairs WHERE id = $1 AND user_id = $2', [pairId, userId]);
        res.json({ message: 'Language pair deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:userId/lesson-size', async (req, res) => {
    try {
        const { userId } = req.params;
        const { lessonSize } = req.body;

        // Update lesson size for the active language pair
        const result = await db.query(
            'UPDATE language_pairs SET lesson_size = $1 WHERE user_id = $2 AND is_active = true RETURNING *',
            [lessonSize, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Active language pair not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all words with pagination (filtered by user and language pair)
app.get('/api/words', async (req, res) => {
    try {
        const { page = 1, limit = 50, status, userId, languagePairId } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM words WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        // Filter by user and language pair
        if (userId && languagePairId) {
            query += ` AND user_id = $${paramIndex} AND language_pair_id = $${paramIndex + 1}`;
            params.push(parseInt(userId), parseInt(languagePairId));
            paramIndex += 2;
        }

        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY createdAt DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get word counts by status (filtered by user and language pair)
app.get('/api/words/counts', async (req, res) => {
    try {
        const { userId, languagePairId } = req.query;

        let query = `
            SELECT
                status,
                COUNT(*) as count
            FROM words
            WHERE 1=1
        `;
        let params = [];

        if (userId && languagePairId) {
            query += ` AND user_id = $1 AND language_pair_id = $2`;
            params.push(parseInt(userId), parseInt(languagePairId));
        }

        query += ` GROUP BY status`;

        const result = await db.query(query, params);

        const counts = {
            studying: 0,
            review: 0,
            review7: 0,
            review30: 0,
            learned: 0
        };

        result.rows.forEach(row => {
            if (row.status === 'studying') {
                counts.studying = parseInt(row.count);
            } else if (row.status === 'review_7') {
                counts.review7 = parseInt(row.count);
                counts.review += parseInt(row.count);
            } else if (row.status === 'review_30') {
                counts.review30 = parseInt(row.count);
                counts.review += parseInt(row.count);
            } else if (row.status === 'learned') {
                counts.learned = parseInt(row.count);
            }
        });

        res.json(counts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get random words for quiz (filtered by user and language pair)
app.get('/api/words/random/:status/:count', async (req, res) => {
    try {
        const { status, count } = req.params;
        const { userId, languagePairId } = req.query;

        let query;
        let params;

        if (status === 'studying') {
            query = 'SELECT * FROM words WHERE status = $1 AND user_id = $2 AND language_pair_id = $3 ORDER BY RANDOM() LIMIT $4';
            params = ['studying', parseInt(userId), parseInt(languagePairId), parseInt(count)];
        } else if (status === 'review') {
            query = 'SELECT * FROM words WHERE status IN ($1, $2) AND user_id = $3 AND language_pair_id = $4 ORDER BY RANDOM() LIMIT $5';
            params = ['review_7', 'review_30', parseInt(userId), parseInt(languagePairId), parseInt(count)];
        } else {
            query = 'SELECT * FROM words WHERE status = $1 AND user_id = $2 AND language_pair_id = $3 ORDER BY RANDOM() LIMIT $4';
            params = [status, parseInt(userId), parseInt(languagePairId), parseInt(count)];
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new word
app.post('/api/words', async (req, res) => {
    try {
        const { word, translation, example, exampleTranslation, userId, languagePairId } = req.body;

        if (!word || !translation) {
            res.status(400).json({ error: 'Word and translation are required' });
            return;
        }

        if (!userId || !languagePairId) {
            res.status(400).json({ error: 'User and language pair are required' });
            return;
        }

        const query = `INSERT INTO words (word, translation, example, exampleTranslation, user_id, language_pair_id)
                       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;

        const result = await db.query(query, [word, translation, example || '', exampleTranslation || '', userId, languagePairId]);
        res.json({ id: result.rows[0].id, message: 'Word added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add multiple words
app.post('/api/words/bulk', async (req, res) => {
    try {
        const words = req.body;

        if (!Array.isArray(words) || words.length === 0) {
            res.status(400).json({ error: 'Words array is required' });
            return;
        }

        // Validate that all words have userId and languagePairId
        const hasContext = words.every(w => w.userId && w.languagePairId);
        if (!hasContext) {
            res.status(400).json({ error: 'All words must have userId and languagePairId' });
            return;
        }

        // Begin transaction
        await db.query('BEGIN');

        try {
            for (const wordObj of words) {
                await db.query(
                    `INSERT INTO words (word, translation, example, exampleTranslation, user_id, language_pair_id)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        wordObj.word,
                        wordObj.translation,
                        wordObj.example || '',
                        wordObj.exampleTranslation || '',
                        wordObj.userId,
                        wordObj.languagePairId
                    ]
                );
            }

            await db.query('COMMIT');
            res.json({ message: `${words.length} words added successfully` });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update word progress
app.put('/api/words/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;
        const { correct, questionType } = req.body;
        
        const wordResult = await db.query('SELECT * FROM words WHERE id = $1', [id]);
        
        if (wordResult.rows.length === 0) {
            res.status(404).json({ error: 'Word not found' });
            return;
        }
        
        const word = wordResult.rows[0];
        const newTotalCount = word.totalcount + 1;
        const newCorrectCount = word.correctcount + (correct ? 1 : 0);
        
        // Determine new status based on progress
        let newStatus = word.status;
        const accuracy = newCorrectCount / newTotalCount;
        
        if (word.status === 'studying' && newTotalCount >= 3 && accuracy >= 0.8) {
            newStatus = 'review_7';
        } else if (word.status === 'review_7' && correct) {
            newStatus = 'review_30';
        } else if (word.status === 'review_30' && correct) {
            newStatus = 'learned';
        } else if (!correct && (word.status === 'review_7' || word.status === 'review_30')) {
            newStatus = 'studying';
        }
        
        const updateQuery = `UPDATE words 
                            SET correctCount = $1, totalCount = $2, status = $3, 
                                lastReviewDate = CURRENT_TIMESTAMP, 
                                updatedAt = CURRENT_TIMESTAMP
                            WHERE id = $4`;
        
        await db.query(updateQuery, [newCorrectCount, newTotalCount, newStatus, id]);
        res.json({ message: 'Progress updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export words as CSV
app.get('/api/words/export/:status?', async (req, res) => {
    try {
        const { status } = req.params;
        let query = 'SELECT word, translation, example, exampleTranslation, status FROM words';
        let params = [];
        
        if (status && status !== 'all') {
            if (status === 'review') {
                query += ' WHERE status IN ($1, $2)';
                params = ['review_7', 'review_30'];
            } else {
                query += ' WHERE status = $1';
                params = [status];
            }
        }
        
        query += ' ORDER BY createdAt DESC';
        
        const result = await db.query(query, params);
        
        // Convert to CSV
        const headers = 'Word,Translation,Example,Example Translation,Status\n';
        const csvData = result.rows.map(row => 
            `"${row.word}","${row.translation}","${row.example}","${row.exampletranslation}","${row.status}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="words_${status || 'all'}.csv"`);
        res.send(headers + csvData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Import words from CSV
app.post('/api/words/import', upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    
    const words = [];
    
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            // Support both English and Russian headers
            const word = row.Word || row.Слово || row.word;
            const translation = row.Translation || row.Перевод || row.translation;
            const example = row.Example || row.Пример || row.example || '';
            const exampleTranslation = row['Example Translation'] || row['Перевод примера'] || row.exampleTranslation || '';
            
            if (word && translation) {
                words.push({
                    word: word.trim(),
                    translation: translation.trim(),
                    example: example.trim(),
                    exampleTranslation: exampleTranslation.trim()
                });
            }
        })
        .on('end', async () => {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            if (words.length === 0) {
                res.status(400).json({ error: 'No valid words found in CSV' });
                return;
            }
            
            try {
                // Begin transaction
                await db.query('BEGIN');
                
                for (const wordObj of words) {
                    await db.query(
                        `INSERT INTO words (word, translation, example, exampleTranslation)
                         VALUES ($1, $2, $3, $4)`,
                        [
                            wordObj.word,
                            wordObj.translation,
                            wordObj.example,
                            wordObj.exampleTranslation
                        ]
                    );
                }
                
                await db.query('COMMIT');
                res.json({ message: `${words.length} words imported successfully` });
            } catch (err) {
                await db.query('ROLLBACK');
                res.status(500).json({ error: err.message });
            }
        })
        .on('error', (err) => {
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Error reading CSV file' });
        });
});

// Google Sheets Import Proxy (to avoid CORS)
app.post('/api/import/google-sheets', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Convert Google Sheets URL to CSV export URL
        let csvUrl = url;
        if (url.includes('docs.google.com/spreadsheets')) {
            const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            if (match) {
                const spreadsheetId = match[1];
                csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
            }
        }

        // Fetch the CSV data from Google Sheets
        const https = require('https');
        const { Readable } = require('stream');

        const fetchData = () => {
            return new Promise((resolve, reject) => {
                https.get(csvUrl, (response) => {
                    let data = '';
                    response.on('data', (chunk) => data += chunk);
                    response.on('end', () => resolve(data));
                }).on('error', reject);
            });
        };

        const csvData = await fetchData();

        // Parse CSV data using csv-parser
        const words = [];
        const stream = Readable.from([csvData]);

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    // Support both English and Russian headers, and any case variations
                    const word = row.Word || row.word || row.Слово || row.слово;
                    const translation = row.Translation || row.translation || row.Перевод || row.перевод;
                    const example = row.Example || row.example || row.Пример || row.пример || '';
                    const exampleTranslation = row['Example Translation'] || row['example translation'] ||
                                              row.exampleTranslation || row['Перевод примера'] ||
                                              row['перевод примера'] || '';

                    if (word && translation) {
                        words.push({
                            word: word.trim(),
                            translation: translation.trim(),
                            example: example ? example.trim() : '',
                            exampleTranslation: exampleTranslation ? exampleTranslation.trim() : ''
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Parsed ${words.length} words from Google Sheets`);
        res.json({ words });
    } catch (error) {
        console.error('Google Sheets import error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Migration endpoint - migrate user from localStorage to database
app.post('/api/migrate/user', async (req, res) => {
    try {
        const { name, email, password, languagePairs } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password required' });
        }

        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists in database' });
        }

        // Create user with the password hash from localStorage
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, createdat',
            [name, email, password]
        );

        const user = result.rows[0];

        // Migrate language pairs
        const migratedPairs = [];
        if (languagePairs && languagePairs.length > 0) {
            for (const pair of languagePairs) {
                const pairResult = await db.query(
                    'INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active, lesson_size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [
                        user.id,
                        pair.name || 'Немецкий → Русский',
                        pair.fromLanguage || 'de',
                        pair.toLanguage || 'ru',
                        pair.active || false,
                        pair.lessonSize || 10
                    ]
                );
                migratedPairs.push(pairResult.rows[0]);
            }
        } else {
            // Create default language pair
            const defaultPair = await db.query(
                'INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [user.id, 'Немецкий → Русский', 'de', 'ru', true]
            );
            migratedPairs.push(defaultPair.rows[0]);
        }

        res.json({
            message: 'User migrated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdat
            },
            languagePairs: migratedPairs
        });
    } catch (err) {
        console.error('Migration error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log(`Words Learning Server running on port ${PORT}`);
        console.log(`Open http://localhost:${PORT} in your browser`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});