require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixUser51() {
  const client = await pool.connect();

  try {
    console.log('=== USER 51 CURRENT STATE ===');

    // Get user info
    const userResult = await client.query(`
      SELECT id, username, email
      FROM users
      WHERE id = 51
    `);
    console.log('User:', userResult.rows[0]);

    // Check users table structure
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('\nUsers table columns:');
    console.table(columnsResult.rows.slice(0, 20));

    // Get word sets for user 51
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

    console.log(`\n=== WORD SETS FOR USER 51 (showing first 20 of total) ===`);
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

    // The user should have de→ru word sets, but if they have de→en or other pairs, we need to fix
    const wrongPairs = countResult.rows.filter(r => !(r.from_language === 'de' && r.to_language === 'ru'));

    if (wrongPairs.length > 0) {
      console.log('\n⚠️  PROBLEM DETECTED! User 51 (test_de_ru) has word sets for wrong language pairs:');
      console.table(wrongPairs);

      console.log('\n=== FIXING USER 51 ===');
      console.log('Removing word sets that are not de→ru...');

      // Remove all word sets that are not de→ru
      const deleteResult = await client.query(`
        DELETE FROM user_word_sets uws
        USING word_sets ws
        WHERE uws.word_set_id = ws.id
          AND uws.user_id = 51
          AND NOT (ws.from_language = 'de' AND ws.to_language = 'ru')
      `);

      console.log(`Deleted ${deleteResult.rowCount} incorrect word set assignments`);

      // Check if there are de→ru word sets available
      const availableSetsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM word_sets
        WHERE from_language = 'de' AND to_language = 'ru'
      `);

      console.log(`\nAvailable de→ru word sets: ${availableSetsResult.rows[0].count}`);

      if (parseInt(availableSetsResult.rows[0].count) > 0) {
        // Assign de→ru word sets
        console.log('\nAssigning de→ru word sets...');

        const assignResult = await client.query(`
          INSERT INTO user_word_sets (user_id, word_set_id, created_at)
          SELECT DISTINCT 51, ws.id, NOW()
          FROM word_sets ws
          WHERE ws.from_language = 'de'
            AND ws.to_language = 'ru'
            AND NOT EXISTS (
              SELECT 1 FROM user_word_sets uws2
              WHERE uws2.user_id = 51 AND uws2.word_set_id = ws.id
            )
        `);

        console.log(`Assigned ${assignResult.rowCount} de→ru word sets to user 51`);
      } else {
        console.log('\n⚠️  No de→ru word sets available in the database!');
        console.log('Need to create de→ru word sets first.');
      }

      // Verify the fix
      const verifyResult = await client.query(`
        SELECT
          ws.from_language,
          ws.to_language,
          COUNT(*) as count
        FROM user_word_sets uws
        JOIN word_sets ws ON uws.word_set_id = ws.id
        WHERE uws.user_id = 51
        GROUP BY ws.from_language, ws.to_language
      `);

      console.log('\n=== AFTER FIX - WORD SETS BY LANGUAGE PAIR ===');
      console.table(verifyResult.rows);

    } else {
      console.log('\n✅ User 51 word sets are correct (all de→ru)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUser51();
