const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    try {
        const result = await pool.query(`
            SELECT
                w.id,
                w.word,
                w.translation,
                w.example,
                w.exampletranslation,
                w.notes,
                w.is_custom,
                w.source,
                w.theme,
                w.createdat,
                lp.from_lang,
                lp.to_lang
            FROM words w
            LEFT JOIN language_pairs lp ON w.language_pair_id = lp.id
            WHERE w.user_id = 50 AND w.is_custom = true
            ORDER BY w.createdat DESC
            LIMIT 4
        `);

        console.log('\n📚 Последние 4 добавленных слова для user_id=50:\n');

        if (result.rows.length === 0) {
            console.log('❌ Нет пользовательских слов');
        } else {
            result.rows.forEach((word, index) => {
                console.log(`${index + 1}. ID: ${word.id}`);
                console.log(`   Языковая пара: ${word.from_lang} → ${word.to_lang}`);
                console.log(`   Слово (${word.from_lang}): ${word.word}`);
                console.log(`   Перевод (${word.to_lang}): ${word.translation}`);
                console.log(`   Пример: ${word.example || '(нет)'}`);
                console.log(`   Перевод примера: ${word.exampletranslation || '(нет)'}`);
                console.log(`   Заметки: ${word.notes || '(нет)'}`);
                console.log(`   Тема: ${word.theme || '(нет)'}`);
                console.log(`   Источник: ${word.source}`);
                console.log(`   Создано: ${new Date(word.createdat).toLocaleString('ru-RU')}`);
                console.log('');
            });
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
