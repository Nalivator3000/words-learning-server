// Fix word stages based on correctCount (points)
// SRS thresholds: 20 → 35 → 50 → 65 → 80 → 90 → 100
// Intervals: 1, 3, 7, 14, 30, 60, 120 days

const { Pool } = require('pg');

// Railway production database
const DATABASE_URL = 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const stageThresholds = [20, 35, 50, 65, 80, 90, 100];
const srsIntervals = [1, 3, 7, 14, 30, 60, 120];

async function fixWordStages() {
    const client = await pool.connect();

    try {
        // First check users
        console.log('\n👤 Users with words:\n');
        const usersResult = await client.query(`
            SELECT user_id, COUNT(*) as word_count
            FROM words
            GROUP BY user_id
            ORDER BY word_count DESC
        `);
        console.table(usersResult.rows);

        if (usersResult.rows.length === 0) {
            console.log('❌ No words found in database!');
            return;
        }

        // Get the main user (with most words)
        const mainUser = usersResult.rows[0].user_id;
        console.log(`\n🎯 Using user_id: ${mainUser}\n`);

        // Show current state
        console.log('📊 Current word status distribution:\n');
        const statusResult = await client.query(`
            SELECT
                status,
                COUNT(*) as count,
                ROUND(AVG(correctcount)) as avg_points,
                MIN(correctcount) as min_points,
                MAX(correctcount) as max_points
            FROM words
            WHERE user_id = $1
            GROUP BY status
            ORDER BY status
        `, [mainUser]);
        console.table(statusResult.rows);

        // Find words that need fixing
        console.log('\n🔍 Finding words in wrong stage...\n');
        const wordsToFix = await client.query(`
            SELECT id, word, correctcount, status, reviewcycle, nextreviewdate
            FROM words
            WHERE user_id = $1
            AND (
                -- Words with 20+ points still in studying (should be in review)
                (correctcount >= 20 AND status = 'studying')
                OR
                -- Words that should be in higher stages based on points
                (correctcount >= 35 AND status = 'review_1')
                OR (correctcount >= 50 AND status IN ('review_1', 'review_3'))
                OR (correctcount >= 65 AND status IN ('review_1', 'review_3', 'review_7'))
                OR (correctcount >= 80 AND status IN ('review_1', 'review_3', 'review_7', 'review_14'))
                OR (correctcount >= 90 AND status IN ('review_1', 'review_3', 'review_7', 'review_14', 'review_30'))
                OR (correctcount >= 100 AND status != 'mastered')
            )
            ORDER BY correctcount DESC
        `, [mainUser]);

        console.log(`Found ${wordsToFix.rows.length} words that need stage correction.\n`);

        if (wordsToFix.rows.length === 0) {
            console.log('✅ All words are in correct stages!');
            return;
        }

        // Show first 30 words that need fixing
        console.log('Words to fix (showing first 30):');
        console.table(wordsToFix.rows.slice(0, 30).map(w => ({
            id: w.id,
            word: w.word.substring(0, 25),
            points: w.correctcount,
            current_status: w.status,
            cycle: w.reviewcycle
        })));

        // Fix each word
        console.log('\n🔧 Fixing word stages...\n');
        let fixed = 0;

        for (const word of wordsToFix.rows) {
            const points = word.correctcount;
            let newStatus, newCycle, nextReviewDate = null;

            // Determine correct stage based on points
            if (points >= 100) {
                newStatus = 'mastered';
                newCycle = 6;
            } else {
                // Find the highest threshold reached
                let targetCycle = 0;
                for (let i = stageThresholds.length - 1; i >= 0; i--) {
                    if (points >= stageThresholds[i]) {
                        targetCycle = i;
                        break;
                    }
                }

                const intervalDays = srsIntervals[targetCycle];
                newStatus = `review_${intervalDays}`;
                newCycle = targetCycle;

                // Set next review date to now (so they appear in review immediately)
                nextReviewDate = new Date();
            }

            // Update the word
            await client.query(`
                UPDATE words
                SET status = $1, reviewcycle = $2, nextreviewdate = $3, updatedat = CURRENT_TIMESTAMP
                WHERE id = $4
            `, [newStatus, newCycle, nextReviewDate, word.id]);

            console.log(`  ✓ "${word.word}" (${points} pts): ${word.status} → ${newStatus}`);
            fixed++;
        }

        console.log(`\n✅ Fixed ${fixed} words!\n`);

        // Show new state
        console.log('📊 New word status distribution:\n');
        const newStatusResult = await client.query(`
            SELECT
                status,
                COUNT(*) as count,
                ROUND(AVG(correctcount)) as avg_points
            FROM words
            WHERE user_id = $1
            GROUP BY status
            ORDER BY status
        `, [mainUser]);
        console.table(newStatusResult.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixWordStages();
