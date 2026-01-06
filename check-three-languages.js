const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway",
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

async function checkLanguages() {
  const client = await pool.connect();

  try {
    const languages = ['japanese', 'swahili', 'hindi'];

    for (const lang of languages) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🌐 ${lang.toUpperCase()}`);
      console.log('='.repeat(60));

      // Проверяем темы в source_words
      const themesResult = await client.query(`
        SELECT theme, COUNT(*) as count
        FROM source_words_${lang}
        WHERE theme IS NOT NULL AND theme != ''
        GROUP BY theme
        ORDER BY count DESC
      `);

      console.log(`\n📊 Темы в source_words_${lang}:`);
      if (themesResult.rows.length === 0) {
        console.log('   ❌ Нет тем!');
      } else {
        themesResult.rows.forEach(row => {
          console.log(`   ${row.theme}: ${row.count} слов`);
        });
      }

      // Проверяем слова без тем
      const withoutThemeResult = await client.query(`
        SELECT COUNT(*) as count
        FROM source_words_${lang}
        WHERE theme IS NULL OR theme = ''
      `);
      console.log(`\n   Без темы: ${withoutThemeResult.rows[0].count} слов`);

      // Проверяем word_sets
      const setsResult = await client.query(`
        SELECT theme, COUNT(*) as count
        FROM word_sets
        WHERE source_language = $1
        GROUP BY theme
        ORDER BY count DESC
        LIMIT 10
      `, [lang]);

      console.log(`\n📦 Word Sets для ${lang}:`);
      if (setsResult.rows.length === 0) {
        console.log('   ❌ Нет наборов!');
      } else {
        setsResult.rows.forEach(row => {
          const themeLabel = row.theme || 'general';
          console.log(`   ${themeLabel}: ${row.count} наборов`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkLanguages();
