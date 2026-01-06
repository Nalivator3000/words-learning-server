// Fix user 61 language pair: should be de-en (learning English from German)
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixUser61() {
    console.log('🔧 Fixing user 61 language pair configuration...\n');

    try {
        // 1. Check current configuration
        const currentResult = await db.query(`
            SELECT ulp.user_id, ulp.active_language_pair_id, lp.from_lang, lp.to_lang, lp.name
            FROM user_learning_profile ulp
            JOIN language_pairs lp ON ulp.active_language_pair_id = lp.id
            WHERE ulp.user_id = 61
        `);

        if (currentResult.rows.length === 0) {
            console.log('❌ User 61 not found!');
            await db.end();
            return;
        }

        const current = currentResult.rows[0];
        console.log('📋 Current configuration:');
        console.log(`   Pair ID: ${current.active_language_pair_id}`);
        console.log(`   Name: ${current.name}`);
        console.log(`   From: ${current.from_lang} → To: ${current.to_lang}`);
        console.log('   This means: learning', current.from_lang, ', native language is', current.to_lang);

        // 2. Find or create de-en language pair
        let deEnPair = await db.query(`
            SELECT * FROM language_pairs
            WHERE from_lang = 'de' AND to_lang = 'en'
            LIMIT 1
        `);

        let deEnPairId;
        if (deEnPair.rows.length === 0) {
            console.log('\n⚠️  de-en language pair not found, creating it...');
            const createResult = await db.query(`
                INSERT INTO language_pairs (name, from_lang, to_lang, is_active, lesson_size)
                VALUES ('German → English', 'de', 'en', true, 20)
                RETURNING id
            `);
            deEnPairId = createResult.rows[0].id;
            console.log('✅ Created de-en pair with ID:', deEnPairId);
        } else {
            deEnPairId = deEnPair.rows[0].id;
            console.log('\n✅ Found existing de-en pair with ID:', deEnPairId);
        }

        // 3. Update user's active language pair
        console.log('\n🔄 Updating user 61 to use de-en pair...');
        await db.query(`
            UPDATE user_learning_profile
            SET active_language_pair_id = $1
            WHERE user_id = 61
        `, [deEnPairId]);

        console.log('✅ User 61 updated successfully!');

        // 4. Verify update
        const verifyResult = await db.query(`
            SELECT ulp.user_id, ulp.active_language_pair_id, lp.from_lang, lp.to_lang, lp.name
            FROM user_learning_profile ulp
            JOIN language_pairs lp ON ulp.active_language_pair_id = lp.id
            WHERE ulp.user_id = 61
        `);

        const updated = verifyResult.rows[0];
        console.log('\n✅ New configuration:');
        console.log(`   Pair ID: ${updated.active_language_pair_id}`);
        console.log(`   Name: ${updated.name}`);
        console.log(`   From: ${updated.from_lang} → To: ${updated.to_lang}`);
        console.log('   This means: learning', updated.from_lang, ', native language is', updated.to_lang);

        console.log('\n🎉 User 61 is now correctly configured to learn German from English!');
        console.log('   User can now access German word sets and German words will be translated to English.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
    }
}

fixUser61().catch(console.error);
