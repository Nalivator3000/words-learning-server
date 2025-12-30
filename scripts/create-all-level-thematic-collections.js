/**
 * Script to create thematic word collections for all German levels
 * Breaks down large level sets into smaller themed collections
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wordslearning';

const LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2'];
const CHUNK_SIZE = 50; // Words per chunk for 'general' theme
const MIN_THEME_SIZE = 10; // Minimum words to create a themed collection

async function createAllLevelCollections() {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
        console.log('🎯 Starting thematic collection creation for all levels...\n');

        for (const level of LEVELS) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📚 Processing ${level} Level`);
            console.log('='.repeat(60) + '\n');

            await createLevelCollections(client, level);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 All thematic collections created successfully!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await client.end();
    }
}

async function createLevelCollections(client, level) {
    // Get all words grouped by theme for this level
    const themesQuery = await client.query(`
        SELECT theme, COUNT(*) as count
        FROM source_words_german
        WHERE level = $1
        GROUP BY theme
        ORDER BY count DESC
    `, [level]);

    if (themesQuery.rows.length === 0) {
        console.log(`⚠️  No words found for level ${level}`);
        return;
    }

    console.log(`Found ${themesQuery.rows.length} themes in ${level}:\n`);
    themesQuery.rows.forEach(t => {
        console.log(`  - ${t.theme || 'null'}: ${t.count} words`);
    });
    console.log('');

    let totalCreated = 0;

    // Create collections for each theme
    for (const themeRow of themesQuery.rows) {
        const theme = themeRow.theme;
        const count = parseInt(themeRow.count);

        if (theme === 'general' || theme === null) {
            // Split 'general' into smaller chunks
            console.log(`📦 Processing '${theme || 'general'}' theme (${count} words)...`);
            const created = await splitGeneralTheme(client, level, count, theme);
            totalCreated += created;
            continue;
        }

        if (count < MIN_THEME_SIZE) {
            console.log(`⏭️  Skipping '${theme}' (only ${count} words)`);
            continue;
        }

        console.log(`📝 Creating collection: German ${level}: ${theme} (${count} words)`);

        // Create word set
        const setResult = await client.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ('german', $1, $2, $3, $4, $5, true)
            RETURNING id
        `, [
            `German ${level}: ${theme}`,
            `${level} level vocabulary: ${theme}`,
            level,
            theme,
            count
        ]);

        console.log(`✅ Created collection: ${theme} (${count} words, ID: ${setResult.rows[0].id})\n`);
        totalCreated++;
    }

    console.log(`\n✨ Created ${totalCreated} collections for ${level} level\n`);
}

async function splitGeneralTheme(client, level, totalCount, theme) {
    const chunks = Math.ceil(totalCount / CHUNK_SIZE);
    const themeName = theme || 'general';

    console.log(`  Splitting into ${chunks} collections of ~${CHUNK_SIZE} words each\n`);

    let createdCount = 0;

    for (let i = 0; i < chunks; i++) {
        const offset = i * CHUNK_SIZE;
        const chunkNum = i + 1;

        // Get words for this chunk
        const wordsQuery = await client.query(`
            SELECT id
            FROM source_words_german
            WHERE level = $1 AND (theme = $2 OR (theme IS NULL AND $2 IS NULL))
            ORDER BY word
            LIMIT $3 OFFSET $4
        `, [level, theme, CHUNK_SIZE, offset]);

        const actualCount = wordsQuery.rows.length;

        if (actualCount === 0) break;

        console.log(`  📝 Creating: German ${level}: Essential Vocabulary ${chunkNum} (${actualCount} words)`);

        // Create word set
        const setResult = await client.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ('german', $1, $2, $3, $4, $5, true)
            RETURNING id
        `, [
            `German ${level}: Essential Vocabulary ${chunkNum}`,
            `${level} level essential vocabulary - Part ${chunkNum}`,
            level,
            themeName,
            actualCount
        ]);

        console.log(`  ✅ Created collection ${chunkNum} (ID: ${setResult.rows[0].id})\n`);
        createdCount++;
    }

    return createdCount;
}

// Run the script
createAllLevelCollections()
    .then(() => {
        console.log('\n✨ Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
