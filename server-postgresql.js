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
                totalPoints INTEGER DEFAULT 0,
                reviewCycle INTEGER DEFAULT 1,
                lastReviewDate TIMESTAMP,
                nextReviewDate TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Rename totalCount to totalPoints if it exists
        await db.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'words' AND column_name = 'totalcount'
                ) THEN
                    ALTER TABLE words RENAME COLUMN totalCount TO totalPoints;
                END IF;
            END $$;
        `);

        // Migration: Add reviewCycle column if it doesn't exist
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'words' AND column_name = 'reviewcycle'
                ) THEN
                    ALTER TABLE words ADD COLUMN reviewCycle INTEGER DEFAULT 1;
                END IF;
            END $$;
        `);

        // Gamification: User stats table for XP and levels
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                total_xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_activity_date DATE,
                total_words_learned INTEGER DEFAULT 0,
                total_quizzes_completed INTEGER DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Gamification: Daily activity log for streak tracking
        await db.query(`
            CREATE TABLE IF NOT EXISTS daily_activity (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                activity_date DATE NOT NULL,
                words_learned INTEGER DEFAULT 0,
                quizzes_completed INTEGER DEFAULT 0,
                xp_earned INTEGER DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, activity_date)
            )
        `);

        // Gamification: XP log for tracking XP sources
        await db.query(`
            CREATE TABLE IF NOT EXISTS xp_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                action_type VARCHAR(50) NOT NULL,
                xp_amount INTEGER NOT NULL,
                description TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Gamification: Achievements definitions
        await db.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                achievement_key VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                icon VARCHAR(50),
                category VARCHAR(50),
                tier INTEGER DEFAULT 1,
                requirement_value INTEGER,
                xp_reward INTEGER DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Gamification: User achievements (unlocked badges)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, achievement_id)
            )
        `);

        console.log('PostgreSQL database initialized with gamification tables');

        // Initialize predefined achievements
        await initializeAchievements();
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Initialize predefined achievements
async function initializeAchievements() {
    const achievements = [
        // Streak Achievements
        { key: 'streak_3', name: 'Огонёк 🔥', description: 'Стрик 3 дня подряд', icon: '🔥', category: 'streak', tier: 1, requirement: 3, xp: 50 },
        { key: 'streak_7', name: 'Неделя силы 💪', description: 'Стрик 7 дней подряд', icon: '💪', category: 'streak', tier: 2, requirement: 7, xp: 100 },
        { key: 'streak_30', name: 'Месяц победы 🏆', description: 'Стрик 30 дней подряд', icon: '🏆', category: 'streak', tier: 3, requirement: 30, xp: 500 },
        { key: 'streak_100', name: 'Легенда 👑', description: 'Стрик 100 дней подряд', icon: '👑', category: 'streak', tier: 4, requirement: 100, xp: 2000 },

        // Word Count Achievements
        { key: 'words_10', name: 'Первые шаги 🌱', description: 'Выучено 10 слов', icon: '🌱', category: 'words', tier: 1, requirement: 10, xp: 25 },
        { key: 'words_50', name: 'Знаток 📚', description: 'Выучено 50 слов', icon: '📚', category: 'words', tier: 2, requirement: 50, xp: 100 },
        { key: 'words_100', name: 'Эрудит 🎓', description: 'Выучено 100 слов', icon: '🎓', category: 'words', tier: 3, requirement: 100, xp: 250 },
        { key: 'words_500', name: 'Мастер слова ⭐', description: 'Выучено 500 слов', icon: '⭐', category: 'words', tier: 4, requirement: 500, xp: 1000 },
        { key: 'words_1000', name: 'Полиглот 🌍', description: 'Выучено 1000 слов', icon: '🌍', category: 'words', tier: 5, requirement: 1000, xp: 3000 },

        // Level Achievements
        { key: 'level_5', name: 'Новичок 🥉', description: 'Достигнут 5 уровень', icon: '🥉', category: 'level', tier: 1, requirement: 5, xp: 50 },
        { key: 'level_10', name: 'Опытный 🥈', description: 'Достигнут 10 уровень', icon: '🥈', category: 'level', tier: 2, requirement: 10, xp: 100 },
        { key: 'level_25', name: 'Профессионал 🥇', description: 'Достигнут 25 уровень', icon: '🥇', category: 'level', tier: 3, requirement: 25, xp: 500 },
        { key: 'level_50', name: 'Эксперт 💎', description: 'Достигнут 50 уровень', icon: '💎', category: 'level', tier: 4, requirement: 50, xp: 1500 },
        { key: 'level_100', name: 'Гроссмейстер 👾', description: 'Достигнут 100 уровень', icon: '👾', category: 'level', tier: 5, requirement: 100, xp: 5000 },

        // Quiz Achievements
        { key: 'quiz_100', name: 'Практикант ✏️', description: '100 упражнений выполнено', icon: '✏️', category: 'quiz', tier: 1, requirement: 100, xp: 50 },
        { key: 'quiz_500', name: 'Трудяга 📝', description: '500 упражнений выполнено', icon: '📝', category: 'quiz', tier: 2, requirement: 500, xp: 250 },
        { key: 'quiz_1000', name: 'Неутомимый 💪', description: '1000 упражнений выполнено', icon: '💪', category: 'quiz', tier: 3, requirement: 1000, xp: 750 },

        // Special Achievements
        { key: 'first_word', name: 'Первое слово 🎉', description: 'Выучено первое слово', icon: '🎉', category: 'special', tier: 1, requirement: 1, xp: 10 },
        { key: 'early_bird', name: 'Ранняя пташка 🌅', description: 'Занятие до 8:00', icon: '🌅', category: 'special', tier: 1, requirement: 1, xp: 25 },
        { key: 'night_owl', name: 'Ночная сова 🦉', description: 'Занятие после 23:00', icon: '🦉', category: 'special', tier: 1, requirement: 1, xp: 25 },
    ];

    try {
        for (const ach of achievements) {
            await db.query(
                `INSERT INTO achievements (achievement_key, name, description, icon, category, tier, requirement_value, xp_reward)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (achievement_key) DO NOTHING`,
                [ach.key, ach.name, ach.description, ach.icon, ach.category, ach.tier, ach.requirement, ach.xp]
            );
        }
        console.log('✨ Achievements initialized');
    } catch (err) {
        console.error('Error initializing achievements:', err);
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

// Gamification: Calculate level from total XP
// Progressive XP requirements: 100, 300, 600, 1000, 1500, 2100...
function calculateLevel(totalXP) {
    let level = 1;
    let xpForNextLevel = 100;
    let accumulatedXP = 0;

    while (totalXP >= accumulatedXP + xpForNextLevel) {
        accumulatedXP += xpForNextLevel;
        level++;
        xpForNextLevel = level * 100; // Each level requires level * 100 XP
    }

    return {
        level,
        currentLevelXP: totalXP - accumulatedXP,
        xpForNextLevel,
        progress: Math.round(((totalXP - accumulatedXP) / xpForNextLevel) * 100)
    };
}

// Gamification: Get or create user stats
async function getUserStats(userId) {
    let stats = await db.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);

    if (stats.rows.length === 0) {
        // Create new stats entry for user
        await db.query(
            'INSERT INTO user_stats (user_id) VALUES ($1)',
            [userId]
        );
        stats = await db.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
    }

    return stats.rows[0];
}

// Gamification: Award XP to user
async function awardXP(userId, actionType, xpAmount, description = '') {
    try {
        // Log XP
        await db.query(
            'INSERT INTO xp_log (user_id, action_type, xp_amount, description) VALUES ($1, $2, $3, $4)',
            [userId, actionType, xpAmount, description]
        );

        // Update user stats
        const result = await db.query(
            `UPDATE user_stats
             SET total_xp = total_xp + $1,
                 updatedat = CURRENT_TIMESTAMP
             WHERE user_id = $2
             RETURNING total_xp`,
            [xpAmount, userId]
        );

        const newTotalXP = result.rows[0]?.total_xp || 0;
        const levelInfo = calculateLevel(newTotalXP);

        // Update level if changed
        await db.query(
            'UPDATE user_stats SET level = $1 WHERE user_id = $2',
            [levelInfo.level, userId]
        );

        console.log(`🎯 User ${userId} earned ${xpAmount} XP for ${actionType} - Level ${levelInfo.level}`);

        return { xpAmount, newTotalXP, ...levelInfo };
    } catch (err) {
        console.error('Error awarding XP:', err);
        throw err;
    }
}

// Gamification: Update daily activity and check streak
async function updateDailyActivity(userId, wordsLearned = 0, quizzesCompleted = 0, xpEarned = 0) {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Insert or update today's activity
        await db.query(
            `INSERT INTO daily_activity (user_id, activity_date, words_learned, quizzes_completed, xp_earned)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, activity_date)
             DO UPDATE SET
                 words_learned = daily_activity.words_learned + $3,
                 quizzes_completed = daily_activity.quizzes_completed + $4,
                 xp_earned = daily_activity.xp_earned + $5`,
            [userId, today, wordsLearned, quizzesCompleted, xpEarned]
        );

        // Update streak
        const stats = await db.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
        const lastActivityDate = stats.rows[0]?.last_activity_date;
        const currentStreak = stats.rows[0]?.current_streak || 0;
        const longestStreak = stats.rows[0]?.longest_streak || 0;

        let newStreak = currentStreak;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (!lastActivityDate || lastActivityDate === today) {
            // Same day, keep streak
            newStreak = currentStreak || 1;
        } else if (lastActivityDate === yesterdayStr) {
            // Consecutive day
            newStreak = currentStreak + 1;
        } else {
            // Streak broken
            newStreak = 1;
        }

        const newLongestStreak = Math.max(longestStreak, newStreak);

        // Update user stats
        await db.query(
            `UPDATE user_stats
             SET current_streak = $1,
                 longest_streak = $2,
                 last_activity_date = $3,
                 total_quizzes_completed = total_quizzes_completed + $4,
                 updatedat = CURRENT_TIMESTAMP
             WHERE user_id = $5`,
            [newStreak, newLongestStreak, today, quizzesCompleted, userId]
        );

        console.log(`🔥 User ${userId} streak: ${newStreak} days (longest: ${newLongestStreak})`);

        return { currentStreak: newStreak, longestStreak: newLongestStreak };
    } catch (err) {
        console.error('Error updating daily activity:', err);
        throw err;
    }
}

