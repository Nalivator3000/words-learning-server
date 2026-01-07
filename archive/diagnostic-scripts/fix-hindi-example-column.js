/**
 * Add missing example_hi column to source_words_hindi
 */

const { Pool } = require('pg');

async function fixExampleColumn() {
    const dbUrl = process.env.DATABASE_URL;

    const db = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Checking source_words_hindi structure...\n');

        // Get all columns
        const columns = await db.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'source_words_hindi'
            ORDER BY ordinal_position
        `);

        console.log('Current columns:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        // Check if example_hi exists
        const hasExampleHi = columns.rows.some(col => col.column_name === 'example_hi');

        if (hasExampleHi) {
            console.log('\n✅ Column example_hi already exists');
        } else {
            console.log('\n🔨 Adding example_hi column...');

            await db.query(`
                ALTER TABLE source_words_hindi
                ADD COLUMN example_hi TEXT
            `);

            console.log('✅ Column example_hi added');
        }

        // Test query
        console.log('\n🧪 Testing query...');
        const test = await db.query(`
            SELECT id, word, pos, level, example_hi
            FROM source_words_hindi
            LIMIT 3
        `);

        console.log('✅ Query successful!');
        console.log('\nSample data:');
        test.rows.forEach(row => {
            console.log(`  ${row.word} - example: ${row.example_hi || '(none)'}`);
        });

        console.log('\n🎉 All fixes applied successfully!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

fixExampleColumn();
