const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testImport() {
    try {
        // Simulating import endpoint logic
        const setId = 1; // German A1 General set
        const userId = 1; // test user
        const languagePairId = 1; // German to English

        console.log('Testing import logic...\n');

        // Step 1: Get word set info
        console.log('1. Getting word set info...');
        const wordSetResult = await pool.query(
            'SELECT source_language, level, theme FROM word_sets WHERE id = $1',
            [setId]
        );
        const { source_language, level, theme } = wordSetResult.rows[0];
        console.log(`   Language: ${source_language}, Level: ${level}, Theme: ${theme}`);

        // Step 2: Get language pair info
        console.log('\n2. Getting language pair info...');
        const pairResult = await pool.query(
            'SELECT from_lang, to_lang FROM language_pairs WHERE id = $1',
            [languagePairId]
        );
        const { to_lang: target_language } = pairResult.rows[0];
        console.log(`   Pair: ${source_language} -> ${target_language}`);

        // Step 3: Get words from source table
        const sourceTableName = `source_words_${source_language}`;
        const translationTableName = `translations_${source_language}_to_${target_language}`;
        const exampleColumn = `example_${source_language.substring(0, 2)}`;

        console.log(`\n3. Getting words from ${sourceTableName}...`);
        console.log(`   Translation table: ${translationTableName}`);
        console.log(`   Example column: ${exampleColumn}`);

        const wordsResult = await pool.query(`
            SELECT
                s.id,
                s.word,
                s.level,
                s.theme,
                s.${exampleColumn} as example,
                t.translation,
                t.example_translation
            FROM ${sourceTableName} s
            LEFT JOIN ${translationTableName} t ON s.id = t.source_word_id
            WHERE s.level = $1
            ORDER BY s.id ASC
            LIMIT 1
        `, [level]);

        console.log(`   Found ${wordsResult.rows.length} words`);
        if (wordsResult.rows.length > 0) {
            console.log(`   Sample word:`, wordsResult.rows[0]);
        }

        // Step 4: Check if word exists in user_word_progress
        if (wordsResult.rows.length > 0) {
            const sourceWord = wordsResult.rows[0];
            console.log(`\n4. Checking if word exists in user_word_progress...`);

            const existingProgress = await pool.query(`
                SELECT id FROM user_word_progress
                WHERE user_id = $1
                AND language_pair_id = $2
                AND source_language = $3
                AND source_word_id = $4
            `, [userId, languagePairId, source_language, sourceWord.id]);

            console.log(`   Existing progress records: ${existingProgress.rows.length}`);

            if (existingProgress.rows.length === 0) {
                console.log(`\n5. Inserting word into user_word_progress...`);

                await pool.query(`
                    INSERT INTO user_word_progress (
                        user_id, language_pair_id, source_language, source_word_id,
                        status, correct_count, incorrect_count, total_reviews,
                        ease_factor, next_review_date, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, 'new', 0, 0, 0, 2.5, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `, [
                    userId,
                    languagePairId,
                    source_language,
                    sourceWord.id
                ]);

                console.log(`   ✓ Word inserted successfully!`);
            } else {
                console.log(`   Word already exists, skipping.`);
            }
        }

        console.log('\n✅ Import test completed successfully!');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Code:', err.code);
        console.error('Detail:', err.detail);
        console.error('Position:', err.position);
    } finally {
        await pool.end();
    }
}

testImport();
