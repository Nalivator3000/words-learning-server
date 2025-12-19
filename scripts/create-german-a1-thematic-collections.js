const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Parse the markdown vocabulary file and extract word data by sets
function parseVocabularyFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sets = [];
    let currentSet = null;
    let currentSubcategory = null;
    let inTable = false;
    let tableHeaders = [];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect set headers (### 1. First Words)
        if (line.match(/^###\s+\d+\.\s+(.+?)\s+\((\d+)\s+words?\)/)) {
            if (currentSet) {
                sets.push(currentSet);
            }
            const match = line.match(/^###\s+\d+\.\s+(.+?)\s+\((\d+)\s+words?\)/);
            currentSet = {
                name: match[1],
                expectedCount: parseInt(match[2]),
                words: []
            };
            inTable = false;
        }

        // Detect subcategory headers (#### Personal Pronouns)
        else if (line.match(/^####\s+(.+)/)) {
            const match = line.match(/^####\s+(.+)/);
            currentSubcategory = match[1];
            inTable = false;
        }

        // Detect table headers
        else if (line.startsWith('| German |')) {
            tableHeaders = line.split('|').map(h => h.trim()).filter(h => h);
            inTable = true;
        }

        // Skip separator lines
        else if (line.match(/^\|[-:\s|]+\|$/)) {
            continue;
        }

        // Parse table rows
        else if (inTable && line.startsWith('|') && currentSet) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c);

            if (cells.length >= 3) {
                const word = cells[0];
                const translation = cells[1];
                const example = cells[2] || '';
                const notes = cells[3] || '';

                currentSet.words.push({
                    word,
                    translation,
                    example,
                    notes,
                    subcategory: currentSubcategory || 'general'
                });
            }
        }
    }

    if (currentSet) {
        sets.push(currentSet);
    }

    return sets;
}

// Map set names to categories for better organization
const setMetadata = {
    'First Words': { category: 'basics', topic: 'fundamentals', icon: '🔤' },
    'Family & People': { category: 'vocabulary', topic: 'people', icon: '👨‍👩‍👧‍👦' },
    'Everyday Objects': { category: 'vocabulary', topic: 'objects', icon: '🏠' },
    'Food & Drink Basics': { category: 'vocabulary', topic: 'food', icon: '🍽️' },
    'Time & Calendar': { category: 'vocabulary', topic: 'time', icon: '📅' },
    'Places & Locations': { category: 'vocabulary', topic: 'places', icon: '🗺️' },
    'Activities & Verbs': { category: 'grammar', topic: 'verbs', icon: '🏃' },
    'Adjectives & Descriptions': { category: 'grammar', topic: 'adjectives', icon: '🎨' },
    'Shopping & Money': { category: 'vocabulary', topic: 'shopping', icon: '💰' },
    'Transport': { category: 'vocabulary', topic: 'transport', icon: '🚗' },
    'Body & Health': { category: 'vocabulary', topic: 'health', icon: '🏥' },
    'Hobbies & Free Time': { category: 'vocabulary', topic: 'hobbies', icon: '⚽' }
};

async function createThematicCollections() {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        console.log('📚 Creating German A1 thematic word collections...\n');

        // Parse vocabulary file
        const vocabFilePath = path.join(__dirname, '..', 'docs', 'german-a1-vocabulary.md');
        console.log(`Reading vocabulary from: ${vocabFilePath}`);
        const sets = parseVocabularyFile(vocabFilePath);
        console.log(`✓ Parsed ${sets.length} word sets\n`);

        let totalCollections = 0;
        let totalWords = 0;

        // Create a collection for each set
        for (const set of sets) {
            const metadata = setMetadata[set.name] || { category: 'vocabulary', topic: 'general', icon: '📖' };
            const collectionName = `German A1: ${set.name}`;
            const description = `${set.words.length} essential German words for A1 level - ${set.name} theme`;

            console.log(`\n[${totalCollections + 1}/${sets.length}] Creating: ${collectionName}`);

            // Check if collection already exists
            let collectionResult = await client.query(
                `SELECT id FROM global_word_collections WHERE name = $1 AND from_lang = $2 AND to_lang = $3`,
                [collectionName, 'de', 'ru']
            );

            let collectionId;

            if (collectionResult.rows.length > 0) {
                console.log('  Collection already exists, updating...');
                collectionId = collectionResult.rows[0].id;
                await client.query(
                    `UPDATE global_word_collections
                     SET description = $1, category = $2, difficulty_level = $3, word_count = $4
                     WHERE id = $5`,
                    [description, metadata.category, 'A1', set.words.length, collectionId]
                );
            } else {
                collectionResult = await client.query(
                    `INSERT INTO global_word_collections (name, from_lang, to_lang, description, category, difficulty_level, word_count, is_public, topic)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING id`,
                    [collectionName, 'de', 'ru', description, metadata.category, 'A1', set.words.length, true, metadata.topic]
                );
                collectionId = collectionResult.rows[0].id;
            }

            console.log(`  ✓ Collection ID: ${collectionId}`);

            // Import words for this set
            let wordsImported = 0;
            for (const wordData of set.words) {
                try {
                    // Check if word already exists
                    const existingWord = await client.query(
                        `SELECT id FROM global_collection_words WHERE collection_id = $1 AND word = $2`,
                        [collectionId, wordData.word]
                    );

                    if (existingWord.rows.length > 0) {
                        // Update existing word
                        await client.query(
                            `UPDATE global_collection_words
                             SET translation = $1, example = $2, exampleTranslation = $3
                             WHERE id = $4`,
                            [wordData.translation, wordData.example, wordData.notes, existingWord.rows[0].id]
                        );
                    } else {
                        // Insert new word
                        await client.query(
                            `INSERT INTO global_collection_words
                             (collection_id, word, translation, example, exampleTranslation)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [collectionId, wordData.word, wordData.translation, wordData.example, wordData.notes]
                        );
                    }
                    wordsImported++;
                } catch (error) {
                    console.error(`  ⚠️  Failed to import word "${wordData.word}":`, error.message);
                }
            }

            console.log(`  ✓ ${wordsImported} words imported`);
            totalCollections++;
            totalWords += wordsImported;
        }

        await client.query('COMMIT');

        console.log(`\n${'='.repeat(60)}`);
        console.log('✅ Thematic collections created successfully!');
        console.log(`${'='.repeat(60)}`);
        console.log(`Total collections: ${totalCollections}`);
        console.log(`Total words: ${totalWords}`);
        console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Import failed:', error);
        throw error;
    } finally {
        client.release();
        await db.end();
    }
}

// Run the import
if (require.main === module) {
    createThematicCollections()
        .then(() => {
            console.log('🎉 German A1 thematic collections are ready!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Import failed:', error.message);
            process.exit(1);
        });
}

module.exports = { createThematicCollections };
