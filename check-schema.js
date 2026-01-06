const { Client } = require('pg');

async function checkSchema() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Check words table columns
    const columns = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'words'
      ORDER BY ordinal_position
    `);

    console.log('📋 Words table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    // Check if theme column exists
    const hasTheme = columns.rows.some(col => col.column_name === 'theme');
    console.log(`\n${hasTheme ? '✅' : '❌'} Theme column exists: ${hasTheme}`);

    // Check migration status
    const migrations = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migrations'
      ) as exists
    `);

    if (migrations.rows[0].exists) {
      const migList = await client.query('SELECT * FROM migrations ORDER BY id');
      console.log(`\n📝 Applied migrations (${migList.rows.length}):`);
      migList.rows.forEach(m => {
        console.log(`  ${m.id}. ${m.name} - ${new Date(m.executed_at).toLocaleString()}`);
      });
    } else {
      console.log('\n⚠️  Migrations table does not exist');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
