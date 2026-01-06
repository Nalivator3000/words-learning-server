const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

async function checkStructure() {
    console.log('Checking table structures...\n');

    // Check language_pairs structure
    const lpCols = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'language_pairs'
        ORDER BY ordinal_position
    `);

    console.log('language_pairs columns:');
    lpCols.rows.forEach(col => console.log('  -', col.column_name, ':', col.data_type));

    // Check user_word_progress structure
    const uwpCols = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_word_progress'
        ORDER BY ordinal_position
    `);

    console.log('\nuser_word_progress columns:');
    uwpCols.rows.forEach(col => console.log('  -', col.column_name, ':', col.data_type));

    // Sample data from user_word_progress
    const sample = await pool.query(`
        SELECT uwp.*, u.email
        FROM user_word_progress uwp
        JOIN users u ON u.id = uwp.user_id
        LIMIT 3
    `);

    console.log('\nSample user_word_progress data:');
    sample.rows.forEach(row => {
        console.log(row);
    });

    await pool.end();
}

checkStructure().catch(console.error);
