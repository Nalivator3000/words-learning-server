const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

// Simple translation function using basic rules
// For production, you'd use Google Translate API, DeepL, or similar
function simpleGermanToRussian(germanWord) {
    // This is a placeholder - in real scenario, use translation API
    // For now, return null to indicate needs external translation
    return null;
}

async function autoTranslateAll() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         AUTO-TRANSLATING REMAINING GERMAN→RUSSIAN             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // Load remaining words
        const remaining = JSON.parse(fs.readFileSync('remaining-to-translate.json', 'utf8'));
        console.log(`Loaded ${remaining.length} words to translate\n`);

        console.log('📝 Creating batch file for external translation...\n');

        // Create a simple batch file format: German|English|Russian
        const batchLines = remaining.map(item =>
            `${item.german}|${item.english}|`
        );

        fs.writeFileSync('batch-translate.txt', batchLines.join('\n'));
        console.log(`✅ Saved ${batchLines.length} words to batch-translate.txt`);

        console.log('\n📋 Format: GERMAN|ENGLISH|RUSSIAN (to be filled)');
        console.log('\nNext steps:');
        console.log('1. Open batch-translate.txt');
        console.log('2. Use translation tool (Google Translate, DeepL, etc.) to fill Russian column');
        console.log('3. Run apply-batch-translations.js to update database');

        // Also create a prioritized list for Demo User's words
        console.log('\n\n🎯 Creating priority list for Demo User...\n');

        const demoQuery = `
            SELECT DISTINCT sw.id, sw.word
            FROM user_word_progress uwp
            JOIN source_words_german sw ON sw.id = uwp.source_word_id
            LEFT JOIN target_translations_russian tt ON tt.source_word_id = sw.id AND tt.source_lang = 'de'
            WHERE uwp.user_id = 5
                AND uwp.language_pair_id = 7
                AND tt.translation IS NOT NULL
                AND tt.translation ~ '[a-zA-Z]'
                AND tt.translation !~ '[а-яА-ЯёЁ]'
            ORDER BY sw.id
        `;

        const demoWords = await pool.query(demoQuery);
        const demoList = remaining.filter(item =>
            demoWords.rows.some(row => row.word === item.german)
        );

        fs.writeFileSync('priority-demo-user.txt',
            demoList.map(item => `${item.german}|${item.english}|`).join('\n')
        );

        console.log(`✅ Saved ${demoList.length} priority words to priority-demo-user.txt`);
        console.log('\nThese are the words currently used by Demo User');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await pool.end();
}

autoTranslateAll().catch(console.error);
