#!/usr/bin/env node
/**
 * Fix source vocabularies - remove duplicates and ensure exactly 10,000 words each
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const LANGUAGES = ['german', 'english', 'spanish', 'french', 'chinese', 'portuguese', 'italian', 'arabic', 'turkish'];
const TARGET_COUNT = 10000;

async function cleanDuplicates(language) {
    const tableName = `source_words_${language}`;

    console.log(`\n🧹 Cleaning duplicates in ${tableName}...`);

    // First, check for duplicates
    const duplicateCheck = await db.query(`
        SELECT COUNT(*) as total, COUNT(DISTINCT word) as unique_words
        FROM ${tableName}
    `);

    const total = parseInt(duplicateCheck.rows[0].total);
    const unique = parseInt(duplicateCheck.rows[0].unique_words);

    console.log(`   Total rows: ${total.toLocaleString()}`);
    console.log(`   Unique words: ${unique.toLocaleString()}`);

    if (total > unique) {
        console.log(`   Found ${(total - unique).toLocaleString()} duplicates - removing...`);

        // Remove duplicates, keeping the first occurrence
        await db.query(`
            DELETE FROM ${tableName} a
            USING ${tableName} b
            WHERE a.id > b.id AND a.word = b.word
        `);

        console.log(`   ✅ Duplicates removed`);
    } else {
        console.log(`   ✅ No duplicates found`);
    }

    // Check final count
    const finalCount = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(finalCount.rows[0].count);
}

async function trimToTarget(language, currentCount) {
    if (currentCount <= TARGET_COUNT) return currentCount;

    const tableName = `source_words_${language}`;
    const excess = currentCount - TARGET_COUNT;

    console.log(`\n✂️ Trimming ${tableName} (removing ${excess.toLocaleString()} excess words)...`);

    // Keep the first 10,000 words by ID
    await db.query(`
        DELETE FROM ${tableName}
        WHERE id NOT IN (
            SELECT id FROM ${tableName}
            ORDER BY id
            LIMIT ${TARGET_COUNT}
        )
    `);

    console.log(`   ✅ Trimmed to ${TARGET_COUNT.toLocaleString()} words`);
    return TARGET_COUNT;
}

async function main() {
    console.log('\n🔧 SOURCE VOCABULARY FIX UTILITY');
    console.log('='.repeat(75));
    console.log(`Target: ${TARGET_COUNT.toLocaleString()} words per language\n`);

    const results = [];

    for (const lang of LANGUAGES) {
        try {
            console.log(`\n${'='.repeat(75)}`);
            console.log(`📚 Processing ${lang.toUpperCase()}`);
            console.log('='.repeat(75));

            // Step 1: Clean duplicates
            let count = await cleanDuplicates(lang);

            // Step 2: Trim if over target
            count = await trimToTarget(lang, count);

            results.push({ lang, count, status: count === TARGET_COUNT ? '✅' : '⚠️' });

        } catch (error) {
            console.error(`❌ Error processing ${lang}:`, error.message);
            results.push({ lang, count: 0, status: '❌' });
        }
    }

    // Summary
    console.log('\n\n' + '='.repeat(75));
    console.log('📊 FINAL STATUS');
    console.log('='.repeat(75));
    console.log('\nLanguage'.padEnd(20) + 'Count'.padEnd(15) + 'Status');
    console.log('-'.repeat(75));

    for (const result of results) {
        console.log(
            `${result.status} ${result.lang.padEnd(18)} ${result.count.toLocaleString().padEnd(13)} ${
                result.count === TARGET_COUNT ? 'COMPLETE' :
                result.count > TARGET_COUNT ? 'EXCESS' :
                result.count > 0 ? 'INCOMPLETE' : 'ERROR'
            }`
        );
    }

    const complete = results.filter(r => r.count === TARGET_COUNT).length;
    console.log('\n' + '='.repeat(75));
    console.log(`✅ Complete: ${complete}/${LANGUAGES.length}`);
    console.log('='.repeat(75) + '\n');

    await db.end();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
