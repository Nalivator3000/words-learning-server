const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Data file path
const DATA_FILE = path.join(__dirname, 'words-data.json');

// Initialize data file
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = { words: [], nextId: 1 };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('Data file created');
    }
}

// Helper functions
function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Check and update words that are ready for review
function checkAndUpdateReviewWords(data) {
    const now = new Date();
    let updated = false;
    
    data.words.forEach(word => {
        if (word.status === 'learned_waiting' && word.reviewAfterDate) {
            const reviewDate = new Date(word.reviewAfterDate);
            if (now >= reviewDate) {
                word.status = 'review_7';
                delete word.reviewAfterDate;
                updated = true;
            }
        }
    });
    
    if (updated) {
        writeData(data);
    }
    
    return data;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload setup
const upload = multer({ dest: 'uploads/' });

// API Routes

// Get word counts
app.get('/api/words/counts', (req, res) => {
    try {
        let data = readData();
        data = checkAndUpdateReviewWords(data);
        const counts = {
            studying: 0,
            review: 0,
            review7: 0,
            review30: 0,
            learned: 0
        };
        
        data.words.forEach(word => {
            if (word.status === 'studying') {
                counts.studying++;
            } else if (word.status === 'review_7') {
                counts.review7++;
                counts.review++;
            } else if (word.status === 'review_30') {
                counts.review30++;
                counts.review++;
            } else if (word.status === 'learned') {
                counts.learned++;
            } else if (word.status === 'learned_waiting') {
                counts.learned++;
            }
        });
        
        res.json(counts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get random words for quiz
app.get('/api/words/random/:status/:count', (req, res) => {
    try {
        const { status, count } = req.params;
        let data = readData();
        data = checkAndUpdateReviewWords(data);
        let filteredWords;
        
        if (status === 'studying') {
            filteredWords = data.words.filter(w => w.status === 'studying');
        } else if (status === 'review') {
            filteredWords = data.words.filter(w => w.status === 'review_7' || w.status === 'review_30');
        } else {
            filteredWords = data.words.filter(w => w.status === status);
        }
        
        // Shuffle and limit
        const shuffled = filteredWords.sort(() => 0.5 - Math.random());
        const result = shuffled.slice(0, parseInt(count));
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get words by status
app.get('/api/words', (req, res) => {
    try {
        const { status, limit = 1000 } = req.query;
        let data = readData();
        data = checkAndUpdateReviewWords(data);
        let words = data.words;
        
        if (status) {
            words = words.filter(w => w.status === status);
        }
        
        res.json(words.slice(0, parseInt(limit)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add multiple words
app.post('/api/words/bulk', (req, res) => {
    try {
        const wordsArray = req.body;
        
        if (!Array.isArray(wordsArray)) {
            return res.status(400).json({ error: 'Expected array of words' });
        }
        
        const data = readData();
        
        wordsArray.forEach(wordObj => {
            const word = {
                id: data.nextId++,
                word: wordObj.word,
                translation: wordObj.translation,
                example: wordObj.example || '',
                exampleTranslation: wordObj.exampleTranslation || '',
                status: 'studying',
                correctCount: 0,
                totalCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            data.words.push(word);
        });
        
        writeData(data);
        res.json({ message: `${wordsArray.length} words added successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update word progress with new points-based system
app.put('/api/words/:id/progress', (req, res) => {
    try {
        const { id } = req.params;
        const { correct, questionType } = req.body;
        const data = readData();

        const word = data.words.find(w => w.id == id);
        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }

        // Initialize tracking fields if they don't exist
        word.totalCount = (word.totalCount || 0) + 1;
        word.correctCount = (word.correctCount || 0) + (correct ? 1 : 0);
        word.totalPoints = word.totalPoints || 0;
        word.updatedAt = new Date().toISOString();

        // Award points for correct answers based on question type
        if (correct) {
            const pointsMap = {
                'multipleChoice': 2,
                'reverseMultipleChoice': 2,
                'wordBuilding': 5,
                'typing': 10
            };

            const pointsEarned = pointsMap[questionType] || 2;
            word.totalPoints += pointsEarned;
        }

        // Update status based on points
        const now = new Date();

        if (word.status === 'studying' && word.totalPoints >= 100) {
            // Word reaches 100 points, schedule for review in 7 days
            word.status = 'learned_waiting';
            word.reviewAfterDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (word.status === 'learned_waiting') {
            // Check if 7 days have passed since the word was marked as learned_waiting
            const reviewDate = new Date(word.reviewAfterDate);
            if (now >= reviewDate) {
                word.status = 'review_7';
                delete word.reviewAfterDate;
            }
        } else if (word.status === 'review_7' && correct) {
            word.status = 'review_30';
        } else if (word.status === 'review_30' && correct) {
            word.status = 'learned';
        } else if (!correct && (word.status === 'review_7' || word.status === 'review_30')) {
            // Reset to studying and reduce points by half on wrong review answers
            word.status = 'studying';
            word.totalPoints = Math.floor(word.totalPoints / 2);
        }

        writeData(data);
        res.json({
            message: 'Progress updated successfully',
            totalPoints: word.totalPoints,
            status: word.status
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export words as CSV
app.get('/api/words/export/:status?', (req, res) => {
    try {
        const { status } = req.params;
        let data = readData();
        data = checkAndUpdateReviewWords(data);
        let words = data.words;
        
        if (status && status !== 'all') {
            if (status === 'review') {
                words = words.filter(w => w.status === 'review_7' || w.status === 'review_30');
            } else if (status === 'learned') {
                words = words.filter(w => w.status === 'learned' || w.status === 'learned_waiting');
            } else {
                words = words.filter(w => w.status === status);
            }
        }
        
        const headers = 'Word,Translation,Example,Example Translation,Status\n';
        const csvData = words.map(word => 
            `"${word.word}","${word.translation}","${word.example}","${word.exampleTranslation}","${word.status}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="words_${status || 'all'}.csv"`);
        res.send(headers + csvData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Import progress data from JSON
app.post('/api/words/import-progress', upload.single('progressFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const progressData = JSON.parse(fileContent);
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        if (!Array.isArray(progressData)) {
            return res.status(400).json({ error: 'Invalid progress data format' });
        }
        
        const data = readData();
        
        // Clear existing data
        data.words = [];
        data.nextId = 1;
        
        // Import progress data
        progressData.forEach(wordObj => {
            const word = {
                id: data.nextId++,
                word: wordObj.word,
                translation: wordObj.translation,
                example: wordObj.example || '',
                exampleTranslation: wordObj.exampleTranslation || '',
                status: wordObj.status || 'studying',
                correctCount: wordObj.correctCount || 0,
                totalCount: wordObj.totalCount || 0,
                createdAt: wordObj.createdAt || new Date().toISOString(),
                updatedAt: wordObj.updatedAt || new Date().toISOString()
            };
            data.words.push(word);
        });
        
        writeData(data);
        
        res.json({ 
            message: `Successfully imported ${progressData.length} words with progress`,
            imported: progressData.length
        });
        
    } catch (err) {
        // Clean up file if exists
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        if (err instanceof SyntaxError) {
            res.status(400).json({ error: 'Invalid JSON format' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Import words from CSV
app.post('/api/words/import', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const words = [];
    
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
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
            fs.unlinkSync(req.file.path);
            
            if (words.length === 0) {
                return res.status(400).json({ error: 'No valid words found in CSV' });
            }
            
            const data = readData();
            
            words.forEach(wordObj => {
                const word = {
                    id: data.nextId++,
                    word: wordObj.word,
                    translation: wordObj.translation,
                    example: wordObj.example,
                    exampleTranslation: wordObj.exampleTranslation,
                    status: 'studying',
                    correctCount: 0,
                    totalCount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                data.words.push(word);
            });
            
            writeData(data);
            res.json({ message: `${words.length} words imported successfully` });
        })
        .on('error', (err) => {
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

// Initialize and start server
initDataFile();

app.listen(PORT, () => {
    console.log(`🚀 Words Learning Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`📱 Or open http://YOUR_COMPUTER_IP:${PORT} on your phone`);
});