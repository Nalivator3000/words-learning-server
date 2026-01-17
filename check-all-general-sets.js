#!/usr/bin/env node
/**
 * Check all word sets status
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAllSets() {
    try {
        console.log('\n' + '='.repeat(80));
        console.log('WORD SETS - FULL STATUS');
        console.log('='.repeat(80) + '\n');

        // 1. Overview by source language
        console.log('📊 Overview by Source Language:\n');
        const overview = await db.query(`
            SELECT source_language, COUNT(*) as sets_count, SUM(word_count) as total_words
            FROM word_sets
            GROUP BY source_language
            ORDER BY source_language
        `);

        overview.rows.forEach(row => {
            console.log(`   ${row.source_language.padEnd(15)} ${row.sets_count.toString().padStart(3)} sets, ${row.total_words.toString().padStart(5)} words`);
        });

        // 2. Check for English and German specifically
        console.log('\n' + '='.repeat(80));
        console.log('ENGLISH & GERMAN SETS - DETAILED CHECK');
        console.log('='.repeat(80));

        const languages = ['english', 'german'];

        for (const lang of languages) {
            console.log(`\n🔍 ${lang.toUpperCase()} SETS:\n`);

            const langSets = await db.query(`
                SELECT level, COUNT(*) as sets, SUM(word_count) as words
                FROM word_sets
                WHERE source_language = $1
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
            `, [lang]);

            if (langSets.rows.length === 0) {
                console.log(`   ❌ NO SETS FOUND`);
            } else {
                langSets.rows.forEach(row => {
                    console.log(`   ${row.level}: ${row.sets.toString().padStart(3)} sets, ${row.words.toString().padStart(5)} words`);
                });

                const total = langSets.rows.reduce((sum, r) => sum + parseInt(r.words), 0);
                console.log(`   ${'─'.repeat(30)}`);
                console.log(`   TOTAL: ${total} words`);
            }
        }

        // 3. Check Hindi sets
        console.log('\n' + '='.repeat(80));
        console.log('🇮🇳 HINDI SETS:\n');

        const hindiSets = await db.query(`
            SELECT level, COUNT(*) as sets, SUM(word_count) as words
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

        if (hindiSets.rows.length === 0) {
            console.log(`   ❌ NO SETS FOUND`);
        } else {
            hindiSets.rows.forEach(row => {
                console.log(`   ${row.level}: ${row.sets.toString().padStart(3)} sets, ${row.words.toString().padStart(5)} words`);
            });

            const total = hindiSets.rows.reduce((sum, r) => sum + parseInt(r.words), 0);
            console.log(`   ${'─'.repeat(30)}`);
            console.log(`   TOTAL: ${total} words`);
        }

        // 4. Check different Hindi set types
        console.log('\n📚 Hindi Sets by Title Pattern:\n');
        const hindiTypes = await db.query(`
            SELECT
                CASE
                    WHEN title LIKE '%→ German%' THEN 'Hindi → German'
                    WHEN title LIKE '%→%' THEN 'Other Direction'
                    ELSE 'Hindi → English'
                END as set_type,
                COUNT(*) as sets,
                SUM(word_count) as words
            FROM word_sets
            WHERE source_language = 'hindi'
            GROUP BY set_type
            ORDER BY set_type
        `);

        hindiTypes.rows.forEach(row => {
            console.log(`   ${row.set_type.padEnd(20)}: ${row.sets.toString().padStart(3)} sets, ${row.words.toString().padStart(5)} words`);
        });

        // 5. Sample sets for each language
        console.log('\n' + '='.repeat(80));
        console.log('SAMPLE SETS (First 3 for each language)');
        console.log('='.repeat(80) + '\n');

        for (const lang of ['english', 'german', 'hindi']) {
            console.log(`\n${lang.toUpperCase()}:`);
            const samples = await db.query(`
                SELECT id, title, level, word_count, created_at::date as created
                FROM word_sets
                WHERE source_language = $1
                ORDER BY created_at DESC, id
                LIMIT 3
            `, [lang]);

            samples.rows.forEach(row => {
                console.log(`   [${row.id}] ${row.title} (${row.level}, ${row.word_count} words, ${row.created})`);
            });
        }

        // 6. Summary
        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80) + '\n');

        const summary = await db.query(`
            SELECT
                COUNT(DISTINCT source_language) as languages,
                COUNT(*) as total_sets,
                SUM(word_count) as total_items
            FROM word_sets
        `);

        const s = summary.rows[0];
        console.log(`   Languages with sets: ${s.languages}`);
        console.log(`   Total sets: ${s.total_sets}`);
        console.log(`   Total items in sets: ${s.total_items}`);

        console.log('\n' + '='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.end();
    }
}

checkAllSets();
