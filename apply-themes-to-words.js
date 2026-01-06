/**
 * Apply themes to words in the database
 * Takes a JSON file with word-theme mappings and updates the database
 */

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];
const jsonFile = process.argv[3];

if (!language || !jsonFile) {
  console.error('Usage: node apply-themes-to-words.js <language> <json-file>');
  console.error('Example: node apply-themes-to-words.js italian themes-italian.json');
  process.exit(1);
}

async function applyThemes() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log(`🎨 ПРИМЕНЕНИЕ ТЕМ К СЛОВАМ: ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    // Read JSON file
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

    console.log(`📊 Загружено ${data.length} слов с темами\n`);

    // Group by theme for statistics
    const themeStats = {};
    data.forEach(item => {
      themeStats[item.theme] = (themeStats[item.theme] || 0) + 1;
    });

    console.log('Распределение по темам:');
    Object.entries(themeStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([theme, count]) => {
        console.log(`  • ${theme.padEnd(20)} - ${count} слов`);
      });

    console.log('\n' + '─'.repeat(80));
    console.log('⏳ Применение тем к словам в базе данных...\n');

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const item of data) {
      try {
        const result = await pool.query(`
          UPDATE source_words_${language}
          SET theme = $1
          WHERE word = $2
        `, [item.theme, item.word]);

        if (result.rowCount > 0) {
          updated++;
        } else {
          notFound++;
          console.log(`  ⚠️  Слово не найдено: ${item.word}`);
        }

        if (updated % 100 === 0) {
          process.stdout.write(`\r  Обновлено: ${updated}/${data.length}`);
        }
      } catch (error) {
        errors++;
        console.error(`  ❌ Ошибка при обновлении "${item.word}": ${error.message}`);
      }
    }

    console.log(`\r  ✅ Обновлено: ${updated}/${data.length}\n`);

    console.log('─'.repeat(80));
    console.log(`✅ Успешно обновлено: ${updated}`);
    console.log(`⚠️  Не найдено: ${notFound}`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

applyThemes();
