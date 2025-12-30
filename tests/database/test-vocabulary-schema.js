#!/usr/bin/env node
/**
 * Database Schema Tests for Vocabulary Tables
 * Tests structure, constraints, and data integrity
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let results = { passed: 0, failed: 0, tests: [] };

async function test(name, fn) {
    process.stdout.write(`  ${name}... `);
    try {
        await fn();
        console.log('✅');
        results.passed++;
        results.tests.push({ name, status: 'PASS' });
    } catch (e) {
        console.log(`❌ ${e.message}`);
        results.failed++;
        results.tests.push({ name, status: 'FAIL', error: e.message });
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function runTests() {
    console.log('\n🗄️  Database Schema Tests\n');
    console.log('━'.repeat(60));

    // Test source_words tables
    console.log('\n📚 Source Words Tables:');

    const languages = ['german', 'english', 'spanish', 'french'];

    for (const lang of languages) {
        await test(`source_words_${lang} exists`, async () => {
            const res = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = $1
                )
            `, [`source_words_${lang}`]);
            assert(res.rows[0].exists, `Table source_words_${lang} should exist`);
        });

        await test(`source_words_${lang} has required columns`, async () => {
            const res = await db.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [`source_words_${lang}`]);

            const columns = res.rows.map(r => r.column_name);
            assert(columns.includes('id'), 'Should have id column');
            assert(columns.includes('word'), 'Should have word column');
            assert(columns.includes('level'), 'Should have level column');
        });

        await test(`source_words_${lang} has UNIQUE constraint on word`, async () => {
            const res = await db.query(`
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = $1 AND constraint_type = 'UNIQUE'
            `, [`source_words_${lang}`]);

            assert(res.rows.length > 0, 'Should have at least one UNIQUE constraint');
        });

        await test(`source_words_${lang} has data`, async () => {
            const res = await db.query(`SELECT COUNT(*) FROM source_words_${lang}`);
            const count = parseInt(res.rows[0].count);
            assert(count > 0, `Should have words (found ${count})`);
            console.log(`    → ${count} words`);
        });
    }

    // Test translation tables
    console.log('\n🌍 Translation Tables:');

    await test('All translation tables exist', async () => {
        const res = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'target_translations_%'
        `);

        assert(res.rows.length > 10, `Should have multiple translation tables (found ${res.rows.length})`);
        console.log(`    → ${res.rows.length} tables`);
    });

    await test('Translation tables have UNIQUE constraints', async () => {
        const tables = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename LIKE 'target_translations_%'
        `);

        let tablesWithConstraints = 0;
        for (const table of tables.rows) {
            const res = await db.query(`
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = $1 AND constraint_type = 'UNIQUE'
            `, [table.tablename]);

            if (res.rows.length > 0) tablesWithConstraints++;
        }

        assert(tablesWithConstraints > 30, `Most tables should have constraints (${tablesWithConstraints}/${tables.rows.length})`);
    });

    // Test CEFR levels distribution
    console.log('\n📊 CEFR Levels Distribution:');

    for (const lang of languages) {
        await test(`source_words_${lang} has all CEFR levels`, async () => {
            const res = await db.query(`
                SELECT level, COUNT(*) as count
                FROM source_words_${lang}
                GROUP BY level
                ORDER BY level
            `);

            const levels = res.rows.map(r => r.level);
            const expectedLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

            for (const level of expectedLevels) {
                assert(levels.includes(level), `Should have ${level} level`);
            }

            console.log(`    → ${res.rows.map(r => `${r.level}:${r.count}`).join(', ')}`);
        });
    }

    // Test data integrity
    console.log('\n🔍 Data Integrity:');

    await test('No duplicate words in source tables', async () => {
        for (const lang of languages) {
            const res = await db.query(`
                SELECT word, COUNT(*) as count
                FROM source_words_${lang}
                GROUP BY word
                HAVING COUNT(*) > 1
            `);

            assert(res.rows.length === 0, `${lang} should have no duplicates (found ${res.rows.length})`);
        }
    });

    await test('No empty words in source tables', async () => {
        for (const lang of languages) {
            const res = await db.query(`
                SELECT COUNT(*) FROM source_words_${lang}
                WHERE word IS NULL OR word = ''
            `);

            const count = parseInt(res.rows[0].count);
            assert(count === 0, `${lang} should have no empty words (found ${count})`);
        }
    });

    await test('All translations reference valid words', async () => {
        // Check target_translations_russian
        const res = await db.query(`
            SELECT COUNT(*) FROM target_translations_russian tt
            LEFT JOIN source_words_german sw ON tt.source_word_id = sw.id
            WHERE sw.id IS NULL
        `);

        const orphaned = parseInt(res.rows[0].count);
        assert(orphaned === 0, `Should have no orphaned translations (found ${orphaned})`);
    });

    // Print results
    console.log('\n' + '━'.repeat(60));
    console.log('\n📊 Test Results:\n');
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📝 Total:  ${results.passed + results.failed}`);

    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`  📈 Success: ${successRate}%`);

    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`  - ${t.name}: ${t.error}`);
        });
    }

    console.log('\n' + '━'.repeat(60) + '\n');

    await db.end();
    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    db.end();
    process.exit(1);
});
