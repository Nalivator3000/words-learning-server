const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function deletePlaceholders() {
    try {
        const result = await db.query("DELETE FROM target_translations_english_from_ar WHERE translation LIKE '[AR]%'");
        console.log(`Deleted ${result.rowCount} placeholder translations`);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.end();
    }
}

deletePlaceholders();
