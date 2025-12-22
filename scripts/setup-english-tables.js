const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function setupEnglishTables() {
  const client = await pool.connect();

  try {
    console.log('🔧 Setting up English vocabulary tables...\n');

    // 1. Create source_words_english table
    console.log('1️⃣ Creating source_words_english table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS source_words_english (
        id SERIAL PRIMARY KEY,
        word TEXT NOT NULL UNIQUE,
        level VARCHAR(10),
        part_of_speech VARCHAR(50),
        frequency_rank INTEGER,
        example_en TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('   ✅ source_words_english created\n');

    // 2. Create translation tables for all 12 languages
    const languages = [
      'russian', 'polish', 'arabic', 'turkish', 'romanian', 'serbian',
      'ukrainian', 'german', 'italian', 'spanish', 'portuguese', 'swahili'
    ];

    for (const lang of languages) {
      console.log(`2️⃣ Creating target_translations_${lang} for English source...`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS target_translations_${lang}_from_en (
          id SERIAL PRIMARY KEY,
          source_lang VARCHAR(10) DEFAULT 'en',
          source_word_id INTEGER REFERENCES source_words_english(id) ON DELETE CASCADE,
          translation TEXT NOT NULL,
          example_native TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(source_lang, source_word_id)
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${lang}_from_en_source_word
        ON target_translations_${lang}_from_en(source_word_id);
      `);

      console.log(`   ✅ target_translations_${lang}_from_en created\n`);
    }

    // 3. Create universal collections structure (if not exists)
    console.log('3️⃣ Ensuring universal_collections supports English...');

    // Check if we need to modify universal_collections
    const checkSource = await client.query(`
      SELECT COUNT(*) as count
      FROM universal_collections
      WHERE source_lang = 'en'
    `);

    console.log(`   ℹ️  Found ${checkSource.rows[0].count} existing English collections\n`);

    console.log('✅ All English tables created successfully!\n');
    console.log('📊 Structure:');
    console.log('   - source_words_english (main vocabulary table)');
    console.log('   - 12 translation tables (target_translations_*_from_en)');
    console.log('   - Compatible with universal_collections system\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupEnglishTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
