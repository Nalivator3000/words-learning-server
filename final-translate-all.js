const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

// Load all dictionaries
const basicDict = require('./comprehensive-de-ru-dictionary.js');
const massiveDict = require('./massive-de-ru-dictionary.js');
const extendedDict = require('./extended-de-ru-dictionary.js');
const ultraDict = require('./ultra-complete-dictionary.js');
const finalBatchDict = require('./final-batch-dictionary.js');
const absoluteFinalDict = require('./absolute-final-dictionary.js');
const completeAllRemaining = require('./complete-all-remaining.js');
const ultimateFinalDict = require('./ultimate-final-dictionary.js');

// Merge all dictionaries
const COMPLETE_DICTIONARY = { ...basicDict, ...massiveDict, ...extendedDict, ...ultraDict, ...finalBatchDict, ...absoluteFinalDict, ...completeAllRemaining, ...ultimateFinalDict };

console.log(`Loaded ${Object.keys(COMPLETE_DICTIONARY).length} translations from dictionaries\n`);

async function finalTranslateAll() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           FINAL TRANSLATION - ALL REMAINING WORDS             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // Get all words with English translations
        const query = `
            SELECT
                tt.id as translation_id,
                tt.source_word_id,
                sw.word as german_word,
                tt.translation as current_translation
            FROM target_translations_russian tt
            JOIN source_words_german sw ON sw.id = tt.source_word_id
            WHERE tt.source_lang = 'de'
                AND tt.translation IS NOT NULL
                AND tt.translation != ''
                AND tt.translation ~ '[a-zA-Z]'
                AND tt.translation !~ '[а-яА-ЯёЁ]'
            ORDER BY tt.id
        `;

        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} words with English translations\n`);

        let translated = 0;
        let skipped = 0;
        const updates = [];

        for (const row of result.rows) {
            if (COMPLETE_DICTIONARY[row.german_word]) {
                updates.push({
                    id: row.translation_id,
                    german: row.german_word,
                    english: row.current_translation,
                    russian: COMPLETE_DICTIONARY[row.german_word]
                });
                translated++;
            } else {
                skipped++;
            }
        }

        console.log(`✅ Can translate ${translated} words using dictionaries`);
        console.log(`⏭️  Will skip ${skipped} words (not in dictionaries)\n`);

        if (updates.length === 0) {
            console.log('No translations to update');
            await pool.end();
            return;
        }

        console.log(`Updating ${updates.length} translations in database...\n`);

        let updated = 0;
        for (const item of updates) {
            const updateQuery = `
                UPDATE target_translations_russian
                SET translation = $1
                WHERE id = $2
            `;

            await pool.query(updateQuery, [item.russian, item.id]);
            updated++;

            if (updated % 100 === 0) {
                console.log(`Progress: ${updated}/${updates.length} updated`);
            }
        }

        console.log(`\n✅ Successfully updated ${updated} translations!\n`);

        // Show statistics
        const statsQuery = `
            SELECT COUNT(*) as count
            FROM target_translations_russian tt
            WHERE tt.source_lang = 'de'
                AND tt.translation IS NOT NULL
                AND tt.translation != ''
                AND tt.translation ~ '[a-zA-Z]'
                AND tt.translation !~ '[а-яА-ЯёЁ]'
        `;

        const stats = await pool.query(statsQuery);
        console.log(`📊 Remaining English translations: ${stats.rows[0].count}`);

        // Show sample of what was updated
        console.log('\nSample updates (first 20):');
        updates.slice(0, 20).forEach((item, i) => {
            console.log(`${i + 1}. "${item.german}" → EN: "${item.english}" → RU: "${item.russian}"`);
        });

        // Save still remaining
        const stillNeedTranslation = result.rows
            .filter(row => !COMPLETE_DICTIONARY[row.german_word])
            .map(row => ({
                german: row.german_word,
                english: row.current_translation
            }));

        fs.writeFileSync('final-remaining.json', JSON.stringify(stillNeedTranslation, null, 2));
        console.log(`\n📝 Saved ${stillNeedTranslation.length} words still needing translation to final-remaining.json`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }

    await pool.end();
}

finalTranslateAll().catch(console.error);
