const { Client } = require('pg');

async function checkTranslations() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    await client.connect();

    try {
        // Check a few words
        const words = await client.query(`
            SELECT
                swg.id,
                swg.word,
                swg.level,
                swg.theme,
                swg.example_de,
                t.translation,
                t.example_en
            FROM source_words_german swg
            LEFT JOIN target_translations_english t
                ON swg.id = t.source_word_id AND t.source_lang = 'de'
            WHERE swg.id IN (1, 2, 3, 4, 5, 4659)
            ORDER BY swg.id
        `);

        console.log('Sample words with translations:');
        words.rows.forEach(w => {
            console.log(`${w.id}: ${w.word} → ${w.translation || 'NO TRANSLATION'}`);
        });

        // Count how many words have translations
        const stats = await client.query(`
            SELECT
                COUNT(*) as total_words,
                COUNT(t.translation) as with_translation,
                COUNT(*) - COUNT(t.translation) as without_translation
            FROM source_words_german swg
            LEFT JOIN target_translations_english t
                ON swg.id = t.source_word_id AND t.source_lang = 'de'
        `);

        console.log(`\nTranslation coverage:`);
        console.log(`  Total words: ${stats.rows[0].total_words}`);
        console.log(`  With translation: ${stats.rows[0].with_translation}`);
        console.log(`  Without translation: ${stats.rows[0].without_translation}`);

    } finally {
        await client.end();
    }
}

checkTranslations();
