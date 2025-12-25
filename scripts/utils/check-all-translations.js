#!/usr/bin/env node
/**
 * Check ALL translation tables in database
 * Dynamically discovers all translation pairs
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAllTranslations() {
    try {
        console.log('📊 COMPREHENSIVE TRANSLATION STATUS CHECK');
        console.log('='.repeat(80));
        console.log('⏰', new Date().toLocaleString());
        console.log('');

        // Get ALL translation tables dynamically
        const tablesResult = await db.query(`
            SELECT tablename
            FROM pg_tables
            WHERE tablename LIKE 'target_translations_%'
            AND schemaname = 'public'
            ORDER BY tablename
        `);

        console.log(`🔍 Found ${tablesResult.rows.length} translation tables\n`);

        // Organize by source language
        const bySource = {};
        let totalTranslations = 0;
        const issues = [];

        for (const row of tablesResult.rows) {
            const tableName = row.tablename;

            // Determine source and target
            let source = 'de'; // default German
            let target = tableName.replace('target_translations_', '');

            if (tableName.includes('_from_')) {
                const parts = tableName.replace('target_translations_', '').split('_from_');
                target = parts[0];
                source = parts[1];
            }

            // Get count
            const countResult = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
            const count = parseInt(countResult.rows[0].count);
            totalTranslations += count;

            // Organize by source
            if (!bySource[source]) {
                bySource[source] = { tables: [], totalWords: 0 };
            }
            bySource[source].tables.push({ target, count });
            bySource[source].totalWords += count;

            // Track issues
            if (count === 0) {
                issues.push(`❌ EMPTY: ${source.toUpperCase()} → ${target.toUpperCase()}`);
            } else if (count < 100) {
                issues.push(`⚠️  LOW: ${source.toUpperCase()} → ${target.toUpperCase()}: ${count} words`);
            }
        }

        // Display by source language
        const sourceNames = {
            'de': 'German',
            'en': 'English',
            'pt': 'Portuguese',
            'es': 'Spanish',
            'it': 'Italian',
            'ar': 'Arabic',
            'tr': 'Turkish',
            'fr': 'French',
            'pl': 'Polish',
            'ro': 'Romanian',
            'sr': 'Serbian',
            'sw': 'Swahili',
            'uk': 'Ukrainian',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'hi': 'Hindi'
        };

        for (const [source, data] of Object.entries(bySource).sort()) {
            const langName = sourceNames[source] || source.toUpperCase();
            const flag = {
                'de': '🇩🇪', 'en': '🇬🇧', 'pt': '🇵🇹', 'es': '🇪🇸',
                'it': '🇮🇹', 'ar': '🇸🇦', 'tr': '🇹🇷', 'fr': '🇫🇷',
                'pl': '🇵🇱', 'ro': '🇷🇴', 'sr': '🇷🇸', 'sw': '🇰🇪',
                'uk': '🇺🇦', 'ru': '🇷🇺'
            }[source] || '🌐';

            console.log(`${flag} ${langName.toUpperCase()} SOURCE (${data.totalWords.toLocaleString()} total translations)`);
            console.log('-'.repeat(80));

            // Sort targets alphabetically
            data.tables.sort((a, b) => a.target.localeCompare(b.target));

            for (const { target, count } of data.tables) {
                const status = count === 0 ? '❌' : count < 100 ? '⚠️ ' : '✅';
                const targetName = sourceNames[target] || target.toUpperCase();
                const percentage = count > 0 ? '100.0%' : '0.0%';
                console.log(`${status} ${targetName.padEnd(12)} ${count.toLocaleString().padStart(10)} words (${percentage})`);
            }
            console.log('');
        }

        // Summary
        console.log('='.repeat(80));
        console.log('📈 OVERALL SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total translation tables: ${tablesResult.rows.length}`);
        console.log(`Total translations in DB: ${totalTranslations.toLocaleString()}`);
        console.log(`Source languages: ${Object.keys(bySource).length}`);
        console.log('');

        if (issues.length > 0) {
            console.log('⚠️  ISSUES FOUND:');
            console.log('-'.repeat(80));
            issues.forEach(issue => console.log(issue));
            console.log('');
        } else {
            console.log('✅ ALL TRANSLATION TABLES ARE POPULATED!');
            console.log('');
        }

        console.log('='.repeat(80));

        await db.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkAllTranslations();
