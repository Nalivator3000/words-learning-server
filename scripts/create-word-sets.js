#!/usr/bin/env node
/**
 * Create thematic word sets collections
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const WORD_SETS = [
    {
        name: 'Travel Essentials',
        description: 'Essential vocabulary for travelers',
        language: 'de',
        level: 'A1',
        keywords: ['flughafen', 'hotel', 'zug', 'taxi', 'bahnhof', 'ticket', 'koffer', 'pass', 'visum']
    },
    {
        name: 'Food & Dining',
        description: 'Restaurant and food vocabulary',
        language: 'de',
        level: 'A1',
        keywords: ['restaurant', 'essen', 'trinken', 'speisekarte', 'kellner', 'rechnung', 'brot', 'wasser', 'kaffee']
    },
    {
        name: 'Business German',
        description: 'Professional workplace vocabulary',
        language: 'de',
        level: 'B2',
        keywords: ['unternehmen', 'geschäft', 'vertrag', 'verhandlung', 'meeting', 'kollege', 'projekt']
    },
    {
        name: 'Daily Routines',
        description: 'Everyday activities vocabulary',
        language: 'en',
        level: 'A1',
        keywords: ['wake', 'sleep', 'eat', 'work', 'study', 'shower', 'breakfast', 'lunch', 'dinner']
    },
    {
        name: 'Technology',
        description: 'Modern tech vocabulary',
        language: 'en',
        level: 'B1',
        keywords: ['computer', 'internet', 'software', 'app', 'website', 'email', 'password', 'download']
    }
];

async function createWordSets() {
    console.log('\n📚 Creating Word Sets Collections...\n');

    for (const set of WORD_SETS) {
        try {
            // Create word set
            const languagePair = set.language + '-ru'; // Default to Russian target
            const result = await db.query(`
                INSERT INTO word_sets (name, description, language_pair, level, theme, is_official, created_at)
                VALUES ($1, $2, $3, $4, $5, true, NOW())
                RETURNING id
            `, [set.name, set.description, languagePair, set.level, 'general']);

            const setId = result.rows[0].id;
            console.log('✅ Created:', set.name, '(ID:', setId + ')');

            // Find and add words
            const sourceTable = 'source_words_' + (set.language === 'de' ? 'german' : set.language === 'en' ? 'english' : 'spanish');

            let addedWords = 0;
            for (const keyword of set.keywords) {
                try {
                    const wordResult = await db.query(`
                        SELECT id FROM ${sourceTable}
                        WHERE LOWER(word) LIKE $1
                        LIMIT 1
                    `, ['%' + keyword.toLowerCase() + '%']);

                    if (wordResult.rows.length > 0) {
                        await db.query(`
                            INSERT INTO word_set_words (word_set_id, word_id)
                            VALUES ($1, $2)
                            ON CONFLICT DO NOTHING
                        `, [setId, wordResult.rows[0].id]);
                        addedWords++;
                    }
                } catch (e) {
                    // Skip if word not found
                }
            }

            console.log('   Added', addedWords, 'words');

        } catch (error) {
            console.error('❌ Error creating', set.name + ':', error.message);
        }
    }

    console.log('\n✅ Word Sets creation completed!\n');
    await db.end();
}

createWordSets();
