const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

async function checkLanguagePairs() {
  try {
    console.log('=== LANGUAGE PAIRS ANALYSIS ===\n');

    // User language pairs
    const userPairs = await pool.query(`
      SELECT from_lang, to_lang, COUNT(*) as users_count
      FROM language_pairs
      GROUP BY from_lang, to_lang
      ORDER BY users_count DESC, from_lang, to_lang;
    `);

    console.log('User Language Pairs (from user preferences):');
    console.table(userPairs.rows);

    // Get unique pairs
    const uniquePairs = userPairs.rows.map(r => `${r.from_lang} → ${r.to_lang}`);
    console.log(`\nUnique pairs: ${uniquePairs.length}`);
    console.log(uniquePairs.join(', '));

    // Check available translation tables
    console.log('\n\n=== AVAILABLE TRANSLATION TABLES ===\n');

    const tablesResult = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'target_translations_%'
      ORDER BY tablename;
    `);

    const translationTables = tablesResult.rows.map(r => r.tablename);
    console.log(`Total translation tables: ${translationTables.length}\n`);

    // Parse translation tables to get language pairs
    const availablePairs = new Map();

    for (const table of translationTables) {
      const match = table.match(/target_translations_(\w+)(?:_from_(\w+))?/);
      if (match) {
        const target = match[1];
        const source = match[2] || 'german'; // default source

        // Get count
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);

        if (count > 0) {
          const key = `${source} → ${target}`;
          if (!availablePairs.has(key)) {
            availablePairs.set(key, []);
          }
          availablePairs.get(key).push({ table, count });
        }
      }
    }

    console.log('Available Translation Pairs (with data):');
    const sortedPairs = Array.from(availablePairs.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [pair, tables] of sortedPairs) {
      const totalCount = tables.reduce((sum, t) => sum + t.count, 0);
      console.log(`\n${pair}: ${totalCount} translations`);
      for (const { table, count } of tables) {
        console.log(`  - ${table}: ${count}`);
      }
    }

    console.log(`\n\nTotal unique language pairs with translations: ${availablePairs.size}`);

    // Source words summary
    console.log('\n\n=== SOURCE WORDS SUMMARY ===\n');
    const sourceWordsTables = [
      'arabic', 'chinese', 'english', 'french', 'german', 'hindi',
      'italian', 'japanese', 'korean', 'polish', 'portuguese', 'romanian',
      'russian', 'serbian', 'spanish', 'swahili', 'turkish', 'ukrainian'
    ];

    const sourceSummary = [];
    for (const lang of sourceWordsTables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM source_words_${lang}`);
      const count = parseInt(countResult.rows[0].count);
      if (count > 0) {
        sourceSummary.push({ language: lang, words: count });
      }
    }

    console.table(sourceSummary);
    console.log(`\nTotal languages with source words: ${sourceSummary.length}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkLanguagePairs();
