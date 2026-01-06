const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_word_progress'
            ORDER BY ordinal_position
        `);

        console.log('\n=== user_word_progress table columns ===\n');
        result.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        console.log(`\nTotal columns: ${result.rows.length}`);

        // Check if source_language column exists
        const hasSourceLanguage = result.rows.some(row => row.column_name === 'source_language');
        console.log(`\nsource_language column exists: ${hasSourceLanguage ? 'YES ✓' : 'NO ✗'}`);

        if (!hasSourceLanguage) {
            console.log('\n⚠️  WARNING: source_language column is MISSING!');
            console.log('This will cause import errors. Migration needed.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkColumns();
