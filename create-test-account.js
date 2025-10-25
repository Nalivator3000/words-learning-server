/**
 * Create test account with realistic data for screenshots
 * This script connects to Railway PostgreSQL and creates demo@fluentflow.app
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Simple password hash (matches server logic)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function createTestAccount() {
    const client = await pool.connect();

    try {
        console.log('🔌 Connected to Railway PostgreSQL');

        // 1. Check if user exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            ['demo@fluentflow.app']
        );

        let userId;

        if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id;
            console.log('✅ User already exists, ID:', userId);
        } else {
            // 2. Create user
            const hashedPassword = hashPassword('DemoPassword123!');
            const userResult = await client.query(
                `INSERT INTO users (name, email, password, provider, createdat, updatedat)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id`,
                ['Demo User', 'demo@fluentflow.app', hashedPassword, 'local']
            );
            userId = userResult.rows[0].id;
            console.log('✅ Created user, ID:', userId);
        }

        // 3. Create default language pair (German-English)
        let languagePairId;
        const existingPair = await client.query(
            'SELECT id FROM language_pairs WHERE user_id = $1 LIMIT 1',
            [userId]
        );

        if (existingPair.rows.length > 0) {
            languagePairId = existingPair.rows[0].id;
            console.log('✅ Language pair exists, ID:', languagePairId);
        } else {
            const pairResult = await client.query(
                `INSERT INTO language_pairs (user_id, name, from_lang, to_lang, is_active, createdat, updatedat)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING id`,
                [userId, 'German → English', 'de', 'en', true]
            );
            languagePairId = pairResult.rows[0].id;
            console.log('✅ Created language pair, ID:', languagePairId);
        }

        // 4. Check if words already exist
        const existingWords = await client.query(
            'SELECT COUNT(*) as count FROM words WHERE user_id = $1',
            [userId]
        );

        if (existingWords.rows[0].count > 0) {
            console.log(`✅ User already has ${existingWords.rows[0].count} words`);
        } else {
            // 5. Insert 50 German words
            const words = [
                ['der Apfel', 'apple', 'Ich esse einen Apfel'],
                ['das Buch', 'book', 'Ich lese ein interessantes Buch'],
                ['die Katze', 'cat', 'Die Katze ist sehr süß'],
                ['der Hund', 'dog', 'Der Hund bellt laut'],
                ['das Haus', 'house', 'Das Haus ist sehr groß'],
                ['die Schule', 'school', 'Ich gehe jeden Tag zur Schule'],
                ['der Freund', 'friend', 'Mein bester Freund heißt Max'],
                ['die Familie', 'family', 'Meine Familie ist mir wichtig'],
                ['das Wasser', 'water', 'Ich trinke viel Wasser'],
                ['das Essen', 'food', 'Das Essen schmeckt sehr gut'],
                ['die Zeit', 'time', 'Die Zeit vergeht schnell'],
                ['der Tag', 'day', 'Heute ist ein schöner Tag'],
                ['die Nacht', 'night', 'Die Nacht ist dunkel'],
                ['das Jahr', 'year', 'Dieses Jahr ist toll'],
                ['der Monat', 'month', 'Nächster Monat ist Juli'],
                ['die Woche', 'week', 'Diese Woche arbeite ich viel'],
                ['der Lehrer', 'teacher', 'Der Lehrer erklärt die Lektion'],
                ['der Student', 'student', 'Der Student lernt fleißig'],
                ['die Arbeit', 'work', 'Die Arbeit macht Spaß'],
                ['das Auto', 'car', 'Das Auto fährt schnell'],
                ['der Zug', 'train', 'Der Zug kommt pünktlich an'],
                ['das Flugzeug', 'airplane', 'Das Flugzeug fliegt sehr hoch'],
                ['die Stadt', 'city', 'Die Stadt ist sehr lebendig'],
                ['das Land', 'country', 'Deutschland ist ein schönes Land'],
                ['der Berg', 'mountain', 'Der Berg ist sehr hoch'],
                ['das Meer', 'sea', 'Das Meer ist blau und ruhig'],
                ['der Himmel', 'sky', 'Der Himmel ist heute klar'],
                ['die Sonne', 'sun', 'Die Sonne scheint hell'],
                ['der Mond', 'moon', 'Der Mond leuchtet nachts'],
                ['der Stern', 'star', 'Die Sterne funkeln am Himmel'],
                ['die Blume', 'flower', 'Die Blume duftet schön'],
                ['der Baum', 'tree', 'Der Baum ist sehr alt'],
                ['das Gras', 'grass', 'Das Gras ist grün'],
                ['die Farbe', 'color', 'Meine Lieblingsfarbe ist blau'],
                ['rot', 'red', 'Die Rose ist rot'],
                ['blau', 'blue', 'Der Himmel ist blau'],
                ['grün', 'green', 'Das Gras ist grün'],
                ['gelb', 'yellow', 'Die Sonne ist gelb'],
                ['schwarz', 'black', 'Die Nacht ist schwarz'],
                ['weiß', 'white', 'Der Schnee ist weiß'],
                ['groß', 'big', 'Das Haus ist sehr groß'],
                ['klein', 'small', 'Die Maus ist klein'],
                ['gut', 'good', 'Das Wetter ist heute gut'],
                ['schlecht', 'bad', 'Das Essen war schlecht'],
                ['schön', 'beautiful', 'Die Blume ist schön'],
                ['hässlich', 'ugly', 'Das Bild ist hässlich'],
                ['alt', 'old', 'Der Mann ist alt'],
                ['jung', 'young', 'Das Kind ist jung'],
                ['neu', 'new', 'Das Auto ist ganz neu'],
                ['schnell', 'fast', 'Der Zug fährt schnell']
            ];

            for (const [word, translation, example] of words) {
                await client.query(
                    `INSERT INTO words (user_id, language_pair_id, word, translation, example, status, correctcount, totalpoints, lastreviewdate, nextreviewdate, reviewcycle, createdat, updatedat)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NOW(), $9, NOW(), NOW())`,
                    [userId, languagePairId, word, translation, example, 'learning', 0, 0, 0]
                );
            }

            console.log('✅ Imported 50 German words');
        }

        // 6. Initialize user_stats if needed
        const existingStats = await client.query(
            'SELECT id FROM user_stats WHERE user_id = $1',
            [userId]
        );

        if (existingStats.rows.length === 0) {
            await client.query(
                `INSERT INTO user_stats (user_id, total_xp, level, current_streak, longest_streak, total_words_learned, total_quizzes_completed, coins, gems, createdat, updatedat)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
                [userId, 0, 1, 0, 0, 0, 0, 0, 0]
            );
            console.log('✅ Initialized user stats');
        }

        console.log('\n🎉 Test account ready!');
        console.log('📧 Email: demo@fluentflow.app');
        console.log('🔑 Password: DemoPassword123!');
        console.log('📚 Words: 50 German words imported');
        console.log('\n🔗 Login at: https://words-learning-server-copy-production.up.railway.app/');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createTestAccount().catch(console.error);
