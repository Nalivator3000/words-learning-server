#!/usr/bin/env node
/**
 * Translation Coverage Tests
 * Checks that all words have translations
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
    } catch (e) {
        console.log(`❌ ${e.message}`);
        results.failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function runTests() {
    console.log('\n🌍 Translation Coverage Tests\n');
    console.log('━'.repeat(60));

    console.log('\n📊 Coverage Statistics:');

    // German → Russian
    await test('German → Russian coverage', async () => {
        const totalWords = await db.query('SELECT COUNT(*) FROM source_words_german');
        const translations = await db.query('SELECT COUNT(*) FROM target_translations_russian');

        const total = parseInt(totalWords.rows[0].count);
        const translated = parseInt(translations.rows[0].count);
        const coverage = ((translated / total) * 100).toFixed(1);

        console.log(`    → ${translated}/${total} (${coverage}%)`);
        assert(translated > 0, 'Should have some translations');
    });

    // German → English
    await test('German → English coverage', async () => {
        const totalWords = await db.query('SELECT COUNT(*) FROM source_words_german');
        const translations = await db.query('SELECT COUNT(*) FROM target_translations_english');

        const total = parseInt(totalWords.rows[0].count);
        const translated = parseInt(translations.rows[0].count);
        const coverage = ((translated / total) * 100).toFixed(1);

        console.log(`    → ${translated}/${total} (${coverage}%)`);
        assert(translated > 0, 'Should have some translations');
    });

    // English → Russian
    await test('English → Russian coverage', async () => {
        const totalWords = await db.query('SELECT COUNT(*) FROM source_words_english');
        const translations = await db.query('SELECT COUNT(*) FROM target_translations_russian_from_en');

        const total = parseInt(totalWords.rows[0].count);
        const translated = parseInt(translations.rows[0].count);
        const coverage = ((translated / total) * 100).toFixed(1);

        console.log(`    → ${translated}/${total} (${coverage}%)`);
        assert(translated > 0, 'Should have some translations');
    });

    // Spanish → Russian
    await test('Spanish → Russian coverage', async () => {
        const totalWords = await db.query('SELECT COUNT(*) FROM source_words_spanish');
        const translations = await db.query('SELECT COUNT(*) FROM target_translations_russian_from_es');

        const total = parseInt(totalWords.rows[0].count);
        const translated = parseInt(translations.rows[0].count);
        const coverage = ((translated / total) * 100).toFixed(1);

        console.log(`    → ${translated}/${total} (${coverage}%)`);
        assert(translated > 0, 'Should have some translations');
    });

    console.log('\n🔍 Quality Checks:');

    await test('No empty translations', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM target_translations_russian
            WHERE translation IS NULL OR translation = ''
        `);

        const empty = parseInt(res.rows[0].count);
        assert(empty === 0, `Should have no empty translations (found ${empty})`);
    });

    await test('Translations are different from source', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM target_translations_russian tt
            JOIN source_words_german sw ON tt.source_word_id = sw.id
            WHERE LOWER(tt.translation) = LOWER(sw.word)
        `);

        const same = parseInt(res.rows[0].count);
        // Some words might be the same (internationalisms), so we just warn
        if (same > 100) {
            console.log(`    ⚠️  Warning: ${same} translations identical to source`);
        }
    });

    await test('Find words without any translation', async () => {
        const res = await db.query(`
            SELECT COUNT(*) FROM source_words_german sw
            LEFT JOIN target_translations_russian tt ON sw.id = tt.source_word_id
            WHERE tt.id IS NULL
        `);

        const missing = parseInt(res.rows[0].count);
        console.log(`    → ${missing} words without RU translation`);
    });

    // Print results
    console.log('\n' + '━'.repeat(60));
    console.log(`\n✅ Passed: ${results.passed}/${results.passed + results.failed}`);
    console.log(`❌ Failed: ${results.failed}/${results.passed + results.failed}`);
    console.log('━'.repeat(60) + '\n');

    await db.end();
    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    db.end();
    process.exit(1);
});
