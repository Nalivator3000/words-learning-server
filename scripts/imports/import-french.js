#!/usr/bin/env node
/**
 * Import French vocabulary from frequency lists
 * Source: oprogramador/most-common-words-by-language
 */

const { Pool } = require('pg');
const https = require('https');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// CEFR level distribution (same as EN/ES)
function assignCEFRLevel(rank) {
    if (rank <= 800) return 'A1';
    if (rank <= 1800) return 'A2';
    if (rank <= 3500) return 'B1';
    if (rank <= 5500) return 'B2';
    if (rank <= 8000) return 'C1';
    return 'C2';
}

// Fetch text file from URL
function fetchText(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function importFrench() {
    try {
        console.log('🇫🇷 Starting French vocabulary import...\n');

        const url = 'https://raw.githubusercontent.com/oprogramador/most-common-words-by-language/master/src/resources/french.txt';

        console.log('📥 Fetching French word list from GitHub...');
        const textData = await fetchText(url);
        const words = textData.split('\n')
            .map(w => w.trim())
            .filter(w => w && w.length > 0);

        console.log(`✅ Fetched ${words.length} French words\n`);

        // Import first 10,000 words
        const wordsToImport = Math.min(words.length, 10000);
        console.log(`📝 Importing ${wordsToImport} words into source_words_french...\n`);

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        const levelStats = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };

        for (let i = 0; i < wordsToImport; i++) {
            const word = words[i].toLowerCase().trim();
            const level = assignCEFRLevel(i + 1);

            try {
                await db.query(`
                    INSERT INTO source_words_french (word, level)
                    VALUES ($1, $2)
                    ON CONFLICT (word) DO UPDATE
                    SET level = EXCLUDED.level
                `, [word, level]);

                imported++;
                levelStats[level]++;

                if (imported % 1000 === 0) {
                    console.log(`   Imported ${imported}/${wordsToImport} words...`);
                }
            } catch (error) {
                if (error.message.includes('duplicate key')) {
                    skipped++;
                } else {
                    errors++;
                    console.error(`   ❌ Error importing "${word}":`, error.message);
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ FRENCH IMPORT COMPLETED');
        console.log('='.repeat(70));
        console.log(`✅ Successfully imported: ${imported} words`);
        console.log(`⏭️  Skipped (duplicates): ${skipped} words`);
        console.log(`❌ Errors: ${errors} words`);
        console.log('\nCEFR Level Distribution:');
        console.log(`  A1: ${levelStats.A1} words`);
        console.log(`  A2: ${levelStats.A2} words`);
        console.log(`  B1: ${levelStats.B1} words`);
        console.log(`  B2: ${levelStats.B2} words`);
        console.log(`  C1: ${levelStats.C1} words`);
        console.log(`  C2: ${levelStats.C2} words`);
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Import failed:', error);
        throw error;
    } finally {
        await db.end();
    }
}

importFrench().catch(err => {
    console.error(err);
    process.exit(1);
});
