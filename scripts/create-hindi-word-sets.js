const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Theme categories matching German structure
const themeCategories = {
  communication: {
    name: 'Communication',
    description: 'Words related to communication, media, and information exchange',
    percentage: 0.05 // 5% of total words
  },
  culture: {
    name: 'Culture',
    description: 'Words related to culture, arts, traditions, and entertainment',
    percentage: 0.10 // 10% of total words
  },
  economics: {
    name: 'Economics',
    description: 'Words related to economy, business, and finance',
    percentage: 0.07 // 7% of total words
  },
  education: {
    name: 'Education',
    description: 'Words related to education, learning, and academia',
    percentage: 0.15 // 15% of total words
  },
  general: {
    name: 'General',
    description: 'Common everyday vocabulary',
    percentage: 0.30 // 30% of total words
  },
  law: {
    name: 'Law',
    description: 'Words related to law, justice, and legal matters',
    percentage: 0.06 // 6% of total words
  },
  philosophy: {
    name: 'Philosophy',
    description: 'Words related to philosophy, ethics, and abstract concepts',
    percentage: 0.05 // 5% of total words
  },
  politics: {
    name: 'Politics',
    description: 'Words related to politics, government, and civic affairs',
    percentage: 0.10 // 10% of total words
  },
  science: {
    name: 'Science',
    description: 'Words related to science, technology, and research',
    percentage: 0.12 // 12% of total words
  }
};

async function createHindiWordSets() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== CREATING HINDI WORD SETS ===\n');

    // Step 1: Create level-based word sets (A1, A2, B1, B2, C1, C2)
    console.log('Step 1: Creating level-based word sets...\n');

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelSets = [];

    for (const level of levels) {
      // Get word count for this level
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM source_words_hindi WHERE level = $1',
        [level]
      );
      const wordCount = parseInt(countResult.rows[0].count);

      if (wordCount === 0) {
        console.log(`⚠ Skipping ${level} - no words found`);
        continue;
      }

      // Check if word set already exists
      const existingSet = await client.query(
        'SELECT id FROM word_sets WHERE source_language = $1 AND level = $2 AND theme IS NULL',
        ['hindi', level]
      );

      let setId;

      if (existingSet.rows.length > 0) {
        setId = existingSet.rows[0].id;
        console.log(`✓ Word set exists: Hindi ${level} (${wordCount} words)`);
      } else {
        // Create word set
        const result = await client.query(
          `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NULL, $5, true, NOW(), NOW())
           RETURNING id`,
          [
            'hindi',
            `Hindi ${level}`,
            `Hindi vocabulary for ${level} level (CEFR)`,
            level,
            wordCount
          ]
        );

        setId = result.rows[0].id;
        console.log(`✓ Created: Hindi ${level} (${wordCount} words, ID: ${setId})`);
      }

      levelSets.push({ level, setId, wordCount });
    }

    // Step 2: Create thematic word sets
    console.log('\nStep 2: Creating thematic word sets...\n');

    // Get total word count
    const totalResult = await client.query('SELECT COUNT(*) as count FROM source_words_hindi');
    const totalWords = parseInt(totalResult.rows[0].count);

    console.log(`Total Hindi words available: ${totalWords}\n`);

    const thematicSets = [];

    for (const [themeKey, themeData] of Object.entries(themeCategories)) {
      const targetCount = Math.floor(totalWords * themeData.percentage);

      // Check if thematic set already exists
      const existingSet = await client.query(
        'SELECT id FROM word_sets WHERE source_language = $1 AND theme = $2 AND level IS NULL',
        ['hindi', themeKey]
      );

      let setId;

      if (existingSet.rows.length > 0) {
        setId = existingSet.rows[0].id;
        console.log(`✓ Thematic set exists: Hindi - ${themeData.name} (${targetCount} words)`);
      } else {
        // Create thematic word set
        const result = await client.query(
          `INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public, created_at, updated_at)
           VALUES ($1, $2, $3, NULL, $4, $5, true, NOW(), NOW())
           RETURNING id`,
          [
            'hindi',
            `Hindi - ${themeData.name}`,
            themeData.description,
            themeKey,
            targetCount
          ]
        );

        setId = result.rows[0].id;
        console.log(`✓ Created: Hindi - ${themeData.name} (${targetCount} words, ID: ${setId})`);
      }

      thematicSets.push({
        theme: themeKey,
        name: themeData.name,
        setId,
        wordCount: targetCount
      });
    }

    await client.query('COMMIT');

    // Summary
    console.log('\n=== SUMMARY ===\n');
    console.log(`Level-based sets created: ${levelSets.length}`);
    console.log(`Thematic sets created: ${thematicSets.length}`);
    console.log(`Total word sets: ${levelSets.length + thematicSets.length}`);

    console.log('\n=== LEVEL-BASED SETS ===\n');
    console.table(levelSets.map(s => ({
      'Level': s.level,
      'Words': s.wordCount,
      'Set ID': s.setId
    })));

    console.log('\n=== THEMATIC SETS ===\n');
    console.table(thematicSets.map(s => ({
      'Theme': s.name,
      'Words': s.wordCount,
      'Set ID': s.setId
    })));

    console.log('\n✓ Hindi word sets created successfully!');
    console.log('\nNote: Word sets have been created with word counts.');
    console.log('The actual word-to-set assignments can be done through the UI or separate script.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

createHindiWordSets();
