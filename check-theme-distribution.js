const { Client } = require('pg');

async function checkThemeStats() {
  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const languages = ['italian', 'portuguese', 'turkish', 'russian', 'arabic', 'ukrainian'];

  console.log('\n📊 СТАТУС ТЕМ ПО ЯЗЫКАМ\n');

  for (const lang of languages) {
    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN theme = 'general' THEN 1 END) as general,
        COUNT(CASE WHEN theme != 'general' THEN 1 END) as themed
      FROM source_words_${lang}
    `);

    const s = stats.rows[0];
    const pct = ((s.themed / s.total) * 100).toFixed(1);
    const icon = s.general == 0 ? '✅' : '⚠️';

    console.log(`${icon} ${lang.toUpperCase().padEnd(12)} | Всего: ${s.total} | Тематические: ${s.themed} (${pct}%) | General: ${s.general}`);

    // Если есть general, покажем распределение тем
    if (s.general > 0) {
      console.log(`\n   Распределение тем для ${lang}:`);
      const themes = await client.query(`
        SELECT theme, COUNT(*) as count
        FROM source_words_${lang}
        GROUP BY theme
        ORDER BY count DESC
        LIMIT 25
      `);

      for (const t of themes.rows) {
        console.log(`   - ${t.theme}: ${t.count}`);
      }
      console.log('');
    }
  }

  await client.end();
}

checkThemeStats().catch(console.error);
