/**
 * Restore vocabularies for languages that lost data after duplicate removal
 * This script adds words from populate-extended-vocabularies.js directly
 */

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Read the vocabulary from populate-extended-vocabularies.js
const populateScript = fs.readFileSync('populate-extended-vocabularies.js', 'utf8');

// Extract EXPANDED_VOCABULARIES object
const match = populateScript.match(/const EXPANDED_VOCABULARIES = ({[\s\S]*?^};)/m);
if (!match) {
  console.error('❌ Could not extract vocabularies from populate-extended-vocabularies.js');
  process.exit(1);
}

// Parse the vocabularies (eval is used here for simplicity, in production use a proper parser)
const EXPANDED_VOCABULARIES = eval('(' + match[1].replace(/^};$/, '}') + ')');

const language = process.argv[2];

if (!language) {
  console.error('❌ Please specify a language: italian, portuguese, turkish, arabic, russian, ukrainian');
  process.exit(1);
}

if (!EXPANDED_VOCABULARIES[language]) {
  console.error(`❌ No vocabulary found for ${language}`);
  process.exit(1);
}

async function restoreVocabulary() {
  console.log('\n' + '═'.repeat(80));
  console.log(`📚 ВОССТАНОВЛЕНИЕ СЛОВАРЯ: ${language.toUpperCase()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    const vocab = EXPANDED_VOCABULARIES[language];
    let totalAdded = 0;
    let totalSkipped = 0;

    // Process each level
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      if (!vocab[level]) {
        console.log(`⏭️  Пропускаю ${level} (нет данных)`);
        continue;
      }

      console.log(`\n📖 Уровень ${level}:`);
      let levelAdded = 0;
      let levelSkipped = 0;

      const levelVocab = vocab[level];

      // Process each category
      for (const [category, words] of Object.entries(levelVocab)) {
        if (!Array.isArray(words) || words.length === 0) continue;

        let categoryAdded = 0;

        for (const word of words) {
          // Check if word already exists
          const exists = await pool.query(`
            SELECT id FROM source_words_${language}
            WHERE word = $1
          `, [word]);

          if (exists.rows.length > 0) {
            levelSkipped++;
            totalSkipped++;
            continue;
          }

          // Insert new word
          await pool.query(`
            INSERT INTO source_words_${language} (word, level, theme)
            VALUES ($1, $2, 'general')
          `, [word, level]);

          categoryAdded++;
          levelAdded++;
          totalAdded++;
        }

        if (categoryAdded > 0) {
          console.log(`   ✅ ${category}: ${categoryAdded} слов добавлено`);
        }
      }

      console.log(`   📊 Итого ${level}: ${levelAdded} добавлено, ${levelSkipped} пропущено (уже есть)`);
    }

    // Final stats
    const totalWords = await pool.query(`
      SELECT COUNT(*) as count FROM source_words_${language}
    `);

    console.log('\n' + '─'.repeat(80));
    console.log(`✅ Всего добавлено: ${totalAdded} новых слов`);
    console.log(`⏭️  Пропущено: ${totalSkipped} (уже существовали)`);
    console.log(`📊 Итого слов в базе: ${totalWords.rows[0].count}`);
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

restoreVocabulary();
