/**
 * Add themes to words using LLM for categorization
 * This script extracts words with 'general' theme and assigns appropriate themes
 */

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Available themes for categorization
const AVAILABLE_THEMES = [
  'general',      // Default/uncategorized
  'family',       // Family, relationships
  'food',         // Food, drinks, cooking
  'travel',       // Travel, transportation, places
  'home',         // Home, furniture, household
  'health',       // Health, body, medical
  'work',         // Work, business, profession
  'education',    // Education, school, learning
  'nature',       // Nature, animals, environment
  'weather',      // Weather, seasons, climate
  'communication',// Communication, media, language
  'culture',      // Culture, art, entertainment
  'emotions',     // Emotions, feelings, character
  'sports',       // Sports, hobbies, activities
  'technology',   // Technology, computers, internet
  'time',         // Time, dates, calendar
  'numbers',      // Numbers, counting, math
  'colors',       // Colors
  'clothing',     // Clothing, fashion, accessories
  'shopping'      // Shopping, money, buying
];

const language = process.argv[2];
const batchSize = parseInt(process.argv[3]) || 100;

if (!language) {
  console.error('❌ Please specify a language: node add-themes-via-llm.js <language> [batchSize]');
  console.error('   Example: node add-themes-via-llm.js italian 100');
  process.exit(1);
}

async function getGeneralWords(limit) {
  const result = await pool.query(`
    SELECT id, word, level
    FROM source_words_${language}
    WHERE theme = 'general'
    ORDER BY RANDOM()
    LIMIT $1
  `, [limit]);

  return result.rows;
}

async function updateWordTheme(wordId, theme) {
  await pool.query(`
    UPDATE source_words_${language}
    SET theme = $1
    WHERE id = $2
  `, [theme, wordId]);
}

async function processWords() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log(`🎨 ДОБАВЛЕНИЕ ТЕМ ЧЕРЕЗ LLM: ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    // Get total count of general words
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM source_words_${language}
      WHERE theme = 'general'
    `);

    const totalGeneral = parseInt(totalResult.rows[0].count);
    console.log(`📊 Всего слов с темой "general": ${totalGeneral}`);
    console.log(`📦 Размер порции: ${batchSize} слов\n`);

    // Get a batch of words
    const words = await getGeneralWords(batchSize);

    if (words.length === 0) {
      console.log('✅ Нет слов для обработки!');
      await pool.end();
      return;
    }

    console.log(`📝 Получено ${words.length} слов для обработки\n`);
    console.log('Слова для обработки:');
    words.slice(0, 20).forEach(w => {
      console.log(`  • ${w.word} (${w.level})`);
    });

    if (words.length > 20) {
      console.log(`  ... и ещё ${words.length - 20} слов`);
    }

    console.log('\n' + '─'.repeat(80));
    console.log('⚠️  MANUAL STEP REQUIRED:');
    console.log('─'.repeat(80));
    console.log('\nПопросите LLM (например, Claude) определить темы для этих слов:');
    console.log('\nПример запроса:');
    console.log('─'.repeat(80));
    console.log(`
Для следующих слов на ${language} языке, определи подходящую тему из списка:
${AVAILABLE_THEMES.join(', ')}

Слова:
${words.map(w => w.word).join(', ')}

Верни результат в формате JSON массива:
[
  {"word": "слово1", "theme": "food"},
  {"word": "слово2", "theme": "family"},
  ...
]

Выбирай максимально точную тему. Используй "general" только если слово не подходит ни под одну категорию.
    `);
    console.log('─'.repeat(80));

    console.log('\nПосле получения ответа от LLM, сохраните JSON в файл themes-result.json');
    console.log('и запустите скрипт apply-themes.js для применения тем.\n');

    // Save words to file for reference
    const fs = require('fs');
    fs.writeFileSync(
      `words-to-theme-${language}.json`,
      JSON.stringify(words, null, 2)
    );

    console.log(`✅ Список слов сохранён в: words-to-theme-${language}.json\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

processWords();
