const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function createTable() {
    const client = await pool.connect();

    try {
        console.log('=== Создание таблицы target_translations_spanish_from_de ===\n');

        await client.query(`
            CREATE TABLE IF NOT EXISTS target_translations_spanish_from_de (
                source_word_id INTEGER PRIMARY KEY REFERENCES source_words_german(id) ON DELETE CASCADE,
                target_word_id INTEGER NOT NULL REFERENCES source_words_spanish(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(source_word_id, target_word_id)
            )
        `);

        console.log('✅ Таблица target_translations_spanish_from_de создана');

        // Check if it exists
        const check = await client.query(`
            SELECT tablename FROM pg_tables
            WHERE tablename = 'target_translations_spanish_from_de'
        `);

        console.log('✅ Проверка:', check.rows);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createTable();
