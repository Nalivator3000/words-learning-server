const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function extractWords() {
  try {
    console.log('\n📚 Извлечение слов Swahili для переназначения тем...\n');

    const result = await pool.query(`
      SELECT word
      FROM source_words_swahili
      WHERE theme = 'general'
      ORDER BY id
    `);

    console.log(`✓ Найдено ${result.rows.length} слов с темой 'general'`);

    const words = result.rows.map(r => r.word);
    fs.writeFileSync('swahili-words-for-themes.txt', words.join('\n'), 'utf-8');

    console.log(`✓ Записано в swahili-words-for-themes.txt`);
    console.log(`\nПримеры слов:`);
    words.slice(0, 10).forEach((w, i) => console.log(`  ${i + 1}. ${w}`));

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

extractWords();
