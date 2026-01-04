#!/usr/bin/env node

/**
 * Preload audio for most popular words
 * Usage:
 *   node scripts/preload-popular-audio.js --dry-run           # Show what would be cached
 *   node scripts/preload-popular-audio.js --max-words 100     # Cache up to 100 words
 *   node scripts/preload-popular-audio.js --estimate          # Estimate cost
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const AudioPreloader = require('../utils/audio-preloader');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const estimate = args.includes('--estimate');
const maxWordsIndex = args.indexOf('--max-words');
const maxWords = maxWordsIndex !== -1 ? parseInt(args[maxWordsIndex + 1], 10) : 500;

async function main() {
    console.log('🎵 Audio Preloader for Popular Words\n');

    // Initialize database
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
    });

    // Initialize Google TTS client
    let ttsClient = null;
    try {
        const textToSpeech = require('@google-cloud/text-to-speech');
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (credentials) {
            ttsClient = new textToSpeech.TextToSpeechClient({
                credentials: JSON.parse(credentials)
            });
            console.log('✅ Google TTS client initialized\n');
        } else {
            console.warn('⚠️ Google TTS not configured (GOOGLE_APPLICATION_CREDENTIALS_JSON missing)\n');
        }
    } catch (error) {
        console.error('❌ Failed to initialize TTS client:', error.message);
        process.exit(1);
    }

    // Initialize Google Drive cache
    const googleDriveCache = require('../utils/google-drive-cache');
    await googleDriveCache.init();

    // Audio cache directory
    const audioDir = path.join(__dirname, '..', 'audio-cache');
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    // Create preloader
    const preloader = new AudioPreloader(pool, ttsClient, googleDriveCache, audioDir);

    try {
        if (estimate) {
            // Estimate cost only
            console.log('💰 Estimating preload cost...\n');
            const cost = await preloader.estimateCost(maxWords);
            console.log(`📊 Estimation:`);
            console.log(`   Uncached words: ${cost.words}`);
            console.log(`   Estimated chars: ${cost.estimatedChars.toLocaleString()}`);
            console.log(`   Estimated cost: $${cost.estimatedCostUSD}`);
            console.log(`\n💡 Note: Actual cost may vary based on word length\n`);
        } else {
            // Run preload
            const result = await preloader.preload({ maxWords, dryRun });

            if (result.dryRun) {
                console.log('\n💡 This was a dry run. Use without --dry-run to actually generate audio.\n');
            }
        }

        console.log('✅ Done!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
