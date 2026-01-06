#!/usr/bin/env node

/**
 * Test Google Drive cache initialization locally
 */

require('dotenv').config();
const googleDriveCache = require('./utils/google-drive-cache');

async function test() {
    console.log('🧪 Testing Google Drive Cache Initialization\n');

    // Check environment variables
    console.log('1️⃣ Checking environment variables...');
    const hasCredentials = !!process.env.GOOGLE_DRIVE_CREDENTIALS_JSON;
    const hasFolderId = !!process.env.GOOGLE_DRIVE_FOLDER_ID;

    console.log(`   GOOGLE_DRIVE_CREDENTIALS_JSON: ${hasCredentials ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GOOGLE_DRIVE_FOLDER_ID: ${hasFolderId ? '✅ Set' : '❌ Missing'}`);

    if (hasCredentials) {
        try {
            const creds = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS_JSON);
            console.log(`   JSON valid: ✅`);
            console.log(`   Service account: ${creds.client_email}`);
            console.log(`   Project ID: ${creds.project_id}`);
        } catch (error) {
            console.log(`   JSON valid: ❌ ${error.message}`);
            process.exit(1);
        }
    }

    if (hasFolderId) {
        console.log(`   Folder ID: ${process.env.GOOGLE_DRIVE_FOLDER_ID}`);
    }

    console.log('');

    if (!hasCredentials || !hasFolderId) {
        console.log('❌ Missing required environment variables');
        console.log('   Please set them in .env file or Railway');
        process.exit(1);
    }

    // Initialize Google Drive cache
    console.log('2️⃣ Initializing Google Drive cache...');
    const result = await googleDriveCache.init();

    if (result) {
        console.log('✅ Google Drive cache initialized successfully!\n');

        // Get stats
        console.log('3️⃣ Getting cache statistics...');
        const stats = await googleDriveCache.getCacheStats();
        console.log('   Stats:', JSON.stringify(stats, null, 2));

    } else {
        console.log('❌ Failed to initialize Google Drive cache');
        console.log('   Check the error message above');
        process.exit(1);
    }

    console.log('\n✅ All tests passed!');
}

test().catch(error => {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
});
