const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkAllLanguages() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     CHECKING ALL LANGUAGES FOR ENGLISH TRANSLATIONS           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get all target translation tables
    const tablesQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
            AND table_name LIKE 'target_translations_%'
        ORDER BY table_name
    `;

    const tables = await pool.query(tablesQuery);

    const results = [];

    for (const table of tables.rows) {
        const tableName = table.table_name;
        const targetLang = tableName.replace('target_translations_', '');

        // Check for English translations (Latin characters without Cyrillic)
        const checkQuery = `
            SELECT
                COUNT(*) FILTER (WHERE translation IS NOT NULL AND translation != '') as total_translations,
                COUNT(*) FILTER (
                    WHERE translation IS NOT NULL
                        AND translation != ''
                        AND translation ~ '[a-zA-Z]'
                        AND translation !~ '[а-яА-ЯёЁ]'
                        AND translation !~ '[α-ωΑ-Ω]'
                        AND translation !~ '[א-ת]'
                        AND translation !~ '[ا-ي]'
                        AND translation !~ '[ა-ჰ]'
                        AND translation !~ '[ሀ-ፐ]'
                        AND translation !~ '[あ-ん]'
                        AND translation !~ '[ア-ン]'
                        AND translation !~ '[一-龯]'
                        AND translation !~ '[가-힣]'
                        AND translation !~ '[ก-๛]'
                        AND translation !~ '[ა-ჰ]'
                ) as english_count,
                source_lang
            FROM ${tableName}
            GROUP BY source_lang
        `;

        try {
            const langResults = await pool.query(checkQuery);

            for (const row of langResults.rows) {
                if (row.total_translations > 0) {
                    const percentage = ((row.english_count / row.total_translations) * 100).toFixed(2);

                    results.push({
                        targetLang,
                        sourceLang: row.source_lang,
                        total: parseInt(row.total_translations),
                        english: parseInt(row.english_count),
                        percentage: parseFloat(percentage)
                    });
                }
            }
        } catch (error) {
            console.log(`⚠️  Error checking ${tableName}:`, error.message);
        }
    }

    // Sort by percentage of English translations (highest first)
    results.sort((a, b) => b.percentage - a.percentage);

    console.log('Results by language pair:\n');
    console.log('Target Lang | Source | Total | English | % English | Status');
    console.log('------------|--------|-------|---------|-----------|--------');

    for (const result of results) {
        const status = result.english > 0 ? '⚠️  ISSUE' : '✅ OK';
        const percentage = result.percentage.toFixed(2).padStart(6);

        console.log(
            `${result.targetLang.padEnd(11)} | ` +
            `${(result.sourceLang || 'N/A').padEnd(6)} | ` +
            `${result.total.toString().padStart(5)} | ` +
            `${result.english.toString().padStart(7)} | ` +
            `${percentage}% | ` +
            `${status}`
        );
    }

    // Summary
    const problemPairs = results.filter(r => r.english > 0);
    const totalEnglish = results.reduce((sum, r) => sum + r.english, 0);

    console.log('\n' + '═'.repeat(70));
    console.log('\nSUMMARY:');
    console.log(`  Total language pairs checked: ${results.length}`);
    console.log(`  Pairs with English translations: ${problemPairs.length}`);
    console.log(`  Total English translations found: ${totalEnglish}`);

    if (problemPairs.length > 0) {
        console.log('\n⚠️  ATTENTION: The following language pairs have English translations:\n');
        problemPairs.forEach(pair => {
            console.log(`  • ${pair.sourceLang} → ${pair.targetLang}: ${pair.english} words (${pair.percentage.toFixed(2)}%)`);
        });
    } else {
        console.log('\n✅ PERFECT! No English translations found in any language pair.');
    }

    await pool.end();
}

checkAllLanguages().catch(console.error);
