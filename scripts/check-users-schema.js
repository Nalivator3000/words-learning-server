#!/usr/bin/env node
/**
 * Check actual users table schema
 */

const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:XVTILjHIIyOBbUWYqbKlpUzjPPQBDwRe@autorack.proxy.rlwy.net:34090/railway',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function main() {
    console.log('\n🔍 Checking users table schema...\n');

    try {
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        console.log('📋 Users Table Columns:\n');
        result.rows.forEach((col, idx) => {
            console.log(`${idx + 1}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            if (col.column_default) {
                console.log(`   Default: ${col.column_default}`);
            }
        });

        console.log('\n✅ Schema check complete\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

main();
