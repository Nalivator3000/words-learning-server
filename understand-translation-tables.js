const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function understandTables() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        UNDERSTANDING TRANSLATION TABLE LOGIC                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('RULE: Table name indicates TARGET language (what user is LEARNING)\n');
    console.log('Examples:');
    console.log('  • target_translations_russian → Translation TO Russian');
    console.log('  • target_translations_english → Translation TO English');
    console.log('  • target_translations_spanish → Translation TO Spanish\n');

    console.log('═'.repeat(70) + '\n');

    // Test each assumption
    console.log('TEST 1: target_translations_english (should contain ENGLISH)\n');

    const englishSample = await pool.query(`
        SELECT sw.word as german, tt.translation, tt.source_lang
        FROM target_translations_english tt
        JOIN source_words_german sw ON sw.id = tt.source_word_id
        WHERE tt.source_lang = 'de'
        LIMIT 5
    `);

    englishSample.rows.forEach(row => {
        const hasEnglish = /[a-zA-Z]/.test(row.translation);
        const hasRussian = /[а-яА-ЯёЁ]/.test(row.translation);
        console.log(`  "${row.german}" → "${row.translation}" ${hasEnglish && !hasRussian ? '✅ English (correct)' : '⚠️'}`);
    });

    console.log('\n' + '═'.repeat(70) + '\n');
    console.log('TEST 2: target_translations_russian (should contain RUSSIAN)\n');

    const russianSample = await pool.query(`
        SELECT sw.word as german, tt.translation, tt.source_lang
        FROM target_translations_russian tt
        JOIN source_words_german sw ON sw.id = tt.source_word_id
        WHERE tt.source_lang = 'de'
        LIMIT 5
    `);

    russianSample.rows.forEach(row => {
        const hasRussian = /[а-яА-ЯёЁ]/.test(row.translation);
        const hasEnglish = /[a-zA-Z]/.test(row.translation) && !hasRussian;
        console.log(`  "${row.german}" → "${row.translation}" ${hasRussian ? '✅ Russian (correct)' : hasEnglish ? '⚠️ English (WRONG!)' : '?'}`);
    });

    console.log('\n' + '═'.repeat(70) + '\n');
    console.log('TEST 3: target_translations_spanish (should contain SPANISH)\n');

    const spanishSample = await pool.query(`
        SELECT sw.word as german, tt.translation, tt.source_lang
        FROM target_translations_spanish tt
        JOIN source_words_german sw ON sw.id = tt.source_word_id
        WHERE tt.source_lang = 'de'
        LIMIT 5
    `);

    spanishSample.rows.forEach(row => {
        const hasSpanish = /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(row.translation);
        const seemsEnglish = /\b(hello|thank|please|yes|no)\b/.test(row.translation.toLowerCase());
        console.log(`  "${row.german}" → "${row.translation}" ${hasSpanish && !seemsEnglish ? '✅ Spanish?' : '⚠️ English?'}`);
    });

    console.log('\n' + '═'.repeat(70) + '\n');
    console.log('CONCLUSION:\n');

    // Check statistics for key tables
    const tables = [
        { name: 'target_translations_english', shouldBe: 'English', regex: '[a-zA-Z]' },
        { name: 'target_translations_russian', shouldBe: 'Russian', regex: '[а-яА-ЯёЁ]' },
        { name: 'target_translations_spanish', shouldBe: 'Spanish', regex: '[a-zA-ZáéíóúñÁÉÍÓÚÑ]' },
        { name: 'target_translations_french', shouldBe: 'French', regex: '[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]' }
    ];

    for (const table of tables) {
        try {
            const stats = await pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE translation ~ $1) as correct,
                    COUNT(*) FILTER (WHERE translation ~ '[a-zA-Z]' AND translation !~ '[а-яА-ЯёЁ]') as latin,
                    COUNT(*) as total
                FROM ${table.name}
                WHERE source_lang = 'de'
                    AND translation IS NOT NULL
                    AND translation != ''
            `, [table.regex]);

            const data = stats.rows[0];
            const correctPct = (data.correct / data.total * 100).toFixed(2);

            console.log(`${table.name}:`);
            console.log(`  Should contain: ${table.shouldBe}`);
            console.log(`  Has correct script: ${data.correct}/${data.total} (${correctPct}%)`);

            if (table.shouldBe === 'English') {
                console.log(`  ✅ ${data.latin === data.total ? 'All English - CORRECT!' : 'ISSUE!'}`);
            } else {
                const englishCount = parseInt(data.total) - parseInt(data.correct);
                if (englishCount > 100) {
                    console.log(`  ⚠️  Has ~${englishCount} English translations - SHOULD FIX!`);
                } else {
                    console.log(`  ✅ Mostly correct`);
                }
            }
            console.log('');
        } catch (error) {
            console.log(`${table.name}: Error - ${error.message}\n`);
        }
    }

    await pool.end();
}

understandTables().catch(console.error);
