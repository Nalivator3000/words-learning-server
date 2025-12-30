/**
 * Script to create thematic word collections for German A1 level
 * Breaks down the large A1 set into smaller themed collections
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wordslearning';

async function createThematicCollections() {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
        console.log('🎯 Starting A1 thematic collection creation...\n');

        // Get all A1 words grouped by theme
        const themesQuery = await client.query(`
            SELECT theme, COUNT(*) as count
            FROM source_words_german
            WHERE level = 'A1'
            GROUP BY theme
            ORDER BY count DESC
        `);

        console.log(`Found ${themesQuery.rows.length} themes in A1:\n`);
        themesQuery.rows.forEach(t => {
            console.log(`  - ${t.theme}: ${t.count} words`);
        });
        console.log('');

        // Create collections for each theme (except 'general')
        for (const themeRow of themesQuery.rows) {
            const theme = themeRow.theme;
            const count = parseInt(themeRow.count);

            if (theme === 'general') {
                // Split 'general' into smaller chunks
                console.log(`📦 Processing 'general' theme (${count} words)...`);
                await splitGeneralTheme(client, count);
                continue;
            }

            if (count < 10) {
                console.log(`⏭️  Skipping '${theme}' (only ${count} words)`);
                continue;
            }

            console.log(`📝 Creating collection: German A1: ${theme} (${count} words)`);

            // Create word set
            const setResult = await client.query(`
                INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
                VALUES ('german', $1, $2, 'A1', $3, $4, true)
                RETURNING id
            `, [
                `German A1: ${theme}`,
                `A1 level vocabulary: ${theme}`,
                theme,
                count
            ]);

            console.log(`✅ Created collection: ${theme} (${count} words, ID: ${setResult.rows[0].id})\n`);
        }

        console.log('🎉 Thematic collection creation complete!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await client.end();
    }
}

async function splitGeneralTheme(client, totalCount) {
    const CHUNK_SIZE = 50; // Split into chunks of 50 words
    const chunks = Math.ceil(totalCount / CHUNK_SIZE);

    console.log(`  Splitting into ${chunks} collections of ~${CHUNK_SIZE} words each\n`);

    for (let i = 0; i < chunks; i++) {
        const offset = i * CHUNK_SIZE;
        const chunkNum = i + 1;

        // Get words for this chunk
        const wordsQuery = await client.query(`
            SELECT id
            FROM source_words_german
            WHERE level = 'A1' AND theme = 'general'
            ORDER BY word
            LIMIT $1 OFFSET $2
        `, [CHUNK_SIZE, offset]);

        const actualCount = wordsQuery.rows.length;

        if (actualCount === 0) break;

        console.log(`  📝 Creating: German A1: Essential Vocabulary ${chunkNum} (${actualCount} words)`);

        // Create word set
        const setResult = await client.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ('german', $1, $2, 'A1', 'general', $3, true)
            RETURNING id
        `, [
            `German A1: Essential Vocabulary ${chunkNum}`,
            `A1 level essential vocabulary - Part ${chunkNum}`,
            actualCount
        ]);

        console.log(`  ✅ Created collection ${chunkNum} (ID: ${setResult.rows[0].id})\n`);
    }
}

// Run the script
createThematicCollections()
    .then(() => {
        console.log('\n✨ Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
