#!/usr/bin/env node

/**
 * Site Checker Script
 * Checks deployed version and fetches actual code from the site
 */

const https = require('https');

const SITE_URL = 'https://lexybooster.com';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function checkSite() {
    console.log('🔍 CHECKING DEPLOYED VERSION ON LEXYBOOSTER.COM\n');
    console.log('='.repeat(60));

    try {
        // 1. Check Service Worker version
        console.log('\n📦 SERVICE WORKER VERSION:');
        const sw = await fetchUrl(`${SITE_URL}/service-worker.js`);
        const swVersion = sw.match(/Version ([\d.]+)/)?.[1];
        const cacheVersion = sw.match(/CACHE_VERSION = '(v[\d.]+)'/)?.[1];
        console.log(`   Version: ${swVersion || 'Unknown'}`);
        console.log(`   Cache: ${cacheVersion || 'Unknown'}`);

        // 2. Check audio-manager.js for filtering
        console.log('\n🔊 AUDIO FILTERING:');
        const audioManager = await fetchUrl(`${SITE_URL}/audio-manager.js`);
        const hasBadVoicePatterns = audioManager.includes('badVoicePatterns');
        const hasAndroidFilter = audioManager.includes('/android/i');
        const hasSamsungFilter = audioManager.includes('/samsung/i');
        console.log(`   ✅ Bad voice filtering: ${hasBadVoicePatterns ? 'Present' : '❌ Missing'}`);
        console.log(`   ✅ Android TTS filter: ${hasAndroidFilter ? 'Present' : '❌ Missing'}`);
        console.log(`   ✅ Samsung TTS filter: ${hasSamsungFilter ? 'Present' : '❌ Missing'}`);

        // 3. Check index.html for auto-update
        console.log('\n🔄 AUTO-UPDATE SYSTEM:');
        const index = await fetchUrl(SITE_URL);
        const hasAutoUpdate = index.includes('showUpdateNotification');
        const hasCountdown = index.includes('Updating in');
        const hasNewVersionBanner = index.includes('NEW VERSION LOADED');
        const audioManagerVersion = index.match(/audio-manager\.js\?v=([\d.]+)/)?.[1];
        console.log(`   ✅ Auto-update function: ${hasAutoUpdate ? 'Present' : '❌ Missing'}`);
        console.log(`   ✅ Countdown timer: ${hasCountdown ? 'Present' : '❌ Missing'}`);
        console.log(`   ✅ "NEW VERSION LOADED" banner: ${hasNewVersionBanner ? 'Present' : '❌ Missing'}`);
        console.log(`   ✅ audio-manager.js version: ${audioManagerVersion || 'No version'}`);

        // 4. Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY:');
        const allGood = swVersion === '5.2.5' &&
                       cacheVersion === 'v5.2.5' &&
                       hasBadVoicePatterns &&
                       hasAutoUpdate &&
                       audioManagerVersion === '5.2.5';

        if (allGood) {
            console.log('   ✅ ALL SYSTEMS GO! v5.2.5 is fully deployed.');
            console.log('   💡 If changes aren\'t visible, clear browser cache.');
        } else {
            console.log('   ⚠️  Some components may not be up to date.');
        }
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error checking site:', error.message);
    }
}

checkSite();
