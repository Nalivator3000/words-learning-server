const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', '*'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// JWT secret
const JWT_SECRET = 'words_learning_jwt_secret_2024';

// In-memory data storage (replace with real database later)
const users = new Map([
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
]);

let nextWordId = 1;

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
    res.json({ 
        status: 'healthy', 
        database: 'in-memory', 
        users: users.size,
        totalWords: Array.from(users.values()).reduce((sum, user) => sum + user.words.length, 0)
    });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = Array.from(users.values()).find(u => u.email === email);
        
        // Simple password validation (same as emergency-login.js)
        const validCredentials = [
            { email: 'root', password: 'root', userId: 'root-user' },
            { email: 'Kate', password: '1', userId: 'kate-user' },
            { email: 'Mike', password: '1', userId: 'mike-user' }
        ];

        const cred = validCredentials.find(c => c.email === email && c.password === password);
        if (!cred || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Return user data with language pairs
        const userData = { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            token: token,
            languagePairs: user.languagePairs
        };

        console.log(`✅ User ${user.name} authenticated successfully`);
        res.json({ user: userData, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User endpoints
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const user = users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: new Date().toISOString(),
            languagePairs: user.languagePairs
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Language pairs endpoints
app.get('/api/language-pairs', authenticateToken, async (req, res) => {
    try {
        const user = users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.languagePairs || []);
    } catch (error) {
        console.error('Get language pairs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/language-pairs', authenticateToken, async (req, res) => {
    try {
        const { id, name, fromLanguage, toLanguage } = req.body;
        const user = users.get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newPair = {
            id: id || `${req.user.userId}-${Date.now()}`,
            user_id: req.user.userId,
            name,
            from_language: fromLanguage,
            to_language: toLanguage,
            is_active: false,
            created_at: new Date().toISOString()
        };

        user.languagePairs = user.languagePairs || [];
        user.languagePairs.push(newPair);

        res.status(201).json({ id: newPair.id, message: 'Language pair created successfully' });
    } catch (error) {
        console.error('Create language pair error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Words endpoints
app.get('/api/words', authenticateToken, async (req, res) => {
    try {
        const { status, languagePairId, limit, offset } = req.query;
        const user = users.get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let words = [...user.words];

        // Filter by status
        if (status) {
            words = words.filter(word => word.status === status);
        }

        // Filter by language pair
        if (languagePairId) {
            words = words.filter(word => word.language_pair_id === languagePairId);
        }

        // Sort by creation date (newest first)
        words.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

        // Apply pagination
        const startIndex = offset ? parseInt(offset) : 0;
        const endIndex = limit ? startIndex + parseInt(limit) : words.length;
        words = words.slice(startIndex, endIndex);

        // Add language pair name
        words = words.map(word => ({
            ...word,
            language_pair_name: 'German-Russian'
        }));

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

        const user = users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const insertedIds = [];
        const now = new Date().toISOString();
        const defaultLanguagePairId = user.languagePairs?.[0]?.id || `${req.user.userId}-default-pair`;
        
        for (const word of words) {
            const wordData = {
                id: nextWordId++,
                user_id: req.user.userId,
                language_pair_id: languagePairId || defaultLanguagePairId,
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

        // Update user stats
        updateUserStats(user);

        console.log(`✅ Added ${words.length} words for user ${user.name} (${req.user.userId})`);

        res.status(201).json({ 
            message: `${words.length} words added successfully`,
            insertedIds: insertedIds
        });

    } catch (error) {
        console.error('Bulk add words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/words/review', authenticateToken, async (req, res) => {
    try {
        const { languagePairId, limit = 10 } = req.query;
        const user = users.get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let words = user.words.filter(word => {
            // Filter by review status
            if (!['review_7', 'review_30'].includes(word.status)) return false;
            
            // Filter by language pair if specified
            if (languagePairId && word.language_pair_id !== languagePairId) return false;
            
            // Check if review is due
            if (word.next_review) {
                const reviewDate = new Date(word.next_review);
                const now = new Date();
                return reviewDate <= now;
            }
            
            return true; // Include words with no next_review date
        });

        // Shuffle and limit
        words = words.sort(() => 0.5 - Math.random()).slice(0, parseInt(limit));
        
        // Add language pair name
        words = words.map(word => ({
            ...word,
            language_pair_name: 'German-Russian'
        }));

        res.json(words);
    } catch (error) {
        console.error('Get review words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/words/:wordId/progress', authenticateToken, async (req, res) => {
    try {
        const { wordId } = req.params;
        const { isCorrect, quizType } = req.body;
        const user = users.get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const wordIndex = user.words.findIndex(w => w.id === parseInt(wordId));
        if (wordIndex === -1) {
            return res.status(404).json({ error: 'Word not found' });
        }

        const word = user.words[wordIndex];
        const now = new Date();

        // Update attempt counts
        if (isCorrect) {
            word.correct_count++;
        } else {
            word.incorrect_count++;
        }

        word.last_studied = now.toISOString();
        word.updated_at = now.toISOString();

        // Update status based on learning algorithm (same as local database)
        if (isCorrect) {
            if (word.status === 'studying') {
                if (word.correct_count >= 3) {
                    word.status = 'review_7';
                    word.next_review = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                    word.review_attempts = 0;
                }
            } else if (word.status === 'review_7') {
                word.review_attempts++;
                if (word.review_attempts >= 2) {
                    word.status = 'review_30';
                    word.next_review = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
                    word.review_attempts = 0;
                }
            } else if (word.status === 'review_30') {
                word.review_attempts++;
                if (word.review_attempts >= 2) {
                    word.status = 'learned';
                    word.next_review = null;
                }
            }
        } else {
            // Handle incorrect answers
            if (word.status === 'review_7' || word.status === 'review_30') {
                word.review_attempts++;
                if (word.review_attempts >= 2) {
                    word.status = 'studying';
                    word.correct_count = Math.max(0, word.correct_count - 1);
                    word.next_review = null;
                    word.review_attempts = 0;
                }
            }
        }

        // Update user stats
        updateUserStats(user);

        console.log(`📈 Updated progress for word "${word.word}": ${isCorrect ? '✅' : '❌'} (${quizType}) - Status: ${word.status}`);

        res.json({ message: 'Progress updated successfully' });

    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Statistics endpoints
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const { languagePairId } = req.query;
        const user = users.get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        updateUserStats(user); // Ensure stats are up-to-date
        res.json(user.stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Backup endpoints
app.get('/api/backup/export', authenticateToken, async (req, res) => {
    try {
        const user = users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const backupData = {
            version: '2.0-external-db',
            timestamp: Date.now(),
            user: { id: user.id, email: user.email, name: user.name },
            words: user.words.map(word => ({
                ...word,
                language_pair_name: 'German-Russian',
                from_language: 'German',
                to_language: 'Russian'
            })),
            wordCount: user.words.length,
            languagePairs: user.languagePairs
        };

        res.json(backupData);
    } catch (error) {
        console.error('Export backup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/backup/restore', authenticateToken, async (req, res) => {
    try {
        const { backupData } = req.body;
        
        if (!backupData || !backupData.words) {
            return res.status(400).json({ error: 'Invalid backup data' });
        }

        const user = users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Clear existing words
        user.words = [];

        // Restore words with proper IDs
        for (const word of backupData.words) {
            const wordData = {
                id: nextWordId++,
                user_id: req.user.userId,
                language_pair_id: word.language_pair_id || word.languagePairId || `${req.user.userId}-default-pair`,
                word: word.word,
                translation: word.translation,
                example: word.example || null,
                example_translation: word.example_translation || word.exampleTranslation || null,
                status: word.status || 'studying',
                correct_count: word.correct_count || word.correctCount || 0,
                incorrect_count: word.incorrect_count || word.incorrectCount || 0,
                review_attempts: word.review_attempts || word.reviewAttempts || 0,
                date_added: word.date_added || word.dateAdded || new Date().toISOString(),
                last_studied: word.last_studied || word.lastStudied || null,
                next_review: word.next_review || word.nextReview || null,
                created_at: word.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            user.words.push(wordData);
        }

        // Update user stats
        updateUserStats(user);

        console.log(`✅ Restored ${backupData.words.length} words for user ${user.name}`);

        res.json({ 
            message: `Successfully restored ${backupData.words.length} words`,
            wordCount: backupData.words.length
        });

    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to update user statistics
function updateUserStats(user) {
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
        
        // Count words due for review
        if ((word.status === 'review_7' || word.status === 'review_30')) {
            if (!word.next_review || new Date(word.next_review) <= now) {
                stats.review++;
            }
        }
    }
    
    user.stats = stats;
    return stats;
}

// Additional endpoints for future integrations (Telegram bot, mobile app, etc.)

// Get user's current learning session info
app.get('/api/users/session', authenticateToken, async (req, res) => {
    try {
        const user = users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const stats = updateUserStats(user);
        
        const sessionInfo = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            stats: stats,
            languagePairs: user.languagePairs,
            totalWords: user.words.length,
            lastActivity: user.words.reduce((latest, word) => {
                const wordDate = new Date(word.last_studied || word.date_added);
                return wordDate > latest ? wordDate : latest;
            }, new Date(0))
        };

        res.json(sessionInfo);
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get random words for studying
app.get('/api/words/study', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const user = users.get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let words = user.words.filter(word => word.status === 'studying');
        words = words.sort(() => 0.5 - Math.random()).slice(0, parseInt(limit));
        
        words = words.map(word => ({
            ...word,
            language_pair_name: 'German-Russian'
        }));

        res.json(words);
    } catch (error) {
        console.error('Get study words error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Words Learning API Server running on port ${PORT}`);
    console.log(`👥 Available users: root/root, Kate/1, Mike/1`);
    console.log(`💾 Database: In-Memory Storage (${users.size} users)`);
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
    console.log(`   PUT  /api/words/:id/progress - Update word progress`);
    console.log(`   GET  /api/stats - Get learning statistics`);
    console.log(`   GET  /api/backup/export - Export user data`);
    console.log(`   POST /api/backup/restore - Restore user data`);
});