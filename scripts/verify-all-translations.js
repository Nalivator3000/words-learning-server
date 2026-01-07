/**
 * Verify all word set titles have corresponding translations
 * Find any missing translation keys
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

const fs = require('fs');
const path = require('path');

async function verifyTranslations() {
  try {
    console.log('🔍 Verifying translations for all word sets...\n');

    // Load translations
    const translationsPath = path.join(__dirname, '..', 'public', 'translations', 'source-texts.json');
    const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
    console.log(`📖 Loaded ${Object.keys(translations).length} translation keys\n`);

    // Get all word sets
    const setsResult = await pool.query(`
      SELECT DISTINCT title, source_language, level
      FROM word_sets
      ORDER BY source_language, level, title
    `);

    console.log(`📊 Found ${setsResult.rows.length} unique word set titles\n`);

    const missingKeys = new Set();
    const checkedTitles = new Set();

    // Parse each title and check if translation keys exist
    for (const set of setsResult.rows) {
      const title = set.title;

      if (checkedTitles.has(title)) continue;
      checkedTitles.add(title);

      // Parse pattern: "German A1: family" or "Spanish B2: travel"
      const match = title.match(/^(\w+)\s+([ABC][12]):\s*(.+)$/);

      if (!match) continue;

      const [, sourceLang, level, theme] = match;

      // Convert theme to translation key
      const themeKey = `topic_${theme.toLowerCase().replace(/\s+/g, '_')}`;

      // Check if translation exists
      if (!translations[themeKey]) {
        missingKeys.add(themeKey);
      }
    }

    console.log('📋 Missing Translation Keys:\n');
    if (missingKeys.size === 0) {
      console.log('✅ No missing translation keys found! All word sets can be translated.\n');
    } else {
      console.log(`❌ Found ${missingKeys.size} missing translation keys:\n`);

      const sortedMissing = Array.from(missingKeys).sort();
      sortedMissing.forEach((key, index) => {
        console.log(`${index + 1}. ${key}`);
      });

      console.log('\n💡 Recommendation: Add these keys to source-texts.json\n');
    }

    // Also check for any sets that might not match the pattern
    const nonStandardTitles = setsResult.rows.filter(set => {
      const match = set.title.match(/^(\w+)\s+([ABC][12]):\s*(.+)$/);
      return !match;
    });

    if (nonStandardTitles.length > 0) {
      console.log(`\n⚠️  Found ${nonStandardTitles.length} word sets with non-standard title format:`);
      console.log('(These titles will be displayed as-is without translation)\n');

      nonStandardTitles.slice(0, 10).forEach(set => {
        console.log(`  - "${set.title}" (${set.source_language} ${set.level})`);
      });

      if (nonStandardTitles.length > 10) {
        console.log(`  ... and ${nonStandardTitles.length - 10} more`);
      }
    }

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

verifyTranslations();
