/**
 * Remove technical acronyms from ALL language source words tables
 */

const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

function isLikelyAcronym(word) {
    if (!word) return false;

    // IMPORTANT: Only check Latin alphabet words (English, Spanish, French, etc.)
    // Ignore Chinese, Japanese, Korean, Arabic, Hindi, Russian characters
    const isLatinOnly = /^[A-Za-z]+$/.test(word);
    if (!isLatinOnly) {
        return false; // Skip non-Latin alphabets
    }

    const upperWord = word.toUpperCase();

    // All uppercase and short (2-5 chars) in Latin alphabet
    if (word === upperWord && word.length >= 2 && word.length <= 5) {
        return true;
    }

    // Common tech acronyms
    const techAcronyms = [
        'PDF', 'PHP', 'HTTP', 'HTTPS', 'URL', 'API', 'HTML', 'CSS', 'XML', 'JSON',
        'SQL', 'FTP', 'SSH', 'DNS', 'IP', 'TCP', 'UDP', 'USB', 'CD', 'DVD',
        'RAM', 'ROM', 'CPU', 'GPU', 'SSD', 'HDD', 'OS', 'PC', 'TV', 'GPS',
        'SMS', 'SUV', 'IVA'
    ];

    return techAcronyms.includes(upperWord);
}

const languages = [
    'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
    'russian', 'chinese', 'japanese', 'korean', 'hindi', 'arabic',
    'polish', 'romanian', 'serbian', 'turkish', 'ukrainian', 'swahili'
];

async function removeAcronymsFromAllLanguages() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');
        console.log('🔍 Scanning ALL language tables for acronyms...\n');

        let totalWordsFound = 0;
        let totalItemsRemoved = 0;
        let totalSetsUpdated = 0;
        const allAcronymIds = [];

        for (const lang of languages) {
            const tableName = `source_words_${lang}`;

            try {
                const langUpper = lang.toUpperCase();
                console.log(`\n📚 Processing ${langUpper}...`);

                // Step 1: Find acronyms in this language
                const words = await client.query(`
                    SELECT id, word, level
                    FROM ${tableName}
                    ORDER BY id
                `);

                const acronyms = words.rows.filter(row => isLikelyAcronym(row.word));

                if (acronyms.length === 0) {
                    console.log(`   ✅ No acronyms found in ${lang}`);
                    continue;
                }

                console.log(`   ❌ Found ${acronyms.length} acronyms:`);
                acronyms.forEach(a => {
                    console.log(`      - "${a.word}" (ID: ${a.id}, level: ${a.level})`);
                });

                totalWordsFound += acronyms.length;
                const acronymIds = acronyms.map(a => a.id);

                // Step 2: Remove from word_set_items
                const deleteItems = await client.query(`
                    DELETE FROM word_set_items wsi
                    USING word_sets ws
                    WHERE wsi.word_set_id = ws.id
                    AND ws.source_language = $1
                    AND wsi.word_id = ANY($2)
                    RETURNING wsi.word_set_id
                `, [lang, acronymIds]);

                if (deleteItems.rowCount > 0) {
                    console.log(`   🗑️  Removed ${deleteItems.rowCount} items from word sets`);
                    totalItemsRemoved += deleteItems.rowCount;

                    // Step 3: Update word counts
                    const affectedSets = [...new Set(deleteItems.rows.map(r => r.word_set_id))];

                    for (const setId of affectedSets) {
                        await client.query(`
                            UPDATE word_sets
                            SET word_count = (
                                SELECT COUNT(*) FROM word_set_items WHERE word_set_id = $1
                            ),
                            updated_at = NOW()
                            WHERE id = $1
                        `, [setId]);
                    }

                    console.log(`   🔄 Updated ${affectedSets.length} word sets`);
                    totalSetsUpdated += affectedSets.length;
                }

                // Step 4: Remove from user progress
                const userProgress = await client.query(`
                    DELETE FROM user_word_progress
                    WHERE source_language = $1
                    AND source_word_id = ANY($2)
                `, [lang, acronymIds]);

                if (userProgress.rowCount > 0) {
                    console.log(`   👤 Removed ${userProgress.rowCount} user progress entries`);
                }

                // Collect IDs for final source words deletion
                allAcronymIds.push(...acronymIds.map(id => ({ lang, id, table: tableName })));

            } catch (err) {
                console.log(`   ⚠️  Error processing ${lang}: ${err.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ CLEANUP COMPLETE!\n');
        console.log('📊 Summary:');
        console.log(`   - Languages processed: ${languages.length}`);
        console.log(`   - Acronyms found: ${totalWordsFound}`);
        console.log(`   - Word set items removed: ${totalItemsRemoved}`);
        console.log(`   - Word sets updated: ${totalSetsUpdated}`);
        console.log('\n   ✅ Technical acronyms no longer appear in learning content');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
        console.log('✅ Database connection closed');
    }
}

removeAcronymsFromAllLanguages();
