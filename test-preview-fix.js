const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testPreviewFix() {
    const failingSetIds = [405, 407, 409, 384, 408];

    console.log('=== Testing Preview Fix ===\n');

    for (const setId of failingSetIds) {
        try {
            console.log(`\n--- Testing Set ID: ${setId} ---`);

            // Get word set info
            const setResult = await db.query(
                'SELECT * FROM word_sets WHERE id = $1',
                [setId]
            );

            if (setResult.rows.length === 0) {
                console.log(`  ERROR: Word set not found`);
                continue;
            }

            const wordSet = setResult.rows[0];
            const sourceTableName = `source_words_${wordSet.source_language}`;
            const limit = 5;

            // Build where conditions (same logic as endpoint)
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            if (wordSet.level) {
                whereConditions.push(`level = $${paramIndex}`);
                queryParams.push(wordSet.level);
                paramIndex++;
            }

            if (wordSet.theme && wordSet.theme !== 'general') {
                whereConditions.push(`theme = $${paramIndex}`);
                queryParams.push(wordSet.theme);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            queryParams.push(limit);

            // Test NEW query (only selecting 'word' column)
            const query = `
                SELECT word
                FROM ${sourceTableName}
                ${whereClause}
                ORDER BY word
                LIMIT $${paramIndex}
            `;

            console.log(`  Query: ${query.replace(/\s+/g, ' ')}`);
            console.log(`  Params: ${JSON.stringify(queryParams)}`);

            const wordsResult = await db.query(query, queryParams);
            console.log(`  ✓ SUCCESS: ${wordsResult.rows.length} words found`);

            if (wordsResult.rows.length > 0) {
                console.log(`  Sample words: ${wordsResult.rows.slice(0, 3).map(r => r.word).join(', ')}`);
            }

            // Simulate the response
            const response = {
                setId: wordSet.id,
                title: wordSet.title,
                level: wordSet.level,
                theme: wordSet.theme,
                wordCount: wordSet.word_count,
                preview: wordsResult.rows
            };

            console.log(`  Response structure: OK`);

        } catch (err) {
            console.log(`  ✗ FAILED: ${err.message}`);
        }
    }

    await db.end();
    console.log('\n=== Test Complete ===');
}

testPreviewFix().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
