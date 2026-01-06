/**
 * Universal script to create general word sets (50 words each) for any language
 * Usage: node create-general-sets-universal.js <language>
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];

if (!language) {
  console.error('❌ Please specify a language: node create-general-sets-universal.js <language>');
  process.exit(1);
}

async function createGeneralSets() {
  try {
    console.log('\n' + '═'.repeat(80));
    console.log(`🌍 Processing ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    // Step 1: Set all words to 'general' theme
    console.log('📝 Step 1: Setting all words to general theme...\n');

    const updateResult = await pool.query(`
      UPDATE source_words_${language}
      SET theme = 'general'
      WHERE theme IS NULL OR theme != 'general'
    `);

    console.log(`   ✅ Updated ${updateResult.rowCount} words to general theme\n`);

    // Step 2: Delete old word sets
    console.log('🗑️  Step 2: Removing old word sets...\n');

    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = $1
    `, [language]);

    console.log(`   Deleted: ${deleteResult.rowCount} old sets\n`);

    // Step 3: Create new word sets (50 words each, by level)
    console.log('📚 Step 3: Creating new word sets...\n');

    let totalSetsCreated = 0;

    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      // Count words for this level
      const countResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM source_words_${language}
        WHERE level = $1
      `, [level]);

      const wordCount = parseInt(countResult.rows[0].count);

      if (wordCount === 0) {
        continue;
      }

      // Calculate number of chunks needed
      const chunks = Math.ceil(wordCount / 50);

      console.log(`   📈 Level ${level}: ${wordCount} words → ${chunks} sets`);

      // Create sets
      for (let i = 0; i < chunks; i++) {
        const setNumber = i + 1;
        const title = `${language.charAt(0).toUpperCase() + language.slice(1)} ${level}: General ${setNumber}`;
        const description = `${level} level vocabulary - General collection ${setNumber}`;
        const setWordCount = Math.min(50, wordCount - (i * 50));

        await pool.query(`
          INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
          VALUES ($1, $2, $3, $4, 'general', $5, true)
        `, [language, title, description, level, setWordCount]);

        totalSetsCreated++;
      }
    }

    console.log(`\n✅ Created ${totalSetsCreated} word sets for ${language}!\n`);
    console.log('═'.repeat(80));
    console.log('🎉 Done!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

createGeneralSets();
