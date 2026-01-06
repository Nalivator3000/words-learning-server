const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkGermanWordSets() {
    try {
        console.log('🔍 Checking German word sets...\n');

        // Get all word sets for German
        const setsResult = await db.query(`
            SELECT
                id,
                title,
                description,
                source_language,
                target_language,
                level,
                theme,
                word_count,
                is_public,
                created_at
            FROM word_sets
            WHERE source_language = 'german'
            ORDER BY level ASC, word_count DESC, title ASC
        `);

        if (setsResult.rows.length === 0) {
            console.log('❌ No German word sets found!\n');
        } else {
            console.log(`✅ Found ${setsResult.rows.length} word sets\n`);
            console.log('═══════════════════════════════════════════════════════════════════\n');

            for (const set of setsResult.rows) {
                console.log(`📚 ${set.title}`);
                console.log(`   ID: ${set.id}`);
                console.log(`   Word count (metadata): ${set.word_count}`);

                // Check actual word count in word_set_words table
                const wordsResult = await db.query(`
                    SELECT COUNT(*) as actual_count
                    FROM word_set_words
                    WHERE word_set_id = $1
                `, [set.id]);

                const actualCount = parseInt(wordsResult.rows[0].actual_count);
                console.log(`   Actual words in DB: ${actualCount}`);

                if (actualCount === 0) {
                    console.log(`   ⚠️  WARNING: This set has NO WORDS!`);
                } else if (actualCount !== set.word_count) {
                    console.log(`   ⚠️  WARNING: Word count mismatch! (metadata: ${set.word_count}, actual: ${actualCount})`);
                }

                console.log(`   Level: ${set.level || 'not specified'}`);
                console.log(`   Theme: ${set.theme || 'not specified'}`);
                console.log(`   Target language: ${set.target_language}`);
                console.log(`   Public: ${set.is_public ? 'Yes' : 'No'}`);
                console.log(`   Description: ${set.description || 'no description'}`);
                console.log('   ───────────────────────────────────────────────────────────────\n');
            }

            console.log('═══════════════════════════════════════════════════════════════════');
        }

        // Check specifically for "German A1: Essential Vocabulary 2"
        console.log('\n🔎 Checking specifically for "German A1: Essential Vocabulary 2"...\n');

        const specificSet = await db.query(`
            SELECT * FROM word_sets
            WHERE title LIKE '%Essential Vocabulary 2%'
        `);

        if (specificSet.rows.length > 0) {
            const set = specificSet.rows[0];
            console.log(`Found set: ${set.title} (ID: ${set.id})`);

            const words = await db.query(`
                SELECT * FROM word_set_words
                WHERE word_set_id = $1
                LIMIT 5
            `, [set.id]);

            if (words.rows.length > 0) {
                console.log('\nFirst 5 words:');
                words.rows.forEach((word, i) => {
                    console.log(`${i + 1}. ${word.source_word} - ${word.target_word}`);
                });
            } else {
                console.log('\n❌ NO WORDS FOUND for this set!');
            }
        } else {
            console.log('❌ "German A1: Essential Vocabulary 2" not found!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

checkGermanWordSets();
