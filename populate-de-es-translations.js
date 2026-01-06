const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function populateTranslations() {
    const client = await pool.connect();

    try {
        console.log('=== Заполнение таблицы target_translations_spanish_from_de ===\n');

        // Get count of German words
        const germanCount = await client.query('SELECT COUNT(*) FROM source_words_german');
        console.log(`📊 Немецких слов: ${germanCount.rows[0].count}`);

        // Get count of Spanish words
        const spanishCount = await client.query('SELECT COUNT(*) FROM source_words_spanish');
        console.log(`📊 Испанских слов: ${spanishCount.rows[0].count}`);

        // Insert translations based on matching English translations
        const result = await client.query(`
            INSERT INTO target_translations_spanish_from_de (source_word_id, target_word_id)
            SELECT DISTINCT
                de.source_word_id,
                es.target_word_id
            FROM target_translations_german_from_en de
            JOIN target_translations_spanish_from_en es ON de.target_word_id = es.source_word_id
            WHERE de.source_word_id IS NOT NULL
              AND es.target_word_id IS NOT NULL
            ON CONFLICT (source_word_id, target_word_id) DO NOTHING
        `);

        console.log(`✅ Создано переводов German→Spanish: ${result.rowCount}`);

        // Check final count
        const finalCount = await client.query('SELECT COUNT(*) FROM target_translations_spanish_from_de');
        console.log(`📊 Всего переводов в таблице: ${finalCount.rows[0].count}`);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error(error.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

populateTranslations();
