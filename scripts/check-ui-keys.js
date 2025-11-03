import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const HTML_FILE = path.join(__dirname, '../public/index.html');

const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));
const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');

// Extract data-i18n keys
const dataI18nMatches = htmlContent.match(/data-i18n="([^"]+)"/g) || [];
const htmlKeys = dataI18nMatches.map(match => match.match(/data-i18n="([^"]+)"/)[1]);

// Extract i18n.t() keys from all JS files
const jsDir = path.join(__dirname, '../public');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
const jsKeys = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf-8');
  const matches = content.match(/i18n\.t\('([^']+)'\)/g) || [];
  matches.forEach(match => {
    const key = match.match(/i18n\.t\('([^']+)'\)/)[1];
    jsKeys.push(key);
  });
});

const allActiveKeys = [...new Set([...htmlKeys, ...jsKeys])];

console.log(`📊 Total active keys found: ${allActiveKeys.length}`);
console.log(`   - From HTML: ${htmlKeys.length}`);
console.log(`   - From JS: ${jsKeys.length}\n`);

// Check which active keys are missing Russian translations
const missingRu = [];
const keyNotFound = [];

allActiveKeys.forEach(key => {
  if (data[key]) {
    if (!data[key].ru || data[key].ru === null || data[key].ru.trim() === '') {
      missingRu.push({ key, source: data[key].source || data[key].en || 'N/A' });
    }
  } else {
    keyNotFound.push(key);
  }
});

if (keyNotFound.length > 0) {
  console.log('⚠️  Keys used but NOT FOUND in translations:\n');
  keyNotFound.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (missingRu.length > 0) {
  console.log('❌ Active keys missing Russian translations:\n');
  missingRu.slice(0, 20).forEach(({ key, source }) => {
    console.log(`   ${key}`);
    if (source && source.length < 80) {
      console.log(`      "${source}"\n`);
    }
  });
  if (missingRu.length > 20) {
    console.log(`   ... and ${missingRu.length - 20} more\n`);
  }
} else {
  console.log('✅ All active keys have Russian translations!');
}

console.log(`\n📈 Russian Coverage: ${allActiveKeys.length - missingRu.length - keyNotFound.length}/${allActiveKeys.length} (${((allActiveKeys.length - missingRu.length - keyNotFound.length) / allActiveKeys.length * 100).toFixed(1)}%)`);
