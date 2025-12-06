/**
 * Populate CEFR-Based Word Sets
 * Phase 3.1: Create level-based word sets (A1-C2)
 *
 * This script creates official word sets for each CEFR level with
 * curated vocabulary appropriate for that proficiency level.
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'words_learning',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

// CEFR Level Definitions
const CEFR_LEVELS = {
    'A1': {
        name: 'CEFR A1: Beginner',
        description: 'Basic words and expressions for everyday situations. Essential vocabulary for absolute beginners.',
        wordTarget: 500
    },
    'A2': {
        name: 'CEFR A2: Elementary',
        description: 'Expanded vocabulary for routine tasks and simple social interactions. Build on A1 foundations.',
        wordTarget: 1000
    },
    'B1': {
        name: 'CEFR B1: Intermediate',
        description: 'Vocabulary for familiar topics like work, school, leisure. Express opinions and describe experiences.',
        wordTarget: 1500
    },
    'B2': {
        name: 'CEFR B2: Upper-Intermediate',
        description: 'Sophisticated vocabulary for complex texts and abstract topics. Discuss specialized subjects.',
        wordTarget: 2000
    },
    'C1': {
        name: 'CEFR C1: Advanced',
        description: 'Advanced vocabulary for nuanced expression. Understand implicit meaning and varied contexts.',
        wordTarget: 2500
    },
    'C2': {
        name: 'CEFR C2: Proficient',
        description: 'Near-native vocabulary mastery. Express yourself spontaneously and precisely in complex situations.',
        wordTarget: 3000
    }
};

// Sample word sets for de-en (German-English)
// In production, these would be imported from comprehensive word lists
const SAMPLE_WORDS = {
    'A1': [
        // Basic greetings, numbers, colors, family
        { word: 'Hallo', translation: 'Hello', example: 'Hallo, wie geht es dir?', exampleTranslation: 'Hello, how are you?' },
        { word: 'Tschüss', translation: 'Goodbye', example: 'Tschüss, bis morgen!', exampleTranslation: 'Goodbye, see you tomorrow!' },
        { word: 'Danke', translation: 'Thank you', example: 'Danke für deine Hilfe!', exampleTranslation: 'Thank you for your help!' },
        { word: 'Bitte', translation: 'Please / You\'re welcome', example: 'Bitte schön!', exampleTranslation: 'You\'re welcome!' },
        { word: 'ja', translation: 'yes', example: 'Ja, das stimmt.', exampleTranslation: 'Yes, that\'s correct.' },
        { word: 'nein', translation: 'no', example: 'Nein, ich möchte nicht.', exampleTranslation: 'No, I don\'t want to.' },
        { word: 'ich', translation: 'I', example: 'Ich bin müde.', exampleTranslation: 'I am tired.' },
        { word: 'du', translation: 'you', example: 'Du bist mein Freund.', exampleTranslation: 'You are my friend.' },
        { word: 'Wasser', translation: 'water', example: 'Ich trinke Wasser.', exampleTranslation: 'I drink water.' },
        { word: 'Haus', translation: 'house', example: 'Das ist mein Haus.', exampleTranslation: 'This is my house.' },
    ],
    'A2': [
        // Everyday activities, simple past tense
        { word: 'arbeiten', translation: 'to work', example: 'Ich arbeite jeden Tag.', exampleTranslation: 'I work every day.' },
        { word: 'schlafen', translation: 'to sleep', example: 'Ich schlafe 8 Stunden.', exampleTranslation: 'I sleep 8 hours.' },
        { word: 'essen', translation: 'to eat', example: 'Wir essen zusammen.', exampleTranslation: 'We eat together.' },
        { word: 'gestern', translation: 'yesterday', example: 'Gestern war Sonntag.', exampleTranslation: 'Yesterday was Sunday.' },
        { word: 'heute', translation: 'today', example: 'Heute ist Montag.', exampleTranslation: 'Today is Monday.' },
        { word: 'morgen', translation: 'tomorrow', example: 'Morgen gehe ich einkaufen.', exampleTranslation: 'Tomorrow I go shopping.' },
        { word: 'Wetter', translation: 'weather', example: 'Das Wetter ist schön.', exampleTranslation: 'The weather is nice.' },
        { word: 'kalt', translation: 'cold', example: 'Es ist sehr kalt.', exampleTranslation: 'It is very cold.' },
        { word: 'warm', translation: 'warm', example: 'Der Kaffee ist warm.', exampleTranslation: 'The coffee is warm.' },
        { word: 'Freund', translation: 'friend', example: 'Er ist mein bester Freund.', exampleTranslation: 'He is my best friend.' },
    ],
    'B1': [
        // Work, school, hobbies, opinions
        { word: 'meinen', translation: 'to think/mean', example: 'Ich meine, das ist richtig.', exampleTranslation: 'I think that\'s correct.' },
        { word: 'glauben', translation: 'to believe', example: 'Ich glaube an dich.', exampleTranslation: 'I believe in you.' },
        { word: 'Meinung', translation: 'opinion', example: 'Was ist deine Meinung?', exampleTranslation: 'What is your opinion?' },
        { word: 'entscheiden', translation: 'to decide', example: 'Ich muss mich entscheiden.', exampleTranslation: 'I have to decide.' },
        { word: 'Erfahrung', translation: 'experience', example: 'Ich habe viel Erfahrung.', exampleTranslation: 'I have a lot of experience.' },
        { word: 'Ausbildung', translation: 'education/training', example: 'Meine Ausbildung dauerte 3 Jahre.', exampleTranslation: 'My training lasted 3 years.' },
        { word: 'Umwelt', translation: 'environment', example: 'Wir müssen die Umwelt schützen.', exampleTranslation: 'We must protect the environment.' },
        { word: 'obwohl', translation: 'although', example: 'Ich gehe, obwohl es regnet.', exampleTranslation: 'I\'m going although it\'s raining.' },
        { word: 'trotzdem', translation: 'nevertheless', example: 'Es ist kalt, trotzdem gehe ich raus.', exampleTranslation: 'It\'s cold, nevertheless I go out.' },
        { word: 'während', translation: 'while/during', example: 'Ich lese während der Fahrt.', exampleTranslation: 'I read during the ride.' },
    ],
    'B2': [
        // Abstract topics, complex ideas
        { word: 'Zusammenhang', translation: 'context/connection', example: 'Es gibt einen klaren Zusammenhang.', exampleTranslation: 'There is a clear connection.' },
        { word: 'Voraussetzung', translation: 'prerequisite/condition', example: 'Das ist eine wichtige Voraussetzung.', exampleTranslation: 'That is an important prerequisite.' },
        { word: 'berücksichtigen', translation: 'to consider/take into account', example: 'Wir müssen alle Fakten berücksichtigen.', exampleTranslation: 'We must consider all facts.' },
        { word: 'angemessen', translation: 'appropriate/adequate', example: 'Die Antwort war angemessen.', exampleTranslation: 'The answer was appropriate.' },
        { word: 'erheblich', translation: 'considerable/significant', example: 'Es gab erhebliche Fortschritte.', exampleTranslation: 'There was considerable progress.' },
        { word: 'Auswirkung', translation: 'impact/effect', example: 'Die Auswirkungen sind groß.', exampleTranslation: 'The impacts are significant.' },
        { word: 'beurteilen', translation: 'to assess/judge', example: 'Ich kann die Situation nicht beurteilen.', exampleTranslation: 'I cannot assess the situation.' },
        { word: 'Standpunkt', translation: 'point of view', example: 'Aus meinem Standpunkt ist das falsch.', exampleTranslation: 'From my point of view, that\'s wrong.' },
        { word: 'ausschließlich', translation: 'exclusively/solely', example: 'Das gilt ausschließlich für Mitglieder.', exampleTranslation: 'This applies exclusively to members.' },
        { word: 'hingegen', translation: 'on the other hand', example: 'Er ist fleißig, sie hingegen ist faul.', exampleTranslation: 'He is hardworking, she on the other hand is lazy.' },
    ],
    'C1': [
        // Nuanced expression, idiomatic language
        { word: 'umgangssprachlich', translation: 'colloquial', example: 'Das ist ein umgangssprachlicher Ausdruck.', exampleTranslation: 'That is a colloquial expression.' },
        { word: 'subtil', translation: 'subtle', example: 'Der Unterschied ist sehr subtil.', exampleTranslation: 'The difference is very subtle.' },
        { word: 'implizieren', translation: 'to imply', example: 'Was implizieren Sie damit?', exampleTranslation: 'What are you implying with that?' },
        { word: 'Fachjargon', translation: 'technical jargon', example: 'Er benutzt zu viel Fachjargon.', exampleTranslation: 'He uses too much technical jargon.' },
        { word: 'vieldeutig', translation: 'ambiguous', example: 'Die Aussage ist vieldeutig.', exampleTranslation: 'The statement is ambiguous.' },
        { word: 'Kontext', translation: 'context', example: 'Man muss den Kontext berücksichtigen.', exampleTranslation: 'One must consider the context.' },
        { word: 'differenzieren', translation: 'to differentiate', example: 'Man muss hier differenzieren.', exampleTranslation: 'One must differentiate here.' },
        { word: 'Dilemma', translation: 'dilemma', example: 'Wir stehen vor einem Dilemma.', exampleTranslation: 'We face a dilemma.' },
        { word: 'Paradoxon', translation: 'paradox', example: 'Das ist ein interessantes Paradoxon.', exampleTranslation: 'That is an interesting paradox.' },
        { word: 'Ironie', translation: 'irony', example: 'Er sprach mit offensichtlicher Ironie.', exampleTranslation: 'He spoke with obvious irony.' },
    ],
    'C2': [
        // Near-native mastery, specialized vocabulary
        { word: 'unabdingbar', translation: 'indispensable/essential', example: 'Diese Regel ist unabdingbar.', exampleTranslation: 'This rule is indispensable.' },
        { word: 'stringent', translation: 'stringent', example: 'Es gelten stringente Vorschriften.', exampleTranslation: 'Stringent regulations apply.' },
        { word: 'kongruent', translation: 'congruent', example: 'Die Aussagen sind nicht kongruent.', exampleTranslation: 'The statements are not congruent.' },
        { word: 'Anachronismus', translation: 'anachronism', example: 'Das ist ein historischer Anachronismus.', exampleTranslation: 'That is a historical anachronism.' },
        { word: 'Epitheton', translation: 'epithet', example: 'Er verwendete ein schmückendes Epitheton.', exampleTranslation: 'He used a decorative epithet.' },
        { word: 'pejorative', translation: 'pejorative', example: 'Das ist eine pejorative Bezeichnung.', exampleTranslation: 'That is a pejorative term.' },
        { word: 'Ambivalenz', translation: 'ambivalence', example: 'Seine Ambivalenz war offensichtlich.', exampleTranslation: 'His ambivalence was obvious.' },
        { word: 'intrinsisch', translation: 'intrinsic', example: 'Das hat einen intrinsischen Wert.', exampleTranslation: 'That has intrinsic value.' },
        { word: 'Prärogative', translation: 'prerogative', example: 'Das ist seine Prärogative.', exampleTranslation: 'That is his prerogative.' },
        { word: 'ubiquitär', translation: 'ubiquitous', example: 'Smartphones sind ubiquitär geworden.', exampleTranslation: 'Smartphones have become ubiquitous.' },
    ]
};

async function populateWordSets() {
    const client = await db.connect();

    try {
        console.log('🚀 Starting CEFR word sets population...\n');

        await client.query('BEGIN');

        // Language pair: de-en (German-English)
        const languagePair = 'de-en';

        for (const [level, config] of Object.entries(CEFR_LEVELS)) {
            console.log(`📚 Creating word set for ${level}: ${config.name}...`);

            // Create word set
            const setResult = await client.query(`
                INSERT INTO word_sets (name, description, language_pair, level, is_official)
                VALUES ($1, $2, $3, $4, true)
                RETURNING id
            `, [config.name, config.description, languagePair, level]);

            const setId = setResult.rows[0].id;
            console.log(`   ✓ Created word set ID: ${setId}`);

            // Add sample words for this level
            const words = SAMPLE_WORDS[level] || [];
            let addedCount = 0;

            for (let i = 0; i < words.length; i++) {
                const wordData = words[i];

                // Check if word already exists (from default word lists)
                let wordResult = await client.query(
                    'SELECT id FROM words WHERE word = $1 AND language_pair_id IS NULL LIMIT 1',
                    [wordData.word]
                );

                let wordId;
                if (wordResult.rows.length > 0) {
                    wordId = wordResult.rows[0].id;
                } else {
                    // Create word as template (no user_id, no language_pair_id)
                    const newWordResult = await client.query(`
                        INSERT INTO words (word, translation, example, exampleTranslation, user_id, language_pair_id, source)
                        VALUES ($1, $2, $3, $4, NULL, NULL, $5)
                        RETURNING id
                    `, [
                        wordData.word,
                        wordData.translation,
                        wordData.example || '',
                        wordData.exampleTranslation || '',
                        `cefr_${level}`
                    ]);
                    wordId = newWordResult.rows[0].id;
                }

                // Add to word set
                await client.query(`
                    INSERT INTO word_set_items (word_set_id, word_id, order_index)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (word_set_id, word_id) DO NOTHING
                `, [setId, wordId, i]);

                addedCount++;
            }

            // Update word count
            await client.query(
                'UPDATE word_sets SET word_count = $1 WHERE id = $2',
                [addedCount, setId]
            );

            console.log(`   ✓ Added ${addedCount} words to ${level} word set\n`);
        }

        await client.query('COMMIT');

        console.log('✅ CEFR word sets population complete!\n');
        console.log('📊 Summary:');
        console.log(`   Language Pair: ${languagePair}`);
        console.log(`   Levels Created: ${Object.keys(CEFR_LEVELS).length}`);
        console.log(`   Total Sample Words: ${Object.values(SAMPLE_WORDS).flat().length}`);
        console.log('\n💡 Note: These are sample word sets. In production, import comprehensive');
        console.log('   word lists from sources like:');
        console.log('   - Frequency dictionaries');
        console.log('   - CEFR-aligned textbooks');
        console.log('   - Language learning platforms (Anki, Memrise)');
        console.log('   - Open Educational Resources (OER)\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error populating word sets:', error);
        throw error;
    } finally {
        client.release();
        await db.end();
    }
}

// Run the script
populateWordSets()
    .then(() => {
        console.log('🎉 Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
