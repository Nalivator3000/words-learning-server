require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function generateDetailedReport() {
  try {
    console.log('\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(20) + 'DETAILED GENERAL WORD SETS REPORT' + ' '.repeat(24) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('\n');

    // Main query
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
        level,
        title
    `);

    console.log('DATABASE CONNECTION: ✓ Connected');
    console.log('TOTAL RECORDS FOUND:', result.rows.length);
    console.log('\n');

    // Group by language and level
    const data = new Map();
    result.rows.forEach(row => {
      if (!data.has(row.source_language)) {
        data.set(row.source_language, new Map());
      }
      if (!data.get(row.source_language).has(row.level)) {
        data.get(row.source_language).set(row.level, []);
      }
      data.get(row.source_language).get(row.level).push(row);
    });

    // Show sample data for each language
    console.log('┌' + '─'.repeat(78) + '┐');
    console.log('│ SAMPLE DATA BY LANGUAGE (showing first 3 entries per level)' + ' '.repeat(18) + '│');
    console.log('└' + '─'.repeat(78) + '┘');
    console.log('\n');

    const languages = Array.from(data.keys()).sort();

    // Show details for first 3 languages
    languages.slice(0, 3).forEach(lang => {
      console.log(`\n▶ ${lang.toUpperCase()}`);
      console.log('  ' + '─'.repeat(76));

      const levels = Array.from(data.get(lang).keys()).sort();
      levels.forEach(level => {
        const sets = data.get(lang).get(level);
        console.log(`\n  Level ${level}: ${sets.length} word sets`);
        sets.slice(0, 3).forEach(set => {
          console.log(`    • [ID: ${set.id}] ${set.title}`);
        });
        if (sets.length > 3) {
          console.log(`    ... and ${sets.length - 3} more`);
        }
      });
    });

    // Pattern analysis
    console.log('\n\n');
    console.log('┌' + '─'.repeat(78) + '┐');
    console.log('│ PATTERN ANALYSIS: "General X" occurrences' + ' '.repeat(36) + '│');
    console.log('└' + '─'.repeat(78) + '┘');
    console.log('\n');

    const patterns = new Map();
    const regex = /General\s+(\d+)/i;

    result.rows.forEach(row => {
      const match = row.title.match(regex);
      if (match) {
        const number = parseInt(match[1]);
        if (!patterns.has(number)) {
          patterns.set(number, {
            count: 0,
            languages: new Set(),
            levels: new Set(),
            samples: []
          });
        }
        patterns.get(number).count++;
        patterns.get(number).languages.add(row.source_language);
        patterns.get(number).levels.add(row.level);
        if (patterns.get(number).samples.length < 3) {
          patterns.get(number).samples.push(row);
        }
      }
    });

    const sortedPatterns = Array.from(patterns.entries()).sort((a, b) => a[0] - b[0]);

    console.log(`Total different "General X" patterns: ${sortedPatterns.length}`);
    console.log(`Range: General 1 to General ${sortedPatterns[sortedPatterns.length - 1][0]}`);
    console.log('\n');

    // Show first 5 patterns in detail
    console.log('First 5 patterns in detail:\n');
    sortedPatterns.slice(0, 5).forEach(([num, info]) => {
      console.log(`General ${num}:`);
      console.log(`  • Total occurrences: ${info.count}`);
      console.log(`  • Languages: ${Array.from(info.languages).join(', ')}`);
      console.log(`  • Levels: ${Array.from(info.levels).sort().join(', ')}`);
      console.log(`  • Sample entries:`);
      info.samples.forEach(s => {
        console.log(`    - [ID: ${s.id}] ${s.title}`);
      });
      console.log('');
    });

    // Summary table
    console.log('\n');
    console.log('┌' + '─'.repeat(78) + '┐');
    console.log('│ SUMMARY BY LANGUAGE' + ' '.repeat(58) + '│');
    console.log('└' + '─'.repeat(78) + '┘');
    console.log('\n');

    console.log('Language          A1    A2    B1    B2    C1    C2   Total');
    console.log('─'.repeat(78));

    languages.forEach(lang => {
      const levels = data.get(lang);
      const counts = {
        A1: levels.has('A1') ? levels.get('A1').length : 0,
        A2: levels.has('A2') ? levels.get('A2').length : 0,
        B1: levels.has('B1') ? levels.get('B1').length : 0,
        B2: levels.has('B2') ? levels.get('B2').length : 0,
        C1: levels.has('C1') ? levels.get('C1').length : 0,
        C2: levels.has('C2') ? levels.get('C2').length : 0
      };
      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      console.log(
        `${lang.padEnd(14)} ${String(counts.A1).padStart(5)} ${String(counts.A2).padStart(5)} ` +
        `${String(counts.B1).padStart(5)} ${String(counts.B2).padStart(5)} ` +
        `${String(counts.C1).padStart(5)} ${String(counts.C2).padStart(5)} ${String(total).padStart(6)}`
      );
    });

    console.log('\n');
    console.log('═'.repeat(78));
    console.log('REPORT COMPLETE');
    console.log('═'.repeat(78));
    console.log('\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

generateDetailedReport();
