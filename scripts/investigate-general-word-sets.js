require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function investigateGeneralWordSets() {
  try {
    console.log('🔍 Investigating word sets with "general" in title...\n');
    console.log('Database:', process.env.DATABASE_URL.split('@')[1].split('/')[0]);
    console.log('='.repeat(80));
    console.log('\n');

    // Query to find all word sets with "general" in the title (case insensitive)
    const result = await pool.query(`
      SELECT
        id,
        title,
        source_language,
        level,
        theme,
        word_count,
        created_at,
        updated_at
      FROM word_sets
      WHERE LOWER(title) LIKE LOWER('%general%')
      ORDER BY
        source_language,
        title
    `);

    if (result.rows.length === 0) {
      console.log('❌ No word sets found with "general" in the title');
      return;
    }

    console.log(`✅ Found ${result.rows.length} word sets with "general" in the title\n`);
    console.log('='.repeat(80));
    console.log('\n');

    // Display all word sets
    console.log('📋 All Word Sets:\n');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Source Language: ${row.source_language}`);
      console.log(`   Level: ${row.level || 'N/A'}`);
      console.log(`   Theme: ${row.theme || 'N/A'}`);
      console.log(`   Word Count: ${row.word_count || 0}`);
      console.log(`   Created: ${row.created_at}`);
      console.log('   ' + '-'.repeat(76));
    });

    // Analyze patterns
    console.log('\n');
    console.log('='.repeat(80));
    console.log('📊 Pattern Analysis:\n');

    // Extract "General X" patterns
    const patterns = {};
    const regex = /General\s+(\d+)/i;

    result.rows.forEach(row => {
      const match = row.title.match(regex);
      if (match) {
        const number = match[1];
        const key = `General ${number}`;
        if (!patterns[key]) {
          patterns[key] = [];
        }
        patterns[key].push({
          id: row.id,
          title: row.title,
          source_language: row.source_language,
          level: row.level
        });
      }
    });

    // Display pattern counts
    const sortedPatterns = Object.keys(patterns).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

    console.log(`Found ${sortedPatterns.length} different "General X" patterns:\n`);

    sortedPatterns.forEach(pattern => {
      console.log(`📌 ${pattern}:`);
      console.log(`   Count: ${patterns[pattern].length} word sets`);
      console.log(`   Languages: ${[...new Set(patterns[pattern].map(p => p.source_language))].join(', ')}`);
      console.log(`   Levels: ${[...new Set(patterns[pattern].map(p => p.level).filter(Boolean))].join(', ') || 'None'}`);

      // Show individual sets for this pattern
      patterns[pattern].forEach(set => {
        console.log(`     - [ID: ${set.id}] ${set.title}`);
      });
      console.log('');
    });

    // Group by source language
    console.log('='.repeat(80));
    console.log('🌍 Breakdown by Source Language:\n');

    const byLanguage = {};
    result.rows.forEach(row => {
      if (!byLanguage[row.source_language]) {
        byLanguage[row.source_language] = [];
      }
      byLanguage[row.source_language].push(row);
    });

    Object.keys(byLanguage).sort().forEach(lang => {
      console.log(`${lang}: ${byLanguage[lang].length} word sets`);
      byLanguage[lang].forEach(set => {
        console.log(`  - [ID: ${set.id}] ${set.title} (Level: ${set.level || 'N/A'})`);
      });
      console.log('');
    });

    // Summary statistics
    console.log('='.repeat(80));
    console.log('📈 Summary Statistics:\n');
    console.log(`Total word sets with "general": ${result.rows.length}`);
    console.log(`Different "General X" patterns: ${sortedPatterns.length}`);
    console.log(`Source languages: ${Object.keys(byLanguage).length}`);
    console.log(`Date range: ${new Date(Math.min(...result.rows.map(r => new Date(r.created_at)))).toISOString().split('T')[0]} to ${new Date(Math.max(...result.rows.map(r => new Date(r.created_at)))).toISOString().split('T')[0]}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run the investigation
investigateGeneralWordSets();
