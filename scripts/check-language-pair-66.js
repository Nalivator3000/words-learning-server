const { Pool } = require('pg');

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_PUBLIC_URL or DATABASE_URL not set!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('🔍 Checking Language Pair 66\n');
    console.log('='.repeat(60));

    // Check language pair details
    const pairResult = await pool.query(`
      SELECT *
      FROM language_pairs
      WHERE id = 66
    `);

    if (pairResult.rows.length === 0) {
      console.log('❌ Language pair 66 not found!');
      await pool.end();
      return;
    }

    const pair = pairResult.rows[0];
    console.log('\n📋 Language Pair 66:');
    console.log(`   ID: ${pair.id}`);
    console.log(`   User ID: ${pair.user_id}`);
    console.log(`   Name: ${pair.name}`);
    console.log(`   From Language: ${pair.from_lang}`);
    console.log(`   To Language: ${pair.to_lang}`);
    console.log(`   Active: ${pair.active}`);
    console.log(`   Created: ${pair.created_at}`);

    // Check if languages are swapped
    console.log('\n🔍 LANGUAGE DIRECTION CHECK:');
    if (pair.from_lang === 'en' && pair.to_lang === 'es') {
      console.log('   ✅ Correct: Learning English (en) with Spanish (es) translations');
      console.log('   ✅ User should see: English words → Spanish translations');
    } else if (pair.from_lang === 'es' && pair.to_lang === 'en') {
      console.log('   ⚠️  REVERSED: Learning Spanish (es) with English (en) translations');
      console.log('   ⚠️  User would see: Spanish words → English translations');
    } else {
      console.log(`   ❌ WRONG: from_lang=${pair.from_lang}, to_lang=${pair.to_lang}`);
      console.log(`   ❌ Expected: from_lang=en, to_lang=es`);
    }

    // Check sample words for this language pair
    console.log('\n📊 SAMPLE WORDS FOR THIS PAIR (first 5):');
    const wordsResult = await pool.query(`
      SELECT
        uwp.id,
        uwp.source_language,
        sw.word as english_word,
        uwp.status
      FROM user_word_progress uwp
      LEFT JOIN source_words_english sw ON sw.id = uwp.source_word_id
      WHERE uwp.language_pair_id = 66
      ORDER BY uwp.id
      LIMIT 5
    `);

    wordsResult.rows.forEach((w, i) => {
      console.log(`   ${i+1}. Progress ID: ${w.id}`);
      console.log(`      Source language: ${w.source_language}`);
      console.log(`      English word: ${w.english_word || 'NULL'}`);
      console.log(`      Status: ${w.status}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Check complete!\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
