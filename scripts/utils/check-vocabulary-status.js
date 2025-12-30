#!/usr/bin/env node
/**
 * Check current vocabulary and translation status
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const SOURCE_LANGUAGES = ['german', 'english', 'spanish', 'french', 'chinese', 'portuguese', 'italian', 'arabic', 'turkish'];
const TARGET_LANGUAGES = ['russian', 'english', 'polish', 'romanian', 'serbian', 'ukrainian', 'arabic', 'swahili', 'turkish', 'portuguese', 'italian', 'spanish'];

async function checkSourceWords() {
    console.log('\n📚 SOURCE VOCABULARY STATUS\n');
    console.log('Language'.padEnd(20) + 'Table'.padEnd(35) + 'Count');
    console.log('='.repeat(70));

    const results = [];

    for (const lang of SOURCE_LANGUAGES) {
        const tableName = `source_words_${lang}`;
        try {
            const result = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
            const count = parseInt(result.rows[0].count);
            results.push({ lang, table: tableName, count });

            const status = count >= 10000 ? '✅' : count > 0 ? '⚠️' : '❌';
            console.log(`${status} ${lang.padEnd(18)} ${tableName.padEnd(33)} ${count.toLocaleString()}`);
        } catch (error) {
            console.log(`❌ ${lang.padEnd(18)} ${tableName.padEnd(33)} NOT CREATED`);
            results.push({ lang, table: tableName, count: 0 });
        }
    }

    return results;
}

async function checkTranslations() {
    console.log('\n\n🌍 TRANSLATION STATUS\n');
    console.log('Target Language'.padEnd(20) + 'Table'.padEnd(40) + 'Count');
    console.log('='.repeat(75));

    const results = [];

    for (const lang of TARGET_LANGUAGES) {
        const tableName = `target_translations_${lang}`;
        try {
            const result = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
            const count = parseInt(result.rows[0].count);
            results.push({ lang, table: tableName, count });

            const status = count >= 50000 ? '✅' : count > 10000 ? '⚠️' : count > 0 ? '⏳' : '❌';
            console.log(`${status} ${lang.padEnd(18)} ${tableName.padEnd(38)} ${count.toLocaleString()}`);
        } catch (error) {
            console.log(`❌ ${lang.padEnd(18)} ${tableName.padEnd(38)} NOT CREATED`);
            results.push({ lang, table: tableName, count: 0 });
        }
    }

    return results;
}

async function checkLanguagePairs() {
    console.log('\n\n🔗 AVAILABLE LANGUAGE PAIRS\n');

    try {
        const result = await db.query(`
            SELECT DISTINCT source_lang, COUNT(*) as count
            FROM (
                SELECT source_lang FROM target_translations_russian
                UNION ALL
                SELECT source_lang FROM target_translations_english
                UNION ALL
                SELECT source_lang FROM target_translations_polish
            ) as all_pairs
            GROUP BY source_lang
            ORDER BY source_lang
        `);

        console.log('Source → Targets:');
        for (const row of result.rows) {
            console.log(`  ${row.source_lang.toUpperCase()} → Multiple targets (${row.count.toLocaleString()} translations)`);
        }
    } catch (error) {
        console.log('⚠️  Unable to check language pairs');
    }
}

async function generateSummary(sourceResults, translationResults) {
    console.log('\n\n📊 SUMMARY\n');
    console.log('='.repeat(75));

    const totalSourceWords = sourceResults.reduce((sum, r) => sum + r.count, 0);
    const totalTranslations = translationResults.reduce((sum, r) => sum + r.count, 0);

    const sourcesCreated = sourceResults.filter(r => r.count > 0).length;
    const sourcesComplete = sourceResults.filter(r => r.count >= 10000).length;

    const translationsCreated = translationResults.filter(r => r.count > 0).length;
    const translationsComplete = translationResults.filter(r => r.count >= 50000).length;

    console.log(`\n📚 Source Vocabulary:`);
    console.log(`   Total Languages: ${SOURCE_LANGUAGES.length}`);
    console.log(`   Created: ${sourcesCreated}/${SOURCE_LANGUAGES.length}`);
    console.log(`   Complete (10k+ words): ${sourcesComplete}/${SOURCE_LANGUAGES.length}`);
    console.log(`   Total Words: ${totalSourceWords.toLocaleString()}`);

    console.log(`\n🌍 Translations:`);
    console.log(`   Total Target Languages: ${TARGET_LANGUAGES.length}`);
    console.log(`   Created: ${translationsCreated}/${TARGET_LANGUAGES.length}`);
    console.log(`   Complete (50k+ translations): ${translationsComplete}/${TARGET_LANGUAGES.length}`);
    console.log(`   Total Translations: ${totalTranslations.toLocaleString()}`);

    console.log(`\n💾 Database Size Estimate:`);
    console.log(`   Source words: ~${(totalSourceWords * 50 / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Translations: ~${(totalTranslations * 100 / 1024 / 1024).toFixed(2)} MB`);

    // Missing languages
    const missingSources = sourceResults.filter(r => r.count === 0);
    const missingTranslations = translationResults.filter(r => r.count === 0);

    if (missingSources.length > 0) {
        console.log(`\n⚠️  Missing Source Languages:`);
        missingSources.forEach(r => console.log(`   - ${r.lang}`));
    }

    if (missingTranslations.length > 0) {
        console.log(`\n⚠️  Missing Target Languages:`);
        missingTranslations.forEach(r => console.log(`   - ${r.lang}`));
    }

    console.log('\n' + '='.repeat(75) + '\n');
}

async function main() {
    console.log('\n🔍 LEXYBOOSTER VOCABULARY DATABASE STATUS CHECK');
    console.log('='.repeat(75));

    try {
        const sourceResults = await checkSourceWords();
        const translationResults = await checkTranslations();
        await checkLanguagePairs();
        await generateSummary(sourceResults, translationResults);

        console.log('✅ Status check complete!\n');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        await db.end();
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
