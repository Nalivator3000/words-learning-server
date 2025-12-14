/**
 * migrate-html-i18n.js
 * Migrate HTML files from data-translate to data-i18n
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_FILE = path.join(__dirname, '../public/index.html');

console.log('🔄 Starting HTML i18n migration...\n');

// Read HTML file
let html = fs.readFileSync(HTML_FILE, 'utf-8');

// Count before migration
const beforeCount = (html.match(/data-translate="/g) || []).length;
console.log(`📊 Found ${beforeCount} data-translate attributes\n`);

// Replace data-translate with data-i18n
html = html.replace(/data-translate="/g, 'data-i18n="');

// Count after migration
const afterCount = (html.match(/data-i18n="/g) || []).length;

// Save updated HTML
fs.writeFileSync(HTML_FILE, html, 'utf-8');

console.log(`✅ Migration complete!`);
console.log(`   - Replaced: ${beforeCount} attributes`);
console.log(`   - Total data-i18n: ${afterCount}`);
console.log(`\n📁 Updated: ${HTML_FILE}`);
