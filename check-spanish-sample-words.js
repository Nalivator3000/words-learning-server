const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkSpanishSampleWords() {
  try {
    console.log('\n📝 === ПРИМЕРЫ СЛОВ ИЗ source_words_spanish ===\n');

    // Получаем по 5 слов каждого уровня
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    for (const level of levels) {
      console.log(`\n📈 ${level}:\n`);

      const words = await pool.query(`
        SELECT id, word, level, pos, gender, theme, metadata
        FROM source_words_spanish
        WHERE level = $1
        ORDER BY id
        LIMIT 10
      `, [level]);

      words.rows.forEach((word, i) => {
        console.log(`${i + 1}. ${word.word} (${word.pos || 'no POS'})`);
        console.log(`   ID: ${word.id}`);
        console.log(`   Gender: ${word.gender || 'N/A'}`);
        console.log(`   Theme: ${word.theme || '(пусто)'}`);
        if (word.metadata) {
          console.log(`   Metadata: ${JSON.stringify(word.metadata)}`);
        }
        console.log('');
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkSpanishSampleWords();
