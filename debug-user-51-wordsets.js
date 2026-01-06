require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUser51WordSets() {
  const client = await pool.connect();

  try {
    console.log('=== USER 51 DETAILS ===');

    // Get user info
    const userResult = await client.query(`
      SELECT id, username, email
      FROM users
      WHERE id = 51
    `);
    console.log('\nUser:', userResult.rows[0]);

    // Get user's language pairs
    const pairsResult = await client.query(`
      SELECT ulp.id, ulp.from_language, ulp.to_language, ulp.is_active
      FROM user_language_pairs ulp
      WHERE ulp.user_id = 51
      ORDER BY ulp.id
    `);
    console.log('\nLanguage Pairs:');
    console.table(pairsResult.rows);

    // Get word sets for user
    const wordSetsResult = await client.query(`
      SELECT
        ws.id,
        ws.name,
        ws.description,
        ws.from_language,
        ws.to_language,
        ws.cefr_level,
        ws.theme,
        uws.user_language_pair_id,
        (SELECT COUNT(*) FROM user_word_progress uwp WHERE uwp.word_set_id = ws.id AND uwp.user_id = 51) as progress_count
      FROM user_word_sets uws
      JOIN word_sets ws ON uws.word_set_id = ws.id
      WHERE uws.user_id = 51
      ORDER BY ws.id
    `);

    console.log(`\n=== WORD SETS FOR USER 51 (${wordSetsResult.rows.length} total) ===`);

    if (wordSetsResult.rows.length > 0) {
      // Group by language pair
      const byLangPair = {};
      wordSetsResult.rows.forEach(row => {
        const key = `${row.from_language} → ${row.to_language}`;
        if (!byLangPair[key]) {
          byLangPair[key] = [];
        }
        byLangPair[key].push(row);
      });

      for (const [pair, sets] of Object.entries(byLangPair)) {
        console.log(`\n${pair}: ${sets.length} sets`);
        sets.slice(0, 5).forEach(set => {
          console.log(`  - [${set.id}] ${set.name} (${set.cefr_level || 'no level'}, ${set.theme || 'no theme'})`);
        });
        if (sets.length > 5) {
          console.log(`  ... and ${sets.length - 5} more`);
        }
      }

      console.log('\n=== FIRST 10 WORD SETS (detailed) ===');
      console.table(wordSetsResult.rows.slice(0, 10).map(row => ({
        id: row.id,
        name: row.name,
        from: row.from_language,
        to: row.to_language,
        level: row.cefr_level,
        theme: row.theme,
        pair_id: row.user_language_pair_id,
        progress: row.progress_count
      })));
    } else {
      console.log('No word sets found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUser51WordSets();
