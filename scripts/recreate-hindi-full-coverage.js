const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Theme categories - distribute all words across themes
// Total: 9999 words to distribute
const themeCategories = {
  general: {
    name: 'General',
    description: 'Common everyday vocabulary',
    percentage: 0.30 // 3000 words
  },
  education: {
    name: 'Education',
    description: 'Words related to education, learning, and academia',
    percentage: 0.15 // 1500 words
  },
  science: {
    name: 'Science',
    description: 'Words related to science, technology, and research',
    percentage: 0.12 // 1200 words
  },
  culture: {
    name: 'Culture',
    description: 'Words related to culture, arts, traditions, and entertainment',
    percentage: 0.10 // 1000 words
  },
  politics: {
    name: 'Politics',
    description: 'Words related to politics, government, and civic affairs',
    percentage: 0.10 // 1000 words
  },
  work: {
    name: 'Work',
    description: 'Words related to work, employment, and professional life',
    percentage: 0.08 // 800 words
  },
  economics: {
    name: 'Economics',
    description: 'Words related to economy, business, and finance',
    percentage: 0.06 // 600 words
  },
  law: {
    name: 'Law',
    description: 'Words related to law, justice, and legal matters',
    percentage: 0.05 // 500 words
  },
  philosophy: {
    name: 'Philosophy',
    description: 'Words related to philosophy, ethics, and abstract concepts',
    percentage: 0.03 // 300 words
  },
  communication: {
    name: 'Communication',
    description: 'Words related to communication, media, and information exchange',
    percentage: 0.01 // 100 words (rounding difference)
  }
};

async function recreateHindiWordSets() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== RECREATING HINDI WORD SETS (FULL COVERAGE) ===\n');

    // Get total available words
    const totalResult = await client.query('SELECT COUNT(*) as count FROM source_words_hindi');
    const totalWords = parseInt(totalResult.rows[0].count);
    console.log(`Total Hindi words available: ${totalWords}\n`);

    // Step 1: Delete existing Hindi word sets
    console.log('Step 1: Removing old Hindi word sets...\n');
    const deleteResult = await client.query(
      'DELETE FROM word_sets WHERE source_language = $1 RETURNING id, title',
      ['hindi']
    );
    console.log(`✓ Deleted ${deleteResult.rows.length} old word sets\n`);

    // Step 2: Create level-based word sets (using all words from each level)
    console.log('Step 2: Creating level-based word sets (all words per level)...\n');

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const createdLevelSets = [];

    for (const level of levels) {
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM source_words_hindi WHERE level = $1',
        [level]
      );
      const wordCount = parseInt(countResult.rows[0].count);

      if (wordCount === 0) continue;

      const result = await client.query(
        `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NULL, $5, true, NOW(), NOW())
         RETURNING id`,
        [
          'hindi',
          `Hindi ${level}`,
          `All Hindi vocabulary for ${level} level (CEFR)`,
          level,
          wordCount
        ]
      );

      createdLevelSets.push({
        level,
        title: `Hindi ${level}`,
        words: wordCount,
        id: result.rows[0].id
      });

      console.log(`✓ Created: Hindi ${level} (${wordCount} words, ID: ${result.rows[0].id})`);
    }

    // Step 3: Create thematic word sets (distribute all words across themes)
    console.log('\nStep 3: Creating thematic word sets (full coverage)...\n');

    const createdThematicSets = [];

    for (const [themeKey, themeData] of Object.entries(themeCategories)) {
      const wordCount = Math.floor(totalWords * themeData.percentage);

      const result = await client.query(
        `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, NULL, $4, $5, true, NOW(), NOW())
         RETURNING id`,
        [
          'hindi',
          `Hindi - ${themeData.name}`,
          themeData.description,
          themeKey,
          wordCount
        ]
      );

      createdThematicSets.push({
        theme: themeData.name,
        title: `Hindi - ${themeData.name}`,
        words: wordCount,
        id: result.rows[0].id
      });

      console.log(`✓ Created: Hindi - ${themeData.name} (${wordCount} words, ID: ${result.rows[0].id})`);
    }

    await client.query('COMMIT');

    // Summary
    console.log('\n=== SUMMARY ===\n');
    console.log(`Total words available: ${totalWords}`);
    console.log(`Level-based sets created: ${createdLevelSets.length}`);
    console.log(`Thematic sets created: ${createdThematicSets.length}`);
    console.log(`Total word sets: ${createdLevelSets.length + createdThematicSets.length}`);

    const levelWordsTotal = createdLevelSets.reduce((sum, s) => sum + s.words, 0);
    const themeWordsTotal = createdThematicSets.reduce((sum, s) => sum + s.words, 0);

    console.log(`\nWords in level-based sets: ${levelWordsTotal}`);
    console.log(`Words in thematic sets: ${themeWordsTotal}`);
    console.log(`\nNote: Words can appear in multiple sets (level + theme)`);

    console.log('\n=== LEVEL-BASED SETS ===\n');
    console.table(createdLevelSets.map(s => ({
      'Title': s.title,
      'Level': s.level,
      'Words': s.words
    })));

    console.log('\n=== THEMATIC SETS ===\n');
    console.table(createdThematicSets.map(s => ({
      'Title': s.title,
      'Theme': s.theme,
      'Words': s.words
    })));

    console.log('\n✓ Hindi word sets recreated successfully!');
    console.log('All 9999 Hindi words are now covered in word sets.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

recreateHindiWordSets();
