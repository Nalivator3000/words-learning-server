const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function verifyLogic() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          VERIFICATION: TRANSLATION TABLE LOGIC                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // 1. Check target_translations_russian (should have RUSSIAN text)
    console.log('1. Checking target_translations_russian (should contain RUSSIAN):');
    const russianSample = await pool.query(`
        SELECT sw.word as german, tt.translation as russian, tt.source_lang
        FROM target_translations_russian tt
        JOIN source_words_german sw ON sw.id = tt.source_word_id
        WHERE tt.source_lang = 'de'
        LIMIT 5
    `);

    console.log('   Sample from target_translations_russian:');
    russianSample.rows.forEach(row => {
        const hasRussian = /[а-яА-ЯёЁ]/.test(row.russian);
        const hasEnglish = /[a-zA-Z]/.test(row.russian) && !/[а-яА-ЯёЁ]/.test(row.russian);
        console.log(`   "${row.german}" → "${row.russian}" ${hasRussian ? '✅ Russian' : hasEnglish ? '⚠️  English' : '?'}`);
    });

    // 2. Check target_translations_english (should have ENGLISH text)
    console.log('\n2. Checking target_translations_english (should contain ENGLISH):');
    const englishSample = await pool.query(`
        SELECT sw.word as german, tt.translation as english, tt.source_lang
        FROM target_translations_english tt
        JOIN source_words_german sw ON sw.id = tt.source_word_id
        WHERE tt.source_lang = 'de'
        LIMIT 5
    `);

    console.log('   Sample from target_translations_english:');
    englishSample.rows.forEach(row => {
        const hasEnglish = /[a-zA-Z]/.test(row.english);
        console.log(`   "${row.german}" → "${row.english}" ${hasEnglish ? '✅ English (correct!)' : '⚠️  Not English'}`);
    });

    // 3. Check german_from_ru (Russian → German, should have GERMAN text)
    console.log('\n3. Checking german_from_ru (should contain GERMAN):');
    try {
        const germanFromRuSample = await pool.query(`
            SELECT
                (SELECT word FROM source_words_russian WHERE id = tt.source_word_id LIMIT 1) as russian,
                tt.translation as german,
                tt.source_lang
            FROM target_translations_german_from_ru tt
            LIMIT 5
        `);

        console.log('   Sample from german_from_ru:');
        germanFromRuSample.rows.forEach(row => {
            const hasEnglish = /[a-zA-Z]/.test(row.german) && !/[а-яА-ЯёЁ]/.test(row.german);
            const seemsGerman = /\b(der|die|das|ein|eine)\s/.test(row.german);
            console.log(`   "${row.russian}" → "${row.german}" ${seemsGerman ? '✅ German' : hasEnglish ? '⚠️  English' : '?'}`);
        });
    } catch (error) {
        console.log('   ⚠️  Error:', error.message);
    }

    // 4. Understanding the naming convention
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    NAMING CONVENTION                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    console.log('Table name format: target_translations_{TARGET_LANGUAGE}_from_{SOURCE}');
    console.log('');
    console.log('Examples:');
    console.log('  • target_translations_russian → German source → Russian target');
    console.log('    (default naming, source_lang column indicates source)');
    console.log('  • target_translations_english_from_ru → Russian → English');
    console.log('  • target_translations_german_from_ru → Russian → German');
    console.log('');

    // 5. Check what we actually fixed
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              VERIFICATION OF OUR FIXES                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const ourFixCheck = await pool.query(`
        SELECT
            COUNT(*) FILTER (WHERE translation ~ '[а-яА-ЯёЁ]') as russian_count,
            COUNT(*) FILTER (WHERE translation ~ '[a-zA-Z]' AND translation !~ '[а-яА-ЯёЁ]') as english_count,
            COUNT(*) as total
        FROM target_translations_russian
        WHERE source_lang = 'de'
            AND translation IS NOT NULL
            AND translation != ''
    `);

    const stats = ourFixCheck.rows[0];
    console.log('target_translations_russian (de → ru):');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Russian: ${stats.russian_count} (${(stats.russian_count/stats.total*100).toFixed(2)}%) ✅`);
    console.log(`  English: ${stats.english_count} (${(stats.english_count/stats.total*100).toFixed(2)}%) ${stats.english_count <= 5 ? '✅' : '⚠️'}`);

    // 6. Check if we broke anything
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           DID WE BREAK target_translations_english?          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const englishCheck = await pool.query(`
        SELECT
            COUNT(*) FILTER (WHERE translation ~ '[a-zA-Z]') as english_count,
            COUNT(*) FILTER (WHERE translation ~ '[а-яА-ЯёЁ]') as russian_count,
            COUNT(*) as total
        FROM target_translations_english
        WHERE source_lang = 'de'
            AND translation IS NOT NULL
            AND translation != ''
    `);

    const englishStats = englishCheck.rows[0];
    console.log('target_translations_english (de → en):');
    console.log(`  Total: ${englishStats.total}`);
    console.log(`  English: ${englishStats.english_count} (${(englishStats.english_count/englishStats.total*100).toFixed(2)}%) ${englishStats.english_count > englishStats.total * 0.9 ? '✅ Correct!' : '⚠️'}`);
    console.log(`  Russian: ${englishStats.russian_count} (${(englishStats.russian_count/englishStats.total*100).toFixed(2)}%) ${englishStats.russian_count === '0' ? '✅' : '⚠️  PROBLEM!'}`);

    await pool.end();
}

verifyLogic().catch(console.error);
