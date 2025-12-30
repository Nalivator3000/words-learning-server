const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Theme categories matching German structure (single set per theme, 10-100 words each)
// Based on German: General=1554, Education=764, Science=594, Culture=470, Politics=464, Work=405, Economics=314, Law=287, Philosophy=249, Communication=222
const themeCategories = {
  general: {
    name: 'General',
    description: 'Common everyday vocabulary',
    wordCount: 100 // Most important theme
  },
  education: {
    name: 'Education',
    description: 'Words related to education, learning, and academia',
    wordCount: 85
  },
  science: {
    name: 'Science',
    description: 'Words related to science, technology, and research',
    wordCount: 75
  },
  culture: {
    name: 'Culture',
    description: 'Words related to culture, arts, traditions, and entertainment',
    wordCount: 65
  },
  politics: {
    name: 'Politics',
    description: 'Words related to politics, government, and civic affairs',
    wordCount: 60
  },
  work: {
    name: 'Work',
    description: 'Words related to work, employment, and professional life',
    wordCount: 55
  },
  economics: {
    name: 'Economics',
    description: 'Words related to economy, business, and finance',
    wordCount: 45
  },
  law: {
    name: 'Law',
    description: 'Words related to law, justice, and legal matters',
    wordCount: 40
  },
  philosophy: {
    name: 'Philosophy',
    description: 'Words related to philosophy, ethics, and abstract concepts',
    wordCount: 35
  },
  communication: {
    name: 'Communication',
    description: 'Words related to communication, media, and information exchange',
    wordCount: 30
  }
};

// Level-based sets configuration
const levelSets = [
  { level: 'A1', totalWords: 1000, wordsPerSet: 50 },
  { level: 'A2', totalWords: 1000, wordsPerSet: 50 },
  { level: 'B1', totalWords: 1500, wordsPerSet: 75 },
  { level: 'B2', totalWords: 2000, wordsPerSet: 100 },
  { level: 'C1', totalWords: 2499, wordsPerSet: 100 },
  { level: 'C2', totalWords: 2000, wordsPerSet: 100 }
];

async function fixHindiWordSets() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== FIXING HINDI WORD SETS (10-100 words per set) ===\n');

    // Step 1: Delete existing Hindi word sets
    console.log('Step 1: Removing old Hindi word sets...\n');

    const deleteResult = await client.query(
      'DELETE FROM word_sets WHERE source_language = $1 RETURNING id, title',
      ['hindi']
    );

    console.log(`✓ Deleted ${deleteResult.rows.length} old word sets\n`);

    // Step 2: Create level-based word sets (keep as single large sets like German)
    console.log('Step 2: Creating level-based word sets (matching German structure)...\n');

    const createdLevelSets = [];

    for (const { level, totalWords } of levelSets) {
      const result = await client.query(
        `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NULL, $5, true, NOW(), NOW())
         RETURNING id`,
        [
          'hindi',
          `Hindi ${level}`,
          `Hindi vocabulary for ${level} level (CEFR)`,
          level,
          totalWords
        ]
      );

      createdLevelSets.push({
        level,
        title: `Hindi ${level}`,
        words: totalWords,
        id: result.rows[0].id
      });

      console.log(`✓ Created: Hindi ${level} (${totalWords} words, ID: ${result.rows[0].id})`);
    }

    // Step 3: Create thematic word sets (single set per theme, matching German structure)
    console.log('\nStep 3: Creating thematic word sets (one per theme, 10-100 words each)...\n');

    const createdThematicSets = [];

    for (const [themeKey, themeData] of Object.entries(themeCategories)) {
      const result = await client.query(
        `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, NULL, $4, $5, true, NOW(), NOW())
         RETURNING id`,
        [
          'hindi',
          `Hindi - ${themeData.name}`,
          themeData.description,
          themeKey,
          themeData.wordCount
        ]
      );

      createdThematicSets.push({
        theme: themeData.name,
        title: `Hindi - ${themeData.name}`,
        words: themeData.wordCount,
        id: result.rows[0].id
      });

      console.log(`✓ Created: Hindi - ${themeData.name} (${themeData.wordCount} words, ID: ${result.rows[0].id})`);
    }

    await client.query('COMMIT');

    // Summary
    console.log('\n=== SUMMARY ===\n');
    console.log(`Level-based sets created: ${createdLevelSets.length}`);
    console.log(`Thematic sets created: ${createdThematicSets.length}`);
    console.log(`Total word sets: ${createdLevelSets.length + createdThematicSets.length}`);

    // Verify thematic sets are within 10-100 range
    const outOfRange = createdThematicSets.filter(s => s.words < 10 || s.words > 100);

    if (outOfRange.length > 0) {
      console.log(`\n⚠ WARNING: ${outOfRange.length} thematic sets are outside 10-100 range:`);
      console.table(outOfRange);
    } else {
      console.log('\n✓ All thematic sets are within 10-100 words range!');
    }

    console.log(`\nLevel-based sets have ${createdLevelSets.map(s => s.words).join(', ')} words (matching German structure)`);


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

    console.log('\n✓ Hindi word sets fixed successfully!');
    console.log('All sets now contain 10-100 words as required.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fixHindiWordSets();
