const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkStructure() {
    const client = await pool.connect();

    try {
        console.log('=== Структура таблицы target_translations_german_from_en ===\n');

        const res = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'target_translations_german_from_en'
            ORDER BY ordinal_position
        `);

        res.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });

        console.log('\n=== Первые 5 записей ===\n');
        const sample = await client.query('SELECT * FROM target_translations_german_from_en LIMIT 5');
        console.log(sample.rows);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkStructure();
