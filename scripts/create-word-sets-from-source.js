#!/usr/bin/env node
/**
 * Create word sets from source_words_* tables
 * Organizes vocabulary by level (A1-C2) and theme
 */

require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 5
});

const LANGUAGES = [
    'german', 'english', 'spanish', 'french', 'russian', 'italian',
    'polish', 'portuguese', 'romanian', 'serbian', 'turkish', 'ukrainian',
    'arabic', 'swahili', 'chinese', 'hindi', 'japanese', 'korean'
];

const LANG_DISPLAY_NAMES = {
    'german': 'German', 'english': 'English', 'spanish': 'Spanish',
    'french': 'French', 'russian': 'Russian', 'italian': 'Italian',
    'polish': 'Polish', 'portuguese': 'Portuguese', 'romanian': 'Romanian',
    'serbian': 'Serbian', 'turkish': 'Turkish', 'ukrainian': 'Ukrainian',
    'arabic': 'Arabic', 'swahili': 'Swahili', 'chinese': 'Chinese',
    'hindi': 'Hindi', 'japanese': 'Japanese', 'korean': 'Korean'
};

const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner - Essential vocabulary for absolute beginners',
    'A2': 'Elementary - Basic everyday vocabulary',
    'B1': 'Intermediate - Common words for daily communication',
    'B2': 'Upper Intermediate - Advanced everyday vocabulary',
    'C1': 'Advanced - Complex and nuanced vocabulary',
    'C2': 'Proficiency - Academic and specialized vocabulary'
};

async function createWordSetsTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS word_sets (
            id SERIAL PRIMARY KEY,
            source_language VARCHAR(20) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            level VARCHAR(10),
            theme VARCHAR(50),
            word_count INTEGER DEFAULT 0,
            is_public BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_word_sets_language_public
        ON word_sets(source_language, is_public)
    `);

    console.log('✅ word_sets table created');
}

async function createWordSetsForLanguage(language) {
    const tableName = `source_words_${language}`;
    const displayName = LANG_DISPLAY_NAMES[language];

    console.log(`\n📚 Processing ${displayName}...`);

    // Check if table exists
    const tableExists = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = $1
        )
    `, [tableName]);

    if (!tableExists.rows[0].exists) {
        console.log(`  ⏭️  Skipping (table doesn't exist)`);
        return;
    }

    // Check if level column exists
    const hasLevel = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = $1 AND column_name = 'level'
        )
    `, [tableName]);

    if (!hasLevel.rows[0].exists) {
        console.log(`  ⚠️  No level column - creating basic set`);

        // Create one basic set with all words
        const wordCount = await db.query(`SELECT COUNT(*) FROM ${tableName}`);

        const existing = await db.query(`
            SELECT id FROM word_sets
            WHERE source_language = $1 AND level IS NULL AND theme IS NULL
        `, [language]);

        if (existing.rows.length > 0) {
            await db.query(`
                UPDATE word_sets SET word_count = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [parseInt(wordCount.rows[0].count), existing.rows[0].id]);
        } else {
            await db.query(`
                INSERT INTO word_sets (source_language, title, description, word_count, is_public)
                VALUES ($1, $2, $3, $4, true)
            `, [
                language,
                `${displayName} Complete Vocabulary`,
                `All available ${displayName} words`,
                parseInt(wordCount.rows[0].count)
            ]);
        }

        console.log(`  ✅ Created basic set (${wordCount.rows[0].count} words)`);
        return;
    }

    // Get level distribution
    const levels = await db.query(`
        SELECT level, COUNT(*) as count
        FROM ${tableName}
        WHERE level IS NOT NULL
        GROUP BY level
        ORDER BY level
    `);

    // Create word sets by level
    for (const levelRow of levels.rows) {
        const level = levelRow.level;
        const count = parseInt(levelRow.count);

        const title = `${displayName} ${level}`;
        const description = LEVEL_DESCRIPTIONS[level] || `${displayName} vocabulary at ${level} level`;

        const existing = await db.query(`
            SELECT id FROM word_sets
            WHERE source_language = $1 AND level = $2 AND theme IS NULL
        `, [language, level]);

        if (existing.rows.length > 0) {
            await db.query(`
                UPDATE word_sets SET word_count = $1, description = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [count, description, existing.rows[0].id]);
        } else {
            await db.query(`
                INSERT INTO word_sets (source_language, title, description, level, word_count, is_public)
                VALUES ($1, $2, $3, $4, $5, true)
            `, [language, title, description, level, count]);
        }

        console.log(`  ✅ ${level}: ${count} words`);
    }

    // Check if theme column exists
    const hasTheme = await db.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = $1 AND column_name = 'theme'
        )
    `, [tableName]);

    if (hasTheme.rows[0].exists) {
        // Get top themes
        const themes = await db.query(`
            SELECT theme, COUNT(*) as count
            FROM ${tableName}
            WHERE theme IS NOT NULL
            GROUP BY theme
            ORDER BY count DESC
            LIMIT 10
        `);

        if (themes.rows.length > 0) {
            console.log(`  📂 Top themes:`);
            for (const themeRow of themes.rows) {
                const theme = themeRow.theme;
                const count = parseInt(themeRow.count);

                const title = `${displayName} - ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
                const description = `${displayName} vocabulary related to ${theme}`;

                const existing = await db.query(`
                    SELECT id FROM word_sets
                    WHERE source_language = $1 AND theme = $2 AND level IS NULL
                `, [language, theme]);

                if (existing.rows.length > 0) {
                    await db.query(`
                        UPDATE word_sets SET word_count = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2
                    `, [count, existing.rows[0].id]);
                } else {
                    await db.query(`
                        INSERT INTO word_sets (source_language, title, description, theme, word_count, is_public)
                        VALUES ($1, $2, $3, $4, $5, true)
                    `, [language, title, description, theme, count]);
                }

                console.log(`    - ${theme}: ${count} words`);
            }
        }
    }
}

async function run() {
    try {
        console.log('\n🎯 CREATING WORD SETS FROM SOURCE VOCABULARIES');
        console.log('='.repeat(70));

        await createWordSetsTable();

        for (const language of LANGUAGES) {
            await createWordSetsForLanguage(language);
        }

        // Show summary
        const summary = await db.query(`
            SELECT source_language, COUNT(*) as sets, SUM(word_count) as total_words
            FROM word_sets
            WHERE is_public = true
            GROUP BY source_language
            ORDER BY source_language
        `);

        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(70));
        summary.rows.forEach(row => {
            console.log(`  ${row.source_language}: ${row.sets} sets, ${row.total_words} words`);
        });

        console.log('\n✅ Word sets created successfully!');
        console.log('='.repeat(70));

        await db.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error(err.stack);
        await db.end();
        process.exit(1);
    }
}

run();
