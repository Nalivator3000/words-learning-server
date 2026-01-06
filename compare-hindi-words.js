const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function compareWords() {
  const client = await pool.connect();

  try {
    // Читаем JSON
    const themesData = JSON.parse(fs.readFileSync('themes-hindi-all.json', 'utf8'));
    const jsonWords = themesData.map(item => item.word);

    console.log(`📖 Слова из JSON (первые 20):`);
    jsonWords.slice(0, 20).forEach((w, i) => console.log(`   ${i + 1}. "${w}"`));

    // Читаем из БД
    const dbResult = await client.query(`
      SELECT word
      FROM source_words_hindi
      ORDER BY id
      LIMIT 20
    `);

    console.log(`\n💾 Слова из БД (первые 20):`);
    dbResult.rows.forEach((row, i) => console.log(`   ${i + 1}. "${row.word}"`));

    // Проверяем совпадения
    const dbWords = dbResult.rows.map(r => r.word);
    const matches = dbWords.filter(w => jsonWords.includes(w));

    console.log(`\n🔍 Совпадений: ${matches.length} из 20`);
    if (matches.length > 0) {
      console.log('Совпадающие слова:');
      matches.forEach(w => console.log(`   - "${w}"`));
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

compareWords();
