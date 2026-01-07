/**
 * Remove technical acronyms from source words and word sets
 * These words (PDF, PHP, HTTP, etc.) are useless for language learning
 */

const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

// IDs of acronym words to remove from English
const acronymIds = [
    331,  // dvd
    456,  // cd
    548,  // tv
    572,  // pc
    856,  // url
    1033, // html
    1141, // pdf
    1328, // ip
    1497, // xml
    1650, // usb
    1659, // php
    1907, // os
    2938, // rom
    3038, // sql
    3082, // gps
    3276, // ram
    3903, // css
    4123, // ftp
    4346, // cpu
    4726, // http
    4811, // api
    5662, // tcp
    6724  // dns
];

async function removeAcronyms() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');
        
        // Step 1: Check current usage
        console.log('📊 Step 1: Checking current usage...\n');
        
        const usageCheck = await client.query(`
            SELECT 
                COUNT(DISTINCT wsi.word_set_id) as affected_sets,
                COUNT(*) as total_items
            FROM word_set_items wsi
            WHERE wsi.word_id = ANY($1)
        `, [acronymIds]);
        
        console.log(`   - Affected word sets: ${usageCheck.rows[0].affected_sets}`);
        console.log(`   - Total items to remove: ${usageCheck.rows[0].total_items}`);
        console.log();
        
        // Step 2: Remove from word_set_items
        console.log('🗑️  Step 2: Removing acronyms from word sets...\n');
        
        const deleteItems = await client.query(`
            DELETE FROM word_set_items
            WHERE word_id = ANY($1)
            RETURNING word_set_id
        `, [acronymIds]);
        
        console.log(`   ✅ Removed ${deleteItems.rowCount} items from word sets\n`);
        
        // Step 3: Update word_count for affected sets
        console.log('🔄 Step 3: Updating word counts...\n');
        
        const affectedSets = [...new Set(deleteItems.rows.map(r => r.word_set_id))];
        
        for (const setId of affectedSets) {
            await client.query(`
                UPDATE word_sets
                SET word_count = (
                    SELECT COUNT(*) FROM word_set_items WHERE word_set_id = $1
                ),
                updated_at = NOW()
                WHERE id = $1
            `, [setId]);
        }
        
        console.log(`   ✅ Updated ${affectedSets.length} word sets\n`);
        
        // Step 4: Remove from user progress (if any users have these words)
        console.log('👤 Step 4: Checking user progress...\n');
        
        const userProgress = await client.query(`
            SELECT COUNT(*) as count
            FROM user_word_progress
            WHERE source_word_id = ANY($1)
        `, [acronymIds]);
        
        if (parseInt(userProgress.rows[0].count) > 0) {
            const deleteProgress = await client.query(`
                DELETE FROM user_word_progress
                WHERE source_word_id = ANY($1)
            `, [acronymIds]);
            
            console.log(`   ✅ Removed ${deleteProgress.rowCount} entries from user progress\n`);
        } else {
            console.log(`   ✅ No user progress entries found\n`);
        }
        
        // Step 5: Delete the source words themselves (optional - commented for safety)
        console.log('⚠️  Step 5: Source words deletion (DISABLED for safety)\n');
        console.log('   The source words are still in source_words_english table');
        console.log('   Uncomment the code below to delete them permanently\n');
        
        /*
        const deleteWords = await client.query(`
            DELETE FROM source_words_english
            WHERE id = ANY($1)
        `, [acronymIds]);
        
        console.log(`   ✅ Deleted ${deleteWords.rowCount} source words\n`);
        */
        
        console.log('✅ CLEANUP COMPLETE!\n');
        console.log('Summary:');
        console.log(`- Removed ${deleteItems.rowCount} items from word sets`);
        console.log(`- Updated ${affectedSets.length} word sets`);
        console.log('- Technical acronyms no longer appear in learning content');
        console.log();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
        console.log('✅ Database connection closed');
    }
}

// Running cleanup as requested
removeAcronyms();
