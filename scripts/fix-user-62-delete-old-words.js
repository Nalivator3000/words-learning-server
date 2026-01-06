const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/language_learning',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

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
        array_agg(DISTINCT uwp.status) as statuses,
        MIN(uwp.id) as min_id,
        MAX(uwp.id) as max_id
      FROM user_word_progress uwp
      WHERE uwp.user_id = 62
      GROUP BY uwp.language_pair_id
      ORDER BY uwp.language_pair_id
    `);

    currentState.rows.forEach(row => {
      console.log(`   Language Pair ${row.language_pair_id}:`);
      console.log(`     Words: ${row.word_count}`);
      console.log(`     Statuses: ${row.statuses.join(', ')}`);
      console.log(`     ID range: ${row.min_id} - ${row.max_id}`);
      console.log();
    });

    // 2. Check translations for language pair 66
    console.log('🔍 CHECKING TRANSLATIONS FOR PAIR 66:\n');
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
    console.log(`   Russian only: ${stats.russian_only} ⚠️`);
    console.log(`   Spanish only: ${stats.spanish_only} ✅`);
    console.log(`   Both translations: ${stats.both}`);
    console.log();

    if (parseInt(stats.russian_only) > 0) {
      console.log('⚠️  PROBLEM: Some words have Russian translations but no Spanish!\n');
    }

    // 3. Ask for confirmation
    console.log('=' .repeat(60));
    console.log('\n⚠️  WARNING: This will DELETE ALL words for user 62, language pair 66\n');
    console.log(`   Total words to delete: ${stats.total}\n`);

    const answer = await question('Do you want to proceed? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled');
      rl.close();
      await pool.end();
      return;
    }

    // 4. Delete words
    console.log('\n🗑️  Deleting words...\n');
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

    console.log(`📊 Remaining words for user 62, pair 66: ${verifyResult.rows[0].remaining}\n`);

    if (verifyResult.rows[0].remaining === '0') {
      console.log('✅ SUCCESS! All words deleted.');
      console.log('\n💡 User 62 can now import new word sets with Spanish translations.\n');
    } else {
      console.log('⚠️  WARNING: Some words remain in database');
    }

    console.log('=' .repeat(60));

    rl.close();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    await pool.end();
    process.exit(1);
  }
})();
