const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway";

const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 30000
});

async function checkPhase4() {
    try {
        console.log('📊 PHASE 4 & 5 STATUS CHECK\n');

        // Check Russian source words
        const ruCount = await db.query('SELECT COUNT(*) FROM source_words_russian');
        console.log(`✅ Russian source words: ${ruCount.rows[0].count}`);

        // Check Ukrainian source words
        const ukCount = await db.query('SELECT COUNT(*) FROM source_words_ukrainian');
        console.log(`✅ Ukrainian source words: ${ukCount.rows[0].count}`);

        console.log('\n📋 Phase 4 pairs (Russian → All):');
        const phase4Pairs = [
            { source: 'ru', target: 'de', table: 'target_translations_german_from_ru' },
            { source: 'ru', target: 'en', table: 'target_translations_english_from_ru' },
            { source: 'ru', target: 'es', table: 'target_translations_spanish_from_ru' },
            { source: 'ru', target: 'fr', table: 'target_translations_french_from_ru' },
            { source: 'ru', target: 'it', table: 'target_translations_italian_from_ru' }
        ];

        for (const pair of phase4Pairs) {
            const tableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = $1
                )
            `, [pair.table]);

            if (tableCheck.rows[0].exists) {
                const count = await db.query(`SELECT COUNT(*) FROM ${pair.table}`);
                const percent = ((count.rows[0].count / 10000) * 100).toFixed(1);
                console.log(`   ${pair.source.toUpperCase()}→${pair.target.toUpperCase()}: ${count.rows[0].count}/10000 (${percent}%)`);
            } else {
                console.log(`   ${pair.source.toUpperCase()}→${pair.target.toUpperCase()}: Table not created (0%)`);
            }
        }

        console.log('\n📋 Phase 5 pairs (Ukrainian → All):');
        const phase5Pairs = [
            { source: 'uk', target: 'de', table: 'target_translations_german_from_uk' },
            { source: 'uk', target: 'en', table: 'target_translations_english_from_uk' },
            { source: 'uk', target: 'es', table: 'target_translations_spanish_from_uk' },
            { source: 'uk', target: 'fr', table: 'target_translations_french_from_uk' },
            { source: 'uk', target: 'it', table: 'target_translations_italian_from_uk' }
        ];

        for (const pair of phase5Pairs) {
            const tableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = $1
                )
            `, [pair.table]);

            if (tableCheck.rows[0].exists) {
                const count = await db.query(`SELECT COUNT(*) FROM ${pair.table}`);
                const percent = ((count.rows[0].count / 10000) * 100).toFixed(1);
                console.log(`   ${pair.source.toUpperCase()}→${pair.target.toUpperCase()}: ${count.rows[0].count}/10000 (${percent}%)`);
            } else {
                console.log(`   ${pair.source.toUpperCase()}→${pair.target.toUpperCase()}: Table not created (0%)`);
            }
        }

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await db.end();
        process.exit(1);
    }
}

checkPhase4();
