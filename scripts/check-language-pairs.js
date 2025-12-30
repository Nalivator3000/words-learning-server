#!/usr/bin/env node
/**
 * Check all available language pairs and their translation status
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Language mappings
const LANGUAGES = {
    de: 'German',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    zh: 'Chinese',
    pt: 'Portuguese',
    it: 'Italian',
    ar: 'Arabic',
    tr: 'Turkish',
    ru: 'Russian'
};

// Define all possible pairs
const TRANSLATION_PAIRS = [
    // From German
    { source: 'de', target: 'ru', table: 'target_translations_russian', sourceTable: 'source_words_german' },
    { source: 'de', target: 'en', table: 'target_translations_english', sourceTable: 'source_words_german' },
    { source: 'de', target: 'es', table: 'target_translations_spanish', sourceTable: 'source_words_german' },
    { source: 'de', target: 'fr', table: 'target_translations_french', sourceTable: 'source_words_german' },

    // From English
    { source: 'en', target: 'ru', table: 'target_translations_russian_from_en', sourceTable: 'source_words_english' },
    { source: 'en', target: 'de', table: 'target_translations_german_from_en', sourceTable: 'source_words_english' },
    { source: 'en', target: 'es', table: 'target_translations_spanish_from_en', sourceTable: 'source_words_english' },
    { source: 'en', target: 'fr', table: 'target_translations_french_from_en', sourceTable: 'source_words_english' },

    // From Spanish
    { source: 'es', target: 'ru', table: 'target_translations_russian_from_es', sourceTable: 'source_words_spanish' },
    { source: 'es', target: 'de', table: 'target_translations_german_from_es', sourceTable: 'source_words_spanish' },
    { source: 'es', target: 'en', table: 'target_translations_english_from_es', sourceTable: 'source_words_spanish' },
    { source: 'es', target: 'fr', table: 'target_translations_french_from_es', sourceTable: 'source_words_spanish' },

    // From French
    { source: 'fr', target: 'ru', table: 'target_translations_russian_from_fr', sourceTable: 'source_words_french' },
    { source: 'fr', target: 'de', table: 'target_translations_german_from_fr', sourceTable: 'source_words_french' },
    { source: 'fr', target: 'en', table: 'target_translations_english_from_fr', sourceTable: 'source_words_french' },
    { source: 'fr', target: 'es', table: 'target_translations_spanish_from_fr', sourceTable: 'source_words_french' },

    // From Chinese
    { source: 'zh', target: 'ru', table: 'target_translations_russian_from_zh', sourceTable: 'source_words_chinese' },
    { source: 'zh', target: 'de', table: 'target_translations_german_from_zh', sourceTable: 'source_words_chinese' },
    { source: 'zh', target: 'en', table: 'target_translations_english_from_zh', sourceTable: 'source_words_chinese' },
    { source: 'zh', target: 'es', table: 'target_translations_spanish_from_zh', sourceTable: 'source_words_chinese' },

    // From Portuguese
    { source: 'pt', target: 'ru', table: 'target_translations_russian_from_pt', sourceTable: 'source_words_portuguese' },
    { source: 'pt', target: 'de', table: 'target_translations_german_from_pt', sourceTable: 'source_words_portuguese' },
    { source: 'pt', target: 'en', table: 'target_translations_english_from_pt', sourceTable: 'source_words_portuguese' },
    { source: 'pt', target: 'es', table: 'target_translations_spanish_from_pt', sourceTable: 'source_words_portuguese' },

    // From Italian
    { source: 'it', target: 'ru', table: 'target_translations_russian_from_it', sourceTable: 'source_words_italian' },
    { source: 'it', target: 'de', table: 'target_translations_german_from_it', sourceTable: 'source_words_italian' },
    { source: 'it', target: 'en', table: 'target_translations_english_from_it', sourceTable: 'source_words_italian' },
    { source: 'it', target: 'es', table: 'target_translations_spanish_from_it', sourceTable: 'source_words_italian' },

    // From Arabic
    { source: 'ar', target: 'ru', table: 'target_translations_russian_from_ar', sourceTable: 'source_words_arabic' },
    { source: 'ar', target: 'de', table: 'target_translations_german_from_ar', sourceTable: 'source_words_arabic' },
    { source: 'ar', target: 'en', table: 'target_translations_english_from_ar', sourceTable: 'source_words_arabic' },
    { source: 'ar', target: 'es', table: 'target_translations_spanish_from_ar', sourceTable: 'source_words_arabic' },

    // From Turkish
    { source: 'tr', target: 'ru', table: 'target_translations_russian_from_tr', sourceTable: 'source_words_turkish' },
    { source: 'tr', target: 'de', table: 'target_translations_german_from_tr', sourceTable: 'source_words_turkish' },
    { source: 'tr', target: 'en', table: 'target_translations_english_from_tr', sourceTable: 'source_words_turkish' },
    { source: 'tr', target: 'es', table: 'target_translations_spanish_from_tr', sourceTable: 'source_words_turkish' },
];

async function checkLanguagePairs() {
    console.log('\n🌍 Language Pairs Status Check\n');
    console.log('═'.repeat(80));

    const results = [];

    for (const pair of TRANSLATION_PAIRS) {
        try {
            // Check if translation table exists
            const tableExists = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = $1
                )
            `, [pair.table]);

            if (!tableExists.rows[0].exists) {
                results.push({
                    source: pair.source,
                    target: pair.target,
                    status: 'NOT_CREATED',
                    translations: 0,
                    sourceWords: 0,
                    coverage: 0
                });
                continue;
            }

            // Get source word count
            const sourceCount = await db.query(`
                SELECT COUNT(*) as count FROM ${pair.sourceTable}
            `);

            // Get translation count
            const translationCount = await db.query(`
                SELECT COUNT(*) as count FROM ${pair.table}
            `);

            const sourceWords = parseInt(sourceCount.rows[0].count);
            const translations = parseInt(translationCount.rows[0].count);
            const coverage = sourceWords > 0 ? Math.round((translations / sourceWords) * 100) : 0;

            let status = 'EMPTY';
            if (coverage >= 100) status = 'COMPLETE';
            else if (coverage >= 50) status = 'PARTIAL';
            else if (translations > 0) status = 'STARTED';

            results.push({
                source: pair.source,
                target: pair.target,
                status,
                translations,
                sourceWords,
                coverage
            });

        } catch (error) {
            results.push({
                source: pair.source,
                target: pair.target,
                status: 'ERROR',
                translations: 0,
                sourceWords: 0,
                coverage: 0,
                error: error.message
            });
        }
    }

    // Group by source language
    const grouped = {};
    results.forEach(r => {
        if (!grouped[r.source]) grouped[r.source] = [];
        grouped[r.source].push(r);
    });

    // Display results
    for (const [sourceLang, pairs] of Object.entries(grouped)) {
        console.log(`\n📚 From ${LANGUAGES[sourceLang]} (${sourceLang.toUpperCase()}):`);
        console.log('─'.repeat(80));

        pairs.forEach(p => {
            const statusIcon = {
                'COMPLETE': '✅',
                'PARTIAL': '⚠️',
                'STARTED': '🔄',
                'EMPTY': '⭕',
                'NOT_CREATED': '❌',
                'ERROR': '💥'
            }[p.status] || '❓';

            const pairName = `${sourceLang.toUpperCase()} → ${p.target.toUpperCase()}`;
            const coverage = p.coverage >= 100 ? '100%' : `${p.coverage}%`;

            if (p.status === 'ERROR') {
                console.log(`  ${statusIcon} ${pairName.padEnd(15)} ERROR: ${p.error}`);
            } else if (p.status === 'NOT_CREATED') {
                console.log(`  ${statusIcon} ${pairName.padEnd(15)} Table not created`);
            } else {
                console.log(`  ${statusIcon} ${pairName.padEnd(15)} ${p.translations.toString().padStart(5)}/${p.sourceWords.toString().padStart(5)} (${coverage.padStart(4)})`);
            }
        });
    }

    // Summary statistics
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 Summary:\n');

    const complete = results.filter(r => r.status === 'COMPLETE').length;
    const partial = results.filter(r => r.status === 'PARTIAL').length;
    const started = results.filter(r => r.status === 'STARTED').length;
    const empty = results.filter(r => r.status === 'EMPTY').length;
    const notCreated = results.filter(r => r.status === 'NOT_CREATED').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    console.log(`  ✅ Complete (100%):     ${complete}/${TRANSLATION_PAIRS.length}`);
    console.log(`  ⚠️  Partial (50-99%):   ${partial}/${TRANSLATION_PAIRS.length}`);
    console.log(`  🔄 Started (1-49%):     ${started}/${TRANSLATION_PAIRS.length}`);
    console.log(`  ⭕ Empty (0%):          ${empty}/${TRANSLATION_PAIRS.length}`);
    console.log(`  ❌ Not Created:         ${notCreated}/${TRANSLATION_PAIRS.length}`);
    if (errors > 0) {
        console.log(`  💥 Errors:              ${errors}/${TRANSLATION_PAIRS.length}`);
    }

    const totalTranslations = results.reduce((sum, r) => sum + r.translations, 0);
    console.log(`\n  📝 Total translations:  ${totalTranslations.toLocaleString()}`);

    console.log('\n' + '═'.repeat(80) + '\n');

    await db.end();
}

checkLanguagePairs().catch(err => {
    console.error('❌ Error:', err);
    db.end();
    process.exit(1);
});
