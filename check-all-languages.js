const { Client } = require('pg');

async function checkAllLanguages() {
  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // Получаем все таблицы source_words_*
  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE 'source_words_%'
    ORDER BY table_name
  `);

  console.log('\n📊 ВСЕ ЯЗЫКИ В БАЗЕ ДАННЫХ\n');

  let totalWords = 0;
  let totalThemed = 0;
  let totalGeneral = 0;

  for (const table of tables.rows) {
    const lang = table.table_name.replace('source_words_', '');

    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN theme = 'general' THEN 1 END) as general,
        COUNT(CASE WHEN theme != 'general' THEN 1 END) as themed
      FROM ${table.table_name}
    `);

    const s = stats.rows[0];
    const pct = ((s.themed / s.total) * 100).toFixed(1);
    const icon = s.general == 0 ? '✅' : (pct >= 90 ? '🟡' : '⚠️');

    console.log(`${icon} ${lang.toUpperCase().padEnd(15)} | Всего: ${s.total.toString().padStart(5)} | Тематические: ${s.themed.toString().padStart(5)} (${pct.padStart(5)}%) | General: ${s.general.toString().padStart(5)}`);

    totalWords += parseInt(s.total);
    totalThemed += parseInt(s.themed);
    totalGeneral += parseInt(s.general);
  }

  console.log('\n' + '─'.repeat(100));
  const totalPct = ((totalThemed / totalWords) * 100).toFixed(1);
  console.log(`📈 ИТОГО: ${totalWords} слов | Тематические: ${totalThemed} (${totalPct}%) | General: ${totalGeneral}`);
  console.log('─'.repeat(100) + '\n');

  await client.end();
}

checkAllLanguages().catch(console.error);
