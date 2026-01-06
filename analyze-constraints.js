require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function analyzeConstraints() {
  const client = await pool.connect();

  try {
    console.log('=== ANALYZING TABLE CONSTRAINTS ===\n');

    const baseTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'target_translations_%'
        AND tablename NOT LIKE '%_from_%'
      ORDER BY tablename
    `);

    const canMigrate = [];
    const needsFixing = [];

    for (const row of baseTables.rows) {
      const table = row.tablename;

      // Check if has source_lang column
      const hasSourceLang = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'source_lang'
        )
      `, [table]);

      if (!hasSourceLang.rows[0].exists) {
        console.log(`⚠️  ${table}: No source_lang column - OLD SCHEMA`);
        continue;
      }

      // Check constraints
      const constraints = await client.query(`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = $1
          AND tc.constraint_type = 'UNIQUE'
        GROUP BY tc.constraint_name, tc.constraint_type
      `, [table]);

      // Check if has unique constraint on source_word_id only
      const hasSourceWordIdOnly = constraints.rows.some(c =>
        c.columns === 'source_word_id'
      );

      // Check if has proper multi-source unique constraint
      const hasProperConstraint = constraints.rows.some(c =>
        c.columns.includes('source_lang') && c.columns.includes('source_word_id')
      );

      // Count existing records
      const count = await client.query(`
        SELECT source_lang, COUNT(*) as count
        FROM ${table}
        GROUP BY source_lang
      `);

      const sourceLangs = count.rows.map(r => `${r.source_lang}(${r.count})`).join(', ');

      if (hasSourceWordIdOnly) {
        console.log(`❌ ${table}: UNIQUE(source_word_id) ONLY - Cannot migrate!`);
        console.log(`   Current data: ${sourceLangs}`);
        needsFixing.push(table);
      } else if (hasProperConstraint) {
        console.log(`✅ ${table}: UNIQUE(source_lang, source_word_id, ...) - Can migrate`);
        console.log(`   Current data: ${sourceLangs}`);
        canMigrate.push(table);
      } else {
        console.log(`⚠️  ${table}: No blocking constraints`);
        console.log(`   Current data: ${sourceLangs}`);
        canMigrate.push(table);
      }

      console.log('');
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Can migrate: ${canMigrate.length} tables`);
    console.log(`   ${canMigrate.join(', ')}`);
    console.log(`\n❌ Need constraint fixes: ${needsFixing.length} tables`);
    console.log(`   ${needsFixing.join(', ')}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeConstraints();
