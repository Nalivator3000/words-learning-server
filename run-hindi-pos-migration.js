/**
 * Script to run the Hindi source_words POS column migration
 * This fixes the "column sw.pos does not exist" error
 *
 * Usage: node run-hindi-pos-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🔧 Starting Hindi POS column migration...\n');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migrations', 'fix-hindi-source-words-add-pos.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration file loaded: fix-hindi-source-words-add-pos.sql');
        console.log('🔍 Checking current table structure...\n');

        // Check if table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'source_words_hindi'
            ) as exists
        `);

        if (!tableCheck.rows[0].exists) {
            console.error('❌ ERROR: source_words_hindi table does not exist!');
            console.error('   Please create the table first before running this migration.');
            process.exit(1);
        }

        console.log('✅ Table source_words_hindi exists');

        // Check if pos column exists
        const columnCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'source_words_hindi'
                AND column_name = 'pos'
            ) as exists
        `);

        if (columnCheck.rows[0].exists) {
            console.log('⚠️  Column pos already exists in source_words_hindi');
            console.log('   Migration may have already been run.');

            // Show current stats
            const stats = await db.query(`
                SELECT
                    COUNT(*) as total,
                    COUNT(pos) as with_pos,
                    COUNT(*) - COUNT(pos) as without_pos
                FROM source_words_hindi
            `);

            console.log('\n📊 Current statistics:');
            console.log(`   Total words: ${stats.rows[0].total}`);
            console.log(`   Words with POS: ${stats.rows[0].with_pos}`);
            console.log(`   Words without POS: ${stats.rows[0].without_pos}`);

            await db.end();
            return;
        }

        console.log('🔨 Adding pos column to source_words_hindi...\n');

        // Run the migration
        await db.query(migrationSQL);

        console.log('\n✅ Migration completed successfully!');

        // Verify the column was added
        const verifyColumn = await db.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'source_words_hindi'
            AND column_name = 'pos'
        `);

        if (verifyColumn.rows.length > 0) {
            console.log('\n✅ Verification: pos column added successfully');
            console.log(`   Type: ${verifyColumn.rows[0].data_type}`);
            console.log(`   Max length: ${verifyColumn.rows[0].character_maximum_length}`);
        }

        // Test a query that was failing before
        console.log('\n🧪 Testing query that was previously failing...');

        const testQuery = await db.query(`
            SELECT id, word, pos, level, theme
            FROM source_words_hindi
            LIMIT 5
        `);

        console.log(`✅ Query successful! Retrieved ${testQuery.rows.length} rows`);
        if (testQuery.rows.length > 0) {
            console.log('\nSample data:');
            testQuery.rows.forEach((row, i) => {
                console.log(`   ${i + 1}. ${row.word} (${row.pos || 'no POS'}) - Level ${row.level}`);
            });
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('   Hindi word sets should now work correctly in the API.');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Run the migration
runMigration();
