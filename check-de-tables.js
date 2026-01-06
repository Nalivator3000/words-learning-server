const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkTables() {
    const client = await pool.connect();

    try {
        console.log('=== Таблицы для немецкого языка ===\n');

        const res = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE tablename LIKE '%from_de%' OR tablename LIKE '%german%'
            ORDER BY tablename
        `);

        console.log('Найдено таблиц:', res.rows.length);
        res.rows.forEach(row => console.log('  -', row.tablename));

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTables();
