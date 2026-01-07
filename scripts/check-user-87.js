require('dotenv').config();
const { Client } = require('pg');

async function checkUser87() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📊 User 87 info:');
    const user = await client.query('SELECT * FROM users WHERE id = 87');
    if (user.rows.length === 0) {
      console.log('  ❌ User 87 does not exist!');
    } else {
      console.log('  ✅ User exists:', user.rows[0].username || user.rows[0].email || 'user#87');
    }

    console.log('\n📊 Language pairs for user 87:');
    const pairs = await client.query('SELECT * FROM language_pairs WHERE user_id = 87');
    console.log(`  Total: ${pairs.rows.length}`);
    pairs.rows.forEach(row => console.log(`  - [${row.id}] ${row.from_lang} → ${row.to_lang}: ${row.name}`));

    console.log('\n📊 Words for user 87:');
    const words = await client.query('SELECT COUNT(*) as count FROM words WHERE user_id = 87');
    console.log(`  Total: ${words.rows[0].count}`);

    if (words.rows[0].count > 0) {
      console.log('\n📊 Sample words:');
      const sampleWords = await client.query(`
        SELECT w.id, w.word, w.translation, lp.from_lang, lp.to_lang
        FROM words w
        JOIN language_pairs lp ON w.language_pair_id = lp.id
        WHERE w.user_id = 87
        ORDER BY w.id
        LIMIT 20
      `);

      sampleWords.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. [${row.id}] ${row.word} → ${row.translation} (${row.from_lang} → ${row.to_lang})`);
        if (row.word && row.word.includes('_')) {
          console.log('   ⚠️  WARNING: Looks like a placeholder!');
        }
      });
    }

    console.log('\n📊 Word sets with progress for user 87:');
    const wordSets = await client.query(`
      SELECT ws.id, ws.source_language, ws.title, ws.level, ws.theme
      FROM word_sets ws
      LEFT JOIN user_word_progress uwp ON ws.id = uwp.word_set_id
      WHERE uwp.user_id = 87
      LIMIT 10
    `);
    console.log(`  Total: ${wordSets.rows.length}`);
    wordSets.rows.forEach(row => console.log(`  - [${row.id}] ${row.source_language} ${row.level} - ${row.title}`));

    // Проверяем есть ли хинди word sets
    if (wordSets.rows.some(ws => ws.source_language === 'hindi')) {
      console.log('\n📊 Checking Hindi word set items:');
      const hindiSet = wordSets.rows.find(ws => ws.source_language === 'hindi');
      const items = await client.query(`
        SELECT word, translation, part_of_speech, example
        FROM word_set_items
        WHERE word_set_id = $1
        LIMIT 10
      `, [hindiSet.id]);

      items.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ${row.word} → ${row.translation}`);
        if (row.word && row.word.includes('_')) {
          console.log('   ⚠️  WARNING: Placeholder detected!');
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkUser87();
