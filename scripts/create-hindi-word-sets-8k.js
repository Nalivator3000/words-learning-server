#!/usr/bin/env node
/**
 * Create word sets for ~8000 Hindi words
 * Distributes words across sets by level and theme
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Words per set
const WORDS_PER_SET = 50;

async function createHindiWordSets() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('📚 CREATING HINDI WORD SETS');
        console.log('='.repeat(80) + '\n');

        // Step 1: Delete old empty Hindi word sets
        console.log('🗑️  Deleting old Hindi word sets...');
        const deleted = await db.query(`
            DELETE FROM word_sets
            WHERE source_language = 'hindi'
        `);
        console.log(`   Deleted ${deleted.rowCount} old sets\n`);

        // Step 2: Get words by level
        console.log('📊 Fetching Hindi words by level...\n');

        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        let totalSetsCreated = 0;

        for (const level of levels) {
            const words = await db.query(`
                SELECT id, word, level, theme
                FROM source_words_hindi
                WHERE level = $1
                ORDER BY id
            `, [level]);

            const wordCount = words.rows.length;
            const setsNeeded = Math.ceil(wordCount / WORDS_PER_SET);

            console.log(`📝 Level ${level}: ${wordCount} words → ${setsNeeded} sets`);

            // Create sets for this level
            for (let setNum = 1; setNum <= setsNeeded; setNum++) {
                const startIdx = (setNum - 1) * WORDS_PER_SET;
                const endIdx = Math.min(startIdx + WORDS_PER_SET, wordCount);
                const setWords = words.rows.slice(startIdx, endIdx);

                // Determine set title
                const setTitle = `Hindi ${level}: General ${setNum}`;
                const setDescription = `${level} level general vocabulary - Part ${setNum} of ${setsNeeded}`;

                // Create word set
                const setResult = await db.query(`
                    INSERT INTO word_sets (
                        source_language, title, description, level, theme,
                        word_count, is_public, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                    RETURNING id
                `, ['hindi', setTitle, setDescription, level, 'general', setWords.length, true]);

                const wordSetId = setResult.rows[0].id;

                // Add words to set
                for (let i = 0; i < setWords.length; i++) {
                    await db.query(`
                        INSERT INTO word_set_items (word_set_id, word_id, order_index, added_at)
                        VALUES ($1, $2, $3, NOW())
                    `, [wordSetId, setWords[i].id, i]);
                }

                totalSetsCreated++;
            }
        }

        console.log(`\n✅ Created ${totalSetsCreated} word sets\n`);

        // Step 3: Verify
        console.log('='.repeat(80));
        console.log('VERIFICATION');
        console.log('='.repeat(80) + '\n');

        const finalSets = await db.query(`
            SELECT level, COUNT(*) as count
            FROM word_sets
            WHERE source_language = 'hindi'
            GROUP BY level
            ORDER BY
                CASE level
                    WHEN 'A1' THEN 1
                    WHEN 'A2' THEN 2
                    WHEN 'B1' THEN 3
                    WHEN 'B2' THEN 4
                    WHEN 'C1' THEN 5
                    WHEN 'C2' THEN 6
                END
        `);

        console.log('📚 Word sets by level:');
        finalSets.rows.forEach(row => {
            console.log(`   ${row.level}: ${row.count} sets`);
        });

        const itemsCount = await db.query(`
            SELECT COUNT(*) as count
            FROM word_set_items wsi
            JOIN word_sets ws ON wsi.word_set_id = ws.id
            WHERE ws.source_language = 'hindi'
        `);

        console.log(`\n📊 Total word set items: ${itemsCount.rows[0].count}`);

        const orphans = await db.query(`
            SELECT COUNT(*) as count
            FROM source_words_hindi sw
            WHERE NOT EXISTS (
                SELECT 1 FROM word_set_items wsi
                JOIN word_sets ws ON wsi.word_set_id = ws.id
                WHERE wsi.word_id = sw.id
                AND ws.source_language = 'hindi'
            )
        `);

        console.log(`📊 Words not in sets: ${orphans.rows[0].count}`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ WORD SETS CREATED SUCCESSFULLY');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

createHindiWordSets();
