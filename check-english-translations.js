const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkEnglishTranslations() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║      CHECKING ENGLISH TRANSLATIONS IN RUSSIAN TABLE          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // First, let's see what "change" and "glass" are in the database
        console.log('🔍 Looking for words matching screenshots...\n');

        const searchQuery = `
            SELECT
                sw.id,
                sw.word as german_word,
                tt.translation as russian_translation,
                tt.source_lang
            FROM source_words_german sw
            LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id AND tt.source_lang = 'de'
            WHERE sw.word ILIKE '%wechsel%' OR sw.word ILIKE '%glas%'
            ORDER BY sw.id
            LIMIT 10
        `;

        const searchResult = await pool.query(searchQuery);
        console.log('Words matching "change" or "glass":');
        searchResult.rows.forEach(row => {
            console.log(`   German: "${row.german_word}" → Russian: "${row.russian_translation || 'NULL'}"`);
        });

        // Now check for English translations in Russian table
        console.log('\n\n🔍 Checking for ENGLISH text in target_translations_russian...\n');

        const englishCheckQuery = `
            SELECT
                tt.source_word_id,
                sw.word as german_word,
                tt.translation,
                tt.source_lang,
                -- Check if translation contains Latin characters (likely English)
                tt.translation ~ '[a-zA-Z]' as has_latin,
                -- Check if translation contains Cyrillic (Russian)
                tt.translation ~ '[а-яА-ЯёЁ]' as has_cyrillic
            FROM target_translations_russian tt
            JOIN source_words_german sw ON sw.id = tt.source_word_id
            WHERE tt.source_lang = 'de'
                AND tt.translation IS NOT NULL
                AND tt.translation != ''
                -- Has Latin but no Cyrillic = likely English
                AND tt.translation ~ '[a-zA-Z]'
                AND tt.translation !~ '[а-яА-ЯёЁ]'
            LIMIT 20
        `;

        const englishResult = await pool.query(englishCheckQuery);

        if (englishResult.rows.length > 0) {
            console.log(`⚠️  Found ${englishResult.rows.length} English translations (should be Russian):\n`);
            englishResult.rows.forEach((row, i) => {
                console.log(`${i + 1}. German: "${row.german_word}" → Translation: "${row.translation}"`);
            });

            // Count total
            const countQuery = `
                SELECT COUNT(*) as count
                FROM target_translations_russian tt
                WHERE tt.source_lang = 'de'
                    AND tt.translation IS NOT NULL
                    AND tt.translation != ''
                    AND tt.translation ~ '[a-zA-Z]'
                    AND tt.translation !~ '[а-яА-ЯёЁ]'
            `;
            const countResult = await pool.query(countQuery);
            console.log(`\n📊 Total English translations in Russian table: ${countResult.rows[0].count}`);

        } else {
            console.log('✅ No English translations found in Russian table');
        }

        // Check what Demo User sees
        console.log('\n\n🔍 Checking Demo User\'s available words...\n');

        const demoQuery = `
            SELECT
                sw.id,
                sw.word as german_word,
                tt.translation,
                uwp.status,
                tt.translation ~ '[a-zA-Z]' AND tt.translation !~ '[а-яА-ЯёЁ]' as is_english
            FROM user_word_progress uwp
            JOIN source_words_german sw ON sw.id = uwp.source_word_id
            LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id AND tt.source_lang = 'de'
            WHERE uwp.user_id = 5
                AND uwp.language_pair_id = 7
                AND tt.translation IS NOT NULL
                AND tt.translation != ''
                AND tt.translation ~ '[a-zA-Z]'
                AND tt.translation !~ '[а-яА-ЯёЁ]'
            ORDER BY sw.id
        `;

        const demoResult = await pool.query(demoQuery);
        console.log(`Demo User has ${demoResult.rows.length} words with English translations:\n`);
        demoResult.rows.slice(0, 20).forEach((row, i) => {
            console.log(`${i + 1}. ID: ${row.id}, German: "${row.german_word}" → English: "${row.translation}"`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }

    await pool.end();
}

checkEnglishTranslations().catch(console.error);
