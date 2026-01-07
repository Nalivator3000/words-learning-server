/**
 * Script to fix User 62's word data
 *
 * Problem: User 62 (en→es pair) imported English word sets instead of Spanish
 * Solution: Delete all current words so user can reimport correct Spanish sets
 */

const { Client } = require('pg');

// PostgreSQL connection config
const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/dbname',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const userId = 62;
const languagePairId = 66;

async function fixUser62Words() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // 1. Check current word count
        console.log('📊 Checking current words for user 62...\n');
        const countResult = await client.query(`
            SELECT
                source_language,
                status,
                COUNT(*) as count
            FROM user_word_progress
            WHERE user_id = $1 AND language_pair_id = $2
            GROUP BY source_language, status
        `, [userId, languagePairId]);

        if (countResult.rows.length === 0) {
            console.log('✅ User 62 has no words. Nothing to fix.\n');
            await client.end();
            return;
        }

        console.log('Current word counts:');
        countResult.rows.forEach(row => {
            console.log(`  - Language: ${row.source_language}, Status: ${row.status}, Count: ${row.count}`);
        });

        const totalWords = countResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        console.log(`  TOTAL: ${totalWords} words\n`);

        // 2. Show sample words
        console.log('📚 Sample words (first 5):');
        const sampleResult = await client.query(`
            SELECT
                uwp.id,
                uwp.source_word_id,
                sw.word,
                uwp.source_language,
                uwp.status
            FROM user_word_progress uwp
            JOIN source_words_english sw ON uwp.source_word_id = sw.id
            WHERE uwp.user_id = $1 AND uwp.language_pair_id = $2
            ORDER BY uwp.id
            LIMIT 5
        `, [userId, languagePairId]);

        sampleResult.rows.forEach(row => {
            console.log(`  - ID ${row.id}: "${row.word}" (source_lang: ${row.source_language}, status: ${row.status})`);
        });
        console.log();

        // 3. Confirm deletion
        console.log('⚠️  WARNING: This will DELETE all words for user 62!\n');
        console.log(`About to delete ${totalWords} words from user_word_progress`);
        console.log('User will need to reimport SPANISH word sets after this.\n');

        // Uncomment the next line to actually delete (for safety, it's commented by default)
        // const deleteResult = await client.query(`
        //     DELETE FROM user_word_progress
        //     WHERE user_id = $1 AND language_pair_id = $2
        // `, [userId, languagePairId]);

        console.log('🔒 DELETION IS DISABLED FOR SAFETY');
        console.log('To enable deletion, uncomment lines 68-71 in this script\n');

        // If you uncommented the deletion, this would show:
        // console.log(`✅ Deleted ${deleteResult.rowCount} words\n`);

        console.log('📋 After deletion, user should:');
        console.log('1. Go to Word Lists page');
        console.log('2. Find SPANISH word sets (e.g., "Spanish A1: General 1")');
        console.log('3. Import those sets instead of English ones\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
        console.log('✅ Database connection closed');
    }
}

// Run the script
fixUser62Words();
