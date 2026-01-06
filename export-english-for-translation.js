const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function exportEnglishForTranslation() {
    console.log('Exporting English translations that need to be replaced with Russian...\n');

    try {
        const query = `
            SELECT
                tt.id as translation_id,
                tt.source_word_id,
                sw.word as german_word,
                tt.translation as english_translation,
                sw.example_de as german_example
            FROM target_translations_russian tt
            JOIN source_words_german sw ON sw.id = tt.source_word_id
            WHERE tt.source_lang = 'de'
                AND tt.translation IS NOT NULL
                AND tt.translation != ''
                AND tt.translation ~ '[a-zA-Z]'
                AND tt.translation !~ '[а-яА-ЯёЁ]'
            ORDER BY tt.source_word_id
        `;

        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} words to translate\n`);

        // Export as JSON for processing
        const data = result.rows.map(row => ({
            translation_id: row.translation_id,
            source_word_id: row.source_word_id,
            german: row.german_word,
            english: row.english_translation,
            example_de: row.german_example || '',
            russian: '' // To be filled by translation script
        }));

        fs.writeFileSync('english-to-russian-translations.json', JSON.stringify(data, null, 2));
        console.log('✅ Exported to english-to-russian-translations.json');

        // Also export as CSV for manual review
        const csv = [
            'translation_id,source_word_id,german,english,russian',
            ...data.map(row =>
                `${row.translation_id},${row.source_word_id},"${row.german}","${row.english}",""`
            )
        ].join('\n');

        fs.writeFileSync('english-to-russian-translations.csv', csv);
        console.log('✅ Exported to english-to-russian-translations.csv');

        // Show sample
        console.log('\nSample (first 20 rows):');
        data.slice(0, 20).forEach((row, i) => {
            console.log(`${i + 1}. "${row.german}" → EN: "${row.english}" → RU: ?`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await pool.end();
}

exportEnglishForTranslation().catch(console.error);
