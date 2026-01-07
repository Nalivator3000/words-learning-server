require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function summarizeGeneralWordSets() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('                    GENERAL WORD SETS SUMMARY REPORT');
    console.log('='.repeat(80) + '\n');

    // Query to find all word sets with "general" in the title (case insensitive)
    const result = await pool.query(`
      SELECT
        id,
        title,
        source_language,
        level
      FROM word_sets
      WHERE LOWER(title) LIKE LOWER('%general%')
      ORDER BY
        source_language,
        title
    `);

    console.log(`Total word sets found: ${result.rows.length}\n`);

    // Extract patterns
    const patterns = new Map();
    const regex = /General\s+(\d+)/i;

    result.rows.forEach(row => {
      const match = row.title.match(regex);
      if (match) {
        const number = parseInt(match[1]);
        if (!patterns.has(number)) {
          patterns.set(number, []);
        }
        patterns.get(number).push({
          id: row.id,
          title: row.title,
          source_language: row.source_language,
          level: row.level
        });
      }
    });

    // Sort patterns by number
    const sortedNumbers = Array.from(patterns.keys()).sort((a, b) => a - b);

    console.log('='.repeat(80));
    console.log('PATTERN SUMMARY: "General X" patterns found');
    console.log('='.repeat(80) + '\n');

    console.log(`Total different patterns: ${sortedNumbers.length}`);
    console.log(`Range: General ${sortedNumbers[0]} to General ${sortedNumbers[sortedNumbers.length - 1]}\n`);

    // Show pattern distribution
    console.log('Pattern Distribution (top 20):');
    sortedNumbers.slice(0, 20).forEach(num => {
      const count = patterns.get(num).length;
      const languages = [...new Set(patterns.get(num).map(p => p.source_language))];
      console.log(`  General ${num}: ${count} word sets across ${languages.length} languages`);
    });

    if (sortedNumbers.length > 20) {
      console.log(`  ... and ${sortedNumbers.length - 20} more patterns\n`);
    }

    // Language breakdown
    console.log('\n' + '='.repeat(80));
    console.log('BREAKDOWN BY LANGUAGE');
    console.log('='.repeat(80) + '\n');

    const byLanguage = new Map();
    result.rows.forEach(row => {
      if (!byLanguage.has(row.source_language)) {
        byLanguage.set(row.source_language, []);
      }
      byLanguage.get(row.source_language).push(row);
    });

    const sortedLanguages = Array.from(byLanguage.entries()).sort((a, b) => b[1].length - a[1].length);

    console.log('Language                Count   Levels');
    console.log('-'.repeat(80));
    sortedLanguages.forEach(([lang, sets]) => {
      const levels = [...new Set(sets.map(s => s.level).filter(Boolean))].sort();
      console.log(`${lang.padEnd(20)} ${String(sets.length).padStart(5)}   ${levels.join(', ')}`);
    });

    // Level breakdown
    console.log('\n' + '='.repeat(80));
    console.log('BREAKDOWN BY LEVEL');
    console.log('='.repeat(80) + '\n');

    const byLevel = new Map();
    result.rows.forEach(row => {
      if (row.level) {
        if (!byLevel.has(row.level)) {
          byLevel.set(row.level, []);
        }
        byLevel.get(row.level).push(row);
      }
    });

    const sortedLevels = Array.from(byLevel.entries()).sort((a, b) => {
      const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    });

    console.log('Level    Count   Languages');
    console.log('-'.repeat(80));
    sortedLevels.forEach(([level, sets]) => {
      const languages = [...new Set(sets.map(s => s.source_language))].length;
      console.log(`${level.padEnd(8)} ${String(sets.length).padStart(5)}   ${languages} different languages`);
    });

    // Sample entries
    console.log('\n' + '='.repeat(80));
    console.log('SAMPLE ENTRIES (first 10)');
    console.log('='.repeat(80) + '\n');

    result.rows.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. [ID: ${row.id}] ${row.title}`);
      console.log(`   Language: ${row.source_language}, Level: ${row.level}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('END OF REPORT');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

summarizeGeneralWordSets();
