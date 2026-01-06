const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('Checking word collection counts...\n');

    // Check German word collections
    const germanResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public_word_collections
      WHERE source_language = 'de' AND is_public = true
    `);

    console.log('✓ German (de) collections:', germanResult.rows[0]?.count || 0);

    // Check Hindi
    const hindiResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public_word_collections
      WHERE source_language = 'hi' AND is_public = true
    `);

    console.log('✓ Hindi (hi) collections:', hindiResult.rows[0]?.count || 0);

    // Check English
    const englishResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public_word_collections
      WHERE source_language = 'en' AND is_public = true
    `);

    console.log('✓ English (en) collections:', englishResult.rows[0]?.count || 0);

    // Check Russian
    const russianResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public_word_collections
      WHERE source_language = 'ru' AND is_public = true
    `);

    console.log('✓ Russian (ru) collections:', russianResult.rows[0]?.count || 0);

    console.log('\nDetailed breakdown:');

    // Get German collections by level/theme
    const germanDetails = await pool.query(`
      SELECT cefr_level, theme, COUNT(*) as count
      FROM public_word_collections
      WHERE source_language = 'de' AND is_public = true
      GROUP BY cefr_level, theme
      ORDER BY cefr_level NULLS LAST, theme NULLS LAST
    `);

    console.log('\nGerman collections:');
    germanDetails.rows.forEach(row => {
      console.log(`  ${row.cefr_level || 'NO_LEVEL'} / ${row.theme || 'NO_THEME'}: ${row.count}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
