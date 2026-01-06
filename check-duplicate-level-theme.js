const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function checkDuplicateLevelTheme() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking for duplicate level+theme combinations in word_sets...\n');

    // Find sets with identical level+theme combinations
    const result = await client.query(`
      SELECT
        source_language,
        level,
        theme,
        COUNT(*) as set_count,
        ARRAY_AGG(id ORDER BY id) as set_ids,
        ARRAY_AGG(title ORDER BY id) as titles
      FROM word_sets
      WHERE level IS NOT NULL  -- Only check sets with level
      GROUP BY source_language, level, theme
      HAVING COUNT(*) > 1
      ORDER BY source_language, level, theme
    `);

    if (result.rows.length === 0) {
      console.log('✅ No duplicate level+theme combinations found!\n');
    } else {
      console.log(`⚠️  Found ${result.rows.length} duplicate level+theme combinations:\n`);

      let totalDuplicateSets = 0;

      result.rows.forEach((row, index) => {
        totalDuplicateSets += row.set_count;

        console.log(`${index + 1}. ${row.source_language.toUpperCase()} | Level: ${row.level || 'N/A'} | Theme: ${row.theme || 'N/A'}`);
        console.log(`   ${row.set_count} sets with THIS EXACT combination:`);

        row.set_ids.forEach((id, idx) => {
          console.log(`   - [ID: ${id}] "${row.titles[idx]}"`);
        });

        console.log('');
      });

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 SUMMARY:`);
      console.log(`   ${result.rows.length} duplicate level+theme combinations`);
      console.log(`   ${totalDuplicateSets} total sets affected`);
      console.log(`   These sets will show IDENTICAL words to users!`);
      console.log('='.repeat(80));

      // Show what words would be returned for a sample duplicate
      if (result.rows.length > 0) {
        const sample = result.rows[0];
        console.log(`\n🔍 Sample: Checking actual words for duplicate combination:`);
        console.log(`   Language: ${sample.source_language}, Level: ${sample.level}, Theme: ${sample.theme || 'N/A'}\n`);

        const sourceTable = `source_words_${sample.source_language}`;

        // Build WHERE clause
        let whereConditions = [];
        let params = [];

        if (sample.level) {
          whereConditions.push(`level = $1`);
          params.push(sample.level);
        }

        if (sample.theme && sample.theme !== 'general') {
          whereConditions.push(`theme = $${params.length + 1}`);
          params.push(sample.theme);
        }

        const whereClause = whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

        const wordsResult = await client.query(`
          SELECT word
          FROM ${sourceTable}
          ${whereClause}
          ORDER BY word
          LIMIT 10
        `, params);

        console.log(`   Words that ALL ${sample.set_count} sets will show (first 10):`);
        wordsResult.rows.forEach((word, idx) => {
          console.log(`   ${idx + 1}. ${word.word}`);
        });

        console.log(`\n   ⚠️  All ${sample.set_count} sets with this level+theme show THE SAME words!`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkDuplicateLevelTheme().catch(console.error);
