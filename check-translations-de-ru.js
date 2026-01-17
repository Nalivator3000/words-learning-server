// Check why German->Russian translations are missing
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkTranslations() {
    try {
        // 1. Check if target_translations_russian exists and has de translations
        console.log('\n=== 1. Checking target_translations_russian ===');
        const russianTable = await pool.query(`
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN source_lang = 'de' THEN 1 END) as german_count
            FROM target_translations_russian
        `);
        console.log('Total rows:', russianTable.rows[0].total);
        console.log('German source rows:', russianTable.rows[0].german_count);

        // 2. Check if target_translations_russian_from_de exists
        console.log('\n=== 2. Checking target_translations_russian_from_de ===');
        try {
            const fromDeTable = await pool.query(`
                SELECT COUNT(*) as total FROM target_translations_russian_from_de
            `);
            console.log('Total rows:', fromDeTable.rows[0].total);
        } catch (e) {
            console.log('Table does not exist:', e.message);
        }

        // 3. Get sample words from user_word_progress for user 5, language pair 7
        console.log('\n=== 3. Sample words from user progress ===');
        const userWords = await pool.query(`
            SELECT uwp.source_word_id, uwp.source_language, sw.word
            FROM user_word_progress uwp
            JOIN source_words_german sw ON sw.id = uwp.source_word_id
            WHERE uwp.user_id = 5 AND uwp.language_pair_id = 7
            LIMIT 10
        `);
        console.log('User words sample:');
        userWords.rows.forEach(r => console.log(`  ID: ${r.source_word_id}, Lang: ${r.source_language}, Word: ${r.word}`));

        // 4. Check if these words have translations
        console.log('\n=== 4. Checking translations for these words ===');
        const wordIds = userWords.rows.map(r => r.source_word_id);

        // Try target_translations_russian
        const translations = await pool.query(`
            SELECT source_word_id, translation, source_lang
            FROM target_translations_russian
            WHERE source_word_id = ANY($1)
        `, [wordIds]);
        console.log('Found in target_translations_russian:', translations.rows.length);
        translations.rows.forEach(r => console.log(`  ID: ${r.source_word_id}, source_lang: ${r.source_lang}, translation: ${r.translation}`));

        // 5. Check what source_lang values exist in target_translations_russian
        console.log('\n=== 5. Source languages in target_translations_russian ===');
        const sourceLangs = await pool.query(`
            SELECT source_lang, COUNT(*) as count
            FROM target_translations_russian
            GROUP BY source_lang
        `);
        sourceLangs.rows.forEach(r => console.log(`  ${r.source_lang}: ${r.count} rows`));

        // 6. Check columns in target_translations_russian
        console.log('\n=== 6. Columns in target_translations_russian ===');
        const columns = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'target_translations_russian'
            ORDER BY ordinal_position
        `);
        columns.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkTranslations();
