const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

// Load comprehensive dictionary
const comprehensiveDict = require('./comprehensive-de-ru-dictionary.js');

// Previous dictionary (from translate-english-to-russian.js)
const basicDict = {
    // Pronouns
    "ich": "я",
    "du": "ты",
    "er": "он",
    "sie": "они",
    "es": "оно",
    "wir": "мы",
    "ihr": "вы (мн.ч.)",
    "Sie": "Вы (вежл.)",
    // ... (add all from previous dictionary)
};

// Merge dictionaries
const FULL_DICTIONARY = { ...basicDict, ...comprehensiveDict };

async function translateAllRemaining() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║      TRANSLATING ALL REMAINING WITH EXPANDED DICTIONARY        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        const data = JSON.parse(fs.readFileSync('english-to-russian-translations.json', 'utf8'));
        console.log(`Loaded ${data.length} total words\n`);

        let translated = 0;
        let skipped = 0;
        const updates = [];

        for (const item of data) {
            if (FULL_DICTIONARY[item.german]) {
                item.russian = FULL_DICTIONARY[item.german];
                updates.push(item);
                translated++;
            } else {
                skipped++;
            }
        }

        console.log(`✅ Translated ${translated} words using dictionary`);
        console.log(`⏭️  Skipped ${skipped} words (not in dictionary)\n`);

        if (updates.length === 0) {
            console.log('No new translations to update');
            return;
        }

        console.log(`Updating ${updates.length} translations in database...\n`);

        let updated = 0;
        for (const item of updates) {
            const query = `
                UPDATE target_translations_russian
                SET translation = $1
                WHERE id = $2
            `;

            await pool.query(query, [item.russian, item.translation_id]);
            updated++;

            if (updated % 50 === 0) {
                console.log(`Progress: ${updated}/${updates.length} updated`);
            }
        }

        console.log(`\n✅ Successfully updated ${updated} translations!\n`);

        // Check how many Demo User words are now fixed
        const demoCheckQuery = `
            SELECT COUNT(*) as count
            FROM user_word_progress uwp
            JOIN source_words_german sw ON sw.id = uwp.source_word_id
            LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id AND tt.source_lang = 'de'
            WHERE uwp.user_id = 5
                AND uwp.language_pair_id = 7
                AND tt.translation IS NOT NULL
                AND tt.translation != ''
                AND tt.translation ~ '[a-zA-Z]'
                AND tt.translation !~ '[а-яА-ЯёЁ]'
        `;

        const demoCheck = await pool.query(demoCheckQuery);
        console.log(`📊 Demo User still has ${demoCheck.rows[0].count} words with English translations`);

        // Save still remaining
        const stillRemaining = data.filter(item => !item.russian);
        fs.writeFileSync('still-remaining.json', JSON.stringify(stillRemaining, null, 2));
        console.log(`📝 Saved ${stillRemaining.length} words still needing translation to still-remaining.json`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }

    await pool.end();
}

translateAllRemaining().catch(console.error);
