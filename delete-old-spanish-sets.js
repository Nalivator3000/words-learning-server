/**
 * Script to delete old large Spanish word sets (A1-C2) and keep only thematic collections
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function deleteOldSpanishSets() {
    try {
        console.log('\n🗑️  Удаление старых больших наборов для испанского языка...\n');

        // Удаляем наборы без темы (старые большие наборы)
        const deleteResult = await pool.query(`
            DELETE FROM word_sets
            WHERE source_language = 'spanish'
            AND theme IS NULL
            RETURNING id, title, word_count
        `);

        if (deleteResult.rowCount > 0) {
            console.log(`✅ Удалено наборов: ${deleteResult.rowCount}\n`);
            console.log('Удалённые наборы:');
            deleteResult.rows.forEach(set => {
                console.log(`   - ${set.title} (ID: ${set.id}, ${set.word_count} слов)`);
            });
        } else {
            console.log('⚠️  Старых наборов не найдено');
        }

        console.log('\n✅ Готово!\n');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

deleteOldSpanishSets();