// Gamification: Check and unlock achievements
async function checkAchievements(userId) {
    try {
        const stats = await getUserStats(userId);
        const unlockedAchievements = [];

        // Get all achievements
        const achievementsResult = await db.query('SELECT * FROM achievements ORDER BY tier ASC');
        const allAchievements = achievementsResult.rows;

        // Get already unlocked achievements
        const unlockedResult = await db.query(
            'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
            [userId]
        );
        const unlockedIds = new Set(unlockedResult.rows.map(row => row.achievement_id));

        // Check each achievement
        for (const achievement of allAchievements) {
            if (unlockedIds.has(achievement.id)) continue; // Already unlocked

            let shouldUnlock = false;

            switch (achievement.category) {
                case 'streak':
                    shouldUnlock = stats.current_streak >= achievement.requirement_value;
                    break;
                case 'words':
                    shouldUnlock = stats.total_words_learned >= achievement.requirement_value;
                    break;
                case 'level':
                    shouldUnlock = stats.level >= achievement.requirement_value;
                    break;
                case 'quiz':
                    shouldUnlock = stats.total_quizzes_completed >= achievement.requirement_value;
                    break;
                case 'special':
                    if (achievement.achievement_key === 'first_word') {
                        shouldUnlock = stats.total_words_learned >= 1;
                    } else if (achievement.achievement_key === 'early_bird') {
                        const hour = new Date().getHours();
                        shouldUnlock = hour < 8;
                    } else if (achievement.achievement_key === 'night_owl') {
                        const hour = new Date().getHours();
                        shouldUnlock = hour >= 23;
                    }
                    break;
            }

            if (shouldUnlock) {
                // Unlock achievement
                await db.query(
                    'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
                    [userId, achievement.id]
                );

                // Award XP bonus
                if (achievement.xp_reward > 0) {
                    await awardXP(userId, 'achievement', achievement.xp_reward, `Achievement: ${achievement.name}`);
                }

                unlockedAchievements.push(achievement);
                console.log(`🏆 User ${userId} unlocked achievement: ${achievement.name}`);
            }
        }

        return unlockedAchievements;
    } catch (err) {
        console.error('Error checking achievements:', err);
        return [];
    }
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

// Gamification: Get user stats (XP, level, streak)
app.get('/api/gamification/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = await getUserStats(parseInt(userId));
        const levelInfo = calculateLevel(stats.total_xp);

        res.json({
            totalXP: stats.total_xp,
            level: stats.level,
            currentStreak: stats.current_streak,
            longestStreak: stats.longest_streak,
            totalWordsLearned: stats.total_words_learned,
            totalQuizzesCompleted: stats.total_quizzes_completed,
            lastActivityDate: stats.last_activity_date,
            levelInfo
        });
    } catch (err) {
        console.error('Error getting user stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Award XP (called internally or for testing)
app.post('/api/gamification/award-xp', async (req, res) => {
    try {
        const { userId, actionType, xpAmount, description } = req.body;

        if (!userId || !actionType || !xpAmount) {
            return res.status(400).json({ error: 'userId, actionType, and xpAmount are required' });
        }

        const result = await awardXP(parseInt(userId), actionType, xpAmount, description);
        res.json(result);
    } catch (err) {
        console.error('Error awarding XP:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get XP history
app.get('/api/gamification/xp-log/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const result = await db.query(
            'SELECT * FROM xp_log WHERE user_id = $1 ORDER BY createdat DESC LIMIT $2',
            [parseInt(userId), parseInt(limit)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting XP log:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get daily activity calendar
app.get('/api/gamification/activity/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 365 } = req.query;

        const result = await db.query(
            `SELECT activity_date, words_learned, quizzes_completed, xp_earned
             FROM daily_activity
             WHERE user_id = $1 AND activity_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
             ORDER BY activity_date DESC`,
            [parseInt(userId)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get all achievements
app.get('/api/gamification/achievements', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM achievements ORDER BY category, tier');
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get user's unlocked achievements
app.get('/api/gamification/achievements/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await db.query(
            `SELECT a.*, ua.unlocked_at
             FROM achievements a
             INNER JOIN user_achievements ua ON a.id = ua.achievement_id
             WHERE ua.user_id = $1
             ORDER BY ua.unlocked_at DESC`,
            [parseInt(userId)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting user achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get achievement progress for user
app.get('/api/gamification/achievements/:userId/progress', async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = await getUserStats(parseInt(userId));

        const allAchievements = await db.query('SELECT * FROM achievements ORDER BY category, tier');
        const unlocked = await db.query(
            'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
            [parseInt(userId)]
        );
        const unlockedIds = new Set(unlocked.rows.map(row => row.achievement_id));

        const progress = allAchievements.rows.map(ach => {
            let currentValue = 0;
            switch (ach.category) {
                case 'streak': currentValue = stats.current_streak; break;
                case 'words': currentValue = stats.total_words_learned; break;
                case 'level': currentValue = stats.level; break;
                case 'quiz': currentValue = stats.total_quizzes_completed; break;
                case 'special': currentValue = 0; break; // Special achievements don't have progress
            }

            return {
                ...ach,
                unlocked: unlockedIds.has(ach.id),
                progress: Math.min(100, Math.round((currentValue / ach.requirement_value) * 100)),
                currentValue
            };
        });

        res.json(progress);
    } catch (err) {
        console.error('Error getting achievement progress:', err);
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

// Delete all words for a user/language pair
app.delete('/api/words/all', async (req, res) => {
    try {
        const { userId, languagePairId } = req.query;

        if (!userId || !languagePairId) {
            return res.status(400).json({ error: 'userId and languagePairId are required' });
        }

        const result = await db.query(
            'DELETE FROM words WHERE user_id = $1 AND language_pair_id = $2',
            [userId, languagePairId]
        );

        console.log(`🗑️ Deleted ${result.rowCount} words for user ${userId}, language pair ${languagePairId}`);

        res.json({
            message: 'All words deleted successfully',
            deletedCount: result.rowCount
        });
    } catch (err) {
        console.error('Error deleting words:', err);
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

// Update word progress with point-based system
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

        // Point system based on question type
        // Multiple choice: 2 points, Word building: 5 points, Typing: 10 points
        // Survival mode: 0 points (excluded by client)
        const pointsMap = {
            'multiple': 2,
            'multipleChoice': 2,
            'reverse_multiple': 2,
            'reverseMultipleChoice': 2,
            'word_building': 5,
            'wordBuilding': 5,
            'typing': 10,
            'complex': 5  // Weighted average of mixed types
        };

        const points = pointsMap[questionType] || 2; // Default 2 points

        // Point system: correctCount accumulates earned points (max 100)
        // totalPoints is always 100 (fixed maximum)
        const newTotalPoints = 100; // Fixed maximum
        let newCorrectCount = (word.correctcount || 0);

        if (correct) {
            // Add points for correct answer (cap at 100)
            newCorrectCount = Math.min(100, newCorrectCount + points);
        } else {
            // Deduct 1 point for incorrect answer (but not below 0)
            newCorrectCount = Math.max(0, newCorrectCount - 1);
        }

        // Calculate percentage: (correctCount / 100) * 100 = correctCount
        const percentage = newCorrectCount;

        // Determine new status based on points and review cycle
        let newStatus = word.status;
        let newReviewCycle = word.reviewcycle || 1;
        let nextReviewDate = null;

        if (word.status === 'studying' && newCorrectCount >= 80) {
            // Completed studying phase (reached 80+ points out of 100) - move to review based on cycle
            if (newReviewCycle === 1) {
                newStatus = 'review_7';
                // Set next review date to 7 days from now
                nextReviewDate = new Date();
                nextReviewDate.setDate(nextReviewDate.getDate() + 7);
                console.log(`📅 Word ${id} moved to review_7, next review: ${nextReviewDate.toISOString()}`);
            } else if (newReviewCycle === 2) {
                newStatus = 'review_30';
                // Set next review date to 30 days from now
                nextReviewDate = new Date();
                nextReviewDate.setDate(nextReviewDate.getDate() + 30);
                console.log(`📅 Word ${id} moved to review_30, next review: ${nextReviewDate.toISOString()}`);
            } else if (newReviewCycle >= 3) {
                newStatus = 'learned';
                console.log(`🎉 Word ${id} fully learned after 3 cycles!`);
            }
        } else if (!correct && (word.status === 'review_7' || word.status === 'review_30')) {
            // Failed review - reset to studying but keep cycle
            newStatus = 'studying';
            console.log(`❌ Word ${id} failed review, back to studying (cycle ${newReviewCycle})`);
        }

        const updateQuery = `UPDATE words
                            SET correctCount = $1, totalPoints = $2, status = $3, reviewCycle = $4,
                                lastReviewDate = CURRENT_TIMESTAMP,
                                nextReviewDate = $5,
                                updatedAt = CURRENT_TIMESTAMP
                            WHERE id = $6`;

        await db.query(updateQuery, [newCorrectCount, newTotalPoints, newStatus, newReviewCycle, nextReviewDate, id]);

        console.log(`📊 Word ${id} progress: ${newCorrectCount}/${newTotalPoints} points (${percentage}%) - Status: ${newStatus}, Cycle: ${newReviewCycle}`);

        // Gamification: Award XP for quiz answers
        const userId = word.user_id;
        let xpEarned = 0;
        let xpResult = null;

        if (correct) {
            // Award XP based on question difficulty
            const xpMap = {
                'multiple': 5,
                'multipleChoice': 5,
                'reverse_multiple': 5,
                'reverseMultipleChoice': 5,
                'word_building': 10,
                'wordBuilding': 10,
                'typing': 15,
                'complex': 10
            };

            xpEarned = xpMap[questionType] || 5;

            // Bonus XP for completing a word (reaching learned status)
            if (newStatus === 'learned' && word.status !== 'learned') {
                xpEarned += 50; // Bonus XP for fully learning a word
                xpResult = await awardXP(userId, 'word_learned', xpEarned, `Learned: ${word.word}`);
            } else {
                xpResult = await awardXP(userId, 'quiz_answer', xpEarned, `${questionType}: ${word.word}`);
            }

            // Update daily activity
            await updateDailyActivity(userId, 0, 1, xpEarned);

            // Update total_words_learned if word just became learned
            if (newStatus === 'learned' && word.status !== 'learned') {
                await db.query(
                    'UPDATE user_stats SET total_words_learned = total_words_learned + 1 WHERE user_id = $1',
                    [userId]
                );
            }

            // Check for new achievements
            const newAchievements = await checkAchievements(userId);

            res.json({
                message: 'Progress updated successfully',
                points: newCorrectCount,
                totalPoints: newTotalPoints,
                percentage,
                status: newStatus,
                xp: xpResult, // Include XP info in response
                achievements: newAchievements // Include newly unlocked achievements
            });
        } else {
            res.json({
                message: 'Progress updated successfully',
                points: newCorrectCount,
                totalPoints: newTotalPoints,
                percentage,
                status: newStatus
            });
        }
    } catch (err) {
        console.error('Error updating word progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a single word
app.delete('/api/words/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM words WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Word not found' });
        }

        res.json({ message: 'Word deleted successfully' });
    } catch (err) {
        console.error('Error deleting word:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update word status
app.put('/api/words/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['studying', 'review_7', 'review_30', 'learned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.query(
            'UPDATE words SET status = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Word not found' });
        }

        res.json({ message: 'Word status updated successfully' });
    } catch (err) {
        console.error('Error updating word status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check and reset expired review words (spaced repetition)
app.post('/api/words/check-expired-reviews', async (req, res) => {
    try {
        const { userId, languagePairId } = req.query;

        if (!userId || !languagePairId) {
            return res.status(400).json({ error: 'userId and languagePairId are required' });
        }

        // Find words in review status whose nextReviewDate has passed
        const expiredWords = await db.query(
            `SELECT id, word, status, reviewCycle, nextReviewDate
             FROM words
             WHERE user_id = $1 AND language_pair_id = $2
             AND status IN ('review_7', 'review_30')
             AND nextReviewDate IS NOT NULL
             AND nextReviewDate <= CURRENT_TIMESTAMP`,
            [userId, languagePairId]
        );

        if (expiredWords.rows.length === 0) {
            return res.json({
                message: 'No expired review words found',
                expiredCount: 0
            });
        }

        // Reset each expired word: status → studying, cycle++, reset points
        for (const word of expiredWords.rows) {
            const newCycle = (word.reviewcycle || 1) + 1;
            await db.query(
                `UPDATE words
                 SET status = 'studying',
                     reviewCycle = $1,
                     correctCount = 0,
                     totalPoints = 0,
                     nextReviewDate = NULL,
                     updatedAt = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [newCycle, word.id]
            );
            console.log(`⏰ Word "${word.word}" (${word.status}) expired - reset to studying cycle ${newCycle}`);
        }

        res.json({
            message: `${expiredWords.rows.length} words returned to studying for next review cycle`,
            expiredCount: expiredWords.rows.length,
            words: expiredWords.rows.map(w => ({ id: w.id, word: w.word, previousStatus: w.status, newCycle: (w.reviewcycle || 1) + 1 }))
        });
    } catch (err) {
        console.error('Error checking expired reviews:', err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk update all words to studying status and reset progress
app.put('/api/words/bulk/reset-to-studying', async (req, res) => {
    try {
        const { userId, languagePairId } = req.query;

        if (!userId || !languagePairId) {
            return res.status(400).json({ error: 'userId and languagePairId are required' });
        }

        const result = await db.query(
            `UPDATE words
             SET status = 'studying',
                 correctcount = 0,
                 totalpoints = 0,
                 reviewcycle = 1,
                 nextreviewdate = NULL,
                 updatedat = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND language_pair_id = $2`,
            [userId, languagePairId]
        );

        console.log(`🔄 Reset ${result.rowCount} words to studying status (progress cleared) for user ${userId}, language pair ${languagePairId}`);

        res.json({
            message: 'All words reset to studying status with progress cleared',
            updatedCount: result.rowCount
        });
    } catch (err) {
        console.error('Error resetting words to studying:', err);
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
        const http = require('http');
        const { Readable } = require('stream');

        const fetchData = (url, redirectCount = 0) => {
            return new Promise((resolve, reject) => {
                if (redirectCount > 5) {
                    reject(new Error('Too many redirects'));
                    return;
                }

                const protocol = url.startsWith('https') ? https : http;

                protocol.get(url, (response) => {
                    // Handle redirects (301, 302, 307, 308)
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        console.log(`📍 Following redirect to: ${response.headers.location}`);
                        fetchData(response.headers.location, redirectCount + 1)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP ${response.statusCode}`));
                        return;
                    }

                    let data = '';
                    response.on('data', (chunk) => data += chunk);
                    response.on('end', () => resolve(data));
                }).on('error', reject);
            });
        };

        const csvData = await fetchData(csvUrl);
        console.log(`📄 CSV Data (first 500 chars):`, csvData.substring(0, 500));

        // Parse CSV data using csv-parser
        const words = [];
        const stream = Readable.from([csvData]);

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    console.log('🔍 Raw row:', row);
                    console.log('🔑 Row keys:', Object.keys(row));

                    // Try to get values by header names
                    let word = row.Word || row.word || row.Слово || row.слово;
                    let translation = row.Translation || row.translation || row.Перевод || row.перевод;
                    let example = row.Example || row.example || row.Пример || row.пример || '';
                    let exampleTranslation = row['Example Translation'] || row['example translation'] ||
                                              row.exampleTranslation || row['Перевод примера'] ||
                                              row['перевод примера'] || '';

                    // Fallback: try to get by column index (first 4 columns)
                    // Expected column order: Word (foreign), Example (foreign), Translation (native), ExampleTranslation (native)
                    if (!word || !translation) {
                        const values = Object.values(row);
                        console.log('📊 Trying column index fallback, values:', values);
                        word = word || values[0];              // Foreign word
                        example = example || values[1] || '';  // Foreign example sentence
                        translation = translation || values[2]; // Native translation
                        exampleTranslation = exampleTranslation || values[3] || ''; // Native example translation
                    }

                    console.log('📝 Parsed:', { word, translation, example, exampleTranslation });

                    if (word && translation) {
                        words.push({
                            word: String(word).trim(),
                            translation: String(translation).trim(),
                            example: example ? String(example).trim() : '',
                            exampleTranslation: exampleTranslation ? String(exampleTranslation).trim() : ''
                        });
                    } else {
                        console.log('⚠️ Skipped row - missing word or translation');
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