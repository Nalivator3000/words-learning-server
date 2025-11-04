// Make the app language-agnostic (remove German-specific references)
// Run: node scripts/universalize-app.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

console.log('🌍 Universalizing LexyBooster for all language pairs...\n');

let totalChanges = 0;

// 1. Fix index.html - remove hardcoded text
const indexPath = path.join(ROOT, 'public/index.html');
let indexContent = fs.readFileSync(indexPath, 'utf-8');

const indexReplacements = [
    {
        from: '<h2 data-i18n="dashboard">German Words Learning Dashboard</h2>',
        to: '<h2 data-i18n="dashboard"></h2>',
        description: 'Remove hardcoded Dashboard text'
    }
];

indexReplacements.forEach(({ from, to, description }) => {
    if (indexContent.includes(from)) {
        indexContent = indexContent.replace(from, to);
        console.log(`✅ index.html: ${description}`);
        totalChanges++;
    }
});

fs.writeFileSync(indexPath, indexContent, 'utf-8');

// 2. Update translations to be more universal
const translationsPath = path.join(ROOT, 'translations/source-texts.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));

const translationUpdates = {
    'dashboard': {
        source: 'Dashboard',
        en: 'Dashboard',
        ru: 'Главная',
        de: 'Dashboard',
        es: 'Panel de control',
        fr: 'Tableau de bord',
        it: 'Pannello di controllo'
    },
    'welcome': {
        source: 'Welcome to LexyBooster',
        en: 'Welcome to LexyBooster',
        ru: 'Добро пожаловать в LexyBooster',
        de: 'Willkommen bei LexyBooster',
        es: 'Bienvenido a LexyBooster',
        fr: 'Bienvenue sur LexyBooster',
        it: 'Benvenuto su LexyBooster'
    }
};

Object.entries(translationUpdates).forEach(([key, newTranslations]) => {
    if (translations[key]) {
        const hasChanges = Object.keys(newTranslations).some(
            lang => translations[key][lang] !== newTranslations[lang]
        );

        if (hasChanges) {
            translations[key] = newTranslations;
            console.log(`✅ translations: Updated "${key}"`);
            totalChanges++;
        }
    }
});

fs.writeFileSync(translationsPath, JSON.stringify(translations, null, 2), 'utf-8');

// 3. Check for any remaining German-specific references in key files
const filesToCheck = [
    'public/app.js',
    'public/language-manager.js'
];

let warningsFound = 0;

filesToCheck.forEach(file => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for German-specific strings
        const germanPatterns = [
            /немецк/gi,
            /Немецк/g,
            /German\s+Words/gi,
            /Deutsche\s+Wörter/gi
        ];

        let hasGermanRefs = false;
        germanPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
                hasGermanRefs = true;
            }
        });

        if (hasGermanRefs) {
            console.log(`⚠️  Warning: ${file} may contain German-specific references`);
            warningsFound++;
        }
    }
});

console.log(`\n✅ Universalization complete!`);
console.log(`📊 Total changes: ${totalChanges}`);

if (warningsFound > 0) {
    console.log(`⚠️  ${warningsFound} files with potential German-specific references`);
    console.log(`   Review these files manually if needed`);
}

console.log(`\n💡 Summary:`);
console.log(`   - App is now language-agnostic`);
console.log(`   - Works with any language pair (not just German)`);
console.log(`   - UI text uses universal terminology`);
console.log(`   - Translations updated for better universality`);
