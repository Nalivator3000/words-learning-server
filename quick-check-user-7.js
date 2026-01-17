const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUser7() {
    try {
        const userId = 7;

        // Check word progress count
        const progressResult = await db.query(`
            SELECT COUNT(*) FROM user_word_progress WHERE user_id = $1
        `, [userId]);

        console.log(`User ${userId} total words in progress: ${progressResult.rows[0].count}`);

        // Check language pairs
        const lpResult = await db.query(`
            SELECT id, from_lang, to_lang FROM language_pairs WHERE user_id = $1
        `, [userId]);

        console.log(`\nLanguage pairs for user ${userId}:`);
        lpResult.rows.forEach(lp => {
            console.log(`  Pair ${lp.id}: ${lp.from_lang} → ${lp.to_lang}`);
        });

        // Check if user exists
        const userResult = await db.query(`
            SELECT id, username, email FROM users WHERE id = $1
        `, [userId]);

        if (userResult.rows.length > 0) {
            console.log(`\nUser ${userId} details:`);
            console.log(`  Username: ${userResult.rows[0].username}`);
            console.log(`  Email: ${userResult.rows[0].email}`);
        } else {
            console.log(`\n⚠️ User ${userId} not found!`);
        }

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await db.end();
    }
}

checkUser7();
