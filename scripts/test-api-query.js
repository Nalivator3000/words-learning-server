const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

(async () => {
    try {
        // Test the API query logic
        const from_lang = 'German';
        const to_lang = 'Russian';

        console.log('Testing API query with:');
        console.log('  from_lang:', from_lang);
        console.log('  to_lang:', to_lang);

        // Normalize languages (like the API does)
        const languageMap = {
            'German': 'de',
            'English': 'en',
            'Russian': 'ru',
            'Spanish': 'es',
            'French': 'fr'
        };

        const normalizeLanguage = (lang) => {
            if (!lang) return null;
            if (lang.length === 2) return lang.toLowerCase();
            return languageMap[lang] || lang.toLowerCase();
        };

        const normalizedFrom = normalizeLanguage(from_lang);
        const normalizedTo = normalizeLanguage(to_lang);

        console.log('\nNormalized:');
        console.log('  from_lang:', normalizedFrom);
        console.log('  to_lang:', normalizedTo);

        // Query collections
        const result = await db.query(
            'SELECT * FROM global_word_collections WHERE is_public = true AND from_lang = $1 AND to_lang = $2 ORDER BY createdAt DESC',
            [normalizedFrom, normalizedTo]
        );

        console.log('\nResults:', result.rows.length, 'collections found');
        result.rows.forEach(row => {
            console.log('  -', row.name, '(from:', row.from_lang, 'to:', row.to_lang, ')');
        });

        // Also check what we have in DB
        const all = await db.query('SELECT name, from_lang, to_lang FROM global_word_collections WHERE is_public = true');
        console.log('\nAll public collections in DB:');
        all.rows.forEach(row => {
            console.log('  -', row.name, '(from:', row.from_lang, 'to:', row.to_lang, ')');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.end();
    }
})();
