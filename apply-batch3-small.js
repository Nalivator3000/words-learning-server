const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read the SQL file and split into smaller batches
const sqlFile = fs.readFileSync(path.join(__dirname, 'apply-batch3-themes.sql'), 'utf-8');
const statements = sqlFile
  .split('\n')
  .filter(line => line.trim().startsWith('UPDATE'))
  .slice(0, 100); // First 100 statements only

console.log(`Will execute ${statements.length} UPDATE statements`);

const connectionString = process.env.DATABASE_URL;

async function execute() {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('railway') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    await client.query('BEGIN');
    let updated = 0;

    for (const stmt of statements) {
      const result = await client.query(stmt);
      if (result.rowCount > 0) {
        updated++;
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ Successfully updated ${updated} words`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

execute();
