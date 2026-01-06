require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAllTranslationTables() {
  const client = await pool.connect();

  try {
    console.log('=== CHECKING ALL TRANSLATION TABLES FOR MISSING DATA ===\n');

    // Get all target translation tables
    const allTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'target_translations_%'
      ORDER BY tablename
    `);

    // Separate base tables and _from_X tables
    const baseTables = [];
    const fromTables = [];

    allTables.rows.forEach(row => {
      const tableName = row.tablename;
      if (tableName.includes('_from_')) {
        fromTables.push(tableName);
      } else {
        baseTables.push(tableName);
      }
    });

    console.log(`Found ${baseTables.length} base tables and ${fromTables.length} _from_X tables\n`);

    const issues = [];

    // Check each base table
    for (const baseTable of baseTables) {
      const targetLang = baseTable.replace('target_translations_', '');

      // Get source languages in base table
      const baseSourceLangs = await client.query(`
        SELECT DISTINCT source_lang, COUNT(*) as count
        FROM ${baseTable}
        GROUP BY source_lang
        ORDER BY source_lang
      `);

      const baseSourceSet = new Set(baseSourceLangs.rows.map(r => r.source_lang));

      // Find corresponding _from_X tables for this target language
      const matchingFromTables = fromTables.filter(t =>
        t.startsWith(`target_translations_${targetLang}_from_`)
      );

      for (const fromTable of matchingFromTables) {
        const sourceLang = fromTable.replace(`target_translations_${targetLang}_from_`, '');

        // Get count in _from_X table
        const fromCount = await client.query(`
          SELECT COUNT(*) as count FROM ${fromTable}
        `);

        const fromRecords = parseInt(fromCount.rows[0].count);

        if (fromRecords > 0) {
          // Check if this source_lang exists in base table
          const baseCount = await client.query(`
            SELECT COUNT(*) as count
            FROM ${baseTable}
            WHERE source_lang = $1
          `, [sourceLang]);

          const baseRecords = parseInt(baseCount.rows[0].count);

          if (baseRecords === 0) {
            issues.push({
              targetLang,
              sourceLang,
              baseTable,
              fromTable,
              fromRecords,
              baseRecords,
              status: '❌ MISSING'
            });
            console.log(`❌ ${sourceLang}→${targetLang}: ${fromTable} has ${fromRecords} records, but ${baseTable} has 0 with source_lang='${sourceLang}'`);
          } else if (baseRecords < fromRecords) {
            issues.push({
              targetLang,
              sourceLang,
              baseTable,
              fromTable,
              fromRecords,
              baseRecords,
              status: '⚠️  PARTIAL'
            });
            console.log(`⚠️  ${sourceLang}→${targetLang}: ${fromTable} has ${fromRecords} records, but ${baseTable} has only ${baseRecords}`);
          } else {
            console.log(`✅ ${sourceLang}→${targetLang}: OK (${baseRecords} records in base table)`);
          }
        }
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total issues found: ${issues.length}\n`);

    if (issues.length > 0) {
      console.log('Issues by severity:');
      const missing = issues.filter(i => i.status === '❌ MISSING');
      const partial = issues.filter(i => i.status === '⚠️  PARTIAL');

      console.log(`❌ MISSING (need migration): ${missing.length}`);
      console.log(`⚠️  PARTIAL (incomplete data): ${partial.length}\n`);

      if (missing.length > 0) {
        console.log('=== MISSING DATA (CRITICAL) ===');
        console.table(missing.map(i => ({
          'Language Pair': `${i.sourceLang}→${i.targetLang}`,
          'From Table': i.fromTable,
          'Records': i.fromRecords,
          'Base Records': i.baseRecords
        })));
      }

      if (partial.length > 0) {
        console.log('\n=== PARTIAL DATA (WARNING) ===');
        console.table(partial.map(i => ({
          'Language Pair': `${i.sourceLang}→${i.targetLang}`,
          'From Table Records': i.fromRecords,
          'Base Records': i.baseRecords,
          'Missing': i.fromRecords - i.baseRecords
        })));
      }
    } else {
      console.log('✅ No issues found! All data is properly migrated.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllTranslationTables();
