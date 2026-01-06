const { Client } = require('pg');

async function checkTables() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // List all tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📋 All tables in database:');
    tables.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

    // Find language-related tables
    const langTables = tables.rows.filter(t =>
      t.table_name.includes('language') || t.table_name.includes('pair')
    );

    console.log('\n🌍 Language-related tables:');
    langTables.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

    // Try different table name variations
    const possibleNames = ['languagepairs', 'language_pairs', 'LanguagePairs'];

    for (const name of possibleNames) {
      try {
        const result = await client.query(`SELECT * FROM ${name} LIMIT 1`);
        console.log(`\n✅ Found table: ${name}`);
        console.log('Columns:', Object.keys(result.rows[0] || {}));
      } catch (e) {
        // Table doesn't exist, continue
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
