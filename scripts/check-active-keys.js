import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

// Extract keys from HTML
const htmlKeys = execSync('cd ../public && grep -rh "data-i18n=" index.html | sed \'s/.*data-i18n="//g\' | sed \'s/".*//g\'', {
  cwd: __dirname,
  encoding: 'utf-8'
}).trim().split('\n').filter(Boolean);

// Extract keys from JS
const jsKeys = execSync('cd ../public && grep -rh "i18n\\.t(" *.js | grep -o "i18n\\.t(\'[^\']*\')" | sed "s/i18n\\.t(\'//g" | sed "s/\')//g"', {
  cwd: __dirname,
  encoding: 'utf-8'
}).trim().split('\n').filter(Boolean);

const allActiveKeys = [...new Set([...htmlKeys, ...jsKeys])];

console.log(`📊 Total active keys: ${allActiveKeys.length}\n`);

// Check which active keys are missing Russian translations
const missingRu = [];
allActiveKeys.forEach(key => {
  if (data[key]) {
    if (!data[key].ru || data[key].ru === null || data[key].ru.trim() === '') {
      missingRu.push({ key, source: data[key].source || data[key].en });
    }
  } else {
    missingRu.push({ key, source: '⚠️ KEY NOT FOUND IN TRANSLATIONS' });
  }
});

if (missingRu.length > 0) {
  console.log('❌ Active keys missing Russian translations:\n');
  missingRu.forEach(({ key, source }) => {
    console.log(`   ${key}`);
    console.log(`      Source: "${source}"\n`);
  });
} else {
  console.log('✅ All active keys have Russian translations!');
}

console.log(`\n📈 Coverage: ${allActiveKeys.length - missingRu.length}/${allActiveKeys.length} (${((allActiveKeys.length - missingRu.length) / allActiveKeys.length * 100).toFixed(1)}%)`);
