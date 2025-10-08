#!/usr/bin/env node

/**
 * Migrate words from words-data.json to PostgreSQL
 * Usage: node migrate-words.js <userId> <languagePairId>
 */

const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateWords(userId, languagePairId) {
    try {
        // Read words from JSON
        const data = JSON.parse(fs.readFileSync('words-data.json', 'utf8'));
        const words = data.words || [];

        console.log(`📚 Found ${words.length} words in words-data.json`);
        console.log(`👤 Migrating to user ${userId}, language pair ${languagePairId}...`);

        let migrated = 0;
        let skipped = 0;

        for (const word of words) {
            try {
                // Check if word already exists
                const existing = await db.query(
                    'SELECT id FROM words WHERE word = $1 AND user_id = $2 AND language_pair_id = $3',
                    [word.word, userId, languagePairId]
                );

                if (existing.rows.length > 0) {
                    console.log(`⏭️  Skipped: ${word.word} (already exists)`);
                    skipped++;
                    continue;
                }

                // Insert word
                await db.query(
                    `INSERT INTO words (
                        user_id, language_pair_id, word, translation,
                        example, exampleTranslation, status,
                        correctCount, totalCount, createdAt, updatedAt
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        userId,
                        languagePairId,
                        word.word,
                        word.translation,
                        word.example || '',
                        word.exampleTranslation || '',
                        word.status || 'studying',
                        word.correctCount || 0,
                        word.totalCount || 0,
                        word.createdAt || new Date().toISOString(),
                        word.updatedAt || new Date().toISOString()
                    ]
                );

                migrated++;
                if (migrated % 10 === 0) {
                    console.log(`✅ Migrated ${migrated}/${words.length} words...`);
                }
            } catch (error) {
                console.error(`❌ Error migrating word "${word.word}":`, error.message);
            }
        }

        console.log('\n🎉 Migration complete!');
        console.log(`✅ Migrated: ${migrated}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`❌ Failed: ${words.length - migrated - skipped}`);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Main execution
if (require.main === module) {
    const userId = process.argv[2];
    const languagePairId = process.argv[3];

    if (!userId || !languagePairId) {
        console.log('Usage: node migrate-words.js <userId> <languagePairId>');
        console.log('\nExample:');
        console.log('  node migrate-words.js 1 1');
        console.log('\nTo get userId and languagePairId:');
        console.log('  1. Register/login at http://localhost:3000');
        console.log('  2. Check browser console or contact support');
        process.exit(1);
    }

    console.log('🚀 Starting word migration...\n');
    migrateWords(parseInt(userId), parseInt(languagePairId))
        .then(() => {
            console.log('\n✨ All done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateWords };
