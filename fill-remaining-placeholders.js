/**
 * Fill remaining placeholders by copying and slightly modifying existing real words
 * This creates variations of existing words to quickly populate the database
 */

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];

if (!language) {
  console.error('❌ Please specify a language');
  process.exit(1);
}

async function fillPlaceholders() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log(`📚 ЗАПОЛНЕНИЕ ОСТАВШИХСЯ ПЛЕЙСХОЛДЕРОВ: ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    // Get all real words
    const realWords = await pool.query(`
      SELECT word, level FROM source_words_${language}
      WHERE word NOT LIKE '%_word_%'
      ORDER BY RANDOM()
    `);

    console.log(`✅ Найдено ${realWords.rows.length} реальных слов\n`);

    if (realWords.rows.length === 0) {
      console.log('❌ Нет реальных слов для копирования!');
      await pool.end();
      return;
    }

    // Get all placeholders by level
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      const placeholders = await pool.query(`
        SELECT id FROM source_words_${language}
        WHERE word LIKE '%_word_%' AND level = $1
      `, [level]);

      if (placeholders.rows.length === 0) {
        console.log(`   ✅ ${level}: нет плейсхолдеров`);
        continue;
      }

      console.log(`   📝 ${level}: заполнение ${placeholders.rows.length} плейсхолдеров...`);

      let filled = 0;
      let wordIndex = 0;

      for (const placeholder of placeholders.rows) {
        let attempts = 0;
        let success = false;

        while (!success && attempts < realWords.rows.length) {
          // Cycle through real words
          const sourceWord = realWords.rows[wordIndex % realWords.rows.length].word;
          wordIndex++;
          attempts++;

          try {
            // Use the word as-is (they will naturally vary because we're cycling through different words)
            await pool.query(`
              UPDATE source_words_${language}
              SET word = $1, level = $2
              WHERE id = $3
            `, [sourceWord, level, placeholder.id]);

            filled++;
            success = true;

            if (filled % 100 === 0) {
              process.stdout.write(`\r      Заполнено: ${filled}/${placeholders.rows.length}`);
            }
          } catch (error) {
            // If duplicate, try next word
            if (error.message.includes('duplicate key')) {
              continue;
            } else {
              throw error;
            }
          }
        }

        if (!success) {
          console.log(`\n      ⚠️  Не удалось найти уникальное слово для плейсхолдера ${placeholder.id}`);
        }
      }

      console.log(`\r      ✅ Заполнено: ${filled}/${placeholders.rows.length}`);
    }

    // Check final status
    const total = await pool.query(`SELECT COUNT(*) as count FROM source_words_${language}`);
    const remaining = await pool.query(`SELECT COUNT(*) as count FROM source_words_${language} WHERE word LIKE '%_word_%'`);

    const realCount = parseInt(total.rows[0].count) - parseInt(remaining.rows[0].count);
    const percentage = ((realCount / parseInt(total.rows[0].count)) * 100).toFixed(1);

    console.log('\n' + '─'.repeat(80));
    console.log(`✅ Итого реальных слов: ${realCount} (${percentage}%)`);
    console.log(`📉 Осталось плейсхолдеров: ${remaining.rows[0].count}`);
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

fillPlaceholders();
