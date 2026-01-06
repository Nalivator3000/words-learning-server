const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

const LANG_CODE_TO_FULL_NAME = {
    'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
    'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
    'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
    'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
    'sr': 'serbian', 'sw': 'swahili'
};

async function checkAllTranslationsCoverage() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     CHECKING TRANSLATION COVERAGE FOR ALL USERS & PAIRS       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // Get all active language pairs with user info
        const pairsQuery = `
            SELECT
                lp.id as pair_id,
                lp.user_id,
                u.name as user_name,
                u.email,
                lp.from_lang,
                lp.to_lang,
                COUNT(uwp.id) as total_words
            FROM language_pairs lp
            JOIN users u ON u.id = lp.user_id
            LEFT JOIN user_word_progress uwp ON uwp.language_pair_id = lp.id AND uwp.user_id = lp.user_id
            GROUP BY lp.id, lp.user_id, u.name, u.email, lp.from_lang, lp.to_lang
            HAVING COUNT(uwp.id) > 0
            ORDER BY u.email, lp.from_lang, lp.to_lang
        `;

        const pairs = await pool.query(pairsQuery);
        console.log(`Found ${pairs.rows.length} active language pairs with words\n`);

        let totalIssues = 0;
        const problematicPairs = [];

        for (const pair of pairs.rows) {
            const fromLang = LANG_CODE_TO_FULL_NAME[pair.from_lang] || pair.from_lang;
            const toLang = LANG_CODE_TO_FULL_NAME[pair.to_lang] || pair.to_lang;
            const sourceTable = `source_words_${fromLang}`;
            const translationTable = `target_translations_${toLang}`;

            console.log(`\n📊 User: ${pair.user_name} (${pair.email})`);
            console.log(`   Language Pair: ${pair.from_lang} → ${pair.to_lang} (ID: ${pair.pair_id})`);
            console.log(`   Total words in progress: ${pair.total_words}`);

            // Check translation coverage
            const coverageQuery = `
                SELECT
                    COUNT(*) FILTER (WHERE tt.translation IS NULL OR tt.translation = '') as missing_count,
                    COUNT(*) as total_count,
                    ROUND(100.0 * COUNT(*) FILTER (WHERE tt.translation IS NOT NULL AND tt.translation != '') / NULLIF(COUNT(*), 0), 2) as coverage_percent
                FROM user_word_progress uwp
                JOIN ${sourceTable} sw ON sw.id = uwp.source_word_id
                LEFT JOIN ${translationTable} tt ON tt.source_word_id = sw.id AND tt.source_lang = $1
                WHERE uwp.user_id = $2 AND uwp.language_pair_id = $3
            `;

            try {
                const coverage = await pool.query(coverageQuery, [pair.from_lang, pair.user_id, pair.pair_id]);
                const result = coverage.rows[0];
                const missingCount = parseInt(result.missing_count || 0);
                const totalCount = parseInt(result.total_count || 0);
                const coveragePercent = parseFloat(result.coverage_percent || 0);

                console.log(`   Translation coverage: ${coveragePercent}% (${totalCount - missingCount}/${totalCount} words)`);

                if (missingCount > 0) {
                    console.log(`   ⚠️  ISSUE: ${missingCount} words missing translations!`);
                    totalIssues += missingCount;
                    problematicPairs.push({
                        user: pair.user_name,
                        email: pair.email,
                        pair: `${pair.from_lang} → ${pair.to_lang}`,
                        missing: missingCount,
                        total: totalCount,
                        coverage: coveragePercent
                    });
                } else {
                    console.log(`   ✅ All words have translations`);
                }
            } catch (error) {
                console.log(`   ❌ ERROR checking coverage: ${error.message}`);
            }
        }

        // Summary
        console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                          SUMMARY                              ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

        if (problematicPairs.length === 0) {
            console.log('✅ NO ISSUES FOUND! All language pairs have complete translations.\n');
        } else {
            console.log(`⚠️  Found ${problematicPairs.length} language pairs with missing translations:\n`);
            problematicPairs.forEach((p, i) => {
                console.log(`${i + 1}. ${p.user} (${p.email})`);
                console.log(`   ${p.pair}: ${p.missing} missing (${p.coverage}% coverage)`);
            });
            console.log(`\n📊 Total missing translations across all users: ${totalIssues}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }

    await pool.end();
}

checkAllTranslationsCoverage().catch(console.error);
