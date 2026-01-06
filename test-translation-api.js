const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testTranslation() {
    try {
        // Test the same words user added
        const testWords = ['apple', 'haus', 'building', 'feir'];

        console.log('\n🧪 Testing translation API...\n');

        for (const word of testWords) {
            console.log(`\n📝 Testing: "${word}" (en → de)`);

            // Try Google Translate directly
            try {
                const translate = require('@vitalets/google-translate-api');

                const result = await translate(word, {
                    from: 'en',
                    to: 'de'
                });

                console.log(`✅ Google Translate: "${word}" → "${result.text}"`);
                console.log(`   Source: ${result.from.language.iso}`);
            } catch (err) {
                console.log(`❌ Google Translate failed:`, err.message);
            }

            // Also try database lookup
            try {
                const dbResult = await pool.query(`
                    SELECT
                        sw.word as target_word,
                        tt.translation as source_word
                    FROM source_words_de sw
                    INNER JOIN target_translations_en_from_de tt ON sw.id = tt.source_word_id
                    WHERE LOWER(tt.translation) = LOWER($1)
                    LIMIT 3
                `, [word]);

                if (dbResult.rows.length > 0) {
                    console.log(`📚 Database found ${dbResult.rows.length} matches:`);
                    dbResult.rows.forEach(row => {
                        console.log(`   "${row.source_word}" → "${row.target_word}"`);
                    });
                } else {
                    console.log(`📚 Database: No matches found`);
                }
            } catch (dbErr) {
                console.log(`📚 Database error:`, dbErr.message);
            }
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Test error:', error);
        process.exit(1);
    }
}

testTranslation();
