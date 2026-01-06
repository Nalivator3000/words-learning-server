#!/usr/bin/env node

/**
 * Test Google Drive cache functionality
 * This script:
 * 1. Checks if Google Drive cache is initialized
 * 2. Generates a test audio file
 * 3. Uploads it to Google Drive
 * 4. Retrieves it back
 * 5. Verifies the content matches
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

async function testDriveCache() {
    console.log('🧪 Testing Google Drive Cache Integration\n');

    // Initialize Google Drive cache
    const googleDriveCache = require('./utils/google-drive-cache');
    console.log('1️⃣ Initializing Google Drive cache...');

    const initialized = await googleDriveCache.init();

    if (!initialized) {
        console.error('❌ Google Drive cache failed to initialize');
        console.error('   Check GOOGLE_DRIVE_CREDENTIALS_JSON and GOOGLE_DRIVE_FOLDER_ID env vars');
        process.exit(1);
    }

    console.log('✅ Google Drive cache initialized successfully\n');

    // Create test audio data
    console.log('2️⃣ Creating test audio data...');
    const testText = 'test-word-' + Date.now();
    const testLang = 'de-DE';
    const cacheKey = crypto.createHash('md5').update(`${testText}-${testLang}`).digest('hex');
    const testAudio = Buffer.from('FAKE_AUDIO_DATA_FOR_TESTING_' + testText);
    console.log(`   Test text: "${testText}"`);
    console.log(`   Cache key: ${cacheKey}`);
    console.log(`   Audio size: ${testAudio.length} bytes\n`);

    // Upload to Google Drive
    console.log('3️⃣ Uploading test audio to Google Drive...');
    const uploadSuccess = await googleDriveCache.uploadFile(cacheKey, testLang, testAudio);

    if (!uploadSuccess) {
        console.error('❌ Failed to upload to Google Drive');
        process.exit(1);
    }

    console.log('✅ Upload successful\n');

    // Wait a bit for upload to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Retrieve from Google Drive
    console.log('4️⃣ Retrieving test audio from Google Drive...');
    const retrievedAudio = await googleDriveCache.getFile(cacheKey, testLang);

    if (!retrievedAudio) {
        console.error('❌ Failed to retrieve from Google Drive');
        process.exit(1);
    }

    console.log(`✅ Retrieved ${retrievedAudio.length} bytes\n`);

    // Verify content matches
    console.log('5️⃣ Verifying content integrity...');
    const matches = Buffer.compare(testAudio, retrievedAudio) === 0;

    if (!matches) {
        console.error('❌ Content mismatch!');
        console.error(`   Original: ${testAudio.length} bytes`);
        console.error(`   Retrieved: ${retrievedAudio.length} bytes`);
        process.exit(1);
    }

    console.log('✅ Content matches perfectly\n');

    // Get cache stats
    console.log('6️⃣ Getting cache statistics...');
    const stats = await googleDriveCache.getCacheStats();
    console.log('📊 Google Drive Cache Stats:');
    console.log(`   Enabled: ${stats.enabled}`);
    if (stats.enabled) {
        console.log(`   Files: ${stats.cached_items}`);
        console.log(`   Size: ${stats.total_size_mb} MB`);
    }
    console.log('');

    // Cleanup: Delete test file
    console.log('7️⃣ Cleaning up test file...');
    const cleanupResult = await googleDriveCache.clearCache();
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All tests passed! Google Drive cache is working correctly.\n');
    console.log('💡 Next steps:');
    console.log('   1. Use TTS on your app - audio will be automatically cached');
    console.log('   2. Check Google Drive folder for .mp3 files');
    console.log('   3. View cache stats: curl https://your-app.com/api/tts/cache/stats');
}

// Run tests
testDriveCache()
    .then(() => {
        console.log('✅ Test completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Test failed:', err);
        console.error('Stack trace:', err.stack);
        process.exit(1);
    });
