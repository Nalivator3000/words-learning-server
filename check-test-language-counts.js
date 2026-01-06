// Check word sets counts for test languages
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkTestLanguages() {
  try {
    const client = await pool.connect();

    const languages = [
      { name: 'German', setLang: 'german', ucLang: 'de' },
      { name: 'Hindi', setLang: 'hindi', ucLang: 'hi' },
      { name: 'English', setLang: 'english', ucLang: 'en' },
      { name: 'Russian', setLang: 'russian', ucLang: 'ru' },
      { name: 'Arabic', setLang: 'arabic', ucLang: 'ar' },
      { name: 'Chinese', setLang: 'chinese', ucLang: 'zh' }
    ];

    console.log('=== Language-specific word collection counts ===\n');

    for (const lang of languages) {
      // Count word_sets
      const wordSets = await client.query(`
        SELECT COUNT(*) as count
        FROM word_sets
        WHERE source_language = $1 AND is_public = true
      `, [lang.setLang]);

      // Count universal_collections
      const wordLists = await client.query(`
        SELECT COUNT(*) as count
        FROM universal_collections
        WHERE source_lang = $1 AND is_public = true
      `, [lang.ucLang]);

      const total = parseInt(wordSets.rows[0].count) + parseInt(wordLists.rows[0].count);

      console.log(`${lang.name}:`);
      console.log(`  word_sets: ${wordSets.rows[0].count}`);
      console.log(`  universal_collections: ${wordLists.rows[0].count}`);
      console.log(`  TOTAL: ${total}\n`);
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTestLanguages();
