const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/words_learning'
});

/**
 * Fix source_language duplicates by deleting records with wrong source_language
 *
 * Strategy:
 * 1. Find all records with wrong source_language
 * 2. For each record, check if correct version exists
 * 3. If correct version exists, delete the wrong one
 * 4. If correct version doesn't exist, update the wrong one
 */
async function fixSourceLanguageDuplicates() {
    try {
        console.log('=== FIXING source_language DUPLICATES IN user_word_progress ===\n');

        // Language code to full name mapping
        const langCodeToName = {
            'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
            'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
            'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
            'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
            'sr': 'serbian', 'sw': 'swahili'
        };

        // Step 1: Find all records with wrong source_language
        console.log('Step 1: Finding records with wrong source_language...\n');

        const wrongRecordsQuery = `
            SELECT
                uwp.id,
                uwp.user_id,
                uwp.language_pair_id,
                uwp.source_language as current_source_language,
                uwp.source_word_id,
                lp.from_lang,
                CASE lp.from_lang
                    WHEN 'de' THEN 'german'
                    WHEN 'en' THEN 'english'
                    WHEN 'es' THEN 'spanish'
                    WHEN 'fr' THEN 'french'
                    WHEN 'ru' THEN 'russian'
                    WHEN 'it' THEN 'italian'
                    WHEN 'pt' THEN 'portuguese'
                    WHEN 'zh' THEN 'chinese'
                    WHEN 'ja' THEN 'japanese'
                    WHEN 'ko' THEN 'korean'
                    WHEN 'hi' THEN 'hindi'
                    WHEN 'ar' THEN 'arabic'
                    WHEN 'tr' THEN 'turkish'
                    WHEN 'uk' THEN 'ukrainian'
                    WHEN 'pl' THEN 'polish'
                    WHEN 'ro' THEN 'romanian'
                    WHEN 'sr' THEN 'serbian'
                    WHEN 'sw' THEN 'swahili'
                    ELSE lp.from_lang
                END as correct_source_language
            FROM user_word_progress uwp
            JOIN language_pairs lp ON uwp.language_pair_id = lp.id
            WHERE uwp.source_language != CASE lp.from_lang
                WHEN 'de' THEN 'german'
                WHEN 'en' THEN 'english'
                WHEN 'es' THEN 'spanish'
                WHEN 'fr' THEN 'french'
                WHEN 'ru' THEN 'russian'
                WHEN 'it' THEN 'italian'
                WHEN 'pt' THEN 'portuguese'
                WHEN 'zh' THEN 'chinese'
                WHEN 'ja' THEN 'japanese'
                WHEN 'ko' THEN 'korean'
                WHEN 'hi' THEN 'hindi'
                WHEN 'ar' THEN 'arabic'
                WHEN 'tr' THEN 'turkish'
                WHEN 'uk' THEN 'ukrainian'
                WHEN 'pl' THEN 'polish'
                WHEN 'ro' THEN 'romanian'
                WHEN 'sr' THEN 'serbian'
                WHEN 'sw' THEN 'swahili'
                ELSE lp.from_lang
            END
            ORDER BY uwp.user_id, uwp.language_pair_id, uwp.id
        `;

        const wrongRecords = await pool.query(wrongRecordsQuery);

        if (wrongRecords.rows.length === 0) {
            console.log('✅ No records with wrong source_language found!');
            return;
        }

        console.log(`Found ${wrongRecords.rows.length} records with wrong source_language\n`);

        // Step 2: Process each wrong record
        let deletedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const wrongRecord of wrongRecords.rows) {
            // Check if correct version exists
            const correctVersionQuery = `
                SELECT id FROM user_word_progress
                WHERE user_id = $1
                AND language_pair_id = $2
                AND source_language = $3
                AND source_word_id = $4
            `;

            const correctVersion = await pool.query(correctVersionQuery, [
                wrongRecord.user_id,
                wrongRecord.language_pair_id,
                wrongRecord.correct_source_language,
                wrongRecord.source_word_id
            ]);

            if (correctVersion.rows.length > 0) {
                // Correct version exists, delete the wrong one
                await pool.query('DELETE FROM user_word_progress WHERE id = $1', [wrongRecord.id]);
                deletedCount++;
                console.log(`✅ Deleted duplicate: user=${wrongRecord.user_id}, word_id=${wrongRecord.source_word_id}, wrong_lang=${wrongRecord.current_source_language}`);
            } else {
                // Correct version doesn't exist, update the wrong one
                await pool.query(
                    'UPDATE user_word_progress SET source_language = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [wrongRecord.correct_source_language, wrongRecord.id]
                );
                updatedCount++;
                console.log(`🔄 Updated: user=${wrongRecord.user_id}, word_id=${wrongRecord.source_word_id}, ${wrongRecord.current_source_language} → ${wrongRecord.correct_source_language}`);
            }
        }

        console.log(`\n=== SUMMARY ===`);
        console.log(`Deleted duplicates: ${deletedCount}`);
        console.log(`Updated records: ${updatedCount}`);
        console.log(`Total processed: ${deletedCount + updatedCount}\n`);

        // Step 3: Verify no more wrong records
        const verifyResult = await pool.query(wrongRecordsQuery);
        if (verifyResult.rows.length === 0) {
            console.log('✅ Success! All source_language values are now correct.\n');
        } else {
            console.log(`⚠️ Warning: Still found ${verifyResult.rows.length} wrong records after fix.\n`);
        }

        // Step 4: Show User 61 stats
        console.log('=== USER 61 FINAL STATUS ===\n');
        const user61Stats = await pool.query(`
            SELECT
                source_language,
                status,
                COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = 61
            GROUP BY source_language, status
            ORDER BY source_language, status
        `);

        console.log('Word counts by language and status:');
        user61Stats.rows.forEach(row => {
            console.log(`  ${row.source_language} - ${row.status}: ${row.count}`);
        });

        const user61Total = await pool.query(`
            SELECT COUNT(*) as total FROM user_word_progress WHERE user_id = 61
        `);
        console.log(`\nTotal words: ${user61Total.rows[0].total}`);

        // Check what API would return
        const apiResult = await pool.query(`
            SELECT
                status,
                COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = 61
            AND language_pair_id = 65
            AND source_language = 'english'
            GROUP BY status
        `);

        console.log('\nWhat /api/words/counts will return:');
        const counts = { new: 0, studying: 0, review: 0, learned: 0 };
        apiResult.rows.forEach(row => {
            counts[row.status] = parseInt(row.count);
        });
        console.log(`  New: ${counts.new}`);
        console.log(`  Studying: ${counts.studying}`);
        console.log(`  Total visible: ${counts.new + counts.studying + counts.review + counts.learned}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

fixSourceLanguageDuplicates();
