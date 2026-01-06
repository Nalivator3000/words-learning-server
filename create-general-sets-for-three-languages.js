/**
 * Create general word sets for Hindi, Japanese, and Swahili
 * Since all words already have theme='general', we just need to create word sets
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const LANGUAGES = ['hindi', 'japanese', 'swahili'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CHUNK_SIZE = 50;

const LEVEL_DESCRIPTIONS = {
  'A1': 'Beginner',
  'A2': 'Elementary',
  'B1': 'Intermediate',
  'B2': 'Upper Intermediate',
  'C1': 'Advanced',
  'C2': 'Proficiency'
};

async function createGeneralSets(language) {
  const tableName = `source_words_${language}`;
  const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🌍 Creating sets for ${langDisplay.toUpperCase()}`);
  console.log('═'.repeat(60) + '\n');

  try {
    // Delete old word sets
    console.log('🗑️  Removing old word sets...\n');
    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = $1
    `, [language]);
    console.log(`   Deleted: ${deleteResult.rowCount} old sets\n`);

    // Create new general sets
    console.log('📚 Creating new word sets...\n');
    let totalCreated = 0;

    for (const level of LEVELS) {
      console.log(`   📈 Level ${level}:`);

      // Count words for this level
      const countResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM ${tableName}
        WHERE level = $1
      `, [level]);

      const count = parseInt(countResult.rows[0].count);

      if (count === 0) {
        console.log(`      ⏭️  No words found`);
        continue;
      }

      // Create chunks of 50 words each
      const chunks = Math.ceil(count / CHUNK_SIZE);

      for (let i = 0; i < chunks; i++) {
        const actualCount = Math.min(CHUNK_SIZE, count - (i * CHUNK_SIZE));
        const title = `${langDisplay} ${level}: Essential Vocabulary ${i + 1}`;
        const description = `${LEVEL_DESCRIPTIONS[level]} level essential vocabulary - Part ${i + 1}`;

        await pool.query(`
          INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
          VALUES ($1, $2, $3, $4, 'general', $5, true)
        `, [language, title, description, level, actualCount]);

        totalCreated++;
      }

      console.log(`      ✅ Created ${chunks} sets (${count} words)`);
    }

    console.log(`\n✨ Total sets created: ${totalCreated}\n`);

  } catch (error) {
    console.error(`❌ Error processing ${langDisplay}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('\n🚀 Creating word sets for Hindi, Japanese, and Swahili\n');

    for (const language of LANGUAGES) {
      await createGeneralSets(language);
    }

    console.log('═'.repeat(60));
    console.log('🎉 All done!');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main();