#!/usr/bin/env node

/**
 * Test Cloudinary cache functionality
 * This script:
 * 1. Checks if Cloudinary cache is initialized
 * 2. Generates a test audio file
 * 3. Uploads it to Cloudinary
 * 4. Retrieves it back
 * 5. Verifies the content matches
 */

require('dotenv').config();
const cloudinaryCache = require('./utils/cloudinary-cache');

async function testCloudinaryCache() {
    console.log('🧪 Testing Cloudinary Cache Integration\n');

    // Initialize Cloudinary cache
    console.log('1️⃣ Initializing Cloudinary cache...');

    const initialized = await cloudinaryCache.init();

    if (!initialized) {
        console.error('❌ Cloudinary cache failed to initialize');
        console.error('   Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET env vars');
        process.exit(1);
    }

    console.log('✅ Cloudinary cache initialized successfully\n');

    // Create test audio data
    console.log('2️⃣ Creating test audio data...');
    const testText = 'test-word-' + Date.now();
    const testLang = 'de-DE';
    const crypto = require('crypto');
    const cacheKey = crypto.createHash('md5').update(`${testText}-${testLang}`).digest('hex');
    const testAudio = Buffer.from('FAKE_AUDIO_DATA_FOR_TESTING_' + testText);
    console.log(`   Test text: "${testText}"`);
    console.log(`   Cache key: ${cacheKey}`);
    console.log(`   Audio size: ${testAudio.length} bytes\n`);

    // Upload to Cloudinary
    console.log('3️⃣ Uploading test audio to Cloudinary...');
    const uploadSuccess = await cloudinaryCache.uploadFile(cacheKey, testLang, testAudio);

    if (!uploadSuccess) {
        console.error('❌ Failed to upload to Cloudinary');
        process.exit(1);
    }

    console.log('✅ Upload successful\n');

    // Wait a bit for upload to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Retrieve from Cloudinary
    console.log('4️⃣ Retrieving test audio from Cloudinary...');
    const retrievedAudio = await cloudinaryCache.getFile(cacheKey, testLang);

    if (!retrievedAudio) {
        console.error('❌ Failed to retrieve from Cloudinary');
        console.error('   This might be a CDN propagation delay. Try again in a few seconds.');
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
    const stats = await cloudinaryCache.getCacheStats();
    console.log('📊 Cloudinary Cache Stats:');
    console.log(`   Enabled: ${stats.enabled}`);
    if (stats.enabled) {
        console.log(`   Files: ${stats.cached_items}`);
        console.log(`   Size: ${stats.total_size_mb} MB`);
    }
    console.log('');

    // Cleanup: Delete test file
    console.log('7️⃣ Cleaning up test file...');
    const cleanupResult = await cloudinaryCache.clearCache();

    if (cleanupResult.success) {
        console.log(`✅ Cleanup complete (deleted ${cleanupResult.deleted} files)\n`);
    } else {
        console.log('⚠️ Cleanup had issues, but test passed\n');
    }

    console.log('🎉 All tests passed! Cloudinary cache is working correctly.\n');
    console.log('💡 Next steps:');
    console.log('   1. Use TTS on your app - audio will be automatically cached');
    console.log('   2. Check Cloudinary Media Library for .mp3 files');
    console.log('   3. View cache stats: curl https://lexybooster.com/api/tts/cache/stats');
}

// Run tests
testCloudinaryCache()
    .then(() => {
        console.log('✅ Test completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Test failed:', err);
        console.error('Stack trace:', err.stack);
        process.exit(1);
    });
