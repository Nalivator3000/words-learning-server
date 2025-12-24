const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function deleteA2Collections() {
    const client = await db.connect();
    try {
        const result = await client.query(
            `DELETE FROM global_word_collections WHERE name LIKE 'German A2:%' RETURNING id, name`
        );

        console.log(`Deleted ${result.rows.length} A2 collections:`);
        result.rows.forEach(row => {
            console.log(`  - [${row.id}] ${row.name}`);
        });
    } catch (error) {
        console.error('Error deleting A2 collections:', error);
        throw error;
    } finally {
        client.release();
        await db.end();
    }
}

deleteA2Collections()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
