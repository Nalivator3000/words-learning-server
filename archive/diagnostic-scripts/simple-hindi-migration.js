/**
 * Simple Hindi POS migration - runs directly with DATABASE_URL
 */

const { Pool } = require('pg');

async function runMigration() {
    const dbUrl = process.env.DATABASE_URL || process.env.PUBLIC_DATABASE_URL;

    if (!dbUrl) {
        console.error('❌ DATABASE_URL or PUBLIC_DATABASE_URL not set');
        process.exit(1);
    }

    console.log('🔧 Connecting to database...');

    const db = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('✅ Connected');
        console.log('🔍 Checking if pos column exists...\n');

        // Check if column exists
        const checkResult = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'source_words_hindi'
                AND column_name = 'pos'
            ) as exists
        `);

        if (checkResult.rows[0].exists) {
            console.log('⚠️  Column pos already exists!');

            const stats = await db.query(`
                SELECT COUNT(*) as total FROM source_words_hindi
            `);

            console.log(`   Total Hindi words: ${stats.rows[0].total}`);
            console.log('\n✅ No migration needed');
            await db.end();
            return;
        }

        // Add column
        console.log('🔨 Adding pos column...');

        await db.query(`
            ALTER TABLE source_words_hindi
            ADD COLUMN pos VARCHAR(50)
        `);

        console.log('✅ Column added');
        console.log('📊 Creating index...');

        await db.query(`
            CREATE INDEX idx_source_words_hindi_pos ON source_words_hindi(pos)
        `);

        console.log('✅ Index created');

        // Get stats
        const stats = await db.query(`
            SELECT COUNT(*) as total FROM source_words_hindi
        `);

        console.log(`\n🎉 Migration completed successfully!`);
        console.log(`   Total Hindi words: ${stats.rows[0].total}`);

        // Test query
        const test = await db.query(`
            SELECT id, word, pos, level FROM source_words_hindi LIMIT 3
        `);

        console.log('\n📋 Sample data:');
        test.rows.forEach(row => {
            console.log(`   ${row.word} (Level ${row.level}) - POS: ${row.pos || 'null'}`);
        });

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await db.end();
    }
}

runMigration();
