const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
  ssl: { rejectUnauthorized: false }
});

async function verifySwahiliTranslations() {
  const client = await pool.connect();

  try {
    console.log('\n🔍 Verifying Swahili Translations\n');
    console.log('═'.repeat(70));

    // 1. Get total German words count
    const totalGermanWords = await client.query(`
      SELECT COUNT(*) as count FROM source_words_german
    `);
    const totalWords = parseInt(totalGermanWords.rows[0].count);
    console.log(`\n📊 Total German words in database: ${totalWords}`);

    // 2. Get total Swahili translations count
    const totalSwahiliTranslations = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_swahili
      WHERE source_lang = 'de'
    `);
    const translatedWords = parseInt(totalSwahiliTranslations.rows[0].count);
    console.log(`✅ Total Swahili translations: ${translatedWords}`);

    // 3. Calculate coverage
    const coverage = ((translatedWords / totalWords) * 100).toFixed(2);
    console.log(`📈 Coverage: ${coverage}%`);

    // 4. Find missing translations
    const missingCount = totalWords - translatedWords;
    if (missingCount > 0) {
      console.log(`\n⚠️  Missing ${missingCount} translations`);

      const missingWords = await client.query(`
        SELECT sw.id, sw.word, sw.level
        FROM source_words_german sw
        LEFT JOIN target_translations_swahili ts
          ON ts.source_word_id = sw.id AND ts.source_lang = 'de'
        WHERE ts.id IS NULL
        ORDER BY sw.level, sw.id
        LIMIT 50
      `);

      if (missingWords.rows.length > 0) {
        console.log('\n📋 First 50 words without translations:');
        missingWords.rows.forEach((w, idx) => {
          console.log(`   ${idx + 1}. ID ${w.id}: "${w.word}" [${w.level}]`);
        });

        if (missingCount > 50) {
          console.log(`   ... and ${missingCount - 50} more`);
        }
      }
    }

    // 5. Coverage by level
    console.log('\n📚 Coverage by CEFR Level:');
    console.log('─'.repeat(70));

    const coverageByLevel = await client.query(`
      SELECT
        sw.level,
        COUNT(*) as total_words,
        COUNT(ts.id) as translated_words,
        ROUND(COUNT(ts.id)::numeric / COUNT(*)::numeric * 100, 2) as coverage_percent
      FROM source_words_german sw
      LEFT JOIN target_translations_swahili ts
        ON ts.source_word_id = sw.id AND ts.source_lang = 'de'
      GROUP BY sw.level
      ORDER BY sw.level
    `);

    coverageByLevel.rows.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.coverage_percent / 2));
      const spaces = ' '.repeat(50 - Math.floor(row.coverage_percent / 2));
      console.log(`${row.level.padEnd(5)} | ${bar}${spaces} | ${row.translated_words}/${row.total_words} (${row.coverage_percent}%)`);
    });

    // 6. Sample translations
    console.log('\n📝 Sample Translations (Random 20):');
    console.log('─'.repeat(70));

    const samples = await client.query(`
      SELECT
        sw.word as german,
        ts.translation as swahili,
        sw.level
      FROM source_words_german sw
      JOIN target_translations_swahili ts
        ON ts.source_word_id = sw.id AND ts.source_lang = 'de'
      ORDER BY RANDOM()
      LIMIT 20
    `);

    samples.rows.forEach((s, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. ${s.german.padEnd(25)} → ${s.swahili.padEnd(25)} [${s.level}]`);
    });

    // 7. Check for duplicates (should be none due to UNIQUE constraint)
    const duplicates = await client.query(`
      SELECT source_word_id, COUNT(*) as count
      FROM target_translations_swahili
      WHERE source_lang = 'de'
      GROUP BY source_word_id
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rows.length > 0) {
      console.log(`\n⚠️  Warning: Found ${duplicates.rows.length} duplicate translations!`);
      console.log('This should not happen due to UNIQUE constraint.');
    } else {
      console.log('\n✅ No duplicates found (as expected)');
    }

    // 8. Check for empty translations
    const emptyTranslations = await client.query(`
      SELECT COUNT(*) as count
      FROM target_translations_swahili
      WHERE source_lang = 'de' AND (translation IS NULL OR translation = '')
    `);

    const emptyCount = parseInt(emptyTranslations.rows[0].count);
    if (emptyCount > 0) {
      console.log(`\n⚠️  Warning: Found ${emptyCount} empty translations!`);
    } else {
      console.log('✅ No empty translations found');
    }

    // 9. Statistics
    console.log('\n📊 Translation Statistics:');
    console.log('─'.repeat(70));

    const stats = await client.query(`
      SELECT
        MIN(LENGTH(translation)) as min_length,
        MAX(LENGTH(translation)) as max_length,
        ROUND(AVG(LENGTH(translation)), 2) as avg_length
      FROM target_translations_swahili
      WHERE source_lang = 'de'
    `);

    if (stats.rows.length > 0) {
      const s = stats.rows[0];
      console.log(`Min translation length: ${s.min_length} characters`);
      console.log(`Max translation length: ${s.max_length} characters`);
      console.log(`Avg translation length: ${s.avg_length} characters`);
    }

    // 10. Recently added translations
    console.log('\n🕐 Recently Added Translations (Last 10):');
    console.log('─'.repeat(70));

    const recent = await client.query(`
      SELECT
        sw.word as german,
        ts.translation as swahili,
        sw.level,
        ts.created_at
      FROM target_translations_swahili ts
      JOIN source_words_german sw ON sw.id = ts.source_word_id
      WHERE ts.source_lang = 'de'
      ORDER BY ts.created_at DESC
      LIMIT 10
    `);

    recent.rows.forEach((r, idx) => {
      const date = new Date(r.created_at).toLocaleString();
      console.log(`${(idx + 1).toString().padStart(2)}. ${r.german.padEnd(20)} → ${r.swahili.padEnd(20)} [${r.level}] ${date}`);
    });

    console.log('\n' + '═'.repeat(70));

    // Summary verdict
    if (coverage >= 100) {
      console.log('\n🎉 SUCCESS! All German words have been translated to Swahili!');
    } else if (coverage >= 99) {
      console.log(`\n✅ EXCELLENT! ${coverage}% coverage - almost complete!`);
    } else if (coverage >= 95) {
      console.log(`\n👍 GOOD! ${coverage}% coverage - nearly there!`);
    } else if (coverage >= 80) {
      console.log(`\n⚠️  PARTIAL: ${coverage}% coverage - more work needed`);
    } else {
      console.log(`\n❌ LOW COVERAGE: Only ${coverage}% - translation in progress or incomplete`);
    }

    console.log('');

  } catch (err) {
    console.error('\n❌ Error during verification:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run verification
verifySwahiliTranslations()
  .then(() => {
    console.log('✅ Verification complete!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Verification failed:', err);
    process.exit(1);
  });
