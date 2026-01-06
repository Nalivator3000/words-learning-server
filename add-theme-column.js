/**
 * Add theme column to source_words tables that don't have it
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const LANGUAGES_NEEDING_THEME = [
  'italian',
  'portuguese',
  'arabic',
  'chinese',
  'hindi',
  'japanese',
  'korean',
  'polish',
  'romanian',
  'russian',
  'serbian',
  'swahili',
  'turkish',
  'ukrainian'
];

async function addThemeColumns() {
  try {
    console.log('\n🔧 Adding theme column to languages...\n');

    for (const lang of LANGUAGES_NEEDING_THEME) {
      const tableName = `source_words_${lang}`;

      try {
        // Check if column already exists
        const checkResult = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = $1 AND column_name = 'theme'
          )
        `, [tableName]);

        if (checkResult.rows[0].exists) {
          console.log(`   ⏭️  ${lang}: theme column already exists`);
          continue;
        }

        // Add theme column
        await pool.query(`
          ALTER TABLE ${tableName}
          ADD COLUMN theme VARCHAR(50)
        `);

        console.log(`   ✅ ${lang}: theme column added`);

      } catch (error) {
        console.log(`   ❌ ${lang}: ${error.message}`);
      }
    }

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addThemeColumns();
