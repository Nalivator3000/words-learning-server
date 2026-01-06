const { Pool } = require('pg');

// Use DATABASE_PUBLIC_URL for external connections, fallback to DATABASE_URL
const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_PUBLIC_URL or DATABASE_URL environment variable is not set!');
  console.error('Run this script on Railway using:');
  console.error('railway run node scripts/fix-user-62-railway.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('🔧 FIX: Delete old words for User 62 (English → Spanish)\n');
    console.log('=' .repeat(60));

    // 1. Show current state
    console.log('\n📊 CURRENT STATE:\n');
    const currentState = await pool.query(`
      SELECT
        uwp.language_pair_id,
        COUNT(*) as word_count,
        array_agg(DISTINCT uwp.status) as statuses
      FROM user_word_progress uwp
      WHERE uwp.user_id = 62
      GROUP BY uwp.language_pair_id
      ORDER BY uwp.language_pair_id
    `);

    currentState.rows.forEach(row => {
      console.log(`   Language Pair ${row.language_pair_id}: ${row.word_count} words (${row.statuses.join(', ')})`);
    });

    // 2. Check translations for language pair 66
    console.log('\n🔍 CHECKING TRANSLATIONS FOR PAIR 66:\n');
    const translations = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN tt_ru.translation IS NOT NULL AND tt_es.translation IS NULL THEN 1 END) as russian_only,
        COUNT(CASE WHEN tt_es.translation IS NOT NULL AND tt_ru.translation IS NULL THEN 1 END) as spanish_only,
        COUNT(CASE WHEN tt_es.translation IS NOT NULL AND tt_ru.translation IS NOT NULL THEN 1 END) as both
      FROM user_word_progress uwp
      LEFT JOIN target_translations_spanish_from_en tt_es ON tt_es.source_word_id = uwp.source_word_id
      LEFT JOIN target_translations_russian_from_en tt_ru ON tt_ru.source_word_id = uwp.source_word_id
      WHERE uwp.user_id = 62 AND uwp.language_pair_id = 66
    `);

    const stats = translations.rows[0];
    console.log(`   Total words: ${stats.total}`);
    console.log(`   Russian only: ${stats.russian_only} ${parseInt(stats.russian_only) > 0 ? '⚠️' : ''}`);
    console.log(`   Spanish only: ${stats.spanish_only} ✅`);
    console.log(`   Both translations: ${stats.both}`);

    if (parseInt(stats.russian_only) > 0) {
      console.log('\n⚠️  PROBLEM: Some words have Russian translations but no Spanish!');
    }

    // 3. Check sample words
    console.log('\n🎯 SAMPLE WORDS (first 5):\n');
    const quizWords = await pool.query(`
      SELECT
        uwp.id,
        sw.word as english,
        tt_es.translation as spanish,
        tt_ru.translation as russian,
        uwp.status
      FROM user_word_progress uwp
      LEFT JOIN source_words_english sw ON sw.id = uwp.source_word_id
      LEFT JOIN target_translations_spanish_from_en tt_es ON tt_es.source_word_id = uwp.source_word_id
      LEFT JOIN target_translations_russian_from_en tt_ru ON tt_ru.source_word_id = uwp.source_word_id
      WHERE uwp.user_id = 62
        AND uwp.language_pair_id = 66
      ORDER BY uwp.id
      LIMIT 5
    `);

    quizWords.rows.forEach((w, i) => {
      console.log(`   ${i+1}. "${w.english}" → ES: "${w.spanish || 'NULL'}", RU: "${w.russian || 'NULL'}" (${w.status})`);
    });

    // 4. Delete words
    console.log('\n🗑️  DELETING ALL WORDS for user 62, language pair 66...\n');

    const deleteResult = await pool.query(`
      DELETE FROM user_word_progress
      WHERE user_id = 62 AND language_pair_id = 66
    `);

    console.log(`✅ Deleted ${deleteResult.rowCount} words\n`);

    // 5. Verify deletion
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as remaining
      FROM user_word_progress
      WHERE user_id = 62 AND language_pair_id = 66
    `);

    console.log(`📊 Remaining words: ${verifyResult.rows[0].remaining}\n`);

    if (verifyResult.rows[0].remaining === '0') {
      console.log('✅ SUCCESS! All words deleted.');
      console.log('\n💡 User 62 can now import new word sets with Spanish translations.\n');
    } else {
      console.log('⚠️  WARNING: Some words remain in database');
    }

    console.log('=' .repeat(60));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
