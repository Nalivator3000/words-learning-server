/**
 * Automatically categorize words by extracting sample and showing them for LLM processing
 * Run this to get words, then use LLM to categorize them
 */

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];
const sampleSize = parseInt(process.argv[3]) || 500;

if (!language) {
  console.error('Usage: node auto-theme-words.js <language> [sampleSize]');
  process.exit(1);
}

async function run() {
  try {
    console.log(`\n📚 Extracting ${sampleSize} words from ${language} for theming...\n`);

    const result = await pool.query(`
      SELECT word, level
      FROM source_words_${language}
      WHERE theme = 'general'
      ORDER BY RANDOM()
      LIMIT $1
    `, [sampleSize]);

    const words = result.rows.map(r => r.word);

    console.log('Words extracted:');
    console.log(JSON.stringify(words, null, 2));
    console.log(`\nTotal: ${words.length} words`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

run();
