const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUser7Complete() {
    try {
        const userId = 7;

        console.log('=' .repeat(80));
        console.log(`ПОЛНАЯ ДИАГНОСТИКА ПОЛЬЗОВАТЕЛЯ ${userId}`);
        console.log('='.repeat(80) + '\n');

        // 1. Проверяем пользователя
        const userResult = await db.query(`
            SELECT id, username, email, createdat FROM users WHERE id = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            console.log('❌ Пользователь не найден!');
            process.exit(1);
        }

        const user = userResult.rows[0];
        console.log('👤 Информация о пользователе:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username || '(не установлен)'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Создан: ${user.createdat}\n`);

        // 2. Проверяем языковые пары
        const lpResult = await db.query(`
            SELECT id, from_lang, to_lang
            FROM language_pairs
            WHERE user_id = $1
            ORDER BY id DESC
        `, [userId]);

        console.log('🌍 Языковые пары:');
        if (lpResult.rows.length === 0) {
            console.log('   ❌ Нет языковых пар!\n');
            process.exit(1);
        }

        lpResult.rows.forEach((lp, i) => {
            console.log(`   ${i + 1}. Pair ID ${lp.id}: ${lp.from_lang} → ${lp.to_lang}`);
        });

        const languagePair = lpResult.rows[0]; // Берем самую свежую
        console.log(`\n   ✅ Используем пару: ${languagePair.from_lang} → ${languagePair.to_lang} (ID: ${languagePair.id})\n`);

        // 3. Проверяем слова в прогрессе пользователя
        const progressResult = await db.query(`
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
                   COUNT(CASE WHEN status = 'studying' THEN 1 END) as studying,
                   COUNT(CASE WHEN status LIKE 'review_%' THEN 1 END) as review
            FROM user_word_progress
            WHERE user_id = $1 AND language_pair_id = $2
        `, [userId, languagePair.id]);

        const progress = progressResult.rows[0];
        console.log('📊 Статистика прогресса (user_word_progress):');
        console.log(`   Всего слов: ${progress.total}`);
        console.log(`   - Новых (new): ${progress.new}`);
        console.log(`   - Изучаемых (studying): ${progress.studying}`);
        console.log(`   - На повторении (review_*): ${progress.review}\n`);

        if (parseInt(progress.total) === 0) {
            console.log('⚠️  ПРОБЛЕМА НАЙДЕНА: У пользователя нет слов в прогрессе!\n');

            // 4. Проверяем, есть ли слова в словарях для этой языковой пары
            const LANG_CODE_TO_FULL_NAME = {
                'en': 'english', 'ru': 'russian', 'de': 'german', 'es': 'spanish',
                'fr': 'french', 'it': 'italian', 'pt': 'portuguese', 'pl': 'polish',
                'hi': 'hindi', 'ar': 'arabic', 'zh': 'chinese', 'ja': 'japanese',
                'ko': 'korean', 'tr': 'turkish', 'uk': 'ukrainian', 'ro': 'romanian',
                'sr': 'serbian', 'sw': 'swahili'
            };

            const sourceLanguage = LANG_CODE_TO_FULL_NAME[languagePair.from_lang];
            const targetLanguage = LANG_CODE_TO_FULL_NAME[languagePair.to_lang];

            console.log(`📚 Проверяем доступные словари:`);
            console.log(`   Исходный язык: ${sourceLanguage} (${languagePair.from_lang})`);
            console.log(`   Целевой язык: ${targetLanguage} (${languagePair.to_lang})\n`);

            // Проверяем source words
            const sourceTableName = `source_words_${sourceLanguage}`;
            const sourceCountResult = await db.query(`
                SELECT COUNT(*) as count FROM ${sourceTableName}
            `);
            console.log(`   ✅ Таблица ${sourceTableName}: ${sourceCountResult.rows[0].count} слов`);

            // Проверяем translation table
            const baseTranslationTableName = `target_translations_${targetLanguage}`;

            // Проверяем существование базовой таблицы
            const tableExistsResult = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = $1
                )
            `, [baseTranslationTableName]);

            let useBaseTable = false;
            let translationTableName = '';
            let translationCount = 0;

            if (tableExistsResult.rows[0].exists) {
                const checkResult = await db.query(`
                    SELECT COUNT(*) as count
                    FROM ${baseTranslationTableName}
                    WHERE source_lang = $1
                `, [languagePair.from_lang]);

                translationCount = parseInt(checkResult.rows[0].count);
                useBaseTable = translationCount > 0;
            }

            if (useBaseTable) {
                translationTableName = baseTranslationTableName;
                console.log(`   ✅ Таблица ${translationTableName}: ${translationCount} переводов (source_lang = '${languagePair.from_lang}')`);
            } else {
                translationTableName = `${baseTranslationTableName}_from_${languagePair.from_lang}`;
                const fallbackCheck = await db.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'public'
                        AND table_name = $1
                    )
                `, [translationTableName]);

                if (fallbackCheck.rows[0].exists) {
                    const fallbackCount = await db.query(`SELECT COUNT(*) as count FROM ${translationTableName}`);
                    translationCount = parseInt(fallbackCount.rows[0].count);
                    console.log(`   ✅ Таблица ${translationTableName}: ${translationCount} переводов`);
                } else {
                    console.log(`   ❌ Таблица ${translationTableName}: не существует!`);
                }
            }

            console.log('\n' + '='.repeat(80));
            console.log('💡 РЕШЕНИЕ:');
            console.log('='.repeat(80));
            console.log('Пользователю нужно ИМПОРТИРОВАТЬ слова в свой личный словарь.');
            console.log('Хотя в общей базе есть словари, пользователь должен добавить');
            console.log('слова в свой прогресс через функцию Import в приложении.');
            console.log('='.repeat(80) + '\n');
        } else {
            console.log('✅ У пользователя есть слова в прогрессе! Проблема может быть в другом.\n');

            // Проверяем несколько случайных слов
            const sampleWords = await db.query(`
                SELECT uwp.id, uwp.source_word_id, uwp.status, sw.word
                FROM user_word_progress uwp
                JOIN source_words_german sw ON sw.id = uwp.source_word_id
                WHERE uwp.user_id = $1 AND uwp.language_pair_id = $2
                LIMIT 5
            `, [userId, languagePair.id]);

            console.log('📝 Примеры слов в прогрессе:');
            sampleWords.rows.forEach((word, i) => {
                console.log(`   ${i + 1}. ID ${word.id}: "${word.word}" (status: ${word.status})`);
            });
        }

    } catch (error) {
        console.error('❌ ОШИБКА:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

checkUser7Complete();
