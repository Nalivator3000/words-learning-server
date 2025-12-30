const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:mmxEAfDdbBacecfCfCFdGgfEEBABGGbb@junction.proxy.rlwy.net:22460/railway'
});

async function checkPairs() {
    await client.connect();

    const result = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE tablename LIKE 'target_translations_%_from_%'
        ORDER BY tablename
    `);

    console.log('📊 Total translation pairs:', result.rows.length);
    console.log('');

    // Count by source language
    const bySource = {};
    result.rows.forEach(row => {
        const source = row.tablename.split('_from_')[1];
        bySource[source] = (bySource[source] || 0) + 1;
    });

    console.log('📈 Pairs by source language:');
    Object.entries(bySource).sort().forEach(([source, count]) => {
        console.log(`  ${source.toUpperCase()}: ${count} pairs`);
    });
    console.log('');

    // Check counts for each pair
    console.log('🔍 Checking translation counts...');
    for (const row of result.rows) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${row.tablename}`);
        const count = parseInt(countResult.rows[0].count);
        const [target, source] = row.tablename.replace('target_translations_', '').split('_from_');

        if (count === 0) {
            console.log(`  ❌ ${source.toUpperCase()} → ${target.toUpperCase()}: ${count} words (EMPTY)`);
        } else {
            console.log(`  ✅ ${source.toUpperCase()} → ${target.toUpperCase()}: ${count.toLocaleString()} words`);
        }
    }

    await client.end();
}

checkPairs().catch(console.error);
