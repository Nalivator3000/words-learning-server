#!/usr/bin/env node
/**
 * Test API translations for Hindi → German
 */

const https = require('https');

function testAPI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function test() {
    console.log('\n' + '='.repeat(80));
    console.log('TEST API TRANSLATIONS');
    console.log('='.repeat(80) + '\n');

    // Test with languagePair parameter
    const url = 'https://words-learning-server-production.up.railway.app/api/word-sets/12223?languagePair=hi-de&native_lang=de';

    console.log('Testing URL:', url);
    console.log('');

    const data = await testAPI(url);

    if (data.words && data.words.length > 0) {
        console.log(`✅ Received ${data.words.length} words\n`);
        console.log('First 5 words:\n');

        data.words.slice(0, 5).forEach((word, i) => {
            console.log(`${i + 1}. ${word.word} → ${word.translation}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('ANALYSIS');
        console.log('='.repeat(80) + '\n');

        // Check if translations are in German
        const firstWord = data.words[0];
        console.log(`First word: ${firstWord.word}`);
        console.log(`Translation: ${firstWord.translation}`);
        console.log('');

        // Common English words that shouldn't appear for German
        const englishWords = ['God', 'Original', 'Head', 'Radio', 'Milk'];
        const germanWords = ['Gott', 'Original', 'Kopf', 'Radio', 'Milch'];

        const hasEnglish = data.words.some(w => englishWords.includes(w.translation));
        const hasGerman = data.words.some(w => germanWords.includes(w.translation));

        if (hasGerman) {
            console.log('✅ TRANSLATIONS ARE IN GERMAN!');
        } else if (hasEnglish) {
            console.log('❌ TRANSLATIONS ARE IN ENGLISH!');
        } else {
            console.log('⚠️  Cannot determine language');
        }

    } else {
        console.log('❌ No words received');
        console.log(JSON.stringify(data, null, 2));
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

test().catch(console.error);
