const { Client } = require('pg');

const publicDatabaseUrl = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

async function checkStats() {
  const client = new Client({
    connectionString: publicDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const tables = ['russian', 'arabic', 'italian', 'portuguese', 'turkish', 'ukrainian', 'spanish'];

  console.log('\n📊 Theme Statistics:\n');

  for (const lang of tables) {
    const tableName = `source_words_${lang}`;
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE theme IS NOT NULL AND theme != 'general') as themed,
          COUNT(*) FILTER (WHERE theme IS NULL OR theme = 'general') as unthemed
         FROM ${tableName}`
      );

      const { total, themed, unthemed } = result.rows[0];
      const percent = ((themed / total) * 100).toFixed(1);
      console.log(`${lang.toUpperCase().padEnd(12)} ${themed.toString().padStart(4)}/${total.toString().padEnd(4)} (${percent}%) с темами, ${unthemed} без тем`);
    } catch (error) {
      console.log(`${lang.toUpperCase().padEnd(12)} Error: ${error.message}`);
    }
  }

  await client.end();
}

checkStats().catch(console.error);
