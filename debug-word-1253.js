const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function debugWord1253() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          ДИАГНОСТИКА ОШИБКИ: WORD ID 1253                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Check if word exists in old 'words' table
    console.log('🔍 Проверка в старой таблице "words":\n');
    const oldWordResult = await pool.query(`
      SELECT *
      FROM words
      WHERE id = 1253
    `);

    if (oldWordResult.rows.length > 0) {
      const word = oldWordResult.rows[0];
      console.log('✅ Слово найдено в таблице "words":');
      console.log(`   ID: ${word.id}`);
      console.log(`   Word: ${word.word}`);
      console.log(`   Translation: ${word.translation}`);
      console.log(`   User ID: ${word.user_id}`);
      console.log(`   Language Pair ID: ${word.language_pair_id}`);
      console.log(`   Columns: ${Object.keys(word).join(', ')}\n`);

      // Get language pair info
      const langPairResult = await pool.query(`
        SELECT id, from_lang, to_lang
        FROM language_pairs
        WHERE id = $1
      `, [word.language_pair_id]);

      if (langPairResult.rows.length > 0) {
        const langPair = langPairResult.rows[0];
        console.log('📚 Языковая пара:');
        console.log(`   ${langPair.from_lang} → ${langPair.to_lang}\n`);

        // Map language code to full name
        const langMap = {
          'de': 'german', 'en': 'english', 'es': 'spanish', 'fr': 'french',
          'ru': 'russian', 'it': 'italian', 'pt': 'portuguese', 'zh': 'chinese',
          'ja': 'japanese', 'ko': 'korean', 'hi': 'hindi', 'ar': 'arabic',
          'tr': 'turkish', 'uk': 'ukrainian', 'pl': 'polish', 'ro': 'romanian',
          'sr': 'serbian', 'sw': 'swahili'
        };

        const sourceLanguage = langMap[langPair.from_lang] || langPair.from_lang;
        const tableName = `source_words_${sourceLanguage}`;

        console.log(`🔍 Проверка в новой таблице "${tableName}":\n`);

        // Check source_words table structure
        const sourceColumnsResult = await pool.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName.replace('source_words_', '').toLowerCase()]);

        if (sourceColumnsResult.rows.length === 0) {
          // Try with full table name
          const sourceColumnsResult2 = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);
          console.log(`Колонки в таблице "${tableName}": ${sourceColumnsResult2.rows.map(r => r.column_name).join(', ')}\n`);
        } else {
          console.log(`Колонки в таблице "${tableName}": ${sourceColumnsResult.rows.map(r => r.column_name).join(', ')}\n`);
        }

        // Try to find by word text
        console.log('🔍 Попытка найти по тексту слова:\n');
        const searchResult = await pool.query(`
          SELECT *
          FROM ${tableName}
          WHERE LOWER(word) = LOWER($1)
          LIMIT 5
        `, [word.word]);

        if (searchResult.rows.length > 0) {
          console.log(`✅ Найдено ${searchResult.rows.length} совпадений:`);
          searchResult.rows.forEach(row => {
            console.log(`   ID: ${row.id} - "${row.word}"`);
            console.log(`   Columns: ${Object.keys(row).join(', ')}`);
          });
        } else {
          console.log('❌ Совпадений по тексту не найдено');
        }
      }
    } else {
      console.log('❌ Слово с ID 1253 НЕ НАЙДЕНО в таблице "words"\n');
    }

    // Check total words in old table
    const totalOldWords = await pool.query('SELECT COUNT(*) as count FROM words');
    console.log(`\n📊 Всего записей в таблице "words": ${totalOldWords.rows[0].count}`);

    // Check words columns
    const columnsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'words'
      ORDER BY ordinal_position
    `);
    console.log(`📊 Колонки в таблице "words": ${columnsResult.rows.map(r => r.column_name).join(', ')}\n`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  }

  await pool.end();
}

debugWord1253();
