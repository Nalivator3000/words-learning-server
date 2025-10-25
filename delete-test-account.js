const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function deleteTestAccount() {
    const client = await pool.connect();

    try {
        console.log('🗑️  Deleting test account...');

        const res1 = await client.query('DELETE FROM words WHERE user_id = (SELECT id FROM users WHERE email = $1)', ['demo@fluentflow.app']);
        console.log('✅ Deleted', res1.rowCount, 'words');

        const res2 = await client.query('DELETE FROM language_pairs WHERE user_id = (SELECT id FROM users WHERE email = $1)', ['demo@fluentflow.app']);
        console.log('✅ Deleted', res2.rowCount, 'language_pairs');

        const res3 = await client.query('DELETE FROM user_stats WHERE user_id = (SELECT id FROM users WHERE email = $1)', ['demo@fluentflow.app']);
        console.log('✅ Deleted', res3.rowCount, 'user_stats');

        const res4 = await client.query('DELETE FROM users WHERE email = $1', ['demo@fluentflow.app']);
        console.log('✅ Deleted', res4.rowCount, 'users');

        console.log('\n🎉 Test account deleted!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

deleteTestAccount().catch(console.error);
