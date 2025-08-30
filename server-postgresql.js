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
        await db.query(`
            CREATE TABLE IF NOT EXISTS words (
                id SERIAL PRIMARY KEY,
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

// API Routes

// Get all words with pagination
app.get('/api/words', async (req, res) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM words';
        let params = [];
        let paramIndex = 1;
        
        if (status) {
            query += ` WHERE status = $${paramIndex}`;
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

// Get word counts by status
app.get('/api/words/counts', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM words 
            GROUP BY status
        `);
        
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

// Get random words for quiz
app.get('/api/words/random/:status/:count', async (req, res) => {
    try {
        const { status, count } = req.params;
        let query;
        let params = [parseInt(count)];
        
        if (status === 'studying') {
            query = 'SELECT * FROM words WHERE status = $2 ORDER BY RANDOM() LIMIT $1';
            params = [parseInt(count), 'studying'];
        } else if (status === 'review') {
            query = 'SELECT * FROM words WHERE status IN ($2, $3) ORDER BY RANDOM() LIMIT $1';
            params = [parseInt(count), 'review_7', 'review_30'];
        } else {
            query = 'SELECT * FROM words WHERE status = $2 ORDER BY RANDOM() LIMIT $1';
            params = [parseInt(count), status];
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
        const { word, translation, example, exampleTranslation } = req.body;
        
        if (!word || !translation) {
            res.status(400).json({ error: 'Word and translation are required' });
            return;
        }
        
        const query = `INSERT INTO words (word, translation, example, exampleTranslation)
                       VALUES ($1, $2, $3, $4) RETURNING id`;
        
        const result = await db.query(query, [word, translation, example || '', exampleTranslation || '']);
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
        
        // Begin transaction
        await db.query('BEGIN');
        
        try {
            for (const wordObj of words) {
                await db.query(
                    `INSERT INTO words (word, translation, example, exampleTranslation)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        wordObj.word,
                        wordObj.translation,
                        wordObj.example || '',
                        wordObj.exampleTranslation || ''
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