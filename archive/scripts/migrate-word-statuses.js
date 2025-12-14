// Migration script to update word statuses based on new progressive threshold system
// Run this once after implementing the new point system

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'words_learning',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

// SRS intervals and thresholds (same as in server-postgresql.js)
const srsIntervals = [1, 3, 7, 14, 30, 60, 120];
const stageThresholds = [20, 35, 50, 65, 80, 90, 100];

async function migrateWordStatuses() {
    console.log('🔄 Starting word status migration...\n');

    try {
        // Get all words that are currently "studying" or "learning"
        const result = await pool.query(`
            SELECT id, word, correctcount, status, reviewcycle
            FROM words
            WHERE status IN ('studying', 'learning')
            ORDER BY correctcount DESC
        `);

        console.log(`Found ${result.rows.length} words to check\n`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const word of result.rows) {
            const correctCount = word.correctcount || 0;
            const reviewCycle = word.reviewcycle || 0;
            const currentThreshold = stageThresholds[reviewCycle] || 100;

            // Check if word has reached threshold for current cycle
            if (correctCount >= currentThreshold && reviewCycle < srsIntervals.length) {
                const intervalDays = srsIntervals[reviewCycle];
                const newStatus = `review_${intervalDays}`;
                const nextReviewDate = new Date();
                nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

                await pool.query(
                    `UPDATE words
                     SET status = $1, nextreviewdate = $2, updatedAt = CURRENT_TIMESTAMP
                     WHERE id = $3`,
                    [newStatus, nextReviewDate, word.id]
                );

                console.log(`✅ Updated: "${word.word}" (${correctCount} pts) → ${newStatus} (review in ${intervalDays} days)`);
                updatedCount++;
            } else {
                // Word is below threshold or already in correct status
                console.log(`⏭️  Skipped: "${word.word}" (${correctCount}/${currentThreshold} pts, cycle ${reviewCycle})`);
                skippedCount++;
            }
        }

        console.log(`\n📊 Migration complete!`);
        console.log(`   ✅ Updated: ${updatedCount} words`);
        console.log(`   ⏭️  Skipped: ${skippedCount} words`);
        console.log(`   📚 Total: ${result.rows.length} words checked`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run migration
migrateWordStatuses()
    .then(() => {
        console.log('\n✨ Migration finished successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    });
