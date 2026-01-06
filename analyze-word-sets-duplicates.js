const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function analyzeWordSetDuplicates() {
  const client = await pool.connect();

  try {
    console.log('🔍 Analyzing word_sets for duplicate words...\n');

    // First, check the structure
    const structureCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'word_set_items'
      ORDER BY ordinal_position
    `);

    console.log('📋 word_set_items structure:');
    structureCheck.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });

    // Get all word sets with their words
    const setsResult = await client.query(`
      SELECT
        ws.id,
        ws.title,
        ws.source_language,
        ws.level,
        ws.theme,
        ws.word_count,
        ARRAY_AGG(wsi.word_id ORDER BY wsi.word_id) as word_ids
      FROM word_sets ws
      LEFT JOIN word_set_items wsi ON ws.id = wsi.word_set_id
      GROUP BY ws.id, ws.title, ws.source_language, ws.level, ws.theme, ws.word_count
      ORDER BY ws.source_language, ws.id
    `);

    console.log(`\n📊 Total word sets: ${setsResult.rows.length}\n`);

    // Group by language
    const byLanguage = {};
    setsResult.rows.forEach(set => {
      if (!byLanguage[set.source_language]) {
        byLanguage[set.source_language] = [];
      }
      byLanguage[set.source_language].push(set);
    });

    // Analyze duplicates per language
    let globalDuplicateGroups = 0;
    let globalAffectedSets = 0;

    for (const [language, sets] of Object.entries(byLanguage)) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📚 Language: ${language.toUpperCase()} (${sets.length} sets)`);
      console.log('='.repeat(80));

      // Find sets with identical word_ids
      const wordIdsMap = new Map();

      sets.forEach(set => {
        // Filter out null word_ids (sets with no words)
        const validWordIds = (set.word_ids || []).filter(id => id !== null);
        if (validWordIds.length === 0) return;

        const wordIdsKey = JSON.stringify(validWordIds.sort((a, b) => a - b));
        if (!wordIdsMap.has(wordIdsKey)) {
          wordIdsMap.set(wordIdsKey, []);
        }
        wordIdsMap.get(wordIdsKey).push(set);
      });

      // Report duplicates
      let duplicateGroups = 0;
      let affectedSets = 0;

      wordIdsMap.forEach((duplicateSets, wordIdsKey) => {
        if (duplicateSets.length > 1) {
          duplicateGroups++;
          affectedSets += duplicateSets.length;

          console.log(`\n⚠️  Duplicate group #${duplicateGroups}:`);
          console.log(`   Word count: ${JSON.parse(wordIdsKey).length}`);
          console.log(`   Sets with IDENTICAL words (${duplicateSets.length} sets):`);

          duplicateSets.forEach(set => {
            console.log(`   - [ID: ${set.id}] "${set.title}" (level: ${set.level || 'N/A'}, theme: ${set.theme || 'N/A'})`);
          });
        }
      });

      if (duplicateGroups === 0) {
        console.log('\n✅ No duplicate word sets found for this language');
      } else {
        console.log(`\n❌ Found ${duplicateGroups} groups of duplicates affecting ${affectedSets} sets`);
        globalDuplicateGroups += duplicateGroups;
        globalAffectedSets += affectedSets;
      }

      // Check for partial overlaps (sets sharing some but not all words)
      console.log(`\n🔍 Checking for partial overlaps (50%+ shared words)...`);

      let partialOverlaps = 0;
      const setsWithWords = sets.filter(s => s.word_ids && s.word_ids.filter(id => id !== null).length > 0);

      for (let i = 0; i < setsWithWords.length; i++) {
        for (let j = i + 1; j < setsWithWords.length; j++) {
          const set1 = setsWithWords[i];
          const set2 = setsWithWords[j];

          const words1 = new Set(set1.word_ids.filter(id => id !== null));
          const words2 = new Set(set2.word_ids.filter(id => id !== null));

          const intersection = [...words1].filter(x => words2.has(x));

          if (intersection.length > 0 && intersection.length < Math.min(words1.size, words2.size)) {
            const overlapPercent1 = (intersection.length / words1.size * 100);
            const overlapPercent2 = (intersection.length / words2.size * 100);

            // Report if overlap is 50% or more for either set
            if (overlapPercent1 >= 50 || overlapPercent2 >= 50) {
              partialOverlaps++;
              console.log(`\n⚠️  Significant overlap #${partialOverlaps}:`);
              console.log(`   [ID: ${set1.id}] "${set1.title}" (${words1.size} words, level: ${set1.level || 'N/A'})`);
              console.log(`   [ID: ${set2.id}] "${set2.title}" (${words2.size} words, level: ${set2.level || 'N/A'})`);
              console.log(`   Shared words: ${intersection.length} (${overlapPercent1.toFixed(1)}% / ${overlapPercent2.toFixed(1)}%)`);
            }
          }
        }
      }

      if (partialOverlaps === 0) {
        console.log('✅ No significant partial overlaps found');
      } else {
        console.log(`\n⚠️  Found ${partialOverlaps} partial overlaps with 50%+ shared words`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 GLOBAL SUMMARY');
    console.log('='.repeat(80));

    if (globalDuplicateGroups > 0) {
      console.log(`❌ TOTAL: ${globalDuplicateGroups} duplicate groups affecting ${globalAffectedSets} sets`);
      console.log(`\n💡 Recommendation: These duplicate sets should be merged or removed`);
    } else {
      console.log('✅ No exact duplicate word sets found across all languages');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeWordSetDuplicates().catch(console.error);
