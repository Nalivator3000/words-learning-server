const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function populate() {
    const client = await pool.connect();

    try {
        console.log('=== Заполнение target_translations_spanish_from_de из user_word_progress ===\n');

        // Get user ID for DE→ES pair
        const userResult = await client.query(`
            SELECT id, name FROM users WHERE email = 'test.de.es@lexibooster.test'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ Пользователь test.de.es@lexibooster.test не найден');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log(`✅ Найден пользователь: ${userResult.rows[0].name} (ID: ${userId})`);

        // Get language pair ID
        const lpResult = await client.query(`
            SELECT id FROM language_pairs
            WHERE user_id = $1 AND from_language = 'de' AND to_language = 'es'
        `, [userId]);

        if (lpResult.rows.length === 0) {
            console.log('❌ Языковая пара DE→ES не найдена');
            return;
        }

        const lpId = lpResult.rows[0].id;
        console.log(`✅ Найдена языковая пара: ID ${lpId}`);

        // Get words from user_word_progress
        const wordsResult = await client.query(`
            SELECT source_word_id, COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = $1 AND language_pair_id = $2 AND source_language = 'german'
            GROUP BY source_word_id
        `, [userId, lpId]);

        console.log(`📊 Найдено слов в user_word_progress: ${wordsResult.rows.length}`);

        if (wordsResult.rows.length === 0) {
            console.log('⚠️  Нет данных для заполнения');
            return;
        }

        // Now try to create mappings based on word matching
        // Since we don't have direct translations, let's use Claude API or manual approach
        console.log('\n⚠️  Для полного заполнения нужны переводы через промежуточный язык или API');
        console.log('Пока таблица пуста, но создана и готова к заполнению');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

populate();
