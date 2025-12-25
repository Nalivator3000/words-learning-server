#!/usr/bin/env node
/**
 * Translate remaining 6 language pairs
 * EN→FR, ES→FR, FR→RU, FR→DE, FR→EN, FR→ES
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const RATE_LIMIT_DELAY = 100; // 100ms between requests

// Define the 6 remaining pairs
const PAIRS = [
    { source: 'en', sourceLang: 'english', target: 'fr', targetLang: 'french',
      sourceTable: 'source_words_english', translationTable: 'target_translations_french_from_en' },

    { source: 'es', sourceLang: 'spanish', target: 'fr', targetLang: 'french',
      sourceTable: 'source_words_spanish', translationTable: 'target_translations_french_from_es' },

    { source: 'fr', sourceLang: 'french', target: 'ru', targetLang: 'russian',
      sourceTable: 'source_words_french', translationTable: 'target_translations_russian_from_fr' },

    { source: 'fr', sourceLang: 'french', target: 'de', targetLang: 'german',
      sourceTable: 'source_words_french', translationTable: 'target_translations_german_from_fr' },

    { source: 'fr', sourceLang: 'french', target: 'en', targetLang: 'english',
      sourceTable: 'source_words_french', translationTable: 'target_translations_english_from_fr' },

    { source: 'fr', sourceLang: 'french', target: 'es', targetLang: 'spanish',
      sourceTable: 'source_words_french', translationTable: 'target_translations_spanish_from_fr' }
];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function translateText(text, sourceLang, targetLang) {
    return new Promise((resolve, reject) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const translation = parsed[0][0][0];
                    resolve(translation);
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

async function createTranslationTable(pair) {
    console.log(`\n📋 Creating table: ${pair.translationTable}`);

    await db.query(`
        CREATE TABLE IF NOT EXISTS ${pair.translationTable} (
            id SERIAL PRIMARY KEY,
            source_word_id INTEGER NOT NULL,
            translation TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_word_id) REFERENCES ${pair.sourceTable}(id) ON DELETE CASCADE,
            UNIQUE(source_word_id)
        )
    `);

    console.log(`✅ Table created: ${pair.translationTable}`);
}

async function translatePair(pair, pairIndex) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📚 Pair ${pairIndex + 1}/6: ${pair.source.toUpperCase()} → ${pair.target.toUpperCase()}`);
    console.log(`${'='.repeat(80)}`);

    const startTime = Date.now();

    // Create table if not exists
    await createTranslationTable(pair);

    // Get source words that need translation
    const wordsResult = await db.query(`
        SELECT sw.id, sw.word
        FROM ${pair.sourceTable} sw
        LEFT JOIN ${pair.translationTable} tt ON sw.id = tt.source_word_id
        WHERE tt.id IS NULL
        ORDER BY sw.id
    `);

    const words = wordsResult.rows;
    const totalWords = words.length;

    if (totalWords === 0) {
        console.log(`✅ All words already translated!`);
        return;
    }

    console.log(`\n📝 Words to translate: ${totalWords}`);
    console.log(`⏱️  Estimated time: ${Math.round(totalWords * RATE_LIMIT_DELAY / 1000 / 60)} minutes\n`);

    let translated = 0;
    let errors = 0;
    const logInterval = 100;

    for (const word of words) {
        try {
            const translation = await translateText(word.word, pair.source, pair.target);

            await db.query(`
                INSERT INTO ${pair.translationTable} (source_word_id, translation)
                VALUES ($1, $2)
                ON CONFLICT (source_word_id) DO NOTHING
            `, [word.id, translation]);

            translated++;

            if (translated % logInterval === 0) {
                const elapsed = (Date.now() - startTime) / 1000 / 60;
                const rate = translated / elapsed;
                const remaining = totalWords - translated;
                const eta = remaining / rate;

                console.log(`   ✅ ${translated}/${totalWords} (${elapsed.toFixed(1)}m, ~${eta.toFixed(1)}m left)`);
            }

            await sleep(RATE_LIMIT_DELAY);

        } catch (error) {
            errors++;
            if (errors % 10 === 0) {
                console.log(`   ⚠️  Error translating "${word.word}": ${error.message}`);
            }
        }
    }

    const totalTime = (Date.now() - startTime) / 1000 / 60;

    console.log(`\n✅ Pair ${pairIndex + 1}/6 COMPLETED!`);
    console.log(`   Translated: ${translated}/${totalWords}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Time: ${totalTime.toFixed(1)} minutes`);
}

async function main() {
    console.log('\n🌍 Translating Remaining 6 Language Pairs\n');
    console.log('═'.repeat(80));
    console.log('\n📋 Pairs to translate:');
    PAIRS.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.source.toUpperCase()} → ${p.target.toUpperCase()}`);
    });
    console.log('\n' + '═'.repeat(80));

    const overallStart = Date.now();

    for (let i = 0; i < PAIRS.length; i++) {
        await translatePair(PAIRS[i], i);
    }

    const totalTime = (Date.now() - overallStart) / 1000 / 60;

    console.log('\n' + '═'.repeat(80));
    console.log('✅ ALL 6 PAIRS COMPLETED!');
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)} minutes`);
    console.log('═'.repeat(80) + '\n');

    await db.end();
}

main().catch(err => {
    console.error('❌ Error:', err);
    db.end();
    process.exit(1);
});
