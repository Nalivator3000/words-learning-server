const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkUser52() {
    const client = await pool.connect();

    try {
        console.log('🔍 Проверка пользователя test.de.es@lexibooster.test\n');

        // Get user
        const userResult = await client.query(`
            SELECT id, name, email FROM users WHERE email = 'test.de.es@lexibooster.test'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ Пользователь не найден');
            return;
        }

        const user = userResult.rows[0];
        console.log(`✅ Пользователь: ${user.name} (ID: ${user.id}, Email: ${user.email})\n`);

        // Get language pair
        const lpResult = await client.query(`
            SELECT id, from_lang, to_lang
            FROM language_pairs
            WHERE user_id = $1
        `, [user.id]);

        console.log(`📚 Языковые пары пользователя:`);
        lpResult.rows.forEach(lp => {
            console.log(`  - [${lp.id}] ${lp.from_lang} → ${lp.to_lang}`);
        });

        // Get DE→ES pair
        const deEsPair = lpResult.rows.find(lp =>
            lp.from_lang === 'de' && lp.to_lang === 'es'
        );

        if (!deEsPair) {
            console.log('\n❌ Пара DE→ES не найдена');
            return;
        }

        console.log(`\n✅ Используем пару: ${deEsPair.from_lang} → ${deEsPair.to_lang} (ID: ${deEsPair.id})\n`);

        // Check user_word_progress
        const progressResult = await client.query(`
            SELECT
                uwp.source_word_id,
                uwp.source_language,
                uwp.status,
                sw.word as source_word
            FROM user_word_progress uwp
            LEFT JOIN source_words_german sw ON uwp.source_word_id = sw.id
            WHERE uwp.user_id = $1 AND uwp.language_pair_id = $2
            ORDER BY uwp.source_word_id
            LIMIT 100
        `, [user.id, deEsPair.id]);

        console.log(`📊 Слов в user_word_progress: ${progressResult.rows.length}\n`);

        if (progressResult.rows.length > 0) {
            console.log('Первые 20 слов:');
            progressResult.rows.slice(0, 20).forEach((row, i) => {
                console.log(`${i + 1}. [${row.source_word_id}] ${row.source_word || 'N/A'}`);
                console.log(`   Source lang: ${row.source_language}, Status: ${row.status}`);
            });
        }

        // Check for "hermano"
        console.log('\n\n🔎 Поиск "hermano" в немецких словах...\n');

        const hermanoResult = await client.query(`
            SELECT
                sw.id,
                sw.word,
                sw.pos,
                sw.level
            FROM source_words_german sw
            WHERE sw.word ILIKE '%hermano%'
        `);

        if (hermanoResult.rows.length > 0) {
            console.log(`⚠️ Найдено ${hermanoResult.rows.length} немецких слов с "hermano":`);
            hermanoResult.rows.forEach(row => {
                console.log(`  - [${row.id}] ${row.word}`);
                console.log(`    POS: ${row.pos || 'N/A'}, Level: ${row.level || 'N/A'}`);
            });
        } else {
            console.log('✅ "hermano" не найдено в немецких словах');
        }

        // Check Spanish words
        console.log('\n🔎 Поиск "hermano" в испанских словах...\n');

        const hermanoEsResult = await client.query(`
            SELECT
                sw.id,
                sw.word,
                sw.pos,
                sw.level
            FROM source_words_spanish sw
            WHERE sw.word ILIKE '%hermano%'
        `);

        if (hermanoEsResult.rows.length > 0) {
            console.log(`⚠️ Найдено ${hermanoEsResult.rows.length} испанских слов с "hermano":`);
            hermanoEsResult.rows.forEach(row => {
                console.log(`  - [${row.id}] ${row.word}`);
                console.log(`    POS: ${row.pos || 'N/A'}, Level: ${row.level || 'N/A'}`);
            });

            // Check if user has these words in progress
            console.log('\n🔎 Проверяем, есть ли эти испанские слова в прогрессе пользователя...\n');

            const userHasResult = await client.query(`
                SELECT uwp.source_word_id, uwp.source_language, uwp.status
                FROM user_word_progress uwp
                WHERE uwp.user_id = $1
                  AND uwp.source_word_id = ANY($2)
            `, [user.id, hermanoEsResult.rows.map(r => r.id)]);

            if (userHasResult.rows.length > 0) {
                console.log(`⚠️⚠️⚠️ ПРОБЛЕМА! У пользователя есть испанские слова в прогрессе:`);
                userHasResult.rows.forEach(row => {
                    console.log(`  - Word ID: ${row.source_word_id}`);
                    console.log(`    Source lang: ${row.source_language}, Status: ${row.status}`);
                });
            } else {
                console.log('✅ Испанских слов с "hermano" в прогрессе нет');
            }
        } else {
            console.log('✅ "hermano" не найдено в испанских словах');
        }

        // Check target_translations_spanish_from_de
        console.log('\n🔎 Проверка таблицы target_translations_spanish_from_de...\n');

        const translationsResult = await client.query(`
            SELECT
                tt.source_word_id,
                tt.target_word_id,
                sw_de.word as source_word,
                sw_es.word as target_word
            FROM target_translations_spanish_from_de tt
            LEFT JOIN source_words_german sw_de ON tt.source_word_id = sw_de.id
            LEFT JOIN source_words_spanish sw_es ON tt.target_word_id = sw_es.id
            WHERE sw_es.word ILIKE '%hermano%'
        `);

        if (translationsResult.rows.length > 0) {
            console.log(`⚠️ Найдено ${translationsResult.rows.length} переводов с "hermano":`);
            translationsResult.rows.forEach(row => {
                console.log(`  - ${row.source_word || 'N/A'} → ${row.target_word || 'N/A'}`);
                console.log(`    Source ID: ${row.source_word_id}, Target ID: ${row.target_word_id}`);
            });
        } else {
            console.log('✅ "hermano" не найдено в переводах DE→ES');
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

checkUser52();
