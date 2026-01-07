const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTableStructure() {
    try {
        console.log('Checking table structure for target_translations_spanish_from_en...\n');

        const query = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'target_translations_spanish_from_en'
            ORDER BY ordinal_position;
        `;

        const result = await pool.query(query);

        console.log('Columns in target_translations_spanish_from_en:');
        console.log('='.repeat(60));
        result.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(30)} ${row.data_type.padEnd(20)} ${row.is_nullable}`);
        });

        console.log('\n\nSample data:');
        console.log('='.repeat(60));
        const sampleQuery = 'SELECT * FROM target_translations_spanish_from_en LIMIT 3';
        const sampleResult = await pool.query(sampleQuery);
        console.log(JSON.stringify(sampleResult.rows, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTableStructure();
