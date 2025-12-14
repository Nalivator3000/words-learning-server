// Check database for words where points don't match their review stage
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'words_learning',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

// Progressive thresholds for each stage
const stageThresholds = [20, 35, 50, 65, 80, 90, 100];

// Map status to expected cycle
const statusToCycle = {
    'studying': -1,        // Any points below 20
    'review_1': 0,         // 20-34 points
    'review_3': 1,         // 35-49 points
    'review_7': 2,         // 50-64 points
    'review_14': 3,        // 65-79 points
    'review_30': 4,        // 80-89 points
    'review_60': 5,        // 90-99 points
    'review_120': 6,       // 100 points
    'learned': 7,          // 100 points (old status)
    'mastered': 7          // 100 points (new status)
};

async function checkMismatches() {
    console.log('🔍 Checking for words with mismatched points and stages...\n');

    try {
        // Get all words with their current status and points
        const result = await pool.query(`
            SELECT id, word, correctcount, status, reviewcycle, user_id
            FROM words
            WHERE status IN ('studying', 'review_1', 'review_3', 'review_7', 'review_14', 'review_30', 'review_60', 'review_120', 'learned', 'mastered')
            ORDER BY correctcount DESC, status
        `);

        console.log(`Total words checked: ${result.rows.length}\n`);

        const mismatches = [];

        for (const word of result.rows) {
            const points = word.correctcount || 0;
            const status = word.status;
            const cycle = word.reviewcycle || 0;

            // Determine expected cycle based on points
            let expectedCycle = -1; // studying
            for (let i = 0; i < stageThresholds.length; i++) {
                if (points >= stageThresholds[i]) {
                    expectedCycle = i;
                } else {
                    break;
                }
            }

            // Determine expected status based on points
            let expectedStatus = 'studying';
            if (points >= 100) {
                expectedStatus = 'mastered';
            } else if (expectedCycle >= 0) {
                const intervals = [1, 3, 7, 14, 30, 60, 120];
                expectedStatus = `review_${intervals[expectedCycle]}`;
            }

            // Check if there's a mismatch
            const statusMismatch = status !== expectedStatus && !(status === 'learned' && expectedStatus === 'mastered');
            const cycleMismatch = statusToCycle[status] !== expectedCycle && status !== 'studying';

            if (statusMismatch || cycleMismatch) {
                mismatches.push({
                    id: word.id,
                    word: word.word,
                    points: points,
                    currentStatus: status,
                    currentCycle: cycle,
                    expectedStatus: expectedStatus,
                    expectedCycle: expectedCycle >= 0 ? expectedCycle : 'N/A'
                });
            }
        }

        if (mismatches.length === 0) {
            console.log('✅ No mismatches found! All words have correct points for their stages.');
        } else {
            console.log(`❌ Found ${mismatches.length} words with mismatched points/stages:\n`);

            mismatches.forEach((m, index) => {
                console.log(`${index + 1}. "${m.word}" (ID: ${m.id})`);
                console.log(`   Current: ${m.points} pts, ${m.currentStatus} (cycle ${m.currentCycle})`);
                console.log(`   Expected: ${m.expectedStatus} (cycle ${m.expectedCycle})`);
                console.log('');
            });

            console.log('\n📊 Summary:');
            console.log(`   Mismatches: ${mismatches.length}`);
            console.log(`   Correct: ${result.rows.length - mismatches.length}`);
        }

    } catch (error) {
        console.error('❌ Error checking mismatches:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run check
checkMismatches()
    .then(() => {
        console.log('\n✨ Check complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Check failed:', error);
        process.exit(1);
    });
