const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugPreviewErrors() {
    const failingSetIds = [405, 407, 409, 384, 408, 385, 387, 388, 389, 386, 390, 412, 391, 411, 410];

    console.log('=== Debugging Preview Endpoint Errors ===\n');

    for (const setId of failingSetIds) {
        try {
            console.log(`\n--- Set ID: ${setId} ---`);

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
            console.log(`  Title: ${wordSet.title}`);
            console.log(`  Source Language: ${wordSet.source_language}`);
            console.log(`  Level: ${wordSet.level}`);
            console.log(`  Theme: ${wordSet.theme}`);
            console.log(`  Word Count: ${wordSet.word_count}`);

            const sourceTableName = `source_words_${wordSet.source_language}`;
            console.log(`  Source Table: ${sourceTableName}`);

            // Check if table exists
            const tableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = $1
                )
            `, [sourceTableName]);

            console.log(`  Table Exists: ${tableCheck.rows[0].exists}`);

            if (!tableCheck.rows[0].exists) {
                console.log(`  SKIP: Source table does not exist`);
                continue;
            }

            // Check if columns exist
            const columnsCheck = await db.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                AND column_name IN ('word', 'example', 'level', 'theme')
            `, [sourceTableName]);

            console.log(`  Available columns: ${columnsCheck.rows.map(r => r.column_name).join(', ')}`);

            // Try the actual query
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

            queryParams.push(5); // limit

            const query = `
                SELECT word, example
                FROM ${sourceTableName}
                ${whereClause}
                ORDER BY word
                LIMIT $${paramIndex}
            `;

            console.log(`  Query: ${query.replace(/\s+/g, ' ')}`);
            console.log(`  Params: ${JSON.stringify(queryParams)}`);

            const wordsResult = await db.query(query, queryParams);
            console.log(`  Result: ${wordsResult.rows.length} words found`);

            if (wordsResult.rows.length > 0) {
                console.log(`  Sample word: ${wordsResult.rows[0].word}`);
            }

        } catch (err) {
            console.log(`  QUERY ERROR: ${err.message}`);
            console.log(`  Error detail: ${err.detail || 'N/A'}`);
            console.log(`  Error code: ${err.code || 'N/A'}`);
        }
    }

    await db.end();
}

debugPreviewErrors().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
