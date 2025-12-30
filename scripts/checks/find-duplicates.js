#!/usr/bin/env node
/**
 * Find duplicate words in vocabulary tables
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function findDuplicates() {
    try {
        console.log('🔍 Searching for duplicate words...\n');

        const languages = ['german', 'english', 'spanish', 'french'];

        for (const lang of languages) {
            console.log(`\n${'━'.repeat(60)}`);
            console.log(`📚 Checking: source_words_${lang}`);
            console.log('━'.repeat(60));

            // Find duplicates
            const duplicates = await db.query(`
                SELECT word, COUNT(*) as count, ARRAY_AGG(id) as ids
                FROM source_words_${lang}
                GROUP BY word
                HAVING COUNT(*) > 1
                ORDER BY count DESC
                LIMIT 20
            `);

            if (duplicates.rows.length === 0) {
                console.log('✅ No duplicates found!\n');
            } else {
                console.log(`❌ Found ${duplicates.rows.length}+ duplicate words:\n`);

                duplicates.rows.slice(0, 10).forEach(row => {
                    console.log(`  "${row.word}": ${row.count} copies (IDs: ${row.ids.slice(0, 5).join(', ')}${row.ids.length > 5 ? '...' : ''})`);
                });

                // Get total count
                const total = await db.query(`
                    SELECT COUNT(*) FROM (
                        SELECT word
                        FROM source_words_${lang}
                        GROUP BY word
                        HAVING COUNT(*) > 1
                    ) as dupes
                `);

                console.log(`\n📊 Total unique words with duplicates: ${total.rows[0].count}`);

                // Get total duplicate rows (extras that should be deleted)
                const extraRows = await db.query(`
                    SELECT SUM(count - 1) as extras FROM (
                        SELECT word, COUNT(*) as count
                        FROM source_words_${lang}
                        GROUP BY word
                        HAVING COUNT(*) > 1
                    ) as dupes
                `);

                console.log(`🗑️  Total duplicate rows to remove: ${extraRows.rows[0].extras}`);
            }
        }

        console.log('\n' + '━'.repeat(60));
        console.log('\n✅ Analysis complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await db.end();
    }
}

findDuplicates().catch(err => {
    console.error(err);
    process.exit(1);
});
