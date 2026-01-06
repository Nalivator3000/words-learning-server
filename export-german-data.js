const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function exportGermanData() {
    try {
        console.log('📦 Экспорт немецких данных из базы данных...\n');

        // ========== 1. Экспорт всех немецких слов из source_words_german ==========
        console.log('📝 Извлекаю немецкие слова из source_words_german...');
        const sourceWordsResult = await db.query(`
            SELECT
                id,
                word,
                theme,
                level,
                pos,
                gender,
                example_de,
                metadata,
                created_at,
                updated_at
            FROM source_words_german
            ORDER BY id ASC
        `);

        const sourceWords = sourceWordsResult.rows;
        console.log(`✅ Найдено ${sourceWords.length} слов в source_words_german\n`);

        // Сохраняем в JSON
        fs.writeFileSync(
            'german-source-words.json',
            JSON.stringify(sourceWords, null, 2),
            'utf8'
        );
        console.log('💾 Сохранено в german-source-words.json\n');

        // Сохраняем в текстовом формате для удобного просмотра
        let textContent = `НЕМЕЦКИЕ СЛОВА ИЗ SOURCE_WORDS_GERMAN\n`;
        textContent += `Всего слов: ${sourceWords.length}\n`;
        textContent += `Дата экспорта: ${new Date().toLocaleString('ru-RU')}\n`;
        textContent += `${'='.repeat(80)}\n\n`;

        sourceWords.forEach((word, index) => {
            textContent += `${index + 1}. ${word.word}\n`;
            if (word.theme) textContent += `   Тема: ${word.theme}\n`;
            if (word.level) textContent += `   Уровень: ${word.level}\n`;
            if (word.pos) textContent += `   Часть речи: ${word.pos}\n`;
            if (word.gender) textContent += `   Род: ${word.gender}\n`;
            if (word.example_de) textContent += `   Пример: ${word.example_de}\n`;
            textContent += '\n';
        });

        fs.writeFileSync('german-source-words.txt', textContent, 'utf8');
        console.log('💾 Сохранено в german-source-words.txt\n');

        // ========== 2. Экспорт переводов на все языки ==========
        console.log('🌐 Извлекаю переводы на все языки...');

        const translations = {};
        const targetLanguages = ['english', 'spanish', 'french', 'russian', 'ukrainian',
                                'portuguese', 'italian', 'chinese', 'japanese', 'korean',
                                'hindi', 'arabic', 'turkish', 'polish', 'romanian',
                                'serbian', 'swahili'];

        for (const targetLang of targetLanguages) {
            const tableName = `translations_german_${targetLang}`;

            try {
                const translationsResult = await db.query(`
                    SELECT
                        source_word_id,
                        translation,
                        context_tags
                    FROM ${tableName}
                `);

                translations[targetLang] = translationsResult.rows;
                console.log(`   ✅ ${targetLang}: ${translationsResult.rows.length} переводов`);
            } catch (error) {
                console.log(`   ⚠️  ${targetLang}: таблица не найдена или пустая`);
                translations[targetLang] = [];
            }
        }

        fs.writeFileSync(
            'german-translations.json',
            JSON.stringify(translations, null, 2),
            'utf8'
        );
        console.log('\n💾 Все переводы сохранены в german-translations.json\n');

        // ========== 3. Экспорт наборов слов ==========
        console.log('📚 Извлекаю наборы слов...');
        const wordSetsResult = await db.query(`
            SELECT
                id,
                title,
                description,
                source_language,
                level,
                theme,
                word_count,
                is_public,
                created_at,
                updated_at
            FROM word_sets
            WHERE source_language = 'german'
            ORDER BY level ASC, word_count DESC, title ASC
        `);

        const wordSets = wordSetsResult.rows;
        console.log(`✅ Найдено ${wordSets.length} наборов слов\n`);

        // Для каждого набора получаем количество слов и список word_id
        const wordSetsWithWords = [];

        for (const set of wordSets) {
            // Получаем word_id из word_set_items и затем получаем данные из source_words_german
            const wordsResult = await db.query(`
                SELECT
                    sw.word as source_word,
                    wsi.word_id,
                    wsi.order_index
                FROM word_set_items wsi
                LEFT JOIN source_words_german sw ON wsi.word_id = sw.id
                WHERE wsi.word_set_id = $1
                ORDER BY wsi.order_index ASC
            `, [set.id]);

            wordSetsWithWords.push({
                ...set,
                actual_word_count: wordsResult.rows.length,
                words: wordsResult.rows
            });

            console.log(`   📖 ${set.title}: ${wordsResult.rows.length} слов`);
        }

        fs.writeFileSync(
            'german-word-sets.json',
            JSON.stringify(wordSetsWithWords, null, 2),
            'utf8'
        );
        console.log('\n💾 Наборы слов сохранены в german-word-sets.json\n');

        // Текстовая версия наборов
        let setsTextContent = `НЕМЕЦКИЕ НАБОРЫ СЛОВ\n`;
        setsTextContent += `Всего наборов: ${wordSets.length}\n`;
        setsTextContent += `Дата экспорта: ${new Date().toLocaleString('ru-RU')}\n`;
        setsTextContent += `${'='.repeat(80)}\n\n`;

        wordSetsWithWords.forEach((set, index) => {
            setsTextContent += `${index + 1}. ${set.title}\n`;
            setsTextContent += `   ID: ${set.id}\n`;
            setsTextContent += `   Описание: ${set.description || 'нет описания'}\n`;
            setsTextContent += `   Язык источника: ${set.source_language}\n`;
            setsTextContent += `   Уровень: ${set.level || 'не указан'}\n`;
            setsTextContent += `   Тема: ${set.theme || 'не указана'}\n`;
            setsTextContent += `   Количество слов: ${set.actual_word_count}\n`;
            setsTextContent += `   Публичный: ${set.is_public ? 'Да' : 'Нет'}\n`;
            setsTextContent += `\n   СЛОВА В НАБОРЕ:\n`;

            set.words.forEach((word, wordIndex) => {
                setsTextContent += `   ${wordIndex + 1}. ${word.source_word} (ID: ${word.word_id})\n`;
            });

            setsTextContent += `\n${'-'.repeat(80)}\n\n`;
        });

        fs.writeFileSync('german-word-sets.txt', setsTextContent, 'utf8');
        console.log('💾 Наборы слов сохранены в german-word-sets.txt\n');

        // ========== 4. Сводная статистика ==========
        console.log('\n📊 СВОДНАЯ СТАТИСТИКА:');
        console.log('═'.repeat(60));
        console.log(`Всего немецких слов в базе: ${sourceWords.length}`);
        console.log(`Слов с темами: ${sourceWords.filter(w => w.theme).length}`);
        console.log(`Слов с примерами: ${sourceWords.filter(w => w.example_de).length}`);
        console.log(`\nНаборов слов: ${wordSets.length}`);

        const totalWordsInSets = wordSetsWithWords.reduce((sum, set) => sum + set.actual_word_count, 0);
        console.log(`Всего слов во всех наборах: ${totalWordsInSets}`);

        console.log(`\nПереводы на другие языки:`);
        Object.entries(translations).forEach(([lang, trans]) => {
            if (trans.length > 0) {
                console.log(`   ${lang}: ${trans.length} переводов`);
            }
        });

        // Сохраняем статистику
        const stats = {
            export_date: new Date().toISOString(),
            total_source_words: sourceWords.length,
            words_with_themes: sourceWords.filter(w => w.theme).length,
            words_with_examples: sourceWords.filter(w => w.example_de).length,
            total_word_sets: wordSets.length,
            total_words_in_sets: totalWordsInSets,
            translations_by_language: Object.fromEntries(
                Object.entries(translations).map(([lang, trans]) => [lang, trans.length])
            ),
            word_sets: wordSetsWithWords.map(set => ({
                id: set.id,
                title: set.title,
                word_count: set.actual_word_count,
                source_language: set.source_language,
                level: set.level,
                theme: set.theme
            }))
        };

        fs.writeFileSync(
            'german-export-summary.json',
            JSON.stringify(stats, null, 2),
            'utf8'
        );
        console.log('\n💾 Статистика сохранена в german-export-summary.json');

        console.log('\n✅ Экспорт завершён успешно!');
        console.log('\nСозданные файлы:');
        console.log('   📄 german-source-words.json - все слова (JSON)');
        console.log('   📄 german-source-words.txt - все слова (текст)');
        console.log('   📄 german-translations.json - переводы на все языки');
        console.log('   📄 german-word-sets.json - наборы слов (JSON)');
        console.log('   📄 german-word-sets.txt - наборы слов (текст)');
        console.log('   📄 german-export-summary.json - сводная статистика');

    } catch (error) {
        console.error('❌ Ошибка при экспорте:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

exportGermanData();