// Import C2 vocabulary to universal structure
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Import all C2 parts
const part1 = require('./create-c2-part1.js').collections;
const part2 = require('./create-c2-part2.js').collections;
const part3 = require('./create-c2-part3.js').collections;
const part4 = require('./create-c2-part4.js').collections;
const part5 = require('./create-c2-part5.js').collections;
const part6 = require('./create-c2-part6.js').collections;

const allCollections = [...part1, ...part2, ...part3, ...part4, ...part5, ...part6];

console.log(`📚 Загружено ${allCollections.length} C2 коллекций`);
console.log(`📝 Всего слов для импорта: ${allCollections.reduce((sum, c) => sum + c.words.length, 0)}\n`);

async function importC2ToUniversal() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting C2 import to universal structure...\n');

    let totalWordsImported = 0;
    let totalTranslationsCreated = 0;
    let totalCollectionsCreated = 0;
    let duplicatesSkipped = 0;

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
            duplicatesSkipped++;
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

    console.log('\n\n📊 C2 Import Summary:');
    console.log(`   Collections created: ${totalCollectionsCreated}`);
    console.log(`   New German words: ${totalWordsImported}`);
    console.log(`   Duplicates skipped: ${duplicatesSkipped}`);
    console.log(`   New Russian translations: ${totalTranslationsCreated}`);

    // Verify
    console.log('\n🔍 Verification:');
    const totalGerman = await client.query('SELECT COUNT(*) FROM source_words_german WHERE level = \'C2\'');
    const totalRussian = await client.query(`
      SELECT COUNT(*) FROM target_translations_russian tr
      JOIN source_words_german sw ON tr.source_word_id = sw.id
      WHERE tr.source_lang = 'de' AND sw.level = 'C2'
    `);
    const totalC2Collections = await client.query('SELECT COUNT(*) FROM universal_collections WHERE source_lang = \'de\' AND level = \'C2\'');

    console.log(`   C2 German words in DB: ${totalGerman.rows[0].count}`);
    console.log(`   C2 Russian translations in DB: ${totalRussian.rows[0].count}`);
    console.log(`   C2 collections in DB: ${totalC2Collections.rows[0].count}`);

    // Overall stats
    console.log('\n📈 ОБЩАЯ СТАТИСТИКА БД:');
    const allLevels = await client.query(`
      SELECT level, COUNT(*) as count
      FROM source_words_german
      GROUP BY level
      ORDER BY
        CASE level
          WHEN 'beginner' THEN 0
          WHEN 'A1' THEN 1
          WHEN 'A2' THEN 2
          WHEN 'B1' THEN 3
          WHEN 'B2' THEN 4
          WHEN 'C1' THEN 5
          WHEN 'C2' THEN 6
          ELSE 99
        END
    `);

    console.log('   Немецкие слова по уровням:');
    let grandTotal = 0;
    allLevels.rows.forEach(r => {
      console.log(`   ${r.level}: ${r.count} слов`);
      grandTotal += parseInt(r.count);
    });
    console.log(`   \n   ВСЕГО: ${grandTotal} слов`);

    console.log('\n✅ C2 import complete! 🎉');

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

  if (name.includes('academic') || name.includes('scientific')) return 'education';
  if (name.includes('literary') || name.includes('rhetorical')) return 'culture';
  if (name.includes('politics') || name.includes('political') || name.includes('diplomatic')) return 'politics';
  if (name.includes('economics') || name.includes('finance') || name.includes('economic')) return 'economics';
  if (name.includes('philosophy') || name.includes('philosophical')) return 'philosophy';
  if (name.includes('medicine') || name.includes('medical')) return 'medicine';
  if (name.includes('legal') || name.includes('juridical') || name.includes('law')) return 'law';
  if (name.includes('cultural') || name.includes('sociological')) return 'culture';
  if (name.includes('technical') || name.includes('engineering')) return 'science';
  if (name.includes('environment') || name.includes('climate')) return 'environment';
  if (name.includes('mathematics') || name.includes('logic')) return 'science';
  if (name.includes('idiomatic') || name.includes('colloquial')) return 'general';
  if (name.includes('emotion') || name.includes('psychological')) return 'psychology';
  if (name.includes('verb') || name.includes('adjective') || name.includes('adverb')) return 'general';

  return 'general';
}

// Run import
importC2ToUniversal().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
