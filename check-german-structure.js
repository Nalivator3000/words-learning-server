const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function checkGermanStructure() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking German words structure...\n');

    // Check total counts
    const totalResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN level IS NOT NULL THEN 1 END) as with_level,
        COUNT(CASE WHEN theme IS NOT NULL THEN 1 END) as with_theme
      FROM source_words_german
    `);

    console.log('📊 German words overview:');
    console.log(`   Total words: ${totalResult.rows[0].total}`);
    console.log(`   With level: ${totalResult.rows[0].with_level}`);
    console.log(`   With theme: ${totalResult.rows[0].with_theme}`);

    // Check level distribution
    const levelResult = await client.query(`
      SELECT level, COUNT(*) as count
      FROM source_words_german
      WHERE level IS NOT NULL
      GROUP BY level
      ORDER BY level
    `);

    console.log('\n📈 Level distribution:');
    levelResult.rows.forEach(row => {
      console.log(`   ${row.level}: ${row.count} words`);
    });

    // Check theme distribution
    const themeResult = await client.query(`
      SELECT theme, COUNT(*) as count
      FROM source_words_german
      WHERE theme IS NOT NULL
      GROUP BY theme
      ORDER BY theme
      LIMIT 20
    `);

    console.log('\n🏷️  Theme distribution (top 20):');
    themeResult.rows.forEach(row => {
      console.log(`   ${row.theme}: ${row.count} words`);
    });

    // Check level + theme combinations
    const comboResult = await client.query(`
      SELECT level, theme, COUNT(*) as count
      FROM source_words_german
      WHERE level IS NOT NULL AND theme IS NOT NULL
      GROUP BY level, theme
      ORDER BY level, theme
      LIMIT 30
    `);

    console.log('\n🔗 Level + Theme combinations (first 30):');
    comboResult.rows.forEach(row => {
      console.log(`   Level: ${row.level}, Theme: ${row.theme} → ${row.count} words`);
    });

    // Sample words
    const sampleResult = await client.query(`
      SELECT id, word, level, theme
      FROM source_words_german
      WHERE level IS NOT NULL OR theme IS NOT NULL
      ORDER BY id
      LIMIT 10
    `);

    console.log('\n📝 Sample words with level/theme:');
    sampleResult.rows.forEach(word => {
      console.log(`   [${word.id}] "${word.word}" - Level: ${word.level || 'N/A'}, Theme: ${word.theme || 'N/A'}`);
    });

    // Now check scripts that should populate word_set_items
    console.log('\n\n🔍 Looking for word set population scripts...\n');

    const fs = require('fs');
    const path = require('path');

    const scriptsDir = path.join(__dirname, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      const files = fs.readdirSync(scriptsDir);
      const relevantFiles = files.filter(f =>
        f.includes('word-set') ||
        f.includes('word_set') ||
        f.includes('create-sets') ||
        f.includes('populate') ||
        f.includes('thematic')
      );

      console.log('📁 Found potentially relevant scripts:');
      relevantFiles.forEach(f => console.log(`   - ${f}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkGermanStructure().catch(console.error);
