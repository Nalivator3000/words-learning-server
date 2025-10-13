const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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

        // Gamification: Daily goals
        await db.query(`
            CREATE TABLE IF NOT EXISTS daily_goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                goal_date DATE NOT NULL,
                xp_goal INTEGER DEFAULT 50,
                words_goal INTEGER DEFAULT 5,
                quizzes_goal INTEGER DEFAULT 10,
                xp_progress INTEGER DEFAULT 0,
                words_progress INTEGER DEFAULT 0,
                quizzes_progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, goal_date)
            )
        `);

        // Global word collections (system-wide)
        await db.query(`
            CREATE TABLE IF NOT EXISTS global_word_collections (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                from_lang VARCHAR(50) NOT NULL,
                to_lang VARCHAR(50) NOT NULL,
                category VARCHAR(100),
                difficulty_level VARCHAR(20),
                word_count INTEGER DEFAULT 0,
                usage_count INTEGER DEFAULT 0,
                created_by INTEGER REFERENCES users(id),
                is_public BOOLEAN DEFAULT TRUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Words in global collections
        await db.query(`
            CREATE TABLE IF NOT EXISTS global_collection_words (
                id SERIAL PRIMARY KEY,
                collection_id INTEGER REFERENCES global_word_collections(id) ON DELETE CASCADE,
                word VARCHAR(255) NOT NULL,
                translation VARCHAR(255) NOT NULL,
                example TEXT,
                exampleTranslation TEXT,
                order_index INTEGER DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bug Reporting System: Add is_beta_tester flag to users
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'is_beta_tester'
                ) THEN
                    ALTER TABLE users ADD COLUMN is_beta_tester BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
        `);

        // Bug Reporting System: Reports table
        await db.query(`
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                report_type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                page_url TEXT,
                browser_info TEXT,
                screen_resolution VARCHAR(50),
                status VARCHAR(50) DEFAULT 'open',
                priority VARCHAR(20) DEFAULT 'medium',
                assigned_to INTEGER REFERENCES users(id),
                github_issue_number INTEGER,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bug Reporting System: Report attachments (screenshots)
        await db.query(`
            CREATE TABLE IF NOT EXISTS report_attachments (
                id SERIAL PRIMARY KEY,
                report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                filepath TEXT NOT NULL,
                mimetype VARCHAR(100),
                size INTEGER,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bug Reporting System: Report comments
        await db.query(`
            CREATE TABLE IF NOT EXISTS report_comments (
                id SERIAL PRIMARY KEY,
                report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                comment_text TEXT NOT NULL,
                is_internal BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bug Reporting System: Report votes (for prioritization)
        await db.query(`
            CREATE TABLE IF NOT EXISTS report_votes (
                id SERIAL PRIMARY KEY,
                report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                vote_type VARCHAR(20) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(report_id, user_id)
            )
        `);

        // Friends System: Friendships table
        await db.query(`
            CREATE TABLE IF NOT EXISTS friendships (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending',
                requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                acceptedAt TIMESTAMP,
                UNIQUE(user_id, friend_id),
                CHECK (user_id != friend_id)
            )
        `);

        // Friends System: Friend activity feed
        await db.query(`
            CREATE TABLE IF NOT EXISTS friend_activities (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(50) NOT NULL,
                activity_data JSONB,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Achievements System: Achievement definitions
        await db.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                achievement_key VARCHAR(100) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon VARCHAR(50),
                category VARCHAR(50),
                difficulty VARCHAR(20),
                reward_xp INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                is_secret BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Achievements System: User achievements (unlocked achievements)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
                progress INTEGER DEFAULT 0,
                target INTEGER DEFAULT 1,
                is_unlocked BOOLEAN DEFAULT false,
                unlockedAt TIMESTAMP,
                UNIQUE(user_id, achievement_id)
            )
        `);

        // Daily Challenges System: Challenge templates
        await db.query(`
            CREATE TABLE IF NOT EXISTS challenge_templates (
                id SERIAL PRIMARY KEY,
                challenge_type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                target_value INTEGER NOT NULL,
                reward_xp INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                difficulty VARCHAR(20) DEFAULT 'easy',
                icon TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Daily Challenges System: User challenges (daily instances)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_daily_challenges (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                challenge_template_id INTEGER REFERENCES challenge_templates(id),
                challenge_date DATE NOT NULL,
                current_progress INTEGER DEFAULT 0,
                target_value INTEGER NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                reward_claimed BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, challenge_template_id, challenge_date)
            )
        `);

        // Daily Challenges System: Challenge progress log
        await db.query(`
            CREATE TABLE IF NOT EXISTS challenge_progress_log (
                id SERIAL PRIMARY KEY,
                user_challenge_id INTEGER REFERENCES user_daily_challenges(id) ON DELETE CASCADE,
                progress_increment INTEGER NOT NULL,
                action_type VARCHAR(50),
                action_details TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Coins System: Add coins_balance to user_stats
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'user_stats' AND column_name = 'coins_balance'
                ) THEN
                    ALTER TABLE user_stats ADD COLUMN coins_balance INTEGER DEFAULT 0;
                END IF;
            END $$;
        `);

        // Coins System: Transactions history
        await db.query(`
            CREATE TABLE IF NOT EXISTS coin_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                amount INTEGER NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                source VARCHAR(100),
                description TEXT,
                balance_after INTEGER NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Coins System: Shop items
        await db.query(`
            CREATE TABLE IF NOT EXISTS shop_items (
                id SERIAL PRIMARY KEY,
                item_key VARCHAR(100) UNIQUE NOT NULL,
                item_type VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price_coins INTEGER NOT NULL,
                icon TEXT,
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                is_limited BOOLEAN DEFAULT FALSE,
                stock_quantity INTEGER,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Coins System: User purchases
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_purchases (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                shop_item_id INTEGER REFERENCES shop_items(id),
                quantity INTEGER DEFAULT 1,
                total_cost INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                purchasedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expiresAt TIMESTAMP
            )
        `);

        // Leaderboards: Cached rankings (for performance)
        await db.query(`
            CREATE TABLE IF NOT EXISTS leaderboard_cache (
                id SERIAL PRIMARY KEY,
                leaderboard_type VARCHAR(50) NOT NULL,
                time_period VARCHAR(20) NOT NULL,
                rank_position INTEGER NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(leaderboard_type, time_period, rank_position)
            )
        `);

        console.log('PostgreSQL database initialized with gamification tables');

        // Initialize challenge templates
        await initializeChallengeTemplates();

        // Initialize shop items
        await initializeShopItems();

        // Initialize achievements
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

// Initialize predefined challenge templates
async function initializeChallengeTemplates() {
    const templates = [
        // Daily challenges - Easy
        { type: 'learn_words', title: 'Выучи 5 новых слов', description: 'Добавь 5 новых слов в свой словарь и начни их изучение', target: 5, xp: 50, coins: 10, difficulty: 'easy', icon: '📚' },
        { type: 'review_words', title: 'Повтори 10 слов', description: 'Закрепи знания, повторив 10 слов из своего словаря', target: 10, xp: 30, coins: 5, difficulty: 'easy', icon: '🔄' },
        { type: 'quiz_answers', title: 'Ответь правильно 5 раз', description: 'Дай 5 правильных ответов в любых упражнениях', target: 5, xp: 25, coins: 5, difficulty: 'easy', icon: '✅' },

        // Daily challenges - Medium
        { type: 'earn_xp', title: 'Заработай 100 XP', description: 'Накопи 100 очков опыта за день', target: 100, xp: 75, coins: 15, difficulty: 'medium', icon: '⭐' },
        { type: 'perfect_quiz', title: 'Идеальный квиз', description: 'Пройди квиз без единой ошибки (минимум 5 вопросов)', target: 1, xp: 100, coins: 20, difficulty: 'medium', icon: '💯' },
        { type: 'study_streak', title: 'Продли стрик', description: 'Сохрани свой ежедневный стрик', target: 1, xp: 50, coins: 10, difficulty: 'medium', icon: '🔥' },

        // Daily challenges - Hard
        { type: 'learn_many', title: 'Выучи 20 новых слов', description: 'Амбициозная цель: добавь 20 новых слов', target: 20, xp: 200, coins: 50, difficulty: 'hard', icon: '🎯' },
        { type: 'quiz_marathon', title: 'Марафон упражнений', description: 'Выполни 30 упражнений за день', target: 30, xp: 150, coins: 30, difficulty: 'hard', icon: '🏃' },
        { type: 'study_time', title: 'Час занятий', description: 'Уделяй обучению хотя бы 60 минут (считается по упражнениям)', target: 60, xp: 250, coins: 60, difficulty: 'hard', icon: '⏰' },
    ];

    try {
        for (const template of templates) {
            await db.query(
                `INSERT INTO challenge_templates (challenge_type, title, description, target_value, reward_xp, reward_coins, difficulty, icon)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT DO NOTHING`,
                [template.type, template.title, template.description, template.target, template.xp, template.coins, template.difficulty, template.icon]
            );
        }
        console.log('🎯 Challenge templates initialized');
    } catch (err) {
        console.error('Error initializing challenge templates:', err);
    }
}

// Initialize predefined shop items
async function initializeShopItems() {
    const items = [
        // Streak Freezes
        { key: 'streak_freeze_1', type: 'powerup', name: 'Заморозка стрика (1 день)', description: 'Сохраняет твой стрик на 1 день, если пропустишь занятие', price: 50, icon: '❄️', category: 'streak' },
        { key: 'streak_freeze_3', type: 'powerup', name: 'Заморозка стрика (3 дня)', description: 'Сохраняет твой стрик на 3 дня', price: 120, icon: '🧊', category: 'streak' },
        { key: 'streak_freeze_7', type: 'powerup', name: 'Заморозка стрика (7 дней)', description: 'Сохраняет твой стрик на неделю', price: 250, icon: '🌨️', category: 'streak' },

        // Hints and Powerups
        { key: 'hint_pack_5', type: 'consumable', name: 'Набор подсказок (5 шт)', description: '5 подсказок для использования в квизах', price: 30, icon: '💡', category: 'hints' },
        { key: 'hint_pack_20', type: 'consumable', name: 'Набор подсказок (20 шт)', description: '20 подсказок для квизов (выгодно!)', price: 100, icon: '✨', category: 'hints' },
        { key: 'xp_booster_2x', type: 'booster', name: 'XP Бустер x2 (1 час)', description: 'Удваивает получаемый XP на 1 час', price: 80, icon: '🚀', category: 'boosters' },
        { key: 'xp_booster_3x', type: 'booster', name: 'XP Бустер x3 (30 мин)', description: 'Утраивает получаемый XP на 30 минут', price: 120, icon: '💫', category: 'boosters' },

        // Themes
        { key: 'theme_ocean', type: 'theme', name: 'Тема "Океан"', description: 'Синяя цветовая схема с морскими мотивами', price: 200, icon: '🌊', category: 'themes' },
        { key: 'theme_forest', type: 'theme', name: 'Тема "Лес"', description: 'Зеленая природная тема', price: 200, icon: '🌲', category: 'themes' },
        { key: 'theme_sunset', type: 'theme', name: 'Тема "Закат"', description: 'Оранжево-розовая тема заката', price: 200, icon: '🌅', category: 'themes' },
        { key: 'theme_neon', type: 'theme', name: 'Тема "Неон"', description: 'Яркая неоновая тема для любителей киберпанка', price: 300, icon: '🌃', category: 'themes' },
        { key: 'theme_galaxy', type: 'theme', name: 'Тема "Галактика"', description: 'Космическая тема с звездами', price: 350, icon: '🌌', category: 'themes' },

        // Avatars
        { key: 'avatar_cat', type: 'avatar', name: 'Аватар "Кот"', description: 'Милый котик для профиля', price: 100, icon: '🐱', category: 'avatars' },
        { key: 'avatar_dog', type: 'avatar', name: 'Аватар "Собака"', description: 'Дружелюбный пёс', price: 100, icon: '🐶', category: 'avatars' },
        { key: 'avatar_panda', type: 'avatar', name: 'Аватар "Панда"', description: 'Панда-полиглот', price: 150, icon: '🐼', category: 'avatars' },
        { key: 'avatar_unicorn', type: 'avatar', name: 'Аватар "Единорог"', description: 'Магический единорог', price: 250, icon: '🦄', category: 'avatars' },
        { key: 'avatar_dragon', type: 'avatar', name: 'Аватар "Дракон"', description: 'Мудрый дракон', price: 300, icon: '🐉', category: 'avatars' },

        // Special Items
        { key: 'double_rewards_24h', type: 'booster', name: 'Двойные награды (24 часа)', description: 'Удваивает награды из челленджей на 24 часа', price: 500, icon: '💰', category: 'special' },
        { key: 'challenge_refresh', type: 'powerup', name: 'Обновить челленджи', description: 'Получи 3 новых челленджа сегодня', price: 150, icon: '🔄', category: 'challenges' },
    ];

    try {
        for (const item of items) {
            await db.query(
                `INSERT INTO shop_items (item_key, item_type, name, description, price_coins, icon, category)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (item_key) DO NOTHING`,
                [item.key, item.type, item.name, item.description, item.price, item.icon, item.category]
            );
        }
        console.log('🏪 Shop items initialized');
    } catch (err) {
        console.error('Error initializing shop items:', err);
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

// Achievements: Initialize predefined achievements
async function initializeAchievements() {
    const achievements = [
        // Learning milestones
        { key: 'first_steps', title: 'Первые шаги', description: 'Выучите 10 слов', icon: '👣', category: 'learning', difficulty: 'easy', reward_xp: 50, reward_coins: 10, target: 10 },
        { key: 'vocabulary_builder', title: 'Строитель словаря', description: 'Выучите 100 слов', icon: '📚', category: 'learning', difficulty: 'medium', reward_xp: 200, reward_coins: 50, target: 100 },
        { key: 'word_master', title: 'Мастер слов', description: 'Выучите 500 слов', icon: '🎓', category: 'learning', difficulty: 'hard', reward_xp: 1000, reward_coins: 250, target: 500 },
        { key: 'polyglot', title: 'Полиглот', description: 'Создайте 3 языковые пары', icon: '🌍', category: 'learning', difficulty: 'medium', reward_xp: 150, reward_coins: 30, target: 3 },

        // Streak achievements
        { key: 'week_warrior', title: 'Воин недели', description: 'Стрик 7 дней', icon: '🔥', category: 'streak', difficulty: 'easy', reward_xp: 100, reward_coins: 20, target: 7 },
        { key: 'marathon_runner', title: 'Марафонец', description: 'Стрик 30 дней', icon: '🏃', category: 'streak', difficulty: 'hard', reward_xp: 500, reward_coins: 100, target: 30 },
        { key: 'legendary_streak', title: 'Легендарный стрик', description: 'Стрик 100 дней', icon: '⭐', category: 'streak', difficulty: 'legendary', reward_xp: 2000, reward_coins: 500, target: 100 },

        // Accuracy achievements
        { key: 'perfectionist', title: 'Перфекционист', description: '100% правильных ответов в 10 квизах', icon: '💯', category: 'accuracy', difficulty: 'medium', reward_xp: 150, reward_coins: 30, target: 10 },
        { key: 'sharpshooter', title: 'Снайпер', description: '100% правильных ответов в 50 квизах', icon: '🎯', category: 'accuracy', difficulty: 'hard', reward_xp: 500, reward_coins: 100, target: 50 },

        // Time-based achievements
        { key: 'night_owl', title: 'Ночной ученик', description: 'Изучайте слова после 22:00', icon: '🌙', category: 'time', difficulty: 'easy', reward_xp: 50, reward_coins: 10, is_secret: true, target: 1 },
        { key: 'early_bird', title: 'Ранняя пташка', description: 'Изучайте слова до 6:00', icon: '🌅', category: 'time', difficulty: 'easy', reward_xp: 50, reward_coins: 10, is_secret: true, target: 1 },

        // XP achievements
        { key: 'xp_collector', title: 'Коллекционер XP', description: 'Заработайте 1000 XP', icon: '💎', category: 'xp', difficulty: 'medium', reward_xp: 200, reward_coins: 50, target: 1000 },
        { key: 'xp_master', title: 'Мастер XP', description: 'Заработайте 10000 XP', icon: '👑', category: 'xp', difficulty: 'hard', reward_xp: 1000, reward_coins: 250, target: 10000 },

        // Social achievements
        { key: 'social_butterfly', title: 'Общительный', description: 'Добавьте 5 друзей', icon: '🦋', category: 'social', difficulty: 'easy', reward_xp: 100, reward_coins: 20, target: 5 },
        { key: 'challenge_master', title: 'Мастер челленджей', description: 'Выполните 30 челленджей', icon: '🏆', category: 'challenges', difficulty: 'hard', reward_xp: 500, reward_coins: 100, target: 30 }
    ];

    for (const achievement of achievements) {
        try {
            await db.query(`
                INSERT INTO achievements (achievement_key, title, description, icon, category, difficulty, reward_xp, reward_coins, is_secret)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (achievement_key) DO NOTHING
            `, [
                achievement.key,
                achievement.title,
                achievement.description,
                achievement.icon,
                achievement.category,
                achievement.difficulty,
                achievement.reward_xp,
                achievement.reward_coins,
                achievement.is_secret || false
            ]);
        } catch (err) {
            console.error(`Error initializing achievement ${achievement.key}:`, err.message);
        }
    }

    console.log('✅ Achievements initialized');
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

        // Update daily goals
        await updateDailyGoals(userId, wordsLearned, quizzesCompleted, xpEarned);

        return { currentStreak: newStreak, longestStreak: newLongestStreak };
    } catch (err) {
        console.error('Error updating daily activity:', err);
        throw err;
    }
}

// Gamification: Update daily goals progress
async function updateDailyGoals(userId, wordsLearned = 0, quizzesCompleted = 0, xpEarned = 0) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get or create today's goal
        let goal = await db.query(
            'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2',
            [userId, today]
        );

        if (goal.rows.length === 0) {
            // Create new daily goal with default values
            await db.query(
                `INSERT INTO daily_goals (user_id, goal_date, xp_goal, words_goal, quizzes_goal)
                 VALUES ($1, $2, 50, 5, 10)`,
                [userId, today]
            );
            goal = await db.query(
                'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2',
                [userId, today]
            );
        }

        const currentGoal = goal.rows[0];

        // Update progress
        const newXPProgress = (currentGoal.xp_progress || 0) + xpEarned;
        const newWordsProgress = (currentGoal.words_progress || 0) + wordsLearned;
        const newQuizzesProgress = (currentGoal.quizzes_progress || 0) + quizzesCompleted;

        // Check if completed
        const completed =
            newXPProgress >= currentGoal.xp_goal &&
            newWordsProgress >= currentGoal.words_goal &&
            newQuizzesProgress >= currentGoal.quizzes_goal;

        await db.query(
            `UPDATE daily_goals
             SET xp_progress = $1,
                 words_progress = $2,
                 quizzes_progress = $3,
                 completed = $4,
                 updatedat = CURRENT_TIMESTAMP
             WHERE user_id = $5 AND goal_date = $6`,
            [newXPProgress, newWordsProgress, newQuizzesProgress, completed, userId, today]
        );

        console.log(`🎯 User ${userId} daily goals: ${newXPProgress}/${currentGoal.xp_goal} XP, ${newWordsProgress}/${currentGoal.words_goal} words, ${newQuizzesProgress}/${currentGoal.quizzes_goal} quizzes`);

        // Award bonus XP if goal just completed
        if (completed && !currentGoal.completed) {
            await awardXP(userId, 'daily_goal', 25, 'Daily goal completed!');
            console.log(`🎉 User ${userId} completed daily goal! +25 bonus XP`);
        }

        return { completed, newXPProgress, newWordsProgress, newQuizzesProgress };
    } catch (err) {
        console.error('Error updating daily goals:', err);
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

// Gamification: Get global leaderboard
app.get('/api/gamification/leaderboard/global', async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        const result = await db.query(
            `SELECT
                u.id,
                u.name,
                us.total_xp,
                us.level,
                us.current_streak,
                us.longest_streak,
                us.total_words_learned,
                us.total_quizzes_completed,
                ROW_NUMBER() OVER (ORDER BY us.total_xp DESC) as rank
             FROM users u
             INNER JOIN user_stats us ON u.id = us.user_id
             ORDER BY us.total_xp DESC
             LIMIT $1`,
            [parseInt(limit)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting global leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get weekly leaderboard
app.get('/api/gamification/leaderboard/weekly', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        const result = await db.query(
            `SELECT
                u.id,
                u.name,
                us.level,
                us.current_streak,
                COALESCE(SUM(da.xp_earned), 0) as weekly_xp,
                COALESCE(SUM(da.words_learned), 0) as weekly_words,
                COALESCE(SUM(da.quizzes_completed), 0) as weekly_quizzes,
                ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(da.xp_earned), 0) DESC) as rank
             FROM users u
             INNER JOIN user_stats us ON u.id = us.user_id
             LEFT JOIN daily_activity da ON u.id = da.user_id
                AND da.activity_date >= $1
             GROUP BY u.id, u.name, us.level, us.current_streak
             ORDER BY weekly_xp DESC
             LIMIT $2`,
            [weekAgoStr, parseInt(limit)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting weekly leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get user's rank
app.get('/api/gamification/leaderboard/rank/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Global rank
        const globalRank = await db.query(
            `SELECT
                rank,
                total_xp
             FROM (
                SELECT
                    user_id,
                    total_xp,
                    ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
                FROM user_stats
             ) ranked
             WHERE user_id = $1`,
            [parseInt(userId)]
        );

        // Weekly rank
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        const weeklyRank = await db.query(
            `SELECT
                rank,
                weekly_xp
             FROM (
                SELECT
                    u.id as user_id,
                    COALESCE(SUM(da.xp_earned), 0) as weekly_xp,
                    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(da.xp_earned), 0) DESC) as rank
                FROM users u
                LEFT JOIN daily_activity da ON u.id = da.user_id
                    AND da.activity_date >= $1
                GROUP BY u.id
             ) ranked
             WHERE user_id = $2`,
            [weekAgoStr, parseInt(userId)]
        );

        res.json({
            global: globalRank.rows[0] || { rank: null, total_xp: 0 },
            weekly: weeklyRank.rows[0] || { rank: null, weekly_xp: 0 }
        });
    } catch (err) {
        console.error('Error getting user rank:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get today's daily goals
app.get('/api/gamification/daily-goals/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        let goal = await db.query(
            'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2',
            [parseInt(userId), today]
        );

        if (goal.rows.length === 0) {
            // Create default goal if doesn't exist
            await db.query(
                `INSERT INTO daily_goals (user_id, goal_date, xp_goal, words_goal, quizzes_goal)
                 VALUES ($1, $2, 50, 5, 10)`,
                [parseInt(userId), today]
            );
            goal = await db.query(
                'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2',
                [parseInt(userId), today]
            );
        }

        res.json(goal.rows[0]);
    } catch (err) {
        console.error('Error getting daily goals:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Update daily goal targets
app.put('/api/gamification/daily-goals/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { xpGoal, wordsGoal, quizzesGoal } = req.body;
        const today = new Date().toISOString().split('T')[0];

        // Get or create today's goal
        let goal = await db.query(
            'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2',
            [parseInt(userId), today]
        );

        if (goal.rows.length === 0) {
            await db.query(
                `INSERT INTO daily_goals (user_id, goal_date, xp_goal, words_goal, quizzes_goal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [parseInt(userId), today, xpGoal || 50, wordsGoal || 5, quizzesGoal || 10]
            );
        } else {
            await db.query(
                `UPDATE daily_goals
                 SET xp_goal = $1, words_goal = $2, quizzes_goal = $3, updatedat = CURRENT_TIMESTAMP
                 WHERE user_id = $4 AND goal_date = $5`,
                [xpGoal, wordsGoal, quizzesGoal, parseInt(userId), today]
            );
        }

        goal = await db.query(
            'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2',
            [parseInt(userId), today]
        );

        res.json(goal.rows[0]);
    } catch (err) {
        console.error('Error updating daily goals:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// ANALYTICS ENDPOINTS
// ========================================

// Get learning progress data for charts
app.get('/api/analytics/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { period = 'week' } = req.query;

        let days = 7;
        if (period === 'month') days = 30;
        if (period === 'year') days = 365;

        const result = await db.query(
            `SELECT
                activity_date as date,
                xp_earned,
                words_learned,
                quizzes_completed
             FROM daily_activity
             WHERE user_id = $1 AND activity_date >= CURRENT_DATE - INTERVAL '${days} days'
             ORDER BY activity_date ASC`,
            [parseInt(userId)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting learning progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get exercise success rate stats
app.get('/api/analytics/exercise-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // This is a simulated endpoint since we don't currently track exercise type stats
        // In a real implementation, you'd add exercise_type tracking to the xp_log or a new table

        // For now, return simulated data based on question types from xp_log descriptions
        const result = await db.query(
            `SELECT
                CASE
                    WHEN description LIKE '%multipleChoice%' OR description LIKE '%multiple:%' THEN 'multiple_choice'
                    WHEN description LIKE '%wordBuilding%' OR description LIKE '%word_building%' THEN 'word_building'
                    WHEN description LIKE '%typing%' THEN 'typing'
                    ELSE 'flashcard'
                END as exercise_type,
                COUNT(*) as correct_count,
                0 as incorrect_count
             FROM xp_log
             WHERE user_id = $1 AND action_type = 'quiz_answer'
             GROUP BY exercise_type`,
            [parseInt(userId)]
        );

        // Add some default values if no data
        const types = ['multiple_choice', 'word_building', 'typing', 'flashcard'];
        const statsMap = {};

        result.rows.forEach(row => {
            statsMap[row.exercise_type] = {
                exercise_type: row.exercise_type,
                correct_count: parseInt(row.correct_count),
                incorrect_count: Math.floor(parseInt(row.correct_count) * 0.15) // Simulate 15% error rate
            };
        });

        // Fill in missing types
        types.forEach(type => {
            if (!statsMap[type]) {
                statsMap[type] = {
                    exercise_type: type,
                    correct_count: 0,
                    incorrect_count: 0
                };
            }
        });

        res.json(Object.values(statsMap));
    } catch (err) {
        console.error('Error getting exercise stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get difficult words (words with low success rate)
app.get('/api/analytics/difficult-words/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;

        // Get words with low correctCount or high error rates
        const result = await db.query(
            `SELECT
                id,
                word,
                translation,
                correctcount,
                totalpoints,
                status,
                (100 - correctcount) as error_count,
                GREATEST(1, correctcount + (100 - correctcount)) as total_attempts
             FROM words
             WHERE user_id = $1 AND correctcount < 70
             ORDER BY correctcount ASC, updatedat DESC
             LIMIT $2`,
            [parseInt(userId), parseInt(limit)]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting difficult words:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get study time statistics
app.get('/api/analytics/study-time/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Calculate study time based on quizzes completed
        // Assume average of 10 seconds per quiz question
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

        // Today's time
        const todayResult = await db.query(
            `SELECT COALESCE(SUM(quizzes_completed), 0) * 10 as seconds
             FROM daily_activity
             WHERE user_id = $1 AND activity_date = $2`,
            [parseInt(userId), today]
        );

        // Week's time
        const weekResult = await db.query(
            `SELECT COALESCE(SUM(quizzes_completed), 0) * 10 as seconds
             FROM daily_activity
             WHERE user_id = $1 AND activity_date >= $2`,
            [parseInt(userId), weekAgoStr]
        );

        // Total time
        const totalResult = await db.query(
            `SELECT COALESCE(SUM(quizzes_completed), 0) * 10 as seconds
             FROM daily_activity
             WHERE user_id = $1`,
            [parseInt(userId)]
        );

        res.json({
            today: parseInt(todayResult.rows[0].seconds) || 0,
            week: parseInt(weekResult.rows[0].seconds) || 0,
            total: parseInt(totalResult.rows[0].seconds) || 0
        });
    } catch (err) {
        console.error('Error getting study time:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get fluency prediction (ML-based)
app.get('/api/analytics/fluency-prediction/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user's learning stats
        const stats = await getUserStats(parseInt(userId));

        // Simple ML prediction based on current pace
        const totalWords = stats.total_words_learned || 0;
        const targetWords = 1000; // B2 level fluency target

        // Calculate words per week based on last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const recentActivity = await db.query(
            `SELECT COALESCE(SUM(words_learned), 0) as words
             FROM daily_activity
             WHERE user_id = $1 AND activity_date >= $2`,
            [parseInt(userId), thirtyDaysAgoStr]
        );

        const wordsLast30Days = parseInt(recentActivity.rows[0].words) || 0;
        const wordsPerWeek = Math.round((wordsLast30Days / 30) * 7);

        // Predict completion date
        const wordsRemaining = Math.max(0, targetWords - totalWords);
        const weeksRemaining = wordsPerWeek > 0 ? Math.ceil(wordsRemaining / wordsPerWeek) : 999;

        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + (weeksRemaining * 7));

        // Calculate confidence (higher with more data and consistent pace)
        const daysOfData = stats.current_streak || 1;
        const confidence = Math.min(0.95, 0.3 + (Math.min(daysOfData, 30) / 30) * 0.65);

        // Current progress percentage
        const currentProgress = Math.round((totalWords / targetWords) * 100);

        res.json({
            estimated_date: estimatedDate.toISOString(),
            current_progress: currentProgress,
            words_per_week: wordsPerWeek,
            confidence: confidence,
            total_words: totalWords,
            target_words: targetWords
        });
    } catch (err) {
        console.error('Error getting fluency prediction:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// GLOBAL WORD COLLECTIONS ENDPOINTS
// ========================================

// Get all global collections with filtering
app.get('/api/global-collections', async (req, res) => {
    try {
        const { from_lang, to_lang, category, difficulty_level } = req.query;

        let query = 'SELECT * FROM global_word_collections WHERE is_public = true';
        let params = [];
        let paramIndex = 1;

        if (from_lang && to_lang) {
            query += ` AND from_lang = $${paramIndex} AND to_lang = $${paramIndex + 1}`;
            params.push(from_lang, to_lang);
            paramIndex += 2;
        }

        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (difficulty_level) {
            query += ` AND difficulty_level = $${paramIndex}`;
            params.push(difficulty_level);
            paramIndex++;
        }

        query += ' ORDER BY usage_count DESC, createdat DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting global collections:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single global collection with its words
app.get('/api/global-collections/:collectionId', async (req, res) => {
    try {
        const { collectionId } = req.params;

        const collection = await db.query(
            'SELECT * FROM global_word_collections WHERE id = $1',
            [parseInt(collectionId)]
        );

        if (collection.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const words = await db.query(
            'SELECT * FROM global_collection_words WHERE collection_id = $1 ORDER BY order_index ASC',
            [parseInt(collectionId)]
        );

        res.json({
            ...collection.rows[0],
            words: words.rows
        });
    } catch (err) {
        console.error('Error getting global collection:', err);
        res.status(500).json({ error: err.message });
    }
});

// Import global collection to user's personal words
app.post('/api/global-collections/:collectionId/import', async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { userId, languagePairId } = req.body;

        if (!userId || !languagePairId) {
            return res.status(400).json({ error: 'userId and languagePairId are required' });
        }

        // Get collection words
        const words = await db.query(
            'SELECT * FROM global_collection_words WHERE collection_id = $1',
            [parseInt(collectionId)]
        );

        if (words.rows.length === 0) {
            return res.status(404).json({ error: 'No words found in collection' });
        }

        // Begin transaction
        await db.query('BEGIN');

        try {
            let importedCount = 0;

            for (const word of words.rows) {
                // Check if word already exists
                const existing = await db.query(
                    'SELECT id FROM words WHERE user_id = $1 AND language_pair_id = $2 AND word = $3',
                    [userId, languagePairId, word.word]
                );

                if (existing.rows.length === 0) {
                    await db.query(
                        `INSERT INTO words (user_id, language_pair_id, word, translation, example, exampleTranslation)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [userId, languagePairId, word.word, word.translation, word.example || '', word.exampletranslation || '']
                    );
                    importedCount++;
                }
            }

            // Update usage count
            await db.query(
                'UPDATE global_word_collections SET usage_count = usage_count + 1 WHERE id = $1',
                [parseInt(collectionId)]
            );

            await db.query('COMMIT');

            console.log(`📦 Imported ${importedCount} words from collection ${collectionId} to user ${userId}`);

            res.json({
                message: `${importedCount} words imported successfully`,
                importedCount,
                totalWords: words.rows.length,
                skippedCount: words.rows.length - importedCount
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error importing global collection:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create new global collection
app.post('/api/admin/global-collections', async (req, res) => {
    try {
        const { name, description, from_lang, to_lang, category, difficulty_level, created_by, words } = req.body;

        if (!name || !from_lang || !to_lang) {
            return res.status(400).json({ error: 'name, from_lang, and to_lang are required' });
        }

        // Begin transaction
        await db.query('BEGIN');

        try {
            // Create collection
            const collectionResult = await db.query(
                `INSERT INTO global_word_collections (name, description, from_lang, to_lang, category, difficulty_level, created_by, word_count)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [name, description || '', from_lang, to_lang, category || 'General', difficulty_level || 'A1', created_by || null, words?.length || 0]
            );

            const collectionId = collectionResult.rows[0].id;

            // Add words if provided
            if (words && Array.isArray(words) && words.length > 0) {
                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    await db.query(
                        `INSERT INTO global_collection_words (collection_id, word, translation, example, exampleTranslation, order_index)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [collectionId, word.word, word.translation, word.example || '', word.exampleTranslation || '', i]
                    );
                }
            }

            await db.query('COMMIT');

            console.log(`✨ Created global collection "${name}" with ${words?.length || 0} words`);

            res.json({
                message: 'Global collection created successfully',
                collection: collectionResult.rows[0]
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error creating global collection:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// BUG REPORTING SYSTEM ENDPOINTS
// ========================================

// Admin: Toggle beta tester status for user
app.put('/api/admin/users/:userId/beta-tester', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isBetaTester } = req.body;

        const result = await db.query(
            'UPDATE users SET is_beta_tester = $1 WHERE id = $2 RETURNING id, name, email, is_beta_tester',
            [isBetaTester, parseInt(userId)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`👥 User ${userId} beta tester status: ${isBetaTester}`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating beta tester status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check if user is beta tester
app.get('/api/users/:userId/beta-tester', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await db.query(
            'SELECT is_beta_tester FROM users WHERE id = $1',
            [parseInt(userId)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ isBetaTester: result.rows[0].is_beta_tester || false });
    } catch (err) {
        console.error('Error checking beta tester status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create new report
app.post('/api/reports', upload.array('screenshots', 5), async (req, res) => {
    try {
        const { userId, reportType, title, description, pageUrl, browserInfo, screenResolution } = req.body;

        if (!userId || !reportType || !title || !description) {
            return res.status(400).json({ error: 'userId, reportType, title, and description are required' });
        }

        // Check if user is beta tester
        const userCheck = await db.query('SELECT is_beta_tester FROM users WHERE id = $1', [parseInt(userId)]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!userCheck.rows[0].is_beta_tester) {
            return res.status(403).json({ error: 'Only beta testers can submit reports' });
        }

        // Begin transaction
        await db.query('BEGIN');

        try {
            // Create report
            const reportResult = await db.query(
                `INSERT INTO reports (user_id, report_type, title, description, page_url, browser_info, screen_resolution)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [parseInt(userId), reportType, title, description, pageUrl || '', browserInfo || '', screenResolution || '']
            );

            const reportId = reportResult.rows[0].id;

            // Save uploaded screenshots
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await db.query(
                        `INSERT INTO report_attachments (report_id, filename, filepath, mimetype, size)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [reportId, file.originalname, file.path, file.mimetype, file.size]
                    );
                }
            }

            await db.query('COMMIT');

            console.log(`🐛 New report #${reportId} from user ${userId}: ${title}`);

            res.json({
                message: 'Report submitted successfully',
                report: reportResult.rows[0]
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error creating report:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all reports (with filtering)
app.get('/api/reports', async (req, res) => {
    try {
        const { userId, status, reportType, priority, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT r.*, u.name as user_name, u.email as user_email FROM reports r INNER JOIN users u ON r.user_id = u.id WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (userId) {
            query += ` AND r.user_id = $${paramIndex}`;
            params.push(parseInt(userId));
            paramIndex++;
        }

        if (status) {
            query += ` AND r.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (reportType) {
            query += ` AND r.report_type = $${paramIndex}`;
            params.push(reportType);
            paramIndex++;
        }

        if (priority) {
            query += ` AND r.priority = $${paramIndex}`;
            params.push(priority);
            paramIndex++;
        }

        query += ` ORDER BY r.createdat DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting reports:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single report with details
app.get('/api/reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await db.query(
            `SELECT r.*, u.name as user_name, u.email as user_email
             FROM reports r
             INNER JOIN users u ON r.user_id = u.id
             WHERE r.id = $1`,
            [parseInt(reportId)]
        );

        if (report.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Get attachments
        const attachments = await db.query(
            'SELECT * FROM report_attachments WHERE report_id = $1',
            [parseInt(reportId)]
        );

        // Get comments
        const comments = await db.query(
            `SELECT rc.*, u.name as user_name
             FROM report_comments rc
             INNER JOIN users u ON rc.user_id = u.id
             WHERE rc.report_id = $1
             ORDER BY rc.createdat ASC`,
            [parseInt(reportId)]
        );

        // Get votes
        const votes = await db.query(
            'SELECT vote_type, COUNT(*) as count FROM report_votes WHERE report_id = $1 GROUP BY vote_type',
            [parseInt(reportId)]
        );

        res.json({
            ...report.rows[0],
            attachments: attachments.rows,
            comments: comments.rows,
            votes: votes.rows
        });
    } catch (err) {
        console.error('Error getting report details:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update report status/priority
app.put('/api/admin/reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, priority, assignedTo, githubIssueNumber } = req.body;

        let updateFields = [];
        let params = [];
        let paramIndex = 1;

        if (status) {
            updateFields.push(`status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (priority) {
            updateFields.push(`priority = $${paramIndex}`);
            params.push(priority);
            paramIndex++;
        }

        if (assignedTo !== undefined) {
            updateFields.push(`assigned_to = $${paramIndex}`);
            params.push(assignedTo ? parseInt(assignedTo) : null);
            paramIndex++;
        }

        if (githubIssueNumber !== undefined) {
            updateFields.push(`github_issue_number = $${paramIndex}`);
            params.push(githubIssueNumber ? parseInt(githubIssueNumber) : null);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateFields.push(`updatedat = CURRENT_TIMESTAMP`);
        params.push(parseInt(reportId));

        const query = `UPDATE reports SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        console.log(`📝 Report #${reportId} updated`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating report:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add comment to report
app.post('/api/reports/:reportId/comments', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId, commentText, isInternal = false } = req.body;

        if (!userId || !commentText) {
            return res.status(400).json({ error: 'userId and commentText are required' });
        }

        const result = await db.query(
            `INSERT INTO report_comments (report_id, user_id, comment_text, is_internal)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [parseInt(reportId), parseInt(userId), commentText, isInternal]
        );

        console.log(`💬 Comment added to report #${reportId} by user ${userId}`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Vote on report
app.post('/api/reports/:reportId/vote', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId, voteType } = req.body;

        if (!userId || !voteType) {
            return res.status(400).json({ error: 'userId and voteType are required' });
        }

        const validVoteTypes = ['upvote', 'important', 'me_too'];
        if (!validVoteTypes.includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        // Insert or update vote
        const result = await db.query(
            `INSERT INTO report_votes (report_id, user_id, vote_type)
             VALUES ($1, $2, $3)
             ON CONFLICT (report_id, user_id)
             DO UPDATE SET vote_type = $3
             RETURNING *`,
            [parseInt(reportId), parseInt(userId), voteType]
        );

        console.log(`👍 User ${userId} voted "${voteType}" on report #${reportId}`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error voting on report:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete report (admin only)
app.delete('/api/admin/reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;

        // Begin transaction
        await db.query('BEGIN');

        try {
            // Get attachments to delete files
            const attachments = await db.query(
                'SELECT filepath FROM report_attachments WHERE report_id = $1',
                [parseInt(reportId)]
            );

            // Delete attachment files
            for (const attachment of attachments.rows) {
                if (fs.existsSync(attachment.filepath)) {
                    fs.unlinkSync(attachment.filepath);
                }
            }

            // Delete report (cascades to attachments, comments, votes)
            const result = await db.query('DELETE FROM reports WHERE id = $1', [parseInt(reportId)]);

            if (result.rowCount === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Report not found' });
            }

            await db.query('COMMIT');

            console.log(`🗑️ Report #${reportId} deleted`);
            res.json({ message: 'Report deleted successfully' });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error deleting report:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get report statistics
app.get('/api/reports/stats/summary', async (req, res) => {
    try {
        // Count by status
        const statusCounts = await db.query(
            `SELECT status, COUNT(*) as count
             FROM reports
             GROUP BY status`
        );

        // Count by type
        const typeCounts = await db.query(
            `SELECT report_type, COUNT(*) as count
             FROM reports
             GROUP BY report_type`
        );

        // Count by priority
        const priorityCounts = await db.query(
            `SELECT priority, COUNT(*) as count
             FROM reports
             GROUP BY priority`
        );

        // Total reports
        const total = await db.query('SELECT COUNT(*) as count FROM reports');

        res.json({
            total: parseInt(total.rows[0].count),
            byStatus: statusCounts.rows,
            byType: typeCounts.rows,
            byPriority: priorityCounts.rows
        });
    } catch (err) {
        console.error('Error getting report stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// DAILY CHALLENGES SYSTEM ENDPOINTS
// ========================================

// Get daily challenges for user (auto-generate if not exist)
app.get('/api/challenges/daily/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if challenges exist for today
        let challenges = await db.query(
            `SELECT udc.*, ct.title, ct.description, ct.challenge_type, ct.difficulty, ct.icon, ct.reward_xp, ct.reward_coins
             FROM user_daily_challenges udc
             INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
             WHERE udc.user_id = $1 AND udc.challenge_date = $2
             ORDER BY ct.difficulty ASC`,
            [parseInt(userId), today]
        );

        // If no challenges for today, generate them
        if (challenges.rows.length === 0) {
            // Get random 3 templates (1 easy, 1 medium, 1 hard)
            const easyTemplate = await db.query(
                `SELECT * FROM challenge_templates WHERE difficulty = 'easy' AND is_active = true ORDER BY RANDOM() LIMIT 1`
            );
            const mediumTemplate = await db.query(
                `SELECT * FROM challenge_templates WHERE difficulty = 'medium' AND is_active = true ORDER BY RANDOM() LIMIT 1`
            );
            const hardTemplate = await db.query(
                `SELECT * FROM challenge_templates WHERE difficulty = 'hard' AND is_active = true ORDER BY RANDOM() LIMIT 1`
            );

            const templates = [
                ...easyTemplate.rows,
                ...mediumTemplate.rows,
                ...hardTemplate.rows
            ];

            // Create user challenges for today
            for (const template of templates) {
                await db.query(
                    `INSERT INTO user_daily_challenges (user_id, challenge_template_id, challenge_date, target_value)
                     VALUES ($1, $2, $3, $4)`,
                    [parseInt(userId), template.id, today, template.target_value]
                );
            }

            // Fetch newly created challenges
            challenges = await db.query(
                `SELECT udc.*, ct.title, ct.description, ct.challenge_type, ct.difficulty, ct.icon, ct.reward_xp, ct.reward_coins
                 FROM user_daily_challenges udc
                 INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
                 WHERE udc.user_id = $1 AND udc.challenge_date = $2
                 ORDER BY ct.difficulty ASC`,
                [parseInt(userId), today]
            );

            console.log(`🎯 Generated 3 daily challenges for user ${userId}`);
        }

        res.json(challenges.rows);
    } catch (err) {
        console.error('Error getting daily challenges:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update challenge progress
app.post('/api/challenges/progress', async (req, res) => {
    try {
        const { userId, challengeType, increment = 1, actionDetails } = req.body;
        const today = new Date().toISOString().split('T')[0];

        // Find user challenge by type and date
        const challenge = await db.query(
            `SELECT udc.* FROM user_daily_challenges udc
             INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
             WHERE udc.user_id = $1 AND ct.challenge_type = $2 AND udc.challenge_date = $3 AND udc.is_completed = false`,
            [parseInt(userId), challengeType, today]
        );

        if (challenge.rows.length === 0) {
            return res.json({ message: 'No active challenge found', updated: false });
        }

        const userChallenge = challenge.rows[0];
        const newProgress = userChallenge.current_progress + increment;
        const isCompleted = newProgress >= userChallenge.target_value;

        // Update progress
        await db.query(
            `UPDATE user_daily_challenges
             SET current_progress = $1, is_completed = $2, completed_at = $3
             WHERE id = $4`,
            [newProgress, isCompleted, isCompleted ? new Date() : null, userChallenge.id]
        );

        // Log progress
        await db.query(
            `INSERT INTO challenge_progress_log (user_challenge_id, progress_increment, action_type, action_details)
             VALUES ($1, $2, $3, $4)`,
            [userChallenge.id, increment, challengeType, actionDetails || '']
        );

        if (isCompleted) {
            console.log(`🎉 User ${userId} completed challenge: ${challengeType}`);
        }

        res.json({
            message: isCompleted ? 'Challenge completed!' : 'Progress updated',
            updated: true,
            progress: newProgress,
            target: userChallenge.target_value,
            completed: isCompleted
        });
    } catch (err) {
        console.error('Error updating challenge progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Claim challenge reward
app.post('/api/challenges/claim-reward/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const { userId } = req.body;

        // Get challenge details
        const challenge = await db.query(
            `SELECT udc.*, ct.reward_xp, ct.reward_coins, ct.title
             FROM user_daily_challenges udc
             INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
             WHERE udc.id = $1 AND udc.user_id = $2 AND udc.is_completed = true AND udc.reward_claimed = false`,
            [parseInt(challengeId), parseInt(userId)]
        );

        if (challenge.rows.length === 0) {
            return res.status(400).json({ error: 'Challenge not found or reward already claimed' });
        }

        const ch = challenge.rows[0];

        // Begin transaction
        await db.query('BEGIN');

        try {
            // Mark reward as claimed
            await db.query(
                'UPDATE user_daily_challenges SET reward_claimed = true WHERE id = $1',
                [parseInt(challengeId)]
            );

            // Award XP
            if (ch.reward_xp > 0) {
                await db.query(
                    'INSERT INTO xp_log (user_id, xp_amount, action_type, action_details) VALUES ($1, $2, $3, $4)',
                    [parseInt(userId), ch.reward_xp, 'challenge_complete', `Completed: ${ch.title}`]
                );

                await db.query(
                    'UPDATE user_stats SET total_xp = total_xp + $1 WHERE user_id = $2',
                    [ch.reward_xp, parseInt(userId)]
                );
            }

            // Award coins
            if (ch.reward_coins > 0) {
                // Get current balance
                const stats = await getUserStats(parseInt(userId));
                const currentBalance = stats.coins_balance || 0;
                const newBalance = currentBalance + ch.reward_coins;

                // Update balance
                await db.query(
                    'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
                    [newBalance, parseInt(userId)]
                );

                // Log transaction
                await db.query(
                    `INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [parseInt(userId), ch.reward_coins, 'earn', 'challenge', `Challenge reward: ${ch.title}`, newBalance]
                );

                console.log(`💰 User ${userId} earned ${ch.reward_coins} coins from challenge`);
            }

            await db.query('COMMIT');

            console.log(`🎁 User ${userId} claimed reward for challenge: ${ch.title}`);

            res.json({
                message: 'Reward claimed successfully',
                xp: ch.reward_xp,
                coins: ch.reward_coins
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error claiming challenge reward:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get challenge history
app.get('/api/challenges/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 30, offset = 0 } = req.query;

        const history = await db.query(
            `SELECT udc.*, ct.title, ct.description, ct.challenge_type, ct.difficulty, ct.icon, ct.reward_xp, ct.reward_coins
             FROM user_daily_challenges udc
             INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
             WHERE udc.user_id = $1
             ORDER BY udc.challenge_date DESC, udc.is_completed DESC
             LIMIT $2 OFFSET $3`,
            [parseInt(userId), parseInt(limit), parseInt(offset)]
        );

        // Get stats
        const stats = await db.query(
            `SELECT
                COUNT(*) as total_challenges,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_challenges,
                SUM(CASE WHEN is_completed = true AND reward_claimed = true THEN ct.reward_xp ELSE 0 END) as total_xp_earned
             FROM user_daily_challenges udc
             INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
             WHERE udc.user_id = $1`,
            [parseInt(userId)]
        );

        res.json({
            challenges: history.rows,
            stats: stats.rows[0]
        });
    } catch (err) {
        console.error('Error getting challenge history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create custom challenge template
app.post('/api/admin/challenges/template', async (req, res) => {
    try {
        const { challengeType, title, description, targetValue, rewardXp, rewardCoins, difficulty, icon } = req.body;

        if (!challengeType || !title || !targetValue) {
            return res.status(400).json({ error: 'challengeType, title, and targetValue are required' });
        }

        const result = await db.query(
            `INSERT INTO challenge_templates (challenge_type, title, description, target_value, reward_xp, reward_coins, difficulty, icon)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [challengeType, title, description || '', parseInt(targetValue), rewardXp || 0, rewardCoins || 0, difficulty || 'medium', icon || '🎯']
        );

        console.log(`✨ Created new challenge template: ${title}`);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating challenge template:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get challenge statistics
app.get('/api/challenges/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get completion rate by difficulty
        const byDifficulty = await db.query(
            `SELECT ct.difficulty,
                    COUNT(*) as total,
                    COUNT(CASE WHEN udc.is_completed = true THEN 1 END) as completed
             FROM user_daily_challenges udc
             INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
             WHERE udc.user_id = $1
             GROUP BY ct.difficulty`,
            [parseInt(userId)]
        );

        // Get completion rate by challenge type
        const byType = await db.query(
            `SELECT ct.challenge_type,
                    COUNT(*) as total,
                    COUNT(CASE WHEN udc.is_completed = true THEN 1 END) as completed
             FROM user_daily_challenges udc
             INNER JOIN challenge_templates ct ON udc.challenge_template_id = ct.id
             WHERE udc.user_id = $1
             GROUP BY ct.challenge_type`,
            [parseInt(userId)]
        );

        // Get current streak (consecutive days with at least 1 challenge completed)
        const streakResult = await db.query(
            `SELECT challenge_date
             FROM user_daily_challenges
             WHERE user_id = $1 AND is_completed = true
             GROUP BY challenge_date
             HAVING COUNT(*) > 0
             ORDER BY challenge_date DESC
             LIMIT 365`,
            [parseInt(userId)]
        );

        let challengeStreak = 0;
        const dates = streakResult.rows.map(row => row.challenge_date);
        for (let i = 0; i < dates.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            const expected = expectedDate.toISOString().split('T')[0];

            if (dates[i] === expected) {
                challengeStreak++;
            } else {
                break;
            }
        }

        res.json({
            byDifficulty: byDifficulty.rows,
            byType: byType.rows,
            challengeStreak
        });
    } catch (err) {
        console.error('Error getting challenge stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// COINS ECONOMY SYSTEM ENDPOINTS
// ========================================

// Get user coins balance
app.get('/api/coins/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await db.query(
            'SELECT coins_balance FROM user_stats WHERE user_id = $1',
            [parseInt(userId)]
        );

        if (stats.rows.length === 0) {
            return res.json({ balance: 0 });
        }

        res.json({ balance: stats.rows[0].coins_balance || 0 });
    } catch (err) {
        console.error('Error getting coins balance:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add coins to user (earn coins)
app.post('/api/coins/earn', async (req, res) => {
    try {
        const { userId, amount, source, description } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'userId and positive amount are required' });
        }

        await db.query('BEGIN');

        try {
            // Get current balance
            const stats = await getUserStats(parseInt(userId));
            const currentBalance = stats.coins_balance || 0;
            const newBalance = currentBalance + amount;

            // Update balance
            await db.query(
                'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
                [newBalance, parseInt(userId)]
            );

            // Log transaction
            await db.query(
                `INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [parseInt(userId), amount, 'earn', source || 'manual', description || '', newBalance]
            );

            await db.query('COMMIT');

            console.log(`💰 User ${userId} earned ${amount} coins (${source})`);

            res.json({
                message: 'Coins earned successfully',
                amount,
                newBalance
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error earning coins:', err);
        res.status(500).json({ error: err.message });
    }
});

// Spend coins (generic endpoint)
app.post('/api/coins/spend', async (req, res) => {
    try {
        const { userId, amount, source, description } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'userId and positive amount are required' });
        }

        await db.query('BEGIN');

        try {
            // Get current balance
            const stats = await getUserStats(parseInt(userId));
            const currentBalance = stats.coins_balance || 0;

            if (currentBalance < amount) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: 'Insufficient funds', balance: currentBalance, required: amount });
            }

            const newBalance = currentBalance - amount;

            // Update balance
            await db.query(
                'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
                [newBalance, parseInt(userId)]
            );

            // Log transaction
            await db.query(
                `INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [parseInt(userId), -amount, 'spend', source || 'manual', description || '', newBalance]
            );

            await db.query('COMMIT');

            console.log(`💸 User ${userId} spent ${amount} coins (${source})`);

            res.json({
                message: 'Coins spent successfully',
                amount,
                newBalance
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error spending coins:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get coin transaction history
app.get('/api/coins/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const history = await db.query(
            `SELECT * FROM coin_transactions
             WHERE user_id = $1
             ORDER BY createdat DESC
             LIMIT $2 OFFSET $3`,
            [parseInt(userId), parseInt(limit), parseInt(offset)]
        );

        res.json(history.rows);
    } catch (err) {
        console.error('Error getting coin history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get shop items
app.get('/api/shop/items', async (req, res) => {
    try {
        const { category, type } = req.query;

        let query = 'SELECT * FROM shop_items WHERE is_active = true';
        let params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (type) {
            query += ` AND item_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        query += ' ORDER BY category, price_coins ASC';

        const items = await db.query(query, params);
        res.json(items.rows);
    } catch (err) {
        console.error('Error getting shop items:', err);
        res.status(500).json({ error: err.message });
    }
});

// Purchase item from shop
app.post('/api/shop/purchase', async (req, res) => {
    try {
        const { userId, itemKey, quantity = 1 } = req.body;

        if (!userId || !itemKey) {
            return res.status(400).json({ error: 'userId and itemKey are required' });
        }

        await db.query('BEGIN');

        try {
            // Get item details
            const item = await db.query(
                'SELECT * FROM shop_items WHERE item_key = $1 AND is_active = true',
                [itemKey]
            );

            if (item.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(404).json({ error: 'Item not found or not available' });
            }

            const shopItem = item.rows[0];
            const totalCost = shopItem.price_coins * quantity;

            // Check stock
            if (shopItem.is_limited && shopItem.stock_quantity < quantity) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: 'Insufficient stock', available: shopItem.stock_quantity });
            }

            // Check balance
            const stats = await getUserStats(parseInt(userId));
            const currentBalance = stats.coins_balance || 0;

            if (currentBalance < totalCost) {
                await db.query('ROLLBACK');
                return res.status(400).json({ error: 'Insufficient funds', balance: currentBalance, required: totalCost });
            }

            const newBalance = currentBalance - totalCost;

            // Update balance
            await db.query(
                'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
                [newBalance, parseInt(userId)]
            );

            // Log transaction
            await db.query(
                `INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [parseInt(userId), -totalCost, 'purchase', 'shop', `Purchased: ${shopItem.name} x${quantity}`, newBalance]
            );

            // Create purchase record
            const expiresAt = shopItem.item_type === 'booster' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
            const purchaseResult = await db.query(
                `INSERT INTO user_purchases (user_id, shop_item_id, quantity, total_cost, expiresAt)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [parseInt(userId), shopItem.id, quantity, totalCost, expiresAt]
            );

            // Update stock if limited
            if (shopItem.is_limited) {
                await db.query(
                    'UPDATE shop_items SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                    [quantity, shopItem.id]
                );
            }

            await db.query('COMMIT');

            console.log(`🛒 User ${userId} purchased ${shopItem.name} x${quantity} for ${totalCost} coins`);

            res.json({
                message: 'Purchase successful',
                purchase: purchaseResult.rows[0],
                item: shopItem,
                newBalance
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error purchasing item:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's purchases/inventory
app.get('/api/shop/inventory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { activeOnly = 'true' } = req.query;

        let query = `
            SELECT up.*, si.name, si.description, si.icon, si.item_type, si.category
            FROM user_purchases up
            INNER JOIN shop_items si ON up.shop_item_id = si.id
            WHERE up.user_id = $1
        `;

        if (activeOnly === 'true') {
            query += ` AND up.is_active = true AND (up.expiresAt IS NULL OR up.expiresAt > NOW())`;
        }

        query += ' ORDER BY up.purchasedat DESC';

        const inventory = await db.query(query, [parseInt(userId)]);
        res.json(inventory.rows);
    } catch (err) {
        console.error('Error getting user inventory:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// LEADERBOARDS SYSTEM ENDPOINTS
// ========================================

// Get global leaderboard (top 100)
app.get('/api/leaderboard/global/:type', async (req, res) => {
    try {
        const { type } = req.params; // xp, streak, words
        const { period = 'all_time', limit = 100 } = req.query;

        let query, params;

        if (type === 'xp') {
            query = `
                SELECT u.id, u.name, u.email, us.total_xp as score, us.level
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                ORDER BY us.total_xp DESC
                LIMIT $1
            `;
            params = [parseInt(limit)];
        } else if (type === 'streak') {
            query = `
                SELECT u.id, u.name, u.email, us.current_streak as score, us.longest_streak
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE us.current_streak > 0
                ORDER BY us.current_streak DESC, us.longest_streak DESC
                LIMIT $1
            `;
            params = [parseInt(limit)];
        } else if (type === 'words') {
            query = `
                SELECT u.id, u.name, u.email, us.total_words_learned as score
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE us.total_words_learned > 0
                ORDER BY us.total_words_learned DESC
                LIMIT $1
            `;
            params = [parseInt(limit)];
        } else {
            return res.status(400).json({ error: 'Invalid leaderboard type. Use: xp, streak, or words' });
        }

        const leaderboard = await db.query(query, params);

        // Add rank position
        const rankedLeaderboard = leaderboard.rows.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        res.json(rankedLeaderboard);
    } catch (err) {
        console.error('Error getting global leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's position in leaderboard
app.get('/api/leaderboard/position/:userId/:type', async (req, res) => {
    try {
        const { userId, type } = req.params;

        let query, params;

        if (type === 'xp') {
            query = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, us.total_xp as score,
                           ROW_NUMBER() OVER (ORDER BY us.total_xp DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                )
                SELECT rank, score FROM ranked_users WHERE id = $1
            `;
        } else if (type === 'streak') {
            query = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, us.current_streak as score,
                           ROW_NUMBER() OVER (ORDER BY us.current_streak DESC, us.longest_streak DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                    WHERE us.current_streak > 0
                )
                SELECT rank, score FROM ranked_users WHERE id = $1
            `;
        } else if (type === 'words') {
            query = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, us.total_words_learned as score,
                           ROW_NUMBER() OVER (ORDER BY us.total_words_learned DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                    WHERE us.total_words_learned > 0
                )
                SELECT rank, score FROM ranked_users WHERE id = $1
            `;
        } else {
            return res.status(400).json({ error: 'Invalid leaderboard type' });
        }

        params = [parseInt(userId)];
        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.json({ rank: null, score: 0, message: 'Not ranked yet' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error getting user position:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get nearby users in leaderboard (users around your rank)
app.get('/api/leaderboard/nearby/:userId/:type', async (req, res) => {
    try {
        const { userId, type } = req.params;
        const { range = 5 } = req.query; // Show ±5 users around you

        // First get user's rank
        let rankQuery, scoreField;

        if (type === 'xp') {
            scoreField = 'total_xp';
            rankQuery = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, u.email, us.total_xp as score, us.level,
                           ROW_NUMBER() OVER (ORDER BY us.total_xp DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                )
                SELECT * FROM ranked_users WHERE id = $1
            `;
        } else if (type === 'streak') {
            scoreField = 'current_streak';
            rankQuery = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, u.email, us.current_streak as score, us.longest_streak,
                           ROW_NUMBER() OVER (ORDER BY us.current_streak DESC, us.longest_streak DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                    WHERE us.current_streak > 0
                )
                SELECT * FROM ranked_users WHERE id = $1
            `;
        } else if (type === 'words') {
            scoreField = 'total_words_learned';
            rankQuery = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, u.email, us.total_words_learned as score,
                           ROW_NUMBER() OVER (ORDER BY us.total_words_learned DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                    WHERE us.total_words_learned > 0
                )
                SELECT * FROM ranked_users WHERE id = $1
            `;
        } else {
            return res.status(400).json({ error: 'Invalid leaderboard type' });
        }

        const userRankResult = await db.query(rankQuery, [parseInt(userId)]);

        if (userRankResult.rows.length === 0) {
            return res.json({ message: 'User not ranked yet', nearby: [] });
        }

        const userRank = userRankResult.rows[0].rank;
        const rangeNum = parseInt(range);

        // Get users in range
        let nearbyQuery;
        if (type === 'xp') {
            nearbyQuery = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, u.email, us.total_xp as score, us.level,
                           ROW_NUMBER() OVER (ORDER BY us.total_xp DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                )
                SELECT * FROM ranked_users
                WHERE rank BETWEEN $1 AND $2
                ORDER BY rank ASC
            `;
        } else if (type === 'streak') {
            nearbyQuery = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, u.email, us.current_streak as score, us.longest_streak,
                           ROW_NUMBER() OVER (ORDER BY us.current_streak DESC, us.longest_streak DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                    WHERE us.current_streak > 0
                )
                SELECT * FROM ranked_users
                WHERE rank BETWEEN $1 AND $2
                ORDER BY rank ASC
            `;
        } else {
            nearbyQuery = `
                WITH ranked_users AS (
                    SELECT u.id, u.name, u.email, us.total_words_learned as score,
                           ROW_NUMBER() OVER (ORDER BY us.total_words_learned DESC) as rank
                    FROM users u
                    INNER JOIN user_stats us ON u.id = us.user_id
                    WHERE us.total_words_learned > 0
                )
                SELECT * FROM ranked_users
                WHERE rank BETWEEN $1 AND $2
                ORDER BY rank ASC
            `;
        }

        const minRank = Math.max(1, userRank - rangeNum);
        const maxRank = userRank + rangeNum;

        const nearby = await db.query(nearbyQuery, [minRank, maxRank]);

        res.json({
            userRank,
            nearby: nearby.rows
        });
    } catch (err) {
        console.error('Error getting nearby leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get leaderboard statistics
app.get('/api/leaderboard/stats', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT
                COUNT(DISTINCT u.id) as total_users,
                MAX(us.total_xp) as highest_xp,
                MAX(us.current_streak) as longest_active_streak,
                MAX(us.total_words_learned) as most_words_learned,
                AVG(us.total_xp)::INTEGER as avg_xp,
                AVG(us.total_words_learned)::INTEGER as avg_words
            FROM users u
            INNER JOIN user_stats us ON u.id = us.user_id
        `);

        res.json(stats.rows[0]);
    } catch (err) {
        console.error('Error getting leaderboard stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// COINS ECONOMY SYSTEM ENDPOINTS
// ========================================

// Get user's coin balance
app.get('/api/coins/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await db.query(
            'SELECT coins_balance FROM user_stats WHERE user_id = $1',
            [parseInt(userId)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ coins_balance: result.rows[0].coins_balance || 0 });
    } catch (err) {
        console.error('Error getting coin balance:', err);
        res.status(500).json({ error: err.message });
    }
});

// Earn coins (add coins to balance)
app.post('/api/coins/earn', async (req, res) => {
    try {
        const { userId, amount, source, description } = req.body;

        if (!userId || !amount || !source) {
            return res.status(400).json({ error: 'Missing required fields: userId, amount, source' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        await db.query('BEGIN');

        // Get current balance
        const balanceResult = await db.query(
            'SELECT coins_balance FROM user_stats WHERE user_id = $1',
            [parseInt(userId)]
        );

        if (balanceResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = balanceResult.rows[0].coins_balance || 0;
        const newBalance = currentBalance + parseInt(amount);

        // Update balance
        await db.query(
            'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
            [newBalance, parseInt(userId)]
        );

        // Log transaction
        const transactionResult = await db.query(`
            INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
            VALUES ($1, $2, 'earn', $3, $4, $5)
            RETURNING *
        `, [parseInt(userId), parseInt(amount), source, description || '', newBalance]);

        await db.query('COMMIT');

        res.json({
            success: true,
            transaction: transactionResult.rows[0],
            new_balance: newBalance
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error earning coins:', err);
        res.status(500).json({ error: err.message });
    }
});

// Spend coins (deduct coins from balance)
app.post('/api/coins/spend', async (req, res) => {
    try {
        const { userId, amount, source, description } = req.body;

        if (!userId || !amount || !source) {
            return res.status(400).json({ error: 'Missing required fields: userId, amount, source' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        await db.query('BEGIN');

        // Get current balance
        const balanceResult = await db.query(
            'SELECT coins_balance FROM user_stats WHERE user_id = $1',
            [parseInt(userId)]
        );

        if (balanceResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = balanceResult.rows[0].coins_balance || 0;

        // Check sufficient funds
        if (currentBalance < parseInt(amount)) {
            await db.query('ROLLBACK');
            return res.status(400).json({
                error: 'Insufficient coins',
                current_balance: currentBalance,
                required: parseInt(amount)
            });
        }

        const newBalance = currentBalance - parseInt(amount);

        // Update balance
        await db.query(
            'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
            [newBalance, parseInt(userId)]
        );

        // Log transaction
        const transactionResult = await db.query(`
            INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
            VALUES ($1, $2, 'spend', $3, $4, $5)
            RETURNING *
        `, [parseInt(userId), parseInt(amount), source, description || '', newBalance]);

        await db.query('COMMIT');

        res.json({
            success: true,
            transaction: transactionResult.rows[0],
            new_balance: newBalance
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error spending coins:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get shop items (all active items or filtered by category)
app.get('/api/coins/shop', async (req, res) => {
    try {
        const { category, item_type } = req.query;

        let query = 'SELECT * FROM shop_items WHERE is_active = true';
        let params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (item_type) {
            query += ` AND item_type = $${paramIndex}`;
            params.push(item_type);
            paramIndex++;
        }

        query += ' ORDER BY category, price_coins ASC';

        const result = await db.query(query, params);

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting shop items:', err);
        res.status(500).json({ error: err.message });
    }
});

// Purchase shop item
app.post('/api/coins/purchase', async (req, res) => {
    try {
        const { userId, shopItemId, quantity = 1 } = req.body;

        if (!userId || !shopItemId) {
            return res.status(400).json({ error: 'Missing required fields: userId, shopItemId' });
        }

        await db.query('BEGIN');

        // Get shop item
        const itemResult = await db.query(
            'SELECT * FROM shop_items WHERE id = $1 AND is_active = true',
            [parseInt(shopItemId)]
        );

        if (itemResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Shop item not found or inactive' });
        }

        const item = itemResult.rows[0];
        const totalCost = item.price_coins * parseInt(quantity);

        // Check stock for limited items
        if (item.is_limited && item.stock_quantity < parseInt(quantity)) {
            await db.query('ROLLBACK');
            return res.status(400).json({
                error: 'Insufficient stock',
                available: item.stock_quantity,
                requested: parseInt(quantity)
            });
        }

        // Get user balance
        const balanceResult = await db.query(
            'SELECT coins_balance FROM user_stats WHERE user_id = $1',
            [parseInt(userId)]
        );

        if (balanceResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = balanceResult.rows[0].coins_balance || 0;

        // Check sufficient funds
        if (currentBalance < totalCost) {
            await db.query('ROLLBACK');
            return res.status(400).json({
                error: 'Insufficient coins',
                current_balance: currentBalance,
                required: totalCost
            });
        }

        const newBalance = currentBalance - totalCost;

        // Update balance
        await db.query(
            'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
            [newBalance, parseInt(userId)]
        );

        // Update stock for limited items
        if (item.is_limited) {
            await db.query(
                'UPDATE shop_items SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [parseInt(quantity), parseInt(shopItemId)]
            );
        }

        // Calculate expiration for time-limited items (boosters, freezes)
        let expiresAt = null;
        if (item.category === 'boosters') {
            // 24 hours
            expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (item.category === 'streak') {
            // Extract days from item_key (e.g., "streak_freeze_1" -> 1 day)
            const days = parseInt(item.item_key.split('_')[2]) || 1;
            expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }

        // Create purchase record
        const purchaseResult = await db.query(`
            INSERT INTO user_purchases (user_id, shop_item_id, quantity, total_cost, is_active, expiresAt)
            VALUES ($1, $2, $3, $4, true, $5)
            RETURNING *
        `, [parseInt(userId), parseInt(shopItemId), parseInt(quantity), totalCost, expiresAt]);

        // Log transaction
        await db.query(`
            INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
            VALUES ($1, $2, 'spend', 'shop_purchase', $3, $4)
        `, [parseInt(userId), totalCost, `Purchased: ${item.name} x${quantity}`, newBalance]);

        await db.query('COMMIT');

        res.json({
            success: true,
            purchase: purchaseResult.rows[0],
            item: item,
            new_balance: newBalance
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error purchasing item:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get transaction history
app.get('/api/coins/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const result = await db.query(`
            SELECT * FROM coin_transactions
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT $2 OFFSET $3
        `, [parseInt(userId), parseInt(limit), parseInt(offset)]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting transaction history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's purchases (active items)
app.get('/api/coins/purchases/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { active_only = 'true' } = req.query;

        let query = `
            SELECT up.*, si.name, si.description, si.icon, si.category, si.item_type, si.item_key
            FROM user_purchases up
            INNER JOIN shop_items si ON up.shop_item_id = si.id
            WHERE up.user_id = $1
        `;

        if (active_only === 'true') {
            query += ` AND up.is_active = true`;
            query += ` AND (up.expiresAt IS NULL OR up.expiresAt > NOW())`;
        }

        query += ` ORDER BY up.purchasedAt DESC`;

        const result = await db.query(query, [parseInt(userId)]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error getting user purchases:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// FRIENDS SYSTEM ENDPOINTS
// ========================================

// Send friend request
app.post('/api/friends/request', async (req, res) => {
    try {
        const { userId, friendId } = req.body;

        if (!userId || !friendId) {
            return res.status(400).json({ error: 'Missing required fields: userId, friendId' });
        }

        if (parseInt(userId) === parseInt(friendId)) {
            return res.status(400).json({ error: 'Cannot send friend request to yourself' });
        }

        // Check if friend exists
        const friendCheck = await db.query('SELECT id FROM users WHERE id = $1', [parseInt(friendId)]);
        if (friendCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if friendship already exists (in either direction)
        const existingFriendship = await db.query(
            'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [parseInt(userId), parseInt(friendId)]
        );

        if (existingFriendship.rows.length > 0) {
            const status = existingFriendship.rows[0].status;
            if (status === 'accepted') {
                return res.status(400).json({ error: 'Already friends' });
            } else if (status === 'pending') {
                return res.status(400).json({ error: 'Friend request already pending' });
            } else if (status === 'blocked') {
                return res.status(400).json({ error: 'Cannot send friend request' });
            }
        }

        // Create friend request
        const result = await db.query(`
            INSERT INTO friendships (user_id, friend_id, status)
            VALUES ($1, $2, 'pending')
            RETURNING *
        `, [parseInt(userId), parseInt(friendId)]);

        // Log activity
        await db.query(`
            INSERT INTO friend_activities (user_id, activity_type, activity_data)
            VALUES ($1, 'friend_request_sent', $2)
        `, [parseInt(userId), JSON.stringify({ friend_id: parseInt(friendId) })]);

        res.json({
            success: true,
            friendship: result.rows[0]
        });
    } catch (err) {
        console.error('Error sending friend request:', err);
        res.status(500).json({ error: err.message });
    }
});

// Accept friend request
app.post('/api/friends/accept/:friendshipId', async (req, res) => {
    try {
        const { friendshipId } = req.params;
        const { userId } = req.body;

        // Get friendship
        const friendship = await db.query(
            'SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
            [parseInt(friendshipId), parseInt(userId), 'pending']
        );

        if (friendship.rows.length === 0) {
            return res.status(404).json({ error: 'Friend request not found or already processed' });
        }

        // Accept friendship
        const result = await db.query(`
            UPDATE friendships
            SET status = 'accepted', acceptedAt = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [parseInt(friendshipId)]);

        // Log activities for both users
        await db.query(`
            INSERT INTO friend_activities (user_id, activity_type, activity_data)
            VALUES ($1, 'friend_request_accepted', $2)
        `, [parseInt(userId), JSON.stringify({ friend_id: friendship.rows[0].user_id })]);

        await db.query(`
            INSERT INTO friend_activities (user_id, activity_type, activity_data)
            VALUES ($1, 'became_friends', $2)
        `, [friendship.rows[0].user_id, JSON.stringify({ friend_id: parseInt(userId) })]);

        res.json({
            success: true,
            friendship: result.rows[0]
        });
    } catch (err) {
        console.error('Error accepting friend request:', err);
        res.status(500).json({ error: err.message });
    }
});

// Decline friend request
app.post('/api/friends/decline/:friendshipId', async (req, res) => {
    try {
        const { friendshipId } = req.params;
        const { userId } = req.body;

        // Verify the request is for this user
        const friendship = await db.query(
            'SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
            [parseInt(friendshipId), parseInt(userId), 'pending']
        );

        if (friendship.rows.length === 0) {
            return res.status(404).json({ error: 'Friend request not found or already processed' });
        }

        // Delete friendship
        await db.query('DELETE FROM friendships WHERE id = $1', [parseInt(friendshipId)]);

        res.json({ success: true, message: 'Friend request declined' });
    } catch (err) {
        console.error('Error declining friend request:', err);
        res.status(500).json({ error: err.message });
    }
});

// Remove friend (unfriend)
app.delete('/api/friends/:friendshipId', async (req, res) => {
    try {
        const { friendshipId } = req.params;
        const { userId } = req.body;

        // Verify the friendship involves this user
        const friendship = await db.query(
            'SELECT * FROM friendships WHERE id = $1 AND (user_id = $2 OR friend_id = $2)',
            [parseInt(friendshipId), parseInt(userId)]
        );

        if (friendship.rows.length === 0) {
            return res.status(404).json({ error: 'Friendship not found' });
        }

        // Delete friendship
        await db.query('DELETE FROM friendships WHERE id = $1', [parseInt(friendshipId)]);

        res.json({ success: true, message: 'Friend removed' });
    } catch (err) {
        console.error('Error removing friend:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get friends list (accepted friendships only)
app.get('/api/friends/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const friends = await db.query(`
            SELECT
                f.id as friendship_id,
                f.acceptedAt,
                u.id as user_id,
                u.name,
                u.email,
                us.total_xp,
                us.level,
                us.current_streak,
                us.total_words_learned
            FROM friendships f
            INNER JOIN users u ON (
                CASE
                    WHEN f.user_id = $1 THEN u.id = f.friend_id
                    WHEN f.friend_id = $1 THEN u.id = f.user_id
                END
            )
            LEFT JOIN user_stats us ON u.id = us.user_id
            WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
            ORDER BY f.acceptedAt DESC
        `, [parseInt(userId)]);

        res.json(friends.rows);
    } catch (err) {
        console.error('Error getting friends list:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get pending friend requests (received)
app.get('/api/friends/requests/received/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const requests = await db.query(`
            SELECT
                f.id as friendship_id,
                f.requestedAt,
                u.id as user_id,
                u.name,
                u.email,
                us.total_xp,
                us.level
            FROM friendships f
            INNER JOIN users u ON u.id = f.user_id
            LEFT JOIN user_stats us ON u.id = us.user_id
            WHERE f.friend_id = $1 AND f.status = 'pending'
            ORDER BY f.requestedAt DESC
        `, [parseInt(userId)]);

        res.json(requests.rows);
    } catch (err) {
        console.error('Error getting received friend requests:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get pending friend requests (sent)
app.get('/api/friends/requests/sent/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const requests = await db.query(`
            SELECT
                f.id as friendship_id,
                f.requestedAt,
                u.id as user_id,
                u.name,
                u.email,
                us.total_xp,
                us.level
            FROM friendships f
            INNER JOIN users u ON u.id = f.friend_id
            LEFT JOIN user_stats us ON u.id = us.user_id
            WHERE f.user_id = $1 AND f.status = 'pending'
            ORDER BY f.requestedAt DESC
        `, [parseInt(userId)]);

        res.json(requests.rows);
    } catch (err) {
        console.error('Error getting sent friend requests:', err);
        res.status(500).json({ error: err.message });
    }
});

// Search users by name or email (for adding friends)
app.get('/api/friends/search', async (req, res) => {
    try {
        const { query, userId } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const users = await db.query(`
            SELECT
                u.id,
                u.name,
                u.email,
                us.total_xp,
                us.level,
                CASE
                    WHEN f1.id IS NOT NULL THEN 'friends'
                    WHEN f2.id IS NOT NULL THEN 'request_sent'
                    WHEN f3.id IS NOT NULL THEN 'request_received'
                    ELSE 'none'
                END as friendship_status
            FROM users u
            LEFT JOIN user_stats us ON u.id = us.user_id
            LEFT JOIN friendships f1 ON ((f1.user_id = $2 AND f1.friend_id = u.id) OR (f1.friend_id = $2 AND f1.user_id = u.id)) AND f1.status = 'accepted'
            LEFT JOIN friendships f2 ON f2.user_id = $2 AND f2.friend_id = u.id AND f2.status = 'pending'
            LEFT JOIN friendships f3 ON f3.friend_id = $2 AND f3.user_id = u.id AND f3.status = 'pending'
            WHERE (LOWER(u.name) LIKE LOWER($1) OR LOWER(u.email) LIKE LOWER($1)) AND u.id != $2
            LIMIT 20
        `, [`%${query}%`, parseInt(userId)]);

        res.json(users.rows);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get friend activity feed
app.get('/api/friends/activities/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Get activities from friends
        const activities = await db.query(`
            SELECT
                fa.*,
                u.name as user_name
            FROM friend_activities fa
            INNER JOIN users u ON fa.user_id = u.id
            WHERE fa.user_id IN (
                SELECT CASE
                    WHEN f.user_id = $1 THEN f.friend_id
                    WHEN f.friend_id = $1 THEN f.user_id
                END
                FROM friendships f
                WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
            )
            ORDER BY fa.createdAt DESC
            LIMIT $2 OFFSET $3
        `, [parseInt(userId), parseInt(limit), parseInt(offset)]);

        res.json(activities.rows);
    } catch (err) {
        console.error('Error getting friend activities:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// ACHIEVEMENTS SYSTEM ENDPOINTS
// ========================================

// Get all achievements (with user progress if userId provided)
app.get('/api/achievements', async (req, res) => {
    try {
        const { userId, category } = req.query;

        let query = 'SELECT * FROM achievements WHERE is_active = true';
        let params = [];

        if (category) {
            query += ' AND category = $1';
            params.push(category);
        }

        // Filter out secret achievements if no userId (don't show them in public list)
        if (!userId) {
            query += params.length > 0 ? ' AND is_secret = false' : ' WHERE is_secret = false';
        }

        query += ' ORDER BY difficulty, category';

        const achievements = await db.query(query, params);

        // If userId provided, include user progress
        if (userId) {
            const userAchievements = await db.query(
                'SELECT * FROM user_achievements WHERE user_id = $1',
                [parseInt(userId)]
            );

            const userAchievementsMap = {};
            userAchievements.rows.forEach(ua => {
                userAchievementsMap[ua.achievement_id] = ua;
            });

            const enrichedAchievements = achievements.rows.map(ach => ({
                ...ach,
                user_progress: userAchievementsMap[ach.id] || {
                    progress: 0,
                    target: ach.target || 1,
                    is_unlocked: false
                }
            }));

            res.json(enrichedAchievements);
        } else {
            res.json(achievements.rows);
        }
    } catch (err) {
        console.error('Error getting achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's unlocked achievements
app.get('/api/achievements/unlocked/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const unlocked = await db.query(`
            SELECT ua.*, a.title, a.description, a.icon, a.category, a.difficulty, a.reward_xp, a.reward_coins
            FROM user_achievements ua
            INNER JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1 AND ua.is_unlocked = true
            ORDER BY ua.unlockedAt DESC
        `, [parseInt(userId)]);

        res.json(unlocked.rows);
    } catch (err) {
        console.error('Error getting unlocked achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update achievement progress (and unlock if target reached)
app.post('/api/achievements/progress', async (req, res) => {
    try {
        const { userId, achievementKey, increment = 1 } = req.body;

        if (!userId || !achievementKey) {
            return res.status(400).json({ error: 'Missing required fields: userId, achievementKey' });
        }

        await db.query('BEGIN');

        // Get achievement
        const achievement = await db.query(
            'SELECT * FROM achievements WHERE achievement_key = $1 AND is_active = true',
            [achievementKey]
        );

        if (achievement.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Achievement not found' });
        }

        const ach = achievement.rows[0];

        // Get or create user achievement
        let userAchievement = await db.query(
            'SELECT * FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
            [parseInt(userId), ach.id]
        );

        if (userAchievement.rows.length === 0) {
            // Create new user achievement
            userAchievement = await db.query(`
                INSERT INTO user_achievements (user_id, achievement_id, progress, target)
                VALUES ($1, $2, 0, 1)
                RETURNING *
            `, [parseInt(userId), ach.id]);
        }

        const ua = userAchievement.rows[0];

        // If already unlocked, skip
        if (ua.is_unlocked) {
            await db.query('COMMIT');
            return res.json({ message: 'Achievement already unlocked', achievement: ua });
        }

        // Update progress
        const newProgress = ua.progress + parseInt(increment);
        const targetValue = ua.target;

        const isNowUnlocked = newProgress >= targetValue;

        if (isNowUnlocked) {
            // Unlock achievement and award rewards
            await db.query(`
                UPDATE user_achievements
                SET progress = $1, is_unlocked = true, unlockedAt = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [newProgress, ua.id]);

            // Award XP
            if (ach.reward_xp > 0) {
                await db.query(
                    'INSERT INTO xp_log (user_id, xp_amount, action_type, action_details) VALUES ($1, $2, $3, $4)',
                    [parseInt(userId), ach.reward_xp, 'achievement_unlocked', `Unlocked: ${ach.title}`]
                );

                await db.query(
                    'UPDATE user_stats SET total_xp = total_xp + $1 WHERE user_id = $2',
                    [ach.reward_xp, parseInt(userId)]
                );
            }

            // Award coins
            if (ach.reward_coins > 0) {
                const stats = await getUserStats(parseInt(userId));
                const currentBalance = stats.coins_balance || 0;
                const newBalance = currentBalance + ach.reward_coins;

                await db.query(
                    'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
                    [newBalance, parseInt(userId)]
                );

                await db.query(`
                    INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
                    VALUES ($1, $2, 'earn', 'achievement', $3, $4)
                `, [parseInt(userId), ach.reward_coins, `Achievement: ${ach.title}`, newBalance]);
            }

            await db.query('COMMIT');

            console.log(`🏆 User ${userId} unlocked achievement: ${ach.title}`);

            res.json({
                unlocked: true,
                achievement: ach,
                rewards: {
                    xp: ach.reward_xp,
                    coins: ach.reward_coins
                }
            });
        } else {
            // Just update progress
            await db.query(
                'UPDATE user_achievements SET progress = $1 WHERE id = $2',
                [newProgress, ua.id]
            );

            await db.query('COMMIT');

            res.json({
                unlocked: false,
                progress: newProgress,
                target: targetValue
            });
        }
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error updating achievement progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get achievement stats for user
app.get('/api/achievements/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE is_unlocked = true) as unlocked_count,
                COUNT(*) as total_assigned,
                SUM(CASE WHEN is_unlocked = true THEN a.reward_xp ELSE 0 END) as total_xp_earned,
                SUM(CASE WHEN is_unlocked = true THEN a.reward_coins ELSE 0 END) as total_coins_earned
            FROM user_achievements ua
            INNER JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1
        `, [parseInt(userId)]);

        const totalAchievements = await db.query(
            'SELECT COUNT(*) as count FROM achievements WHERE is_active = true'
        );

        res.json({
            ...stats.rows[0],
            total_achievements: parseInt(totalAchievements.rows[0].count)
        });
    } catch (err) {
        console.error('Error getting achievement stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create custom achievement
app.post('/api/admin/achievements', async (req, res) => {
    try {
        const { achievement_key, title, description, icon, category, difficulty, reward_xp, reward_coins, is_secret } = req.body;

        if (!achievement_key || !title) {
            return res.status(400).json({ error: 'Missing required fields: achievement_key, title' });
        }

        const result = await db.query(`
            INSERT INTO achievements (achievement_key, title, description, icon, category, difficulty, reward_xp, reward_coins, is_secret)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [achievement_key, title, description || '', icon || '🏆', category || 'custom', difficulty || 'medium', reward_xp || 0, reward_coins || 0, is_secret || false]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating achievement:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// WORDS ENDPOINTS
// ========================================

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