require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkActualUsage() {
  const client = await pool.connect();

  try {
    console.log('=== CHECKING ACTUAL LANGUAGE PAIRS IN DATABASE ===\n');

    // Check language_pairs table
    const pairs = await client.query(`
      SELECT id, from_lang, to_lang
      FROM language_pairs
      ORDER BY from_lang, to_lang
    `);

    console.log(`Total language pairs in language_pairs table: ${pairs.rows.length}\n`);

    // Group by to_lang
    const byTarget = {};
    pairs.rows.forEach(p => {
      if (!byTarget[p.to_lang]) byTarget[p.to_lang] = [];
      byTarget[p.to_lang].push(p);
    });

    for (const [targetLang, pairList] of Object.entries(byTarget)) {
      console.log(`\n=== ${targetLang.toUpperCase()} (${pairList.length} pairs) ===`);
      pairList.forEach(p => {
        console.log(`  ${p.from_lang} → ${p.to_lang}`);
      });
    }

    console.log(`\n\n=== CHECKING BASE TABLES WITH source_lang COLUMN ===\n`);

    const baseTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'target_translations_%'
        AND tablename NOT LIKE '%_from_%'
      ORDER BY tablename
    `);

    for (const row of baseTables.rows) {
      const table = row.tablename;

      // Check if has source_lang column
      const hasSourceLang = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'source_lang'
        )
      `, [table]);

      if (hasSourceLang.rows[0].exists) {
        // Count by source_lang
        const counts = await client.query(`
          SELECT source_lang, COUNT(*) as count
          FROM ${table}
          GROUP BY source_lang
          ORDER BY source_lang
        `);

        console.log(`${table}:`);
        counts.rows.forEach(c => {
          console.log(`  ${c.source_lang}: ${c.count} records`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkActualUsage();
