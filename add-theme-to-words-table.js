/**
 * Add theme column to the main words table
 */

const { Client } = require('pg');

async function addThemeColumn() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  const client = new Client({
    connectionString: connString,
    ssl: connString.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if column already exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'words' AND column_name = 'theme'
      ) as exists
    `);

    if (checkResult.rows[0].exists) {
      console.log('⏭️  Theme column already exists in words table');
      return;
    }

    console.log('🔧 Adding theme column to words table...');

    // Add theme column
    await client.query(`
      ALTER TABLE words
      ADD COLUMN theme VARCHAR(50)
    `);

    console.log('✅ Theme column added successfully!');

    // Create index for better performance
    console.log('🔧 Creating index on theme column...');
    await client.query(`
      CREATE INDEX idx_words_theme ON words(theme)
    `);

    console.log('✅ Index created!');

    // Show stats
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_words,
        COUNT(CASE WHEN source = 'system' THEN 1 END) as system_words,
        COUNT(CASE WHEN source = 'custom' THEN 1 END) as custom_words
      FROM words
    `);

    console.log('\n📊 Words table statistics:');
    console.log(`   Total words: ${stats.rows[0].total_words}`);
    console.log(`   System words: ${stats.rows[0].system_words}`);
    console.log(`   Custom words: ${stats.rows[0].custom_words}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addThemeColumn();
