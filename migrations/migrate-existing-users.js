#!/usr/bin/env node
/**
 * Migrate existing user data from 'words' table to 'user_word_progress' table
 * For User #5 (399 words) and User #7 (25 words)
 */

require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 5
});

async function migrateUser(userId) {
    console.log(`\n📦 Migrating User #${userId}...`);

    // Get user's words from old table
    const wordsResult = await db.query(`
        SELECT * FROM words WHERE user_id = $1
        ORDER BY createdat ASC
    `, [userId]);

    if (wordsResult.rows.length === 0) {
        console.log(`  ⏭️  No words to migrate`);
        return 0;
    }

    console.log(`  Found ${wordsResult.rows.length} words to migrate`);

    // Get user's language pair to determine source language
    const langPairResult = await db.query(`
        SELECT id, from_lang, to_lang FROM language_pairs
        WHERE user_id = $1 AND is_active = true
        LIMIT 1
    `, [userId]);

    if (langPairResult.rows.length === 0) {
        console.log(`  ❌ No active language pair found for user #${userId}`);
        return 0;
    }

    const languagePairId = langPairResult.rows[0].id;
    const sourceLanguage = langPairResult.rows[0].from_lang;
    const tableName = `source_words_${sourceLanguage}`;

    console.log(`  Language pair: ${sourceLanguage} → ${langPairResult.rows[0].to_lang}`);
    console.log(`  Source table: ${tableName}`);

    let migrated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const word of wordsResult.rows) {
        try {
            // Find matching source word by word text
            const sourceWordResult = await db.query(`
                SELECT id FROM ${tableName}
                WHERE LOWER(word) = LOWER($1)
                LIMIT 1
            `, [word.word.trim()]);

            if (sourceWordResult.rows.length === 0) {
                // Word not found in source vocabulary
                // This can happen for custom user-added words
                notFound++;
                console.log(`  ⚠️  Word not found in ${tableName}: "${word.word}"`);
                continue;
            }

            const sourceWordId = sourceWordResult.rows[0].id;

            // Check if already migrated
            const existingProgress = await db.query(`
                SELECT id FROM user_word_progress
                WHERE user_id = $1 AND language_pair_id = $2
                AND source_language = $3 AND source_word_id = $4
            `, [userId, languagePairId, sourceLanguage, sourceWordId]);

            if (existingProgress.rows.length > 0) {
                skipped++;
                continue;
            }

            // Insert into user_word_progress
            await db.query(`
                INSERT INTO user_word_progress (
                    user_id, language_pair_id, source_language, source_word_id,
                    translation, example, example_translation,
                    status, correct_count, incorrect_count, total_reviews,
                    review_cycle, last_review_date, next_review_date, ease_factor,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            `, [
                userId,
                languagePairId,
                sourceLanguage,
                sourceWordId,
                word.translation || null,
                word.example || null,
                word.exampletranslation || null,
                word.status || 'studying',
                word.correctcount || 0,
                0, // incorrect_count (not tracked in old table)
                word.correctcount || 0, // total_reviews (approximate)
                word.reviewcycle || 0,
                word.lastreviewdate || null,
                word.nextreviewdate || null,
                2.50, // default ease_factor
                word.createdat || new Date(),
                word.updatedat || new Date()
            ]);

            migrated++;

            if (migrated % 50 === 0) {
                console.log(`  📊 Progress: ${migrated}/${wordsResult.rows.length} migrated...`);
            }

        } catch (error) {
            console.error(`  ❌ Error migrating word "${word.word}":`, error.message);
        }
    }

    console.log(`\n  ✅ User #${userId} migration complete:`);
    console.log(`     Migrated: ${migrated} words`);
    console.log(`     Skipped (already exist): ${skipped} words`);
    console.log(`     Not found in source: ${notFound} words`);

    return migrated;
}

async function run() {
    try {
        console.log('\n🔄 MIGRATING EXISTING USER DATA');
        console.log('='.repeat(70));

        // Check if user_word_progress table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'user_word_progress'
            )
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('\n❌ ERROR: user_word_progress table does not exist!');
            console.log('Run migration first: npm run db:migrate:progress');
            process.exit(1);
        }

        console.log('✅ user_word_progress table exists');

        // Get users with words in old table
        const usersWithWords = await db.query(`
            SELECT user_id, COUNT(*) as word_count
            FROM words
            GROUP BY user_id
            HAVING COUNT(*) > 0
            ORDER BY user_id
        `);

        if (usersWithWords.rows.length === 0) {
            console.log('\n⏭️  No users with words to migrate');
            await db.end();
            process.exit(0);
        }

        console.log(`\nFound ${usersWithWords.rows.length} users with words:`);
        usersWithWords.rows.forEach(row => {
            console.log(`  User #${row.user_id}: ${row.word_count} words`);
        });

        let totalMigrated = 0;

        // Migrate each user
        for (const userRow of usersWithWords.rows) {
            const migrated = await migrateUser(userRow.user_id);
            totalMigrated += migrated;
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ MIGRATION COMPLETE');
        console.log('='.repeat(70));
        console.log(`Total words migrated: ${totalMigrated}`);
        console.log('\nOld "words" table is still intact (not deleted)');
        console.log('You can verify the migration and then drop it if needed.');
        console.log('='.repeat(70));

        await db.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ MIGRATION FAILED');
        console.error('='.repeat(70));
        console.error('Error:', err.message);
        console.error('='.repeat(70));
        console.error(err.stack);
        await db.end();
        process.exit(1);
    }
}

run();
