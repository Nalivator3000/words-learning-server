const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Running migration: add-daily-goals.sql');

        const sql = fs.readFileSync('migrations/add-daily-goals.sql', 'utf8');

        await client.query(sql);

        console.log('✅ Migration completed successfully!');

        // Verify the changes
        const result = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            AND column_name IN ('daily_xp_goal', 'daily_tasks_goal', 'daily_word_goal')
            ORDER BY column_name;
        `);

        console.log('\n📊 New columns in user_profiles:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
        });

        // Check how many users were updated
        const userCount = await client.query(`
            SELECT COUNT(*) as count FROM user_profiles
            WHERE daily_word_goal = 5;
        `);

        console.log(`\n👥 Updated ${userCount.rows[0].count} user profiles with new daily goals`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n💥 Error:', err);
        process.exit(1);
    });
