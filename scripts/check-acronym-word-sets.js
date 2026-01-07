const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway',
    ssl: { rejectUnauthorized: false }
});

const acronymIds = [331, 456, 548, 572, 856, 1033, 1141, 1328, 1497, 1650, 1659, 1907, 2938, 3038, 3082, 3276, 3903, 4123, 4346, 4726, 4811, 5662, 6724];

async function checkWordSets() {
    await client.connect();
    console.log('🔍 Checking which word sets contain acronyms...\n');
    
    const result = await client.query(`
        SELECT
            ws.id as set_id,
            ws.title,
            ws.source_language,
            ws.level as set_level,
            sw.id as word_id,
            sw.word,
            sw.level as word_level
        FROM word_set_items wsi
        JOIN word_sets ws ON wsi.word_set_id = ws.id
        JOIN source_words_english sw ON wsi.word_id = sw.id
        WHERE wsi.word_id = ANY($1)
        ORDER BY ws.id, sw.level, sw.word
    `, [acronymIds]);
    
    console.log(`Found ${result.rows.length} word set items with acronyms\n`);
    
    // Group by word set
    const bySet = {};
    result.rows.forEach(row => {
        if (!bySet[row.set_id]) {
            bySet[row.set_id] = {
                title: row.title,
                source_language: row.source_language,
                set_level: row.set_level,
                words: []
            };
        }
        bySet[row.set_id].words.push(`${row.word} (${row.word_level})`);
    });

    Object.entries(bySet).forEach(([setId, data]) => {
        console.log(`📋 Set #${setId}: "${data.title}"`);
        console.log(`   Language: ${data.source_language} (${data.set_level})`);
        console.log(`   Acronyms (${data.words.length}): ${data.words.join(', ')}`);
        console.log();
    });
    
    await client.end();
}

checkWordSets().catch(console.error);
