require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkActualTranslations() {
  const client = await pool.connect();

  try {
    console.log('=== CHECKING ACTUAL TRANSLATION DATA (NO PLACEHOLDERS) ===\n');

    // Check en→ru translations
    console.log('1. Checking ENGLISH→RUSSIAN translations:');
    const enRuCount = await client.query(`
      SELECT COUNT(*) as count
      FROM target_translations_russian_from_en
      WHERE translation NOT LIKE '%_A1%'
        AND translation NOT LIKE '%_A2%'
        AND translation NOT LIKE '%_B1%'
        AND translation NOT LIKE '%placeholder%'
    `);
    console.log(`   Real translations: ${enRuCount.rows[0].count}`);

    const enRuSample = await client.query(`
      SELECT
        sw.word as english,
        t.translation as russian
      FROM target_translations_russian_from_en t
      JOIN source_words_english sw ON t.source_word_id = sw.id
      WHERE t.translation NOT LIKE '%_A1%'
        AND t.translation NOT LIKE '%_A2%'
      LIMIT 5
    `);
    console.table(enRuSample.rows);

    // Check de→en translations
    console.log('\n2. Checking GERMAN→ENGLISH translations:');
    const deEnCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'target_translations_english_from_de'
      ) as exists
    `);

    if (deEnCheck.rows[0].exists) {
      const deEnCount = await client.query(`
        SELECT COUNT(*) as count
        FROM target_translations_english_from_de
        WHERE translation NOT LIKE '%_A1%'
          AND translation NOT LIKE '%_A2%'
      `);
      console.log(`   Real translations: ${deEnCount.rows[0].count}`);

      const deEnSample = await client.query(`
        SELECT
          sw.word as german,
          t.translation as english
        FROM target_translations_english_from_de t
        JOIN source_words_german sw ON t.source_word_id = sw.id
        WHERE t.translation NOT LIKE '%_A1%'
          AND t.translation NOT LIKE '%_A2%'
        LIMIT 5
      `);
      console.table(deEnSample.rows);
    } else {
      console.log('   ❌ Table does not exist!');
    }

    // Check all de→X tables
    console.log('\n3. CHECKING ALL DE→X TRANSLATION TABLES:');
    const allTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'target_translations_%_from_de'
      ORDER BY tablename
    `);

    console.log(`   Found ${allTables.rows.length} de→X tables:`);
    for (const row of allTables.rows) {
      console.log(`   - ${row.tablename}`);
    }

    if (allTables.rows.length === 0) {
      console.log('\n   ❌ NO de→X translation tables exist!');
      console.log('   This means German as SOURCE language has NO translations to ANY target language.');
    }

    // Check what DOES exist
    console.log('\n4. CHECKING WHAT TRANSLATION TABLES DO EXIST:');
    const existingTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'target_translations_%'
        AND tablename NOT LIKE '%_from_%'
      ORDER BY tablename
    `);

    console.log(`\n   Found ${existingTables.rows.length} base translation tables:`);
    for (const row of existingTables.rows.slice(0, 10)) {
      const tableName = row.tablename;
      const countResult = await client.query(`
        SELECT COUNT(*) as count FROM ${tableName}
        WHERE translation NOT LIKE '%_A1%'
          AND translation NOT LIKE '%_A2%'
          AND translation NOT LIKE '%placeholder%'
      `);
      console.log(`   - ${tableName}: ${countResult.rows[0].count} real translations`);
    }

    // Check structure of one working table
    console.log('\n5. CHECKING STRUCTURE OF target_translations_english:');
    const enStructure = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'target_translations_english'
      ORDER BY ordinal_position
    `);
    console.table(enStructure.rows);

    const enSample = await client.query(`
      SELECT * FROM target_translations_english LIMIT 5
    `);
    console.log('\n   Sample data:');
    console.table(enSample.rows);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkActualTranslations();
