const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const textToSpeech = require('@google-cloud/text-to-speech');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway/production deployment
app.set('trust proxy', 1);

// Simple logging system for production
const logger = {
    info: (message) => {
        if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOGS === 'true') {
            console.log(`[INFO] ${message}`);
        }
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error || '');
    },
    warn: (message) => {
        console.warn(`[WARN] ${message}`);
    },
    debug: (message) => {
        if (process.env.DEBUG === 'true') {
            console.log(`[DEBUG] ${message}`);
        }
    }
};

// Database setup
const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
// Response compression (gzip/brotli) - reduces bandwidth by ~70-90%
app.use(compression({
    filter: (req, res) => {
        // Compress all text-based responses (JSON, HTML, CSS, JS)
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Compression level (0-9, default 6 is balanced)
    threshold: 1024 // Only compress responses larger than 1KB
}));

// Rate limiting - DDoS protection
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per 15 minutes (increased for active learning)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for localhost and automated tests
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    skipSuccessfulRequests: true, // Don't count successful requests
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // Limit each IP to 300 requests per minute (5 per second for active learning)
    message: 'Too many API requests, please slow down.',
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Security headers - Helmet.js
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            mediaSrc: ["'self'", "blob:", "https://ssl.gstatic.com", "https://*.gstatic.com"],
            connectSrc: ["'self'", "http://localhost:3000", "http://localhost:*", "ws://localhost:*", "wss://localhost:*", "chrome-extension:", "moz-extension:", "chrome-extension://*", "moz-extension://*"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            scriptSrcAttr: ["'unsafe-inline'"]
            // upgradeInsecureRequests explicitly NOT included for localhost development
        }
    },
    crossOriginEmbedderPolicy: false, // Disable for external resources
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny' // Prevent clickjacking
    },
    xssFilter: true, // Enable XSS filter
    noSniff: true, // Prevent MIME type sniffing
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));

app.use(cors());
app.use(express.json());

// Session configuration (required for Passport)
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists
            let user = await db.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);

            if (user.rows.length > 0) {
                // User exists, return user
                return done(null, user.rows[0]);
            }

            // Check if email already exists (user registered with password)
            const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);

            if (emailCheck.rows.length > 0) {
                // Link Google account to existing user
                await db.query(
                    'UPDATE users SET google_id = $1 WHERE email = $2',
                    [profile.id, profile.emails[0].value]
                );
                return done(null, emailCheck.rows[0]);
            }

            // Create new user
            const newUser = await db.query(
                `INSERT INTO users (name, email, google_id, password)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [
                    profile.displayName || profile.emails[0].value.split('@')[0],
                    profile.emails[0].value,
                    profile.id,
                    null // No password for OAuth users
                ]
            );

            return done(null, newUser.rows[0]);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// Cache busting middleware - Add version query parameter and set cache headers
const APP_VERSION = require('./package.json').version;

// Custom static file serving with proper cache headers
app.use((req, res, next) => {
    // Set cache headers based on file type
    if (req.path.endsWith('.html')) {
        // HTML files - always revalidate
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    } else if (req.path.match(/\.(js|css)$/)) {
        // JS/CSS files - cache but revalidate with ETag
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.setHeader('ETag', APP_VERSION);
    } else if (req.path.match(/\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        // Static assets - long cache
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    next();
});

// Serve index.html with version injection
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // Inject version into HTML comment
    html = html.replace(
        /<!-- Version: v[\d\.]+-[\w-]+ -->/,
        `<!-- Version: v${APP_VERSION} - ${new Date().toISOString()} -->`
    );

    // Add version query parameter to all script tags
    html = html.replace(
        /<script src="([^"]+\.js)"/g,
        `<script src="$1?v=${APP_VERSION}"`
    );

    // Inject APP_VERSION as a global variable for client-side cache busting
    html = html.replace(
        /<script>/,
        `<script>window.APP_VERSION = "${APP_VERSION}";</script>\n    <script>`
    );

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(html);
});

app.use(express.static(path.join(__dirname, 'public')));

// Serve translations folder
app.use('/translations', express.static(path.join(__dirname, 'translations')));

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
                password VARCHAR(255),
                provider VARCHAR(50) DEFAULT 'local',
                picture TEXT,
                google_id VARCHAR(255) UNIQUE,
                apple_id VARCHAR(255) UNIQUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add google_id column if it doesn't exist (migration)
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='google_id'
                ) THEN
                    ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
                END IF;
            END $$;
        `);

        // Add apple_id column if it doesn't exist (migration)
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='apple_id'
                ) THEN
                    ALTER TABLE users ADD COLUMN apple_id VARCHAR(255) UNIQUE;
                END IF;
            END $$;
        `);

        // Make password nullable for OAuth users (migration)
        await db.query(`
            DO $$
            BEGIN
                ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
            EXCEPTION
                WHEN OTHERS THEN NULL;
            END $$;
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

        // Migration: Add is_custom column to track user-created words
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'words' AND column_name = 'is_custom'
                ) THEN
                    ALTER TABLE words ADD COLUMN is_custom BOOLEAN DEFAULT false;
                END IF;
            END $$;
        `);

        // Migration: Add source column to track word origin
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'words' AND column_name = 'source'
                ) THEN
                    ALTER TABLE words ADD COLUMN source VARCHAR(50) DEFAULT 'default';
                END IF;
            END $$;
        `);

        // Migration: Add notes column for user annotations
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'words' AND column_name = 'notes'
                ) THEN
                    ALTER TABLE words ADD COLUMN notes TEXT;
                END IF;
            END $$;
        `);

        // Migration: Add category/tags column for word organization
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'words' AND column_name = 'tags'
                ) THEN
                    ALTER TABLE words ADD COLUMN tags TEXT[];
                END IF;
            END $$;
        `);

        // Phase 3.1: Word Sets for CEFR levels and themes
        await db.query(`
            CREATE TABLE IF NOT EXISTS word_sets (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                language_pair VARCHAR(10) NOT NULL,
                level VARCHAR(5),
                theme VARCHAR(100),
                word_count INTEGER DEFAULT 0,
                is_official BOOLEAN DEFAULT true,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS word_set_items (
                id SERIAL PRIMARY KEY,
                word_set_id INTEGER REFERENCES word_sets(id) ON DELETE CASCADE,
                word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
                order_index INTEGER DEFAULT 0,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(word_set_id, word_id)
            )
        `);

        // Create index for faster word set queries
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_word_sets_language_pair
            ON word_sets(language_pair)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_word_sets_level
            ON word_sets(level)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_word_sets_theme
            ON word_sets(theme)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_word_set_items_word_set
            ON word_set_items(word_set_id)
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

        // Currency System: Add coins and gems columns to user_stats if they don't exist
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'user_stats' AND column_name = 'coins'
                ) THEN
                    ALTER TABLE user_stats ADD COLUMN coins INTEGER DEFAULT 0;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'user_stats' AND column_name = 'gems'
                ) THEN
                    ALTER TABLE user_stats ADD COLUMN gems INTEGER DEFAULT 0;
                END IF;
            END $$;
        `);

        // Currency System: Transaction log
        await db.query(`
            CREATE TABLE IF NOT EXISTS currency_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                currency_type VARCHAR(10) NOT NULL,
                amount INTEGER NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                source VARCHAR(100) NOT NULL,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Leagues System: League tiers configuration
        await db.query(`
            CREATE TABLE IF NOT EXISTS league_tiers (
                id SERIAL PRIMARY KEY,
                tier_name VARCHAR(50) UNIQUE NOT NULL,
                tier_level INTEGER UNIQUE NOT NULL,
                min_weekly_xp INTEGER NOT NULL,
                icon VARCHAR(10),
                color_hex VARCHAR(7),
                promotion_bonus_coins INTEGER DEFAULT 0,
                promotion_bonus_gems INTEGER DEFAULT 0
            )
        `);

        // Auto-populate league_tiers if empty
        const tiersCount = await db.query('SELECT COUNT(*) FROM league_tiers');
        if (parseInt(tiersCount.rows[0].count) === 0) {
            logger.info('Initializing league tiers...');
            await db.query(`
                INSERT INTO league_tiers (tier_name, tier_level, min_weekly_xp, icon, color_hex, promotion_bonus_coins, promotion_bonus_gems)
                VALUES
                ('Bronze', 1, 0, '🥉', '#CD7F32', 50, 0),
                ('Silver', 2, 500, '🥈', '#C0C0C0', 100, 0),
                ('Gold', 3, 1000, '🥇', '#FFD700', 200, 5),
                ('Platinum', 4, 2000, '💎', '#E5E4E2', 400, 10),
                ('Diamond', 5, 3500, '💠', '#B9F2FF', 800, 25),
                ('Master', 6, 5000, '⭐', '#FF6B6B', 1500, 50),
                ('Grandmaster', 7, 7500, '👑', '#9B59B6', 3000, 100)
            `);
            logger.info('✅ League tiers initialized (7 tiers)');
        }

        // Leagues System: User leagues (current league status)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_leagues (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                current_tier_id INTEGER REFERENCES league_tiers(id),
                weekly_xp INTEGER DEFAULT 0,
                week_start_date DATE NOT NULL,
                promotion_count INTEGER DEFAULT 0,
                demotion_count INTEGER DEFAULT 0,
                highest_tier_reached INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Leagues System: League history (transitions)
        await db.query(`
            CREATE TABLE IF NOT EXISTS league_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                from_tier_id INTEGER REFERENCES league_tiers(id),
                to_tier_id INTEGER REFERENCES league_tiers(id),
                week_start_date DATE NOT NULL,
                week_end_date DATE NOT NULL,
                weekly_xp_earned INTEGER NOT NULL,
                action_type VARCHAR(20) NOT NULL,
                reward_coins INTEGER DEFAULT 0,
                reward_gems INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Tournaments System: Tournament configuration
        await db.query(`
            CREATE TABLE IF NOT EXISTS tournaments (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                tournament_type VARCHAR(50) NOT NULL,
                bracket_type VARCHAR(50) NOT NULL,
                language_pair_id INTEGER,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                registration_deadline TIMESTAMP NOT NULL,
                max_participants INTEGER DEFAULT 64,
                status VARCHAR(50) DEFAULT 'registration',
                prize_1st_coins INTEGER DEFAULT 0,
                prize_1st_gems INTEGER DEFAULT 0,
                prize_2nd_coins INTEGER DEFAULT 0,
                prize_2nd_gems INTEGER DEFAULT 0,
                prize_3rd_coins INTEGER DEFAULT 0,
                prize_3rd_gems INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Tournaments System: Participants
        await db.query(`
            CREATE TABLE IF NOT EXISTS tournament_participants (
                id SERIAL PRIMARY KEY,
                tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                seed INTEGER,
                current_round INTEGER DEFAULT 1,
                is_eliminated BOOLEAN DEFAULT false,
                final_position INTEGER,
                total_score INTEGER DEFAULT 0,
                registered_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(tournament_id, user_id)
            )
        `);

        // Tournaments System: Bracket matches
        await db.query(`
            CREATE TABLE IF NOT EXISTS tournament_matches (
                id SERIAL PRIMARY KEY,
                tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
                round_number INTEGER NOT NULL,
                match_number INTEGER NOT NULL,
                player1_id INTEGER,
                player2_id INTEGER,
                player1_score INTEGER DEFAULT 0,
                player2_score INTEGER DEFAULT 0,
                winner_id INTEGER,
                status VARCHAR(50) DEFAULT 'pending',
                scheduled_at TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                UNIQUE(tournament_id, round_number, match_number)
            )
        `);

        // Global Feed System: Public activities
        await db.query(`
            CREATE TABLE IF NOT EXISTS global_feed (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(50) NOT NULL,
                activity_data JSONB NOT NULL,
                visibility VARCHAR(20) DEFAULT 'public',
                likes_count INTEGER DEFAULT 0,
                comments_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_global_feed_created_at ON global_feed(created_at DESC)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_global_feed_user_id ON global_feed(user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_global_feed_type ON global_feed(activity_type)`);

        // Global Feed System: Likes
        await db.query(`
            CREATE TABLE IF NOT EXISTS feed_likes (
                id SERIAL PRIMARY KEY,
                feed_id INTEGER REFERENCES global_feed(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(feed_id, user_id)
            )
        `);

        // Global Feed System: Comments
        await db.query(`
            CREATE TABLE IF NOT EXISTS feed_comments (
                id SERIAL PRIMARY KEY,
                feed_id INTEGER REFERENCES global_feed(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                comment_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
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

        // Gamification: XP History (tracking XP gains)
        await db.query(`
            CREATE TABLE IF NOT EXISTS xp_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                xp_amount INTEGER NOT NULL,
                action_type VARCHAR(100),
                createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Gamification: Daily goals
        await db.query(`
            CREATE TABLE IF NOT EXISTS daily_goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                goal_date DATE NOT NULL,
                xp_goal INTEGER DEFAULT 50,
                words_goal INTEGER DEFAULT 20,
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

        // Add topic field to global_word_collections
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'global_word_collections' AND column_name = 'topic'
                ) THEN
                    ALTER TABLE global_word_collections ADD COLUMN topic VARCHAR(100);
                END IF;
            END $$;
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

        // User Profiles: Add profile fields to users table
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'username'
                ) THEN
                    ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'bio'
                ) THEN
                    ALTER TABLE users ADD COLUMN bio TEXT;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'avatar_url'
                ) THEN
                    ALTER TABLE users ADD COLUMN avatar_url TEXT;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'is_public'
                ) THEN
                    ALTER TABLE users ADD COLUMN is_public BOOLEAN DEFAULT true;
                END IF;
            END $$;
        `);

        // User Profiles: Extended profile information
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                showcase_achievements TEXT[],
                favorite_languages TEXT[],
                study_goal TEXT,
                daily_goal_minutes INTEGER DEFAULT 15,
                timezone VARCHAR(50) DEFAULT 'UTC',
                language_level JSONB,
                profile_views INTEGER DEFAULT 0,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
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

        // Duels System: Duels table
        await db.query(`
            CREATE TABLE IF NOT EXISTS duels (
                id SERIAL PRIMARY KEY,
                challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                opponent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                language_pair_id INTEGER REFERENCES language_pairs(id),
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'declined')),
                winner_id INTEGER REFERENCES users(id),
                questions_count INTEGER DEFAULT 10,
                time_limit_seconds INTEGER DEFAULT 120,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                CHECK (challenger_id != opponent_id)
            )
        `);

        await db.query(`CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status)`);

        // Duels System: Duel answers
        await db.query(`
            CREATE TABLE IF NOT EXISTS duel_answers (
                id SERIAL PRIMARY KEY,
                duel_id INTEGER REFERENCES duels(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                word_id INTEGER REFERENCES words(id) ON DELETE SET NULL,
                answer TEXT,
                is_correct BOOLEAN,
                answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                time_taken_ms INTEGER
            )
        `);

        await db.query(`CREATE INDEX IF NOT EXISTS idx_duel_answers_duel ON duel_answers(duel_id)`);

        // Duels System: Duel results
        await db.query(`
            CREATE TABLE IF NOT EXISTS duel_results (
                id SERIAL PRIMARY KEY,
                duel_id INTEGER UNIQUE REFERENCES duels(id) ON DELETE CASCADE,
                challenger_score INTEGER DEFAULT 0,
                opponent_score INTEGER DEFAULT 0,
                challenger_avg_time_ms INTEGER,
                opponent_avg_time_ms INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // XP & Levels System: Level configuration table
        await db.query(`
            CREATE TABLE IF NOT EXISTS level_config (
                level INTEGER PRIMARY KEY,
                xp_required INTEGER NOT NULL,
                title VARCHAR(50) NOT NULL
            )
        `);

        // XP & Levels System: Feature unlocking table
        await db.query(`
            CREATE TABLE IF NOT EXISTS level_features (
                id SERIAL PRIMARY KEY,
                level_required INTEGER NOT NULL,
                feature_key VARCHAR(100) NOT NULL UNIQUE,
                feature_name VARCHAR(255) NOT NULL,
                feature_description TEXT,
                feature_category VARCHAR(50),
                icon VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_level_features_level ON level_features(level_required)`);

        // Populate level_config if empty
        const levelsCount = await db.query('SELECT COUNT(*) FROM level_config');
        if (parseInt(levelsCount.rows[0].count) === 0) {
            logger.info('Initializing level configuration (1-100)...');
            const levels = [];
            for (let level = 1; level <= 100; level++) {
                const xpRequired = Math.floor(100 * Math.pow(level, 1.5));
                let title = 'Новичок';
                if (level >= 5 && level < 10) title = 'Ученик';
                else if (level >= 10 && level < 20) title = 'Знаток';
                else if (level >= 20 && level < 30) title = 'Мастер';
                else if (level >= 30 && level < 50) title = 'Эксперт';
                else if (level >= 50 && level < 75) title = 'Гуру';
                else if (level >= 75 && level < 100) title = 'Легенда';
                else if (level === 100) title = 'Бессмертный';

                levels.push(`(${level}, ${xpRequired}, '${title}')`);
            }

            await db.query(`INSERT INTO level_config (level, xp_required, title) VALUES ${levels.join(', ')}`);
            logger.info('✅ Level configuration initialized (100 levels)');
        }

        // Populate level_features if empty
        const featuresCount = await db.query('SELECT COUNT(*) FROM level_features');
        if (parseInt(featuresCount.rows[0].count) === 0) {
            logger.info('Initializing level features...');
            const features = [
                // Social Features
                { level: 5, key: 'friend_requests', name: 'Запросы в друзья', desc: 'Отправляйте запросы и добавляйте друзей', cat: 'social', icon: '👥' },
                { level: 10, key: 'duel_challenges', name: 'Дуэли', desc: 'Участие в 1-на-1 дуэлях с друзьями', cat: 'social', icon: '⚔️' },
                { level: 15, key: 'tournament_participation', name: 'Турниры', desc: 'Регистрация на еженедельные турниры', cat: 'social', icon: '🏆' },
                { level: 20, key: 'global_feed_posting', name: 'Публикации в ленте', desc: 'Ручная публикация постов в глобальную ленту', cat: 'social', icon: '📢' },
                // Gamification Features
                { level: 3, key: 'daily_challenges', name: 'Ежедневные задания', desc: 'Доступ к ежедневным челленджам', cat: 'gamification', icon: '🎯' },
                { level: 7, key: 'weekly_challenges', name: 'Недельные задания', desc: 'Доступ к недельным челленджам', cat: 'gamification', icon: '📅' },
                { level: 12, key: 'league_participation', name: 'Лиги', desc: 'Участие в системе лиг и соревнований', cat: 'gamification', icon: '🥇' },
                { level: 18, key: 'achievement_tracking', name: 'Достижения', desc: 'Доступ к системе достижений', cat: 'gamification', icon: '🏅' },
                // Customization Features
                { level: 8, key: 'theme_unlocking', name: 'Кастомные темы', desc: 'Покупка и установка кастомных тем', cat: 'customization', icon: '🎨' },
                { level: 14, key: 'avatar_customization', name: 'Кастомные аватары', desc: 'Загрузка собственных аватаров', cat: 'customization', icon: '🖼️' },
                { level: 25, key: 'profile_bio', name: 'Био профиля', desc: 'Редактирование био и статуса профиля', cat: 'customization', icon: '✏️' },
                // Advanced Features
                { level: 30, key: 'import_google_sheets', name: 'Импорт из Google Sheets', desc: 'Импорт словарных наборов из Google Таблиц', cat: 'advanced', icon: '📊' },
                { level: 40, key: 'word_collections_create', name: 'Публичные наборы', desc: 'Создание и публикация собственных наборов слов', cat: 'advanced', icon: '📚' },
                { level: 50, key: 'mentor_program', name: 'Программа менторства', desc: 'Участие в программе менторства', cat: 'advanced', icon: '🎓' }
            ];

            for (const f of features) {
                await db.query(`
                    INSERT INTO level_features (level_required, feature_key, feature_name, feature_description, feature_category, icon)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (feature_key) DO NOTHING
                `, [f.level, f.key, f.name, f.desc, f.cat, f.icon]);
            }

            logger.info('✅ Level features initialized (14 features)');
        }

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

        // Leagues System: League memberships and history
        await db.query(`
            CREATE TABLE IF NOT EXISTS league_memberships (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                league_tier VARCHAR(20) NOT NULL,
                week_start_date DATE NOT NULL,
                week_xp INTEGER DEFAULT 0,
                rank_in_league INTEGER,
                promoted BOOLEAN DEFAULT false,
                demoted BOOLEAN DEFAULT false,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, week_start_date)
            )
        `);

        // Leagues System: League tiers configuration
        await db.query(`
            CREATE TABLE IF NOT EXISTS league_tiers (
                id SERIAL PRIMARY KEY,
                tier_name VARCHAR(20) UNIQUE NOT NULL,
                tier_level INTEGER NOT NULL,
                promotion_threshold INTEGER,
                demotion_threshold INTEGER,
                min_xp_required INTEGER DEFAULT 0,
                icon VARCHAR(50),
                color VARCHAR(20)
            )
        `);

        // Streak Freeze System: Active freezes
        await db.query(`
            CREATE TABLE IF NOT EXISTS streak_freezes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                freeze_days INTEGER NOT NULL,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT true,
                used_on_date DATE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Daily Goals System: User daily goals
        await db.query(`
            CREATE TABLE IF NOT EXISTS daily_goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                goal_date DATE NOT NULL,
                goal_type VARCHAR(50) NOT NULL,
                target_value INTEGER NOT NULL,
                current_progress INTEGER DEFAULT 0,
                is_completed BOOLEAN DEFAULT false,
                completed_at TIMESTAMP,
                reward_xp INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                UNIQUE(user_id, goal_date, goal_type)
            )
        `);

        // Duels System: 1v1 battles
        await db.query(`
            CREATE TABLE IF NOT EXISTS duels (
                id SERIAL PRIMARY KEY,
                challenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                opponent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending',
                language_pair_id INTEGER REFERENCES language_pairs(id),
                total_questions INTEGER DEFAULT 10,
                time_limit_seconds INTEGER DEFAULT 300,
                challenger_score INTEGER DEFAULT 0,
                opponent_score INTEGER DEFAULT 0,
                winner_id INTEGER REFERENCES users(id),
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CHECK (challenger_id != opponent_id)
            )
        `);

        // Duels System: Duel answers
        await db.query(`
            CREATE TABLE IF NOT EXISTS duel_answers (
                id SERIAL PRIMARY KEY,
                duel_id INTEGER REFERENCES duels(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
                is_correct BOOLEAN NOT NULL,
                answer_time_ms INTEGER,
                answeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Boosters System: Temporary power-ups
        await db.query(`
            CREATE TABLE IF NOT EXISTS boosters (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                booster_type VARCHAR(50) NOT NULL,
                multiplier DECIMAL(3,2) NOT NULL,
                duration_minutes INTEGER NOT NULL,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activated_at TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT false,
                is_used BOOLEAN DEFAULT false,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Push Notifications System: Subscriptions
        await db.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                endpoint TEXT NOT NULL UNIQUE,
                keys_p256dh TEXT NOT NULL,
                keys_auth TEXT NOT NULL,
                user_agent TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Notification preferences
        await db.query(`
            CREATE TABLE IF NOT EXISTS notification_preferences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                daily_reminder BOOLEAN DEFAULT true,
                daily_reminder_time TIME DEFAULT '19:00:00',
                streak_warning BOOLEAN DEFAULT true,
                achievements BOOLEAN DEFAULT true,
                friend_requests BOOLEAN DEFAULT true,
                duel_challenges BOOLEAN DEFAULT true,
                new_followers BOOLEAN DEFAULT true,
                weekly_report BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Notification history
        await db.query(`
            CREATE TABLE IF NOT EXISTS notification_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                notification_type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                body TEXT,
                data JSONB,
                is_read BOOLEAN DEFAULT false,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP
            )
        `);

        // User Settings System: General preferences
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                theme VARCHAR(20) DEFAULT 'auto',
                language VARCHAR(10) DEFAULT 'en',
                timezone VARCHAR(50) DEFAULT 'UTC',
                date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
                time_format VARCHAR(10) DEFAULT '24h',
                sound_effects BOOLEAN DEFAULT true,
                animations BOOLEAN DEFAULT true,
                auto_play_audio BOOLEAN DEFAULT true,
                speech_rate DECIMAL(3,2) DEFAULT 1.0,
                speech_pitch DECIMAL(3,2) DEFAULT 1.0,
                speech_volume DECIMAL(3,2) DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Activity Feed System: Global feed
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_feed (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(50) NOT NULL,
                activity_data JSONB,
                is_public BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create index for efficient feed queries
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
        `);

        // Social Reactions System: Likes
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_likes (
                id SERIAL PRIMARY KEY,
                activity_id INTEGER REFERENCES activity_feed(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(activity_id, user_id)
            )
        `);

        // Comments
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_comments (
                id SERIAL PRIMARY KEY,
                activity_id INTEGER REFERENCES activity_feed(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                comment_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User Inventory System: Owned items
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_inventory (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                item_type VARCHAR(50) NOT NULL,
                item_id VARCHAR(100) NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                quantity INTEGER DEFAULT 1,
                is_equipped BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                metadata JSONB,
                UNIQUE(user_id, item_type, item_id)
            )
        `);

        // Weekly Challenges System: Week-long challenges
        await db.query(`
            CREATE TABLE IF NOT EXISTS weekly_challenges (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                week_start_date DATE NOT NULL,
                challenge_type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                target_value INTEGER NOT NULL,
                current_progress INTEGER DEFAULT 0,
                is_completed BOOLEAN DEFAULT false,
                completed_at TIMESTAMP,
                reward_xp INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                reward_claimed BOOLEAN DEFAULT false,
                difficulty VARCHAR(20) DEFAULT 'medium',
                UNIQUE(user_id, week_start_date, challenge_type)
            )
        `);

        // Milestones & Rewards System: User milestones
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_milestones (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                milestone_type VARCHAR(50) NOT NULL,
                milestone_value INTEGER NOT NULL,
                is_reached BOOLEAN DEFAULT false,
                reached_at TIMESTAMP,
                reward_xp INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                reward_claimed BOOLEAN DEFAULT false,
                special_reward TEXT,
                UNIQUE(user_id, milestone_type, milestone_value)
            )
        `);

        // User Badges System: Badge definitions
        await db.query(`
            CREATE TABLE IF NOT EXISTS badges (
                id SERIAL PRIMARY KEY,
                badge_key VARCHAR(100) UNIQUE NOT NULL,
                badge_name VARCHAR(255) NOT NULL,
                description TEXT,
                icon TEXT,
                rarity VARCHAR(20) DEFAULT 'common',
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // User badges (earned by users)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_badges (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_equipped BOOLEAN DEFAULT false,
                UNIQUE(user_id, badge_id)
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

        // Local Leaderboards: Add country and city to users table
        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'country'
                ) THEN
                    ALTER TABLE users ADD COLUMN country VARCHAR(100);
                END IF;
            END $$;
        `);

        await db.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'city'
                ) THEN
                    ALTER TABLE users ADD COLUMN city VARCHAR(100);
                END IF;
            END $$;
        `);

        await db.query(`CREATE INDEX IF NOT EXISTS idx_users_country ON users(country)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_users_city ON users(city)`);

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

        logger.info('PostgreSQL database initialized with gamification tables');

        // Initialize challenge templates
        await initializeChallengeTemplates();

        // Initialize shop items
        await initializeShopItems();

        // Initialize achievements
        await initializeAchievements();

        // Initialize league tiers
        await initializeLeagueTiers();

        // Initialize badges
        await initializeBadges();

        // ========================================
        // SPACED REPETITION SYSTEM (SRS)
        // ========================================

        // SRS: Word-specific SRS data (SM-2 algorithm)
        await db.query(`
            CREATE TABLE IF NOT EXISTS word_srs_data (
                id SERIAL PRIMARY KEY,
                word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                easiness_factor DECIMAL(3,2) DEFAULT 2.5,
                interval_days INTEGER DEFAULT 1,
                repetitions INTEGER DEFAULT 0,
                next_review_date TIMESTAMP NOT NULL,
                last_review_date TIMESTAMP,
                last_quality_rating INTEGER,
                total_reviews INTEGER DEFAULT 0,
                mature BOOLEAN DEFAULT FALSE,
                suspended BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(word_id, user_id)
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_srs_next_review ON word_srs_data(user_id, next_review_date)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_srs_mature ON word_srs_data(user_id, mature)`);

        // Learning Mode: Track progress before entering SRS
        await db.query(`
            CREATE TABLE IF NOT EXISTS word_learning_progress (
                id SERIAL PRIMARY KEY,
                word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                exercise_type VARCHAR(50) NOT NULL,
                correct_count INTEGER DEFAULT 0,
                required_count INTEGER NOT NULL,
                learn_attempts INTEGER DEFAULT 0,
                last_attempt_date TIMESTAMP,
                graduated_to_srs BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(word_id, user_id, exercise_type)
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON word_learning_progress(user_id, graduated_to_srs)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_learning_progress_word ON word_learning_progress(word_id, user_id)`);

        // User Learning Profile: Персонализированные настройки и паттерны обучения
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_learning_profile (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                best_study_hour INTEGER,
                avg_retention_rate DECIMAL(5,2),
                preferred_interval_modifier DECIMAL(3,2) DEFAULT 1.0,
                difficulty_preference VARCHAR(20) DEFAULT 'balanced',
                avg_session_duration_minutes INTEGER,
                total_study_sessions INTEGER DEFAULT 0,
                hourly_performance JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_user_learning_profile_user ON user_learning_profile(user_id)`);

        // Word Siblings: Группировка схожих/связанных слов
        await db.query(`
            CREATE TABLE IF NOT EXISTS word_siblings (
                id SERIAL PRIMARY KEY,
                word_id_1 INTEGER REFERENCES words(id) ON DELETE CASCADE,
                word_id_2 INTEGER REFERENCES words(id) ON DELETE CASCADE,
                relationship_type VARCHAR(50) NOT NULL,
                similarity_score DECIMAL(3,2),
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(word_id_1, word_id_2),
                CHECK (word_id_1 < word_id_2)
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_siblings_word1 ON word_siblings(word_id_1)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_siblings_word2 ON word_siblings(word_id_2)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_siblings_type ON word_siblings(relationship_type)`);

        // Word Context: Примеры использования слов в контексте
        await db.query(`
            CREATE TABLE IF NOT EXISTS word_contexts (
                id SERIAL PRIMARY KEY,
                word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                context_type VARCHAR(50) NOT NULL,
                source_sentence TEXT NOT NULL,
                translation_sentence TEXT,
                source_language VARCHAR(10),
                context_tags TEXT[],
                difficulty_level VARCHAR(20),
                usage_count INTEGER DEFAULT 0,
                is_public BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_contexts_word ON word_contexts(word_id, user_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_contexts_type ON word_contexts(context_type)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_word_contexts_public ON word_contexts(is_public, word_id) WHERE is_public = true`);

        // SRS Session Siblings Tracking: Предотвращение review siblings в одной сессии
        await db.query(`
            CREATE TABLE IF NOT EXISTS srs_session_tracking (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                session_id VARCHAR(100) NOT NULL,
                word_ids INTEGER[] NOT NULL,
                session_start TIMESTAMP DEFAULT NOW(),
                session_end TIMESTAMP,
                words_reviewed INTEGER DEFAULT 0,
                avg_quality DECIMAL(3,2)
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_srs_session_user ON srs_session_tracking(user_id, session_start DESC)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_srs_session_id ON srs_session_tracking(session_id)`);

        // Cramming Mode: Экстренное запоминание с короткими интервалами
        await db.query(`
            CREATE TABLE IF NOT EXISTS cramming_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                session_name VARCHAR(255),
                target_date DATE,
                word_ids INTEGER[] NOT NULL,
                session_status VARCHAR(20) DEFAULT 'active',
                total_words INTEGER DEFAULT 0,
                completed_words INTEGER DEFAULT 0,
                current_stage INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP,
                exam_date TIMESTAMP
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_cramming_sessions_user ON cramming_sessions(user_id, session_status)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_cramming_sessions_date ON cramming_sessions(target_date)`);

        // Cramming Progress: Отслеживание прогресса cramming сессий
        await db.query(`
            CREATE TABLE IF NOT EXISTS cramming_progress (
                id SERIAL PRIMARY KEY,
                cramming_session_id INTEGER REFERENCES cramming_sessions(id) ON DELETE CASCADE,
                word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                stage INTEGER DEFAULT 1,
                last_review_at TIMESTAMP,
                next_review_at TIMESTAMP NOT NULL,
                review_count INTEGER DEFAULT 0,
                correct_count INTEGER DEFAULT 0,
                is_mastered BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(cramming_session_id, word_id)
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_cramming_progress_session ON cramming_progress(cramming_session_id, is_mastered)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_cramming_progress_next ON cramming_progress(user_id, next_review_at) WHERE is_mastered = false`);

        // SRS: Review history log
        await db.query(`
            CREATE TABLE IF NOT EXISTS srs_review_log (
                id SERIAL PRIMARY KEY,
                word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                review_date TIMESTAMP DEFAULT NOW(),
                quality_rating INTEGER NOT NULL,
                time_taken_ms INTEGER,
                previous_interval INTEGER,
                new_interval INTEGER,
                previous_ef DECIMAL(3,2),
                new_ef DECIMAL(3,2),
                review_type VARCHAR(20)
            )
        `);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_srs_review_log_user ON srs_review_log(user_id, review_date)`);

        // Additional performance indexes
        // Words table optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_words_user_lang ON words(user_id, language_pair_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_words_status ON words(user_id, status)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(user_id, nextReviewDate) WHERE nextReviewDate IS NOT NULL`);

        // Language pairs optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_language_pairs_user ON language_pairs(user_id, is_active)`);

        // XP history optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_xp_history_user ON xp_history(user_id, createdat DESC)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_xp_history_type ON xp_history(user_id, action_type)`);

        // Daily goals optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals(user_id, goal_date DESC)`);

        // User achievements optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id, unlocked_at DESC)`);

        // Friendships optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status)`);

        // Friend activities optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_friend_activities_user ON friend_activities(user_id, createdat DESC)`);

        // Reports optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id, createdAt DESC)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, priority)`);

        // Challenge progress optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_user_challenges_date ON user_daily_challenges(user_id, challenge_date DESC)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_daily_challenges(user_id, is_completed)`);

        // Weekly challenges optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_weekly_challenges_user ON weekly_challenges(user_id, week_start_date DESC)`);

        // League history optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_league_history_user ON league_history(user_id, week_start_date DESC)`);

        // Leaderboard cache optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_leaderboard_cache ON leaderboard_cache(leaderboard_type, rank_position)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard_cache(user_id, leaderboard_type)`);

        // Global word collections optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_global_collections_lang ON global_word_collections(from_lang, to_lang, category)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_global_collections_difficulty ON global_word_collections(difficulty_level, is_public)`);

        // Tournaments optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status, start_date)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_tournament_participants ON tournament_participants(tournament_id, user_id)`);

        // Streak freezes optimization
        await db.query(`CREATE INDEX IF NOT EXISTS idx_streak_freezes_user ON streak_freezes(user_id, is_active, expires_at)`);

        logger.info('✅ SRS tables initialized');
        logger.info('✅ Performance indexes added (29 indexes)');

    } catch (err) {
        logger.error('Database initialization error:', err);
    }
}

// Initialize predefined achievements
async function initializeAchievements() {
    const achievements = [
        // Streak Achievements
        { key: 'streak_3', name: 'Little Flame 🔥', description: '3-day streak', icon: '🔥', category: 'streak', tier: 1, requirement: 3, xp: 50 },
        { key: 'streak_7', name: 'Week of Power 💪', description: '7-day streak', icon: '💪', category: 'streak', tier: 2, requirement: 7, xp: 100 },
        { key: 'streak_30', name: 'Month of Victory 🏆', description: '30-day streak', icon: '🏆', category: 'streak', tier: 3, requirement: 30, xp: 500 },
        { key: 'streak_100', name: 'Legend 👑', description: '100-day streak', icon: '👑', category: 'streak', tier: 4, requirement: 100, xp: 2000 },

        // Word Count Achievements
        { key: 'words_10', name: 'First Steps 🌱', description: 'Learned 10 words', icon: '🌱', category: 'words', tier: 1, requirement: 10, xp: 25 },
        { key: 'words_50', name: 'Connoisseur 📚', description: 'Learned 50 words', icon: '📚', category: 'words', tier: 2, requirement: 50, xp: 100 },
        { key: 'words_100', name: 'Scholar 🎓', description: 'Learned 100 words', icon: '🎓', category: 'words', tier: 3, requirement: 100, xp: 250 },
        { key: 'words_500', name: 'Word Master ⭐', description: 'Learned 500 words', icon: '⭐', category: 'words', tier: 4, requirement: 500, xp: 1000 },
        { key: 'words_1000', name: 'Polyglot 🌍', description: 'Learned 1000 words', icon: '🌍', category: 'words', tier: 5, requirement: 1000, xp: 3000 },

        // Level Achievements
        { key: 'level_5', name: 'Novice 🥉', description: 'Reached level 5', icon: '🥉', category: 'level', tier: 1, requirement: 5, xp: 50 },
        { key: 'level_10', name: 'Experienced 🥈', description: 'Reached level 10', icon: '🥈', category: 'level', tier: 2, requirement: 10, xp: 100 },
        { key: 'level_25', name: 'Professional 🥇', description: 'Reached level 25', icon: '🥇', category: 'level', tier: 3, requirement: 25, xp: 500 },
        { key: 'level_50', name: 'Expert 💎', description: 'Reached level 50', icon: '💎', category: 'level', tier: 4, requirement: 50, xp: 1500 },
        { key: 'level_100', name: 'Grandmaster 👾', description: 'Reached level 100', icon: '👾', category: 'level', tier: 5, requirement: 100, xp: 5000 },

        // Quiz Achievements
        { key: 'quiz_100', name: 'Trainee ✏️', description: '100 exercises completed', icon: '✏️', category: 'quiz', tier: 1, requirement: 100, xp: 50 },
        { key: 'quiz_500', name: 'Hard Worker 📝', description: '500 exercises completed', icon: '📝', category: 'quiz', tier: 2, requirement: 500, xp: 250 },
        { key: 'quiz_1000', name: 'Tireless 💪', description: '1000 exercises completed', icon: '💪', category: 'quiz', tier: 3, requirement: 1000, xp: 750 },

        // Special Achievements
        { key: 'first_word', name: 'First Word 🎉', description: 'Learned first word', icon: '🎉', category: 'special', tier: 1, requirement: 1, xp: 10 },
        { key: 'early_bird', name: 'Early Bird 🌅', description: 'Study before 8:00 AM', icon: '🌅', category: 'special', tier: 1, requirement: 1, xp: 25 },
        { key: 'night_owl', name: 'Night Owl 🦉', description: 'Study after 11:00 PM', icon: '🦉', category: 'special', tier: 1, requirement: 1, xp: 25 },
    ];

    try {
        for (const ach of achievements) {
            await db.query(
                `INSERT INTO achievements (achievement_key, name, description, icon, category, tier, requirement_value, xp_reward)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (achievement_key) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description`,
                [ach.key, ach.name, ach.description, ach.icon, ach.category, ach.tier, ach.requirement, ach.xp]
            );
        }
        logger.info('✨ Achievements initialized');
    } catch (err) {
        logger.error('Error initializing achievements:', err);
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
        logger.info('🎯 Challenge templates initialized');
    } catch (err) {
        logger.error('Error initializing challenge templates:', err);
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
        logger.info('🏪 Shop items initialized');
    } catch (err) {
        logger.error('Error initializing shop items:', err);
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

// Level Features: Check if user has access to a feature
async function checkFeatureAccess(userId, featureKey) {
    try {
        // Get user level
        const userStats = await db.query('SELECT level FROM user_stats WHERE user_id = $1', [parseInt(userId)]);
        if (!userStats.rows.length) {
            return { hasAccess: false, error: 'User not found', currentLevel: 0, requiredLevel: 0 };
        }

        const userLevel = userStats.rows[0].level || 1;

        // Get feature requirement
        const feature = await db.query('SELECT level_required, feature_name FROM level_features WHERE feature_key = $1', [featureKey]);

        // If feature doesn't exist in restrictions, allow access
        if (!feature.rows.length) {
            return { hasAccess: true, currentLevel: userLevel, requiredLevel: 0, levelsRemaining: 0 };
        }

        const requiredLevel = feature.rows[0].level_required;
        const hasAccess = userLevel >= requiredLevel;

        return {
            hasAccess,
            currentLevel: userLevel,
            requiredLevel,
            levelsRemaining: Math.max(0, requiredLevel - userLevel),
            featureName: feature.rows[0].feature_name
        };
    } catch (err) {
        logger.error('Error checking feature access:', err);
        return { hasAccess: false, error: err.message, currentLevel: 0, requiredLevel: 0 };
    }
}

// Achievements: Initialize predefined achievements
// DUPLICATE REMOVED - Using original initializeAchievements function at line 1843

// Leagues: Initialize league tiers
async function initializeLeagueTiers() {
    const tiers = [
        { name: 'Bronze', level: 1, promotion: 3, demotion: null, min_xp: 0, icon: '🥉', color: '#CD7F32' },
        { name: 'Silver', level: 2, promotion: 3, demotion: 8, min_xp: 500, icon: '🥈', color: '#C0C0C0' },
        { name: 'Gold', level: 3, promotion: 3, demotion: 8, min_xp: 1500, icon: '🥇', color: '#FFD700' },
        { name: 'Platinum', level: 4, promotion: 3, demotion: 8, min_xp: 3000, icon: '💎', color: '#E5E4E2' },
        { name: 'Diamond', level: 5, promotion: null, demotion: 8, min_xp: 5000, icon: '💠', color: '#B9F2FF' }
    ];

    for (const tier of tiers) {
        try {
            await db.query(`
                INSERT INTO league_tiers (tier_name, tier_level, promotion_threshold, demotion_threshold, min_xp_required, icon, color)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (tier_name) DO NOTHING
            `, [tier.name, tier.level, tier.promotion, tier.demotion, tier.min_xp, tier.icon, tier.color]);
        } catch (err) {
            logger.error(`Error initializing league tier ${tier.name}:`, err.message);
        }
    }

    logger.info('✅ League tiers initialized');
}

// Initialize predefined badges
async function initializeBadges() {
    const badges = [
        // Achievement-based badges
        { key: 'word_master', name: 'Word Master', description: 'Learned 1000 words', icon: '📚', rarity: 'epic', category: 'achievement' },
        { key: 'streak_legend', name: 'Streak Legend', description: '365-day streak', icon: '🔥', rarity: 'legendary', category: 'streak' },
        { key: 'perfectionist', name: 'Perfectionist', description: '100 perfect quizzes', icon: '💯', rarity: 'rare', category: 'accuracy' },

        // Time-based badges
        { key: 'night_owl', name: 'Night Owl', description: 'Study after midnight', icon: '🦉', rarity: 'uncommon', category: 'time' },
        { key: 'early_bird', name: 'Early Bird', description: 'Study before 6 AM', icon: '🌅', rarity: 'uncommon', category: 'time' },

        // Social badges
        { key: 'social_butterfly', name: 'Social Butterfly', description: '50+ friends', icon: '🦋', rarity: 'rare', category: 'social' },
        { key: 'duel_champion', name: 'Duel Champion', description: 'Won 100 duels', icon: '⚔️', rarity: 'epic', category: 'competitive' },

        // Special badges
        { key: 'beta_tester', name: 'Beta Tester', description: 'Early adopter', icon: '🧪', rarity: 'legendary', category: 'special' },
        { key: 'league_master', name: 'League Master', description: 'Reached Diamond', icon: '💠', rarity: 'epic', category: 'league' }
    ];

    for (const badge of badges) {
        try {
            await db.query(`
                INSERT INTO badges (badge_key, badge_name, description, icon, rarity, category)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (badge_key) DO NOTHING
            `, [badge.key, badge.name, badge.description, badge.icon, badge.rarity, badge.category]);
        } catch (err) {
            logger.error(`Error initializing badge ${badge.key}:`, err.message);
        }
    }

    logger.info('✅ Badges initialized');
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

        logger.info(`🎯 User ${userId} earned ${xpAmount} XP for ${actionType} - Level ${levelInfo.level}`);

        return { xpAmount, newTotalXP, ...levelInfo };
    } catch (err) {
        logger.error('Error awarding XP:', err);
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

        logger.info(`🔥 User ${userId} streak: ${newStreak} days (longest: ${newLongestStreak})`);

        // Update daily goals
        await updateDailyGoals(userId, wordsLearned, quizzesCompleted, xpEarned);

        return { currentStreak: newStreak, longestStreak: newLongestStreak };
    } catch (err) {
        logger.error('Error updating daily activity:', err);
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
                 VALUES ($1, $2, 50, 20, 10)`,
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

        logger.info(`🎯 User ${userId} daily goals: ${newXPProgress}/${currentGoal.xp_goal} XP, ${newWordsProgress}/${currentGoal.words_goal} words, ${newQuizzesProgress}/${currentGoal.quizzes_goal} quizzes`);

        // Award bonus XP if goal just completed
        if (completed && !currentGoal.completed) {
            await awardXP(userId, 'daily_goal', 25, 'Daily goal completed!');
            logger.info(`🎉 User ${userId} completed daily goal! +25 bonus XP`);
        }

        return { completed, newXPProgress, newWordsProgress, newQuizzesProgress };
    } catch (err) {
        logger.error('Error updating daily goals:', err);
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
                logger.info(`🏆 User ${userId} unlocked achievement: ${achievement.name}`);
            }
        }

        return unlockedAchievements;
    } catch (err) {
        logger.error('Error checking achievements:', err);
        return [];
    }
}

// API Routes

// Apply API rate limiter to all /api/* routes (except auth which has stricter limits)
app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth/register') || req.path.startsWith('/auth/login')) {
        return next(); // Skip apiLimiter for auth routes (they use authLimiter)
    }
    return apiLimiter(req, res, next);
});

// Authentication endpoints
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password, nativeLang, targetLang } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Create user
        const hashedPassword = hashPassword(password);
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, createdat',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];

        // Language names mapping
        const languageNames = {
            'en': 'English', 'de': 'German', 'es': 'Spanish', 'fr': 'French',
            'ru': 'Russian', 'uk': 'Ukrainian', 'pt': 'Portuguese', 'it': 'Italian',
            'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean'
        };

        // Default: nativeLang → targetLang. If not provided: en → es (or device lang → en)
        const userNativeLang = nativeLang || 'en';
        const userTargetLang = targetLang || (userNativeLang === 'en' ? 'es' : 'en');

        const nativeName = languageNames[userNativeLang] || userNativeLang.toUpperCase();
        const targetName = languageNames[userTargetLang] || userTargetLang.toUpperCase();
        const pairName = `${targetName} → ${nativeName}`;

        // Create language pair (from_lang = target language to learn, to_lang = native language)
        const langPairResult = await db.query(
            'INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user.id, pairName, userTargetLang, userNativeLang, true]
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
        logger.error('Registration error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
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
        logger.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=google_auth_failed' }),
    async (req, res) => {
        try {
            // User is authenticated
            const user = req.user;

            // Check if user has language pairs (determines if onboarding needed)
            const langPairsResult = await db.query(
                'SELECT * FROM language_pairs WHERE user_id = $1',
                [user.id]
            );

            // If no language pairs, user needs onboarding
            if (langPairsResult.rows.length === 0) {
                res.redirect('/?login=success&provider=google&needsOnboarding=true');
            } else {
                res.redirect('/?login=success&provider=google');
            }
        } catch (error) {
            logger.error('Google callback error:', error);
            res.redirect('/?error=google_auth_error');
        }
    }
);

// Get current user (for checking session)
app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                provider: req.user.google_id ? 'google' : 'local',
                picture: req.user.picture
            }
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

// Complete onboarding - Save user preferences and create language pair
app.post('/api/auth/complete-onboarding', async (req, res) => {
    try {
        const { nativeLang, targetLang, dailyGoalMinutes, theme } = req.body;

        // Get user ID from session (for OAuth) or from request body
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!nativeLang || !targetLang) {
            return res.status(400).json({ error: 'Language pair is required' });
        }

        // Language names mapping
        const languageNames = {
            'en': 'English', 'de': 'German', 'es': 'Spanish', 'fr': 'French',
            'ru': 'Russian', 'uk': 'Ukrainian', 'pt': 'Portuguese', 'it': 'Italian',
            'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean'
        };

        const nativeName = languageNames[nativeLang] || nativeLang.toUpperCase();
        const targetName = languageNames[targetLang] || targetLang.toUpperCase();
        const pairName = `${targetName} → ${nativeName}`;

        // Create language pair (from_lang = target language to learn, to_lang = native language)
        const langPairResult = await db.query(
            'INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, pairName, targetLang, nativeLang, true]
        );

        // Create or update user_profile with all daily goals
        // Formula: daily_xp_goal = daily_goal_minutes * 10, daily_tasks_goal = daily_goal_minutes * 10, daily_word_goal = 5 (fixed)
        const minutes = dailyGoalMinutes || 15;
        const profileResult = await db.query(`
            INSERT INTO user_profiles (user_id, daily_goal_minutes, daily_xp_goal, daily_tasks_goal, daily_word_goal)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id)
            DO UPDATE SET
                daily_goal_minutes = $2,
                daily_xp_goal = $3,
                daily_tasks_goal = $4,
                daily_word_goal = $5,
                updatedAt = CURRENT_TIMESTAMP
            RETURNING *
        `, [userId, minutes, minutes * 10, minutes * 10, 5]);

        logger.info(`✅ Onboarding completed for user ${userId}: ${pairName}, ${minutes} min/day (${minutes * 10} XP, ${minutes * 10} tasks, 5 words), ${theme} theme`);

        res.json({
            success: true,
            languagePair: langPairResult.rows[0],
            profile: profileResult.rows[0],
            theme: theme
        });
    } catch (err) {
        logger.error('Onboarding completion error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check if user needs onboarding
app.get('/api/user/needs-onboarding', async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Check if user has language pairs
        const langPairsResult = await db.query(
            'SELECT * FROM language_pairs WHERE user_id = $1',
            [userId]
        );

        res.json({
            needsOnboarding: langPairsResult.rows.length === 0
        });
    } catch (err) {
        logger.error('Check onboarding error:', err);
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

// Get word count for a language pair
app.get('/api/users/:userId/language-pairs/:pairId/word-count', async (req, res) => {
    try {
        const { userId, pairId } = req.params;

        const result = await db.query(
            'SELECT COUNT(*) FROM words WHERE language_pair_id = $1',
            [pairId]
        );

        res.json({ count: parseInt(result.rows[0].count) });
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
            return res.status(400).json({ error: 'Cannot delete the last language pair' });
        }

        await db.query('DELETE FROM language_pairs WHERE id = $1 AND user_id = $2', [pairId, userId]);
        res.json({ message: 'Language pair deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// WORD SETS API - Phase 3.1 CEFR-Based Word Sets
// ============================================

// Get all word sets (with optional filtering)
app.get('/api/word-sets', async (req, res) => {
    try {
        const { languagePair, level, theme, isOfficial } = req.query;

        let query = 'SELECT * FROM word_sets WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (languagePair) {
            query += ` AND language_pair = $${paramIndex}`;
            params.push(languagePair);
            paramIndex++;
        }

        if (level) {
            query += ` AND level = $${paramIndex}`;
            params.push(level);
            paramIndex++;
        }

        if (theme) {
            query += ` AND theme = $${paramIndex}`;
            params.push(theme);
            paramIndex++;
        }

        if (isOfficial !== undefined) {
            query += ` AND is_official = $${paramIndex}`;
            params.push(isOfficial === 'true');
            paramIndex++;
        }

        query += ' ORDER BY level ASC, theme ASC, name ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        logger.error('Error fetching word sets:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get a specific word set with its words
app.get('/api/word-sets/:setId', async (req, res) => {
    try {
        const { setId } = req.params;

        const setResult = await db.query(
            'SELECT * FROM word_sets WHERE id = $1',
            [setId]
        );

        if (setResult.rows.length === 0) {
            return res.status(404).json({ error: 'Word set not found' });
        }

        const wordsResult = await db.query(`
            SELECT w.*, wsi.order_index
            FROM words w
            JOIN word_set_items wsi ON w.id = wsi.word_id
            WHERE wsi.word_set_id = $1
            ORDER BY wsi.order_index ASC
        `, [setId]);

        res.json({
            ...setResult.rows[0],
            words: wordsResult.rows
        });
    } catch (err) {
        logger.error('Error fetching word set:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create a new word set
app.post('/api/word-sets', async (req, res) => {
    try {
        const { name, description, languagePair, level, theme, isOfficial, createdBy } = req.body;

        if (!name || !languagePair) {
            return res.status(400).json({ error: 'Name and language pair are required' });
        }

        const result = await db.query(`
            INSERT INTO word_sets (name, description, language_pair, level, theme, is_official, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, description, languagePair, level, theme, isOfficial || true, createdBy || null]);

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error creating word set:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add words to a word set
app.post('/api/word-sets/:setId/words', async (req, res) => {
    try {
        const { setId } = req.params;
        const { wordIds } = req.body;

        if (!Array.isArray(wordIds) || wordIds.length === 0) {
            return res.status(400).json({ error: 'wordIds array is required' });
        }

        // Get current max order_index
        const maxOrderResult = await db.query(
            'SELECT COALESCE(MAX(order_index), -1) as max_order FROM word_set_items WHERE word_set_id = $1',
            [setId]
        );
        let currentOrder = maxOrderResult.rows[0].max_order + 1;

        // Insert word set items
        const insertPromises = wordIds.map(async (wordId) => {
            try {
                await db.query(`
                    INSERT INTO word_set_items (word_set_id, word_id, order_index)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (word_set_id, word_id) DO NOTHING
                `, [setId, wordId, currentOrder]);
                currentOrder++;
            } catch (err) {
                logger.warn(`Failed to add word ${wordId} to set ${setId}:`, err.message);
            }
        });

        await Promise.all(insertPromises);

        // Update word count
        const countResult = await db.query(
            'SELECT COUNT(*) FROM word_set_items WHERE word_set_id = $1',
            [setId]
        );

        await db.query(
            'UPDATE word_sets SET word_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [parseInt(countResult.rows[0].count), setId]
        );

        res.json({ message: 'Words added to set successfully', count: wordIds.length });
    } catch (err) {
        logger.error('Error adding words to set:', err);
        res.status(500).json({ error: err.message });
    }
});

// Import words from a word set to user's collection
app.post('/api/word-sets/:setId/import', async (req, res) => {
    try {
        const { setId } = req.params;
        const { userId, languagePairId } = req.body;

        if (!userId || !languagePairId) {
            return res.status(400).json({ error: 'userId and languagePairId are required' });
        }

        // Get all words from the set
        const wordsResult = await db.query(`
            SELECT w.*
            FROM words w
            JOIN word_set_items wsi ON w.id = wsi.word_id
            WHERE wsi.word_set_id = $1
            ORDER BY wsi.order_index ASC
        `, [setId]);

        if (wordsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Word set is empty or not found' });
        }

        let importedCount = 0;
        let skippedCount = 0;

        for (const word of wordsResult.rows) {
            // Check if word already exists for this user
            const existingWord = await db.query(
                'SELECT id FROM words WHERE LOWER(word) = LOWER($1) AND user_id = $2 AND language_pair_id = $3',
                [word.word, userId, languagePairId]
            );

            if (existingWord.rows.length === 0) {
                // Import the word
                await db.query(`
                    INSERT INTO words (word, translation, example, exampleTranslation, user_id, language_pair_id, source)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    word.word,
                    word.translation,
                    word.example || '',
                    word.exampletranslation || '',
                    userId,
                    languagePairId,
                    `word_set_${setId}`
                ]);
                importedCount++;
            } else {
                skippedCount++;
            }
        }

        res.json({
            message: 'Word set imported successfully',
            imported: importedCount,
            skipped: skippedCount,
            total: wordsResult.rows.length
        });
    } catch (err) {
        logger.error('Error importing word set:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a word set
app.delete('/api/word-sets/:setId', async (req, res) => {
    try {
        const { setId } = req.params;

        // word_set_items will be automatically deleted due to ON DELETE CASCADE
        await db.query('DELETE FROM word_sets WHERE id = $1', [setId]);

        res.json({ message: 'Word set deleted successfully' });
    } catch (err) {
        logger.error('Error deleting word set:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// END WORD SETS API
// ============================================

app.put('/api/users/:userId/lesson-size', async (req, res) => {
    try {
        const { userId} = req.params;
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
        logger.error('Error getting user stats:', err);
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
        logger.error('Error awarding XP:', err);
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
        logger.error('Error getting XP log:', err);
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
        logger.error('Error getting activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get all achievements
app.get('/api/gamification/achievements', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM achievements ORDER BY category, tier');
        res.json(result.rows);
    } catch (err) {
        logger.error('Error getting achievements:', err);
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
        logger.error('Error getting user achievements:', err);
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
        logger.error('Error getting achievement progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gamification: Get recent unlocked achievements
app.get('/api/gamification/achievements/:userId/recent', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const recent = await db.query(`
            SELECT
                ua.achievement_id,
                ua.unlocked_at,
                a.name,
                a.description,
                a.icon,
                a.xp_reward,
                a.category
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1
            ORDER BY ua.unlocked_at DESC
            LIMIT $2
        `, [parseInt(userId), limit]);

        res.json({
            recent: recent.rows,
            total_unlocked: recent.rows.length
        });
    } catch (err) {
        logger.error('Error getting recent achievements:', err);
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
        logger.error('Error getting global leaderboard:', err);
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
        logger.error('Error getting weekly leaderboard:', err);
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
        logger.error('Error getting user rank:', err);
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
                 VALUES ($1, $2, 50, 20, 10)`,
                [parseInt(userId), today]
            );
            goal = await db.query(
                'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2',
                [parseInt(userId), today]
            );
        }

        res.json(goal.rows[0]);
    } catch (err) {
        logger.error('Error getting daily goals:', err);
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
                [parseInt(userId), today, xpGoal || 50, wordsGoal || 20, quizzesGoal || 10]
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
        logger.error('Error updating daily goals:', err);
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
        logger.error('Error getting learning progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get exercise success rate stats
app.get('/api/analytics/exercise-stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get real exercise statistics from word_learning_progress
        const result = await db.query(
            `SELECT
                exercise_type,
                SUM(correct_count) as correct_count,
                SUM(GREATEST(learn_attempts - correct_count, 0)) as incorrect_count
             FROM word_learning_progress
             WHERE user_id = $1
             GROUP BY exercise_type`,
            [parseInt(userId)]
        );

        // Map exercise types to standard names
        const typeMapping = {
            'flashcards': 'flashcard',
            'multiple_choice': 'multiple_choice',
            'typing': 'typing',
            'word_building': 'word_building'
        };

        const statsMap = {};

        result.rows.forEach(row => {
            const standardType = typeMapping[row.exercise_type] || row.exercise_type;
            statsMap[standardType] = {
                exercise_type: standardType,
                correct_count: parseInt(row.correct_count) || 0,
                incorrect_count: parseInt(row.incorrect_count) || 0
            };
        });

        // Fill in missing types with zeros
        const allTypes = ['multiple_choice', 'word_building', 'typing', 'flashcard'];
        allTypes.forEach(type => {
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
        logger.error('Error getting exercise stats:', err);
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
        logger.error('Error getting difficult words:', err);
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
        logger.error('Error getting study time:', err);
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
        logger.error('Error getting fluency prediction:', err);
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
        logger.error('Error getting global collections:', err);
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
        logger.error('Error getting global collection:', err);
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

            logger.info(`📦 Imported ${importedCount} words from collection ${collectionId} to user ${userId}`);

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
        logger.error('Error importing global collection:', err);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// UNIVERSAL COLLECTIONS API (New Multi-Language Architecture)
// =============================================================================

// Get all universal collections with filtering by native language and source language
// Example: GET /api/universal-collections?native_lang=ru&source_lang=de
// Returns German collections for Russian speakers (ru→de)
app.get('/api/universal-collections', async (req, res) => {
    try {
        const { native_lang, source_lang, level, topic } = req.query;

        let query = 'SELECT * FROM universal_collections WHERE is_public = true';
        let params = [];
        let paramIndex = 1;

        if (source_lang) {
            query += ` AND source_lang = $${paramIndex}`;
            params.push(source_lang);
            paramIndex++;
        }

        if (level) {
            query += ` AND level = $${paramIndex}`;
            params.push(level);
            paramIndex++;
        }

        if (topic) {
            query += ` AND topic = $${paramIndex}`;
            params.push(topic);
            paramIndex++;
        }

        query += ' ORDER BY level, created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        logger.error('Error getting universal collections:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single universal collection with words translated to target language
// Example: GET /api/universal-collections/123?native_lang=ru
// Returns collection with Russian translations
app.get('/api/universal-collections/:collectionId', async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { native_lang } = req.query;

        // Get collection metadata
        const collection = await db.query(
            'SELECT * FROM universal_collections WHERE id = $1 AND is_public = true',
            [parseInt(collectionId)]
        );

        if (collection.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const collectionData = collection.rows[0];
        const source_lang = collectionData.source_lang;

        // Get collection word IDs
        const collectionWords = await db.query(
            'SELECT source_word_id, order_index FROM universal_collection_words WHERE collection_id = $1 ORDER BY order_index',
            [parseInt(collectionId)]
        );

        if (!native_lang) {
            // If no native_lang specified, return without translations
            return res.json({
                ...collectionData,
                words: collectionWords.rows.map(w => ({ source_word_id: w.source_word_id }))
            });
        }

        // Build table name for translations based on native language
        const langMap = {
            'ru': 'russian',
            'pl': 'polish',
            'ar': 'arabic',
            'tr': 'turkish',
            'ro': 'romanian',
            'sr': 'serbian',
            'uk': 'ukrainian',
            'en': 'english',
            'it': 'italian',
            'es': 'spanish',
            'pt': 'portuguese',
            'sw': 'swahili'
        };

        const targetLangTable = langMap[native_lang];
        if (!targetLangTable) {
            return res.status(400).json({ error: `Unsupported native language: ${native_lang}` });
        }

        // Get source words and translations
        const words = await db.query(`
            SELECT
                sw.id,
                sw.word as source_word,
                sw.level,
                sw.example_de,
                tt.translation as native_translation,
                tt.example_native,
                cw.order_index
            FROM universal_collection_words cw
            JOIN source_words_${source_lang === 'de' ? 'german' : source_lang} sw ON cw.source_word_id = sw.id
            LEFT JOIN target_translations_${targetLangTable} tt ON tt.source_word_id = sw.id AND tt.source_lang = $1
            WHERE cw.collection_id = $2
            ORDER BY cw.order_index
        `, [source_lang, parseInt(collectionId)]);

        res.json({
            ...collectionData,
            words: words.rows
        });
    } catch (err) {
        logger.error('Error getting universal collection:', err);
        res.status(500).json({ error: err.message });
    }
});

// Import universal collection to user's personal words
// Example: POST /api/universal-collections/123/import
// Body: { userId, languagePairId, native_lang: 'ru' }
app.post('/api/universal-collections/:collectionId/import', async (req, res) => {
    try {
        const { collectionId } = req.params;
        const { userId, languagePairId, native_lang } = req.body;

        if (!userId || !languagePairId || !native_lang) {
            return res.status(400).json({ error: 'userId, languagePairId, and native_lang are required' });
        }

        // Get collection data with translations
        const collection = await db.query(
            'SELECT * FROM universal_collections WHERE id = $1',
            [parseInt(collectionId)]
        );

        if (collection.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const source_lang = collection.rows[0].source_lang;

        // Build table name for translations
        const langMap = {
            'ru': 'russian',
            'pl': 'polish',
            'ar': 'arabic',
            'tr': 'turkish',
            'ro': 'romanian',
            'sr': 'serbian',
            'uk': 'ukrainian',
            'en': 'english',
            'it': 'italian',
            'es': 'spanish',
            'pt': 'portuguese',
            'sw': 'swahili'
        };

        const targetLangTable = langMap[native_lang];
        if (!targetLangTable) {
            return res.status(400).json({ error: `Unsupported native language: ${native_lang}` });
        }

        // Get words with translations
        const words = await db.query(`
            SELECT
                sw.word as source_word,
                tt.translation as native_translation,
                sw.example_de,
                tt.example_native
            FROM universal_collection_words cw
            JOIN source_words_${source_lang === 'de' ? 'german' : source_lang} sw ON cw.source_word_id = sw.id
            LEFT JOIN target_translations_${targetLangTable} tt ON tt.source_word_id = sw.id AND tt.source_lang = $1
            WHERE cw.collection_id = $2
        `, [source_lang, parseInt(collectionId)]);

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
                    [userId, languagePairId, word.source_word]
                );

                if (existing.rows.length === 0 && word.native_translation) {
                    await db.query(
                        `INSERT INTO words (user_id, language_pair_id, word, translation, example, exampleTranslation, next_review_date)
                         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                        [
                            userId,
                            languagePairId,
                            word.source_word,
                            word.native_translation,
                            word.example_de || '',
                            word.example_native || ''
                        ]
                    );
                    importedCount++;
                }
            }

            // Update collection usage count
            await db.query(
                'UPDATE universal_collections SET usage_count = usage_count + 1 WHERE id = $1',
                [parseInt(collectionId)]
            );

            await db.query('COMMIT');

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
        logger.error('Error importing universal collection:', err);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// OLD GLOBAL COLLECTIONS API (Legacy - for backwards compatibility)
// =============================================================================

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

            logger.info(`✨ Created global collection "${name}" with ${words?.length || 0} words`);

            res.json({
                message: 'Global collection created successfully',
                collection: collectionResult.rows[0]
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        logger.error('Error creating global collection:', err);
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

        logger.info(`👥 User ${userId} beta tester status: ${isBetaTester}`);
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error updating beta tester status:', err);
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
        logger.error('Error checking beta tester status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get comprehensive user profile
app.get('/api/users/:userId/profile', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user basic info
        const userResult = await db.query(
            'SELECT id, name, email, username, bio, avatar_url, is_beta_tester, createdat FROM users WHERE id = $1',
            [parseInt(userId)]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Get stats
        const stats = await getUserStats(parseInt(userId));

        // Get league info
        const leagueResult = await db.query(`
            SELECT ul.weekly_xp, lt.tier_name, lt.tier_level
            FROM user_leagues ul
            JOIN league_tiers lt ON ul.current_tier_id = lt.id
            WHERE ul.user_id = $1
        `, [parseInt(userId)]);

        const league = leagueResult.rows.length > 0 ? {
            current_tier: leagueResult.rows[0].tier_name,
            weekly_xp: leagueResult.rows[0].weekly_xp,
            tier_level: leagueResult.rows[0].tier_level
        } : null;

        // Get achievements count
        const achievementsCount = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE is_unlocked = true) as unlocked_count,
                COUNT(*) as total_count
            FROM user_achievements WHERE user_id = $1
        `, [parseInt(userId)]);

        const achievements = {
            unlocked_count: parseInt(achievementsCount.rows[0]?.unlocked_count || 0),
            total_count: parseInt(achievementsCount.rows[0]?.total_count || 0)
        };

        // Get profile data
        const profileResult = await db.query(
            'SELECT bio, avatar_url, showcase_achievements FROM user_profiles WHERE user_id = $1',
            [parseInt(userId)]
        );

        const profile = profileResult.rows.length > 0 ? profileResult.rows[0] : {
            bio: user.bio,
            avatar_url: user.avatar_url,
            showcase_achievements: []
        };

        // Calculate level progress
        const currentLevel = stats.level || 1;
        const currentXP = stats.total_xp || 0;

        const nextLevelResult = await db.query(
            'SELECT xp_required FROM level_config WHERE level = $1',
            [currentLevel + 1]
        );

        const xpForNextLevel = nextLevelResult.rows.length > 0 ? nextLevelResult.rows[0].xp_required : 0;

        const currentLevelResult = await db.query(
            'SELECT xp_required FROM level_config WHERE level = $1',
            [currentLevel]
        );

        const xpForCurrentLevel = currentLevelResult.rows.length > 0 ? currentLevelResult.rows[0].xp_required : 0;

        const xpNeeded = Math.max(0, xpForNextLevel - currentXP);
        const xpRange = xpForNextLevel - xpForCurrentLevel;
        const xpProgress = currentXP - xpForCurrentLevel;
        const progressPercentage = xpRange > 0 ? ((xpProgress / xpRange) * 100).toFixed(1) : 0;

        const levelProgress = {
            current_xp: currentXP,
            xp_for_next_level: xpForNextLevel,
            xp_needed: xpNeeded,
            progress_percentage: parseFloat(progressPercentage)
        };

        // Get recent activity
        const recentActivity = await db.query(`
            SELECT activity_type, activity_data, created_at
            FROM global_feed
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `, [parseInt(userId)]);

        res.json({
            user: {
                id: user.id,
                username: user.username || user.name,
                email: user.email,
                created_at: user.createdat,
                is_beta_tester: user.is_beta_tester || false
            },
            stats: {
                level: stats.level || 1,
                total_xp: stats.total_xp || 0,
                current_streak: stats.current_streak || 0,
                total_words_learned: stats.total_words_learned || 0,
                total_quizzes_completed: stats.total_quizzes_completed || 0
            },
            league,
            achievements,
            profile,
            level_progress: levelProgress,
            recent_activity: recentActivity.rows
        });
    } catch (err) {
        logger.error('Error getting user profile:', err);
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

            logger.info(`🐛 New report #${reportId} from user ${userId}: ${title}`);

            res.json({
                message: 'Report submitted successfully',
                report: reportResult.rows[0]
            });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        logger.error('Error creating report:', err);
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
        logger.error('Error getting reports:', err);
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
        logger.error('Error getting report details:', err);
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

        logger.info(`📝 Report #${reportId} updated`);
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error updating report:', err);
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

        logger.info(`💬 Comment added to report #${reportId} by user ${userId}`);
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error adding comment:', err);
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

        logger.info(`👍 User ${userId} voted "${voteType}" on report #${reportId}`);
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error voting on report:', err);
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

            logger.info(`🗑️ Report #${reportId} deleted`);
            res.json({ message: 'Report deleted successfully' });
        } catch (err) {
            await db.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        logger.error('Error deleting report:', err);
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
        logger.error('Error getting report stats:', err);
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

            logger.info(`🎯 Generated 3 daily challenges for user ${userId}`);
        }

        res.json(challenges.rows);
    } catch (err) {
        logger.error('Error getting daily challenges:', err);
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
            logger.info(`🎉 User ${userId} completed challenge: ${challengeType}`);
        }

        res.json({
            message: isCompleted ? 'Challenge completed!' : 'Progress updated',
            updated: true,
            progress: newProgress,
            target: userChallenge.target_value,
            completed: isCompleted
        });
    } catch (err) {
        logger.error('Error updating challenge progress:', err);
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

                logger.info(`💰 User ${userId} earned ${ch.reward_coins} coins from challenge`);
            }

            await db.query('COMMIT');

            logger.info(`🎁 User ${userId} claimed reward for challenge: ${ch.title}`);

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
        logger.error('Error claiming challenge reward:', err);
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
        logger.error('Error getting challenge history:', err);
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

        logger.info(`✨ Created new challenge template: ${title}`);
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error creating challenge template:', err);
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
        logger.error('Error getting challenge stats:', err);
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
        logger.error('Error getting coins balance:', err);
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

            logger.info(`💰 User ${userId} earned ${amount} coins (${source})`);

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
        logger.error('Error earning coins:', err);
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

            logger.info(`💸 User ${userId} spent ${amount} coins (${source})`);

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
        logger.error('Error spending coins:', err);
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
        logger.error('Error getting coin history:', err);
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
        logger.error('Error getting shop items:', err);
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

            logger.info(`🛒 User ${userId} purchased ${shopItem.name} x${quantity} for ${totalCost} coins`);

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
        logger.error('Error purchasing item:', err);
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
        logger.error('Error getting user inventory:', err);
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
        logger.error('Error getting global leaderboard:', err);
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
        logger.error('Error getting user position:', err);
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
        logger.error('Error getting nearby leaderboard:', err);
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
        logger.error('Error getting leaderboard stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get friends leaderboard (ranking among friends)
app.get('/api/leaderboard/friends/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type = 'xp' } = req.query; // xp, streak, words

        let query, scoreField, orderBy;

        if (type === 'xp') {
            scoreField = 'us.total_xp';
            orderBy = 'us.total_xp DESC';
        } else if (type === 'streak') {
            scoreField = 'us.current_streak';
            orderBy = 'us.current_streak DESC, us.longest_streak DESC';
        } else if (type === 'words') {
            scoreField = 'us.total_words_learned';
            orderBy = 'us.total_words_learned DESC';
        } else {
            return res.status(400).json({ error: 'Invalid leaderboard type. Use: xp, streak, or words' });
        }

        // Get friends list (both directions) + include self
        query = `
            WITH friends_list AS (
                SELECT DISTINCT
                    CASE
                        WHEN f.user_id = $1 THEN f.friend_id
                        WHEN f.friend_id = $1 THEN f.user_id
                    END as friend_id
                FROM friendships f
                WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'

                UNION

                SELECT $1 as friend_id
            ),
            ranked_friends AS (
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    u.username,
                    ${scoreField} as score,
                    us.level,
                    ${type === 'streak' ? 'us.longest_streak,' : ''}
                    ROW_NUMBER() OVER (ORDER BY ${orderBy}) as rank
                FROM friends_list fl
                INNER JOIN users u ON fl.friend_id = u.id
                INNER JOIN user_stats us ON u.id = us.user_id
            )
            SELECT * FROM ranked_friends
            ORDER BY rank ASC
        `;

        const leaderboard = await db.query(query, [parseInt(userId)]);

        // Find user's rank in the list
        const userRank = leaderboard.rows.find(row => row.id === parseInt(userId));

        res.json({
            type,
            total_friends: leaderboard.rows.length - 1, // Exclude self
            user_rank: userRank ? parseInt(userRank.rank) : null,
            leaderboard: leaderboard.rows
        });
    } catch (err) {
        logger.error('Error getting friends leaderboard:', err);
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
        logger.error('Error getting coin balance:', err);
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
        logger.error('Error earning coins:', err);
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
        logger.error('Error spending coins:', err);
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
        logger.error('Error getting shop items:', err);
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
        logger.error('Error purchasing item:', err);
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
        logger.error('Error getting transaction history:', err);
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
        logger.error('Error getting user purchases:', err);
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

        // Check feature access
        const featureAccess = await checkFeatureAccess(userId, 'friend_requests');
        if (!featureAccess.hasAccess) {
            return res.status(403).json({
                error: 'Feature locked',
                message: `You need level ${featureAccess.requiredLevel} to use this feature`,
                feature_name: featureAccess.featureName,
                current_level: featureAccess.currentLevel,
                levels_remaining: featureAccess.levelsRemaining
            });
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
        logger.error('Error sending friend request:', err);
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
        logger.error('Error accepting friend request:', err);
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
        logger.error('Error declining friend request:', err);
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
        logger.error('Error removing friend:', err);
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
        logger.error('Error getting friends list:', err);
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
        logger.error('Error getting received friend requests:', err);
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
        logger.error('Error getting sent friend requests:', err);
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
        logger.error('Error searching users:', err);
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
        logger.error('Error getting friend activities:', err);
        res.status(500).json({ error: err.message });
    }
});

// Block user
app.post('/api/friends/block', async (req, res) => {
    try {
        const { userId, blockedUserId } = req.body;

        if (!userId || !blockedUserId) {
            return res.status(400).json({ error: 'Missing required fields: userId, blockedUserId' });
        }

        if (parseInt(userId) === parseInt(blockedUserId)) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }

        // Check if friendship exists
        const existingFriendship = await db.query(
            'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [parseInt(userId), parseInt(blockedUserId)]
        );

        if (existingFriendship.rows.length > 0) {
            // Update existing friendship to blocked
            await db.query(`
                UPDATE friendships
                SET status = 'blocked'
                WHERE id = $1
            `, [existingFriendship.rows[0].id]);
        } else {
            // Create new blocked entry
            await db.query(`
                INSERT INTO friendships (user_id, friend_id, status)
                VALUES ($1, $2, 'blocked')
            `, [parseInt(userId), parseInt(blockedUserId)]);
        }

        res.json({ success: true, message: 'User blocked successfully' });
    } catch (err) {
        logger.error('Error blocking user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get blocked users list
app.get('/api/friends/blocked/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const blockedUsers = await db.query(`
            SELECT
                f.id as friendship_id,
                u.id as user_id,
                u.name,
                u.email,
                f.requestedAt as blocked_at
            FROM friendships f
            INNER JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = $1 AND f.status = 'blocked'
            ORDER BY f.requestedAt DESC
        `, [parseInt(userId)]);

        res.json(blockedUsers.rows);
    } catch (err) {
        logger.error('Error getting blocked users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Search users (universal search endpoint)
app.get('/api/users/search', async (req, res) => {
    try {
        const { query, userId, limit = 20 } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const users = await db.query(`
            SELECT
                u.id as user_id,
                u.name as username,
                u.email,
                u.avatar_url,
                us.level,
                us.total_xp,
                CASE
                    WHEN f1.id IS NOT NULL AND f1.status = 'accepted' THEN 'accepted'
                    WHEN f2.id IS NOT NULL AND f2.status = 'pending' THEN 'pending'
                    WHEN f3.id IS NOT NULL AND f3.status = 'pending' THEN 'pending'
                    WHEN f4.id IS NOT NULL AND f4.status = 'blocked' THEN 'blocked'
                    ELSE 'none'
                END as friendship_status
            FROM users u
            LEFT JOIN user_stats us ON u.id = us.user_id
            LEFT JOIN friendships f1 ON ((f1.user_id = $2 AND f1.friend_id = u.id) OR (f1.friend_id = $2 AND f1.user_id = u.id)) AND f1.status = 'accepted'
            LEFT JOIN friendships f2 ON f2.user_id = $2 AND f2.friend_id = u.id AND f2.status = 'pending'
            LEFT JOIN friendships f3 ON f3.friend_id = $2 AND f3.user_id = u.id AND f3.status = 'pending'
            LEFT JOIN friendships f4 ON f4.user_id = $2 AND f4.friend_id = u.id AND f4.status = 'blocked'
            WHERE (LOWER(u.name) LIKE LOWER($1) OR LOWER(u.email) LIKE LOWER($1) OR LOWER(u.username) LIKE LOWER($1))
              AND u.id != $2
            ORDER BY us.total_xp DESC NULLS LAST
            LIMIT $3
        `, [`%${query}%`, userId ? parseInt(userId) : 0, parseInt(limit)]);

        res.json({
            users: users.rows,
            total: users.rows.length
        });
    } catch (err) {
        logger.error('Error searching users:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// DUELS SYSTEM ENDPOINTS
// ========================================

// Create duel challenge
app.post('/api/duels/challenge', async (req, res) => {
    try {
        const { challengerId, opponentId, languagePairId, questionsCount = 10, timeLimitSeconds = 120 } = req.body;

        if (!challengerId || !opponentId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (parseInt(challengerId) === parseInt(opponentId)) {
            return res.status(400).json({ error: 'Cannot challenge yourself' });
        }

        // Check feature access
        const featureAccess = await checkFeatureAccess(challengerId, 'duel_challenges');
        if (!featureAccess.hasAccess) {
            return res.status(403).json({
                error: 'Feature locked',
                message: `You need level ${featureAccess.requiredLevel} to use this feature`,
                feature_name: featureAccess.featureName,
                current_level: featureAccess.currentLevel,
                levels_remaining: featureAccess.levelsRemaining
            });
        }

        // Check if users are friends
        const friendship = await db.query(`
            SELECT * FROM friendships
            WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
              AND status = 'accepted'
        `, [parseInt(challengerId), parseInt(opponentId)]);

        if (friendship.rows.length === 0) {
            return res.status(403).json({ error: 'You can only challenge friends' });
        }

        // Create duel
        const duel = await db.query(`
            INSERT INTO duels (challenger_id, opponent_id, language_pair_id, questions_count, time_limit_seconds)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [parseInt(challengerId), parseInt(opponentId), languagePairId ? parseInt(languagePairId) : null,
            parseInt(questionsCount), parseInt(timeLimitSeconds)]);

        // Log activity
        await db.query(`
            INSERT INTO friend_activities (user_id, activity_type, activity_data)
            VALUES ($1, 'duel_challenge', $2)
        `, [parseInt(challengerId), JSON.stringify({ opponent_id: parseInt(opponentId), duel_id: duel.rows[0].id })]);

        res.json({ success: true, duel: duel.rows[0] });
    } catch (err) {
        logger.error('Error creating duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Respond to duel (accept/decline)
app.post('/api/duels/:duelId/respond', async (req, res) => {
    try {
        const { duelId } = req.params;
        const { userId, action } = req.body;

        const duel = await db.query('SELECT * FROM duels WHERE id = $1', [parseInt(duelId)]);
        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found' });
        }

        const duelData = duel.rows[0];
        if (duelData.opponent_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Only the opponent can respond' });
        }

        if (duelData.status !== 'pending') {
            return res.status(400).json({ error: 'Duel already responded to' });
        }

        if (action === 'accept') {
            await db.query(`UPDATE duels SET status = 'active', started_at = NOW() WHERE id = $1`, [parseInt(duelId)]);
            res.json({ success: true, message: 'Duel accepted', status: 'active' });
        } else if (action === 'decline') {
            await db.query(`UPDATE duels SET status = 'declined' WHERE id = $1`, [parseInt(duelId)]);
            res.json({ success: true, message: 'Duel declined', status: 'declined' });
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        logger.error('Error responding to duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start duel (get words)
app.post('/api/duels/:duelId/start', async (req, res) => {
    try {
        const { duelId } = req.params;
        const { userId } = req.body;

        const duel = await db.query('SELECT * FROM duels WHERE id = $1', [parseInt(duelId)]);
        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found' });
        }

        const duelData = duel.rows[0];
        if (duelData.challenger_id !== parseInt(userId) && duelData.opponent_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Not a participant' });
        }

        if (duelData.status !== 'active') {
            return res.status(400).json({ error: 'Duel not active' });
        }

        // Select random words for duel
        const words = await db.query(`
            SELECT id, word, translation
            FROM words
            WHERE language_pair_id = $1
              AND status IN ('learned', 'reviewing')
            ORDER BY RANDOM()
            LIMIT $2
        `, [duelData.language_pair_id, duelData.questions_count]);

        res.json({
            success: true,
            duel_id: duelData.id,
            questions_count: duelData.questions_count,
            time_limit_seconds: duelData.time_limit_seconds,
            words: words.rows
        });
    } catch (err) {
        logger.error('Error starting duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Submit duel answer
app.post('/api/duels/:duelId/answer', async (req, res) => {
    try {
        const { duelId } = req.params;
        const { userId, wordId, answer, timeTakenMs } = req.body;

        // Verify participant
        const duel = await db.query('SELECT * FROM duels WHERE id = $1', [parseInt(duelId)]);
        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found' });
        }

        const duelData = duel.rows[0];
        if (duelData.challenger_id !== parseInt(userId) && duelData.opponent_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Not a participant' });
        }

        // Get correct answer
        const word = await db.query('SELECT translation FROM words WHERE id = $1', [parseInt(wordId)]);
        if (word.rows.length === 0) {
            return res.status(404).json({ error: 'Word not found' });
        }

        const correctAnswer = word.rows[0].translation.toLowerCase().trim();
        const userAnswer = answer.toLowerCase().trim();
        const isCorrect = userAnswer === correctAnswer;

        // Save answer
        await db.query(`
            INSERT INTO duel_answers (duel_id, user_id, word_id, answer, is_correct, time_taken_ms)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [parseInt(duelId), parseInt(userId), parseInt(wordId), answer, isCorrect, parseInt(timeTakenMs)]);

        res.json({ success: true, is_correct: isCorrect });
    } catch (err) {
        logger.error('Error submitting duel answer:', err);
        res.status(500).json({ error: err.message });
    }
});

// Complete duel (calculate results)
app.post('/api/duels/:duelId/complete', async (req, res) => {
    try {
        const { duelId } = req.params;

        const duel = await db.query('SELECT * FROM duels WHERE id = $1', [parseInt(duelId)]);
        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found' });
        }

        const duelData = duel.rows[0];

        // Get all answers
        const answers = await db.query(`
            SELECT user_id, is_correct, time_taken_ms
            FROM duel_answers
            WHERE duel_id = $1
        `, [parseInt(duelId)]);

        const challengerAnswers = answers.rows.filter(a => a.user_id === duelData.challenger_id);
        const opponentAnswers = answers.rows.filter(a => a.user_id === duelData.opponent_id);

        const challengerScore = challengerAnswers.filter(a => a.is_correct).length;
        const opponentScore = opponentAnswers.filter(a => a.is_correct).length;

        const challengerAvgTime = challengerAnswers.length > 0
            ? Math.round(challengerAnswers.reduce((sum, a) => sum + a.time_taken_ms, 0) / challengerAnswers.length)
            : 0;
        const opponentAvgTime = opponentAnswers.length > 0
            ? Math.round(opponentAnswers.reduce((sum, a) => sum + a.time_taken_ms, 0) / opponentAnswers.length)
            : 0;

        let winnerId = null;
        if (challengerScore > opponentScore) {
            winnerId = duelData.challenger_id;
        } else if (opponentScore > challengerScore) {
            winnerId = duelData.opponent_id;
        }

        // Update duel
        await db.query(`
            UPDATE duels
            SET status = 'completed', winner_id = $1, completed_at = NOW()
            WHERE id = $2
        `, [winnerId, parseInt(duelId)]);

        // Save results
        await db.query(`
            INSERT INTO duel_results (duel_id, challenger_score, opponent_score, challenger_avg_time_ms, opponent_avg_time_ms)
            VALUES ($1, $2, $3, $4, $5)
        `, [parseInt(duelId), challengerScore, opponentScore, challengerAvgTime, opponentAvgTime]);

        // Award XP
        if (winnerId) {
            await db.query(`
                INSERT INTO xp_log (user_id, activity_type, xp_amount, createdat)
                VALUES ($1, 'duel_won', 50, NOW())
            `, [winnerId]);
        }

        // Participation XP
        await db.query(`
            INSERT INTO xp_log (user_id, activity_type, xp_amount, createdat)
            VALUES ($1, 'duel_participated', 20, NOW()), ($2, 'duel_participated', 20, NOW())
        `, [duelData.challenger_id, duelData.opponent_id]);

        res.json({
            success: true,
            winner_id: winnerId,
            results: {
                challenger_score: challengerScore,
                opponent_score: opponentScore,
                challenger_avg_time_ms: challengerAvgTime,
                opponent_avg_time_ms: opponentAvgTime
            }
        });
    } catch (err) {
        logger.error('Error completing duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get duel status
app.get('/api/duels/:duelId', async (req, res) => {
    try {
        const { duelId } = req.params;

        const duel = await db.query(`
            SELECT d.*,
                   u1.name as challenger_name,
                   u2.name as opponent_name,
                   dr.challenger_score,
                   dr.opponent_score
            FROM duels d
            LEFT JOIN users u1 ON d.challenger_id = u1.id
            LEFT JOIN users u2 ON d.opponent_id = u2.id
            LEFT JOIN duel_results dr ON d.id = dr.duel_id
            WHERE d.id = $1
        `, [parseInt(duelId)]);

        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found' });
        }

        res.json(duel.rows[0]);
    } catch (err) {
        logger.error('Error getting duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get duel history
app.get('/api/duels/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;

        const duels = await db.query(`
            SELECT d.*,
                   u1.name as challenger_name,
                   u2.name as opponent_name,
                   dr.challenger_score,
                   dr.opponent_score
            FROM duels d
            LEFT JOIN users u1 ON d.challenger_id = u1.id
            LEFT JOIN users u2 ON d.opponent_id = u2.id
            LEFT JOIN duel_results dr ON d.id = dr.duel_id
            WHERE (d.challenger_id = $1 OR d.opponent_id = $1)
              AND d.status IN ('completed', 'cancelled', 'declined')
            ORDER BY d.created_at DESC
            LIMIT $2
        `, [parseInt(userId), parseInt(limit)]);

        res.json(duels.rows);
    } catch (err) {
        logger.error('Error getting duel history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get active duels
app.get('/api/duels/active/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const duels = await db.query(`
            SELECT d.*,
                   u1.name as challenger_name,
                   u2.name as opponent_name
            FROM duels d
            LEFT JOIN users u1 ON d.challenger_id = u1.id
            LEFT JOIN users u2 ON d.opponent_id = u2.id
            WHERE (d.challenger_id = $1 OR d.opponent_id = $1)
              AND d.status IN ('pending', 'active')
            ORDER BY d.created_at DESC
        `, [parseInt(userId)]);

        res.json(duels.rows);
    } catch (err) {
        logger.error('Error getting active duels:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get duel stats
app.get('/api/duels/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await db.query(`
            SELECT
                COUNT(*) as total_duels,
                SUM(CASE WHEN winner_id = $1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN winner_id IS NOT NULL AND winner_id != $1 THEN 1 ELSE 0 END) as losses,
                SUM(CASE WHEN winner_id IS NULL AND status = 'completed' THEN 1 ELSE 0 END) as draws
            FROM duels
            WHERE (challenger_id = $1 OR opponent_id = $1) AND status = 'completed'
        `, [parseInt(userId)]);

        const totalDuels = parseInt(stats.rows[0].total_duels) || 0;
        const wins = parseInt(stats.rows[0].wins) || 0;
        const losses = parseInt(stats.rows[0].losses) || 0;
        const draws = parseInt(stats.rows[0].draws) || 0;

        const winRate = totalDuels > 0 ? (wins / totalDuels).toFixed(2) : 0;

        res.json({
            total_duels: totalDuels,
            wins,
            losses,
            draws,
            win_rate: parseFloat(winRate)
        });
    } catch (err) {
        logger.error('Error getting duel stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// XP & LEVELS SYSTEM ENDPOINTS
// ========================================

// Get all levels configuration
app.get('/api/levels/config', async (req, res) => {
    try {
        const levels = await db.query('SELECT * FROM level_config ORDER BY level ASC');
        res.json(levels.rows);
    } catch (err) {
        logger.error('Error getting levels config:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user level progress
app.get('/api/users/:userId/level-progress', async (req, res) => {
    try {
        const { userId } = req.params;

        const userStats = await db.query(`
            SELECT level, total_xp
            FROM user_stats
            WHERE user_id = $1
        `, [parseInt(userId)]);

        if (userStats.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { level, total_xp } = userStats.rows[0];

        const currentLevelInfo = await db.query(`
            SELECT xp_required, title
            FROM level_config
            WHERE level = $1
        `, [level]);

        const nextLevelInfo = await db.query(`
            SELECT xp_required, title
            FROM level_config
            WHERE level = $1
        `, [level + 1]);

        const currentLevelXP = level === 1 ? 0 : currentLevelInfo.rows[0].xp_required;
        const nextLevelXP = nextLevelInfo.rows.length > 0 ? nextLevelInfo.rows[0].xp_required : total_xp;

        const xpProgress = total_xp - currentLevelXP;
        const xpNeeded = nextLevelXP - total_xp;
        const progressPercentage = nextLevelInfo.rows.length > 0
            ? ((xpProgress / (nextLevelXP - currentLevelXP)) * 100).toFixed(2)
            : 100;

        res.json({
            current_level: level,
            current_xp: total_xp,
            xp_for_current_level: currentLevelXP,
            xp_for_next_level: nextLevelXP,
            xp_progress: xpProgress,
            xp_needed: xpNeeded > 0 ? xpNeeded : 0,
            progress_percentage: parseFloat(progressPercentage),
            title: currentLevelInfo.rows[0].title,
            next_title: nextLevelInfo.rows.length > 0 ? nextLevelInfo.rows[0].title : 'Max Level'
        });
    } catch (err) {
        logger.error('Error getting level progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Award XP with streak bonus and level up check
app.post('/api/xp/award', async (req, res) => {
    try {
        const { userId, activityType, amount, applyStreakBonus = false } = req.body;

        if (!userId || !activityType || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let finalAmount = parseInt(amount);

        // Apply streak bonus if requested
        if (applyStreakBonus) {
            const streak = await db.query(
                'SELECT current_streak FROM user_stats WHERE user_id = $1',
                [parseInt(userId)]
            );

            if (streak.rows.length > 0 && streak.rows[0].current_streak >= 7) {
                finalAmount = Math.floor(finalAmount * 1.5);
            }
        }

        // Award XP
        await db.query(`
            INSERT INTO xp_log (user_id, activity_type, xp_amount, createdat)
            VALUES ($1, $2, $3, NOW())
        `, [parseInt(userId), activityType, finalAmount]);

        // Update total XP
        await db.query(`
            UPDATE user_stats
            SET total_xp = total_xp + $1
            WHERE user_id = $2
        `, [finalAmount, parseInt(userId)]);

        // Check for level up
        const userStats = await db.query(`
            SELECT total_xp, level
            FROM user_stats
            WHERE user_id = $1
        `, [parseInt(userId)]);

        const { total_xp, level } = userStats.rows[0];

        const nextLevel = await db.query(`
            SELECT xp_required
            FROM level_config
            WHERE level = $1
        `, [level + 1]);

        let leveledUp = false;
        let newLevel = level;

        if (nextLevel.rows.length > 0 && total_xp >= nextLevel.rows[0].xp_required) {
            newLevel = level + 1;
            await db.query(`
                UPDATE user_stats
                SET level = $1, last_level_up_at = NOW()
                WHERE user_id = $2
            `, [newLevel, parseInt(userId)]);

            // Log activity
            await db.query(`
                INSERT INTO friend_activities (user_id, activity_type, activity_data)
                VALUES ($1, 'level_up', $2)
            `, [parseInt(userId), JSON.stringify({ new_level: newLevel })]);

            // Auto-post to global feed (every 5 levels)
            if (newLevel % 5 === 0) {
                await db.query(`
                    INSERT INTO global_feed (user_id, activity_type, activity_data, visibility)
                    VALUES ($1, 'level_up', $2, 'public')
                `, [parseInt(userId), JSON.stringify({ old_level: level, new_level: newLevel, total_xp })]);
            }

            leveledUp = true;
        }

        res.json({
            success: true,
            xp_awarded: finalAmount,
            total_xp,
            leveled_up: leveledUp,
            new_level: leveledUp ? newLevel : level
        });
    } catch (err) {
        logger.error('Error awarding XP:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// CURRENCY SYSTEM ENDPOINTS (Coins & Gems)
// ========================================

// Get user currency balance
app.get('/api/users/:userId/currency', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await db.query(`
            SELECT coins, gems
            FROM user_stats
            WHERE user_id = $1
        `, [parseInt(userId)]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user_id: parseInt(userId),
            coins: result.rows[0].coins || 0,
            gems: result.rows[0].gems || 0
        });
    } catch (err) {
        logger.error('Error getting currency:', err);
        res.status(500).json({ error: err.message });
    }
});

// Award currency (coins or gems)
app.post('/api/currency/award', async (req, res) => {
    try {
        const { userId, currencyType, amount, source, metadata = {} } = req.body;

        if (!userId || !currencyType || !amount || !source) {
            return res.status(400).json({ error: 'Missing required fields: userId, currencyType, amount, source' });
        }

        if (currencyType !== 'coins' && currencyType !== 'gems') {
            return res.status(400).json({ error: 'Invalid currency type. Must be "coins" or "gems"' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        // Update user balance
        const updateQuery = currencyType === 'coins'
            ? 'UPDATE user_stats SET coins = coins + $1 WHERE user_id = $2 RETURNING coins, gems'
            : 'UPDATE user_stats SET gems = gems + $1 WHERE user_id = $2 RETURNING coins, gems';

        const updateResult = await db.query(updateQuery, [parseInt(amount), parseInt(userId)]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log transaction
        await db.query(`
            INSERT INTO currency_transactions (user_id, currency_type, amount, transaction_type, source, metadata)
            VALUES ($1, $2, $3, 'earned', $4, $5)
        `, [parseInt(userId), currencyType, parseInt(amount), source, JSON.stringify(metadata)]);

        res.json({
            success: true,
            currency_type: currencyType,
            amount_awarded: parseInt(amount),
            new_balance: {
                coins: updateResult.rows[0].coins || 0,
                gems: updateResult.rows[0].gems || 0
            },
            source
        });
    } catch (err) {
        logger.error('Error awarding currency:', err);
        res.status(500).json({ error: err.message });
    }
});

// Spend currency
app.post('/api/currency/spend', async (req, res) => {
    try {
        const { userId, currencyType, amount, source, metadata = {} } = req.body;

        if (!userId || !currencyType || !amount || !source) {
            return res.status(400).json({ error: 'Missing required fields: userId, currencyType, amount, source' });
        }

        if (currencyType !== 'coins' && currencyType !== 'gems') {
            return res.status(400).json({ error: 'Invalid currency type. Must be "coins" or "gems"' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        // Check current balance
        const balanceCheck = await db.query(`
            SELECT coins, gems FROM user_stats WHERE user_id = $1
        `, [parseInt(userId)]);

        if (balanceCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = currencyType === 'coins'
            ? balanceCheck.rows[0].coins || 0
            : balanceCheck.rows[0].gems || 0;

        if (currentBalance < amount) {
            return res.status(400).json({
                error: 'Insufficient balance',
                current_balance: currentBalance,
                required: amount
            });
        }

        // Deduct currency
        const updateQuery = currencyType === 'coins'
            ? 'UPDATE user_stats SET coins = coins - $1 WHERE user_id = $2 RETURNING coins, gems'
            : 'UPDATE user_stats SET gems = gems - $1 WHERE user_id = $2 RETURNING coins, gems';

        const updateResult = await db.query(updateQuery, [parseInt(amount), parseInt(userId)]);

        // Log transaction
        await db.query(`
            INSERT INTO currency_transactions (user_id, currency_type, amount, transaction_type, source, metadata)
            VALUES ($1, $2, $3, 'spent', $4, $5)
        `, [parseInt(userId), currencyType, parseInt(amount), source, JSON.stringify(metadata)]);

        res.json({
            success: true,
            currency_type: currencyType,
            amount_spent: parseInt(amount),
            new_balance: {
                coins: updateResult.rows[0].coins || 0,
                gems: updateResult.rows[0].gems || 0
            },
            source
        });
    } catch (err) {
        logger.error('Error spending currency:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get currency transaction history
app.get('/api/currency/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0, currencyType, transactionType } = req.query;

        let query = `
            SELECT id, currency_type, amount, transaction_type, source, metadata, created_at
            FROM currency_transactions
            WHERE user_id = $1
        `;
        const params = [parseInt(userId)];
        let paramCount = 1;

        if (currencyType) {
            paramCount++;
            query += ` AND currency_type = $${paramCount}`;
            params.push(currencyType);
        }

        if (transactionType) {
            paramCount++;
            query += ` AND transaction_type = $${paramCount}`;
            params.push(transactionType);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM currency_transactions WHERE user_id = $1';
        const countParams = [parseInt(userId)];

        if (currencyType) {
            countQuery += ' AND currency_type = $2';
            countParams.push(currencyType);
        }

        const countResult = await db.query(countQuery, countParams);

        res.json({
            transactions: result.rows,
            total_count: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        logger.error('Error getting transaction history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get shop items
app.get('/api/shop/items', async (req, res) => {
    try {
        const { currencyType } = req.query;

        const shopItems = [
            // Coins items
            { id: 'streak_freeze_1', name: 'Streak Freeze (1 day)', currency: 'coins', price: 50, category: 'streak', icon: '❄️' },
            { id: 'streak_freeze_3', name: 'Streak Freeze (3 days)', currency: 'coins', price: 120, category: 'streak', icon: '❄️' },
            { id: 'streak_freeze_7', name: 'Streak Freeze (7 days)', currency: 'coins', price: 250, category: 'streak', icon: '❄️' },
            { id: 'hint_pack_5', name: 'Hint Pack (5 hints)', currency: 'coins', price: 50, category: 'hints', icon: '💡' },
            { id: 'hint_pack_20', name: 'Hint Pack (20 hints)', currency: 'coins', price: 180, category: 'hints', icon: '💡' },
            { id: 'theme_dark_purple', name: 'Dark Purple Theme', currency: 'coins', price: 100, category: 'themes', icon: '🎨' },
            { id: 'theme_ocean_blue', name: 'Ocean Blue Theme', currency: 'coins', price: 100, category: 'themes', icon: '🎨' },

            // Gems items
            { id: 'avatar_premium_1', name: 'Premium Avatar Pack', currency: 'gems', price: 50, category: 'avatars', icon: '👤' },
            { id: 'xp_boost_1day', name: 'Double XP (1 day)', currency: 'gems', price: 30, category: 'boosts', icon: '⚡' },
            { id: 'xp_boost_3days', name: 'Double XP (3 days)', currency: 'gems', price: 75, category: 'boosts', icon: '⚡' },
            { id: 'extra_challenge_slot', name: 'Extra Challenge Slot', currency: 'gems', price: 25, category: 'features', icon: '🎯' },
            { id: 'theme_premium_gold', name: 'Premium Gold Theme', currency: 'gems', price: 100, category: 'themes', icon: '🎨' }
        ];

        let filteredItems = shopItems;
        if (currencyType) {
            filteredItems = shopItems.filter(item => item.currency === currencyType);
        }

        res.json({ items: filteredItems });
    } catch (err) {
        logger.error('Error getting shop items:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// LEAGUES SYSTEM ENDPOINTS
// ========================================

// Get all league tiers
app.get('/api/leagues/tiers', async (req, res) => {
    try {
        const tiers = await db.query(`
            SELECT id, tier_name, tier_level, min_weekly_xp, icon, color_hex,
                   promotion_bonus_coins, promotion_bonus_gems
            FROM league_tiers
            ORDER BY tier_level ASC
        `);
        res.json({ tiers: tiers.rows });
    } catch (err) {
        logger.error('Error getting league tiers:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's current league status
app.get('/api/leagues/:userId/current', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get or create user league entry
        let userLeague = await db.query(`
            SELECT ul.*, lt.tier_name, lt.tier_level, lt.icon, lt.color_hex, lt.min_weekly_xp
            FROM user_leagues ul
            JOIN league_tiers lt ON ul.current_tier_id = lt.id
            WHERE ul.user_id = $1
        `, [parseInt(userId)]);

        if (userLeague.rows.length === 0) {
            // Create initial league entry (Bronze tier)
            const bronzeTier = await db.query('SELECT id FROM league_tiers WHERE tier_level = 1');
            const weekStart = new Date();
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

            await db.query(`
                INSERT INTO user_leagues (user_id, current_tier_id, weekly_xp, week_start_date)
                VALUES ($1, $2, 0, $3)
            `, [parseInt(userId), bronzeTier.rows[0].id, weekStart]);

            userLeague = await db.query(`
                SELECT ul.*, lt.tier_name, lt.tier_level, lt.icon, lt.color_hex, lt.min_weekly_xp
                FROM user_leagues ul
                JOIN league_tiers lt ON ul.current_tier_id = lt.id
                WHERE ul.user_id = $1
            `, [parseInt(userId)]);
        }

        // Get leaderboard position within current tier
        const position = await db.query(`
            SELECT COUNT(*) + 1 as position
            FROM user_leagues ul1
            JOIN user_leagues ul2 ON ul1.current_tier_id = ul2.current_tier_id
            WHERE ul1.user_id = $1 AND ul2.weekly_xp > ul1.weekly_xp
        `, [parseInt(userId)]);

        res.json({
            ...userLeague.rows[0],
            position: parseInt(position.rows[0].position)
        });
    } catch (err) {
        logger.error('Error getting current league:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's league history
app.get('/api/leagues/:userId/history', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        const history = await db.query(`
            SELECT lh.*,
                   lt_from.tier_name as from_tier_name,
                   lt_from.icon as from_tier_icon,
                   lt_to.tier_name as to_tier_name,
                   lt_to.icon as to_tier_icon
            FROM league_history lh
            LEFT JOIN league_tiers lt_from ON lh.from_tier_id = lt_from.id
            LEFT JOIN league_tiers lt_to ON lh.to_tier_id = lt_to.id
            WHERE lh.user_id = $1
            ORDER BY lh.created_at DESC
            LIMIT $2
        `, [parseInt(userId), parseInt(limit)]);

        res.json({ history: history.rows });
    } catch (err) {
        logger.error('Error getting league history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get leaderboard for specific tier
app.get('/api/leagues/:tierId/leaderboard', async (req, res) => {
    try {
        const { tierId } = req.params;
        const { limit = 100 } = req.query;

        const leaderboard = await db.query(`
            SELECT ul.user_id, ul.weekly_xp, ul.week_start_date,
                   u.username, u.avatar_url,
                   us.level, us.total_xp,
                   ROW_NUMBER() OVER (ORDER BY ul.weekly_xp DESC) as position
            FROM user_leagues ul
            JOIN users u ON ul.user_id = u.id
            JOIN user_stats us ON ul.user_id = us.user_id
            WHERE ul.current_tier_id = $1
            ORDER BY ul.weekly_xp DESC
            LIMIT $2
        `, [parseInt(tierId), parseInt(limit)]);

        res.json({ leaderboard: leaderboard.rows });
    } catch (err) {
        logger.error('Error getting league leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get progress to next league
app.get('/api/leagues/:userId/progress', async (req, res) => {
    try {
        const { userId } = req.params;

        const userLeague = await db.query(`
            SELECT ul.weekly_xp, ul.current_tier_id,
                   lt.tier_name, lt.tier_level, lt.min_weekly_xp, lt.icon
            FROM user_leagues ul
            JOIN league_tiers lt ON ul.current_tier_id = lt.id
            WHERE ul.user_id = $1
        `, [parseInt(userId)]);

        if (userLeague.rows.length === 0) {
            return res.status(404).json({ error: 'User league not found' });
        }

        const currentTier = userLeague.rows[0];
        const nextTier = await db.query(`
            SELECT id, tier_name, tier_level, min_weekly_xp, icon, color_hex,
                   promotion_bonus_coins, promotion_bonus_gems
            FROM league_tiers
            WHERE tier_level = $1
        `, [currentTier.tier_level + 1]);

        if (nextTier.rows.length === 0) {
            // Already at max tier
            return res.json({
                current_tier: currentTier,
                weekly_xp: currentTier.weekly_xp,
                next_tier: null,
                xp_needed: 0,
                progress_percentage: 100,
                is_max_tier: true
            });
        }

        const xpNeeded = nextTier.rows[0].min_weekly_xp - currentTier.weekly_xp;
        const xpForNext = nextTier.rows[0].min_weekly_xp - currentTier.min_weekly_xp;
        const xpProgress = currentTier.weekly_xp - currentTier.min_weekly_xp;
        const progressPercentage = xpForNext > 0 ? ((xpProgress / xpForNext) * 100).toFixed(2) : 0;

        res.json({
            current_tier: currentTier,
            weekly_xp: currentTier.weekly_xp,
            next_tier: nextTier.rows[0],
            xp_needed: Math.max(0, xpNeeded),
            progress_percentage: parseFloat(progressPercentage),
            is_max_tier: false
        });
    } catch (err) {
        logger.error('Error getting league progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Award weekly XP (integrated with XP system)
app.post('/api/leagues/:userId/award-weekly-xp', async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid XP amount' });
        }

        // Check feature access
        const featureAccess = await checkFeatureAccess(userId, 'league_participation');
        if (!featureAccess.hasAccess) {
            return res.status(403).json({
                error: 'Feature locked',
                message: `You need level ${featureAccess.requiredLevel} to use this feature`,
                feature_name: featureAccess.featureName,
                current_level: featureAccess.currentLevel,
                levels_remaining: featureAccess.levelsRemaining
            });
        }

        // Check if user league exists, create if not
        const existingLeague = await db.query('SELECT * FROM user_leagues WHERE user_id = $1', [parseInt(userId)]);

        if (existingLeague.rows.length === 0) {
            // Create initial league entry
            const bronzeTier = await db.query('SELECT id FROM league_tiers WHERE tier_level = 1');
            const weekStart = new Date();
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

            await db.query(`
                INSERT INTO user_leagues (user_id, current_tier_id, weekly_xp, week_start_date)
                VALUES ($1, $2, 0, $3)
            `, [parseInt(userId), bronzeTier.rows[0].id, weekStart]);
        }

        // Update weekly XP
        const updated = await db.query(`
            UPDATE user_leagues
            SET weekly_xp = weekly_xp + $1, updated_at = NOW()
            WHERE user_id = $2
            RETURNING weekly_xp
        `, [parseInt(amount), parseInt(userId)]);

        res.json({
            success: true,
            weekly_xp: updated.rows[0].weekly_xp,
            xp_added: parseInt(amount)
        });
    } catch (err) {
        logger.error('Error awarding weekly XP:', err);
        res.status(500).json({ error: err.message });
    }
});

// Process week end (admin only - manual trigger)
app.post('/api/admin/leagues/process-week-end', async (req, res) => {
    try {
        const { adminKey } = req.body;

        // Simple admin key check (in production, use proper auth)
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-12345') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const allUsers = await db.query(`
            SELECT ul.*, lt.tier_level, lt.min_weekly_xp, lt.promotion_bonus_coins, lt.promotion_bonus_gems
            FROM user_leagues ul
            JOIN league_tiers lt ON ul.current_tier_id = lt.id
        `);

        const results = {
            promotions: 0,
            demotions: 0,
            same_tier: 0,
            total_processed: allUsers.rows.length
        };

        for (const user of allUsers.rows) {
            const nextTier = await db.query(
                'SELECT * FROM league_tiers WHERE tier_level = $1',
                [user.tier_level + 1]
            );
            const prevTier = await db.query(
                'SELECT * FROM league_tiers WHERE tier_level = $1',
                [user.tier_level - 1]
            );

            const weekEnd = new Date();
            let actionType = 'same';
            let newTierId = user.current_tier_id;
            let rewardCoins = 25; // Small reward for maintaining tier
            let rewardGems = 0;

            // Check promotion
            if (nextTier.rows.length > 0 && user.weekly_xp >= nextTier.rows[0].min_weekly_xp) {
                actionType = 'promotion';
                newTierId = nextTier.rows[0].id;
                rewardCoins = user.promotion_bonus_coins;
                rewardGems = user.promotion_bonus_gems;
                results.promotions++;

                // Update promotion count and highest tier
                await db.query(`
                    UPDATE user_leagues
                    SET promotion_count = promotion_count + 1,
                        highest_tier_reached = GREATEST(highest_tier_reached, $1)
                    WHERE user_id = $2
                `, [nextTier.rows[0].tier_level, user.user_id]);

                // Auto-post to global feed
                const currentTier = await db.query('SELECT tier_name FROM league_tiers WHERE id = $1', [user.current_tier_id]);
                await db.query(`
                    INSERT INTO global_feed (user_id, activity_type, activity_data, visibility)
                    VALUES ($1, 'league_promoted', $2, 'public')
                `, [user.user_id, JSON.stringify({
                    from_tier: currentTier.rows[0].tier_name,
                    to_tier: nextTier.rows[0].tier_name,
                    weekly_xp: user.weekly_xp
                })]);

            // Check demotion
            } else if (prevTier.rows.length > 0 && user.weekly_xp < (user.min_weekly_xp * 0.5)) {
                actionType = 'demotion';
                newTierId = prevTier.rows[0].id;
                rewardCoins = 0;
                rewardGems = 0;
                results.demotions++;

                await db.query(
                    'UPDATE user_leagues SET demotion_count = demotion_count + 1 WHERE user_id = $1',
                    [user.user_id]
                );
            } else {
                results.same_tier++;
            }

            // Log history
            await db.query(`
                INSERT INTO league_history
                (user_id, from_tier_id, to_tier_id, week_start_date, week_end_date, weekly_xp_earned, action_type, reward_coins, reward_gems)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [user.user_id, user.current_tier_id, newTierId, user.week_start_date, weekEnd, user.weekly_xp, actionType, rewardCoins, rewardGems]);

            // Award rewards
            if (rewardCoins > 0) {
                await db.query('UPDATE user_stats SET coins = coins + $1 WHERE user_id = $2', [rewardCoins, user.user_id]);
            }
            if (rewardGems > 0) {
                await db.query('UPDATE user_stats SET gems = gems + $1 WHERE user_id = $2', [rewardGems, user.user_id]);
            }

            // Update user league for new week
            const newWeekStart = new Date();
            newWeekStart.setHours(0, 0, 0, 0);
            newWeekStart.setDate(newWeekStart.getDate() - newWeekStart.getDay() + 1);

            await db.query(`
                UPDATE user_leagues
                SET current_tier_id = $1,
                    weekly_xp = 0,
                    week_start_date = $2,
                    updated_at = NOW()
                WHERE user_id = $3
            `, [newTierId, newWeekStart, user.user_id]);
        }

        res.json({
            success: true,
            message: 'Week end processed successfully',
            results
        });
    } catch (err) {
        logger.error('Error processing week end:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// TOURNAMENTS SYSTEM ENDPOINTS
// ========================================

// Get all tournaments
app.get('/api/tournaments', async (req, res) => {
    try {
        const { status, type } = req.query;

        let query = 'SELECT * FROM tournaments WHERE 1=1';
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }
        if (type) {
            params.push(type);
            query += ` AND tournament_type = $${params.length}`;
        }

        query += ' ORDER BY start_date DESC';

        const tournaments = await db.query(query, params);
        res.json({ tournaments: tournaments.rows });
    } catch (err) {
        logger.error('Error getting tournaments:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get tournament details
app.get('/api/tournaments/:tournamentId', async (req, res) => {
    try {
        const { tournamentId } = req.params;

        const tournament = await db.query('SELECT * FROM tournaments WHERE id = $1', [parseInt(tournamentId)]);

        if (tournament.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const participantsCount = await db.query(
            'SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1',
            [parseInt(tournamentId)]
        );

        res.json({
            ...tournament.rows[0],
            participants_count: parseInt(participantsCount.rows[0].count)
        });
    } catch (err) {
        logger.error('Error getting tournament:', err);
        res.status(500).json({ error: err.message });
    }
});

// Register for tournament
app.post('/api/tournaments/:tournamentId/register', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        // Check feature access
        const featureAccess = await checkFeatureAccess(userId, 'tournament_participation');
        if (!featureAccess.hasAccess) {
            return res.status(403).json({
                error: 'Feature locked',
                message: `You need level ${featureAccess.requiredLevel} to use this feature`,
                feature_name: featureAccess.featureName,
                current_level: featureAccess.currentLevel,
                levels_remaining: featureAccess.levelsRemaining
            });
        }

        const tournament = await db.query('SELECT * FROM tournaments WHERE id = $1', [parseInt(tournamentId)]);

        if (tournament.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.rows[0].status !== 'registration') {
            return res.status(400).json({ error: 'Tournament registration is closed' });
        }

        if (new Date() > new Date(tournament.rows[0].registration_deadline)) {
            return res.status(400).json({ error: 'Registration deadline passed' });
        }

        const participantsCount = await db.query(
            'SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1',
            [parseInt(tournamentId)]
        );

        if (parseInt(participantsCount.rows[0].count) >= tournament.rows[0].max_participants) {
            return res.status(400).json({ error: 'Tournament is full' });
        }

        await db.query(`
            INSERT INTO tournament_participants (tournament_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (tournament_id, user_id) DO NOTHING
        `, [parseInt(tournamentId), parseInt(userId)]);

        res.json({ success: true, message: 'Registered successfully' });
    } catch (err) {
        logger.error('Error registering for tournament:', err);
        res.status(500).json({ error: err.message });
    }
});

// Unregister from tournament
app.delete('/api/tournaments/:tournamentId/unregister', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const tournament = await db.query('SELECT status FROM tournaments WHERE id = $1', [parseInt(tournamentId)]);

        if (tournament.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        if (tournament.rows[0].status !== 'registration') {
            return res.status(400).json({ error: 'Cannot unregister after tournament started' });
        }

        await db.query(`
            DELETE FROM tournament_participants
            WHERE tournament_id = $1 AND user_id = $2
        `, [parseInt(tournamentId), parseInt(userId)]);

        res.json({ success: true, message: 'Unregistered successfully' });
    } catch (err) {
        logger.error('Error unregistering from tournament:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get tournament bracket
app.get('/api/tournaments/:tournamentId/bracket', async (req, res) => {
    try {
        const { tournamentId } = req.params;

        const matches = await db.query(`
            SELECT tm.*,
                   u1.username as player1_username,
                   u2.username as player2_username
            FROM tournament_matches tm
            LEFT JOIN users u1 ON tm.player1_id = u1.id
            LEFT JOIN users u2 ON tm.player2_id = u2.id
            WHERE tm.tournament_id = $1
            ORDER BY tm.round_number ASC, tm.match_number ASC
        `, [parseInt(tournamentId)]);

        res.json({ matches: matches.rows });
    } catch (err) {
        logger.error('Error getting bracket:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get tournament participants
app.get('/api/tournaments/:tournamentId/participants', async (req, res) => {
    try {
        const { tournamentId } = req.params;

        const participants = await db.query(`
            SELECT tp.*, u.username, u.avatar_url, us.level, us.total_xp
            FROM tournament_participants tp
            JOIN users u ON tp.user_id = u.id
            JOIN user_stats us ON tp.user_id = us.user_id
            WHERE tp.tournament_id = $1
            ORDER BY tp.seed ASC NULLS LAST, tp.registered_at ASC
        `, [parseInt(tournamentId)]);

        res.json({ participants: participants.rows });
    } catch (err) {
        logger.error('Error getting participants:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create tournament (admin)
app.post('/api/admin/tournaments/create', async (req, res) => {
    try {
        const { adminKey, title, description, tournament_type, bracket_type, start_date, end_date, registration_deadline, max_participants, prizes } = req.body;

        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-12345') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await db.query(`
            INSERT INTO tournaments (title, description, tournament_type, bracket_type, start_date, end_date, registration_deadline, max_participants,
                                   prize_1st_coins, prize_1st_gems, prize_2nd_coins, prize_2nd_gems, prize_3rd_coins, prize_3rd_gems)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [title, description, tournament_type, bracket_type, start_date, end_date, registration_deadline, max_participants || 64,
            prizes?.first?.coins || 500, prizes?.first?.gems || 50,
            prizes?.second?.coins || 300, prizes?.second?.gems || 30,
            prizes?.third?.coins || 150, prizes?.third?.gems || 15
        ]);

        res.json({ success: true, tournament: result.rows[0] });
    } catch (err) {
        logger.error('Error creating tournament:', err);
        res.status(500).json({ error: err.message });
    }
});

// Generate bracket (admin)
app.post('/api/admin/tournaments/:tournamentId/generate-bracket', async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const { adminKey } = req.body;

        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-12345') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const tournament = await db.query('SELECT * FROM tournaments WHERE id = $1', [parseInt(tournamentId)]);

        if (tournament.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const participants = await db.query(`
            SELECT tp.*, us.total_xp
            FROM tournament_participants tp
            JOIN user_stats us ON tp.user_id = us.user_id
            WHERE tp.tournament_id = $1
            ORDER BY us.total_xp DESC
        `, [parseInt(tournamentId)]);

        if (participants.rows.length < 2) {
            return res.status(400).json({ error: 'Need at least 2 participants' });
        }

        const playerCount = participants.rows.length;
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(playerCount)));

        for (let i = 0; i < participants.rows.length; i++) {
            await db.query('UPDATE tournament_participants SET seed = $1 WHERE id = $2', [i + 1, participants.rows[i].id]);
        }

        const round1Matches = Math.floor(nextPowerOf2 / 2);
        const matchesCreated = [];

        for (let i = 0; i < round1Matches; i++) {
            const highSeed = i;
            const lowSeed = playerCount - 1 - i;

            const player1 = highSeed < playerCount ? participants.rows[highSeed].user_id : null;
            const player2 = lowSeed >= 0 && lowSeed < playerCount ? participants.rows[lowSeed].user_id : null;

            if (player1 && player2) {
                const match = await db.query(`
                    INSERT INTO tournament_matches (tournament_id, round_number, match_number, player1_id, player2_id)
                    VALUES ($1, 1, $2, $3, $4)
                    RETURNING *
                `, [parseInt(tournamentId), i + 1, player1, player2]);
                matchesCreated.push(match.rows[0]);
            } else if (player1) {
                await db.query(`
                    UPDATE tournament_participants SET current_round = 2 WHERE tournament_id = $1 AND user_id = $2
                `, [parseInt(tournamentId), player1]);
            }
        }

        await db.query('UPDATE tournaments SET status = $1 WHERE id = $2', ['in_progress', parseInt(tournamentId)]);

        res.json({ success: true, matches_created: matchesCreated.length, bracket_size: nextPowerOf2 });
    } catch (err) {
        logger.error('Error generating bracket:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// GLOBAL FEED SYSTEM ENDPOINTS
// ========================================

// Get global feed
app.get('/api/feed/global', async (req, res) => {
    try {
        const { limit = 20, offset = 0, activity_type, time_period } = req.query;

        let query = `
            SELECT gf.*, u.username, u.avatar_url
            FROM global_feed gf
            JOIN users u ON gf.user_id = u.id
            WHERE gf.visibility = 'public'
        `;
        const params = [];

        if (activity_type) {
            params.push(activity_type);
            query += ` AND gf.activity_type = $${params.length}`;
        }

        if (time_period) {
            let timeFilter = '';
            if (time_period === 'today') timeFilter = "gf.created_at >= CURRENT_DATE";
            else if (time_period === 'week') timeFilter = "gf.created_at >= CURRENT_DATE - INTERVAL '7 days'";
            else if (time_period === 'month') timeFilter = "gf.created_at >= CURRENT_DATE - INTERVAL '30 days'";

            if (timeFilter) query += ` AND ${timeFilter}`;
        }

        query += ` ORDER BY gf.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const feed = await db.query(query, params);
        res.json({ feed: feed.rows, count: feed.rows.length });
    } catch (err) {
        logger.error('Error getting global feed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user feed
app.get('/api/feed/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const feed = await db.query(`
            SELECT gf.*, u.username, u.avatar_url
            FROM global_feed gf
            JOIN users u ON gf.user_id = u.id
            WHERE gf.user_id = $1
            ORDER BY gf.created_at DESC
            LIMIT $2 OFFSET $3
        `, [parseInt(userId), parseInt(limit), parseInt(offset)]);

        res.json({ feed: feed.rows });
    } catch (err) {
        logger.error('Error getting user feed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create post
app.post('/api/feed/post', async (req, res) => {
    try {
        const { userId, activity_type, activity_data, visibility = 'public' } = req.body;

        if (!userId || !activity_type || !activity_data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await db.query(`
            INSERT INTO global_feed (user_id, activity_type, activity_data, visibility)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [parseInt(userId), activity_type, JSON.stringify(activity_data), visibility]);

        res.json({ success: true, post: result.rows[0] });
    } catch (err) {
        logger.error('Error creating post:', err);
        res.status(500).json({ error: err.message });
    }
});

// Like/Unlike post
app.post('/api/feed/:feedId/like', async (req, res) => {
    try {
        const { feedId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const existing = await db.query('SELECT * FROM feed_likes WHERE feed_id = $1 AND user_id = $2',
            [parseInt(feedId), parseInt(userId)]);

        if (existing.rows.length > 0) {
            await db.query('DELETE FROM feed_likes WHERE feed_id = $1 AND user_id = $2',
                [parseInt(feedId), parseInt(userId)]);
            await db.query('UPDATE global_feed SET likes_count = likes_count - 1 WHERE id = $1', [parseInt(feedId)]);
            res.json({ success: true, action: 'unliked' });
        } else {
            await db.query('INSERT INTO feed_likes (feed_id, user_id) VALUES ($1, $2)',
                [parseInt(feedId), parseInt(userId)]);
            await db.query('UPDATE global_feed SET likes_count = likes_count + 1 WHERE id = $1', [parseInt(feedId)]);
            res.json({ success: true, action: 'liked' });
        }
    } catch (err) {
        logger.error('Error liking post:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add comment
app.post('/api/feed/:feedId/comment', async (req, res) => {
    try {
        const { feedId } = req.params;
        const { userId, comment_text } = req.body;

        if (!userId || !comment_text) {
            return res.status(400).json({ error: 'userId and comment_text required' });
        }

        const comment = await db.query(`
            INSERT INTO feed_comments (feed_id, user_id, comment_text)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [parseInt(feedId), parseInt(userId), comment_text]);

        await db.query('UPDATE global_feed SET comments_count = comments_count + 1 WHERE id = $1', [parseInt(feedId)]);

        res.json({ success: true, comment: comment.rows[0] });
    } catch (err) {
        logger.error('Error adding comment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get comments
app.get('/api/feed/:feedId/comments', async (req, res) => {
    try {
        const { feedId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const comments = await db.query(`
            SELECT fc.*, u.username, u.avatar_url
            FROM feed_comments fc
            JOIN users u ON fc.user_id = u.id
            WHERE fc.feed_id = $1
            ORDER BY fc.created_at ASC
            LIMIT $2 OFFSET $3
        `, [parseInt(feedId), parseInt(limit), parseInt(offset)]);

        res.json({ comments: comments.rows });
    } catch (err) {
        logger.error('Error getting comments:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete post
app.delete('/api/feed/:feedId', async (req, res) => {
    try {
        const { feedId } = req.params;
        const { userId, adminKey } = req.body;

        const post = await db.query('SELECT user_id FROM global_feed WHERE id = $1', [parseInt(feedId)]);

        if (post.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const isAdmin = adminKey === process.env.ADMIN_KEY || adminKey === 'dev-admin-key-12345';
        const isOwner = post.rows[0].user_id === parseInt(userId);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.query('DELETE FROM global_feed WHERE id = $1', [parseInt(feedId)]);
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        logger.error('Error deleting post:', err);
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
        logger.error('Error getting achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's unlocked achievements
app.get('/api/achievements/unlocked/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Check feature access
        const featureAccess = await checkFeatureAccess(userId, 'achievement_tracking');
        if (!featureAccess.hasAccess) {
            return res.status(403).json({
                error: 'Feature locked',
                message: `You need level ${featureAccess.requiredLevel} to use this feature`,
                feature_name: featureAccess.featureName,
                current_level: featureAccess.currentLevel,
                levels_remaining: featureAccess.levelsRemaining
            });
        }

        const unlocked = await db.query(`
            SELECT ua.*, a.title, a.description, a.icon, a.category, a.difficulty, a.reward_xp, a.reward_coins
            FROM user_achievements ua
            INNER JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1 AND ua.is_unlocked = true
            ORDER BY ua.unlockedAt DESC
        `, [parseInt(userId)]);

        res.json(unlocked.rows);
    } catch (err) {
        logger.error('Error getting unlocked achievements:', err);
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

            // Auto-post to global feed
            await db.query(`
                INSERT INTO global_feed (user_id, activity_type, activity_data, visibility)
                VALUES ($1, 'achievement_unlocked', $2, 'public')
            `, [parseInt(userId), JSON.stringify({
                achievement_title: ach.title,
                achievement_description: ach.description,
                reward_xp: ach.reward_xp,
                reward_coins: ach.reward_coins
            })]);

            await db.query('COMMIT');

            logger.info(`🏆 User ${userId} unlocked achievement: ${ach.title}`);

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
        logger.error('Error updating achievement progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// WORD LISTS ENDPOINTS
// ========================================

// Get all word lists (global collections)
app.get('/api/word-lists', async (req, res) => {
    try {
        const { language, from_lang, to_lang, category, difficulty, topic } = req.query;

        // Helper function to convert language names to codes
        const languageMap = {
            'German': 'de',
            'English': 'en',
            'Russian': 'ru',
            'Spanish': 'es',
            'French': 'fr',
            'Italian': 'it',
            'Portuguese': 'pt',
            'Polish': 'pl',
            'Arabic': 'ar',
            'Turkish': 'tr',
            'Romanian': 'ro',
            'Serbian': 'sr',
            'Ukrainian': 'uk',
            'Swahili': 'sw',
            'Chinese': 'zh',
            'Japanese': 'ja',
            'Korean': 'ko'
        };

        const normalizeLanguage = (lang) => {
            if (!lang) return null;
            // If it's already a 2-letter code, return as-is
            if (lang.length === 2) return lang.toLowerCase();
            // Otherwise, try to map from full name to code
            return languageMap[lang] || lang.toLowerCase();
        };

        // Universal collections architecture mapping:
        // OLD: from_lang=de, to_lang=ru means "German words for Russian speakers"
        // NEW: source_lang=de in universal_collections + target_translations_russian
        // So: from_lang maps to source_lang, to_lang maps to native language for translations

        const source_lang = normalizeLanguage(from_lang || language);  // Language being learned (de)
        const native_lang = normalizeLanguage(to_lang);  // Native language for translations (ru)

        if (!source_lang) {
            // If no from_lang specified, return empty result
            return res.json([]);
        }

        let query = 'SELECT * FROM universal_collections WHERE is_public = true AND source_lang = $1';
        const params = [source_lang];
        let paramIndex = 2;

        if (difficulty) {
            query += ` AND level = $${paramIndex}`;
            params.push(difficulty);
            paramIndex++;
        }

        if (topic) {
            query += ` AND topic = $${paramIndex}`;
            params.push(topic);
            paramIndex++;
        }

        query += ' ORDER BY level, created_at DESC';

        const result = await db.query(query, params);

        // Transform universal_collections to match old format expected by frontend
        const transformedResults = result.rows.map(collection => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            from_lang: source_lang,  // Language being learned
            to_lang: native_lang || 'en',  // Native language
            category: collection.topic || 'General',
            difficulty_level: collection.level,
            topic: collection.topic,
            word_count: collection.word_count,
            usage_count: collection.usage_count,
            is_public: collection.is_public,
            createdAt: collection.created_at,
            // Add metadata to help frontend identify this is from new architecture
            _universal: true,
            _source_lang: collection.source_lang
        }));

        res.json(transformedResults);
    } catch (err) {
        logger.error('Error getting word lists:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single word list with words
app.get('/api/word-lists/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { native_lang } = req.query;  // Optional: native language for translations

        // Try new universal_collections first
        const collection = await db.query(
            'SELECT * FROM universal_collections WHERE id = $1 AND is_public = true',
            [parseInt(id)]
        );

        if (collection.rows.length === 0) {
            return res.status(404).json({ error: 'Word list not found' });
        }

        const collectionData = collection.rows[0];
        const source_lang = collectionData.source_lang;

        // Build language table mapping
        const langTableMap = {
            'ru': 'russian',
            'pl': 'polish',
            'ar': 'arabic',
            'tr': 'turkish',
            'ro': 'romanian',
            'sr': 'serbian',
            'uk': 'ukrainian',
            'en': 'english',
            'it': 'italian',
            'es': 'spanish',
            'pt': 'portuguese',
            'sw': 'swahili'
        };

        const targetLangTable = native_lang ? langTableMap[native_lang] : null;

        if (!targetLangTable) {
            // No native language specified or not supported, return without translations
            const words = await db.query(
                'SELECT source_word_id, order_index FROM universal_collection_words WHERE collection_id = $1 ORDER BY order_index',
                [parseInt(id)]
            );

            return res.json({
                ...collectionData,
                from_lang: source_lang,
                to_lang: native_lang || 'en',
                topic: collectionData.theme,
                difficulty_level: collectionData.level,
                words: words.rows.map(w => ({ word_id: w.source_word_id }))
            });
        }

        // Get words with translations
        const words = await db.query(`
            SELECT
                sw.id,
                sw.word,
                tt.translation,
                sw.example_de as example,
                cw.order_index
            FROM universal_collection_words cw
            JOIN source_words_${source_lang === 'de' ? 'german' : source_lang} sw ON cw.source_word_id = sw.id
            LEFT JOIN target_translations_${targetLangTable} tt ON tt.source_word_id = sw.id AND tt.source_lang = $1
            WHERE cw.collection_id = $2
            ORDER BY cw.order_index
        `, [source_lang, parseInt(id)]);

        // Transform to match old API format for frontend compatibility
        res.json({
            ...collectionData,
            from_lang: source_lang,  // Source language being learned
            to_lang: native_lang || 'en',  // Native language
            topic: collectionData.theme,  // Map theme to topic
            difficulty_level: collectionData.level,  // CEFR level
            words: words.rows
        });
    } catch (err) {
        logger.error('Error getting word list:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create word list (admin/system only)
app.post('/api/word-lists', async (req, res) => {
    try {
        const {
            name,
            description,
            from_lang,
            to_lang,
            category,
            difficulty_level,
            topic,
            words
        } = req.body;

        if (!name || !from_lang || !to_lang) {
            return res.status(400).json({ error: 'Missing required fields: name, from_lang, to_lang' });
        }

        await db.query('BEGIN');

        // Create collection
        const collection = await db.query(`
            INSERT INTO global_word_collections (name, description, from_lang, to_lang, category, difficulty_level, topic, word_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [name, description, from_lang, to_lang, category, difficulty_level, topic, words?.length || 0]);

        const collectionId = collection.rows[0].id;

        // Add words if provided
        if (words && words.length > 0) {
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                await db.query(`
                    INSERT INTO global_collection_words (collection_id, word, translation, example, exampleTranslation, order_index)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [collectionId, word.word, word.translation, word.example, word.exampleTranslation, i]);
            }
        }

        await db.query('COMMIT');

        res.json({
            success: true,
            collection: collection.rows[0]
        });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error creating word list:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add word list to user's words
app.post('/api/word-lists/:id/import', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, languagePairId } = req.body;

        if (!userId || !languagePairId) {
            return res.status(400).json({ error: 'Missing required fields: userId, languagePairId' });
        }

        // Get language pair info to determine native language
        const langPair = await db.query(
            'SELECT from_lang, to_lang FROM language_pairs WHERE id = $1',
            [parseInt(languagePairId)]
        );

        if (langPair.rows.length === 0) {
            return res.status(404).json({ error: 'Language pair not found' });
        }

        const native_lang = langPair.rows[0].to_lang;  // to_lang is native language

        // Get collection info
        const collection = await db.query(
            'SELECT source_lang FROM universal_collections WHERE id = $1',
            [parseInt(id)]
        );

        if (collection.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const source_lang = collection.rows[0].source_lang;

        // Build table names
        const langTableMap = {
            'ru': 'russian',
            'pl': 'polish',
            'ar': 'arabic',
            'tr': 'turkish',
            'ro': 'romanian',
            'sr': 'serbian',
            'uk': 'ukrainian',
            'en': 'english',
            'it': 'italian',
            'es': 'spanish',
            'pt': 'portuguese',
            'sw': 'swahili'
        };

        const targetLangTable = langTableMap[native_lang];
        if (!targetLangTable) {
            return res.status(400).json({ error: `Unsupported native language: ${native_lang}` });
        }

        // Get collection words with translations
        const words = await db.query(`
            SELECT
                sw.word,
                tt.translation,
                sw.example_de as example
            FROM universal_collection_words cw
            JOIN source_words_${source_lang === 'de' ? 'german' : source_lang} sw ON cw.source_word_id = sw.id
            LEFT JOIN target_translations_${targetLangTable} tt ON tt.source_word_id = sw.id AND tt.source_lang = $1
            WHERE cw.collection_id = $2
            ORDER BY cw.order_index
        `, [source_lang, parseInt(id)]);

        await db.query('BEGIN');

        let importedCount = 0;

        // Add each word to user's collection
        for (const word of words.rows) {
            if (!word.translation) continue;  // Skip words without translations

            // Check if word already exists for this user
            const existing = await db.query(
                'SELECT id FROM words WHERE user_id = $1 AND language_pair_id = $2 AND word = $3',
                [parseInt(userId), parseInt(languagePairId), word.word]
            );

            if (existing.rows.length === 0) {
                await db.query(`
                    INSERT INTO words (user_id, language_pair_id, word, translation, example, exampleTranslation, next_review_date)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                `, [
                    parseInt(userId),
                    parseInt(languagePairId),
                    word.word,
                    word.translation,
                    word.example || '',
                    word.exampleTranslation || ''
                ]);
                importedCount++;
            }
        }

        // Update usage count
        await db.query(
            'UPDATE universal_collections SET usage_count = usage_count + 1 WHERE id = $1',
            [parseInt(id)]
        );

        await db.query('COMMIT');

        res.json({
            success: true,
            imported_count: importedCount,
            total_words: words.rows.length,
            skipped: words.rows.length - importedCount
        });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error importing word list:', err);
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
        logger.error('Error getting achievement stats:', err);
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
        logger.error('Error creating achievement:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update all achievements from code definitions (for translations/updates)
app.post('/api/admin/achievements/update-all', async (req, res) => {
    try {
        // Call the initializeAchievements function to update all achievements
        await initializeAchievements();

        // Get updated achievements count
        const result = await db.query('SELECT COUNT(*) FROM achievements');
        const count = parseInt(result.rows[0].count);

        res.json({
            success: true,
            message: `Successfully updated all achievements`,
            count: count
        });
    } catch (err) {
        logger.error('Error updating achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all achievements (for debugging)
app.get('/api/admin/achievements/list', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM achievements ORDER BY category, tier');
        res.json(result.rows);
    } catch (err) {
        logger.error('Error fetching achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Direct SQL update for achievements (emergency fix)
app.post('/api/admin/achievements/force-translate', async (req, res) => {
    try {
        const updates = [
            { key: 'streak_3', name: 'Little Flame 🔥', description: '3-day streak' },
            { key: 'streak_7', name: 'Week of Power 💪', description: '7-day streak' },
            { key: 'streak_30', name: 'Month of Victory 🏆', description: '30-day streak' },
            { key: 'streak_100', name: 'Legend 👑', description: '100-day streak' },
            { key: 'words_10', name: 'First Steps 🌱', description: 'Learned 10 words' },
            { key: 'words_50', name: 'Connoisseur 📚', description: 'Learned 50 words' },
            { key: 'words_100', name: 'Scholar 🎓', description: 'Learned 100 words' },
            { key: 'words_500', name: 'Word Master ⭐', description: 'Learned 500 words' },
            { key: 'words_1000', name: 'Polyglot 🌍', description: 'Learned 1000 words' },
            { key: 'level_5', name: 'Novice 🥉', description: 'Reached level 5' },
            { key: 'level_10', name: 'Experienced 🥈', description: 'Reached level 10' },
            { key: 'level_25', name: 'Professional 🥇', description: 'Reached level 25' },
            { key: 'level_50', name: 'Expert 💎', description: 'Reached level 50' },
            { key: 'level_100', name: 'Grandmaster 👾', description: 'Reached level 100' },
            { key: 'quiz_100', name: 'Trainee ✏️', description: '100 exercises completed' },
            { key: 'quiz_500', name: 'Hard Worker 📝', description: '500 exercises completed' },
            { key: 'quiz_1000', name: 'Tireless 💪', description: '1000 exercises completed' },
            { key: 'first_word', name: 'First Word 🎉', description: 'Learned first word' },
            { key: 'early_bird', name: 'Early Bird 🌅', description: 'Study before 8:00 AM' },
            { key: 'night_owl', name: 'Night Owl 🦉', description: 'Study after 11:00 PM' }
        ];

        let updated = 0;
        for (const ach of updates) {
            await db.query(
                'UPDATE achievements SET name = $1, description = $2 WHERE achievement_key = $3',
                [ach.name, ach.description, ach.key]
            );
            updated++;
        }

        res.json({ success: true, message: `Force-updated ${updated} achievements`, count: updated });
    } catch (err) {
        logger.error('Error force-updating achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// USER PROFILES SYSTEM ENDPOINTS
// ========================================

// Get public profile
app.get('/api/profiles/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user basic info
        const user = await db.query(`
            SELECT u.id, u.username, u.name, u.email, u.avatar_url, u.bio, u.is_public, u.createdAt,
                   up.showcase_achievements, up.favorite_languages, up.study_goal, up.daily_goal_minutes,
                   up.timezone, up.language_level, up.profile_views, up.last_active
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = $1
        `, [parseInt(userId)]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = user.rows[0];

        // Check if profile is public
        if (!profile.is_public) {
            return res.status(403).json({ error: 'Profile is private' });
        }

        // Get user stats
        const stats = await db.query(`
            SELECT total_xp, level, current_streak, longest_streak, total_words_learned,
                   quizzes_completed, perfect_quizzes, coins_balance
            FROM user_stats
            WHERE user_id = $1
        `, [parseInt(userId)]);

        // Get language pairs count
        const langPairs = await db.query(
            'SELECT COUNT(*) as count FROM language_pairs WHERE user_id = $1',
            [parseInt(userId)]
        );

        // Get unlocked achievements count
        const achievements = await db.query(
            'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND is_unlocked = true',
            [parseInt(userId)]
        );

        // Get friends count
        const friends = await db.query(
            'SELECT COUNT(*) as count FROM friendships WHERE (user_id = $1 OR friend_id = $1) AND status = $2',
            [parseInt(userId), 'accepted']
        );

        // Increment profile views
        await db.query(
            'UPDATE user_profiles SET profile_views = profile_views + 1 WHERE user_id = $1',
            [parseInt(userId)]
        );

        res.json({
            ...profile,
            stats: stats.rows[0] || {},
            counts: {
                language_pairs: parseInt(langPairs.rows[0].count),
                achievements: parseInt(achievements.rows[0].count),
                friends: parseInt(friends.rows[0].count)
            }
        });
    } catch (err) {
        logger.error('Error getting user profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update own profile
app.put('/api/profiles/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            username,
            bio,
            avatar_url,
            is_public,
            showcase_achievements,
            favorite_languages,
            study_goal,
            daily_goal_minutes,
            timezone
        } = req.body;

        await db.query('BEGIN');

        // Update users table
        const userUpdateFields = [];
        const userUpdateValues = [];
        let paramIndex = 1;

        if (username !== undefined) {
            userUpdateFields.push(`username = $${paramIndex++}`);
            userUpdateValues.push(username);
        }
        if (bio !== undefined) {
            userUpdateFields.push(`bio = $${paramIndex++}`);
            userUpdateValues.push(bio);
        }
        if (avatar_url !== undefined) {
            userUpdateFields.push(`avatar_url = $${paramIndex++}`);
            userUpdateValues.push(avatar_url);
        }
        if (is_public !== undefined) {
            userUpdateFields.push(`is_public = $${paramIndex++}`);
            userUpdateValues.push(is_public);
        }

        if (userUpdateFields.length > 0) {
            userUpdateFields.push(`updatedAt = CURRENT_TIMESTAMP`);
            userUpdateValues.push(parseInt(userId));

            await db.query(
                `UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = $${paramIndex}`,
                userUpdateValues
            );
        }

        // Get or create user profile
        const existingProfile = await db.query(
            'SELECT id FROM user_profiles WHERE user_id = $1',
            [parseInt(userId)]
        );

        if (existingProfile.rows.length === 0) {
            await db.query(
                'INSERT INTO user_profiles (user_id) VALUES ($1)',
                [parseInt(userId)]
            );
        }

        // Update user_profiles table
        const profileUpdateFields = [];
        const profileUpdateValues = [];
        paramIndex = 1;

        if (showcase_achievements !== undefined) {
            profileUpdateFields.push(`showcase_achievements = $${paramIndex++}`);
            profileUpdateValues.push(showcase_achievements);
        }
        if (favorite_languages !== undefined) {
            profileUpdateFields.push(`favorite_languages = $${paramIndex++}`);
            profileUpdateValues.push(favorite_languages);
        }
        if (study_goal !== undefined) {
            profileUpdateFields.push(`study_goal = $${paramIndex++}`);
            profileUpdateValues.push(study_goal);
        }
        if (daily_goal_minutes !== undefined) {
            profileUpdateFields.push(`daily_goal_minutes = $${paramIndex++}`);
            profileUpdateValues.push(parseInt(daily_goal_minutes));
        }
        if (timezone !== undefined) {
            profileUpdateFields.push(`timezone = $${paramIndex++}`);
            profileUpdateValues.push(timezone);
        }

        if (profileUpdateFields.length > 0) {
            profileUpdateFields.push(`updatedAt = CURRENT_TIMESTAMP`);
            profileUpdateValues.push(parseInt(userId));

            await db.query(
                `UPDATE user_profiles SET ${profileUpdateFields.join(', ')} WHERE user_id = $${paramIndex}`,
                profileUpdateValues
            );
        }

        await db.query('COMMIT');

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error updating profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// Upload avatar (URL-based for now, can be extended to file upload)
app.post('/api/profiles/:userId/avatar', async (req, res) => {
    try {
        const { userId } = req.params;
        const { avatar_url } = req.body;

        if (!avatar_url) {
            return res.status(400).json({ error: 'Missing avatar_url' });
        }

        await db.query(
            'UPDATE users SET avatar_url = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2',
            [avatar_url, parseInt(userId)]
        );

        res.json({ success: true, avatar_url });
    } catch (err) {
        logger.error('Error uploading avatar:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's showcase achievements
app.get('/api/profiles/:userId/showcase', async (req, res) => {
    try {
        const { userId } = req.params;

        const showcase = await db.query(`
            SELECT up.showcase_achievements
            FROM user_profiles up
            WHERE up.user_id = $1
        `, [parseInt(userId)]);

        if (showcase.rows.length === 0 || !showcase.rows[0].showcase_achievements) {
            return res.json([]);
        }

        const achievementIds = showcase.rows[0].showcase_achievements;

        // Get full achievement details
        const achievements = await db.query(`
            SELECT ua.*, a.title, a.description, a.icon, a.category, a.difficulty
            FROM user_achievements ua
            INNER JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1 AND ua.is_unlocked = true AND a.id = ANY($2)
            ORDER BY ua.unlockedAt DESC
        `, [parseInt(userId), achievementIds]);

        res.json(achievements.rows);
    } catch (err) {
        logger.error('Error getting showcase achievements:', err);
        res.status(500).json({ error: err.message });
    }
});

// Search users by username
app.get('/api/profiles/search/users', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const users = await db.query(`
            SELECT u.id, u.username, u.name, u.avatar_url, u.bio,
                   us.total_xp, us.level, us.current_streak
            FROM users u
            LEFT JOIN user_stats us ON u.id = us.user_id
            WHERE u.is_public = true
              AND (LOWER(u.username) LIKE LOWER($1) OR LOWER(u.name) LIKE LOWER($1))
            LIMIT 20
        `, [`%${query}%`]);

        res.json(users.rows);
    } catch (err) {
        logger.error('Error searching users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get profile activity summary (for public profiles)
app.get('/api/profiles/:userId/activity', async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;

        // Get recent XP activity
        const xpActivity = await db.query(`
            SELECT DATE(timestamp) as date, SUM(xp_amount) as total_xp, COUNT(*) as actions
            FROM xp_log
            WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
        `, [parseInt(userId)]);

        // Get recent achievements
        const recentAchievements = await db.query(`
            SELECT ua.unlockedAt, a.title, a.icon, a.category
            FROM user_achievements ua
            INNER JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1 AND ua.is_unlocked = true
            ORDER BY ua.unlockedAt DESC
            LIMIT 5
        `, [parseInt(userId)]);

        // Get study streak info
        const streakInfo = await db.query(
            'SELECT current_streak, longest_streak, last_study_date FROM user_stats WHERE user_id = $1',
            [parseInt(userId)]
        );

        res.json({
            xp_activity: xpActivity.rows,
            recent_achievements: recentAchievements.rows,
            streak: streakInfo.rows[0] || {}
        });
    } catch (err) {
        logger.error('Error getting profile activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// LEAGUES SYSTEM ENDPOINTS
// ========================================

// Get current week league for user
app.get('/api/leagues/current/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get current week start (Monday)
        const weekStart = await db.query(`
            SELECT DATE_TRUNC('week', CURRENT_DATE)::DATE as week_start
        `);
        const weekStartDate = weekStart.rows[0].week_start;

        // Get or create league membership for this week
        let membership = await db.query(`
            SELECT lm.*, lt.icon, lt.color, lt.tier_level
            FROM league_memberships lm
            INNER JOIN league_tiers lt ON lm.league_tier = lt.tier_name
            WHERE lm.user_id = $1 AND lm.week_start_date = $2
        `, [parseInt(userId), weekStartDate]);

        if (membership.rows.length === 0) {
            // Create new membership (start in Bronze by default)
            const stats = await db.query('SELECT total_xp FROM user_stats WHERE user_id = $1', [parseInt(userId)]);
            const totalXP = stats.rows[0]?.total_xp || 0;

            // Determine starting tier based on total XP
            const tier = await db.query(`
                SELECT tier_name FROM league_tiers
                WHERE min_xp_required <= $1
                ORDER BY tier_level DESC
                LIMIT 1
            `, [totalXP]);

            const startTier = tier.rows[0]?.tier_name || 'Bronze';

            await db.query(`
                INSERT INTO league_memberships (user_id, league_tier, week_start_date, week_xp)
                VALUES ($1, $2, $3, 0)
            `, [parseInt(userId), startTier, weekStartDate]);

            membership = await db.query(`
                SELECT lm.*, lt.icon, lt.color, lt.tier_level
                FROM league_memberships lm
                INNER JOIN league_tiers lt ON lm.league_tier = lt.tier_name
                WHERE lm.user_id = $1 AND lm.week_start_date = $2
            `, [parseInt(userId), weekStartDate]);
        }

        res.json(membership.rows[0]);
    } catch (err) {
        logger.error('Error getting current league:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get league leaderboard for current week
app.get('/api/leagues/leaderboard/:tier', async (req, res) => {
    try {
        const { tier } = req.params;
        const { limit = 50 } = req.query;

        // Get current week start
        const weekStart = await db.query(`SELECT DATE_TRUNC('week', CURRENT_DATE)::DATE as week_start`);
        const weekStartDate = weekStart.rows[0].week_start;

        const leaderboard = await db.query(`
            SELECT
                lm.user_id,
                lm.week_xp,
                lm.rank_in_league,
                u.username,
                u.name,
                u.avatar_url,
                us.level,
                ROW_NUMBER() OVER (ORDER BY lm.week_xp DESC) as rank
            FROM league_memberships lm
            INNER JOIN users u ON lm.user_id = u.id
            LEFT JOIN user_stats us ON u.id = us.user_id
            WHERE lm.league_tier = $1 AND lm.week_start_date = $2
            ORDER BY lm.week_xp DESC
            LIMIT $3
        `, [tier, weekStartDate, parseInt(limit)]);

        res.json(leaderboard.rows);
    } catch (err) {
        logger.error('Error getting league leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update week XP (called when user earns XP)
app.post('/api/leagues/update-xp', async (req, res) => {
    try {
        const { userId, xpEarned } = req.body;

        if (!userId || !xpEarned) {
            return res.status(400).json({ error: 'Missing required fields: userId, xpEarned' });
        }

        // Get current week start
        const weekStart = await db.query(`SELECT DATE_TRUNC('week', CURRENT_DATE)::DATE as week_start`);
        const weekStartDate = weekStart.rows[0].week_start;

        // Update week XP
        await db.query(`
            INSERT INTO league_memberships (user_id, league_tier, week_start_date, week_xp)
            VALUES ($1, 'Bronze', $2, $3)
            ON CONFLICT (user_id, week_start_date)
            DO UPDATE SET week_xp = league_memberships.week_xp + $3
        `, [parseInt(userId), weekStartDate, parseInt(xpEarned)]);

        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating league XP:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's league history
app.get('/api/leagues/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        const history = await db.query(`
            SELECT
                lm.*,
                lt.icon,
                lt.color,
                lt.tier_level
            FROM league_memberships lm
            INNER JOIN league_tiers lt ON lm.league_tier = lt.tier_name
            WHERE lm.user_id = $1
            ORDER BY lm.week_start_date DESC
            LIMIT $2
        `, [parseInt(userId), parseInt(limit)]);

        res.json(history.rows);
    } catch (err) {
        logger.error('Error getting league history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all league tiers
app.get('/api/leagues/tiers', async (req, res) => {
    try {
        const tiers = await db.query(`
            SELECT * FROM league_tiers
            ORDER BY tier_level ASC
        `);

        res.json(tiers.rows);
    } catch (err) {
        logger.error('Error getting league tiers:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Process weekly promotions/demotions (run at end of week)
app.post('/api/admin/leagues/process-week', async (req, res) => {
    try {
        // Get last week's start date
        const lastWeekStart = await db.query(`
            SELECT DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')::DATE as week_start
        `);
        const lastWeekStartDate = lastWeekStart.rows[0].week_start;

        // Get current week start
        const weekStart = await db.query(`
            SELECT DATE_TRUNC('week', CURRENT_DATE)::DATE as week_start
        `);
        const weekStartDate = weekStart.rows[0].week_start;

        // Get all users in last week's leagues with their ranks
        const lastWeekUsers = await db.query(`
            SELECT
                lm.user_id,
                lm.league_tier,
                lm.week_xp,
                lt.tier_level,
                lt.promotion_threshold,
                lt.demotion_threshold,
                ROW_NUMBER() OVER (PARTITION BY lm.league_tier ORDER BY lm.week_xp DESC) as rank
            FROM league_memberships lm
            INNER JOIN league_tiers lt ON lm.league_tier = lt.tier_name
            WHERE lm.week_start_date = $1
        `, [lastWeekStartDate]);

        await db.query('BEGIN');

        for (const user of lastWeekUsers.rows) {
            let newTier = user.league_tier;
            let promoted = false;
            let demoted = false;

            // Check for promotion
            if (user.promotion_threshold && user.rank <= user.promotion_threshold) {
                const higherTier = await db.query(
                    'SELECT tier_name FROM league_tiers WHERE tier_level = $1',
                    [user.tier_level + 1]
                );
                if (higherTier.rows.length > 0) {
                    newTier = higherTier.rows[0].tier_name;
                    promoted = true;
                }
            }

            // Check for demotion
            if (user.demotion_threshold && user.rank >= user.demotion_threshold && !promoted) {
                const lowerTier = await db.query(
                    'SELECT tier_name FROM league_tiers WHERE tier_level = $1',
                    [user.tier_level - 1]
                );
                if (lowerTier.rows.length > 0) {
                    newTier = lowerTier.rows[0].tier_name;
                    demoted = true;
                }
            }

            // Update last week's record
            await db.query(`
                UPDATE league_memberships
                SET rank_in_league = $1, promoted = $2, demoted = $3
                WHERE user_id = $4 AND week_start_date = $5
            `, [user.rank, promoted, demoted, user.user_id, lastWeekStartDate]);

            // Create new week's membership
            await db.query(`
                INSERT INTO league_memberships (user_id, league_tier, week_start_date, week_xp)
                VALUES ($1, $2, $3, 0)
                ON CONFLICT (user_id, week_start_date) DO NOTHING
            `, [user.user_id, newTier, weekStartDate]);
        }

        await db.query('COMMIT');

        res.json({ success: true, processed: lastWeekUsers.rows.length });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error processing weekly leagues:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// STREAK FREEZE SYSTEM ENDPOINTS
// ========================================

// Purchase streak freeze
app.post('/api/streak-freeze/purchase', async (req, res) => {
    try {
        const { userId, freezeDays } = req.body;

        if (!userId || !freezeDays) {
            return res.status(400).json({ error: 'Missing required fields: userId, freezeDays' });
        }

        // Calculate expiration (freezeDays from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(freezeDays));

        await db.query(`
            INSERT INTO streak_freezes (user_id, freeze_days, expires_at)
            VALUES ($1, $2, $3)
        `, [parseInt(userId), parseInt(freezeDays), expiresAt]);

        res.json({ success: true, expires_at: expiresAt });
    } catch (err) {
        logger.error('Error purchasing streak freeze:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get active streak freezes
app.get('/api/streak-freeze/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const freezes = await db.query(`
            SELECT * FROM streak_freezes
            WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
            ORDER BY expires_at ASC
        `, [parseInt(userId)]);

        res.json(freezes.rows);
    } catch (err) {
        logger.error('Error getting streak freezes:', err);
        res.status(500).json({ error: err.message });
    }
});

// Use streak freeze (auto-called when streak would break)
app.post('/api/streak-freeze/use', async (req, res) => {
    try {
        const { userId, date } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const useDate = date || new Date().toISOString().split('T')[0];

        // Find oldest active freeze
        const freeze = await db.query(`
            SELECT * FROM streak_freezes
            WHERE user_id = $1 AND is_active = true AND expires_at > NOW() AND used_on_date IS NULL
            ORDER BY purchased_at ASC
            LIMIT 1
        `, [parseInt(userId)]);

        if (freeze.rows.length === 0) {
            return res.status(404).json({ error: 'No active freeze available' });
        }

        // Mark as used
        await db.query(`
            UPDATE streak_freezes
            SET used_on_date = $1, is_active = false
            WHERE id = $2
        `, [useDate, freeze.rows[0].id]);

        res.json({ success: true, freeze_used: freeze.rows[0] });
    } catch (err) {
        logger.error('Error using streak freeze:', err);
        res.status(500).json({ error: err.message });
    }
});

// Claim free weekly streak freeze
app.post('/api/streak-freeze/:userId/claim-free', async (req, res) => {
    try {
        const { userId } = req.params;

        // Check last free claim (we'll store this in a new table or use user metadata)
        // For now, simple implementation: add 1 freeze with 7-day expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.query(`
            INSERT INTO streak_freezes (user_id, freeze_days, expires_at)
            VALUES ($1, 1, $2)
        `, [parseInt(userId), expiresAt]);

        res.json({
            success: true,
            message: 'Free streak freeze claimed!',
            expires_at: expiresAt,
            next_available_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
    } catch (err) {
        logger.error('Error claiming free streak freeze:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get streak freeze usage history
app.get('/api/streak-freeze/:userId/history', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const history = await db.query(`
            SELECT id, freeze_days, purchased_at, used_on_date, is_active
            FROM streak_freezes
            WHERE user_id = $1 AND used_on_date IS NOT NULL
            ORDER BY used_on_date DESC
            LIMIT $2
        `, [parseInt(userId), limit]);

        const totalUsed = await db.query(`
            SELECT COUNT(*) as count
            FROM streak_freezes
            WHERE user_id = $1 AND used_on_date IS NOT NULL
        `, [parseInt(userId)]);

        res.json({
            history: history.rows,
            total_used: parseInt(totalUsed.rows[0].count)
        });
    } catch (err) {
        logger.error('Error getting streak freeze history:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// DAILY GOALS SYSTEM ENDPOINTS
// ========================================

// Get or create daily goals for user
app.get('/api/daily-goals/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        // Check if goals exist for today
        let goals = await db.query(`
            SELECT * FROM daily_goals
            WHERE user_id = $1 AND goal_date = $2
            ORDER BY goal_type
        `, [parseInt(userId), today]);

        if (goals.rows.length === 0) {
            // Create default goals
            const defaultGoals = [
                { type: 'xp', target: 50, reward_xp: 25, reward_coins: 5 },
                { type: 'words_learned', target: 10, reward_xp: 50, reward_coins: 10 },
                { type: 'quizzes', target: 5, reward_xp: 30, reward_coins: 5 }
            ];

            await db.query('BEGIN');

            for (const goal of defaultGoals) {
                await db.query(`
                    INSERT INTO daily_goals (user_id, goal_date, goal_type, target_value, reward_xp, reward_coins)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [parseInt(userId), today, goal.type, goal.target, goal.reward_xp, goal.reward_coins]);
            }

            await db.query('COMMIT');

            goals = await db.query(`
                SELECT * FROM daily_goals
                WHERE user_id = $1 AND goal_date = $2
                ORDER BY goal_type
            `, [parseInt(userId), today]);
        }

        res.json(goals.rows);
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error getting daily goals:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update goal progress
app.post('/api/daily-goals/progress', async (req, res) => {
    try {
        const { userId, goalType, increment = 1 } = req.body;

        if (!userId || !goalType) {
            return res.status(400).json({ error: 'Missing required fields: userId, goalType' });
        }

        const today = new Date().toISOString().split('T')[0];

        await db.query('BEGIN');

        // Update progress
        const result = await db.query(`
            UPDATE daily_goals
            SET current_progress = current_progress + $1
            WHERE user_id = $2 AND goal_date = $3 AND goal_type = $4
            RETURNING *
        `, [parseInt(increment), parseInt(userId), today, goalType]);

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goal = result.rows[0];

        // Check if goal completed
        if (!goal.is_completed && goal.current_progress >= goal.target_value) {
            // Mark as completed
            await db.query(`
                UPDATE daily_goals
                SET is_completed = true, completed_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [goal.id]);

            // Award rewards
            if (goal.reward_xp > 0) {
                await db.query(
                    'INSERT INTO xp_log (user_id, xp_amount, action_type, action_details) VALUES ($1, $2, $3, $4)',
                    [parseInt(userId), goal.reward_xp, 'daily_goal', `Completed goal: ${goalType}`]
                );

                await db.query(
                    'UPDATE user_stats SET total_xp = total_xp + $1 WHERE user_id = $2',
                    [goal.reward_xp, parseInt(userId)]
                );
            }

            if (goal.reward_coins > 0) {
                const stats = await db.query('SELECT coins_balance FROM user_stats WHERE user_id = $1', [parseInt(userId)]);
                const currentBalance = stats.rows[0]?.coins_balance || 0;
                const newBalance = currentBalance + goal.reward_coins;

                await db.query(
                    'UPDATE user_stats SET coins_balance = $1 WHERE user_id = $2',
                    [newBalance, parseInt(userId)]
                );

                await db.query(`
                    INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description, balance_after)
                    VALUES ($1, $2, 'earn', 'daily_goal', $3, $4)
                `, [parseInt(userId), goal.reward_coins, `Daily goal: ${goalType}`, newBalance]);
            }

            await db.query('COMMIT');

            res.json({
                completed: true,
                goal: result.rows[0],
                rewards: {
                    xp: goal.reward_xp,
                    coins: goal.reward_coins
                }
            });
        } else {
            await db.query('COMMIT');
            res.json({ completed: false, goal: result.rows[0] });
        }
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error updating goal progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get goal stats
app.get('/api/daily-goals/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;

        const stats = await db.query(`
            SELECT
                COUNT(*) as total_goals,
                COUNT(*) FILTER (WHERE is_completed = true) as completed_goals,
                SUM(reward_xp) FILTER (WHERE is_completed = true) as total_xp_earned,
                SUM(reward_coins) FILTER (WHERE is_completed = true) as total_coins_earned,
                COUNT(DISTINCT goal_date) FILTER (WHERE is_completed = true) as days_completed
            FROM daily_goals
            WHERE user_id = $1 AND goal_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        `, [parseInt(userId)]);

        res.json(stats.rows[0]);
    } catch (err) {
        logger.error('Error getting goal stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// DUELS SYSTEM ENDPOINTS
// ========================================

// Challenge friend to duel
app.post('/api/duels/challenge', async (req, res) => {
    try {
        const { challengerId, opponentId, languagePairId, totalQuestions = 10, timeLimitSeconds = 300 } = req.body;

        if (!challengerId || !opponentId) {
            return res.status(400).json({ error: 'Missing required fields: challengerId, opponentId' });
        }

        if (parseInt(challengerId) === parseInt(opponentId)) {
            return res.status(400).json({ error: 'Cannot challenge yourself' });
        }

        const duel = await db.query(`
            INSERT INTO duels (challenger_id, opponent_id, language_pair_id, total_questions, time_limit_seconds, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `, [parseInt(challengerId), parseInt(opponentId), languagePairId ? parseInt(languagePairId) : null, parseInt(totalQuestions), parseInt(timeLimitSeconds)]);

        // Log activity
        await db.query(`
            INSERT INTO friend_activities (user_id, activity_type, activity_data)
            VALUES ($1, 'duel_challenged', $2)
        `, [parseInt(challengerId), JSON.stringify({ opponent_id: parseInt(opponentId), duel_id: duel.rows[0].id })]);

        res.json(duel.rows[0]);
    } catch (err) {
        logger.error('Error creating duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Accept duel
app.post('/api/duels/:duelId/accept', async (req, res) => {
    try {
        const { duelId } = req.params;
        const { userId } = req.body;

        // Verify user is the opponent
        const duel = await db.query(
            'SELECT * FROM duels WHERE id = $1 AND opponent_id = $2 AND status = $3',
            [parseInt(duelId), parseInt(userId), 'pending']
        );

        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found or already processed' });
        }

        // Start duel
        const result = await db.query(`
            UPDATE duels
            SET status = 'active', started_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [parseInt(duelId)]);

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error accepting duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Decline duel
app.post('/api/duels/:duelId/decline', async (req, res) => {
    try {
        const { duelId } = req.params;
        const { userId } = req.body;

        const duel = await db.query(
            'SELECT * FROM duels WHERE id = $1 AND opponent_id = $2 AND status = $3',
            [parseInt(duelId), parseInt(userId), 'pending']
        );

        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found or already processed' });
        }

        await db.query(
            'UPDATE duels SET status = $1 WHERE id = $2',
            ['declined', parseInt(duelId)]
        );

        res.json({ success: true, message: 'Duel declined' });
    } catch (err) {
        logger.error('Error declining duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Submit duel answer
app.post('/api/duels/:duelId/answer', async (req, res) => {
    try {
        const { duelId } = req.params;
        const { userId, wordId, isCorrect, answerTimeMs } = req.body;

        if (!userId || wordId === undefined || isCorrect === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await db.query('BEGIN');

        // Save answer
        await db.query(`
            INSERT INTO duel_answers (duel_id, user_id, word_id, is_correct, answer_time_ms)
            VALUES ($1, $2, $3, $4, $5)
        `, [parseInt(duelId), parseInt(userId), parseInt(wordId), isCorrect, answerTimeMs || null]);

        // Update score
        const duel = await db.query('SELECT * FROM duels WHERE id = $1', [parseInt(duelId)]);
        const duelData = duel.rows[0];

        if (isCorrect) {
            if (parseInt(userId) === duelData.challenger_id) {
                await db.query(
                    'UPDATE duels SET challenger_score = challenger_score + 1 WHERE id = $1',
                    [parseInt(duelId)]
                );
            } else {
                await db.query(
                    'UPDATE duels SET opponent_score = opponent_score + 1 WHERE id = $1',
                    [parseInt(duelId)]
                );
            }
        }

        // Check if duel is complete
        const answerCount = await db.query(
            'SELECT COUNT(*) as count FROM duel_answers WHERE duel_id = $1',
            [parseInt(duelId)]
        );

        const totalAnswers = parseInt(answerCount.rows[0].count);
        const expectedAnswers = duelData.total_questions * 2; // Both players answer all questions

        if (totalAnswers >= expectedAnswers) {
            // Duel complete, determine winner
            const finalDuel = await db.query('SELECT * FROM duels WHERE id = $1', [parseInt(duelId)]);
            const fd = finalDuel.rows[0];

            let winnerId = null;
            if (fd.challenger_score > fd.opponent_score) {
                winnerId = fd.challenger_id;
            } else if (fd.opponent_score > fd.challenger_score) {
                winnerId = fd.opponent_id;
            }

            await db.query(`
                UPDATE duels
                SET status = 'completed', winner_id = $1, completed_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [winnerId, parseInt(duelId)]);

            // Award XP to winner
            if (winnerId) {
                await db.query(
                    'INSERT INTO xp_log (user_id, xp_amount, action_type, action_details) VALUES ($1, $2, $3, $4)',
                    [winnerId, 100, 'duel_won', `Duel victory`]
                );

                await db.query(
                    'UPDATE user_stats SET total_xp = total_xp + $1 WHERE user_id = $2',
                    [100, winnerId]
                );
            }
        }

        await db.query('COMMIT');

        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error submitting duel answer:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get duel details
app.get('/api/duels/:duelId', async (req, res) => {
    try {
        const { duelId } = req.params;

        const duel = await db.query(`
            SELECT d.*,
                   u1.name as challenger_name, u1.avatar_url as challenger_avatar,
                   u2.name as opponent_name, u2.avatar_url as opponent_avatar,
                   u3.name as winner_name
            FROM duels d
            LEFT JOIN users u1 ON d.challenger_id = u1.id
            LEFT JOIN users u2 ON d.opponent_id = u2.id
            LEFT JOIN users u3 ON d.winner_id = u3.id
            WHERE d.id = $1
        `, [parseInt(duelId)]);

        if (duel.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found' });
        }

        // Get answers
        const answers = await db.query(
            'SELECT * FROM duel_answers WHERE duel_id = $1 ORDER BY answeredAt',
            [parseInt(duelId)]
        );

        res.json({
            ...duel.rows[0],
            answers: answers.rows
        });
    } catch (err) {
        logger.error('Error getting duel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's duels
app.get('/api/duels/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        let query = `
            SELECT d.*,
                   u1.name as challenger_name, u1.avatar_url as challenger_avatar,
                   u2.name as opponent_name, u2.avatar_url as opponent_avatar,
                   u3.name as winner_name
            FROM duels d
            LEFT JOIN users u1 ON d.challenger_id = u1.id
            LEFT JOIN users u2 ON d.opponent_id = u2.id
            LEFT JOIN users u3 ON d.winner_id = u3.id
            WHERE (d.challenger_id = $1 OR d.opponent_id = $1)
        `;

        const params = [parseInt(userId)];

        if (status) {
            query += ' AND d.status = $2';
            params.push(status);
        }

        query += ' ORDER BY d.createdAt DESC LIMIT 50';

        const duels = await db.query(query, params);

        res.json(duels.rows);
    } catch (err) {
        logger.error('Error getting user duels:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get duel stats
app.get('/api/duels/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await db.query(`
            SELECT
                COUNT(*) as total_duels,
                COUNT(*) FILTER (WHERE winner_id = $1) as wins,
                COUNT(*) FILTER (WHERE winner_id IS NOT NULL AND winner_id != $1) as losses,
                COUNT(*) FILTER (WHERE winner_id IS NULL AND status = 'completed') as draws,
                COUNT(*) FILTER (WHERE status = 'pending' AND opponent_id = $1) as pending_challenges
            FROM duels
            WHERE (challenger_id = $1 OR opponent_id = $1) AND status IN ('completed', 'pending')
        `, [parseInt(userId)]);

        res.json(stats.rows[0]);
    } catch (err) {
        logger.error('Error getting duel stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// BOOSTERS SYSTEM
// =========================

// Purchase booster (not activated yet)
app.post('/api/boosters/purchase', async (req, res) => {
    try {
        const { userId, boosterType, multiplier, durationMinutes, cost } = req.body;

        await db.query('BEGIN');

        // Check user has enough coins
        const userCoins = await db.query('SELECT coins FROM users WHERE id = $1', [parseInt(userId)]);
        if (userCoins.rows.length === 0 || userCoins.rows[0].coins < cost) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Not enough coins' });
        }

        // Deduct coins
        await db.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [cost, parseInt(userId)]);

        // Create booster
        const result = await db.query(`
            INSERT INTO boosters (user_id, booster_type, multiplier, duration_minutes)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [parseInt(userId), boosterType, multiplier, durationMinutes]);

        // Log transaction
        await db.query(`
            INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
            VALUES ($1, $2, $3, $4)
        `, [parseInt(userId), -cost, 'purchase', `Bought ${boosterType} booster (${multiplier}x for ${durationMinutes} min)`]);

        await db.query('COMMIT');
        res.json({ success: true, booster: result.rows[0] });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error purchasing booster:', err);
        res.status(500).json({ error: err.message });
    }
});

// Activate booster (start countdown)
app.post('/api/boosters/:boosterId/activate', async (req, res) => {
    try {
        const { boosterId } = req.params;

        await db.query('BEGIN');

        // Get booster
        const booster = await db.query('SELECT * FROM boosters WHERE id = $1', [parseInt(boosterId)]);
        if (booster.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Booster not found' });
        }

        const boosterData = booster.rows[0];
        if (boosterData.is_used) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Booster already used' });
        }

        // Check if user already has active booster of this type
        const activeBooster = await db.query(`
            SELECT * FROM boosters
            WHERE user_id = $1 AND booster_type = $2 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
        `, [boosterData.user_id, boosterData.booster_type]);

        if (activeBooster.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'You already have an active booster of this type' });
        }

        // Activate booster
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + boosterData.duration_minutes);

        await db.query(`
            UPDATE boosters
            SET is_active = true, is_used = true, activated_at = CURRENT_TIMESTAMP, expires_at = $1
            WHERE id = $2
        `, [expiresAt, parseInt(boosterId)]);

        await db.query('COMMIT');
        res.json({ success: true, expires_at: expiresAt });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error activating booster:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's active boosters
app.get('/api/boosters/active/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const boosters = await db.query(`
            SELECT * FROM boosters
            WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
            ORDER BY expires_at ASC
        `, [parseInt(userId)]);

        res.json(boosters.rows);
    } catch (err) {
        logger.error('Error getting active boosters:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's booster inventory (not activated yet)
app.get('/api/boosters/inventory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const boosters = await db.query(`
            SELECT * FROM boosters
            WHERE user_id = $1 AND is_used = false
            ORDER BY purchased_at DESC
        `, [parseInt(userId)]);

        res.json(boosters.rows);
    } catch (err) {
        logger.error('Error getting booster inventory:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get booster history
app.get('/api/boosters/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const boosters = await db.query(`
            SELECT * FROM boosters
            WHERE user_id = $1 AND is_used = true
            ORDER BY activated_at DESC
            LIMIT 50
        `, [parseInt(userId)]);

        res.json(boosters.rows);
    } catch (err) {
        logger.error('Error getting booster history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Apply booster multiplier to XP gain
app.post('/api/boosters/apply-multiplier', async (req, res) => {
    try {
        const { userId, baseXp, boosterType } = req.body;

        // Get active booster of specified type
        const booster = await db.query(`
            SELECT * FROM boosters
            WHERE user_id = $1 AND booster_type = $2 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
            LIMIT 1
        `, [parseInt(userId), boosterType]);

        if (booster.rows.length === 0) {
            return res.json({ multiplied_xp: baseXp, multiplier: 1.0 });
        }

        const multiplier = parseFloat(booster.rows[0].multiplier);
        const multipliedXp = Math.floor(baseXp * multiplier);

        res.json({ multiplied_xp: multipliedXp, multiplier: multiplier });
    } catch (err) {
        logger.error('Error applying booster multiplier:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// PUSH NOTIFICATIONS SYSTEM
// =========================

// Subscribe to push notifications
app.post('/api/notifications/subscribe', async (req, res) => {
    try {
        const { userId, subscription } = req.body;
        const { endpoint, keys } = subscription;

        // Check if subscription exists
        const existing = await db.query('SELECT * FROM push_subscriptions WHERE endpoint = $1', [endpoint]);

        if (existing.rows.length > 0) {
            // Update existing subscription
            await db.query(`
                UPDATE push_subscriptions
                SET user_id = $1, keys_p256dh = $2, keys_auth = $3, is_active = true, last_used_at = CURRENT_TIMESTAMP
                WHERE endpoint = $4
            `, [parseInt(userId), keys.p256dh, keys.auth, endpoint]);
        } else {
            // Create new subscription
            await db.query(`
                INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth, user_agent)
                VALUES ($1, $2, $3, $4, $5)
            `, [parseInt(userId), endpoint, keys.p256dh, keys.auth, req.headers['user-agent'] || null]);
        }

        // Create default notification preferences if not exist
        const prefs = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1', [parseInt(userId)]);
        if (prefs.rows.length === 0) {
            await db.query('INSERT INTO notification_preferences (user_id) VALUES ($1)', [parseInt(userId)]);
        }

        res.json({ success: true });
    } catch (err) {
        logger.error('Error subscribing to push notifications:', err);
        res.status(500).json({ error: err.message });
    }
});

// Unsubscribe from push notifications
app.post('/api/notifications/unsubscribe', async (req, res) => {
    try {
        const { endpoint } = req.body;

        await db.query(`
            UPDATE push_subscriptions SET is_active = false WHERE endpoint = $1
        `, [endpoint]);

        res.json({ success: true });
    } catch (err) {
        logger.error('Error unsubscribing from push notifications:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get notification preferences
app.get('/api/notifications/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        let prefs = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1', [parseInt(userId)]);

        // Create default if not exist
        if (prefs.rows.length === 0) {
            await db.query('INSERT INTO notification_preferences (user_id) VALUES ($1)', [parseInt(userId)]);
            prefs = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1', [parseInt(userId)]);
        }

        res.json(prefs.rows[0]);
    } catch (err) {
        logger.error('Error getting notification preferences:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update notification preferences
app.put('/api/notifications/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const prefs = req.body;

        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(prefs)) {
            if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (fields.length > 0) {
            values.push(parseInt(userId));
            await db.query(`
                UPDATE notification_preferences
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $${paramIndex}
            `, values);
        }

        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating notification preferences:', err);
        res.status(500).json({ error: err.message });
    }
});

// Send notification (internal use - called by backend)
app.post('/api/notifications/send', async (req, res) => {
    try {
        const { userId, type, title, body, data } = req.body;

        // Save to history
        await db.query(`
            INSERT INTO notification_history (user_id, notification_type, title, body, data)
            VALUES ($1, $2, $3, $4, $5)
        `, [parseInt(userId), type, title, body || null, data ? JSON.stringify(data) : null]);

        // Get user's active subscriptions
        const subscriptions = await db.query(`
            SELECT * FROM push_subscriptions WHERE user_id = $1 AND is_active = true
        `, [parseInt(userId)]);

        // TODO: Here you would use web-push library to send actual push notifications
        // For now, we just save to history

        res.json({ success: true, subscriptions_count: subscriptions.rows.length });
    } catch (err) {
        logger.error('Error sending notification:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get notification history
app.get('/api/notifications/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit || 50;

        const notifications = await db.query(`
            SELECT * FROM notification_history
            WHERE user_id = $1
            ORDER BY sent_at DESC
            LIMIT $2
        `, [parseInt(userId), parseInt(limit)]);

        res.json(notifications.rows);
    } catch (err) {
        logger.error('Error getting notification history:', err);
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;

        await db.query(`
            UPDATE notification_history SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1
        `, [parseInt(notificationId)]);

        res.json({ success: true });
    } catch (err) {
        logger.error('Error marking notification as read:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get unread notification count
app.get('/api/notifications/unread-count/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await db.query(`
            SELECT COUNT(*) as count FROM notification_history WHERE user_id = $1 AND is_read = false
        `, [parseInt(userId)]);

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        logger.error('Error getting unread notification count:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// USER SETTINGS SYSTEM
// =========================

// Get user settings
app.get('/api/settings/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        let settings = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [parseInt(userId)]);

        // Create default settings if not exist
        if (settings.rows.length === 0) {
            await db.query('INSERT INTO user_settings (user_id) VALUES ($1)', [parseInt(userId)]);
            settings = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [parseInt(userId)]);
        }

        res.json(settings.rows[0]);
    } catch (err) {
        logger.error('Error getting user settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update user settings
app.put('/api/settings/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const settings = req.body;

        // Ensure settings exist
        const existing = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [parseInt(userId)]);
        if (existing.rows.length === 0) {
            await db.query('INSERT INTO user_settings (user_id) VALUES ($1)', [parseInt(userId)]);
        }

        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(settings)) {
            if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
                fields.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (fields.length > 0) {
            values.push(parseInt(userId));
            await db.query(`
                UPDATE user_settings
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $${paramIndex}
            `, values);
        }

        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating user settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update specific setting
app.patch('/api/settings/:userId/:setting', async (req, res) => {
    try {
        const { userId, setting } = req.params;
        const { value } = req.body;

        // Ensure settings exist
        const existing = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [parseInt(userId)]);
        if (existing.rows.length === 0) {
            await db.query('INSERT INTO user_settings (user_id) VALUES ($1)', [parseInt(userId)]);
        }

        const allowedSettings = ['theme', 'language', 'timezone', 'date_format', 'time_format',
                                  'sound_effects', 'animations', 'auto_play_audio',
                                  'speech_rate', 'speech_pitch', 'speech_volume'];

        if (!allowedSettings.includes(setting)) {
            return res.status(400).json({ error: 'Invalid setting name' });
        }

        await db.query(`
            UPDATE user_settings SET ${setting} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2
        `, [value, parseInt(userId)]);

        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating specific setting:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reset settings to default
app.post('/api/settings/:userId/reset', async (req, res) => {
    try {
        const { userId } = req.params;

        await db.query('DELETE FROM user_settings WHERE user_id = $1', [parseInt(userId)]);
        await db.query('INSERT INTO user_settings (user_id) VALUES ($1)', [parseInt(userId)]);

        const settings = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [parseInt(userId)]);

        res.json({ success: true, settings: settings.rows[0] });
    } catch (err) {
        logger.error('Error resetting user settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// ACTIVITY FEED SYSTEM
// =========================

// Post activity to feed
app.post('/api/activity-feed', async (req, res) => {
    try {
        const { userId, activityType, activityData, isPublic } = req.body;

        const result = await db.query(`
            INSERT INTO activity_feed (user_id, activity_type, activity_data, is_public)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [parseInt(userId), activityType, activityData ? JSON.stringify(activityData) : null, isPublic !== false]);

        res.json({ success: true, activity: result.rows[0] });
    } catch (err) {
        logger.error('Error posting activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get global feed (public activities from all users)
app.get('/api/activity-feed/global', async (req, res) => {
    try {
        const limit = req.query.limit || 50;
        const offset = req.query.offset || 0;

        const activities = await db.query(`
            SELECT
                af.*,
                u.name as user_name,
                u.avatar_url,
                us.level,
                us.total_xp
            FROM activity_feed af
            JOIN users u ON af.user_id = u.id
            LEFT JOIN user_stats us ON af.user_id = us.user_id
            WHERE af.is_public = true
            ORDER BY af.created_at DESC
            LIMIT $1 OFFSET $2
        `, [parseInt(limit), parseInt(offset)]);

        res.json(activities.rows);
    } catch (err) {
        logger.error('Error getting global feed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's personal feed (their activities only)
app.get('/api/activity-feed/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit || 50;

        const activities = await db.query(`
            SELECT * FROM activity_feed
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, [parseInt(userId), parseInt(limit)]);

        res.json(activities.rows);
    } catch (err) {
        logger.error('Error getting user feed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get friends feed (activities from friends)
app.get('/api/activity-feed/friends/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit || 50;

        const activities = await db.query(`
            SELECT
                af.*,
                u.name as user_name,
                u.avatar_url,
                us.level,
                us.total_xp
            FROM activity_feed af
            JOIN users u ON af.user_id = u.id
            LEFT JOIN user_stats us ON af.user_id = us.user_id
            WHERE af.user_id IN (
                SELECT friend_id FROM friendships WHERE user_id = $1 AND status = 'accepted'
                UNION
                SELECT user_id FROM friendships WHERE friend_id = $1 AND status = 'accepted'
            )
            AND af.is_public = true
            ORDER BY af.created_at DESC
            LIMIT $2
        `, [parseInt(userId), parseInt(limit)]);

        res.json(activities.rows);
    } catch (err) {
        logger.error('Error getting friends feed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get feed by activity type
app.get('/api/activity-feed/type/:activityType', async (req, res) => {
    try {
        const { activityType } = req.params;
        const limit = req.query.limit || 50;

        const activities = await db.query(`
            SELECT
                af.*,
                u.name as user_name,
                u.avatar_url,
                us.level
            FROM activity_feed af
            JOIN users u ON af.user_id = u.id
            LEFT JOIN user_stats us ON af.user_id = us.user_id
            WHERE af.activity_type = $1 AND af.is_public = true
            ORDER BY af.created_at DESC
            LIMIT $2
        `, [activityType, parseInt(limit)]);

        res.json(activities.rows);
    } catch (err) {
        logger.error('Error getting feed by type:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete activity
app.delete('/api/activity-feed/:activityId', async (req, res) => {
    try {
        const { activityId } = req.params;
        const { userId } = req.body;

        // Check ownership
        const activity = await db.query('SELECT * FROM activity_feed WHERE id = $1', [parseInt(activityId)]);
        if (activity.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        if (activity.rows[0].user_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Not authorized to delete this activity' });
        }

        await db.query('DELETE FROM activity_feed WHERE id = $1', [parseInt(activityId)]);

        res.json({ success: true });
    } catch (err) {
        logger.error('Error deleting activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// SOCIAL REACTIONS SYSTEM
// =========================

// Like an activity
app.post('/api/activity-feed/:activityId/like', async (req, res) => {
    try {
        const { activityId } = req.params;
        const { userId } = req.body;

        // Check if already liked
        const existing = await db.query(
            'SELECT * FROM activity_likes WHERE activity_id = $1 AND user_id = $2',
            [parseInt(activityId), parseInt(userId)]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Already liked' });
        }

        await db.query(`
            INSERT INTO activity_likes (activity_id, user_id)
            VALUES ($1, $2)
        `, [parseInt(activityId), parseInt(userId)]);

        // Get like count
        const count = await db.query(
            'SELECT COUNT(*) as count FROM activity_likes WHERE activity_id = $1',
            [parseInt(activityId)]
        );

        res.json({ success: true, like_count: parseInt(count.rows[0].count) });
    } catch (err) {
        logger.error('Error liking activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// Unlike an activity
app.delete('/api/activity-feed/:activityId/like', async (req, res) => {
    try {
        const { activityId } = req.params;
        const { userId } = req.body;

        await db.query(
            'DELETE FROM activity_likes WHERE activity_id = $1 AND user_id = $2',
            [parseInt(activityId), parseInt(userId)]
        );

        // Get like count
        const count = await db.query(
            'SELECT COUNT(*) as count FROM activity_likes WHERE activity_id = $1',
            [parseInt(activityId)]
        );

        res.json({ success: true, like_count: parseInt(count.rows[0].count) });
    } catch (err) {
        logger.error('Error unliking activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get likes for activity
app.get('/api/activity-feed/:activityId/likes', async (req, res) => {
    try {
        const { activityId } = req.params;

        const likes = await db.query(`
            SELECT
                al.*,
                u.name as user_name,
                u.avatar_url
            FROM activity_likes al
            JOIN users u ON al.user_id = u.id
            WHERE al.activity_id = $1
            ORDER BY al.created_at DESC
        `, [parseInt(activityId)]);

        res.json(likes.rows);
    } catch (err) {
        logger.error('Error getting likes:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add comment to activity
app.post('/api/activity-feed/:activityId/comment', async (req, res) => {
    try {
        const { activityId } = req.params;
        const { userId, commentText } = req.body;

        if (!commentText || commentText.trim().length === 0) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const result = await db.query(`
            INSERT INTO activity_comments (activity_id, user_id, comment_text)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [parseInt(activityId), parseInt(userId), commentText.trim()]);

        // Get user info
        const user = await db.query('SELECT name, avatar_url FROM users WHERE id = $1', [parseInt(userId)]);

        res.json({
            success: true,
            comment: {
                ...result.rows[0],
                user_name: user.rows[0].name,
                avatar_url: user.rows[0].avatar_url
            }
        });
    } catch (err) {
        logger.error('Error adding comment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get comments for activity
app.get('/api/activity-feed/:activityId/comments', async (req, res) => {
    try {
        const { activityId } = req.params;

        const comments = await db.query(`
            SELECT
                ac.*,
                u.name as user_name,
                u.avatar_url
            FROM activity_comments ac
            JOIN users u ON ac.user_id = u.id
            WHERE ac.activity_id = $1
            ORDER BY ac.created_at ASC
        `, [parseInt(activityId)]);

        res.json(comments.rows);
    } catch (err) {
        logger.error('Error getting comments:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete comment
app.delete('/api/activity-feed/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userId } = req.body;

        // Check ownership
        const comment = await db.query('SELECT * FROM activity_comments WHERE id = $1', [parseInt(commentId)]);
        if (comment.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.rows[0].user_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        await db.query('DELETE FROM activity_comments WHERE id = $1', [parseInt(commentId)]);

        res.json({ success: true });
    } catch (err) {
        logger.error('Error deleting comment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get activity with likes and comments count
app.get('/api/activity-feed/:activityId/details', async (req, res) => {
    try {
        const { activityId } = req.params;
        const { userId } = req.query;

        // Get activity
        const activity = await db.query(`
            SELECT
                af.*,
                u.name as user_name,
                u.avatar_url,
                us.level,
                us.total_xp
            FROM activity_feed af
            JOIN users u ON af.user_id = u.id
            LEFT JOIN user_stats us ON af.user_id = us.user_id
            WHERE af.id = $1
        `, [parseInt(activityId)]);

        if (activity.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Get counts
        const likesCount = await db.query(
            'SELECT COUNT(*) as count FROM activity_likes WHERE activity_id = $1',
            [parseInt(activityId)]
        );

        const commentsCount = await db.query(
            'SELECT COUNT(*) as count FROM activity_comments WHERE activity_id = $1',
            [parseInt(activityId)]
        );

        // Check if current user liked
        let isLiked = false;
        if (userId) {
            const userLike = await db.query(
                'SELECT * FROM activity_likes WHERE activity_id = $1 AND user_id = $2',
                [parseInt(activityId), parseInt(userId)]
            );
            isLiked = userLike.rows.length > 0;
        }

        res.json({
            ...activity.rows[0],
            likes_count: parseInt(likesCount.rows[0].count),
            comments_count: parseInt(commentsCount.rows[0].count),
            is_liked: isLiked
        });
    } catch (err) {
        logger.error('Error getting activity details:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// USER INVENTORY SYSTEM
// =========================

// Get user's inventory
app.get('/api/inventory/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { itemType } = req.query;

        let query = 'SELECT * FROM user_inventory WHERE user_id = $1';
        const params = [parseInt(userId)];

        if (itemType) {
            query += ' AND item_type = $2';
            params.push(itemType);
        }

        query += ' ORDER BY acquired_at DESC';

        const items = await db.query(query, params);

        res.json(items.rows);
    } catch (err) {
        logger.error('Error getting inventory:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add item to inventory
app.post('/api/inventory', async (req, res) => {
    try {
        const { userId, itemType, itemId, itemName, quantity, expiresAt, metadata } = req.body;

        // Check if item exists
        const existing = await db.query(
            'SELECT * FROM user_inventory WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
            [parseInt(userId), itemType, itemId]
        );

        let result;
        if (existing.rows.length > 0) {
            // Update quantity
            result = await db.query(`
                UPDATE user_inventory
                SET quantity = quantity + $1, is_active = true
                WHERE user_id = $2 AND item_type = $3 AND item_id = $4
                RETURNING *
            `, [quantity || 1, parseInt(userId), itemType, itemId]);
        } else {
            // Insert new
            result = await db.query(`
                INSERT INTO user_inventory (user_id, item_type, item_id, item_name, quantity, expires_at, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [
                parseInt(userId),
                itemType,
                itemId,
                itemName,
                quantity || 1,
                expiresAt || null,
                metadata ? JSON.stringify(metadata) : null
            ]);
        }

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        logger.error('Error adding to inventory:', err);
        res.status(500).json({ error: err.message });
    }
});

// Use/consume item from inventory
app.post('/api/inventory/:inventoryId/use', async (req, res) => {
    try {
        const { inventoryId } = req.params;
        const { quantity } = req.body;

        const item = await db.query('SELECT * FROM user_inventory WHERE id = $1', [parseInt(inventoryId)]);

        if (item.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const itemData = item.rows[0];
        const useQuantity = quantity || 1;

        if (itemData.quantity < useQuantity) {
            return res.status(400).json({ error: 'Insufficient quantity' });
        }

        let result;
        if (itemData.quantity === useQuantity) {
            // Remove item
            await db.query('DELETE FROM user_inventory WHERE id = $1', [parseInt(inventoryId)]);
            result = null;
        } else {
            // Decrease quantity
            result = await db.query(`
                UPDATE user_inventory SET quantity = quantity - $1 WHERE id = $2 RETURNING *
            `, [useQuantity, parseInt(inventoryId)]);
        }

        res.json({ success: true, item: result ? result.rows[0] : null });
    } catch (err) {
        logger.error('Error using item:', err);
        res.status(500).json({ error: err.message });
    }
});

// Equip item (themes, avatars, etc.)
app.post('/api/inventory/:inventoryId/equip', async (req, res) => {
    try {
        const { inventoryId } = req.params;
        const { userId } = req.body;

        await db.query('BEGIN');

        // Get item
        const item = await db.query('SELECT * FROM user_inventory WHERE id = $1', [parseInt(inventoryId)]);

        if (item.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Item not found' });
        }

        const itemData = item.rows[0];

        // Unequip all items of same type
        await db.query(
            'UPDATE user_inventory SET is_equipped = false WHERE user_id = $1 AND item_type = $2',
            [parseInt(userId), itemData.item_type]
        );

        // Equip this item
        await db.query('UPDATE user_inventory SET is_equipped = true WHERE id = $1', [parseInt(inventoryId)]);

        await db.query('COMMIT');

        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error equipping item:', err);
        res.status(500).json({ error: err.message });
    }
});

// Unequip item
app.post('/api/inventory/:inventoryId/unequip', async (req, res) => {
    try {
        const { inventoryId } = req.params;

        await db.query('UPDATE user_inventory SET is_equipped = false WHERE id = $1', [parseInt(inventoryId)]);

        res.json({ success: true });
    } catch (err) {
        logger.error('Error unequipping item:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get equipped items
app.get('/api/inventory/:userId/equipped', async (req, res) => {
    try {
        const { userId } = req.params;

        const items = await db.query(`
            SELECT * FROM user_inventory
            WHERE user_id = $1 AND is_equipped = true
        `, [parseInt(userId)]);

        res.json(items.rows);
    } catch (err) {
        logger.error('Error getting equipped items:', err);
        res.status(500).json({ error: err.message });
    }
});

// Clean up expired items
app.post('/api/inventory/cleanup-expired', async (req, res) => {
    try {
        const result = await db.query(`
            DELETE FROM user_inventory
            WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
            RETURNING *
        `);

        res.json({ success: true, deleted_count: result.rows.length });
    } catch (err) {
        logger.error('Error cleaning up expired items:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// WEEKLY CHALLENGES SYSTEM
// =========================

// Get or create weekly challenges for user
app.get('/api/weekly-challenges/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Check feature access
        const featureAccess = await checkFeatureAccess(userId, 'weekly_challenges');
        if (!featureAccess.hasAccess) {
            return res.status(403).json({
                error: 'Feature locked',
                message: `You need level ${featureAccess.requiredLevel} to use this feature`,
                feature_name: featureAccess.featureName,
                current_level: featureAccess.currentLevel,
                levels_remaining: featureAccess.levelsRemaining
            });
        }

        // Get current week start (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        let challenges = await db.query(`
            SELECT * FROM weekly_challenges
            WHERE user_id = $1 AND week_start_date = $2
            ORDER BY difficulty DESC
        `, [parseInt(userId), weekStartStr]);

        // Create default challenges if none exist
        if (challenges.rows.length === 0) {
            const defaultChallenges = [
                { type: 'weekly_xp', title: 'Weekly XP Master', description: 'Earn 500 XP this week', target: 500, reward_xp: 200, reward_coins: 50, difficulty: 'hard' },
                { type: 'weekly_words', title: 'Word Collector', description: 'Learn 50 new words this week', target: 50, reward_xp: 150, reward_coins: 30, difficulty: 'medium' },
                { type: 'weekly_streak', title: 'Streak Keeper', description: 'Maintain your streak all week (7 days)', target: 7, reward_xp: 100, reward_coins: 25, difficulty: 'medium' }
            ];

            await db.query('BEGIN');
            for (const challenge of defaultChallenges) {
                await db.query(`
                    INSERT INTO weekly_challenges (user_id, week_start_date, challenge_type, title, description, target_value, reward_xp, reward_coins, difficulty)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [parseInt(userId), weekStartStr, challenge.type, challenge.title, challenge.description, challenge.target, challenge.reward_xp, challenge.reward_coins, challenge.difficulty]);
            }
            await db.query('COMMIT');

            challenges = await db.query(`
                SELECT * FROM weekly_challenges
                WHERE user_id = $1 AND week_start_date = $2
                ORDER BY difficulty DESC
            `, [parseInt(userId), weekStartStr]);
        }

        res.json(challenges.rows);
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error getting weekly challenges:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update weekly challenge progress
app.post('/api/weekly-challenges/progress', async (req, res) => {
    try {
        const { userId, challengeType, increment } = req.body;

        // Get current week start
        const now = new Date();
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        await db.query('BEGIN');

        // Update progress
        await db.query(`
            UPDATE weekly_challenges
            SET current_progress = current_progress + $1
            WHERE user_id = $2 AND week_start_date = $3 AND challenge_type = $4
        `, [increment || 1, parseInt(userId), weekStartStr, challengeType]);

        // Check if completed
        const challenge = await db.query(`
            SELECT * FROM weekly_challenges
            WHERE user_id = $1 AND week_start_date = $2 AND challenge_type = $3
        `, [parseInt(userId), weekStartStr, challengeType]);

        if (challenge.rows.length > 0) {
            const c = challenge.rows[0];
            if (!c.is_completed && c.current_progress >= c.target_value) {
                await db.query(`
                    UPDATE weekly_challenges
                    SET is_completed = true, completed_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `, [c.id]);
            }
        }

        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error updating weekly challenge progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// Claim weekly challenge reward
app.post('/api/weekly-challenges/:challengeId/claim', async (req, res) => {
    try {
        const { challengeId } = req.params;

        await db.query('BEGIN');

        const challenge = await db.query('SELECT * FROM weekly_challenges WHERE id = $1', [parseInt(challengeId)]);

        if (challenge.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const c = challenge.rows[0];

        if (!c.is_completed) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Challenge not completed' });
        }

        if (c.reward_claimed) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Reward already claimed' });
        }

        // Award XP
        if (c.reward_xp > 0) {
            await db.query('INSERT INTO xp_log (user_id, xp_amount, action_type, action_details) VALUES ($1, $2, $3, $4)',
                [c.user_id, c.reward_xp, 'weekly_challenge', `Completed: ${c.title}`]);
            await db.query('UPDATE user_stats SET total_xp = total_xp + $1 WHERE user_id = $2', [c.reward_xp, c.user_id]);
        }

        // Award coins
        if (c.reward_coins > 0) {
            await db.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [c.reward_coins, c.user_id]);
            await db.query(`
                INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
                VALUES ($1, $2, $3, $4)
            `, [c.user_id, c.reward_coins, 'reward', `Weekly challenge: ${c.title}`]);
        }

        // Mark as claimed
        await db.query('UPDATE weekly_challenges SET reward_claimed = true WHERE id = $1', [parseInt(challengeId)]);

        await db.query('COMMIT');
        res.json({ success: true, reward_xp: c.reward_xp, reward_coins: c.reward_coins });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error claiming weekly challenge reward:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get weekly challenge stats
app.get('/api/weekly-challenges/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await db.query(`
            SELECT
                COUNT(*) as total_challenges,
                COUNT(*) FILTER (WHERE is_completed = true) as completed_challenges,
                SUM(reward_xp) FILTER (WHERE reward_claimed = true) as total_xp_earned,
                SUM(reward_coins) FILTER (WHERE reward_claimed = true) as total_coins_earned
            FROM weekly_challenges
            WHERE user_id = $1
        `, [parseInt(userId)]);

        res.json(stats.rows[0]);
    } catch (err) {
        logger.error('Error getting weekly challenge stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// MILESTONES & REWARDS SYSTEM
// =========================

// Check and create milestones for user
app.post('/api/milestones/check', async (req, res) => {
    try {
        const { userId, milestoneType, currentValue } = req.body;

        // Define milestone thresholds
        const milestones = {
            'words_learned': [10, 50, 100, 250, 500, 1000, 2500, 5000],
            'total_xp': [100, 500, 1000, 2500, 5000, 10000, 25000, 50000],
            'streak_days': [7, 14, 30, 60, 100, 180, 365, 500],
            'quizzes_completed': [10, 50, 100, 250, 500, 1000, 2500, 5000],
            'achievements_unlocked': [5, 10, 15, 20, 25, 30, 40, 50]
        };

        const thresholds = milestones[milestoneType] || [];
        const newMilestones = [];

        await db.query('BEGIN');

        for (const threshold of thresholds) {
            if (currentValue >= threshold) {
                // Check if milestone exists
                const existing = await db.query(
                    'SELECT * FROM user_milestones WHERE user_id = $1 AND milestone_type = $2 AND milestone_value = $3',
                    [parseInt(userId), milestoneType, threshold]
                );

                if (existing.rows.length === 0) {
                    // Create milestone
                    const rewardXp = Math.floor(threshold * 0.5);
                    const rewardCoins = Math.floor(threshold * 0.1);

                    const result = await db.query(`
                        INSERT INTO user_milestones (user_id, milestone_type, milestone_value, is_reached, reached_at, reward_xp, reward_coins)
                        VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, $4, $5)
                        RETURNING *
                    `, [parseInt(userId), milestoneType, threshold, rewardXp, rewardCoins]);

                    newMilestones.push(result.rows[0]);
                }
            }
        }

        await db.query('COMMIT');
        res.json({ success: true, new_milestones: newMilestones });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error checking milestones:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user milestones
app.get('/api/milestones/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { milestoneType } = req.query;

        let query = 'SELECT * FROM user_milestones WHERE user_id = $1';
        const params = [parseInt(userId)];

        if (milestoneType) {
            query += ' AND milestone_type = $2';
            params.push(milestoneType);
        }

        query += ' ORDER BY milestone_value ASC';

        const milestones = await db.query(query, params);

        res.json(milestones.rows);
    } catch (err) {
        logger.error('Error getting milestones:', err);
        res.status(500).json({ error: err.message });
    }
});

// Claim milestone reward
app.post('/api/milestones/:milestoneId/claim', async (req, res) => {
    try {
        const { milestoneId } = req.params;

        await db.query('BEGIN');

        const milestone = await db.query('SELECT * FROM user_milestones WHERE id = $1', [parseInt(milestoneId)]);

        if (milestone.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Milestone not found' });
        }

        const m = milestone.rows[0];

        if (!m.is_reached) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Milestone not reached' });
        }

        if (m.reward_claimed) {
            await db.query('ROLLBACK');
            return res.status(400).json({ error: 'Reward already claimed' });
        }

        // Award XP
        if (m.reward_xp > 0) {
            await db.query('INSERT INTO xp_log (user_id, xp_amount, action_type, action_details) VALUES ($1, $2, $3, $4)',
                [m.user_id, m.reward_xp, 'milestone', `${m.milestone_type}: ${m.milestone_value}`]);
            await db.query('UPDATE user_stats SET total_xp = total_xp + $1 WHERE user_id = $2', [m.reward_xp, m.user_id]);
        }

        // Award coins
        if (m.reward_coins > 0) {
            await db.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [m.reward_coins, m.user_id]);
            await db.query(`
                INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
                VALUES ($1, $2, $3, $4)
            `, [m.user_id, m.reward_coins, 'reward', `Milestone: ${m.milestone_type} ${m.milestone_value}`]);
        }

        // Mark as claimed
        await db.query('UPDATE user_milestones SET reward_claimed = true WHERE id = $1', [parseInt(milestoneId)]);

        await db.query('COMMIT');
        res.json({ success: true, reward_xp: m.reward_xp, reward_coins: m.reward_coins, special_reward: m.special_reward });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error claiming milestone reward:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get milestone progress
app.get('/api/milestones/:userId/progress', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get current stats
        const stats = await db.query(`
            SELECT
                us.total_words_learned as words_learned,
                us.total_xp,
                us.current_streak as streak_days,
                us.quizzes_completed
            FROM user_stats us
            WHERE us.user_id = $1
        `, [parseInt(userId)]);

        const achievements = await db.query(
            'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND is_unlocked = true',
            [parseInt(userId)]
        );

        const currentStats = stats.rows[0] || {};
        currentStats.achievements_unlocked = parseInt(achievements.rows[0].count);

        // Get all milestones
        const milestones = await db.query('SELECT * FROM user_milestones WHERE user_id = $1 ORDER BY milestone_value ASC', [parseInt(userId)]);

        res.json({
            current_stats: currentStats,
            milestones: milestones.rows
        });
    } catch (err) {
        logger.error('Error getting milestone progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// USER BADGES SYSTEM
// =========================

// Get all badges
app.get('/api/badges', async (req, res) => {
    try {
        const { userId } = req.query;

        const badges = await db.query('SELECT * FROM badges WHERE is_active = true ORDER BY rarity DESC, badge_name ASC');

        if (userId) {
            // Add user's earned status
            const userBadges = await db.query('SELECT badge_id FROM user_badges WHERE user_id = $1', [parseInt(userId)]);
            const earnedIds = new Set(userBadges.rows.map(ub => ub.badge_id));

            badges.rows.forEach(badge => {
                badge.is_earned = earnedIds.has(badge.id);
            });
        }

        res.json(badges.rows);
    } catch (err) {
        logger.error('Error getting badges:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's earned badges
app.get('/api/badges/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const badges = await db.query(`
            SELECT b.*, ub.earned_at, ub.is_equipped
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = $1
            ORDER BY ub.earned_at DESC
        `, [parseInt(userId)]);

        res.json(badges.rows);
    } catch (err) {
        logger.error('Error getting user badges:', err);
        res.status(500).json({ error: err.message });
    }
});

// Award badge to user
app.post('/api/badges/award', async (req, res) => {
    try {
        const { userId, badgeKey } = req.body;

        // Get badge
        const badge = await db.query('SELECT * FROM badges WHERE badge_key = $1', [badgeKey]);

        if (badge.rows.length === 0) {
            return res.status(404).json({ error: 'Badge not found' });
        }

        // Check if already earned
        const existing = await db.query(
            'SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2',
            [parseInt(userId), badge.rows[0].id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Badge already earned' });
        }

        // Award badge
        const result = await db.query(`
            INSERT INTO user_badges (user_id, badge_id)
            VALUES ($1, $2)
            RETURNING *
        `, [parseInt(userId), badge.rows[0].id]);

        res.json({ success: true, badge: { ...badge.rows[0], ...result.rows[0] } });
    } catch (err) {
        logger.error('Error awarding badge:', err);
        res.status(500).json({ error: err.message });
    }
});

// Equip badge
app.post('/api/badges/:badgeId/equip', async (req, res) => {
    try {
        const { badgeId } = req.params;
        const { userId } = req.body;

        await db.query('BEGIN');

        // Unequip all badges
        await db.query('UPDATE user_badges SET is_equipped = false WHERE user_id = $1', [parseInt(userId)]);

        // Equip this badge
        await db.query(
            'UPDATE user_badges SET is_equipped = true WHERE user_id = $1 AND badge_id = $2',
            [parseInt(userId), parseInt(badgeId)]
        );

        await db.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await db.query('ROLLBACK');
        logger.error('Error equipping badge:', err);
        res.status(500).json({ error: err.message });
    }
});

// Unequip badge
app.post('/api/badges/:badgeId/unequip', async (req, res) => {
    try {
        const { badgeId } = req.params;
        const { userId } = req.body;

        await db.query(
            'UPDATE user_badges SET is_equipped = false WHERE user_id = $1 AND badge_id = $2',
            [parseInt(userId), parseInt(badgeId)]
        );

        res.json({ success: true });
    } catch (err) {
        logger.error('Error unequipping badge:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get equipped badge
app.get('/api/badges/user/:userId/equipped', async (req, res) => {
    try {
        const { userId } = req.params;

        const badge = await db.query(`
            SELECT b.*, ub.earned_at
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = $1 AND ub.is_equipped = true
            LIMIT 1
        `, [parseInt(userId)]);

        res.json(badge.rows[0] || null);
    } catch (err) {
        logger.error('Error getting equipped badge:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// TTS FALLBACK SYSTEM
// =========================

// Create cache directory if not exists
const TTS_CACHE_DIR = path.join(__dirname, 'cache', 'tts');
if (!fs.existsSync(TTS_CACHE_DIR)) {
    fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}

// Synthesize speech using fallback TTS API
app.post('/api/tts/synthesize', async (req, res) => {
    try {
        const { text, language, provider } = req.body;

        if (!text || !language) {
            return res.status(400).json({ error: 'Missing required fields: text, language' });
        }

        // Create cache key
        const cacheKey = crypto.createHash('md5').update(`${language}_${text}`).digest('hex');
        const cacheFile = path.join(TTS_CACHE_DIR, `${cacheKey}.json`);

        // Check cache
        if (fs.existsSync(cacheFile)) {
            const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            return res.json({
                audioUrl: cached.audioUrl,
                provider: cached.provider,
                cached: true
            });
        }

        // Mock TTS synthesis (в production здесь будет real API call)
        // TODO: Integrate real TTS providers (Azure, Google, Amazon)
        const mockAudioUrl = `data:audio/mp3;base64,${Buffer.from('MOCK_AUDIO_DATA').toString('base64')}`;

        const result = {
            audioUrl: mockAudioUrl,
            provider: provider || 'mock',
            text: text,
            language: language,
            cached: false,
            timestamp: new Date().toISOString()
        };

        // Save to cache
        fs.writeFileSync(cacheFile, JSON.stringify(result), 'utf8');

        res.json({
            audioUrl: result.audioUrl,
            provider: result.provider,
            cached: false
        });

    } catch (err) {
        logger.error('Error in TTS synthesize:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get TTS cache stats
app.get('/api/tts/cache/stats', async (req, res) => {
    try {
        const files = fs.readdirSync(TTS_CACHE_DIR);
        const totalSize = files.reduce((acc, file) => {
            const stats = fs.statSync(path.join(TTS_CACHE_DIR, file));
            return acc + stats.size;
        }, 0);

        res.json({
            cached_items: files.length,
            total_size_bytes: totalSize,
            total_size_mb: (totalSize / (1024 * 1024)).toFixed(2)
        });
    } catch (err) {
        logger.error('Error getting TTS cache stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Clear TTS cache
app.delete('/api/tts/cache/clear', async (req, res) => {
    try {
        const files = fs.readdirSync(TTS_CACHE_DIR);
        files.forEach(file => {
            fs.unlinkSync(path.join(TTS_CACHE_DIR, file));
        });

        res.json({ success: true, deleted_items: files.length });
    } catch (err) {
        logger.error('Error clearing TTS cache:', err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk synthesize (for offline preloading)
app.post('/api/tts/bulk-synthesize', async (req, res) => {
    try {
        const { words, userId } = req.body;

        if (!words || !Array.isArray(words)) {
            return res.status(400).json({ error: 'Missing or invalid words array' });
        }

        let synthesized = 0;
        let cached = 0;
        let errors = 0;
        const results = [];

        for (const word of words) {
            try {
                const { text, language } = word;
                const cacheKey = crypto.createHash('md5').update(`${language}_${text}`).digest('hex');
                const cacheFile = path.join(TTS_CACHE_DIR, `${cacheKey}.json`);

                if (fs.existsSync(cacheFile)) {
                    cached++;
                    const cached_data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                    results.push({ text, language, audioUrl: cached_data.audioUrl, cached: true });
                } else {
                    const mockAudioUrl = `data:audio/mp3;base64,${Buffer.from(`MOCK_${text}`).toString('base64')}`;
                    const result = {
                        audioUrl: mockAudioUrl,
                        provider: 'mock',
                        text: text,
                        language: language,
                        cached: false,
                        timestamp: new Date().toISOString()
                    };
                    fs.writeFileSync(cacheFile, JSON.stringify(result), 'utf8');
                    synthesized++;
                    results.push({ text, language, audioUrl: mockAudioUrl, cached: false });
                }
            } catch (err) {
                logger.error(`Error processing word ${word.text}:`, err);
                errors++;
            }
        }

        res.json({ success: true, total: words.length, synthesized, cached, errors, results });
    } catch (err) {
        logger.error('Error in bulk synthesize:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get popular words (for offline preloading)
app.get('/api/words/popular/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit || 100;

        // Get user's words (simplified - just return all words for now)
        const words = await db.query(`
            SELECT
                word AS text,
                'de-DE' AS language,
                1 as usage_count
            FROM words
            WHERE user_id = $1
            ORDER BY word ASC
            LIMIT $2
        `, [parseInt(userId), parseInt(limit)]);

        res.json(words.rows);
    } catch (err) {
        logger.error('Error getting popular words:', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================
// PERSONAL INSIGHTS SYSTEM
// =========================

// Helper functions for insights
function getTimeInsightTitle(hour) {
    if (hour >= 6 && hour < 12) return "Вы лучше всего учитесь утром";
    if (hour >= 12 && hour < 18) return "Вы продуктивны днём";
    if (hour >= 18 && hour < 22) return "Вечер - ваше лучшее время";
    return "Вы ночная сова";
}

function getTimeIcon(hour) {
    if (hour >= 6 && hour < 12) return "☀️";
    if (hour >= 12 && hour < 18) return "🌤️";
    if (hour >= 18 && hour < 22) return "🌆";
    return "🌙";
}

function getExerciseTitle(actionType) {
    const titles = {
        'quiz_completed': 'Квизы',
        'word_learned': 'Изучение новых слов',
        'word_reviewed': 'Повторение',
        'streak_maintained': 'Поддержание стрика',
        'achievement_earned': 'Достижения'
    };
    return titles[actionType] || actionType;
}

// Get personal insights for user
app.get('/api/users/:userId/insights', async (req, res) => {
    try {
        const { userId } = req.params;
        const period = req.query.period || 'month';
        const limit = parseInt(req.query.limit) || 5;

        // Calculate interval based on period
        let interval = '30 days';
        if (period === 'week') interval = '7 days';
        if (period === 'all') interval = '365 days';

        const insights = [];

        // 1. Best learning time
        const timeQuery = await db.query(`
            SELECT
                EXTRACT(HOUR FROM createdat) as hour,
                COUNT(*) as activities,
                SUM(xp_amount) as total_xp
            FROM xp_log
            WHERE user_id = $1
              AND createdat >= NOW() - INTERVAL '${interval}'
            GROUP BY hour
            HAVING COUNT(*) >= 1
            ORDER BY total_xp DESC
            LIMIT 1
        `, [parseInt(userId)]);

        if (timeQuery.rows.length > 0) {
            const timeData = timeQuery.rows[0];
            const totalXpQuery = await db.query(`
                SELECT SUM(xp_amount) as total FROM xp_log
                WHERE user_id = $1 AND createdat >= NOW() - INTERVAL '${interval}'
            `, [parseInt(userId)]);

            const totalXp = totalXpQuery.rows[0]?.total || 1;
            const percentage = Math.round((timeData.total_xp / totalXp) * 100);

            insights.push({
                id: 'best_time',
                type: 'learning_time',
                title: getTimeInsightTitle(parseInt(timeData.hour)),
                description: `${percentage}% вашего XP заработано в ${timeData.hour}:00`,
                icon: getTimeIcon(parseInt(timeData.hour)),
                priority: 'high',
                data: {
                    peak_hour: parseInt(timeData.hour),
                    activities: parseInt(timeData.activities),
                    xp: parseInt(timeData.total_xp),
                    percentage: percentage
                }
            });
        }

        // 2. Favorite exercise type
        const exerciseQuery = await db.query(`
            SELECT
                action_type,
                COUNT(*) as count,
                SUM(xp_amount) as total_xp
            FROM xp_log
            WHERE user_id = $1
              AND createdat >= NOW() - INTERVAL '${interval}'
            GROUP BY action_type
            HAVING COUNT(*) >= 1
            ORDER BY count DESC
            LIMIT 1
        `, [parseInt(userId)]);

        if (exerciseQuery.rows.length > 0) {
            const exerciseData = exerciseQuery.rows[0];
            insights.push({
                id: 'favorite_exercise',
                type: 'exercise_preference',
                title: `Ваш любимый тип активности - ${getExerciseTitle(exerciseData.action_type)}`,
                description: `Вы выполнили ${exerciseData.count} раз за ${period === 'week' ? 'неделю' : 'месяц'}`,
                icon: '📝',
                priority: 'medium',
                data: {
                    favorite_type: exerciseData.action_type,
                    count: parseInt(exerciseData.count),
                    total_xp: parseInt(exerciseData.total_xp)
                }
            });
        }

        // 3. Progress comparison (current vs previous period)
        let currentPeriod, previousPeriod;
        if (period === 'week') {
            currentPeriod = "DATE_TRUNC('week', NOW())";
            previousPeriod = "DATE_TRUNC('week', NOW() - INTERVAL '1 week')";
        } else {
            currentPeriod = "DATE_TRUNC('month', NOW())";
            previousPeriod = "DATE_TRUNC('month', NOW() - INTERVAL '1 month')";
        }

        const currentXpQuery = await db.query(`
            SELECT SUM(xp_amount) as xp, COUNT(DISTINCT DATE(createdat)) as active_days
            FROM xp_log
            WHERE user_id = $1 AND createdat >= ${currentPeriod}
        `, [parseInt(userId)]);

        const previousXpQuery = await db.query(`
            SELECT SUM(xp_amount) as xp, COUNT(DISTINCT DATE(createdat)) as active_days
            FROM xp_log
            WHERE user_id = $1
              AND createdat >= ${previousPeriod}
              AND createdat < ${currentPeriod}
        `, [parseInt(userId)]);

        const currentXp = parseInt(currentXpQuery.rows[0]?.xp) || 0;
        const previousXp = parseInt(previousXpQuery.rows[0]?.xp) || 0;

        if (previousXp > 0 && currentXp > previousXp) {
            const improvement = Math.round(((currentXp - previousXp) / previousXp) * 100);
            insights.push({
                id: 'progress_acceleration',
                type: 'progress',
                title: `Вы выучили на ${improvement}% больше, чем в прошлом периоде`,
                description: `Текущий XP: ${currentXp} (было ${previousXp})`,
                icon: '🚀',
                priority: 'high',
                data: {
                    improvement_percentage: improvement,
                    current_xp: currentXp,
                    previous_xp: previousXp
                }
            });
        } else if (currentXp > 0) {
            insights.push({
                id: 'keep_going',
                type: 'motivation',
                title: 'Продолжайте в том же духе!',
                description: `Вы заработали ${currentXp} XP за текущий период`,
                icon: '💪',
                priority: 'medium',
                data: {
                    current_xp: currentXp
                }
            });
        }

        // 4. Streak pattern (most productive day of week)
        const dayQuery = await db.query(`
            SELECT
                EXTRACT(DOW FROM createdat) as day_of_week,
                COUNT(*) as activities,
                SUM(xp_amount) as total_xp
            FROM xp_log
            WHERE user_id = $1
              AND createdat >= NOW() - INTERVAL '${interval}'
            GROUP BY day_of_week
            HAVING COUNT(*) >= 1
            ORDER BY total_xp DESC
            LIMIT 1
        `, [parseInt(userId)]);

        if (dayQuery.rows.length > 0) {
            const dayData = dayQuery.rows[0];
            const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            const dayName = dayNames[parseInt(dayData.day_of_week)];

            insights.push({
                id: 'productive_day',
                type: 'streak_pattern',
                title: `${dayName} - ваш самый продуктивный день`,
                description: `${dayData.activities} активностей, ${dayData.total_xp} XP`,
                icon: '📅',
                priority: 'low',
                data: {
                    day_of_week: parseInt(dayData.day_of_week),
                    day_name: dayName,
                    activities: parseInt(dayData.activities),
                    total_xp: parseInt(dayData.total_xp)
                }
            });
        }

        // 5. Total words learned milestone
        const wordsCountQuery = await db.query(`
            SELECT COUNT(*) as total FROM words WHERE user_id = $1
        `, [parseInt(userId)]);

        const totalWords = parseInt(wordsCountQuery.rows[0]?.total) || 0;
        if (totalWords > 0 && (totalWords % 100 === 0 || totalWords === 50 || totalWords === 500)) {
            insights.push({
                id: 'milestone',
                type: 'achievement',
                title: `🎉 Поздравляем! ${totalWords} слов изучено!`,
                description: 'Отличный прогресс на пути к свободному владению языком',
                icon: '🏆',
                priority: 'high',
                data: {
                    total_words: totalWords
                }
            });
        }

        // Sort by priority and limit
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        res.json({
            insights: insights.slice(0, limit),
            generated_at: new Date().toISOString(),
            period: period,
            total_insights: insights.length
        });

    } catch (err) {
        logger.error('Error generating insights:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// LANGUAGE PAIR ENDPOINTS
// ========================================

// Get language pair by ID
app.get('/api/language-pair/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM language_pairs WHERE id = $1',
            [parseInt(id)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Language pair not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error getting language pair:', err);
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
            learned: 0,
            // Detailed review stages
            review_1: 0,
            review_3: 0,
            review_7: 0,
            review_14: 0,
            review_30: 0,
            review_60: 0,
            review_120: 0
        };

        result.rows.forEach(row => {
            if (row.status === 'studying') {
                counts.studying = parseInt(row.count);
            } else if (row.status.startsWith('review_')) {
                // All review statuses (review_1, review_3, review_7, review_14, review_30, review_60, review_120)
                counts.review += parseInt(row.count);
                // Detailed stage counts
                const stage = row.status; // e.g., 'review_7'
                if (counts.hasOwnProperty(stage)) {
                    counts[stage] = parseInt(row.count);
                }
                // Keep backward compatibility with old review7/review30 fields
                if (row.status === 'review_7') {
                    counts.review7 = parseInt(row.count);
                } else if (row.status === 'review_30') {
                    counts.review30 = parseInt(row.count);
                }
            } else if (row.status === 'learned' || row.status === 'mastered') {
                counts.learned += parseInt(row.count);
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
            // Include ALL review stages from SRS intervals: 1, 3, 7, 14, 30, 60, 120 days
            // Also check nextReviewDate to only return words that are due for review
            query = `SELECT * FROM words
                     WHERE status LIKE 'review_%'
                     AND user_id = $1
                     AND language_pair_id = $2
                     AND (nextReviewDate IS NULL OR nextReviewDate <= CURRENT_TIMESTAMP)
                     ORDER BY RANDOM() LIMIT $3`;
            params = [parseInt(userId), parseInt(languagePairId), parseInt(count)];
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

// Get proportionally distributed random words for quiz
app.get('/api/words/random-proportional/:count', async (req, res) => {
    try {
        const { count } = req.params;
        const { userId, languagePairId } = req.query;
        const totalWords = parseInt(count);

        // Get counts for each status
        const countsQuery = `
            SELECT status, COUNT(*) as count
            FROM words
            WHERE user_id = $1 AND language_pair_id = $2
            AND status IN ('studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120')
            GROUP BY status
        `;
        const countsResult = await db.query(countsQuery, [parseInt(userId), parseInt(languagePairId)]);

        // Calculate total available words and proportions
        const statusCounts = {};
        let totalAvailable = 0;

        countsResult.rows.forEach(row => {
            statusCounts[row.status] = parseInt(row.count);
            totalAvailable += parseInt(row.count);
        });

        if (totalAvailable === 0) {
            return res.json([]);
        }

        // Calculate how many words to take from each status proportionally
        const statusAllocations = {};
        let allocatedSoFar = 0;

        for (const [status, count] of Object.entries(statusCounts)) {
            const proportion = count / totalAvailable;
            const allocation = Math.round(proportion * totalWords);
            statusAllocations[status] = Math.min(allocation, count); // Don't allocate more than available
            allocatedSoFar += statusAllocations[status];
        }

        // Adjust if we allocated too few or too many words due to rounding
        const diff = totalWords - allocatedSoFar;
        if (diff !== 0) {
            // Find the status with the most words and adjust it
            const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
            for (const [status, count] of sortedStatuses) {
                if (diff > 0 && statusAllocations[status] < count) {
                    // Need to add more
                    const canAdd = Math.min(diff, count - statusAllocations[status]);
                    statusAllocations[status] += canAdd;
                    break;
                } else if (diff < 0 && statusAllocations[status] > 0) {
                    // Need to remove some
                    const canRemove = Math.min(Math.abs(diff), statusAllocations[status]);
                    statusAllocations[status] -= canRemove;
                    break;
                }
            }
        }

        // Fetch words from each status
        const allWords = [];
        for (const [status, allocation] of Object.entries(statusAllocations)) {
            if (allocation > 0) {
                const wordsQuery = `
                    SELECT * FROM words
                    WHERE status = $1 AND user_id = $2 AND language_pair_id = $3
                    AND (nextReviewDate IS NULL OR nextReviewDate <= CURRENT_TIMESTAMP)
                    ORDER BY RANDOM()
                    LIMIT $4
                `;
                const wordsResult = await db.query(wordsQuery, [status, parseInt(userId), parseInt(languagePairId), allocation]);
                allWords.push(...wordsResult.rows);
            }
        }

        // Final shuffle to mix all statuses
        allWords.sort(() => Math.random() - 0.5);

        res.json(allWords);
    } catch (err) {
        console.error('Proportional random words error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get translation suggestions for a word
app.post('/api/words/translate', async (req, res) => {
    try {
        const { word, sourceLang, targetLang } = req.body;

        if (!word || !sourceLang || !targetLang) {
            return res.status(400).json({ error: 'Word and language codes are required' });
        }

        // For now, return a simple response indicating that external API integration is needed
        // In production, this would call LibreTranslate, Google Translate API, or DeepL API
        const suggestions = [
            {
                translation: `${word} (translation)`,
                context: 'Auto-generated suggestion',
                commonality: 'common',
                examples: [
                    {
                        source: `Example sentence with ${word}`,
                        target: `Пример предложения с ${word}`
                    }
                ]
            }
        ];

        // Simulated response structure for future API integration
        res.json({
            word,
            sourceLang,
            targetLang,
            suggestions,
            note: 'Translation suggestions require external API configuration (LibreTranslate/DeepL/Google Translate)'
        });
    } catch (err) {
        logger.error('Translation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add new word
app.post('/api/words', async (req, res) => {
    try {
        const { word, translation, example, exampleTranslation, userId, languagePairId, isCustom, source, notes, tags } = req.body;

        if (!word || !translation) {
            res.status(400).json({ error: 'Word and translation are required' });
            return;
        }

        if (!userId || !languagePairId) {
            res.status(400).json({ error: 'User and language pair are required' });
            return;
        }

        // Check if word already exists for this user and language pair
        const existingWord = await db.query(
            'SELECT id FROM words WHERE LOWER(word) = LOWER($1) AND user_id = $2 AND language_pair_id = $3',
            [word, userId, languagePairId]
        );

        if (existingWord.rows.length > 0) {
            return res.status(400).json({ error: 'Это слово уже есть в вашем списке' });
        }

        const query = `INSERT INTO words (word, translation, example, exampleTranslation, user_id, language_pair_id, is_custom, source, notes, tags)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`;

        const result = await db.query(query, [
            word,
            translation,
            example || '',
            exampleTranslation || '',
            userId,
            languagePairId,
            isCustom || false,
            source || 'user_added',
            notes || null,
            tags || null
        ]);

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

        logger.info(`🗑️ Deleted ${result.rowCount} words for user ${userId}, language pair ${languagePairId}`);

        res.json({
            message: 'All words deleted successfully',
            deletedCount: result.rowCount
        });
    } catch (err) {
        logger.error('Error deleting words:', err);
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

        // Point system based on question type (XP = points)
        // Multiple choice: 2 points, Word building: 4 points, Typing: 7 points
        // Survival mode: 0 points (excluded by client)
        const pointsMap = {
            'multiple': 2,              // Multiple choice (4 options)
            'multipleChoice': 2,
            'reverse_multiple': 2,
            'reverseMultipleChoice': 2,
            'word_building': 4,         // Word building (assemble from letters)
            'wordBuilding': 4,
            'typing': 7,                // Typing (write the word)
            'complex': 4                // Complex (weighted average)
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

        // Improved Spaced Repetition System (SRS) with Progressive Thresholds
        // Each stage requires reaching a threshold to advance (total 100 points across all stages)
        // Thresholds: 20 → 35 → 50 → 65 → 80 → 90 → 100
        // User only needs to reach the next threshold, not start from 0 each time
        let newStatus = word.status;
        let newReviewCycle = word.reviewcycle || 0;
        let nextReviewDate = null;

        // SRS interval schedule (in days)
        const srsIntervals = [1, 3, 7, 14, 30, 60, 120];

        // Progressive thresholds for each stage (cumulative points needed)
        const stageThresholds = [20, 35, 50, 65, 80, 90, 100];

        // AUTO-PROMOTION FIRST: Check if word has reached higher thresholds
        // This must happen BEFORE regular status checks to properly handle all cases

        // Find the highest threshold reached based on current points
        let targetReviewCycle = -1; // Start at -1 to trigger promotion for studying words at first threshold
        for (let i = stageThresholds.length - 1; i >= 0; i--) {
            if (newCorrectCount >= stageThresholds[i]) {
                targetReviewCycle = i;
                break;
            }
        }

        // Check if we should promote the word to a higher stage
        const shouldPromote = (word.status === "studying" && targetReviewCycle >= 0) || (word.status !== "studying" && targetReviewCycle > newReviewCycle);
        if (shouldPromote) {
            // Auto-promote to higher review cycle
            newReviewCycle = targetReviewCycle;

            if (newCorrectCount >= 100 && newReviewCycle >= srsIntervals.length - 1) {
                // Reached 100 points - mastered!
                newStatus = 'mastered';
                nextReviewDate = null;
                logger.info(`🎉 AUTO-PROMOTION: Word ${id} reached 100 points (from ${word.status})! Promoted to mastered!`);
            } else if (newReviewCycle < srsIntervals.length) {
                // Promote to appropriate review stage
                const intervalDays = srsIntervals[newReviewCycle];
                newStatus = `review_${intervalDays}`;
                nextReviewDate = new Date();
                nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
                logger.info(`🚀 AUTO-PROMOTION: Word ${id} at ${newCorrectCount} points (threshold: ${stageThresholds[newReviewCycle]})! Promoted from ${word.status} to review_${intervalDays} (cycle ${newReviewCycle})`);
            }
        } else {
            // No auto-promotion needed, apply regular logic
            const currentThreshold = stageThresholds[newReviewCycle] || 100;

            if (word.status === 'studying' && newCorrectCount >= currentThreshold) {
                // Reached threshold - move to review phase
                if (newReviewCycle < srsIntervals.length - 1) {
                    const intervalDays = srsIntervals[newReviewCycle];
                    newStatus = `review_${intervalDays}`;
                    nextReviewDate = new Date();
                    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
                    logger.info(`📅 Word ${id} reached ${newCorrectCount} points (threshold: ${currentThreshold})! Review in ${intervalDays} days`);
                } else if (newReviewCycle === srsIntervals.length - 1 && newCorrectCount >= 100) {
                    // Last stage completed with 100 points
                    newStatus = 'mastered';
                    logger.info(`🎉 Word ${id} fully mastered with 100 points after ${newReviewCycle + 1} cycles!`);
                }
            } else if (!correct && word.status.startsWith('review_')) {
                // Failed review during waiting period - back to studying mode, keep points
                newStatus = 'studying';
                nextReviewDate = null;
                logger.info(`❌ Word ${id} failed review (cycle ${newReviewCycle + 1}, ${newCorrectCount} points), back to studying`);
            } else if (word.status.startsWith('review_') && correct && newCorrectCount >= currentThreshold) {
                // Successfully reviewed - advance to next cycle
                newReviewCycle++;

                // Check if word has already reached the next threshold
                const nextThreshold = stageThresholds[newReviewCycle] || 100;

                if (newCorrectCount >= nextThreshold && newReviewCycle < srsIntervals.length) {
                    // Already reached next threshold - move directly to next review stage
                    const intervalDays = srsIntervals[newReviewCycle];
                    newStatus = `review_${intervalDays}`;
                    nextReviewDate = new Date();
                    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
                    logger.info(`✅ Word ${id} review completed! Already at ${newCorrectCount} points (threshold: ${nextThreshold}), moving to review_${intervalDays}`);
                } else if (newReviewCycle >= srsIntervals.length - 1 && newCorrectCount >= 100) {
                    // Reached final stage with 100 points
                    newStatus = 'mastered';
                    logger.info(`🎉 Word ${id} fully mastered with 100 points!`);
                } else {
                    // Below next threshold - back to studying
                    newStatus = 'studying';
                    nextReviewDate = null;
                    logger.info(`✅ Word ${id} review completed! Advancing to cycle ${newReviewCycle + 1}, back to studying`);
                }
            }
        }

        const updateQuery = `UPDATE words
                            SET correctCount = $1, totalPoints = $2, status = $3, reviewCycle = $4,
                                lastReviewDate = CURRENT_TIMESTAMP,
                                nextReviewDate = $5,
                                updatedAt = CURRENT_TIMESTAMP
                            WHERE id = $6`;

        await db.query(updateQuery, [newCorrectCount, newTotalPoints, newStatus, newReviewCycle, nextReviewDate, id]);

        logger.info(`📊 Word ${id} progress: ${newCorrectCount}/${newTotalPoints} points (${percentage}%) - Status: ${newStatus}, Cycle: ${newReviewCycle}`);

        // Gamification: Award XP for quiz answers (XP = points earned)
        const userId = word.user_id;
        let xpEarned = 0;
        let xpResult = null;

        if (correct) {
            // Award XP equal to points earned (same as pointsMap above)
            const xpMap = {
                'multiple': 2,              // Same as points
                'multipleChoice': 2,
                'reverse_multiple': 2,
                'reverseMultipleChoice': 2,
                'word_building': 4,         // Same as points
                'wordBuilding': 4,
                'typing': 7,                // Same as points
                'complex': 4
            };

            xpEarned = xpMap[questionType] || 2;

            // Bonus XP for mastering a word (reaching mastered status)
            if (newStatus === 'mastered' && word.status !== 'mastered') {
                xpEarned += 50; // Bonus XP for fully mastering a word (100 points)
                xpResult = await awardXP(userId, 'word_learned', xpEarned, `Learned: ${word.word}`);
            } else {
                xpResult = await awardXP(userId, 'quiz_answer', xpEarned, `${questionType}: ${word.word}`);
            }

            // Check if word advanced to next stage (for daily goal tracking)
            let wordsAdvanced = 0;
            const oldReviewCycle = word.reviewCycle || 0;

            // Count as "word learned" for daily goal if:
            // 1. Word moved from studying to review stage
            // 2. Word advanced to a higher review cycle
            // 3. Word became mastered
            if (newStatus === 'mastered' && word.status !== 'mastered') {
                wordsAdvanced = 1;
            } else if (word.status === 'studying' && newStatus.startsWith('review_')) {
                wordsAdvanced = 1;
            } else if (word.status.startsWith('review_') && newReviewCycle > oldReviewCycle) {
                wordsAdvanced = 1;
            }

            // Update daily activity
            await updateDailyActivity(userId, wordsAdvanced, 1, xpEarned);

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
                // xp: xpResult, // XP notifications disabled
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
        logger.error('Error updating word progress:', err);
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
        logger.error('Error deleting word:', err);
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

        const validStatuses = ['studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120', 'learned'];
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
        logger.error('Error updating word status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Manual advance word to next review stage (respects SRS intervals)
app.put('/api/words/:id/manual-advance', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewCycle } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120', 'learned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Calculate nextReviewDate based on status
        let nextReviewDate = null;
        if (status.startsWith('review_')) {
            const days = parseInt(status.replace('review_', ''));
            nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + days);
        }

        // Calculate correct points based on review cycle (progressive thresholds)
        const stageThresholds = [20, 35, 50, 65, 80, 90, 100];
        let correctCount = 0;

        if (status === 'studying') {
            // Reset to 0 if moving back to studying
            correctCount = 0;
        } else if (status === 'learned' || status === 'mastered') {
            // Set to 100 if fully learned/mastered
            correctCount = 100;
        } else if (reviewCycle !== undefined && reviewCycle >= 0 && reviewCycle < stageThresholds.length) {
            // Set to threshold for the current cycle
            correctCount = stageThresholds[reviewCycle];
        } else {
            // Default to threshold based on status
            const cycleFromStatus = {
                'review_1': 0,
                'review_3': 1,
                'review_7': 2,
                'review_14': 3,
                'review_30': 4,
                'review_60': 5,
                'review_120': 6
            };
            const cycle = cycleFromStatus[status] || 0;
            correctCount = stageThresholds[cycle];
        }

        // Update status, reviewCycle, correctCount, and nextReviewDate
        const result = await db.query(
            `UPDATE words
             SET status = $1,
                 reviewCycle = $2,
                 correctCount = $3,
                 nextReviewDate = $4,
                 updatedAt = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [status, reviewCycle, correctCount, nextReviewDate, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Word not found' });
        }

        logger.info(`🔧 Manual advance: Word ${id} → ${status} (cycle ${reviewCycle}, ${correctCount} points), nextReview: ${nextReviewDate}`);
        res.json({ message: 'Word advanced successfully', status, reviewCycle, correctCount, nextReviewDate });
    } catch (err) {
        logger.error('Error manually advancing word:', err);
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
             AND status LIKE 'review_%'
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

        // Reset each expired word: status → studying, cycle++, reset points to 0
        for (const word of expiredWords.rows) {
            const newCycle = (word.reviewcycle || 0) + 1;
            await db.query(
                `UPDATE words
                 SET status = 'studying',
                     reviewCycle = $1,
                     correctCount = 0,
                     totalPoints = 100,
                     nextReviewDate = NULL,
                     updatedAt = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [newCycle, word.id]
            );
            logger.info(`⏰ Word "${word.word}" (${word.status}) expired - moved to studying cycle ${newCycle} (0/100 pts)`);
        }

        res.json({
            message: `${expiredWords.rows.length} words returned to studying for next review cycle`,
            expiredCount: expiredWords.rows.length,
            words: expiredWords.rows.map(w => ({ id: w.id, word: w.word, previousStatus: w.status, newCycle: (w.reviewcycle || 1) + 1 }))
        });
    } catch (err) {
        logger.error('Error checking expired reviews:', err);
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

        logger.info(`🔄 Reset ${result.rowCount} words to studying status (progress cleared) for user ${userId}, language pair ${languagePairId}`);

        res.json({
            message: 'All words reset to studying status with progress cleared',
            updatedCount: result.rowCount
        });
    } catch (err) {
        logger.error('Error resetting words to studying:', err);
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
            const totalPoints = parseInt(row['Total Points'] || row['Опыт'] || row.totalPoints || row['XP'] || '0') || 0;

            if (word && translation) {
                words.push({
                    word: word.trim(),
                    translation: translation.trim(),
                    example: example.trim(),
                    exampleTranslation: exampleTranslation.trim(),
                    totalPoints: totalPoints
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
                        `INSERT INTO words (word, translation, example, exampleTranslation, totalPoints)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [
                            wordObj.word,
                            wordObj.translation,
                            wordObj.example,
                            wordObj.exampleTranslation,
                            wordObj.totalPoints || 0
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
                        logger.info(`📍 Following redirect to: ${response.headers.location}`);
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
        logger.info(`📄 CSV Data (first 500 chars):`, csvData.substring(0, 500));

        // Parse CSV data using csv-parser
        const words = [];
        const stream = Readable.from([csvData]);

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    logger.info('🔍 Raw row:', row);
                    logger.info('🔑 Row keys:', Object.keys(row));

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
                        logger.info('📊 Trying column index fallback, values:', values);
                        word = word || values[0];              // Foreign word
                        example = example || values[1] || '';  // Foreign example sentence
                        translation = translation || values[2]; // Native translation
                        exampleTranslation = exampleTranslation || values[3] || ''; // Native example translation
                    }

                    logger.info('📝 Parsed:', { word, translation, example, exampleTranslation });

                    if (word && translation) {
                        words.push({
                            word: String(word).trim(),
                            translation: String(translation).trim(),
                            example: example ? String(example).trim() : '',
                            exampleTranslation: exampleTranslation ? String(exampleTranslation).trim() : ''
                        });
                    } else {
                        logger.info('⚠️ Skipped row - missing word or translation');
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        logger.info(`📊 Parsed ${words.length} words from Google Sheets`);
        res.json({ words });
    } catch (error) {
        logger.error('Google Sheets import error:', error);
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
        logger.error('Migration error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Level Features: Get all features with unlock requirements
app.get('/api/levels/features', async (req, res) => {
    try {
        const features = await db.query(`
            SELECT level_required, feature_key, feature_name, feature_description, feature_category, icon
            FROM level_features
            ORDER BY level_required ASC
        `);

        res.json({ features: features.rows });
    } catch (err) {
        logger.error('Error getting level features:', err);
        res.status(500).json({ error: err.message });
    }
});

// Level Features: Get unlocked and locked features for a user
app.get('/api/users/:userId/unlocked-features', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user level
        const userStats = await db.query('SELECT level FROM user_stats WHERE user_id = $1', [parseInt(userId)]);
        if (!userStats.rows.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentLevel = userStats.rows[0].level || 1;

        // Get all features
        const allFeatures = await db.query(`
            SELECT level_required, feature_key, feature_name, feature_description, feature_category, icon
            FROM level_features
            ORDER BY level_required ASC
        `);

        const unlocked = [];
        const locked = [];

        for (const f of allFeatures.rows) {
            if (currentLevel >= f.level_required) {
                unlocked.push({
                    feature_key: f.feature_key,
                    feature_name: f.feature_name,
                    feature_description: f.feature_description,
                    feature_category: f.feature_category,
                    icon: f.icon,
                    unlocked_at_level: f.level_required
                });
            } else {
                locked.push({
                    feature_key: f.feature_key,
                    feature_name: f.feature_name,
                    feature_description: f.feature_description,
                    feature_category: f.feature_category,
                    icon: f.icon,
                    unlocks_at_level: f.level_required,
                    levels_remaining: f.level_required - currentLevel
                });
            }
        }

        res.json({
            current_level: currentLevel,
            unlocked_features: unlocked,
            locked_features: locked
        });
    } catch (err) {
        logger.error('Error getting user unlocked features:', err);
        res.status(500).json({ error: err.message });
    }
});

// Level Features: Check if user can use a specific feature
app.get('/api/users/:userId/can-use-feature/:featureKey', async (req, res) => {
    try {
        const { userId, featureKey } = req.params;

        const access = await checkFeatureAccess(userId, featureKey);

        if (access.error) {
            return res.status(404).json({ error: access.error });
        }

        res.json({
            can_use: access.hasAccess,
            feature_key: featureKey,
            feature_name: access.featureName || null,
            current_level: access.currentLevel,
            required_level: access.requiredLevel,
            levels_remaining: access.levelsRemaining
        });
    } catch (err) {
        logger.error('Error checking feature access:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// SPACED REPETITION SYSTEM (SRS) ENDPOINTS
// ========================================

// Get words due for review
app.get('/api/srs/:userId/due-words', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, include_new = 'true' } = req.query;

        const now = new Date();

        // Get words that are due for review
        const dueWords = await db.query(`
            SELECT
                w.id as word_id,
                w.word,
                w.translation,
                w.languagepairid,
                srs.easiness_factor,
                srs.interval_days,
                srs.repetitions,
                srs.next_review_date,
                srs.last_review_date,
                srs.last_quality_rating,
                srs.total_reviews,
                srs.mature,
                CASE
                    WHEN srs.next_review_date < $1 THEN 'overdue'
                    WHEN srs.next_review_date::DATE = $1::DATE THEN 'due_today'
                    ELSE 'future'
                END as due_status
            FROM word_srs_data srs
            INNER JOIN words w ON srs.word_id = w.id
            WHERE srs.user_id = $2
              AND srs.suspended = false
              AND srs.next_review_date <= $1
            ORDER BY
                CASE
                    WHEN srs.next_review_date < $1 THEN 1
                    ELSE 2
                END,
                srs.next_review_date ASC
            LIMIT $3
        `, [now, parseInt(userId), parseInt(limit)]);

        let newWords = [];

        // If include_new is true and we haven't reached limit, get new words
        if (include_new === 'true' && dueWords.rows.length < parseInt(limit)) {
            const remaining = parseInt(limit) - dueWords.rows.length;

            newWords = await db.query(`
                SELECT
                    w.id as word_id,
                    w.word,
                    w.translation,
                    w.languagepairid,
                    2.5 as easiness_factor,
                    1 as interval_days,
                    0 as repetitions,
                    NULL as next_review_date,
                    NULL as last_review_date,
                    NULL as last_quality_rating,
                    0 as total_reviews,
                    false as mature,
                    'new' as due_status
                FROM words w
                WHERE w.user_id = $1
                  AND w.id NOT IN (
                      SELECT word_id FROM word_srs_data WHERE user_id = $1
                  )
                LIMIT $2
            `, [parseInt(userId), remaining]);
        }

        const allWords = [...dueWords.rows, ...newWords.rows];

        // Get counts
        const counts = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE srs.next_review_date < $1) as overdue,
                COUNT(*) FILTER (WHERE srs.next_review_date::DATE = $1::DATE) as due_today,
                COUNT(*) FILTER (WHERE srs.mature = true) as mature_cards,
                (SELECT COUNT(*) FROM words WHERE user_id = $2 AND id NOT IN (
                    SELECT word_id FROM word_srs_data WHERE user_id = $2
                )) as new_words
            FROM word_srs_data srs
            WHERE srs.user_id = $2 AND srs.suspended = false
        `, [now, parseInt(userId)]);

        res.json({
            words: allWords,
            total_returned: allWords.length,
            statistics: counts.rows[0] || { overdue: 0, due_today: 0, mature_cards: 0, new_words: 0 }
        });
    } catch (err) {
        logger.error('Error getting due words:', err);
        res.status(500).json({ error: err.message });
    }
});

// Submit review for a word (SM-2 algorithm)
app.post('/api/srs/:userId/review', async (req, res) => {
    try {
        const { userId } = req.params;
        const { wordId, qualityRating, timeTaken } = req.body;

        // Validate quality rating (0-5)
        if (qualityRating < 0 || qualityRating > 5) {
            return res.status(400).json({ error: 'Quality rating must be between 0 and 5' });
        }

        const now = new Date();

        // Get current SRS data or create new entry
        let srsData = await db.query(
            'SELECT * FROM word_srs_data WHERE word_id = $1 AND user_id = $2',
            [parseInt(wordId), parseInt(userId)]
        );

        let currentEF, currentInterval, currentReps, previousEF, previousInterval;
        let isNew = false;

        if (srsData.rows.length === 0) {
            // New word - initialize with defaults
            currentEF = 2.5;
            currentInterval = 1;
            currentReps = 0;
            isNew = true;
            previousEF = null;
            previousInterval = null;
        } else {
            // Existing word
            const data = srsData.rows[0];
            currentEF = parseFloat(data.easiness_factor);
            currentInterval = data.interval_days;
            currentReps = data.repetitions;
            previousEF = currentEF;
            previousInterval = currentInterval;
        }

        // Get user's learning profile for interval modifier
        const learningProfile = await db.query(
            'SELECT preferred_interval_modifier FROM user_learning_profile WHERE user_id = $1',
            [parseInt(userId)]
        );

        const intervalModifier = learningProfile.rows.length > 0 && learningProfile.rows[0].preferred_interval_modifier
            ? parseFloat(learningProfile.rows[0].preferred_interval_modifier)
            : 1.0; // Default to 1.0 if no profile

        // SM-2 Algorithm Calculation
        let newEF = currentEF;
        let newInterval = currentInterval;
        let newReps = currentReps;

        // Update Easiness Factor
        newEF = currentEF + (0.1 - (5 - qualityRating) * (0.08 + (5 - qualityRating) * 0.02));
        if (newEF < 1.3) newEF = 1.3; // Minimum EF

        // Update interval based on quality
        if (qualityRating < 3) {
            // Incorrect answer - restart
            newReps = 0;
            newInterval = 1;
        } else {
            // Correct answer - progress
            if (currentReps === 0) {
                newInterval = 1;
            } else if (currentReps === 1) {
                newInterval = 6;
            } else {
                // Apply personalized interval modifier
                newInterval = Math.round(currentInterval * newEF * intervalModifier);

                // Ensure minimum interval of 1 day
                if (newInterval < 1) newInterval = 1;
            }
            newReps = currentReps + 1;
        }

        // Calculate next review date
        const nextReviewDate = new Date(now);
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        // Check if card is mature (interval > 21 days)
        const isMature = newInterval > 21;

        // Determine review type
        let reviewType = 'review';
        if (isNew) {
            reviewType = 'learn';
        } else if (qualityRating < 3 && currentReps > 0) {
            reviewType = 'relearn';
        }

        // Insert or update SRS data
        if (isNew) {
            await db.query(`
                INSERT INTO word_srs_data (
                    word_id, user_id, easiness_factor, interval_days, repetitions,
                    next_review_date, last_review_date, last_quality_rating,
                    total_reviews, mature, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $10)
            `, [
                parseInt(wordId), parseInt(userId), newEF, newInterval, newReps,
                nextReviewDate, now, qualityRating, isMature, now
            ]);
        } else {
            await db.query(`
                UPDATE word_srs_data
                SET easiness_factor = $1,
                    interval_days = $2,
                    repetitions = $3,
                    next_review_date = $4,
                    last_review_date = $5,
                    last_quality_rating = $6,
                    total_reviews = total_reviews + 1,
                    mature = $7,
                    updated_at = $8
                WHERE word_id = $9 AND user_id = $10
            `, [
                newEF, newInterval, newReps, nextReviewDate, now,
                qualityRating, isMature, now, parseInt(wordId), parseInt(userId)
            ]);
        }

        // Log the review
        await db.query(`
            INSERT INTO srs_review_log (
                word_id, user_id, review_date, quality_rating, time_taken_ms,
                previous_interval, new_interval, previous_ef, new_ef, review_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            parseInt(wordId), parseInt(userId), now, qualityRating, timeTaken || null,
            previousInterval, newInterval, previousEF, newEF, reviewType
        ]);

        // Award XP based on quality rating (×3 multiplier applied)
        const xpMap = {
            5: 15, // Perfect recall
            4: 12, // Correct with hesitation
            3: 9,  // Correct but difficult
            2: 3,  // Incorrect but recalled
            1: 0,  // Incorrect
            0: 0   // Complete blackout
        };

        let xpEarned = xpMap[qualityRating] || 0;

        // Bonus for mature cards (×1.5)
        if (isMature && qualityRating >= 3) {
            xpEarned = Math.round(xpEarned * 1.5);
        }

        // Award XP if earned
        let xpResult = null;
        if (xpEarned > 0) {
            xpResult = await awardXP(parseInt(userId), 'srs_review', xpEarned, `Reviewed word`);
        }

        res.json({
            success: true,
            review_type: reviewType,
            xp_earned: xpEarned,
            srs_data: {
                easiness_factor: newEF,
                interval_days: newInterval,
                repetitions: newReps,
                next_review_date: nextReviewDate,
                is_mature: isMature
            },
            personalization: {
                interval_modifier_applied: intervalModifier,
                is_personalized: intervalModifier !== 1.0
            },
            xp_result: xpResult
        });
    } catch (err) {
        logger.error('Error submitting review:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📦 Batch review multiple words
app.post('/api/srs/:userId/batch-review', async (req, res) => {
    try {
        const { userId } = req.params;
        const { reviews } = req.body; // Array of { wordId, qualityRating, timeTaken }

        if (!Array.isArray(reviews) || reviews.length === 0) {
            return res.status(400).json({ error: 'reviews must be a non-empty array' });
        }

        if (reviews.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 reviews per batch' });
        }

        // Validate all reviews
        for (const review of reviews) {
            if (!review.wordId || review.qualityRating === undefined) {
                return res.status(400).json({
                    error: 'Each review must have wordId and qualityRating'
                });
            }
            if (review.qualityRating < 0 || review.qualityRating > 5) {
                return res.status(400).json({
                    error: `Quality rating must be 0-5, got ${review.qualityRating} for word ${review.wordId}`
                });
            }
        }

        // Get user's learning profile once for all reviews
        const learningProfile = await db.query(
            'SELECT preferred_interval_modifier FROM user_learning_profile WHERE user_id = $1',
            [parseInt(userId)]
        );

        const intervalModifier = learningProfile.rows.length > 0
            && learningProfile.rows[0].preferred_interval_modifier
            ? parseFloat(learningProfile.rows[0].preferred_interval_modifier)
            : 1.0;

        const results = [];
        let totalXP = 0;
        let successCount = 0;
        let errorCount = 0;

        // Process each review
        for (const review of reviews) {
            try {
                const { wordId, qualityRating, timeTaken } = review;
                const now = new Date();

                // Get current SRS data
                let srsData = await db.query(
                    'SELECT * FROM word_srs_data WHERE word_id = $1 AND user_id = $2',
                    [parseInt(wordId), parseInt(userId)]
                );

                let currentEF, currentInterval, currentReps, previousEF, previousInterval;
                let isNew = false;

                if (srsData.rows.length === 0) {
                    currentEF = 2.5;
                    currentInterval = 1;
                    currentReps = 0;
                    isNew = true;
                    previousEF = null;
                    previousInterval = null;
                } else {
                    const data = srsData.rows[0];
                    currentEF = parseFloat(data.easiness_factor);
                    currentInterval = data.interval_days;
                    currentReps = data.repetitions;
                    previousEF = currentEF;
                    previousInterval = currentInterval;
                }

                // SM-2 Algorithm
                let newEF = currentEF + (0.1 - (5 - qualityRating) * (0.08 + (5 - qualityRating) * 0.02));
                if (newEF < 1.3) newEF = 1.3;

                let newInterval, newReps;

                if (qualityRating < 3) {
                    newReps = 0;
                    newInterval = 1;
                } else {
                    if (currentReps === 0) {
                        newInterval = 1;
                    } else if (currentReps === 1) {
                        newInterval = 6;
                    } else {
                        newInterval = Math.round(currentInterval * newEF * intervalModifier);
                        if (newInterval < 1) newInterval = 1;
                    }
                    newReps = currentReps + 1;
                }

                const nextReviewDate = new Date(now);
                nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

                const isMature = newInterval > 21;

                let reviewType = 'review';
                if (isNew) {
                    reviewType = 'learn';
                } else if (qualityRating < 3 && currentReps > 0) {
                    reviewType = 'relearn';
                }

                // Update or insert SRS data
                if (isNew) {
                    await db.query(`
                        INSERT INTO word_srs_data (
                            word_id, user_id, easiness_factor, interval_days, repetitions,
                            next_review_date, last_review_date, last_quality_rating,
                            total_reviews, mature, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $10)
                    `, [
                        parseInt(wordId), parseInt(userId), newEF, newInterval, newReps,
                        nextReviewDate, now, qualityRating, isMature, now
                    ]);
                } else {
                    await db.query(`
                        UPDATE word_srs_data
                        SET easiness_factor = $1,
                            interval_days = $2,
                            repetitions = $3,
                            next_review_date = $4,
                            last_review_date = $5,
                            last_quality_rating = $6,
                            total_reviews = total_reviews + 1,
                            mature = $7,
                            updated_at = $8
                        WHERE word_id = $9 AND user_id = $10
                    `, [
                        newEF, newInterval, newReps, nextReviewDate, now,
                        qualityRating, isMature, now, parseInt(wordId), parseInt(userId)
                    ]);
                }

                // Log review
                await db.query(`
                    INSERT INTO srs_review_log (
                        word_id, user_id, review_date, quality_rating, time_taken_ms,
                        previous_interval, new_interval, previous_ef, new_ef, review_type
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    parseInt(wordId), parseInt(userId), now, qualityRating, timeTaken || null,
                    previousInterval, newInterval, previousEF, newEF, reviewType
                ]);

                // Calculate XP
                const xpMap = { 5: 15, 4: 12, 3: 9, 2: 3, 1: 0, 0: 0 };
                let xpEarned = xpMap[qualityRating] || 0;

                if (isMature && qualityRating >= 3) {
                    xpEarned = Math.round(xpEarned * 1.5);
                }

                totalXP += xpEarned;

                results.push({
                    word_id: parseInt(wordId),
                    success: true,
                    review_type: reviewType,
                    xp_earned: xpEarned,
                    srs_data: {
                        easiness_factor: newEF,
                        interval_days: newInterval,
                        repetitions: newReps,
                        next_review_date: nextReviewDate,
                        is_mature: isMature
                    }
                });

                successCount++;

            } catch (reviewErr) {
                logger.error(`Error processing review for word ${review.wordId}:`, reviewErr);
                results.push({
                    word_id: parseInt(review.wordId),
                    success: false,
                    error: reviewErr.message
                });
                errorCount++;
            }
        }

        // Award total XP once
        let xpResult = null;
        if (totalXP > 0) {
            xpResult = await awardXP(parseInt(userId), 'batch_srs_review', totalXP, `Batch reviewed ${successCount} words`);
        }

        res.json({
            success: true,
            total_reviews: reviews.length,
            successful: successCount,
            failed: errorCount,
            total_xp_earned: totalXP,
            interval_modifier_applied: intervalModifier,
            results,
            xp_result: xpResult
        });

    } catch (err) {
        logger.error('Error in batch review:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get SRS statistics for user
app.get('/api/srs/:userId/statistics', async (req, res) => {
    try {
        const { userId } = req.params;
        const { period = 30 } = req.query; // days

        const now = new Date();

        // Get card counts
        const cardCounts = await db.query(`
            SELECT
                COUNT(*) as total_cards,
                COUNT(*) FILTER (WHERE next_review_date < $1) as overdue,
                COUNT(*) FILTER (WHERE next_review_date::DATE = $1::DATE) as due_today,
                COUNT(*) FILTER (WHERE mature = true) as mature_cards,
                COUNT(*) FILTER (WHERE suspended = true) as suspended_cards,
                AVG(easiness_factor)::NUMERIC(3,2) as average_ease,
                AVG(interval_days)::INTEGER as average_interval
            FROM word_srs_data
            WHERE user_id = $2
        `, [now, parseInt(userId)]);

        // Get new words count
        const newWordsResult = await db.query(`
            SELECT COUNT(*) as new_words
            FROM words
            WHERE user_id = $1
              AND id NOT IN (SELECT word_id FROM word_srs_data WHERE user_id = $1)
        `, [parseInt(userId)]);

        // Get retention rate (last N days)
        const periodDate = new Date(now);
        periodDate.setDate(periodDate.getDate() - parseInt(period));

        const retentionData = await db.query(`
            SELECT
                COUNT(*) as total_reviews,
                COUNT(*) FILTER (WHERE quality_rating >= 3) as correct_reviews,
                CASE
                    WHEN COUNT(*) > 0 THEN
                        ROUND((COUNT(*) FILTER (WHERE quality_rating >= 3)::NUMERIC / COUNT(*)) * 100, 1)
                    ELSE 0
                END as retention_rate
            FROM srs_review_log
            WHERE user_id = $1 AND review_date >= $2
        `, [parseInt(userId), periodDate]);

        // Get 7-day forecast (upcoming due cards)
        const forecast = [];
        for (let i = 0; i < 7; i++) {
            const forecastDate = new Date(now);
            forecastDate.setDate(forecastDate.getDate() + i);
            const nextDate = new Date(forecastDate);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayCount = await db.query(`
                SELECT COUNT(*) as due_count
                FROM word_srs_data
                WHERE user_id = $1
                  AND suspended = false
                  AND next_review_date >= $2
                  AND next_review_date < $3
            `, [parseInt(userId), forecastDate, nextDate]);

            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                due_count: parseInt(dayCount.rows[0].due_count)
            });
        }

        // Get review activity (last 30 days)
        const activityData = await db.query(`
            SELECT
                DATE(review_date) as review_day,
                COUNT(*) as review_count,
                AVG(quality_rating)::NUMERIC(3,1) as avg_quality
            FROM srs_review_log
            WHERE user_id = $1 AND review_date >= $2
            GROUP BY DATE(review_date)
            ORDER BY review_day DESC
            LIMIT 30
        `, [parseInt(userId), periodDate]);

        // Get interval distribution
        const intervalDist = await db.query(`
            SELECT
                CASE
                    WHEN interval_days = 1 THEN '1 day'
                    WHEN interval_days <= 7 THEN '2-7 days'
                    WHEN interval_days <= 21 THEN '8-21 days'
                    WHEN interval_days <= 60 THEN '22-60 days'
                    WHEN interval_days <= 180 THEN '61-180 days'
                    ELSE '180+ days'
                END as interval_range,
                COUNT(*) as card_count
            FROM word_srs_data
            WHERE user_id = $1 AND suspended = false
            GROUP BY interval_range
            ORDER BY MIN(interval_days)
        `, [parseInt(userId)]);

        res.json({
            cards: {
                total: parseInt(cardCounts.rows[0].total_cards) || 0,
                overdue: parseInt(cardCounts.rows[0].overdue) || 0,
                due_today: parseInt(cardCounts.rows[0].due_today) || 0,
                mature: parseInt(cardCounts.rows[0].mature_cards) || 0,
                suspended: parseInt(cardCounts.rows[0].suspended_cards) || 0,
                new_words: parseInt(newWordsResult.rows[0].new_words) || 0
            },
            statistics: {
                average_ease: parseFloat(cardCounts.rows[0].average_ease) || 2.5,
                average_interval: parseInt(cardCounts.rows[0].average_interval) || 0,
                retention_rate: parseFloat(retentionData.rows[0].retention_rate) || 0,
                total_reviews_period: parseInt(retentionData.rows[0].total_reviews) || 0,
                correct_reviews_period: parseInt(retentionData.rows[0].correct_reviews) || 0
            },
            forecast: forecast,
            recent_activity: activityData.rows,
            interval_distribution: intervalDist.rows,
            period_days: parseInt(period)
        });
    } catch (err) {
        logger.error('Error getting SRS statistics:', err);
        res.status(500).json({ error: err.message });
    }
});

// Suspend or resume a word
app.put('/api/srs/:userId/word/:wordId/suspend', async (req, res) => {
    try {
        const { userId, wordId } = req.params;
        const { suspend = true } = req.body;

        // Check if word exists in SRS
        const srsData = await db.query(
            'SELECT * FROM word_srs_data WHERE word_id = $1 AND user_id = $2',
            [parseInt(wordId), parseInt(userId)]
        );

        if (srsData.rows.length === 0) {
            return res.status(404).json({ error: 'Word not found in SRS system' });
        }

        // Update suspended status
        await db.query(
            'UPDATE word_srs_data SET suspended = $1, updated_at = NOW() WHERE word_id = $2 AND user_id = $3',
            [suspend, parseInt(wordId), parseInt(userId)]
        );

        res.json({
            success: true,
            word_id: parseInt(wordId),
            suspended: suspend,
            message: suspend ? 'Word suspended from reviews' : 'Word resumed for reviews'
        });
    } catch (err) {
        logger.error('Error suspending/resuming word:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reset SRS progress for a word
app.post('/api/srs/:userId/reset-word/:wordId', async (req, res) => {
    try {
        const { userId, wordId } = req.params;

        // Check if word exists in SRS
        const srsData = await db.query(
            'SELECT * FROM word_srs_data WHERE word_id = $1 AND user_id = $2',
            [parseInt(wordId), parseInt(userId)]
        );

        if (srsData.rows.length === 0) {
            return res.status(404).json({ error: 'Word not found in SRS system' });
        }

        // Reset to default values
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + 1); // Tomorrow

        await db.query(`
            UPDATE word_srs_data
            SET easiness_factor = 2.5,
                interval_days = 1,
                repetitions = 0,
                next_review_date = $1,
                last_review_date = NULL,
                last_quality_rating = NULL,
                total_reviews = 0,
                mature = false,
                suspended = false,
                updated_at = NOW()
            WHERE word_id = $2 AND user_id = $3
        `, [nextReviewDate, parseInt(wordId), parseInt(userId)]);

        res.json({
            success: true,
            word_id: parseInt(wordId),
            message: 'Word SRS progress reset to defaults',
            reset_data: {
                easiness_factor: 2.5,
                interval_days: 1,
                repetitions: 0,
                next_review_date: nextReviewDate
            }
        });
    } catch (err) {
        logger.error('Error resetting word:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// PERSONAL RATING SYSTEM ENDPOINTS
// ========================================

// Get personal rating (weekly/monthly XP history)
app.get('/api/rating/:userId/personal', async (req, res) => {
    try {
        const { userId } = req.params;
        const { period = 'weekly' } = req.query; // weekly or monthly

        const now = new Date();
        let startDate;
        let groupFormat;
        let periodCount;

        if (period === 'weekly') {
            // Last 12 weeks
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - (12 * 7));
            groupFormat = 'YYYY-IW'; // ISO week format
            periodCount = 12;
        } else {
            // Last 12 months
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 12);
            groupFormat = 'YYYY-MM';
            periodCount = 12;
        }

        // Get XP history grouped by period
        const xpHistory = await db.query(`
            SELECT
                TO_CHAR(createdat, $1) as period,
                SUM(xp_amount) as total_xp,
                COUNT(*) as activity_count,
                MIN(createdat) as period_start,
                MAX(createdat) as period_end
            FROM xp_history
            WHERE user_id = $2 AND createdat >= $3
            GROUP BY TO_CHAR(createdat, $1)
            ORDER BY period ASC
        `, [groupFormat, parseInt(userId), startDate]);

        // Calculate statistics
        const totalXP = xpHistory.rows.reduce((sum, row) => sum + parseInt(row.total_xp), 0);
        const avgXPPerPeriod = xpHistory.rows.length > 0 ? Math.round(totalXP / xpHistory.rows.length) : 0;
        const maxXPPeriod = xpHistory.rows.length > 0
            ? Math.max(...xpHistory.rows.map(r => parseInt(r.total_xp)))
            : 0;

        // Find best period
        let bestPeriod = null;
        if (xpHistory.rows.length > 0) {
            const best = xpHistory.rows.reduce((prev, curr) =>
                parseInt(curr.total_xp) > parseInt(prev.total_xp) ? curr : prev
            );
            bestPeriod = {
                period: best.period,
                xp: parseInt(best.total_xp),
                activities: parseInt(best.activity_count)
            };
        }

        // Calculate current period XP
        let currentPeriodStart;
        if (period === 'weekly') {
            // Start of current week (Monday)
            currentPeriodStart = new Date(now);
            const day = currentPeriodStart.getDay();
            const diff = currentPeriodStart.getDate() - day + (day === 0 ? -6 : 1);
            currentPeriodStart.setDate(diff);
            currentPeriodStart.setHours(0, 0, 0, 0);
        } else {
            // Start of current month
            currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const currentPeriodXP = await db.query(`
            SELECT COALESCE(SUM(xp_amount), 0) as current_xp
            FROM xp_history
            WHERE user_id = $1 AND createdat >= $2
        `, [parseInt(userId), currentPeriodStart]);

        // Get user's current stats
        const userStats = await db.query('SELECT total_xp, level FROM user_stats WHERE user_id = $1', [parseInt(userId)]);

        res.json({
            period_type: period,
            periods_shown: periodCount,
            history: xpHistory.rows.map(row => ({
                period: row.period,
                total_xp: parseInt(row.total_xp),
                activity_count: parseInt(row.activity_count),
                period_start: row.period_start,
                period_end: row.period_end
            })),
            statistics: {
                total_xp_all_time: userStats.rows.length > 0 ? userStats.rows[0].total_xp : 0,
                current_level: userStats.rows.length > 0 ? userStats.rows[0].level : 1,
                total_xp_period_range: totalXP,
                avg_xp_per_period: avgXPPerPeriod,
                max_xp_period: maxXPPeriod,
                current_period_xp: parseInt(currentPeriodXP.rows[0].current_xp),
                best_period: bestPeriod
            }
        });
    } catch (err) {
        logger.error('Error getting personal rating:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// LOCAL LEADERBOARDS (COUNTRY/CITY)
// ========================================

// Get country leaderboard
app.get('/api/leaderboard/country/:country/:type', async (req, res) => {
    try {
        const { country, type } = req.params;
        const { limit = 100 } = req.query;

        let query, params;

        if (type === 'xp') {
            query = `
                SELECT u.id, u.name, u.email, u.country, us.total_xp as score, us.level
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE u.country = $1
                ORDER BY us.total_xp DESC
                LIMIT $2
            `;
            params = [country, parseInt(limit)];
        } else if (type === 'streak') {
            query = `
                SELECT u.id, u.name, u.email, u.country, us.current_streak as score, us.longest_streak
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE u.country = $1 AND us.current_streak > 0
                ORDER BY us.current_streak DESC, us.longest_streak DESC
                LIMIT $2
            `;
            params = [country, parseInt(limit)];
        } else if (type === 'words') {
            query = `
                SELECT u.id, u.name, u.email, u.country, us.total_words_learned as score
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE u.country = $1 AND us.total_words_learned > 0
                ORDER BY us.total_words_learned DESC
                LIMIT $2
            `;
            params = [country, parseInt(limit)];
        } else {
            return res.status(400).json({ error: 'Invalid type. Use: xp, streak, or words' });
        }

        const leaderboard = await db.query(query, params);

        const rankedLeaderboard = leaderboard.rows.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        res.json({
            country,
            type,
            leaderboard: rankedLeaderboard
        });
    } catch (err) {
        logger.error('Error getting country leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get city leaderboard
app.get('/api/leaderboard/city/:city/:type', async (req, res) => {
    try {
        const { city, type } = req.params;
        const { limit = 100 } = req.query;

        let query, params;

        if (type === 'xp') {
            query = `
                SELECT u.id, u.name, u.email, u.city, u.country, us.total_xp as score, us.level
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE u.city = $1
                ORDER BY us.total_xp DESC
                LIMIT $2
            `;
            params = [city, parseInt(limit)];
        } else if (type === 'streak') {
            query = `
                SELECT u.id, u.name, u.email, u.city, u.country, us.current_streak as score, us.longest_streak
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE u.city = $1 AND us.current_streak > 0
                ORDER BY us.current_streak DESC, us.longest_streak DESC
                LIMIT $2
            `;
            params = [city, parseInt(limit)];
        } else if (type === 'words') {
            query = `
                SELECT u.id, u.name, u.email, u.city, u.country, us.total_words_learned as score
                FROM users u
                INNER JOIN user_stats us ON u.id = us.user_id
                WHERE u.city = $1 AND us.total_words_learned > 0
                ORDER BY us.total_words_learned DESC
                LIMIT $2
            `;
            params = [city, parseInt(limit)];
        } else {
            return res.status(400).json({ error: 'Invalid type. Use: xp, streak, or words' });
        }

        const leaderboard = await db.query(query, params);

        const rankedLeaderboard = leaderboard.rows.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        res.json({
            city,
            type,
            leaderboard: rankedLeaderboard
        });
    } catch (err) {
        logger.error('Error getting city leaderboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========================================
// USER SETTINGS ENDPOINTS
// ========================================

// Update user profile settings
app.put('/api/users/:userId/settings', async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, bio, avatar_url, country, city } = req.body;

        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (username !== undefined) {
            // Check if username is already taken
            const existing = await db.query(
                'SELECT id FROM users WHERE username = $1 AND id != $2',
                [username, parseInt(userId)]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.push(`username = $${paramIndex++}`);
            values.push(username);
        }

        if (bio !== undefined) {
            updates.push(`bio = $${paramIndex++}`);
            values.push(bio);
        }

        if (avatar_url !== undefined) {
            updates.push(`avatar_url = $${paramIndex++}`);
            values.push(avatar_url);
        }

        if (country !== undefined) {
            updates.push(`country = $${paramIndex++}`);
            values.push(country);
        }

        if (city !== undefined) {
            updates.push(`city = $${paramIndex++}`);
            values.push(city);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updatedat = NOW()`);
        values.push(parseInt(userId));

        const query = `
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, name, email, username, bio, avatar_url, country, city, createdat, updatedat
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (err) {
        logger.error('Error updating user settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user settings
app.get('/api/users/:userId/settings', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await db.query(
            'SELECT id, name, email, username, bio, avatar_url, country, city, createdat, updatedat, is_beta_tester FROM users WHERE id = $1',
            [parseInt(userId)]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        logger.error('Error getting user settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🐛 SRS: Get leech words (difficult words that are frequently forgotten)
app.get('/api/srs/:userId/leeches', async (req, res) => {
    try {
        const { userId } = req.params;
        const { threshold = 8, minReviews = 5 } = req.query;

        // Find words with high failure rate
        const leeches = await db.query(`
            SELECT
                w.id as word_id,
                w.word,
                w.translation,
                w.languagepairid,
                COUNT(*) as total_reviews,
                COUNT(*) FILTER (WHERE srl.quality_rating < 3) as failed_reviews,
                COUNT(*) FILTER (WHERE srl.quality_rating >= 3) as successful_reviews,
                ROUND(
                    (COUNT(*) FILTER (WHERE srl.quality_rating < 3)::DECIMAL / COUNT(*)) * 100,
                    1
                ) as failure_rate,
                AVG(srl.quality_rating)::NUMERIC(3,2) as avg_quality,
                MAX(srl.review_date) as last_review,
                MIN(srl.review_date) as first_review,
                srs.easiness_factor,
                srs.interval_days,
                srs.repetitions
            FROM srs_review_log srl
            INNER JOIN words w ON srl.word_id = w.id
            LEFT JOIN word_srs_data srs ON srs.word_id = w.id AND srs.user_id = srl.user_id
            WHERE srl.user_id = $1
            GROUP BY w.id, w.word, w.translation, w.languagepairid,
                     srs.easiness_factor, srs.interval_days, srs.repetitions
            HAVING COUNT(*) >= $3
                AND COUNT(*) FILTER (WHERE srl.quality_rating < 3) >= $2
            ORDER BY failed_reviews DESC, failure_rate DESC
        `, [parseInt(userId), parseInt(threshold), parseInt(minReviews)]);

        // Get recent review patterns for each leech
        const leechesWithPatterns = await Promise.all(leeches.rows.map(async (leech) => {
            // Get last 10 reviews to analyze pattern
            const recentReviews = await db.query(`
                SELECT quality_rating, review_date, review_type
                FROM srs_review_log
                WHERE word_id = $1 AND user_id = $2
                ORDER BY review_date DESC
                LIMIT 10
            `, [leech.word_id, parseInt(userId)]);

            // Generate recommendations based on patterns
            const recommendations = [];

            if (leech.failure_rate > 70) {
                recommendations.push('Попробуйте создать мнемоническую ассоциацию для этого слова');
                recommendations.push('Изучите примеры использования в контексте');
            } else if (leech.failure_rate > 50) {
                recommendations.push('Посмотрите визуальные примеры или изображения');
                recommendations.push('Практикуйте слово в предложениях');
            }

            if (parseFloat(leech.avg_quality) < 2.0) {
                recommendations.push('Рассмотрите возможность временно приостановить это слово');
                recommendations.push('Попробуйте изучать его вместе со схожими словами');
            }

            // Check if recently struggling (last 5 reviews mostly failures)
            const lastFiveReviews = recentReviews.rows.slice(0, 5);
            const recentFailures = lastFiveReviews.filter(r => r.quality_rating < 3).length;
            const isCurrentlyStruggling = recentFailures >= 3;

            return {
                ...leech,
                recent_reviews: recentReviews.rows,
                recommendations,
                is_currently_struggling: isCurrentlyStruggling,
                difficulty_level: leech.failure_rate > 70 ? 'very_hard' :
                                 leech.failure_rate > 50 ? 'hard' : 'moderate'
            };
        }));

        // Calculate overall statistics
        const statistics = {
            total_leeches: leechesWithPatterns.length,
            avg_failure_rate: leechesWithPatterns.length > 0
                ? (leechesWithPatterns.reduce((sum, l) => sum + parseFloat(l.failure_rate), 0) / leechesWithPatterns.length).toFixed(1)
                : 0,
            currently_struggling: leechesWithPatterns.filter(l => l.is_currently_struggling).length,
            very_hard_words: leechesWithPatterns.filter(l => l.difficulty_level === 'very_hard').length,
            hard_words: leechesWithPatterns.filter(l => l.difficulty_level === 'hard').length,
            moderate_words: leechesWithPatterns.filter(l => l.difficulty_level === 'moderate').length
        };

        res.json({
            leeches: leechesWithPatterns,
            statistics,
            threshold_used: parseInt(threshold),
            min_reviews_used: parseInt(minReviews)
        });
    } catch (err) {
        logger.error('Error getting leech words:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📚 LEARNING MODE: Get words in learning mode for user
app.get('/api/learning/:userId/words', async (req, res) => {
    try {
        const { userId } = req.params;
        const { exerciseType, limit = 20 } = req.query;

        let query = `
            SELECT
                w.id as word_id,
                w.word,
                w.translation,
                w.languagepairid,
                lp.exercise_type,
                lp.correct_count,
                lp.required_count,
                lp.learn_attempts,
                lp.last_attempt_date,
                lp.graduated_to_srs,
                ROUND((lp.correct_count::DECIMAL / lp.required_count) * 100, 1) as progress_percentage
            FROM word_learning_progress lp
            INNER JOIN words w ON lp.word_id = w.id
            WHERE lp.user_id = $1 AND lp.graduated_to_srs = false
        `;

        const params = [parseInt(userId)];
        let paramIndex = 2;

        if (exerciseType) {
            query += ` AND lp.exercise_type = $${paramIndex}`;
            params.push(exerciseType);
            paramIndex++;
        }

        query += ` ORDER BY lp.last_attempt_date ASC NULLS FIRST LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const words = await db.query(query, params);

        // Get statistics
        const stats = await db.query(`
            SELECT
                COUNT(*) as total_learning,
                COUNT(*) FILTER (WHERE correct_count >= required_count) as ready_for_srs,
                AVG(correct_count::DECIMAL / required_count * 100)::NUMERIC(5,1) as avg_progress
            FROM word_learning_progress
            WHERE user_id = $1 AND graduated_to_srs = false
        `, [parseInt(userId)]);

        res.json({
            words: words.rows,
            total_returned: words.rows.length,
            statistics: stats.rows[0]
        });
    } catch (err) {
        logger.error('Error getting learning words:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📚 LEARNING MODE: Record learning attempt
app.post('/api/learning/:userId/attempt', async (req, res) => {
    try {
        const { userId } = req.params;
        const { wordId, exerciseType, isCorrect } = req.body;

        // Define required counts by exercise type
        const requiredCounts = {
            'flashcards': 2,
            'multiple_choice': 3,
            'typing': 5,
            'default': 3
        };
        const requiredCount = requiredCounts[exerciseType] || requiredCounts['default'];

        const now = new Date();

        // Get or create learning progress
        let progress = await db.query(`
            SELECT * FROM word_learning_progress
            WHERE word_id = $1 AND user_id = $2 AND exercise_type = $3
        `, [parseInt(wordId), parseInt(userId), exerciseType]);

        if (progress.rows.length === 0) {
            // Create new learning progress
            progress = await db.query(`
                INSERT INTO word_learning_progress
                (word_id, user_id, exercise_type, correct_count, required_count, learn_attempts, last_attempt_date, graduated_to_srs)
                VALUES ($1, $2, $3, $4, $5, 1, $6, false)
                RETURNING *
            `, [parseInt(wordId), parseInt(userId), exerciseType, isCorrect ? 1 : 0, requiredCount, now]);
        } else {
            // Update existing progress
            const currentCorrect = progress.rows[0].correct_count;
            const newCorrect = isCorrect ? currentCorrect + 1 : 0; // Reset on incorrect

            progress = await db.query(`
                UPDATE word_learning_progress
                SET correct_count = $1,
                    learn_attempts = learn_attempts + 1,
                    last_attempt_date = $2,
                    updated_at = $2
                WHERE word_id = $3 AND user_id = $4 AND exercise_type = $5
                RETURNING *
            `, [newCorrect, now, parseInt(wordId), parseInt(userId), exerciseType]);
        }

        const currentProgress = progress.rows[0];
        const isCompleted = currentProgress.correct_count >= currentProgress.required_count;

        // If completed, graduate to SRS
        let srsData = null;
        let xpResult = null;

        if (isCompleted && !currentProgress.graduated_to_srs) {
            // Mark as graduated
            await db.query(`
                UPDATE word_learning_progress
                SET graduated_to_srs = true, updated_at = NOW()
                WHERE id = $1
            `, [currentProgress.id]);

            // Create SRS entry
            const nextReview = new Date(now);
            nextReview.setDate(nextReview.getDate() + 1); // Tomorrow

            await db.query(`
                INSERT INTO word_srs_data
                (word_id, user_id, easiness_factor, interval_days, repetitions, next_review_date, last_review_date, total_reviews, mature, suspended)
                VALUES ($1, $2, 2.5, 1, 0, $3, $4, 0, false, false)
                ON CONFLICT (word_id, user_id) DO NOTHING
            `, [parseInt(wordId), parseInt(userId), nextReview, now]);

            srsData = {
                graduated: true,
                next_review_date: nextReview,
                easiness_factor: 2.5,
                interval_days: 1
            };

            // Award XP for graduating to SRS (30 XP)
            xpResult = await awardXP(parseInt(userId), 'word_learned', 30, `Graduated word to SRS (${exerciseType})`);
        } else if (isCorrect) {
            // Award small XP for correct learning attempt (9 XP)
            xpResult = await awardXP(parseInt(userId), 'learning_attempt', 9, `Learning attempt (${exerciseType})`);
        }

        res.json({
            success: true,
            is_correct: isCorrect,
            progress: {
                correct_count: currentProgress.correct_count,
                required_count: currentProgress.required_count,
                learn_attempts: currentProgress.learn_attempts + 1,
                progress_percentage: Math.round((currentProgress.correct_count / currentProgress.required_count) * 100),
                is_completed: isCompleted
            },
            srs_data: srsData,
            xp_result: xpResult
        });
    } catch (err) {
        logger.error('Error recording learning attempt:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📚 LEARNING MODE: Get learning statistics
app.get('/api/learning/:userId/statistics', async (req, res) => {
    try {
        const { userId } = req.params;

        // Overall statistics
        const overall = await db.query(`
            SELECT
                COUNT(*) as total_words_learning,
                COUNT(*) FILTER (WHERE graduated_to_srs = true) as graduated_to_srs_count,
                COUNT(*) FILTER (WHERE graduated_to_srs = false) as still_learning,
                SUM(learn_attempts) as total_attempts,
                SUM(correct_count) as total_correct,
                AVG(learn_attempts)::NUMERIC(5,1) as avg_attempts_per_word
            FROM word_learning_progress
            WHERE user_id = $1
        `, [parseInt(userId)]);

        // By exercise type
        const byType = await db.query(`
            SELECT
                exercise_type,
                COUNT(*) as word_count,
                COUNT(*) FILTER (WHERE graduated_to_srs = true) as graduated_count,
                AVG(learn_attempts)::NUMERIC(5,1) as avg_attempts,
                AVG(correct_count::DECIMAL / required_count * 100)::NUMERIC(5,1) as avg_progress
            FROM word_learning_progress
            WHERE user_id = $1
            GROUP BY exercise_type
            ORDER BY word_count DESC
        `, [parseInt(userId)]);

        // Recent activity (last 10 words graduated)
        const recentGraduated = await db.query(`
            SELECT
                w.word,
                w.translation,
                lp.exercise_type,
                lp.learn_attempts,
                lp.updated_at as graduated_at
            FROM word_learning_progress lp
            INNER JOIN words w ON lp.word_id = w.id
            WHERE lp.user_id = $1 AND lp.graduated_to_srs = true
            ORDER BY lp.updated_at DESC
            LIMIT 10
        `, [parseInt(userId)]);

        res.json({
            overall: overall.rows[0],
            by_exercise_type: byType.rows,
            recent_graduated: recentGraduated.rows
        });
    } catch (err) {
        logger.error('Error getting learning statistics:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📚 LEARNING MODE: Reset word learning progress
app.post('/api/learning/:userId/reset-word/:wordId', async (req, res) => {
    try {
        const { userId, wordId } = req.params;
        const { exerciseType } = req.body;

        let query = 'DELETE FROM word_learning_progress WHERE word_id = $1 AND user_id = $2';
        const params = [parseInt(wordId), parseInt(userId)];

        if (exerciseType) {
            query += ' AND exercise_type = $3';
            params.push(exerciseType);
        }

        const result = await db.query(query, params);

        res.json({
            success: true,
            deleted_count: result.rowCount,
            message: `Learning progress reset for word ${wordId}`
        });
    } catch (err) {
        logger.error('Error resetting learning progress:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🧠 USER LEARNING PROFILE: Get or analyze user learning profile
app.get('/api/profile/:userId/learning-profile', async (req, res) => {
    try {
        const { userId } = req.params;
        const { analyze = 'true' } = req.query;

        // Get existing profile
        let profile = await db.query(
            'SELECT * FROM user_learning_profile WHERE user_id = $1',
            [parseInt(userId)]
        );

        // If analyze=true, recalculate profile from historical data
        if (analyze === 'true') {
            // Analyze best study hour (hour with highest retention rate)
            const hourlyAnalysis = await db.query(`
                SELECT
                    EXTRACT(HOUR FROM review_date) as hour,
                    COUNT(*) as review_count,
                    AVG(quality_rating)::NUMERIC(4,2) as avg_quality,
                    COUNT(*) FILTER (WHERE quality_rating >= 3)::DECIMAL / COUNT(*) * 100 as retention_rate
                FROM srs_review_log
                WHERE user_id = $1
                GROUP BY EXTRACT(HOUR FROM review_date)
                ORDER BY retention_rate DESC
            `, [parseInt(userId)]);

            const bestStudyHour = hourlyAnalysis.rows.length > 0
                ? parseInt(hourlyAnalysis.rows[0].hour)
                : null;

            // Build hourly_performance JSON
            const hourlyPerformance = {};
            hourlyAnalysis.rows.forEach(row => {
                hourlyPerformance[row.hour] = {
                    review_count: parseInt(row.review_count),
                    avg_quality: parseFloat(row.avg_quality),
                    retention_rate: parseFloat(row.retention_rate)
                };
            });

            // Calculate overall retention rate
            const overallRetention = await db.query(`
                SELECT
                    COUNT(*) FILTER (WHERE quality_rating >= 3)::DECIMAL / COUNT(*) * 100 as retention_rate
                FROM srs_review_log
                WHERE user_id = $1
            `, [parseInt(userId)]);
            const avgRetentionRate = overallRetention.rows[0]?.retention_rate || null;

            // Calculate average session duration (from XP history grouping by day)
            const sessionDuration = await db.query(`
                SELECT
                    AVG(session_duration)::INTEGER as avg_duration
                FROM (
                    SELECT
                        DATE(createdat) as study_date,
                        COUNT(*) as actions_count,
                        (COUNT(*) * 2) as session_duration
                    FROM xp_history
                    WHERE user_id = $1
                    GROUP BY DATE(createdat)
                    HAVING COUNT(*) > 3
                ) daily_sessions
            `, [parseInt(userId)]);
            const avgSessionDuration = sessionDuration.rows[0]?.avg_duration || null;

            // Count total study sessions
            const sessionCount = await db.query(`
                SELECT COUNT(DISTINCT DATE(createdat)) as total_sessions
                FROM xp_history
                WHERE user_id = $1
            `, [parseInt(userId)]);
            const totalStudySessions = parseInt(sessionCount.rows[0]?.total_sessions) || 0;

            // Determine difficulty preference (analyze word interval progression)
            const difficultyAnalysis = await db.query(`
                SELECT
                    AVG(easiness_factor)::NUMERIC(3,2) as avg_ef,
                    AVG(interval_days)::INTEGER as avg_interval
                FROM word_srs_data
                WHERE user_id = $1 AND total_reviews > 3
            `, [parseInt(userId)]);

            let difficultyPreference = 'balanced';
            const avgEF = parseFloat(difficultyAnalysis.rows[0]?.avg_ef);
            if (avgEF >= 2.3) {
                difficultyPreference = 'easy'; // User prefers easier words (high EF)
            } else if (avgEF <= 1.7) {
                difficultyPreference = 'hard'; // User prefers challenging words (low EF)
            }

            // Calculate preferred interval modifier (how user performance differs from standard)
            const intervalAnalysis = await db.query(`
                SELECT
                    AVG(new_interval::DECIMAL / NULLIF(previous_interval, 0)) as interval_growth_rate
                FROM srs_review_log
                WHERE user_id = $1 AND quality_rating >= 3 AND previous_interval > 0
            `, [parseInt(userId)]);
            const preferredIntervalModifier = parseFloat(intervalAnalysis.rows[0]?.interval_growth_rate) || 1.0;

            // Update or insert profile
            if (profile.rows.length === 0) {
                profile = await db.query(`
                    INSERT INTO user_learning_profile
                    (user_id, best_study_hour, avg_retention_rate, preferred_interval_modifier,
                     difficulty_preference, avg_session_duration_minutes, total_study_sessions, hourly_performance, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                    RETURNING *
                `, [
                    parseInt(userId),
                    bestStudyHour,
                    avgRetentionRate,
                    preferredIntervalModifier,
                    difficultyPreference,
                    avgSessionDuration,
                    totalStudySessions,
                    JSON.stringify(hourlyPerformance)
                ]);
            } else {
                profile = await db.query(`
                    UPDATE user_learning_profile
                    SET best_study_hour = $2,
                        avg_retention_rate = $3,
                        preferred_interval_modifier = $4,
                        difficulty_preference = $5,
                        avg_session_duration_minutes = $6,
                        total_study_sessions = $7,
                        hourly_performance = $8,
                        updated_at = NOW()
                    WHERE user_id = $1
                    RETURNING *
                `, [
                    parseInt(userId),
                    bestStudyHour,
                    avgRetentionRate,
                    preferredIntervalModifier,
                    difficultyPreference,
                    avgSessionDuration,
                    totalStudySessions,
                    JSON.stringify(hourlyPerformance)
                ]);
            }
        }

        // Generate recommendations based on profile
        const recommendations = [];
        const currentProfile = profile.rows[0];

        if (currentProfile) {
            if (currentProfile.best_study_hour !== null) {
                recommendations.push({
                    type: 'optimal_time',
                    message: `Ваше лучшее время для изучения: ${currentProfile.best_study_hour}:00`,
                    priority: 'high'
                });
            }

            if (currentProfile.avg_retention_rate < 60) {
                recommendations.push({
                    type: 'retention_improvement',
                    message: 'Ваш показатель запоминания ниже среднего. Попробуйте увеличить частоту повторений.',
                    priority: 'high'
                });
            }

            if (currentProfile.preferred_interval_modifier < 0.9) {
                recommendations.push({
                    type: 'interval_adjustment',
                    message: 'Рекомендуем уменьшить интервалы повторений - вы склонны забывать слова быстрее.',
                    priority: 'medium'
                });
            } else if (currentProfile.preferred_interval_modifier > 1.3) {
                recommendations.push({
                    type: 'interval_adjustment',
                    message: 'Вы запоминаете слова лучше среднего! Можете увеличить интервалы для экономии времени.',
                    priority: 'low'
                });
            }

            if (currentProfile.difficulty_preference === 'easy') {
                recommendations.push({
                    type: 'challenge',
                    message: 'Попробуйте добавить более сложные слова - это ускорит ваш прогресс!',
                    priority: 'low'
                });
            } else if (currentProfile.difficulty_preference === 'hard') {
                recommendations.push({
                    type: 'encouragement',
                    message: 'Вы предпочитаете сложные слова - отличная стратегия для быстрого прогресса!',
                    priority: 'low'
                });
            }

            if (currentProfile.avg_session_duration_minutes && currentProfile.avg_session_duration_minutes < 10) {
                recommendations.push({
                    type: 'session_length',
                    message: 'Увеличьте продолжительность сессий до 15-20 минут для лучших результатов.',
                    priority: 'medium'
                });
            }
        }

        res.json({
            profile: currentProfile || { message: 'Profile not yet created. Set analyze=true to generate.' },
            recommendations,
            analyzed: analyze === 'true'
        });
    } catch (err) {
        logger.error('Error getting learning profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🧠 USER LEARNING PROFILE: Update profile preferences
app.put('/api/profile/:userId/learning-profile', async (req, res) => {
    try {
        const { userId } = req.params;
        const { difficultyPreference, preferredIntervalModifier } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (difficultyPreference) {
            updates.push(`difficulty_preference = $${paramIndex++}`);
            values.push(difficultyPreference);
        }

        if (preferredIntervalModifier !== undefined) {
            updates.push(`preferred_interval_modifier = $${paramIndex++}`);
            values.push(parseFloat(preferredIntervalModifier));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(parseInt(userId));

        // Upsert profile
        const existingProfile = await db.query(
            'SELECT id FROM user_learning_profile WHERE user_id = $1',
            [parseInt(userId)]
        );

        let result;
        if (existingProfile.rows.length === 0) {
            // Insert with defaults
            result = await db.query(`
                INSERT INTO user_learning_profile
                (user_id, difficulty_preference, preferred_interval_modifier, updated_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING *
            `, [
                parseInt(userId),
                difficultyPreference || 'balanced',
                parseFloat(preferredIntervalModifier) || 1.0
            ]);
        } else {
            // Update existing
            result = await db.query(`
                UPDATE user_learning_profile
                SET ${updates.join(', ')}
                WHERE user_id = $${paramIndex}
                RETURNING *
            `, values);
        }

        res.json({
            success: true,
            profile: result.rows[0]
        });
    } catch (err) {
        logger.error('Error updating learning profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// 🔗 SIBLINGS & CONTEXT SYSTEM
// ============================================================================

// 🔗 Add sibling relationship between two words
app.post('/api/siblings', async (req, res) => {
    try {
        const { wordId1, wordId2, relationshipType, similarityScore, createdBy } = req.body;

        // Validation
        if (!wordId1 || !wordId2 || !relationshipType) {
            return res.status(400).json({ error: 'wordId1, wordId2, and relationshipType are required' });
        }

        if (wordId1 === wordId2) {
            return res.status(400).json({ error: 'Cannot create sibling relationship with the same word' });
        }

        // Ensure word_id_1 < word_id_2 for uniqueness constraint
        const [smallerId, largerId] = wordId1 < wordId2 ? [wordId1, wordId2] : [wordId2, wordId1];

        const result = await db.query(`
            INSERT INTO word_siblings
            (word_id_1, word_id_2, relationship_type, similarity_score, created_by)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (word_id_1, word_id_2)
            DO UPDATE SET
                relationship_type = EXCLUDED.relationship_type,
                similarity_score = EXCLUDED.similarity_score
            RETURNING *
        `, [
            parseInt(smallerId),
            parseInt(largerId),
            relationshipType,
            similarityScore ? parseFloat(similarityScore) : null,
            createdBy ? parseInt(createdBy) : null
        ]);

        res.json({
            success: true,
            sibling: result.rows[0]
        });
    } catch (err) {
        logger.error('Error adding sibling relationship:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🔗 Get siblings for a word
app.get('/api/siblings/:wordId', async (req, res) => {
    try {
        const { wordId } = req.params;
        const { type } = req.query;

        let typeFilter = '';
        const params = [parseInt(wordId)];

        if (type) {
            typeFilter = 'AND ws.relationship_type = $2';
            params.push(type);
        }

        // Query siblings (both directions)
        const siblings = await db.query(`
            SELECT
                ws.id as sibling_id,
                ws.relationship_type,
                ws.similarity_score,
                ws.created_at,
                CASE
                    WHEN ws.word_id_1 = $1 THEN ws.word_id_2
                    ELSE ws.word_id_1
                END as related_word_id,
                w.word,
                w.translation,
                w.language_pair_id,
                wsd.easiness_factor,
                wsd.interval_days,
                wsd.next_review_date
            FROM word_siblings ws
            INNER JOIN words w ON (
                CASE
                    WHEN ws.word_id_1 = $1 THEN w.id = ws.word_id_2
                    ELSE w.id = ws.word_id_1
                END
            )
            LEFT JOIN word_srs_data wsd ON wsd.word_id = w.id
            WHERE (ws.word_id_1 = $1 OR ws.word_id_2 = $1)
            ${typeFilter}
            ORDER BY ws.similarity_score DESC NULLS LAST, ws.created_at DESC
        `, params);

        // Group by relationship type
        const grouped = {};
        siblings.rows.forEach(sibling => {
            const type = sibling.relationship_type;
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push({
                sibling_id: sibling.sibling_id,
                related_word_id: sibling.related_word_id,
                word: sibling.word,
                translation: sibling.translation,
                similarity_score: sibling.similarity_score ? parseFloat(sibling.similarity_score) : null,
                srs_data: sibling.easiness_factor ? {
                    easiness_factor: parseFloat(sibling.easiness_factor),
                    interval_days: sibling.interval_days,
                    next_review_date: sibling.next_review_date
                } : null
            });
        });

        res.json({
            word_id: parseInt(wordId),
            siblings: siblings.rows,
            grouped_by_type: grouped,
            total_siblings: siblings.rows.length
        });
    } catch (err) {
        logger.error('Error getting siblings:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🔗 Delete sibling relationship
app.delete('/api/siblings/:siblingId', async (req, res) => {
    try {
        const { siblingId } = req.params;

        const result = await db.query(
            'DELETE FROM word_siblings WHERE id = $1 RETURNING *',
            [parseInt(siblingId)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sibling relationship not found' });
        }

        res.json({
            success: true,
            deleted: result.rows[0]
        });
    } catch (err) {
        logger.error('Error deleting sibling relationship:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📝 Add context example for a word
app.post('/api/context', async (req, res) => {
    try {
        const {
            wordId,
            userId,
            contextType,
            sourceSentence,
            translationSentence,
            sourceLanguage,
            contextTags,
            difficultyLevel,
            isPublic
        } = req.body;

        // Validation
        if (!wordId || !userId || !contextType || !sourceSentence) {
            return res.status(400).json({
                error: 'wordId, userId, contextType, and sourceSentence are required'
            });
        }

        const result = await db.query(`
            INSERT INTO word_contexts
            (word_id, user_id, context_type, source_sentence, translation_sentence,
             source_language, context_tags, difficulty_level, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            parseInt(wordId),
            parseInt(userId),
            contextType,
            sourceSentence,
            translationSentence || null,
            sourceLanguage || null,
            contextTags || null,
            difficultyLevel || null,
            isPublic !== undefined ? isPublic : false
        ]);

        res.json({
            success: true,
            context: result.rows[0]
        });
    } catch (err) {
        logger.error('Error adding context:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📝 Get context examples for a word
app.get('/api/context/:wordId', async (req, res) => {
    try {
        const { wordId } = req.params;
        const { userId, type, includePublic = 'true' } = req.query;

        let whereConditions = ['wc.word_id = $1'];
        const params = [parseInt(wordId)];
        let paramIndex = 2;

        // Include user's own contexts + public contexts
        if (userId) {
            if (includePublic === 'true') {
                whereConditions.push(`(wc.user_id = $${paramIndex} OR wc.is_public = true)`);
                params.push(parseInt(userId));
                paramIndex++;
            } else {
                whereConditions.push(`wc.user_id = $${paramIndex}`);
                params.push(parseInt(userId));
                paramIndex++;
            }
        } else {
            // Only public contexts
            whereConditions.push('wc.is_public = true');
        }

        if (type) {
            whereConditions.push(`wc.context_type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }

        const contexts = await db.query(`
            SELECT
                wc.*,
                u.username as created_by_username
            FROM word_contexts wc
            LEFT JOIN users u ON wc.user_id = u.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY wc.is_public DESC, wc.usage_count DESC, wc.created_at DESC
        `, params);

        // Group by context type
        const grouped = {};
        contexts.rows.forEach(ctx => {
            const type = ctx.context_type;
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(ctx);
        });

        res.json({
            word_id: parseInt(wordId),
            contexts: contexts.rows,
            grouped_by_type: grouped,
            total_contexts: contexts.rows.length
        });
    } catch (err) {
        logger.error('Error getting contexts:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📝 Update context (increment usage, edit)
app.put('/api/context/:contextId', async (req, res) => {
    try {
        const { contextId } = req.params;
        const {
            sourceSentence,
            translationSentence,
            contextTags,
            difficultyLevel,
            isPublic,
            incrementUsage
        } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (sourceSentence) {
            updates.push(`source_sentence = $${paramIndex++}`);
            values.push(sourceSentence);
        }
        if (translationSentence !== undefined) {
            updates.push(`translation_sentence = $${paramIndex++}`);
            values.push(translationSentence);
        }
        if (contextTags) {
            updates.push(`context_tags = $${paramIndex++}`);
            values.push(contextTags);
        }
        if (difficultyLevel) {
            updates.push(`difficulty_level = $${paramIndex++}`);
            values.push(difficultyLevel);
        }
        if (isPublic !== undefined) {
            updates.push(`is_public = $${paramIndex++}`);
            values.push(isPublic);
        }
        if (incrementUsage) {
            updates.push(`usage_count = usage_count + 1`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(parseInt(contextId));

        const result = await db.query(`
            UPDATE word_contexts
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Context not found' });
        }

        res.json({
            success: true,
            context: result.rows[0]
        });
    } catch (err) {
        logger.error('Error updating context:', err);
        res.status(500).json({ error: err.message });
    }
});

// 📝 Delete context
app.delete('/api/context/:contextId', async (req, res) => {
    try {
        const { contextId } = req.params;
        const { userId } = req.query;

        // Only allow deletion by the creator (or admin)
        const whereConditions = ['id = $1'];
        const params = [parseInt(contextId)];

        if (userId) {
            whereConditions.push('user_id = $2');
            params.push(parseInt(userId));
        }

        const result = await db.query(`
            DELETE FROM word_contexts
            WHERE ${whereConditions.join(' AND ')}
            RETURNING *
        `, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Context not found or you do not have permission to delete it'
            });
        }

        res.json({
            success: true,
            deleted: result.rows[0]
        });
    } catch (err) {
        logger.error('Error deleting context:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🎯 Get SRS due words with sibling avoidance
app.get('/api/srs/:userId/due-words-smart', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, sessionId } = req.query;

        // Get words already reviewed in this session
        let reviewedWordIds = [];
        if (sessionId) {
            const session = await db.query(
                'SELECT word_ids FROM srs_session_tracking WHERE session_id = $1 AND user_id = $2',
                [sessionId, parseInt(userId)]
            );
            if (session.rows.length > 0) {
                reviewedWordIds = session.rows[0].word_ids || [];
            }
        }

        // Get siblings of already reviewed words (to avoid)
        let siblingsToAvoid = [];
        if (reviewedWordIds.length > 0) {
            const siblings = await db.query(`
                SELECT
                    CASE
                        WHEN word_id_1 = ANY($1::int[]) THEN word_id_2
                        ELSE word_id_1
                    END as sibling_word_id
                FROM word_siblings
                WHERE word_id_1 = ANY($1::int[]) OR word_id_2 = ANY($1::int[])
            `, [reviewedWordIds]);
            siblingsToAvoid = siblings.rows.map(r => r.sibling_word_id);
        }

        // Combine exclusion list
        const excludeIds = [...reviewedWordIds, ...siblingsToAvoid];

        // Get due words (excluding siblings)
        let excludeFilter = '';
        const params = [parseInt(userId), parseInt(limit)];

        if (excludeIds.length > 0) {
            excludeFilter = 'AND wsd.word_id <> ALL($3::int[])';
            params.push(excludeIds);
        }

        const dueWords = await db.query(`
            SELECT
                w.id,
                w.word,
                w.translation,
                w.language_pair_id,
                wsd.easiness_factor,
                wsd.interval_days,
                wsd.repetitions,
                wsd.next_review_date,
                wsd.last_review_date,
                wsd.mature,
                CASE
                    WHEN wsd.next_review_date < NOW() THEN 'overdue'
                    WHEN wsd.next_review_date::date = CURRENT_DATE THEN 'due_today'
                    ELSE 'future'
                END as status,
                EXTRACT(EPOCH FROM (NOW() - wsd.next_review_date))/3600 as hours_overdue
            FROM word_srs_data wsd
            INNER JOIN words w ON wsd.word_id = w.id
            WHERE wsd.user_id = $1
                AND wsd.suspended = false
                AND wsd.next_review_date <= NOW() + INTERVAL '1 day'
                ${excludeFilter}
            ORDER BY
                CASE
                    WHEN wsd.next_review_date < NOW() THEN 1
                    WHEN wsd.next_review_date::date = CURRENT_DATE THEN 2
                    ELSE 3
                END,
                wsd.next_review_date ASC
            LIMIT $2
        `, params);

        res.json({
            words: dueWords.rows,
            session_id: sessionId || null,
            reviewed_in_session: reviewedWordIds.length,
            siblings_avoided: siblingsToAvoid.length,
            total_excluded: excludeIds.length
        });
    } catch (err) {
        logger.error('Error getting smart due words:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🎯 Start/Update SRS session tracking
app.post('/api/srs/session', async (req, res) => {
    try {
        const { userId, sessionId, wordId, qualityRating } = req.body;

        if (!userId || !sessionId) {
            return res.status(400).json({ error: 'userId and sessionId are required' });
        }

        // Check if session exists
        const existingSession = await db.query(
            'SELECT * FROM srs_session_tracking WHERE session_id = $1 AND user_id = $2',
            [sessionId, parseInt(userId)]
        );

        if (existingSession.rows.length === 0) {
            // Create new session
            await db.query(`
                INSERT INTO srs_session_tracking
                (user_id, session_id, word_ids, words_reviewed, avg_quality)
                VALUES ($1, $2, $3, 0, 0)
            `, [
                parseInt(userId),
                sessionId,
                wordId ? [parseInt(wordId)] : []
            ]);

            return res.json({
                success: true,
                session_id: sessionId,
                action: 'created'
            });
        } else {
            // Update existing session
            if (wordId) {
                const currentWordIds = existingSession.rows[0].word_ids || [];
                const currentWordsReviewed = existingSession.rows[0].words_reviewed || 0;
                const currentAvgQuality = parseFloat(existingSession.rows[0].avg_quality) || 0;

                // Add word to list if not already present
                const newWordIds = currentWordIds.includes(parseInt(wordId))
                    ? currentWordIds
                    : [...currentWordIds, parseInt(wordId)];

                // Update average quality if rating provided
                let newAvgQuality = currentAvgQuality;
                if (qualityRating !== undefined) {
                    const newCount = currentWordsReviewed + 1;
                    newAvgQuality = ((currentAvgQuality * currentWordsReviewed) + parseInt(qualityRating)) / newCount;
                }

                await db.query(`
                    UPDATE srs_session_tracking
                    SET word_ids = $1,
                        words_reviewed = words_reviewed + 1,
                        avg_quality = $2
                    WHERE session_id = $3 AND user_id = $4
                `, [
                    newWordIds,
                    newAvgQuality,
                    sessionId,
                    parseInt(userId)
                ]);

                return res.json({
                    success: true,
                    session_id: sessionId,
                    action: 'updated',
                    words_reviewed: currentWordsReviewed + 1,
                    avg_quality: newAvgQuality.toFixed(2)
                });
            }

            return res.json({
                success: true,
                session_id: sessionId,
                action: 'exists'
            });
        }
    } catch (err) {
        logger.error('Error managing SRS session:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🎯 End SRS session
app.post('/api/srs/session/end', async (req, res) => {
    try {
        const { userId, sessionId } = req.body;

        if (!userId || !sessionId) {
            return res.status(400).json({ error: 'userId and sessionId are required' });
        }

        const result = await db.query(`
            UPDATE srs_session_tracking
            SET session_end = NOW()
            WHERE session_id = $1 AND user_id = $2
            RETURNING *
        `, [sessionId, parseInt(userId)]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const session = result.rows[0];
        const durationMinutes = session.session_end && session.session_start
            ? Math.round((new Date(session.session_end) - new Date(session.session_start)) / 1000 / 60)
            : null;

        res.json({
            success: true,
            session: {
                session_id: session.session_id,
                words_reviewed: session.words_reviewed,
                avg_quality: session.avg_quality ? parseFloat(session.avg_quality).toFixed(2) : null,
                duration_minutes: durationMinutes,
                started_at: session.session_start,
                ended_at: session.session_end
            }
        });
    } catch (err) {
        logger.error('Error ending SRS session:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// 🚀 CRAMMING MODE SYSTEM
// ============================================================================

// 🚀 Create cramming session
app.post('/api/cramming/create', async (req, res) => {
    try {
        const { userId, sessionName, wordIds, targetDate, examDate } = req.body;

        // Validation
        if (!userId || !wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
            return res.status(400).json({ error: 'userId and wordIds array are required' });
        }

        // Create cramming session
        const session = await db.query(`
            INSERT INTO cramming_sessions
            (user_id, session_name, target_date, word_ids, total_words, exam_date)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            parseInt(userId),
            sessionName || 'Cramming Session',
            targetDate || null,
            wordIds.map(id => parseInt(id)),
            wordIds.length,
            examDate || null
        ]);

        const sessionId = session.rows[0].id;

        // Initialize cramming_progress for each word
        // Stage 1: 10 min, Stage 2: 1 hour, Stage 3: 4 hours, Stage 4: 1 day
        const now = new Date();
        const stage1Time = new Date(now.getTime() + 10 * 60 * 1000); // +10 min

        const progressInserts = wordIds.map(wordId =>
            db.query(`
                INSERT INTO cramming_progress
                (cramming_session_id, word_id, user_id, stage, next_review_at)
                VALUES ($1, $2, $3, 1, $4)
            `, [sessionId, parseInt(wordId), parseInt(userId), stage1Time])
        );

        await Promise.all(progressInserts);

        res.json({
            success: true,
            session: session.rows[0],
            message: 'Cramming session created. First review in 10 minutes!'
        });
    } catch (err) {
        logger.error('Error creating cramming session:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Get active cramming sessions
app.get('/api/cramming/:userId/sessions', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status = 'active' } = req.query;

        const sessions = await db.query(`
            SELECT
                cs.*,
                COUNT(cp.id) FILTER (WHERE cp.is_mastered = true) as mastered_count,
                COUNT(cp.id) as total_progress,
                ROUND(
                    (COUNT(cp.id) FILTER (WHERE cp.is_mastered = true)::DECIMAL / NULLIF(COUNT(cp.id), 0)) * 100,
                    1
                ) as completion_percentage
            FROM cramming_sessions cs
            LEFT JOIN cramming_progress cp ON cs.id = cp.cramming_session_id
            WHERE cs.user_id = $1
                AND ($2 = 'all' OR cs.session_status = $2)
            GROUP BY cs.id
            ORDER BY cs.created_at DESC
        `, [parseInt(userId), status]);

        res.json({
            sessions: sessions.rows,
            total: sessions.rows.length
        });
    } catch (err) {
        logger.error('Error getting cramming sessions:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Get due words for cramming session
app.get('/api/cramming/:sessionId/due-words', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit = 20 } = req.query;

        const dueWords = await db.query(`
            SELECT
                w.id,
                w.word,
                w.translation,
                cp.stage,
                cp.next_review_at,
                cp.review_count,
                cp.correct_count,
                cp.is_mastered,
                CASE
                    WHEN cp.next_review_at <= NOW() THEN 'due_now'
                    WHEN cp.next_review_at <= NOW() + INTERVAL '10 minutes' THEN 'due_soon'
                    ELSE 'future'
                END as status
            FROM cramming_progress cp
            INNER JOIN words w ON cp.word_id = w.id
            WHERE cp.cramming_session_id = $1
                AND cp.is_mastered = false
                AND cp.next_review_at <= NOW() + INTERVAL '1 hour'
            ORDER BY cp.next_review_at ASC
            LIMIT $2
        `, [parseInt(sessionId), parseInt(limit)]);

        // Get session info
        const sessionInfo = await db.query(
            'SELECT * FROM cramming_sessions WHERE id = $1',
            [parseInt(sessionId)]
        );

        res.json({
            session: sessionInfo.rows[0] || null,
            words: dueWords.rows,
            total_due: dueWords.rows.length
        });
    } catch (err) {
        logger.error('Error getting cramming due words:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Review word in cramming session
app.post('/api/cramming/:sessionId/review', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId, wordId, isCorrect } = req.body;

        if (!userId || !wordId || isCorrect === undefined) {
            return res.status(400).json({ error: 'userId, wordId, and isCorrect are required' });
        }

        // Get current progress
        const currentProgress = await db.query(
            'SELECT * FROM cramming_progress WHERE cramming_session_id = $1 AND word_id = $2',
            [parseInt(sessionId), parseInt(wordId)]
        );

        if (currentProgress.rows.length === 0) {
            return res.status(404).json({ error: 'Word not found in cramming session' });
        }

        const progress = currentProgress.rows[0];
        const currentStage = progress.stage;
        const currentCorrectCount = progress.correct_count || 0;
        const currentReviewCount = progress.review_count || 0;

        // Cramming stage intervals
        const stageIntervals = {
            1: 10,      // 10 minutes
            2: 60,      // 1 hour
            3: 240,     // 4 hours
            4: 1440     // 1 day (24 hours)
        };

        let newStage = currentStage;
        let newCorrectCount = currentCorrectCount;
        let isMastered = false;
        let nextReviewAt = new Date();

        if (isCorrect) {
            newCorrectCount++;

            // If answered correctly, move to next stage
            if (currentStage < 4) {
                newStage = currentStage + 1;
                const minutesToAdd = stageIntervals[newStage];
                nextReviewAt = new Date(Date.now() + minutesToAdd * 60 * 1000);
            } else {
                // Completed all 4 stages
                isMastered = true;
                nextReviewAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 day
            }
        } else {
            // Incorrect answer - reset to stage 1
            newStage = 1;
            newCorrectCount = 0;
            nextReviewAt = new Date(Date.now() + stageIntervals[1] * 60 * 1000);
        }

        // Update progress
        const updatedProgress = await db.query(`
            UPDATE cramming_progress
            SET stage = $1,
                review_count = review_count + 1,
                correct_count = $2,
                is_mastered = $3,
                last_review_at = NOW(),
                next_review_at = $4
            WHERE cramming_session_id = $5 AND word_id = $6
            RETURNING *
        `, [
            newStage,
            newCorrectCount,
            isMastered,
            nextReviewAt,
            parseInt(sessionId),
            parseInt(wordId)
        ]);

        // Update session completed_words count
        const masteredCount = await db.query(
            'SELECT COUNT(*) as count FROM cramming_progress WHERE cramming_session_id = $1 AND is_mastered = true',
            [parseInt(sessionId)]
        );

        await db.query(`
            UPDATE cramming_sessions
            SET completed_words = $1,
                current_stage = (
                    SELECT COALESCE(AVG(stage)::INTEGER, 1)
                    FROM cramming_progress
                    WHERE cramming_session_id = $2 AND is_mastered = false
                )
            WHERE id = $2
        `, [parseInt(masteredCount.rows[0].count), parseInt(sessionId)]);

        // Award XP (less than normal SRS)
        let xpAmount = 0;
        if (isCorrect) {
            if (isMastered) {
                xpAmount = 20; // Completed cramming for this word
            } else {
                xpAmount = 5; // Correct answer in cramming
            }

            await awardXP(parseInt(userId), 'cramming_review', xpAmount, `Cramming: Stage ${newStage}`);
        }

        res.json({
            success: true,
            is_correct: isCorrect,
            progress: updatedProgress.rows[0],
            stage_advanced: isCorrect && !isMastered,
            mastered: isMastered,
            next_review_in_minutes: Math.round((nextReviewAt - new Date()) / 60000),
            xp_awarded: xpAmount
        });
    } catch (err) {
        logger.error('Error reviewing cramming word:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Get cramming session statistics
app.get('/api/cramming/:sessionId/stats', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await db.query(
            'SELECT * FROM cramming_sessions WHERE id = $1',
            [parseInt(sessionId)]
        );

        if (session.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Get detailed statistics
        const stats = await db.query(`
            SELECT
                COUNT(*) as total_words,
                COUNT(*) FILTER (WHERE is_mastered = true) as mastered_words,
                COUNT(*) FILTER (WHERE is_mastered = false) as in_progress_words,
                COUNT(*) FILTER (WHERE stage = 1) as stage_1_count,
                COUNT(*) FILTER (WHERE stage = 2) as stage_2_count,
                COUNT(*) FILTER (WHERE stage = 3) as stage_3_count,
                COUNT(*) FILTER (WHERE stage = 4) as stage_4_count,
                AVG(stage)::NUMERIC(3,2) as avg_stage,
                SUM(review_count) as total_reviews,
                SUM(correct_count) as total_correct,
                ROUND(
                    (SUM(correct_count)::DECIMAL / NULLIF(SUM(review_count), 0)) * 100,
                    1
                ) as accuracy_rate
            FROM cramming_progress
            WHERE cramming_session_id = $1
        `, [parseInt(sessionId)]);

        // Get upcoming reviews
        const upcomingReviews = await db.query(`
            SELECT
                CASE
                    WHEN next_review_at <= NOW() THEN 'overdue'
                    WHEN next_review_at <= NOW() + INTERVAL '10 minutes' THEN 'next_10_min'
                    WHEN next_review_at <= NOW() + INTERVAL '1 hour' THEN 'next_hour'
                    WHEN next_review_at <= NOW() + INTERVAL '4 hours' THEN 'next_4_hours'
                    ELSE 'later'
                END as time_bracket,
                COUNT(*) as count
            FROM cramming_progress
            WHERE cramming_session_id = $1 AND is_mastered = false
            GROUP BY time_bracket
        `, [parseInt(sessionId)]);

        const upcomingBrackets = {};
        upcomingReviews.rows.forEach(row => {
            upcomingBrackets[row.time_bracket] = parseInt(row.count);
        });

        res.json({
            session: session.rows[0],
            statistics: stats.rows[0],
            upcoming_reviews: upcomingBrackets
        });
    } catch (err) {
        logger.error('Error getting cramming stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Complete cramming session
app.post('/api/cramming/:sessionId/complete', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId } = req.body;

        // Update session status
        const result = await db.query(`
            UPDATE cramming_sessions
            SET session_status = 'completed',
                completed_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `, [parseInt(sessionId), parseInt(userId)]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Get final statistics
        const stats = await db.query(`
            SELECT
                COUNT(*) FILTER (WHERE is_mastered = true) as mastered_count,
                COUNT(*) as total_words
            FROM cramming_progress
            WHERE cramming_session_id = $1
        `, [parseInt(sessionId)]);

        const finalStats = stats.rows[0];

        // Bonus XP for completing session
        if (finalStats.mastered_count === finalStats.total_words) {
            // Perfect completion bonus
            await awardXP(parseInt(userId), 'cramming_complete', 50, 'Perfect cramming session!');
        } else if (finalStats.mastered_count > 0) {
            // Partial completion
            await awardXP(parseInt(userId), 'cramming_complete', 25, 'Cramming session completed');
        }

        res.json({
            success: true,
            session: result.rows[0],
            statistics: finalStats,
            perfect_completion: finalStats.mastered_count === finalStats.total_words
        });
    } catch (err) {
        logger.error('Error completing cramming session:', err);
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Delete cramming session
app.delete('/api/cramming/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId } = req.query;

        const result = await db.query(
            'DELETE FROM cramming_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
            [parseInt(sessionId), parseInt(userId)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found or unauthorized' });
        }

        res.json({
            success: true,
            deleted: result.rows[0]
        });
    } catch (err) {
        logger.error('Error deleting cramming session:', err);
        res.status(500).json({ error: err.message });
    }
});

// Serve main page
// Update daily goals targets
app.put('/api/daily-goals/:userId/targets', async (req, res) => {
    try {
        const { userId } = req.params;
        const { xpGoal, wordsGoal, exercisesGoal } = req.body;

        if (!xpGoal || !wordsGoal || !exercisesGoal) {
            return res.status(400).json({ error: 'All goals (xpGoal, wordsGoal, exercisesGoal) are required' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Update or create today's goals with new targets
        await db.query(`
            INSERT INTO daily_goals (user_id, goal_date, xp_goal, words_goal, quizzes_goal)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, goal_date)
            DO UPDATE SET
                xp_goal = EXCLUDED.xp_goal,
                words_goal = EXCLUDED.words_goal,
                quizzes_goal = EXCLUDED.quizzes_goal,
                updated_at = CURRENT_TIMESTAMP
        `, [parseInt(userId), today, xpGoal, wordsGoal, exercisesGoal]);

        logger.info(`Updated daily goals for user ${userId}: XP=${xpGoal}, Words=${wordsGoal}, Exercises=${exercisesGoal}`);

        res.json({
            message: 'Daily goals updated successfully',
            goals: { xpGoal, wordsGoal, exercisesGoal }
        });
    } catch (err) {
        logger.error('Error updating daily goals:', err);
        res.status(500).json({ error: err.message });
    }
});

// Check for words with mismatched points and stages
app.get('/api/check-points-mismatch', async (req, res) => {
    try {
        logger.info('🔍 Checking for words with mismatched points and stages...');

        const stageThresholds = [20, 35, 50, 65, 80, 90, 100];
        const srsIntervals = [1, 3, 7, 14, 30, 60, 120];

        const result = await db.query(`
            SELECT id, word, correctcount, status, reviewcycle
            FROM words
            WHERE status IN ('studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120', 'learned', 'mastered')
            ORDER BY correctcount DESC
        `);

        const mismatches = [];

        for (const word of result.rows) {
            const points = word.correctcount || 0;
            const status = word.status;
            const currentCycle = word.reviewcycle || 0;

            let expectedCycle = -1;
            for (let i = 0; i < stageThresholds.length; i++) {
                if (points >= stageThresholds[i]) {
                    expectedCycle = i;
                } else {
                    break;
                }
            }

            let expectedStatus = 'studying';
            if (points >= 100) {
                expectedStatus = 'mastered';
            } else if (expectedCycle >= 0 && expectedCycle < srsIntervals.length) {
                expectedStatus = `review_${srsIntervals[expectedCycle]}`;
            }

            const statusMismatch = status !== expectedStatus && !(status === 'learned' && expectedStatus === 'mastered');

            if (statusMismatch) {
                mismatches.push({
                    id: word.id,
                    word: word.word,
                    points: points,
                    currentStatus: status,
                    currentCycle: currentCycle,
                    expectedStatus: expectedStatus,
                    expectedCycle: expectedCycle >= 0 ? expectedCycle : null
                });
            }
        }

        logger.info(`Found ${mismatches.length} mismatches out of ${result.rows.length} words`);

        res.json({
            success: true,
            totalWords: result.rows.length,
            mismatchCount: mismatches.length,
            mismatches: mismatches
        });
    } catch (err) {
        logger.error('❌ Error checking mismatches:', err);
        res.status(500).json({ error: err.message });
    }
});

// Temporary migration endpoint to update word statuses based on new threshold system
app.post('/api/migrate-word-statuses', async (req, res) => {
    try {
        logger.info('🔄 Starting word status migration...');

        // SRS intervals and thresholds
        const srsIntervals = [1, 3, 7, 14, 30, 60, 120];
        const stageThresholds = [20, 35, 50, 65, 80, 90, 100];

        // Get all words that are currently "studying", "learning", or in review
        const result = await db.query(`
            SELECT id, word, correctcount, status, reviewcycle
            FROM words
            WHERE status IN ('studying', 'learning') OR status LIKE 'review_%'
            ORDER BY correctcount DESC
        `);

        logger.info(`Found ${result.rows.length} words to check`);

        let updatedCount = 0;
        let skippedCount = 0;
        const updates = [];

        for (const word of result.rows) {
            const correctCount = word.correctcount || 0;

            // Determine the correct review cycle based on points (ignoring old cycle)
            let newReviewCycle = 0;
            for (let i = 0; i < stageThresholds.length; i++) {
                if (correctCount >= stageThresholds[i]) {
                    newReviewCycle = i;
                } else {
                    break;
                }
            }

            // If word has reached at least the first threshold (20 points)
            if (correctCount >= stageThresholds[0] && newReviewCycle < srsIntervals.length) {
                const intervalDays = srsIntervals[newReviewCycle];
                const newStatus = `review_${intervalDays}`;
                const oldCycle = word.reviewcycle || 0;

                // Only update if status or cycle is different
                if (word.status !== newStatus || oldCycle !== newReviewCycle) {
                    const nextReviewDate = new Date();
                    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

                    await db.query(
                        `UPDATE words
                         SET status = $1, reviewcycle = $2, nextreviewdate = $3, updatedAt = CURRENT_TIMESTAMP
                         WHERE id = $4`,
                        [newStatus, newReviewCycle, nextReviewDate, word.id]
                    );

                    logger.info(`✅ Updated: "${word.word}" (${correctCount} pts) → cycle ${oldCycle}→${newReviewCycle}, ${word.status}→${newStatus}`);
                    updates.push({
                        word: word.word,
                        points: correctCount,
                        oldStatus: word.status,
                        oldCycle: oldCycle,
                        newStatus: newStatus,
                        newCycle: newReviewCycle,
                        reviewInDays: intervalDays
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        logger.info(`📊 Migration complete! Updated: ${updatedCount}, Skipped: ${skippedCount}`);

        res.json({
            success: true,
            message: 'Word status migration completed',
            stats: {
                total: result.rows.length,
                updated: updatedCount,
                skipped: skippedCount
            },
            updates: updates
        });
    } catch (err) {
        logger.error('❌ Migration failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================================
// GOOGLE CLOUD TEXT-TO-SPEECH API
// ============================================================================

// Initialize Google TTS client
let ttsClient = null;
try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        // Parse JSON credentials from environment variable
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        ttsClient = new textToSpeech.TextToSpeechClient({
            credentials
        });
        logger.info('✅ Google TTS client initialized with Service Account credentials');
    } else {
        logger.warn('⚠️ Google TTS not configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.');
    }
} catch (err) {
    logger.error('❌ Failed to initialize Google TTS client:', err.message);
}

// Audio cache directory
const AUDIO_CACHE_DIR = path.join(__dirname, 'audio-cache');
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

// TTS endpoint with caching
app.get('/api/tts', async (req, res) => {
    try {
        const { text, lang = 'de-DE' } = req.query;

        if (!text) {
            return res.status(400).json({ error: 'Text parameter is required' });
        }

        if (!ttsClient) {
            return res.status(503).json({ error: 'Google TTS is not configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON in environment variables.' });
        }

        // Create cache filename based on text and language
        const cacheKey = crypto.createHash('md5').update(`${text}-${lang}`).digest('hex');
        const cacheFile = path.join(AUDIO_CACHE_DIR, `${cacheKey}.mp3`);

        // Check if audio is already cached
        if (fs.existsSync(cacheFile)) {
            logger.info(`📦 Serving cached audio for: "${text}"`);
            res.set('Content-Type', 'audio/mpeg');
            res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
            return res.sendFile(cacheFile);
        }

        // Generate audio using Google Cloud TTS
        logger.info(`🔊 Generating TTS for: "${text}" (${lang})`);

        const request = {
            input: { text },
            voice: {
                languageCode: lang,
                // Use Neural2 voices for best quality (if available)
                name: lang === 'de-DE' ? 'de-DE-Neural2-C' :
                      lang === 'en-US' ? 'en-US-Neural2-F' :
                      lang === 'ru-RU' ? 'ru-RU-Wavenet-A' : undefined
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9, // Slightly slower for learning
                pitch: 0.0
            },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);

        // Save to cache
        fs.writeFileSync(cacheFile, response.audioContent, 'binary');
        logger.info(`✅ Audio generated and cached: ${cacheKey}.mp3`);

        // Send audio
        res.set('Content-Type', 'audio/mpeg');
        res.set('Cache-Control', 'public, max-age=31536000');
        res.send(Buffer.from(response.audioContent, 'binary'));

    } catch (err) {
        logger.error('❌ TTS generation failed:', err);
        res.status(500).json({ error: 'Failed to generate speech', details: err.message });
    }
});

// Diagnostic endpoint to check word distribution
app.get('/api/debug/word-stats/:userId/:languagePairId', async (req, res) => {
    try {
        const { userId, languagePairId } = req.params;

        const stats = await db.query(`
            SELECT
                status,
                COUNT(*) as count,
                array_agg(word ORDER BY word LIMIT 5) as sample_words
            FROM words
            WHERE user_id = $1 AND language_pair_id = $2
            GROUP BY status
            ORDER BY status
        `, [parseInt(userId), parseInt(languagePairId)]);

        const reviewWords = await db.query(`
            SELECT id, word, status, points, next_review_date, interval_days
            FROM words
            WHERE user_id = $1 AND language_pair_id = $2
            AND status LIKE 'review_%'
            AND (next_review_date IS NULL OR next_review_date <= CURRENT_DATE)
            ORDER BY next_review_date
            LIMIT 10
        `, [parseInt(userId), parseInt(languagePairId)]);

        res.json({
            statusDistribution: stats.rows,
            readyForReview: reviewWords.rows,
            totalReadyForReview: reviewWords.rows.length
        });
    } catch (err) {
        logger.error('Error getting word stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Temporary endpoint to run thematic collections import
app.post('/api/admin/import-thematic-collections', async (req, res) => {
    try {
        const { createThematicCollections } = require('./scripts/create-german-a1-thematic-collections.js');
        await createThematicCollections();
        res.json({ success: true, message: 'Thematic collections imported successfully' });
    } catch (error) {
        logger.error('Failed to import thematic collections:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        logger.info(`Words Learning Server running on port ${PORT}`);
        logger.info(`Open http://localhost:${PORT} in your browser`);
    });
}

startServer().catch(err => {
    logger.error('Failed to start server:', err);
    process.exit(1);
});
