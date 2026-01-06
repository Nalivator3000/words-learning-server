const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkLanguages() {
  try {
    const languages = ['japanese', 'swahili', 'hindi'];

    for (const lang of languages) {
      const tableName = `source_words_${lang}`;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`${lang.toUpperCase()}`);
      console.log('='.repeat(60));

      // Проверка распределения тем
      const themes = await pool.query(`
        SELECT theme, COUNT(*) as cnt
        FROM ${tableName}
        GROUP BY theme
        ORDER BY cnt DESC
        LIMIT 20
      `);

      console.log('\nРаспределение по темам:');
      themes.rows.forEach(r => {
        console.log(`  ${r.theme || 'NULL'}: ${r.cnt} слов`);
      });

      // Примеры слов
      console.log('\nПримеры слов:');
      const samples = await pool.query(`
        SELECT word, level, theme
        FROM ${tableName}
        LIMIT 5
      `);

      samples.rows.forEach(r => {
        console.log(`  "${r.word}" [${r.level}] - тема: ${r.theme || 'NULL'}`);
      });
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkLanguages();
