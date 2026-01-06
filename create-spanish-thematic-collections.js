/**
 * Script to create thematic word collections for Spanish
 * Breaks down large level sets into smaller collections for easier learning
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CHUNK_SIZE = 50; // Words per collection

const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner - Essential vocabulary for absolute beginners',
    'A2': 'Elementary - Basic everyday vocabulary',
    'B1': 'Intermediate - Common words for daily communication',
    'B2': 'Upper Intermediate - Advanced everyday vocabulary',
    'C1': 'Advanced - Complex and nuanced vocabulary',
    'C2': 'Proficiency - Academic and specialized vocabulary'
};

async function createSpanishCollections() {
    try {
        console.log('\n🇪🇸 Starting Spanish thematic collection creation...\n');
        console.log('═'.repeat(70) + '\n');

        // First, delete existing Spanish word sets with theme
        console.log('🗑️  Removing old Spanish thematic collections...');
        const deleteResult = await pool.query(`
            DELETE FROM word_sets
            WHERE source_language = 'spanish'
            AND theme IS NOT NULL
        `);
        console.log(`   Deleted ${deleteResult.rowCount} old collections\n`);

        let totalCreated = 0;

        for (const level of LEVELS) {
            console.log(`\n${'═'.repeat(70)}`);
            console.log(`📚 Processing ${level} Level`);
            console.log('═'.repeat(70) + '\n');

            const created = await createLevelCollections(level);
            totalCreated += created;
        }

        console.log('\n' + '═'.repeat(70));
        console.log(`🎉 All thematic collections created successfully!`);
        console.log(`   Total collections: ${totalCreated}`);
        console.log('═'.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function createLevelCollections(level) {
    // Get total count for this level
    const countQuery = await pool.query(`
        SELECT COUNT(*) as count
        FROM source_words_spanish
        WHERE level = $1
    `, [level]);

    const totalCount = parseInt(countQuery.rows[0].count);

    if (totalCount === 0) {
        console.log(`⚠️  No words found for level ${level}\n`);
        return 0;
    }

    console.log(`Found ${totalCount} words in ${level}`);
    const chunks = Math.ceil(totalCount / CHUNK_SIZE);
    console.log(`Will create ${chunks} collections of ~${CHUNK_SIZE} words each\n`);

    let createdCount = 0;

    for (let i = 0; i < chunks; i++) {
        const offset = i * CHUNK_SIZE;
        const chunkNum = i + 1;

        // Get words for this chunk
        const wordsQuery = await pool.query(`
            SELECT id, word
            FROM source_words_spanish
            WHERE level = $1
            ORDER BY id
            LIMIT $2 OFFSET $3
        `, [level, CHUNK_SIZE, offset]);

        const actualCount = wordsQuery.rows.length;

        if (actualCount === 0) break;

        const title = `Spanish ${level}: Essential Vocabulary ${chunkNum}`;
        const description = `${LEVEL_DESCRIPTIONS[level]} - Part ${chunkNum}`;

        console.log(`📝 Creating: ${title} (${actualCount} words)`);

        // Create word set
        const setResult = await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ('spanish', $1, $2, $3, 'general', $4, true)
            RETURNING id
        `, [title, description, level, actualCount]);

        const setId = setResult.rows[0].id;

        console.log(`   ✅ Created collection (ID: ${setId})`);
        console.log(`   Sample words: ${wordsQuery.rows.slice(0, 5).map(w => w.word).join(', ')}...\n`);

        createdCount++;
    }

    console.log(`✨ Created ${createdCount} collections for ${level} level\n`);
    return createdCount;
}

// Run the script
createSpanishCollections();
