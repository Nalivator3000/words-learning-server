#!/usr/bin/env node
/**
 * Create test users for comprehensive UI testing
 * Covers all language pairs, interface languages, and combinations
 */

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Test password for all users
const TEST_PASSWORD = 'Test123!@#';
const TEST_PASSWORD_HASH = hashPassword(TEST_PASSWORD);

// All available languages
const INTERFACE_LANGUAGES = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'pt', 'it', 'ar', 'tr'];
const LEARNING_LANGUAGES = ['de', 'en', 'es', 'fr', 'zh', 'pt', 'it', 'ar', 'tr'];
const NATIVE_LANGUAGES = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'pt', 'it', 'ar', 'tr'];

// Test user profiles for different scenarios
const TEST_USERS = [
    // ========================================
    // COMPREHENSIVE LANGUAGE PAIR TESTING
    // ========================================
    ...NATIVE_LANGUAGES.flatMap(native =>
        LEARNING_LANGUAGES
            .filter(target => target !== native)
            .slice(0, 2) // First 2 targets per native language (reduces total)
            .map((target, idx) => ({
                email: `test-${native}-${target}@lexybooster.test`,
                name: `Test ${native.toUpperCase()}→${target.toUpperCase()}`,
                native_lang: native,
                target_lang: target,
                ui_language: native,
                scenario: `Language Pair: ${native} → ${target}`
            }))
    ),

    // ========================================
    // UI LANGUAGE TESTING
    // ========================================
    ...INTERFACE_LANGUAGES.map(uiLang => ({
        email: `test-ui-${uiLang}@lexybooster.test`,
        name: `UI Test ${uiLang.toUpperCase()}`,
        native_lang: 'en',
        target_lang: 'de',
        ui_language: uiLang,
        scenario: `UI Language: ${uiLang}`
    })),

    // ========================================
    // SPECIAL TEST SCENARIOS
    // ========================================
    {
        email: 'test-beginner@lexybooster.test',
        name: 'Beginner Student',
        native_lang: 'en',
        target_lang: 'de',
        ui_language: 'en',
        scenario: 'Beginner level (A1-A2 only)'
    },
    {
        email: 'test-advanced@lexybooster.test',
        name: 'Advanced Student',
        native_lang: 'ru',
        target_lang: 'en',
        ui_language: 'ru',
        scenario: 'Advanced level (B2-C2)'
    },
    {
        email: 'test-polyglot@lexybooster.test',
        name: 'Polyglot User',
        native_lang: 'en',
        target_lang: 'de',
        ui_language: 'en',
        scenario: 'Multiple language pairs'
    },
    {
        email: 'test-mobile@lexybooster.test',
        name: 'Mobile User',
        native_lang: 'en',
        target_lang: 'es',
        ui_language: 'en',
        scenario: 'Mobile-specific testing'
    },
    {
        email: 'test-rtl@lexybooster.test',
        name: 'RTL Language User',
        native_lang: 'ar',
        target_lang: 'en',
        ui_language: 'ar',
        scenario: 'Right-to-left language testing'
    }
];

async function createTestUser(user) {
    const languageNames = {
        'en': 'English', 'ru': 'Russian', 'de': 'German', 'es': 'Spanish',
        'fr': 'French', 'zh': 'Chinese', 'pt': 'Portuguese', 'it': 'Italian',
        'ar': 'Arabic', 'tr': 'Turkish', 'pl': 'Polish', 'ja': 'Japanese', 'ko': 'Korean'
    };

    try {
        // Check if user exists
        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [user.email]
        );

        if (existing.rows.length > 0) {
            console.log(`  ⚠️  User already exists: ${user.email}`);
            return existing.rows[0].id;
        }

        // Create user (users table schema: id, name, email, password, provider, picture, google_id, apple_id, createdAt, updatedAt)
        const result = await db.query(`
            INSERT INTO users (
                name,
                email,
                password,
                createdAt
            ) VALUES ($1, $2, $3, NOW())
            RETURNING id
        `, [
            user.name,
            user.email,
            TEST_PASSWORD_HASH
        ]);

        const userId = result.rows[0].id;

        // Create language pair for this user
        // from_lang = target language to learn, to_lang = native language
        const nativeName = languageNames[user.native_lang] || user.native_lang.toUpperCase();
        const targetName = languageNames[user.target_lang] || user.target_lang.toUpperCase();
        const pairName = `${targetName} → ${nativeName}`;

        await db.query(`
            INSERT INTO language_pairs (
                user_id,
                name,
                from_lang,
                to_lang,
                is_active
            ) VALUES ($1, $2, $3, $4, $5)
        `, [userId, pairName, user.target_lang, user.native_lang, true]);

        console.log(`  ✅ Created: ${user.email}`);
        console.log(`     Scenario: ${user.scenario}`);
        console.log(`     Language Pair: ${pairName}`);

        return userId;
    } catch (error) {
        console.log(`  ❌ Error creating ${user.email}: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('\n👥 Creating Test Users for Comprehensive Testing');
    console.log('═'.repeat(80));
    console.log(`\nTest Password (all users): ${TEST_PASSWORD}`);
    console.log('\n📊 User Categories:');
    console.log(`   - Language Pair Tests: ${NATIVE_LANGUAGES.length * 2} users`);
    console.log(`   - UI Language Tests: ${INTERFACE_LANGUAGES.length} users`);
    console.log(`   - Special Scenarios: 5 users`);
    console.log(`   Total: ~${TEST_USERS.length} test users\n`);
    console.log('═'.repeat(80));

    let created = 0;
    let skipped = 0;

    for (const user of TEST_USERS) {
        const userId = await createTestUser(user);
        if (userId) {
            created++;
        } else {
            skipped++;
        }
    }

    console.log('\n═'.repeat(80));
    console.log('✅ Test User Creation Complete!');
    console.log(`   Created: ${created} users`);
    console.log(`   Skipped: ${skipped} users (already exist)`);
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: test-[scenario]@lexybooster.test`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('\n📝 Example users:');
    console.log(`   • test-en-de@lexybooster.test - English → German`);
    console.log(`   • test-ru-en@lexybooster.test - Russian → English`);
    console.log(`   • test-ui-zh@lexybooster.test - Chinese UI testing`);
    console.log(`   • test-beginner@lexybooster.test - Beginner scenario`);
    console.log(`   • test-rtl@lexybooster.test - RTL language testing`);
    console.log('═'.repeat(80) + '\n');

    // Generate test users CSV
    const csv = TEST_USERS.map(u =>
        `${u.email},${TEST_PASSWORD},${u.native_lang},${u.target_lang},${u.scenario}`
    ).join('\n');

    const fs = require('fs');
    fs.writeFileSync('tests/ui/test-users.csv', 'email,password,native_lang,target_lang,scenario\n' + csv);
    console.log('✅ Test users list saved to: tests/ui/test-users.csv\n');

    await db.end();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    db.end();
    process.exit(1);
});
