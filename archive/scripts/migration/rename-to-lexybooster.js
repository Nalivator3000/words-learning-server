// Rebrand: LexiBooster → LexyBooster
// Run: node scripts/rename-to-lexybooster.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');

// Files to update
const filesToUpdate = [
    'public/index.html',
    'public/manifest.json',
    'public/language-manager.js',
    'public/.well-known/assetlinks.json',
    'translations/source-texts.json',
    'package.json',
    'PLAN.md',
    'TESTING-CHECKLIST.md',
    'TRANSLATION_SYSTEM.md',
    'RAILWAY_DOMAIN_CONFIG.md',
    'GOOGLE_PLAY_SETUP_GUIDE.md',
    'GOOGLE_PLAY_LISTING.md',
    'CUSTOM_DOMAIN_SETUP.md',
    'CONTENT_RATING_ANSWERS.md',
    'ANDROID_STUDIO_TWA_GUIDE.md',
    'RAILWAY_TROUBLESHOOTING.md',
    'TWA_BUILD_GUIDE.md',
    'action-log.md'
];

let totalReplacements = 0;
let filesUpdated = 0;

console.log('🔄 Rebranding: LexiBooster → LexyBooster\n');

filesToUpdate.forEach(relativePath => {
    const filePath = path.join(ROOT, relativePath);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipped (not found): ${relativePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;
    let fileReplacements = 0;

    // Replace all variations
    const replacements = [
        { from: /LexiBooster/g, to: 'LexyBooster' },
        { from: /lexibooster/g, to: 'lexybooster' },
        { from: /LEXIBOOSTER/g, to: 'LEXYBOOSTER' }
    ];

    replacements.forEach(({ from, to }) => {
        const matches = newContent.match(from);
        if (matches) {
            fileReplacements += matches.length;
            newContent = newContent.replace(from, to);
        }
    });

    if (fileReplacements > 0) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ ${relativePath}: ${fileReplacements} replacements`);
        filesUpdated++;
        totalReplacements += fileReplacements;
    } else {
        console.log(`⏭️  ${relativePath}: no changes needed`);
    }
});

console.log(`\n✅ Rebranding complete!`);
console.log(`📊 Files updated: ${filesUpdated}`);
console.log(`📊 Total replacements: ${totalReplacements}`);
console.log(`\n💡 Don't forget to:`);
console.log(`   1. Update app icons (if they contain "Lexi" text)`);
console.log(`   2. Update Android app package name (if needed)`);
console.log(`   3. Rebuild PWA assets`);
console.log(`   4. Update any external documentation`);
