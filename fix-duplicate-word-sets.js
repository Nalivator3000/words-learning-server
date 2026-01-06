const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function fixDuplicateWordSets() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing duplicate word sets...\n');
    console.log('Strategy: Keep FIRST set from each level+theme group, delete the rest\n');

    // Find all duplicate groups
    const duplicates = await client.query(`
      SELECT
        source_language,
        level,
        theme,
        COUNT(*) as set_count,
        ARRAY_AGG(id ORDER BY id) as set_ids,
        ARRAY_AGG(title ORDER BY id) as titles
      FROM word_sets
      WHERE level IS NOT NULL
      GROUP BY source_language, level, theme
      HAVING COUNT(*) > 1
      ORDER BY source_language, level, theme
    `);

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicates found! Database is clean.\n');
      return;
    }

    console.log(`⚠️  Found ${duplicates.rows.length} duplicate groups\n`);

    let totalToDelete = 0;
    const idsToDelete = [];

    duplicates.rows.forEach((row, index) => {
      const keepId = row.set_ids[0]; // Keep the first one
      const deleteIds = row.set_ids.slice(1); // Delete the rest

      totalToDelete += deleteIds.length;
      idsToDelete.push(...deleteIds);

      console.log(`${index + 1}. ${row.source_language.toUpperCase()} | Level: ${row.level} | Theme: ${row.theme || 'N/A'}`);
      console.log(`   Total sets: ${row.set_count}`);
      console.log(`   ✅ KEEP: [ID: ${keepId}] "${row.titles[0]}"`);
      console.log(`   ❌ DELETE ${deleteIds.length} duplicates:`);

      deleteIds.forEach((id, idx) => {
        console.log(`      - [ID: ${id}] "${row.titles[idx + 1]}"`);
      });
      console.log('');
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 SUMMARY:`);
    console.log(`   ${duplicates.rows.length} unique level+theme combinations with duplicates`);
    console.log(`   ${totalToDelete} sets will be DELETED`);
    console.log(`   ${duplicates.rows.length} sets will be KEPT`);
    console.log('='.repeat(80));

    // Ask for confirmation (simulated - will execute automatically)
    console.log(`\n🚀 Executing deletion...\n`);

    // Delete in batches to avoid potential issues
    const batchSize = 100;
    let deleted = 0;

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);

      const result = await client.query(
        `DELETE FROM word_sets WHERE id = ANY($1)`,
        [batch]
      );

      deleted += result.rowCount;
      console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}: ${result.rowCount} sets`);
    }

    console.log(`\n✅ Successfully deleted ${deleted} duplicate word sets!`);

    // Verify
    const remaining = await client.query(`
      SELECT
        source_language,
        level,
        theme,
        COUNT(*) as set_count
      FROM word_sets
      WHERE level IS NOT NULL
      GROUP BY source_language, level, theme
      HAVING COUNT(*) > 1
    `);

    if (remaining.rows.length === 0) {
      console.log('✅ Verification: No duplicates remain!\n');
    } else {
      console.log(`⚠️  Warning: ${remaining.rows.length} duplicate groups still exist!\n`);
    }

    // Show final stats
    const stats = await client.query(`
      SELECT
        source_language,
        COUNT(*) as total_sets
      FROM word_sets
      GROUP BY source_language
      ORDER BY source_language
    `);

    console.log('\n📊 Final word sets count by language:');
    stats.rows.forEach(row => {
      console.log(`   ${row.source_language}: ${row.total_sets} sets`);
    });

    const totalSets = await client.query(`SELECT COUNT(*) as total FROM word_sets`);
    console.log(`\n   TOTAL: ${totalSets.rows[0].total} word sets\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicateWordSets().catch(console.error);
