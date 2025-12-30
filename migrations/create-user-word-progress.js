#!/usr/bin/env node
/**
 * Create user_word_progress table for SRS (Spaced Repetition System)
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
    console.log('\n📊 Creating user_word_progress table for SRS...\n');

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_word_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                word_id INTEGER NOT NULL,
                language_pair_id INTEGER,
                
                -- SRS Algorithm fields (SM-2)
                repetitions INTEGER DEFAULT 0,
                ease_factor DECIMAL(3,2) DEFAULT 2.5,
                interval INTEGER DEFAULT 0,
                next_review_date TIMESTAMP,
                last_review_date TIMESTAMP,
                
                -- Performance tracking
                correct_count INTEGER DEFAULT 0,
                incorrect_count INTEGER DEFAULT 0,
                quality_avg DECIMAL(3,2),
                
                -- Gamification
                total_xp INTEGER DEFAULT 0,
                
                -- Metadata
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Constraints
                UNIQUE(user_id, word_id, language_pair_id)
            )
        `);

        console.log('✅ Table created: user_word_progress');

        // Create indexes for performance
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_word_progress_user_id 
            ON user_word_progress(user_id)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_word_progress_next_review 
            ON user_word_progress(user_id, next_review_date)
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_word_progress_word_id 
            ON user_word_progress(word_id)
        `);

        console.log('✅ Indexes created');

        // Add gamification columns to users table if not exists
        console.log('\n📊 Adding gamification columns to users table...');

        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_study_date TIMESTAMP
        `);

        console.log('✅ Gamification columns added to users table');

        console.log('\n✅ Migration completed successfully!\n');

        await db.end();
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await db.end();
        process.exit(1);
    }
}

migrate();
