/**
 * Script to recreate Spanish word sets with REAL themes
 * First deletes all existing Spanish sets, then creates new thematic collections
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CHUNK_SIZE = 50; // Words per collection for 'general' theme
const MIN_THEME_SIZE = 10; // Minimum words to create a themed collection

const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficiency'
};

async function recreateSpanishThematicSets() {
    try {
        console.log('\n🇪🇸 === ПЕРЕСОЗДАНИЕ ИСПАНСКИХ ТЕМАТИЧЕСКИХ НАБОРОВ ===\n');

        // Сначала удаляем все существующие испанские наборы
        console.log('🗑️  Удаление старых наборов...');
        const deleteResult = await pool.query(`
            DELETE FROM word_sets
            WHERE source_language = 'spanish'
        `);
        console.log(`   Удалено: ${deleteResult.rowCount} наборов\n`);

        let totalCreated = 0;

        for (const level of LEVELS) {
            console.log(`\n${'═'.repeat(70)}`);
            console.log(`📚 Обработка уровня ${level}`);
            console.log('═'.repeat(70) + '\n');

            // Получаем статистику по темам для этого уровня
            const themesQuery = await pool.query(`
                SELECT theme, COUNT(*) as count
                FROM source_words_spanish
                WHERE level = $1 AND theme IS NOT NULL
                GROUP BY theme
                ORDER BY count DESC
            `, [level]);

            console.log(`Найдено тем: ${themesQuery.rows.length}\n`);

            for (const themeRow of themesQuery.rows) {
                const theme = themeRow.theme;
                const count = parseInt(themeRow.count);

                if (count < MIN_THEME_SIZE) {
                    console.log(`⏭️  Пропущено: ${theme} (только ${count} слов)`);
                    continue;
                }

                // Для темы 'general' создаём несколько наборов по CHUNK_SIZE слов
                if (theme === 'general') {
                    const created = await createGeneralSets(level, count);
                    totalCreated += created;
                } else {
                    // Для остальных тем создаём один набор
                    const created = await createThematicSet(level, theme, count);
                    totalCreated += created;
                }
            }
        }

        console.log('\n' + '═'.repeat(70));
        console.log(`\n🎉 Создано наборов: ${totalCreated}`);
        console.log('═'.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function createThematicSet(level, theme, totalCount) {
    const title = `Spanish ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
    const description = `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

    console.log(`📝 ${title} (${totalCount} words)`);

    try {
        const setResult = await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ('spanish', $1, $2, $3, $4, $5, true)
            RETURNING id
        `, [title, description, level, theme, totalCount]);

        console.log(`   ✅ Создано (ID: ${setResult.rows[0].id})\n`);
        return 1;
    } catch (error) {
        console.error(`   ❌ Ошибка создания: ${error.message}\n`);
        return 0;
    }
}

async function createGeneralSets(level, totalCount) {
    const chunks = Math.ceil(totalCount / CHUNK_SIZE);
    console.log(`📦 General theme: разбиваем ${totalCount} слов на ${chunks} наборов\n`);

    let createdCount = 0;

    for (let i = 0; i < chunks; i++) {
        const offset = i * CHUNK_SIZE;
        const chunkNum = i + 1;

        // Получаем слова для этого чанка
        const wordsQuery = await pool.query(`
            SELECT COUNT(*) as count
            FROM source_words_spanish
            WHERE level = $1 AND theme = 'general'
            LIMIT $2 OFFSET $3
        `, [level, CHUNK_SIZE, offset]);

        const actualCount = Math.min(CHUNK_SIZE, totalCount - offset);

        if (actualCount <= 0) break;

        const title = `Spanish ${level}: Essential Vocabulary ${chunkNum}`;
        const description = `${LEVEL_DESCRIPTIONS[level]} level essential vocabulary - Part ${chunkNum}`;

        console.log(`   📝 ${title} (${actualCount} words)`);

        try {
            const setResult = await pool.query(`
                INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
                VALUES ('spanish', $1, $2, $3, 'general', $4, true)
                RETURNING id
            `, [title, description, level, actualCount]);

            console.log(`      ✅ Создано (ID: ${setResult.rows[0].id})`);
            createdCount++;
        } catch (error) {
            console.error(`      ❌ Ошибка: ${error.message}`);
        }
    }

    console.log('');
    return createdCount;
}

recreateSpanishThematicSets();
