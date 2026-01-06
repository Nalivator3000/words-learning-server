const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function recheckCorrectly() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     CORRECT CHECK: Are tables using the RIGHT language?      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Define what each target language should look like
    const targetLanguageChecks = {
        'russian': {
            correctRegex: '[а-яА-ЯёЁ]',
            wrongRegex: 'translation ~ \'^[a-zA-Z0-9\\s\\-.,;:!?\'"()]+$\'', // Pure English
            name: 'Russian (Cyrillic)'
        },
        'english': {
            correctRegex: '[a-zA-Z]',
            wrongRegex: '[а-яА-ЯёЁ]', // Has Russian
            name: 'English'
        },
        'ukrainian': {
            correctRegex: '[а-яА-ЯіїєґІЇЄҐ]',
            wrongRegex: 'translation ~ \'^[a-zA-Z0-9\\s\\-.,;:!?\'"()]+$\'',
            name: 'Ukrainian (Cyrillic)'
        },
        'arabic': {
            correctRegex: '[ا-ي]',
            wrongRegex: 'translation ~ \'^[a-zA-Z0-9\\s\\-.,;:!?\'"()]+$\'',
            name: 'Arabic'
        },
        'chinese': {
            correctRegex: '[一-龯]',
            wrongRegex: 'translation ~ \'^[a-zA-Z0-9\\s\\-.,;:!?\'"()]+$\'',
            name: 'Chinese (Hanzi)'
        },
        'japanese': {
            correctRegex: '[あ-んア-ン一-龯]',
            wrongRegex: 'translation ~ \'^[a-zA-Z0-9\\s\\-.,;:!?\'"()]+$\'',
            name: 'Japanese (Hiragana/Katakana/Kanji)'
        },
        'korean': {
            correctRegex: '[가-힣]',
            wrongRegex: 'translation ~ \'^[a-zA-Z0-9\\s\\-.,;:!?\'"()]+$\'',
            name: 'Korean (Hangul)'
        },
        'hindi': {
            correctRegex: '[अ-ह]',
            wrongRegex: 'translation ~ \'^[a-zA-Z0-9\\s\\-.,;:!?\'"()]+$\'',
            name: 'Hindi (Devanagari)'
        }
    };

    // Latin-script languages (should have Latin but NOT pure English)
    const latinLanguages = ['spanish', 'french', 'italian', 'portuguese', 'german', 'polish', 'romanian', 'turkish', 'swahili', 'serbian'];

    console.log('Checking non-Latin script languages:\n');

    const issues = [];

    for (const [lang, check] of Object.entries(targetLanguageChecks)) {
        const tableName = `target_translations_${lang}`;

        try {
            const query = `
                SELECT
                    COUNT(*) FILTER (WHERE translation ~ $1) as has_correct,
                    COUNT(*) FILTER (WHERE ${check.wrongRegex}) as has_wrong,
                    COUNT(*) as total
                FROM ${tableName}
                WHERE source_lang = 'de'
                    AND translation IS NOT NULL
                    AND translation != ''
            `;

            const result = await pool.query(query, [check.correctRegex]);
            const data = result.rows[0];

            const correctPct = (data.has_correct / data.total * 100).toFixed(2);
            const wrongPct = (data.has_wrong / data.total * 100).toFixed(2);

            console.log(`${tableName}:`);
            console.log(`  Expected: ${check.name}`);
            console.log(`  Has correct: ${data.has_correct}/${data.total} (${correctPct}%)`);
            console.log(`  Has wrong: ${data.has_wrong}/${data.total} (${wrongPct}%)`);

            if (parseFloat(wrongPct) > 10) {
                console.log(`  ⚠️  PROBLEM: Too much English!\n`);
                issues.push({
                    table: tableName,
                    lang: lang,
                    wrongCount: parseInt(data.has_wrong),
                    wrongPct: parseFloat(wrongPct)
                });
            } else {
                console.log(`  ✅ OK\n`);
            }
        } catch (error) {
            console.log(`  Error: ${error.message}\n`);
        }
    }

    console.log('═'.repeat(70));
    console.log('\nChecking Latin-script languages (harder to detect):\n');

    for (const lang of latinLanguages) {
        const tableName = `target_translations_${lang}`;

        try {
            // Sample a few words to manually verify
            const sample = await pool.query(`
                SELECT translation
                FROM ${tableName}
                WHERE source_lang = 'de'
                    AND translation IS NOT NULL
                    AND translation != ''
                LIMIT 10
            `);

            console.log(`${tableName}: Sample words -`, sample.rows.map(r => r.translation).join(', '));
        } catch (error) {
            console.log(`${tableName}: Error - ${error.message}`);
        }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\nSUMMARY:\n');

    if (issues.length === 0) {
        console.log('✅ All non-Latin script languages are correct!');
    } else {
        console.log(`⚠️  Found ${issues.length} tables with issues:\n`);
        issues.forEach(issue => {
            console.log(`  • ${issue.table}: ${issue.wrongCount} words (${issue.wrongPct}%) are in English instead of ${issue.lang}`);
        });
    }

    await pool.end();
}

recheckCorrectly().catch(console.error);
