#!/usr/bin/env node

/**
 * check-i18n-coverage.js - I18n Coverage Checker
 *
 * This script scans the codebase for hardcoded English strings
 * that should be using the i18n system instead.
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const translationsPath = path.join(publicDir, 'translations', 'source-texts.json');

// Load translations
let translations = {};
if (fs.existsSync(translationsPath)) {
    translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
}

const translationKeys = Object.keys(translations);

// Patterns to look for hardcoded strings
const patterns = [
    // Common hardcoded messages
    /'(Correct!|Incorrect|Almost|Question|No words|Loading)'/g,
    /"(Correct!|Incorrect|Almost|Question|No words|Loading)"/g,
    /textContent = ['"]([^'"]+)['"]/g,
    /innerHTML = ['"]<[^>]*>([^<]+)</g,
    /placeholder=['"]([^'"]+)['"]/g,
];

console.log('🔍 Checking i18n coverage...\n');

// Files to check
const filesToCheck = [
    'app.js',
    'quiz.js',
    'language-manager.js',
    'api-database.js'
];

let issuesFound = 0;

filesToCheck.forEach(filename => {
    const filepath = path.join(publicDir, filename);
    if (!fs.existsSync(filepath)) {
        return;
    }

    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');

    console.log(`📄 Checking ${filename}...`);

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
            return;
        }

        // Check for common untranslated phrases
        const suspiciousPatterns = [
            { pattern: /['"]Correct!['"]/, key: 'correct' },
            { pattern: /['"]Incorrect['"]/, key: 'incorrect' },
            { pattern: /['"]Almost['"]/, key: 'almost' },
            { pattern: /['"]Question['"]/, key: 'question' },
            { pattern: /['"]No words['"]/, key: 'noWords' },
            { pattern: /['"]Loading['"]/, key: 'loading' },
            { pattern: /['"]Error['"]/, key: 'error' },
            { pattern: /['"]Success['"]/, key: 'success' },
        ];

        suspiciousPatterns.forEach(({ pattern, key }) => {
            if (pattern.test(line)) {
                // Check if it's already using i18n
                if (!line.includes('i18n') && !line.includes('t(')) {
                    console.log(`   ⚠️  Line ${lineNum}: Found hardcoded "${key}"`);
                    console.log(`       ${line.trim()}`);
                    console.log(`       Suggestion: Use i18n.t('${key}')\n`);
                    issuesFound++;
                }
            }
        });
    });
});

// Check HTML files
console.log(`\n📄 Checking index.html...`);
const htmlPath = path.join(publicDir, 'index.html');
if (fs.existsSync(htmlPath)) {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check for elements without data-i18n that might need translation
        if (line.includes('<button') || line.includes('<h2') || line.includes('<h3')) {
            if (!line.includes('data-i18n') &&
                !line.includes('<!--') &&
                !line.includes('emoji') &&
                />[A-Z][a-z]+/.test(line)) {  // Contains capitalized words

                const match = line.match(/>([A-Z][^<]+)</);
                if (match && match[1].length > 1 && match[1].length < 50) {
                    console.log(`   ⚠️  Line ${lineNum}: Element might need data-i18n`);
                    console.log(`       ${line.trim()}\n`);
                    issuesFound++;
                }
            }
        }
    });
}

// Summary
console.log('\n' + '='.repeat(60));
if (issuesFound === 0) {
    console.log('✅ No issues found! All strings appear to be using i18n.');
} else {
    console.log(`⚠️  Found ${issuesFound} potential issues.`);
    console.log('\nRecommendations:');
    console.log('1. Replace hardcoded strings with i18n.t(\'key\')');
    console.log('2. Add data-i18n attributes to HTML elements');
    console.log('3. Add missing keys to translations/source-texts.json');
}
console.log('='.repeat(60) + '\n');

process.exit(issuesFound > 0 ? 1 : 0);
