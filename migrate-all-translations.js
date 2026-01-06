require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateAllTranslations() {
  const client = await pool.connect();

  try {
    console.log('=== MIGRATING ALL MISSING TRANSLATIONS ===\n');

    // Get all _from_X tables
    const fromTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'target_translations_%_from_%'
      ORDER BY tablename
    `);

    console.log(`Found ${fromTables.rows.length} _from_X tables to process\n`);

    let totalMigrated = 0;
    let totalSkipped = 0;
    let errors = 0;

    for (const row of fromTables.rows) {
      const fromTable = row.tablename;

      // Parse table name: target_translations_TARGETLANG_from_SOURCELANG
      const match = fromTable.match(/target_translations_(.+)_from_(.+)/);
      if (!match) {
        console.log(`⚠️  Skipping ${fromTable} - couldn't parse table name`);
        continue;
      }

      const targetLang = match[1];
      const sourceLang = match[2];
      const baseTable = `target_translations_${targetLang}`;

      // Check if base table exists
      const baseTableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [baseTable]);

      if (!baseTableExists.rows[0].exists) {
        console.log(`⚠️  Base table ${baseTable} doesn't exist - skipping ${sourceLang}→${targetLang}`);
        continue;
      }

      // Check if already migrated
      const existingCount = await client.query(`
        SELECT COUNT(*) as count
        FROM ${baseTable}
        WHERE source_lang = $1
      `, [sourceLang]);

      const existing = parseInt(existingCount.rows[0].count);

      // Get count in _from_X table
      const fromCount = await client.query(`
        SELECT COUNT(*) as count FROM ${fromTable}
      `);
      const fromRecords = parseInt(fromCount.rows[0].count);

      if (existing >= fromRecords) {
        console.log(`✅ ${sourceLang}→${targetLang}: Already migrated (${existing} records)`);
        totalSkipped++;
        continue;
      }

      try {
        console.log(`🔄 ${sourceLang}→${targetLang}: Migrating ${fromRecords} records...`);

        // Check if from table has example_native column
        const columns = await client.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = $1
        `, [fromTable]);

        const hasExampleNative = columns.rows.some(c => c.column_name === 'example_native');
        const exampleColumn = hasExampleNative ? 'example_native' : 'NULL';

        // Determine target language code for example column in base table
        // Base table uses example_XX where XX is the target language code
        const targetLangCode = targetLang.length === 2 ? targetLang : targetLang.substring(0, 2);
        const exampleTargetColumn = `example_${targetLangCode}`;

        // Insert data
        const insertQuery = `
          INSERT INTO ${baseTable} (source_lang, source_word_id, translation, ${exampleTargetColumn}, created_at, updated_at)
          SELECT
            source_lang,
            source_word_id,
            translation,
            ${exampleColumn},
            created_at,
            NOW() as updated_at
          FROM ${fromTable}
          WHERE NOT EXISTS (
            SELECT 1 FROM ${baseTable} bt
            WHERE bt.source_lang = ${fromTable}.source_lang
              AND bt.source_word_id = ${fromTable}.source_word_id
              AND bt.translation = ${fromTable}.translation
          )
        `;

        const result = await client.query(insertQuery);

        console.log(`   ✅ Migrated ${result.rowCount} records`);
        totalMigrated += result.rowCount;

      } catch (err) {
        console.error(`   ❌ Error migrating ${sourceLang}→${targetLang}: ${err.message}`);
        errors++;
      }
    }

    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Total migrated: ${totalMigrated} records`);
    console.log(`Already existed: ${totalSkipped} language pairs`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAllTranslations();
