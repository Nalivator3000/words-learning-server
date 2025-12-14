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
app.get('/api/words/counts', (req, res) => {
    const queries = {
        studying: 'SELECT COUNT(*) as count FROM words WHERE status = "studying"',
        review: 'SELECT COUNT(*) as count FROM words WHERE status IN ("review_7", "review_30")',
        review7: 'SELECT COUNT(*) as count FROM words WHERE status = "review_7"',
        review30: 'SELECT COUNT(*) as count FROM words WHERE status = "review_30"',
        learned: 'SELECT COUNT(*) as count FROM words WHERE status = "learned"'
    };
    
    const counts = {};
    const queryKeys = Object.keys(queries);
    let completed = 0;
    
    queryKeys.forEach(key => {
        db.get(queries[key], (err, row) => {
            if (err) {
                console.error(err);
                counts[key] = 0;
            } else {
                counts[key] = row.count;
            }
            
            completed++;
            if (completed === queryKeys.length) {
                res.json(counts);
            }
        });
    });
});

// Get random words for quiz
app.get('/api/words/random/:status/:count', (req, res) => {
    const { status, count } = req.params;
    let query;
    let params = [parseInt(count)];
    
    if (status === 'studying') {
        query = 'SELECT * FROM words WHERE status = "studying" ORDER BY RANDOM() LIMIT ?';
    } else if (status === 'review') {
        query = 'SELECT * FROM words WHERE status IN ("review_7", "review_30") ORDER BY RANDOM() LIMIT ?';
    } else {
        query = 'SELECT * FROM words WHERE status = ? ORDER BY RANDOM() LIMIT ?';
        params = [status, parseInt(count)];
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new word
app.post('/api/words', (req, res) => {
    const { word, translation, example, exampleTranslation } = req.body;
    
    if (!word || !translation) {
        res.status(400).json({ error: 'Word and translation are required' });
        return;
    }
    
    const query = `INSERT INTO words (word, translation, example, exampleTranslation)
                   VALUES (?, ?, ?, ?)`;
    
    db.run(query, [word, translation, example || '', exampleTranslation || ''], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Word added successfully' });
    });
});

// Add multiple words
app.post('/api/words/bulk', (req, res) => {
    const words = req.body;
    
    if (!Array.isArray(words) || words.length === 0) {
        res.status(400).json({ error: 'Words array is required' });
        return;
    }
    
    const stmt = db.prepare(`INSERT INTO words (word, translation, example, exampleTranslation)
                             VALUES (?, ?, ?, ?)`);
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        words.forEach(wordObj => {
            stmt.run([
                wordObj.word,
                wordObj.translation,
                wordObj.example || '',
                wordObj.exampleTranslation || ''
            ]);
        });
        
        db.run('COMMIT', (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ message: `${words.length} words added successfully` });
            }
        });
    });
    
    stmt.finalize();
});

// Update word progress
app.put('/api/words/:id/progress', (req, res) => {
    const { id } = req.params;
    const { correct, questionType } = req.body;
    
    db.get('SELECT * FROM words WHERE id = ?', [id], (err, word) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!word) {
            res.status(404).json({ error: 'Word not found' });
            return;
        }
        
        const newTotalCount = word.totalCount + 1;
        const newCorrectCount = word.correctCount + (correct ? 1 : 0);
        
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
                            SET correctCount = ?, totalCount = ?, status = ?, 
                                lastReviewDate = datetime('now'), 
                                updatedAt = datetime('now')
                            WHERE id = ?`;
        
        db.run(updateQuery, [newCorrectCount, newTotalCount, newStatus, id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Progress updated successfully' });
        });
    });
});

// Export words as CSV
app.get('/api/words/export/:status?', (req, res) => {
    const { status } = req.params;
    let query = 'SELECT word, translation, example, exampleTranslation, status FROM words';
    let params = [];
    
    if (status && status !== 'all') {
        if (status === 'review') {
            query += ' WHERE status IN ("review_7", "review_30")';
        } else {
            query += ' WHERE status = ?';
            params.push(status);
        }
    }
    
    query += ' ORDER BY createdAt DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Convert to CSV
        const headers = 'Word,Translation,Example,Example Translation,Status\n';
        const csvData = rows.map(row => 
            `"${row.word}","${row.translation}","${row.example}","${row.exampleTranslation}","${row.status}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="words_${status || 'all'}.csv"`);
        res.send(headers + csvData);
    });
});

// Import words from CSV
app.post('/api/words/import', upload.single('csvFile'), (req, res) => {
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
        .on('end', () => {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            if (words.length === 0) {
                res.status(400).json({ error: 'No valid words found in CSV' });
                return;
            }
            
            // Insert words into database
            const stmt = db.prepare(`INSERT INTO words (word, translation, example, exampleTranslation)
                                     VALUES (?, ?, ?, ?)`);
            
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                words.forEach(wordObj => {
                    stmt.run([
                        wordObj.word,
                        wordObj.translation,
                        wordObj.example,
                        wordObj.exampleTranslation
                    ]);
                });
                
                db.run('COMMIT', (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({ message: `${words.length} words imported successfully` });
                    }
                });
            });
            
            stmt.finalize();
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
initDatabase();

app.listen(PORT, () => {
    console.log(`Words Learning Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});