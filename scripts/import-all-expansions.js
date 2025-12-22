const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

// Import all expansion files
const a1Expansion = require('./add-a1-expansion.js').collections;
const a2Expansion = require('./add-a2-expansion.js').collections;
const b1Part1 = require('./add-b1-part1.js').collections;
const b1Part2 = require('./add-b1-part2.js').collections;
const b2Expansion = require('./add-b2-expansion.js').collections;
const c1Expansion = require('./add-c1-expansion.js').collections;
const c2Part7 = require('./create-c2-part7.js').collections;
const c2Part8 = require('./create-c2-part8.js').collections;

const allCollections = [
  ...a1Expansion,
  ...a2Expansion,
  ...b1Part1,
  ...b1Part2,
  ...b2Expansion,
  ...c1Expansion,
  ...c2Part7,
  ...c2Part8
];

function extractTheme(collectionName) {
  const match = collectionName.match(/:\s*(.+)/);
  if (match) {
    return match[1].substring(0, 100);
  }
  return 'general';
}

async function importExpansions() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting import of all German vocabulary expansions...\n');

    let totalWordsImported = 0;
    let totalTranslationsCreated = 0;
    let totalCollectionsCreated = 0;
    let duplicatesSkipped = 0;

    for (const collection of allCollections) {
      console.log(`\n📚 Processing: ${collection.name}`);

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

      let orderIndex = 0;

      // Import words
      for (const wordData of collection.words) {
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
      }

      console.log(`   ✅ Added ${collection.words.length} words`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Collections created: ${totalCollectionsCreated}`);
    console.log(`✅ New German words: ${totalWordsImported}`);
    console.log(`⚠️  Duplicates skipped: ${duplicatesSkipped}`);
    console.log(`✅ New Russian translations: ${totalTranslationsCreated}`);

    // Final verification
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL VERIFICATION');
    console.log('='.repeat(60));

    const levels = await client.query(`
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

    const targets = {
      'A1': 800,
      'A2': 1000,
      'B1': 1200,
      'B2': 1800,
      'C1': 2500,
      'C2': 3500
    };

    console.log('\nLevel | Current | Target | Status');
    console.log('------|---------|--------|--------');

    let totalCurrent = 0;
    levels.rows.forEach(row => {
      const current = parseInt(row.count);
      const target = targets[row.level] || 0;
      const status = target > 0 && current >= target ? '✅' : target > 0 ? '⏳' : 'N/A';

      if (target > 0) totalCurrent += current;

      console.log(`${row.level.padEnd(5)} | ${current.toString().padStart(7)} | ${target.toString().padStart(6)} | ${status}`);
    });

    console.log('------|---------|--------|--------');
    console.log(`TOTAL | ${totalCurrent.toString().padStart(7)} | ${(10800).toString().padStart(6)} | ${totalCurrent >= 10800 ? '✅' : '⏳'}`);

    console.log('\n✅ Import complete!');

  } catch (err) {
    console.error('❌ Import error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

importExpansions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
