const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function setupSpanishTables() {
  const client = await pool.connect();

  try {
    console.log('🔧 Setting up Spanish vocabulary tables...\n');

    // 1. Create source_words_spanish table
    console.log('1️⃣ Creating source_words_spanish table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS source_words_spanish (
        id SERIAL PRIMARY KEY,
        word TEXT NOT NULL UNIQUE,
        level VARCHAR(10),
        part_of_speech VARCHAR(50),
        frequency_rank INTEGER,
        example_es TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('   ✅ source_words_spanish created\n');

    // 2. Create translation tables for all 12 languages
    const languages = [
      'russian', 'polish', 'arabic', 'turkish', 'romanian', 'serbian',
      'ukrainian', 'english', 'german', 'italian', 'portuguese', 'swahili'
    ];

    for (const lang of languages) {
      console.log(`2️⃣ Creating target_translations_${lang} for Spanish source...`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS target_translations_${lang}_from_es (
          id SERIAL PRIMARY KEY,
          source_lang VARCHAR(10) DEFAULT 'es',
          source_word_id INTEGER REFERENCES source_words_spanish(id) ON DELETE CASCADE,
          translation TEXT NOT NULL,
          example_native TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(source_lang, source_word_id)
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${lang}_from_es_source_word
        ON target_translations_${lang}_from_es(source_word_id);
      `);

      console.log(`   ✅ target_translations_${lang}_from_es created\n`);
    }

    // 3. Check existing Spanish collections
    console.log('3️⃣ Ensuring universal_collections supports Spanish...');

    const checkSource = await client.query(`
      SELECT COUNT(*) as count
      FROM universal_collections
      WHERE source_lang = 'es'
    `);

    console.log(`   ℹ️  Found ${checkSource.rows[0].count} existing Spanish collections\n`);

    console.log('✅ All Spanish tables created successfully!\n');
    console.log('📊 Structure:');
    console.log('   - source_words_spanish (main vocabulary table)');
    console.log('   - 12 translation tables (target_translations_*_from_es)');
    console.log('   - Compatible with universal_collections system\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupSpanishTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
