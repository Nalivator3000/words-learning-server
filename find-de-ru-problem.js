require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function findProblem() {
  const client = await pool.connect();

  try {
    console.log('=== CHECKING DE→RU TRANSLATION TABLE ===');

    // Check if target_translations_russian_from_de exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'target_translations_russian_from_de'
      ) as table_exists
    `);

    console.log('target_translations_russian_from_de exists:', tableCheck.rows[0].table_exists);

    if (!tableCheck.rows[0].table_exists) {
      console.log('\n❌ PROBLEM FOUND!');
      console.log('The translation table target_translations_russian_from_de does NOT exist.');
      console.log('This means there are NO German→Russian translations in the database.');
      console.log('');
      console.log('This is why user 51 sees German word sets with only German words,');
      console.log('without Russian translations!');

      console.log('\n=== CHECKING OTHER DE→X TRANSLATION TABLES ===');
      const deTranslations = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'target_translations_%_from_de'
        ORDER BY tablename
      `);

      if (deTranslations.rows.length > 0) {
        console.log('\nExisting de→X translations:');
        console.log(deTranslations.rows.map(r => r.tablename).join('\n'));
      } else {
        console.log('\n❌ NO de→X translation tables exist at all!');
      }

      console.log('\n=== CHECKING RU→X TRANSLATION TABLES ===');
      const ruTranslations = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'target_translations_%_from_ru'
        ORDER BY tablename
      `);

      if (ruTranslations.rows.length > 0) {
        console.log('\nExisting ru→X translations:');
        console.log(ruTranslations.rows.map(r => r.tablename).join('\n'));
      }

      console.log('\n=== CHECKING X→RU TRANSLATION TABLES ===');
      const toRuTranslations = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'target_translations_russian_from_%'
        ORDER BY tablename
      `);

      if (toRuTranslations.rows.length > 0) {
        console.log('\nExisting X→ru translations:');
        console.log(toRuTranslations.rows.map(r => r.tablename).join('\n'));
      }

    } else {
      console.log('✅ Table exists, checking data...');

      const countResult = await client.query(`
        SELECT COUNT(*) as count
        FROM target_translations_russian_from_de
      `);

      console.log(`Translation records: ${countResult.rows[0].count}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

findProblem();
