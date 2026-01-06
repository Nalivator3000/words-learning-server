const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkUsedPairs() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        WHICH LANGUAGE PAIRS ARE ACTUALLY USED?                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get all users and their language pairs
    const usersQuery = `
        SELECT DISTINCT
            u.id as user_id,
            u.email,
            lp.id as language_pair_id,
            lp.from_lang,
            lp.to_lang,
            uwp.source_language,
            COUNT(uwp.id) as word_count
        FROM users u
        JOIN user_word_progress uwp ON uwp.user_id = u.id
        JOIN language_pairs lp ON lp.id = uwp.language_pair_id
        GROUP BY u.id, u.email, lp.id, lp.from_lang, lp.to_lang, uwp.source_language
        ORDER BY u.email, lp.from_lang, lp.to_lang
    `;

    const result = await pool.query(usersQuery);

    console.log('Active language pairs by user:\n');
    console.log('User Email                | Source → Target           | Words | Pair ID');
    console.log('--------------------------|---------------------------|-------|--------');

    let currentUser = '';
    const languagePairStats = {};

    for (const row of result.rows) {
        if (currentUser !== row.email) {
            currentUser = row.email;
            console.log('');
        }

        const pairKey = `${row.from_lang} → ${row.to_lang}`;
        if (!languagePairStats[pairKey]) {
            languagePairStats[pairKey] = {
                users: 0,
                totalWords: 0,
                sourceLang: row.source_language,
                fromLang: row.from_lang,
                toLang: row.to_lang
            };
        }
        languagePairStats[pairKey].users++;
        languagePairStats[pairKey].totalWords += parseInt(row.word_count);

        console.log(
            `${row.email.padEnd(25)} | ` +
            `${row.from_lang} → ${row.to_lang}`.padEnd(25) + ` | ` +
            `${row.word_count.toString().padStart(5)} | ` +
            `${row.language_pair_id}`
        );
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\nSUMMARY BY LANGUAGE PAIR:\n');
    console.log('Source → Target           | Users | Total Words | Translation Table Needed');
    console.log('--------------------------|-------|-------------|-------------------------');

    const sortedPairs = Object.entries(languagePairStats)
        .sort((a, b) => b[1].users - a[1].users);

    for (const [pair, stats] of sortedPairs) {
        // Determine which translation table is needed
        // Language code mapping
        const langMap = {
            'russian': 'ru', 'english': 'en', 'spanish': 'es', 'german': 'de',
            'french': 'fr', 'italian': 'it', 'portuguese': 'pt', 'polish': 'pl',
            'ukrainian': 'uk', 'arabic': 'ar', 'chinese': 'zh', 'japanese': 'ja',
            'korean': 'ko', 'hindi': 'hi', 'turkish': 'tr', 'romanian': 'ro',
            'swahili': 'sw', 'serbian': 'sr'
        };

        const sourceCode = langMap[stats.sourceLang] || stats.sourceLang;
        const targetCode = langMap[stats.toLang] || stats.toLang;

        let tableName = '';
        if (sourceCode === 'de') {
            tableName = `target_translations_${targetCode}`;
        } else {
            tableName = `target_translations_${targetCode}_from_${sourceCode}`;
        }

        console.log(
            `${pair.padEnd(25)} | ` +
            `${stats.users.toString().padStart(5)} | ` +
            `${stats.totalWords.toString().padStart(11)} | ` +
            `${tableName}`
        );
    }

    // Now check which of these tables have English instead of correct language
    console.log('\n' + '═'.repeat(70));
    console.log('\nCHECKING WHICH USED TABLES HAVE ISSUES:\n');

    for (const [pair, stats] of sortedPairs) {
        // Language code mapping
        const langMap = {
            'russian': 'ru', 'english': 'en', 'spanish': 'es', 'german': 'de',
            'french': 'fr', 'italian': 'it', 'portuguese': 'pt', 'polish': 'pl',
            'ukrainian': 'uk', 'arabic': 'ar', 'chinese': 'zh', 'japanese': 'ja',
            'korean': 'ko', 'hindi': 'hi', 'turkish': 'tr', 'romanian': 'ro',
            'swahili': 'sw', 'serbian': 'sr'
        };

        const sourceCode = langMap[stats.sourceLang] || stats.sourceLang;
        const targetCode = langMap[stats.toLang] || stats.toLang;

        let tableName = '';
        if (sourceCode === 'de') {
            tableName = `target_translations_${targetCode}`;
        } else {
            tableName = `target_translations_${targetCode}_from_${sourceCode}`;
        }

        // Determine what script/alphabet the target language should use
        const targetLangScripts = {
            'ru': '[а-яА-ЯёЁ]',     // Russian - Cyrillic
            'en': '[a-zA-Z]',        // English - Latin
            'es': '[a-zA-ZáéíóúñÁÉÍÓÚÑ]', // Spanish - Latin with accents
            'de': '[a-zA-ZäöüßÄÖÜ]', // German - Latin with umlauts
            'fr': '[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]', // French
            'it': '[a-zA-ZàèéìòùÀÈÉÌÒÙ]', // Italian
            'pt': '[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]', // Portuguese
            'pl': '[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]', // Polish
            'uk': '[а-яА-ЯіїєґІЇЄҐ]', // Ukrainian
            'ar': '[ا-ي]',           // Arabic
            'zh': '[一-龯]',         // Chinese
            'ja': '[あ-んア-ン一-龯]', // Japanese
            'ko': '[가-힣]',         // Korean
            'hi': '[अ-ह]',          // Hindi
            'tr': '[a-zA-ZçğıöşüÇĞİÖŞÜ]', // Turkish
            'ro': '[a-zA-ZăâîșțĂÂÎȘȚ]', // Romanian
            'sw': '[a-zA-Z]',        // Swahili (uses Latin)
            'sr': '[а-яА-Яa-zA-Z]'   // Serbian (both Cyrillic and Latin)
        };

        const targetScript = targetLangScripts[targetCode] || '[a-zA-Z]';

        try {
            // Check if table exists and has source_lang column
            let checkQuery = '';
            const hasSourceLangColumn = await pool.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = $1 AND column_name = 'source_lang'
            `, [tableName]);

            if (hasSourceLangColumn.rows.length > 0) {
                // Has source_lang column
                checkQuery = `
                    SELECT
                        COUNT(*) FILTER (WHERE translation ~ $1) as correct_script,
                        COUNT(*) FILTER (
                            WHERE translation ~ '[a-zA-Z]'
                                AND translation !~ $1
                                ${targetCode === 'en' ? "AND translation ~ '^[a-zA-Z0-9\\\\s\\\\-\\\\.,:;!?\\'\\\"()]+$'" : ''}
                        ) as english_script,
                        COUNT(*) as total
                    FROM ${tableName}
                    WHERE source_lang = $2
                        AND translation IS NOT NULL
                        AND translation != ''
                `;
                const check = await pool.query(checkQuery, [targetScript, sourceCode]);
                const data = check.rows[0];

                const correctPct = (data.correct_script / data.total * 100).toFixed(2);
                const englishPct = (data.english_script / data.total * 100).toFixed(2);

                const status = data.english_script > 100 ? '⚠️  HAS ISSUES' : '✅ OK';

                console.log(`${tableName}:`);
                console.log(`  Total: ${data.total} | Correct: ${data.correct_script} (${correctPct}%) | English: ${data.english_script} (${englishPct}%) ${status}`);
            } else {
                // No source_lang column
                checkQuery = `
                    SELECT
                        COUNT(*) FILTER (WHERE translation ~ $1) as correct_script,
                        COUNT(*) FILTER (
                            WHERE translation ~ '[a-zA-Z]'
                                AND translation !~ $1
                        ) as english_script,
                        COUNT(*) as total
                    FROM ${tableName}
                    WHERE translation IS NOT NULL
                        AND translation != ''
                `;
                const check = await pool.query(checkQuery, [targetScript]);
                const data = check.rows[0];

                const correctPct = (data.correct_script / data.total * 100).toFixed(2);
                const englishPct = (data.english_script / data.total * 100).toFixed(2);

                const status = data.english_script > 100 ? '⚠️  HAS ISSUES' : '✅ OK';

                console.log(`${tableName}:`);
                console.log(`  Total: ${data.total} | Correct: ${data.correct_script} (${correctPct}%) | English: ${data.english_script} (${englishPct}%) ${status}`);
            }
        } catch (error) {
            console.log(`${tableName}: ⚠️  Error - ${error.message}`);
        }
    }

    await pool.end();
}

checkUsedPairs().catch(console.error);
