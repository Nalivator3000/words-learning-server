const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function checkSimilarSetNames() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking for sets with similar names...\n');

    // Get all sets grouped by language
    const result = await client.query(`
      SELECT
        ws.id,
        ws.title,
        ws.source_language,
        ws.level,
        ws.theme,
        ws.word_count,
        COUNT(wsi.word_id) as actual_word_count
      FROM word_sets ws
      LEFT JOIN word_set_items wsi ON ws.id = wsi.word_set_id
      GROUP BY ws.id, ws.title, ws.source_language, ws.level, ws.theme, ws.word_count
      ORDER BY ws.source_language, ws.title
    `);

    console.log(`📊 Total word sets: ${result.rows.length}\n`);

    // Group by language
    const byLanguage = {};
    result.rows.forEach(set => {
      if (!byLanguage[set.source_language]) {
        byLanguage[set.source_language] = [];
      }
      byLanguage[set.source_language].push(set);
    });

    // Check each language for similar names
    for (const [language, sets] of Object.entries(byLanguage)) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📚 ${language.toUpperCase()} (${sets.length} sets)`);
      console.log('='.repeat(80));

      // Group by normalized title (lowercase, trimmed)
      const titleGroups = new Map();

      sets.forEach(set => {
        const normalizedTitle = set.title.toLowerCase().trim();
        if (!titleGroups.has(normalizedTitle)) {
          titleGroups.set(normalizedTitle, []);
        }
        titleGroups.get(normalizedTitle).push(set);
      });

      // Find groups with multiple sets
      let similarCount = 0;
      titleGroups.forEach((group, title) => {
        if (group.length > 1) {
          similarCount++;
          console.log(`\n⚠️  Similar name #${similarCount}: "${title}"`);
          console.log(`   ${group.length} sets with this name:`);
          group.forEach(set => {
            console.log(`   - [ID: ${set.id}] level: ${set.level || 'N/A'}, theme: ${set.theme || 'N/A'}, words: ${set.actual_word_count}`);
          });
        }
      });

      if (similarCount === 0) {
        console.log('\n✅ No sets with similar names');
      }

      // Check for sets with same level/theme but different titles
      console.log(`\n🔍 Checking for sets with same level+theme combination...`);

      const levelThemeGroups = new Map();
      sets.forEach(set => {
        const key = `${set.level || 'null'}|${set.theme || 'null'}`;
        if (!levelThemeGroups.has(key)) {
          levelThemeGroups.set(key, []);
        }
        levelThemeGroups.get(key).push(set);
      });

      let duplicateLevelTheme = 0;
      levelThemeGroups.forEach((group, key) => {
        const [level, theme] = key.split('|');
        if (group.length > 1 && level !== 'null' && theme !== 'null') {
          duplicateLevelTheme++;
          console.log(`\n⚠️  Same level+theme #${duplicateLevelTheme}: level="${level}", theme="${theme}"`);
          console.log(`   ${group.length} sets:`);
          group.forEach(set => {
            console.log(`   - [ID: ${set.id}] "${set.title}" (${set.actual_word_count} words)`);
          });
        }
      });

      if (duplicateLevelTheme === 0) {
        console.log('✅ No sets with duplicate level+theme combinations');
      }
    }

    // Sample some sets to show what they look like
    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 SAMPLE SETS (first 10 from German)');
    console.log('='.repeat(80));

    const germanSets = result.rows.filter(s => s.source_language === 'german').slice(0, 10);
    for (const set of germanSets) {
      console.log(`\n[ID: ${set.id}] "${set.title}"`);
      console.log(`   Level: ${set.level || 'N/A'}, Theme: ${set.theme || 'N/A'}`);
      console.log(`   Words: ${set.actual_word_count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkSimilarSetNames().catch(console.error);
