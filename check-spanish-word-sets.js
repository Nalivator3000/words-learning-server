const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSpanishWordSets() {
    try {
        console.log('🔍 Проверяю наборы слов для испанского языка...\n');

        // Получаем все наборы для испанского языка
        const result = await db.query(`
            SELECT
                id,
                title,
                description,
                source_language,
                target_language,
                level,
                theme,
                word_count,
                is_public,
                created_at
            FROM word_sets
            WHERE source_language = 'spanish'
            ORDER BY level ASC, word_count DESC, title ASC
        `);

        if (result.rows.length === 0) {
            console.log('❌ Наборы слов для испанского языка не найдены!\n');
        } else {
            console.log(`✅ Найдено наборов: ${result.rows.length}\n`);
            console.log('═══════════════════════════════════════════════════════════════════\n');

            let totalWords = 0;
            result.rows.forEach((set, index) => {
                console.log(`${index + 1}. ${set.title}`);
                console.log(`   ID: ${set.id}`);
                console.log(`   Количество слов: ${set.word_count}`);
                console.log(`   Уровень: ${set.level || 'не указан'}`);
                console.log(`   Тема: ${set.theme || 'не указана'}`);
                console.log(`   Язык перевода: ${set.target_language}`);
                console.log(`   Публичный: ${set.is_public ? 'Да' : 'Нет'}`);
                console.log(`   Описание: ${set.description || 'нет описания'}`);
                console.log('   ───────────────────────────────────────────────────────────────\n');

                totalWords += set.word_count || 0;
            });

            console.log('═══════════════════════════════════════════════════════════════════');
            console.log(`\n📊 ИТОГО:`);
            console.log(`   Всего наборов: ${result.rows.length}`);
            console.log(`   Всего слов: ${totalWords}`);
            console.log(`   Средний размер набора: ${Math.round(totalWords / result.rows.length)} слов\n`);

            // Статистика по уровням
            console.log('📈 Распределение по уровням:');
            const levelStats = {};
            result.rows.forEach(set => {
                const level = set.level || 'без уровня';
                levelStats[level] = (levelStats[level] || 0) + 1;
            });
            Object.entries(levelStats).forEach(([level, count]) => {
                console.log(`   ${level}: ${count} набор(ов)`);
            });

            // Статистика по темам
            console.log('\n🏷️  Распределение по темам:');
            const themeStats = {};
            result.rows.forEach(set => {
                const theme = set.theme || 'без темы';
                themeStats[theme] = (themeStats[theme] || 0) + 1;
            });
            Object.entries(themeStats).forEach(([theme, count]) => {
                console.log(`   ${theme}: ${count} набор(ов)`);
            });
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error(error);
    } finally {
        await db.end();
    }
}

checkSpanishWordSets();
