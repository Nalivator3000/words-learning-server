const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Import all B2 collections
const part1 = require('./create-b2-remaining.js').collections;
const part2 = require('./create-b2-remaining-part2.js').collections;
const part3 = require('./create-b2-remaining-part3.js').collections;

const allCollections = [...part1, ...part2, ...part3];

async function importCollections() {
  const client = await pool.connect();

  try {
    console.log('Starting B2 remaining vocabulary import...\n');

    let totalImported = 0;

    for (const collection of allCollections) {
      console.log(`\nImporting collection: ${collection.name}`);
      console.log(`Words to import: ${collection.words.length}`);

      // Insert collection
      const collectionResult = await client.query(
        `INSERT INTO global_word_collections
         (name, description, from_lang, to_lang, difficulty_level, is_public, word_count)
         VALUES ($1, $2, 'de', 'ru', $3, true, $4)
         RETURNING id`,
        [collection.name, collection.description, collection.level, collection.words.length]
      );

      const collectionId = collectionResult.rows[0].id;
      console.log(`Created collection ID: ${collectionId}`);

      // Insert words
      let imported = 0;
      for (const word of collection.words) {
        try {
          await client.query(
            `INSERT INTO global_collection_words
             (collection_id, word, translation, example)
             VALUES ($1, $2, $3, $4)`,
            [
              collectionId,
              word.word,
              word.translation,
              word.example
            ]
          );
          imported++;
        } catch (err) {
          console.error(`Error importing word "${word.word}":`, err.message);
        }
      }

      console.log(`Imported ${imported}/${collection.words.length} words`);
      totalImported += imported;
    }

    console.log(`\n✅ Import complete!`);
    console.log(`Total collections: ${allCollections.length}`);
    console.log(`Total words imported: ${totalImported}`);

    // Show total B2 count
    const b2Count = await client.query(
      `SELECT COUNT(*) FROM global_collection_words
       WHERE collection_id IN (
         SELECT id FROM global_word_collections
         WHERE from_lang = 'de' AND to_lang = 'ru' AND difficulty_level = 'B2'
       )`
    );

    console.log(`\nTotal B2 words in database: ${b2Count.rows[0].count}`);

  } catch (err) {
    console.error('Import error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

importCollections();
