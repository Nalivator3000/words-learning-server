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

        // Detect set headers (### 1. First Words or ## 1. First Words)
        if (line.match(/^##+\s+\d+\.\s+(.+?)\s+\((\d+)\s+words?\)/)) {
            if (currentSet) {
                sets.push(currentSet);
            }
            const match = line.match(/^##+\s+\d+\.\s+(.+?)\s+\((\d+)\s+words?\)/);
            currentSet = {
                name: match[1],
                expectedCount: match[2] ? parseInt(match[2]) : 0,
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
const getCategoryMetadata = (setName, level) => {
    const lowerName = setName.toLowerCase();

    // Determine category based on keywords
    if (lowerName.includes('family') || lowerName.includes('people') || lowerName.includes('relationship')) {
        return { category: 'vocabulary', topic: 'people' };
    } else if (lowerName.includes('food') || lowerName.includes('drink') || lowerName.includes('cooking')) {
        return { category: 'vocabulary', topic: 'food' };
    } else if (lowerName.includes('time') || lowerName.includes('calendar') || lowerName.includes('date')) {
        return { category: 'vocabulary', topic: 'time' };
    } else if (lowerName.includes('place') || lowerName.includes('location') || lowerName.includes('direction')) {
        return { category: 'vocabulary', topic: 'places' };
    } else if (lowerName.includes('verb') || lowerName.includes('activit')) {
        return { category: 'grammar', topic: 'verbs' };
    } else if (lowerName.includes('adjective') || lowerName.includes('description')) {
        return { category: 'grammar', topic: 'adjectives' };
    } else if (lowerName.includes('shopping') || lowerName.includes('money')) {
        return { category: 'vocabulary', topic: 'shopping' };
    } else if (lowerName.includes('transport') || lowerName.includes('travel')) {
        return { category: 'vocabulary', topic: 'transport' };
    } else if (lowerName.includes('body') || lowerName.includes('health') || lowerName.includes('medical')) {
        return { category: 'vocabulary', topic: 'health' };
    } else if (lowerName.includes('hobbies') || lowerName.includes('free time') || lowerName.includes('leisure')) {
        return { category: 'vocabulary', topic: 'hobbies' };
    } else if (lowerName.includes('work') || lowerName.includes('profession') || lowerName.includes('job')) {
        return { category: 'vocabulary', topic: 'work' };
    } else if (lowerName.includes('education') || lowerName.includes('school') || lowerName.includes('learning')) {
        return { category: 'vocabulary', topic: 'education' };
    } else if (lowerName.includes('house') || lowerName.includes('housing') || lowerName.includes('furniture')) {
        return { category: 'vocabulary', topic: 'housing' };
    } else if (lowerName.includes('weather') || lowerName.includes('season') || lowerName.includes('climate')) {
        return { category: 'vocabulary', topic: 'weather' };
    } else if (lowerName.includes('feeling') || lowerName.includes('emotion')) {
        return { category: 'vocabulary', topic: 'emotions' };
    } else if (lowerName.includes('communication') || lowerName.includes('media')) {
        return { category: 'vocabulary', topic: 'communication' };
    } else if (lowerName.includes('first') || lowerName.includes('basic') || lowerName.includes('greeting')) {
        return { category: 'basics', topic: 'fundamentals' };
    } else if (lowerName.includes('object') || lowerName.includes('everyday')) {
        return { category: 'vocabulary', topic: 'objects' };
    } else {
        return { category: 'vocabulary', topic: 'general' };
    }
};

async function importGermanLevel(level, createThematic = true) {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const levelUpper = level.toUpperCase();
        console.log(`📚 Starting German ${levelUpper} vocabulary import...\n`);

        // Parse vocabulary file
        const vocabFilePath = path.join(__dirname, '..', 'docs', `german-${level.toLowerCase()}-vocabulary.md`);

        if (!fs.existsSync(vocabFilePath)) {
            throw new Error(`Vocabulary file not found: ${vocabFilePath}`);
        }

        console.log(`Reading vocabulary from: ${vocabFilePath}`);
        const sets = parseVocabularyFile(vocabFilePath);
        console.log(`✓ Parsed ${sets.length} word sets\n`);

        let totalWordsImported = 0;
        let totalCollections = 0;

        if (createThematic) {
            // Create individual thematic collections
            for (const set of sets) {
                const metadata = getCategoryMetadata(set.name, level);
                const collectionName = `German ${levelUpper}: ${set.name}`;
                const description = `${set.words.length} essential German words for ${levelUpper} level - ${set.name} theme`;

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
                         SET description = $1, category = $2, difficulty_level = $3, word_count = $4, topic = $5
                         WHERE id = $6`,
                        [description, metadata.category, levelUpper, set.words.length, metadata.topic, collectionId]
                    );
                } else {
                    collectionResult = await client.query(
                        `INSERT INTO global_word_collections (name, from_lang, to_lang, description, category, difficulty_level, word_count, is_public, topic)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                         RETURNING id`,
                        [collectionName, 'de', 'ru', description, metadata.category, levelUpper, set.words.length, true, metadata.topic]
                    );
                    collectionId = collectionResult.rows[0].id;
                }

                console.log(`  ✓ Collection ID: ${collectionId}`);

                // Import words for this set
                let wordsImported = 0;
                for (const wordData of set.words) {
                    try {
                        const existingWord = await client.query(
                            `SELECT id FROM global_collection_words WHERE collection_id = $1 AND word = $2`,
                            [collectionId, wordData.word]
                        );

                        if (existingWord.rows.length > 0) {
                            await client.query(
                                `UPDATE global_collection_words
                                 SET translation = $1, example = $2, exampleTranslation = $3
                                 WHERE id = $4`,
                                [wordData.translation, wordData.example, wordData.notes, existingWord.rows[0].id]
                            );
                        } else {
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
                totalWordsImported += wordsImported;
            }
        }

        await client.query('COMMIT');

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ German ${levelUpper} import completed successfully!`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Total collections: ${totalCollections}`);
        console.log(`Total words: ${totalWordsImported}`);
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
    const level = process.argv[2] || 'A1';
    const createThematic = process.argv[3] !== 'false';

    importGermanLevel(level, createThematic)
        .then(() => {
            console.log(`🎉 German ${level.toUpperCase()} collections are ready!`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Import failed:', error.message);
            process.exit(1);
        });
}

module.exports = { importGermanLevel, parseVocabularyFile };
