#!/usr/bin/env node
/**
 * Run user_word_progress table migration
 * This creates the new architecture where users don't copy words,
 * but track progress on source vocabulary
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 3
});

async function runMigration() {
    try {
        console.log('\n🔄 RUNNING USER_WORD_PROGRESS MIGRATION\n');
        console.log('='.repeat(70));

        // Read SQL file
        const sqlFile = path.join(__dirname, 'create-user-word-progress-table.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📄 Loaded migration SQL from:', sqlFile);
        console.log('🔗 Database:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');
        console.log('');

        // Execute migration
        console.log('⚙️  Executing migration...');
        await db.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('');

        // Verify table was created
        const checkTable = await db.query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'user_word_progress'
            ORDER BY ordinal_position
        `);

        if (checkTable.rows.length > 0) {
            console.log('✅ Table user_word_progress created with columns:');
            checkTable.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type})`);
            });
        }

        console.log('');
        console.log('='.repeat(70));
        console.log('✅ MIGRATION COMPLETE');
        console.log('='.repeat(70));

        await db.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ MIGRATION FAILED');
        console.error('='.repeat(70));
        console.error('Error:', err.message);
        console.error('='.repeat(70));
        console.error(err.stack);
        await db.end();
        process.exit(1);
    }
}

runMigration();
