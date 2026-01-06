require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('=== TABLES IN DATABASE ===');
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log(tablesResult.rows.map(r => r.tablename).join('\n'));

    console.log('\n=== USER 51 INFO ===');
    const userResult = await client.query(`
      SELECT id, username, email, from_language, to_language
      FROM users
      WHERE id = 51
    `);
    console.table(userResult.rows);

    console.log('\n=== WORD SETS FOR USER 51 ===');
    const wordSetsResult = await client.query(`
      SELECT
        ws.id,
        ws.name,
        ws.from_language,
        ws.to_language,
        ws.cefr_level,
        ws.theme
      FROM user_word_sets uws
      JOIN word_sets ws ON uws.word_set_id = ws.id
      WHERE uws.user_id = 51
      ORDER BY ws.id
      LIMIT 20
    `);

    console.log(`Found ${wordSetsResult.rows.length} word sets`);
    console.table(wordSetsResult.rows);

    // Count by language pair
    const countResult = await client.query(`
      SELECT
        ws.from_language,
        ws.to_language,
        COUNT(*) as count
      FROM user_word_sets uws
      JOIN word_sets ws ON uws.word_set_id = ws.id
      WHERE uws.user_id = 51
      GROUP BY ws.from_language, ws.to_language
      ORDER BY count DESC
    `);

    console.log('\n=== WORD SETS BY LANGUAGE PAIR ===');
    console.table(countResult.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
