const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
    try {
        const result = await db.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'source_words_german'
            ORDER BY ordinal_position
        `);

        console.log('Columns in source_words_german:');
        result.rows.forEach(r => {
            console.log(`  ${r.column_name} (${r.data_type})`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.end();
    }
}

checkSchema();
