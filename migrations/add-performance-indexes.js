#!/usr/bin/env node
/**
 * Add database indexes for performance optimization
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addIndexes() {
    console.log('\n⚡ Adding Performance Indexes...\n');

    const indexes = [
        // Source words tables - for word lookups
        { table: 'source_words_german', column: 'word', name: 'idx_german_word' },
        { table: 'source_words_german', column: 'level', name: 'idx_german_level' },
        { table: 'source_words_english', column: 'word', name: 'idx_english_word' },
        { table: 'source_words_english', column: 'level', name: 'idx_english_level' },
        { table: 'source_words_spanish', column: 'word', name: 'idx_spanish_word' },
        { table: 'source_words_spanish', column: 'level', name: 'idx_spanish_level' },
        { table: 'source_words_french', column: 'word', name: 'idx_french_word' },
        { table: 'source_words_french', column: 'level', name: 'idx_french_level' },
        { table: 'source_words_chinese', column: 'word', name: 'idx_chinese_word' },
        { table: 'source_words_chinese', column: 'level', name: 'idx_chinese_level' },

        // Users table - for authentication and queries
        { table: 'users', column: 'email', name: 'idx_users_email' },
        { table: 'users', column: 'google_id', name: 'idx_users_google_id' },
        { table: 'users', column: 'total_xp', name: 'idx_users_xp' },
        { table: 'users', column: 'level', name: 'idx_users_level' },

        // Word sets
        { table: 'word_sets', column: 'language_pair', name: 'idx_word_sets_lang_pair' },
        { table: 'word_sets', column: 'level', name: 'idx_word_sets_level' },
        { table: 'word_sets', column: 'is_official', name: 'idx_word_sets_official' },
    ];

    let created = 0;
    let skipped = 0;

    for (const idx of indexes) {
        try {
            await db.query(`
                CREATE INDEX IF NOT EXISTS ${idx.name}
                ON ${idx.table}(${idx.column})
            `);
            console.log(`✅ ${idx.name} on ${idx.table}(${idx.column})`);
            created++;
        } catch (error) {
            console.log(`⚠️  Skipped ${idx.name}:`, error.message);
            skipped++;
        }
    }

    // Composite indexes for common queries
    console.log('\n📊 Adding composite indexes...\n');

    const compositeIndexes = [
        {
            table: 'user_word_progress',
            columns: ['user_id', 'next_review_date'],
            name: 'idx_user_progress_review'
        },
        {
            table: 'users',
            columns: ['total_xp', 'level'],
            name: 'idx_users_xp_level'
        }
    ];

    for (const idx of compositeIndexes) {
        try {
            await db.query(`
                CREATE INDEX IF NOT EXISTS ${idx.name}
                ON ${idx.table}(${idx.columns.join(', ')})
            `);
            console.log(`✅ ${idx.name} on ${idx.table}(${idx.columns.join(', ')})`);
            created++;
        } catch (error) {
            console.log(`⚠️  Skipped ${idx.name}:`, error.message);
            skipped++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Indexing completed!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('='.repeat(60) + '\n');

    await db.end();
}

addIndexes().catch(err => {
    console.error('❌ Error adding indexes:', err);
    db.end();
    process.exit(1);
});
