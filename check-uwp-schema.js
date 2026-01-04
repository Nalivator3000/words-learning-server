const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkSchema() {
    try {
        // Get column names from user_word_progress
        const result = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'user_word_progress'
            ORDER BY ordinal_position
        `);

        console.log('\n📊 user_word_progress table schema:');
        console.log('=====================================');
        result.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(30)} ${row.data_type}`);
        });

        // Check if last_reviewed_at exists
        const hasColumn = result.rows.some(row => row.column_name === 'last_reviewed_at');
        console.log('\n✅ Column check:');
        console.log(`last_reviewed_at exists: ${hasColumn ? 'YES ✓' : 'NO ✗'}`);

        // Check for similar columns
        const timeColumns = result.rows.filter(row =>
            row.column_name.includes('time') ||
            row.column_name.includes('date') ||
            row.column_name.includes('review') ||
            row.column_name.includes('updated')
        );

        if (timeColumns.length > 0) {
            console.log('\n🕐 Time-related columns found:');
            timeColumns.forEach(col => {
                console.log(`  - ${col.column_name} (${col.data_type})`);
            });
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkSchema();
