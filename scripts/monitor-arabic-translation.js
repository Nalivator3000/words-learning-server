const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let lastCount = 0;

async function checkProgress() {
    try {
        const totalWords = await db.query('SELECT COUNT(*) FROM source_words_arabic');
        const translatedWords = await db.query('SELECT COUNT(*) FROM target_translations_english_from_ar');

        const total = parseInt(totalWords.rows[0].count);
        const translated = parseInt(translatedWords.rows[0].count);
        const remaining = total - translated;
        const progress = ((translated / total) * 100).toFixed(2);

        const timestamp = new Date().toLocaleTimeString('ru-RU');

        console.log(`\n[${timestamp}] Arabic → English Translation Progress:`);
        console.log(`  Translated: ${translated} / ${total} (${progress}%)`);
        console.log(`  Remaining: ${remaining}`);

        if (lastCount > 0) {
            const translatedSinceLastCheck = translated - lastCount;
            const speed = translatedSinceLastCheck / 5; // words per minute
            const minutesRemaining = Math.ceil(remaining / speed);

            console.log(`  Speed: ~${translatedSinceLastCheck} words in 5 min (~${speed.toFixed(1)} words/min)`);

            if (speed > 0) {
                const hoursRemaining = Math.floor(minutesRemaining / 60);
                const minsRemaining = minutesRemaining % 60;
                console.log(`  ETA: ~${hoursRemaining}h ${minsRemaining}m`);
            }
        }

        lastCount = translated;

        // Show last 3 translations
        const examples = await db.query(`
            SELECT sw.word, tt.translation
            FROM target_translations_english_from_ar tt
            JOIN source_words_arabic sw ON tt.source_word_id = sw.id
            ORDER BY tt.id DESC
            LIMIT 3
        `);

        console.log(`  Latest translations:`);
        examples.rows.forEach(row => {
            console.log(`    ${row.word} → ${row.translation}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function monitor() {
    console.log('Starting Arabic translation monitor (checking every 5 minutes)...\n');
    console.log('Press Ctrl+C to stop\n');

    while (true) {
        await checkProgress();

        // Check if translation is complete
        const result = await db.query(`
            SELECT COUNT(*) FROM source_words_arabic swa
            WHERE NOT EXISTS (
                SELECT 1 FROM target_translations_english_from_ar tt
                WHERE tt.source_word_id = swa.id
            )
        `);

        if (result.rows[0].count === 0) {
            console.log('\n✅ Translation complete! All Arabic words have been translated.');
            await db.end();
            process.exit(0);
        }

        // Sleep for 5 minutes (300 seconds)
        await new Promise(resolve => setTimeout(resolve, 300000));
    }
}

monitor();
