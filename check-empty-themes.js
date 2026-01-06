const { Client } = require('pg');

async function checkEmptyThemes() {
  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const langs = ['japanese', 'swahili', 'hindi'];

  console.log('\n📊 Статус языков без тем:\n');

  for (const lang of langs) {
    const stats = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN theme IS NULL THEN 1 END) as null_themes,
             COUNT(CASE WHEN theme = 'general' THEN 1 END) as general_themes,
             COUNT(CASE WHEN theme IS NOT NULL AND theme != 'general' THEN 1 END) as specific_themes
      FROM source_words_${lang}
    `);

    const s = stats.rows[0];
    console.log(`${lang.toUpperCase()}:`);
    console.log(`  Total: ${s.total}`);
    console.log(`  NULL themes: ${s.null_themes}`);
    console.log(`  General themes: ${s.general_themes}`);
    console.log(`  Specific themes: ${s.specific_themes}\n`);
  }

  await client.end();
}

checkEmptyThemes().catch(console.error);
