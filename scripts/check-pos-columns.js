const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkPosColumns() {
    await client.connect();

    console.log('🔍 Checking which source_words_* tables have "pos" column:\n');

    const languages = [
        'english', 'german', 'spanish', 'french', 'arabic', 'chinese',
        'hindi', 'italian', 'japanese', 'korean', 'polish', 'portuguese',
        'romanian', 'russian', 'serbian', 'swahili', 'turkish', 'ukrainian'
    ];

    const withPos = [];
    const withoutPos = [];

    for (const lang of languages) {
        const tableName = `source_words_${lang}`;

        const result = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1 AND column_name = 'pos'
        `, [tableName]);

        if (result.rows.length > 0) {
            withPos.push(lang);
            console.log(`✅ ${tableName}: HAS pos column`);
        } else {
            withoutPos.push(lang);
            console.log(`❌ ${tableName}: NO pos column`);
        }
    }

    console.log('\n📊 Summary:');
    console.log(`\n✅ Languages WITH pos column (${withPos.length}):`);
    console.log(withPos.join(', '));

    console.log(`\n❌ Languages WITHOUT pos column (${withoutPos.length}):`);
    console.log(withoutPos.join(', '));

    await client.end();
}

checkPosColumns().catch(console.error);
