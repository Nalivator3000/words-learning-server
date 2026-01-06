/**
 * Fix word set titles - remove [topic_general_X] brackets
 * Replace with cleaner format: "German A1: General 1"
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixTitles() {
  try {
    console.log('🔧 Fixing word set titles...\n');

    // Get all sets with brackets in title
    const setsResult = await pool.query(`
      SELECT id, title, source_language, level, theme
      FROM word_sets
      WHERE title LIKE '%[topic_%'
      ORDER BY source_language, level, title
    `);

    console.log(`Found ${setsResult.rows.length} sets with bracket notation\n`);

    if (setsResult.rows.length === 0) {
      console.log('✅ No sets need fixing!\n');
      return;
    }

    let fixed = 0;

    for (const set of setsResult.rows) {
      // Extract the part number from [topic_general_X]
      const match = set.title.match(/\[topic_general_(\d+)\]/);

      if (match) {
        const partNumber = match[1];
        const langDisplay = set.source_language.charAt(0).toUpperCase() + set.source_language.slice(1);

        const newTitle = `${langDisplay} ${set.level}: General ${partNumber}`;

        await pool.query(`
          UPDATE word_sets
          SET title = $1
          WHERE id = $2
        `, [newTitle, set.id]);

        console.log(`✅ [${set.id}] ${set.title} → ${newTitle}`);
        fixed++;
      }
    }

    console.log(`\n✨ Fixed ${fixed} word set titles!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixTitles();
