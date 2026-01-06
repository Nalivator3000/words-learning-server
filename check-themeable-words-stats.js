const { Client } = require('pg');

async function checkStats() {
  const connString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    const languages = ['russian', 'arabic', 'italian', 'portuguese', 'turkish', 'ukrainian'];

    for (const lang of languages) {
      const tableName = `source_words_${lang}`;

      console.log(`\n📊 ${lang.toUpperCase()}`);

      // Overall stats
      const overall = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN theme IS NULL THEN 1 END) as null_theme,
          COUNT(CASE WHEN theme = 'general' THEN 1 END) as general_theme,
          COUNT(CASE WHEN theme IS NOT NULL AND theme != 'general' THEN 1 END) as specific_theme
        FROM ${tableName}
      `);

      const o = overall.rows[0];
      console.log(`   Total: ${o.total}`);
      console.log(`   NULL theme: ${o.null_theme} (${((o.null_theme/o.total)*100).toFixed(1)}%)`);
      console.log(`   'general' theme: ${o.general_theme} (${((o.general_theme/o.total)*100).toFixed(1)}%)`);
      console.log(`   Specific themes: ${o.specific_theme} (${((o.specific_theme/o.total)*100).toFixed(1)}%)`);

      const themeable = parseInt(o.null_theme) + parseInt(o.general_theme);
      console.log(`   → Can theme: ${themeable} words`);

      // By level
      const byLevel = await client.query(`
        SELECT
          level,
          COUNT(*) as total,
          COUNT(CASE WHEN theme IS NULL OR theme = 'general' THEN 1 END) as themeable
        FROM ${tableName}
        GROUP BY level
        ORDER BY
          CASE level
            WHEN 'A1' THEN 1
            WHEN 'A2' THEN 2
            WHEN 'B1' THEN 3
            WHEN 'B2' THEN 4
            WHEN 'C1' THEN 5
            WHEN 'C2' THEN 6
            ELSE 7
          END
      `);

      console.log(`   By level:`);
      byLevel.rows.forEach(row => {
        console.log(`     ${row.level}: ${row.themeable}/${row.total} can be themed`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkStats();
