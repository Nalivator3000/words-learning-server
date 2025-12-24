const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Parse the markdown vocabulary file and extract word data
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

                // Determine category from subcategory name
                let category = 'general';
                let subcat = currentSubcategory || '';

                if (currentSet.name.includes('First Words')) {
                    if (subcat.includes('Pronoun')) category = 'pronouns';
                    else if (subcat.includes('Greet')) category = 'greetings';
                    else if (subcat.includes('Question')) category = 'questions';
                    else if (subcat.includes('Number')) category = 'numbers';
                    else category = 'basics';
                } else if (currentSet.name.includes('Family')) {
                    category = 'family';
                    if (subcat.includes('Profession')) category = 'professions';
                    else if (subcat.includes('People')) category = 'people';
                } else if (currentSet.name.includes('Everyday Objects')) {
                    category = 'objects';
                    if (subcat.includes('House')) category = 'home';
                    else if (subcat.includes('Clothing')) category = 'clothing';
                    else if (subcat.includes('School')) category = 'school';
                } else if (currentSet.name.includes('Food')) {
                    category = 'food';
                    if (subcat.includes('Drink')) category = 'drinks';
                } else if (currentSet.name.includes('Time')) {
                    category = 'time';
                } else if (currentSet.name.includes('Places')) {
                    category = 'places';
                    if (subcat.includes('Direction')) category = 'directions';
                } else if (currentSet.name.includes('Verb') || currentSet.name.includes('Activities')) {
                    category = 'verbs';
                } else if (currentSet.name.includes('Adjective')) {
                    category = 'adjectives';
                } else if (currentSet.name.includes('Shopping')) {
                    category = 'shopping';
                    if (subcat.includes('Quantit')) category = 'quantities';
                } else if (currentSet.name.includes('Transport')) {
                    category = 'transport';
                } else if (currentSet.name.includes('Body') || currentSet.name.includes('Health')) {
                    category = 'body';
                    if (subcat.includes('Health')) category = 'health';
                } else if (currentSet.name.includes('Hobbies') || currentSet.name.includes('Free Time')) {
                    category = 'hobbies';
                }

                currentSet.words.push({
                    word,
                    translation,
                    example,
                    notes,
                    category,
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

async function importGermanA1() {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        console.log('📚 Starting German A1 vocabulary import...\n');

        // Create the collection
        console.log('Creating collection: German A1 Complete');

        // Check if collection already exists
        let collectionResult = await client.query(
            `SELECT id FROM global_word_collections WHERE name = $1 AND from_lang = $2 AND to_lang = $3`,
            ['German A1 Complete', 'de', 'en']
        );

        if (collectionResult.rows.length > 0) {
            console.log('Collection already exists, updating...');
            await client.query(
                `UPDATE global_word_collections
                 SET description = $1, category = $2, difficulty_level = $3
                 WHERE id = $4`,
                [
                    'Complete A1 level German vocabulary (~500 words) organized by theme',
                    'beginner',
                    'A1',
                    collectionResult.rows[0].id
                ]
            );
        } else {
            collectionResult = await client.query(
                `INSERT INTO global_word_collections (name, from_lang, to_lang, description, category, difficulty_level, is_public)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [
                    'German A1 Complete',
                    'de',  // from_lang (German)
                    'en',  // to_lang (English)
                    'Complete A1 level German vocabulary (~500 words) organized by theme',
                    'beginner',
                    'A1',
                    true   // is_public
                ]
            );
        }

        const collectionId = collectionResult.rows[0].id;
        console.log(`✓ Collection created with ID: ${collectionId}\n`);

        // Parse vocabulary file
        const vocabFilePath = path.join(__dirname, '..', 'docs', 'german-a1-vocabulary.md');
        console.log(`Reading vocabulary from: ${vocabFilePath}`);
        const sets = parseVocabularyFile(vocabFilePath);
        console.log(`✓ Parsed ${sets.length} word sets\n`);

        let totalWordsImported = 0;
        let setCount = 0;

        // Import words from each set
        for (const set of sets) {
            setCount++;
            console.log(`[${setCount}/${sets.length}] Importing: ${set.name} (${set.words.length} words)`);

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
                            [
                                wordData.translation,
                                wordData.example,
                                wordData.notes,
                                existingWord.rows[0].id
                            ]
                        );
                    } else {
                        // Insert new word
                        await client.query(
                            `INSERT INTO global_collection_words
                             (collection_id, word, translation, example, exampleTranslation)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [
                                collectionId,
                                wordData.word,
                                wordData.translation,
                                wordData.example,
                                wordData.notes
                            ]
                        );
                    }
                    totalWordsImported++;
                } catch (error) {
                    console.error(`  ⚠️  Failed to import word "${wordData.word}":`, error.message);
                }
            }

            console.log(`  ✓ ${set.words.length} words imported`);
        }

        await client.query('COMMIT');

        console.log(`\n${'='.repeat(60)}`);
        console.log('✅ Import completed successfully!');
        console.log(`${'='.repeat(60)}`);
        console.log(`Collection: German A1 Complete`);
        console.log(`Total words imported: ${totalWordsImported}`);
        console.log(`Total sets: ${sets.length}`);
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
    importGermanA1()
        .then(() => {
            console.log('🎉 German A1 vocabulary is ready to use in LexyBooster!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Import failed:', error.message);
            process.exit(1);
        });
}

module.exports = { importGermanA1, parseVocabularyFile };
