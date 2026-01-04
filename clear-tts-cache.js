// Clear TTS audio cache to force regeneration with new voices
const baseUrl = process.argv[2] || 'https://words-learning-server-production.up.railway.app';
const location = process.argv[3] || 'local'; // 'local', 'drive', or 'all'

async function clearCache() {
    try {
        console.log(`🧹 Clearing TTS cache (${location}) on ${baseUrl}...`);

        const response = await fetch(`${baseUrl}/api/tts/cache/clear?location=${location}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ Cache cleared successfully:`);
            console.log(`   📦 Local: ${result.local_deleted} files deleted`);
            if (result.google_drive) {
                if (result.google_drive.success) {
                    console.log(`   ☁️ Google Drive: ${result.google_drive.deleted_items} files deleted`);
                } else {
                    console.log(`   ⚠️ Google Drive: ${result.google_drive.error || 'Not configured'}`);
                }
            }
            console.log(`💡 New voices will be used for all future TTS requests`);
        } else {
            console.error(`❌ Failed to clear cache:`, result);
        }
    } catch (error) {
        console.error(`❌ Error clearing cache:`, error.message);
    }
}

async function showStats() {
    try {
        console.log(`📊 Fetching cache statistics from ${baseUrl}...`);

        const response = await fetch(`${baseUrl}/api/tts/cache/stats`);
        const stats = await response.json();

        console.log(`\n📦 Local Cache:`);
        console.log(`   Files: ${stats.local.cached_items}`);
        console.log(`   Size: ${stats.local.total_size_mb} MB`);

        console.log(`\n☁️ Google Drive Cache:`);
        if (stats.google_drive.enabled) {
            console.log(`   Files: ${stats.google_drive.cached_items}`);
            console.log(`   Size: ${stats.google_drive.total_size_mb} MB`);
        } else {
            console.log(`   Not configured`);
        }
    } catch (error) {
        console.error(`❌ Error fetching stats:`, error.message);
    }
}

// Run
(async () => {
    await showStats();
    console.log('\n');
    await clearCache();
    console.log('\n');
    await showStats();
})();
