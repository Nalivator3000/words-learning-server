const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function migrateToUniversalStructure() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration to universal vocabulary structure...\n');

    // 1. Create new tables
    console.log('📋 Step 1: Creating new tables...');
    const migrationSQL = require('fs').readFileSync(
      __dirname + '/../migrations/create-universal-vocabulary-structure.sql',
      'utf8'
    );
    await client.query(migrationSQL);
    console.log('✅ Tables created\n');

    // 2. Migrate German words from old structure
    console.log('📋 Step 2: Migrating German words (de-ru)...');

    const oldCollections = await client.query(`
      SELECT id, name, difficulty_level as level, from_lang, to_lang
      FROM global_word_collections
      WHERE from_lang = 'de' AND to_lang = 'ru'
      ORDER BY id
    `);

    console.log(`Found ${oldCollections.rows.length} old collections\n`);

    let totalWordsMigrated = 0;
    let totalTranslationsMigrated = 0;
    const wordMap = new Map(); // old word -> new german word id

    for (const collection of oldCollections.rows) {
      console.log(`\n📚 Processing: ${collection.name} (Level: ${collection.level})`);

      // Get words from old collection
      const oldWords = await client.query(`
        SELECT word, translation, example
        FROM global_collection_words
        WHERE collection_id = $1
        ORDER BY id
      `, [collection.id]);

      console.log(`  Found ${oldWords.rows.length} words`);

      for (const oldWord of oldWords.rows) {
        try {
          // Check if German word already exists
          let germanWordId;
          const existing = await client.query(`
            SELECT id FROM source_words_german
            WHERE word = $1 AND level = $2
          `, [oldWord.word, collection.level]);

          if (existing.rows.length > 0) {
            germanWordId = existing.rows[0].id;
            console.log(`  ↻ Word exists: ${oldWord.word}`);
          } else {
            // Insert into source_words_german
            const result = await client.query(`
              INSERT INTO source_words_german
              (word, level, example_de, theme)
              VALUES ($1, $2, $3, $4)
              RETURNING id
            `, [
              oldWord.word,
              collection.level,
              oldWord.example || `Beispiel für ${oldWord.word}.`,
              extractTheme(collection.name)
            ]);

            germanWordId = result.rows[0].id;
            totalWordsMigrated++;
            console.log(`  ✓ Added: ${oldWord.word} (ID: ${germanWordId})`);
          }

          // Check if Russian translation exists
          const existingTranslation = await client.query(`
            SELECT id FROM target_translations_russian
            WHERE source_lang = 'de' AND source_word_id = $1
          `, [germanWordId]);

          if (existingTranslation.rows.length === 0) {
            // Insert into target_translations_russian
            await client.query(`
              INSERT INTO target_translations_russian
              (source_lang, source_word_id, translation)
              VALUES ('de', $1, $2)
            `, [germanWordId, oldWord.translation]);

            totalTranslationsMigrated++;
          }

          wordMap.set(oldWord.word, germanWordId);

        } catch (err) {
          console.error(`  ❌ Error with word "${oldWord.word}":`, err.message);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  German words migrated: ${totalWordsMigrated}`);
    console.log(`  Russian translations migrated: ${totalTranslationsMigrated}`);

    // 3. Create universal collections
    console.log('\n📋 Step 3: Creating universal collections...');

    for (const collection of oldCollections.rows) {
      // Create universal collection
      const newCollection = await client.query(`
        INSERT INTO universal_collections
        (name, description, source_lang, level, theme, is_public)
        VALUES ($1, $2, 'de', $3, $4, true)
        RETURNING id
      `, [
        collection.name,
        `Migrated from old structure`,
        collection.level,
        extractTheme(collection.name)
      ]);

      const newCollectionId = newCollection.rows[0].id;

      // Get words from old collection
      const oldWords = await client.query(`
        SELECT word FROM global_collection_words
        WHERE collection_id = $1
        ORDER BY id
      `, [collection.id]);

      // Link words to new collection
      let order = 0;
      for (const word of oldWords.rows) {
        const germanWordId = wordMap.get(word.word);
        if (germanWordId) {
          await client.query(`
            INSERT INTO universal_collection_words
            (collection_id, source_word_id, order_index)
            VALUES ($1, $2, $3)
            ON CONFLICT (collection_id, source_word_id) DO NOTHING
          `, [newCollectionId, germanWordId, order++]);
        }
      }

      // Update word count
      await client.query(`
        UPDATE universal_collections
        SET word_count = $1
        WHERE id = $2
      `, [order, newCollectionId]);

      console.log(`  ✓ Created collection: ${collection.name} (${order} words)`);
    }

    // 4. Verify migration
    console.log('\n📋 Step 4: Verifying migration...');

    const germanCount = await client.query('SELECT COUNT(*) FROM source_words_german');
    const russianCount = await client.query('SELECT COUNT(*) FROM target_translations_russian WHERE source_lang = \'de\'');
    const collectionsCount = await client.query('SELECT COUNT(*) FROM universal_collections WHERE source_lang = \'de\'');

    console.log(`\n✅ Migration Complete!`);
    console.log(`  German words in new structure: ${germanCount.rows[0].count}`);
    console.log(`  Russian translations in new structure: ${russianCount.rows[0].count}`);
    console.log(`  Universal collections: ${collectionsCount.rows[0].count}`);

    console.log('\n💡 Test query (get de-ru pairs):');
    const testQuery = await client.query(`
      SELECT
        sw.word as german,
        sw.example_de,
        tr.translation as russian,
        sw.level,
        sw.theme
      FROM source_words_german sw
      JOIN target_translations_russian tr
        ON tr.source_lang = 'de' AND tr.source_word_id = sw.id
      WHERE sw.level = 'A1'
      LIMIT 5
    `);

    console.log('\nSample A1 words:');
    testQuery.rows.forEach(row => {
      console.log(`  ${row.german} → ${row.russian} (${row.theme || 'general'})`);
    });

  } catch (err) {
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper function to extract theme from collection name
function extractTheme(collectionName) {
  const name = collectionName.toLowerCase();

  if (name.includes('greeting') || name.includes('common')) return 'greetings';
  if (name.includes('food') || name.includes('eating')) return 'food';
  if (name.includes('travel')) return 'travel';
  if (name.includes('work') || name.includes('professional') || name.includes('business')) return 'work';
  if (name.includes('family')) return 'family';
  if (name.includes('health') || name.includes('medical')) return 'health';
  if (name.includes('education')) return 'education';
  if (name.includes('home') || name.includes('house')) return 'home';
  if (name.includes('communication')) return 'communication';
  if (name.includes('politics') || name.includes('political')) return 'politics';
  if (name.includes('science') || name.includes('technology')) return 'science';
  if (name.includes('environment')) return 'environment';
  if (name.includes('culture') || name.includes('arts')) return 'culture';
  if (name.includes('philosophy')) return 'philosophy';
  if (name.includes('economics') || name.includes('finance')) return 'economics';
  if (name.includes('law') || name.includes('legal')) return 'law';
  if (name.includes('medicine')) return 'medicine';
  if (name.includes('psychology')) return 'psychology';
  if (name.includes('sociology')) return 'sociology';

  return 'general';
}

// Run migration
migrateToUniversalStructure().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
