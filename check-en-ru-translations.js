require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkEnRuTranslations() {
  const client = await pool.connect();

  try {
    console.log('=== CHECKING ENGLISH→RUSSIAN TRANSLATIONS ===\n');

    // Check English words count
    const enWordsCount = await client.query(`
      SELECT COUNT(*) as count FROM source_words_english WHERE level = 'beginner'
    `);
    console.log(`English beginner words: ${enWordsCount.rows[0].count}`);

    // Check Russian translation tables
    const ruTables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename LIKE 'target_translations_russian%'
      ORDER BY tablename
    `);
    console.log(`\nRussian translation tables (${ruTables.rows.length}):`);
    ruTables.rows.forEach(r => console.log(`  - ${r.tablename}`));

    // Check if target_translations_russian_from_en exists
    const hasEnRu = ruTables.rows.some(r => r.tablename === 'target_translations_russian_from_en');
    console.log(`\nDoes target_translations_russian_from_en exist? ${hasEnRu ? 'YES' : 'NO'}`);

    // Check target_translations_russian content
    const ruContent = await client.query(`
      SELECT source_lang, COUNT(*) as count
      FROM target_translations_russian
      GROUP BY source_lang
    `);
    console.log(`\ntarget_translations_russian content:`);
    console.table(ruContent.rows);

    // Check if there's data in from_en table
    if (hasEnRu) {
      const enRuCount = await client.query(`
        SELECT COUNT(*) as count FROM target_translations_russian_from_en
      `);
      console.log(`\ntarget_translations_russian_from_en count: ${enRuCount.rows[0].count}`);
    }

    console.log('\n=== CONCLUSION ===');
    if (!hasEnRu) {
      console.log('❌ No English→Russian translation table exists!');
      console.log('Need to create target_translations_russian_from_en table and populate it.');
    } else {
      console.log('✅ Table exists, but may be empty.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEnRuTranslations();
