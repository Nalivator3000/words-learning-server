// Import C1 vocabulary to universal structure
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Import all C1 parts
const part1 = require('./create-c1-part1.js').collections;
const part2 = require('./create-c1-part2.js').collections;
const part3 = require('./create-c1-part3.js').collections;
const part4 = require('./create-c1-part4.js').collections;
const part5 = require('./create-c1-part5.js').collections;

const allCollections = [...part1, ...part2, ...part3, ...part4, ...part5];

async function importC1ToUniversal() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting C1 import to universal structure...\n');
    console.log(`📚 Total collections: ${allCollections.length}`);

    let totalWordsImported = 0;
    let totalTranslationsCreated = 0;
    let totalCollectionsCreated = 0;

    for (const collection of allCollections) {
      console.log(`\n📖 Processing: ${collection.name}`);
      console.log(`   Words to import: ${collection.words.length}`);

      // Create universal collection
      const collectionResult = await client.query(`
        INSERT INTO universal_collections
        (name, description, source_lang, level, theme, is_public, word_count)
        VALUES ($1, $2, 'de', $3, $4, true, $5)
        RETURNING id
      `, [
        collection.name,
        collection.description,
        collection.level,
        extractTheme(collection.name),
        collection.words.length
      ]);

      const collectionId = collectionResult.rows[0].id;
      totalCollectionsCreated++;

      // Import words
      let orderIndex = 0;
      for (const wordData of collection.words) {
        try {
          // Check if German word already exists
          let germanWordId;
          const existing = await client.query(`
            SELECT id FROM source_words_german
            WHERE word = $1 AND level = $2
          `, [wordData.word, collection.level]);

          if (existing.rows.length > 0) {
            germanWordId = existing.rows[0].id;
            console.log(`   ↻ Word exists: ${wordData.word}`);
          } else {
            // Insert German word
            const result = await client.query(`
              INSERT INTO source_words_german
              (word, level, example_de, theme)
              VALUES ($1, $2, $3, $4)
              RETURNING id
            `, [
              wordData.word,
              collection.level,
              wordData.example,
              extractTheme(collection.name)
            ]);

            germanWordId = result.rows[0].id;
            totalWordsImported++;
            console.log(`   ✓ Added: ${wordData.word}`);
          }

          // Check if Russian translation exists
          const existingTranslation = await client.query(`
            SELECT id FROM target_translations_russian
            WHERE source_lang = 'de' AND source_word_id = $1
          `, [germanWordId]);

          if (existingTranslation.rows.length === 0) {
            // Insert Russian translation
            await client.query(`
              INSERT INTO target_translations_russian
              (source_lang, source_word_id, translation)
              VALUES ('de', $1, $2)
            `, [germanWordId, wordData.translation]);

            totalTranslationsCreated++;
          }

          // Link word to collection
          await client.query(`
            INSERT INTO universal_collection_words
            (collection_id, source_word_id, order_index)
            VALUES ($1, $2, $3)
            ON CONFLICT (collection_id, source_word_id) DO NOTHING
          `, [collectionId, germanWordId, orderIndex++]);

        } catch (err) {
          console.error(`   ❌ Error with word "${wordData.word}":`, err.message);
        }
      }

      console.log(`   ✅ Collection created with ${orderIndex} words`);
    }

    console.log('\n\n📊 Import Summary:');
    console.log(`   Collections created: ${totalCollectionsCreated}`);
    console.log(`   New German words: ${totalWordsImported}`);
    console.log(`   New Russian translations: ${totalTranslationsCreated}`);

    // Verify
    console.log('\n🔍 Verification:');
    const totalGerman = await client.query('SELECT COUNT(*) FROM source_words_german WHERE level = \'C1\'');
    const totalRussian = await client.query(`
      SELECT COUNT(*) FROM target_translations_russian tr
      JOIN source_words_german sw ON tr.source_word_id = sw.id
      WHERE tr.source_lang = 'de' AND sw.level = 'C1'
    `);
    const totalC1Collections = await client.query('SELECT COUNT(*) FROM universal_collections WHERE source_lang = \'de\' AND level = \'C1\'');

    console.log(`   C1 German words in DB: ${totalGerman.rows[0].count}`);
    console.log(`   C1 Russian translations in DB: ${totalRussian.rows[0].count}`);
    console.log(`   C1 collections in DB: ${totalC1Collections.rows[0].count}`);

    console.log('\n✅ C1 import complete!');

  } catch (err) {
    console.error('❌ Import error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper function
function extractTheme(collectionName) {
  const name = collectionName.toLowerCase();

  if (name.includes('professional') || name.includes('business') || name.includes('work')) return 'work';
  if (name.includes('academic') || name.includes('scientific')) return 'education';
  if (name.includes('politics') || name.includes('political')) return 'politics';
  if (name.includes('economics') || name.includes('finance')) return 'economics';
  if (name.includes('philosophy')) return 'philosophy';
  if (name.includes('technology')) return 'science';
  if (name.includes('literature') || name.includes('literary')) return 'culture';
  if (name.includes('medicine') || name.includes('medical')) return 'medicine';
  if (name.includes('psychology') || name.includes('psychiatry')) return 'psychology';
  if (name.includes('sociology') || name.includes('social')) return 'sociology';
  if (name.includes('environment')) return 'environment';
  if (name.includes('law') || name.includes('legal')) return 'law';
  if (name.includes('arts') || name.includes('cultural')) return 'culture';
  if (name.includes('emotion')) return 'general';
  if (name.includes('formal') || name.includes('academic language')) return 'education';

  return 'general';
}

// Run import
importC1ToUniversal().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
