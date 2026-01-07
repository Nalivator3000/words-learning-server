const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

console.log('Checking Arabic language tables...\n');

// Promisify db methods
const dbAll = (sql) => {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql) => {
  return new Promise((resolve, reject) => {
    db.get(sql, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

async function fixArabicTables() {
  try {
    // Check existing tables
    const tables = await dbAll(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND (name LIKE '%arabic%' OR name LIKE '%_ar%')
      ORDER BY name
    `);

    console.log('Existing Arabic-related tables:');
    tables.forEach(t => console.log(`  - ${t.name}`));

    // Check for target_translations_english_from_ar
    const checkTable = await dbGet(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name = 'target_translations_english_from_ar'
    `);

    if (!checkTable) {
      console.log('\n❌ Missing table: target_translations_english_from_ar');

      // Check if source_words_arabic exists
      const sourceWordsArabic = await dbGet(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name = 'source_words_arabic'
      `);

      if (sourceWordsArabic) {
        console.log('✓ Found source_words_arabic table\n');
        console.log('Creating target_translations_english_from_ar table...');

        // Check structure of an existing target_translations table
        const templateTable = await dbGet(`
          SELECT sql FROM sqlite_master
          WHERE type='table' AND name LIKE 'target_translations_english_from_%'
          LIMIT 1
        `);

        if (templateTable) {
          console.log('\nTemplate table SQL:');
          console.log(templateTable.sql);

          // Create the missing table
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS target_translations_english_from_ar (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              source_word_id INTEGER NOT NULL,
              translation TEXT NOT NULL,
              pos TEXT,
              example_source TEXT,
              example_translation TEXT,
              FOREIGN KEY (source_word_id) REFERENCES source_words_arabic(id) ON DELETE CASCADE
            )
          `;

          await dbRun(createTableSQL);
          console.log('✓ Created target_translations_english_from_ar table');

          // Create index
          await dbRun(`
            CREATE INDEX IF NOT EXISTS idx_target_translations_english_from_ar_source_word_id
            ON target_translations_english_from_ar(source_word_id)
          `);
          console.log('✓ Created index on source_word_id');

        } else {
          console.log('❌ No template table found');
        }
      } else {
        console.log('❌ source_words_arabic table not found');
      }
    } else {
      console.log('\n✓ target_translations_english_from_ar table exists');
    }

    // List all target_translations tables
    console.log('\nAll target_translations_english_from_* tables:');
    const targetTables = await dbAll(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name LIKE 'target_translations_english_from_%'
      ORDER BY name
    `);
    targetTables.forEach(t => console.log(`  - ${t.name}`));

    // Check if we need to populate the table with translations
    const count = await dbGet(`
      SELECT COUNT(*) as count FROM target_translations_english_from_ar
    `);

    console.log(`\nRecords in target_translations_english_from_ar: ${count.count}`);

    if (count.count === 0) {
      console.log('\n⚠️  Table is empty. You may need to populate it with translations.');
    }

    console.log('\n✓ Done');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

fixArabicTables();
