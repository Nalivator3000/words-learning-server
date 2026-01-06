const { Client } = require('pg');

async function checkSourceWords() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    const languages = ['russian', 'arabic', 'italian', 'portuguese', 'turkish', 'ukrainian'];

    for (const lang of languages) {
      const tableName = `source_words_${lang}`;

      // Get columns
      const columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      console.log(`\n📋 ${tableName}:`);
      console.log('Columns:', columns.rows.map(c => c.column_name).join(', '));

      // Get count
      const count = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`Total words: ${count.rows[0].count}`);

      // Check if theme column exists
      const hasTheme = columns.rows.some(c => c.column_name === 'theme');
      console.log(`Has theme column: ${hasTheme ? '✅' : '❌'}`);

      // Get sample
      const sample = await client.query(`SELECT * FROM ${tableName} LIMIT 2`);
      if (sample.rows.length > 0) {
        console.log('Sample:', JSON.stringify(sample.rows[0], null, 2).substring(0, 200) + '...');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSourceWords();
