require('dotenv').config();
const { Client } = require('pg');

async function checkUser87() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Проверяем наборы слов для пользователя 87
    const setsResult = await client.query(`
      SELECT
        ws.id as word_set_id,
        ws.title,
        ws.source_language,
        ws.theme,
        ws.level,
        COUNT(wsi.id) as word_count
      FROM word_sets ws
      LEFT JOIN word_set_items wsi ON ws.id = wsi.word_set_id
      LEFT JOIN user_word_sets uws ON ws.id = uws.word_set_id
      WHERE uws.user_id = 87
      GROUP BY ws.id, ws.title, ws.source_language, ws.theme, ws.level
      ORDER BY ws.source_language, ws.id
    `);

    console.log('\n📚 User 87 word sets:');
    console.log('Total sets:', setsResult.rows.length);
    setsResult.rows.forEach(row => {
      console.log(`  Set ${row.word_set_id}: ${row.source_language} - ${row.title} (${row.level}) - ${row.word_count} words`);
    });

    // Проверяем слова из хинди наборов
    const wordsResult = await client.query(`
      SELECT
        ws.id as word_set_id,
        ws.title,
        wsi.word,
        wsi.translation,
        wsi.part_of_speech,
        wsi.example
      FROM word_set_items wsi
      JOIN word_sets ws ON ws.id = wsi.word_set_id
      JOIN user_word_sets uws ON ws.id = uws.word_set_id
      WHERE uws.user_id = 87
      AND ws.source_language = 'hindi'
      ORDER BY ws.id, wsi.id
      LIMIT 20
    `);

    console.log('\n🔍 Sample words from Hindi sets:');
    if (wordsResult.rows.length === 0) {
      console.log('  ❌ No words found!');
    } else {
      wordsResult.rows.forEach((row, idx) => {
        console.log(`\n${idx + 1}. Set ${row.word_set_id} (${row.title}):`);
        console.log(`   Word: ${row.word}`);
        console.log(`   Translation: ${row.translation}`);
        console.log(`   POS: ${row.part_of_speech || 'null'}`);
        console.log(`   Example: ${row.example ? row.example.substring(0, 50) + '...' : 'null'}`);

        // Проверяем на плейсхолдеры
        if (row.word && row.word.includes('_')) {
          console.log('   ⚠️  WARNING: Looks like a placeholder!');
        }
      });
    }

    // Проверяем источник слов для хинди
    const sourceCheck = await client.query(`
      SELECT
        sw.id,
        sw.word,
        sw.translation,
        sw.part_of_speech,
        sw.example
      FROM source_words_hindi sw
      WHERE sw.level = 'A1'
      AND sw.theme = 'general'
      ORDER BY sw.id
      LIMIT 10
    `);

    console.log('\n📖 Source words for Hindi (A1, general):');
    sourceCheck.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.word} → ${row.translation} (${row.part_of_speech || 'null'})`);
      if (row.word && row.word.includes('_')) {
        console.log('    ⚠️  WARNING: Source word is a placeholder!');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkUser87();
