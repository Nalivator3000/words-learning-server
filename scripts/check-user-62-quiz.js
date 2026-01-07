const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking User 62 Quiz Data for Language Issues\n');

// Get user info
db.get(`
    SELECT u.*, lp.from_language, lp.to_language, lp.name as pair_name
    FROM users u
    JOIN language_pairs lp ON u.current_language_pair_id = lp.id
    WHERE u.id = 62
`, (err, user) => {
    if (err) {
        console.error('❌ Error getting user:', err);
        db.close();
        return;
    }

    console.log('👤 User Info:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Language Pair: ${user.pair_name} (${user.from_language} → ${user.to_language})`);
    console.log();

    // Get all words for this user
    db.all(`
        SELECT
            w.id,
            w.word,
            w.translation,
            w.learning_language,
            w.known_language,
            w.status,
            w.last_review,
            w.next_review
        FROM words w
        WHERE w.user_id = 62
        ORDER BY w.id
    `, (err, words) => {
        if (err) {
            console.error('❌ Error getting words:', err);
            db.close();
            return;
        }

        console.log(`📚 Total words for user 62: ${words.length}\n`);

        // Check for language mismatches
        const mismatches = words.filter(w => {
            const wordLangMatch = w.learning_language === user.to_language;
            const transLangMatch = w.known_language === user.from_language;
            return !wordLangMatch || !transLangMatch;
        });

        if (mismatches.length > 0) {
            console.log(`⚠️  Found ${mismatches.length} words with LANGUAGE MISMATCH:\n`);
            mismatches.forEach(w => {
                console.log(`   Word ID ${w.id}:`);
                console.log(`   - Word: "${w.word}" (lang: ${w.learning_language}, expected: ${user.to_language})`);
                console.log(`   - Translation: "${w.translation}" (lang: ${w.known_language}, expected: ${user.from_language})`);
                console.log(`   - Status: ${w.status}`);

                if (w.learning_language !== user.to_language) {
                    console.log(`   ❌ WRONG: word language is ${w.learning_language}, should be ${user.to_language}`);
                }
                if (w.known_language !== user.from_language) {
                    console.log(`   ❌ WRONG: translation language is ${w.known_language}, should be ${user.from_language}`);
                }
                console.log();
            });
        } else {
            console.log('✅ All words have correct language codes\n');
        }

        // Check for words that might be "родное" or in Russian
        const russianWords = words.filter(w =>
            w.word.match(/[а-яА-ЯёЁ]/) || w.translation.match(/[а-яА-ЯёЁ]/)
        );

        if (russianWords.length > 0) {
            console.log(`🔍 Found ${russianWords.length} words containing Cyrillic characters:\n`);
            russianWords.forEach(w => {
                console.log(`   Word ID ${w.id}:`);
                console.log(`   - Word: "${w.word}" (lang: ${w.learning_language})`);
                console.log(`   - Translation: "${w.translation}" (lang: ${w.known_language})`);
                console.log(`   - Status: ${w.status}`);
                console.log();
            });
        }

        // Check word set memberships for problematic words
        if (mismatches.length > 0 || russianWords.length > 0) {
            const problemWordIds = [...new Set([...mismatches, ...russianWords].map(w => w.id))];

            if (problemWordIds.length > 0) {
                const placeholders = problemWordIds.map(() => '?').join(',');
                db.all(`
                    SELECT
                        wsw.word_id,
                        ws.id as set_id,
                        ws.title,
                        ws.source_language,
                        ws.target_language
                    FROM word_set_words wsw
                    JOIN word_sets ws ON wsw.word_set_id = ws.id
                    WHERE wsw.word_id IN (${placeholders})
                `, problemWordIds, (err, setMemberships) => {
                    if (err) {
                        console.error('❌ Error getting word set memberships:', err);
                    } else if (setMemberships.length > 0) {
                        console.log('📋 Word Set Memberships for problematic words:\n');
                        setMemberships.forEach(m => {
                            console.log(`   Word ID ${m.word_id} is in set "${m.title}"`);
                            console.log(`   - Set languages: ${m.source_language} → ${m.target_language}`);
                            console.log();
                        });
                    }

                    checkQuizBehavior(user);
                });
            } else {
                checkQuizBehavior(user);
            }
        } else {
            checkQuizBehavior(user);
        }
    });
});

function checkQuizBehavior(user) {
    console.log('\n🎯 Simulating Quiz Word Selection:\n');

    // Simulate the quiz query
    db.all(`
        SELECT
            w.id,
            w.word,
            w.translation,
            w.learning_language,
            w.known_language,
            w.status,
            w.next_review
        FROM words w
        WHERE w.user_id = 62
        AND w.status IN ('new', 'studying')
        ORDER BY w.next_review ASC
        LIMIT 10
    `, (err, quizWords) => {
        if (err) {
            console.error('❌ Error simulating quiz:', err);
            db.close();
            return;
        }

        console.log(`Found ${quizWords.length} words that would appear in quiz:\n`);

        quizWords.forEach((w, index) => {
            console.log(`${index + 1}. Word ID ${w.id}:`);
            console.log(`   - Word: "${w.word}" (${w.learning_language})`);
            console.log(`   - Translation: "${w.translation}" (${w.known_language})`);
            console.log(`   - Status: ${w.status}`);
            console.log(`   - Next review: ${w.next_review || 'null'}`);

            // Check if languages match expected
            if (w.learning_language !== user.to_language || w.known_language !== user.from_language) {
                console.log(`   ⚠️  LANGUAGE MISMATCH! Expected ${user.to_language}/${user.from_language}, got ${w.learning_language}/${w.known_language}`);
            }
            console.log();
        });

        db.close();
        console.log('✅ Analysis complete');
    });
}
