/**
 * Extract all hardcoded texts from the application for translation
 * This script scans HTML and JS files to find translatable strings
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUTPUT_FILE = path.join(__dirname, '..', 'translations', 'source-texts.json');

// Patterns to find translatable text
const patterns = {
    // HTML: text between tags, button text, placeholders
    htmlText: /<(?:h[1-6]|p|span|div|button|label|a|th|td)[^>]*>([^<]+)</g,
    htmlPlaceholder: /placeholder=["']([^"']+)["']/g,
    htmlTitle: /title=["']([^"']+)["']/g,

    // JS: String literals in Russian/English
    jsStringLiteral: /['"`]([А-Яа-яЁёA-Za-z\s\-:!?.,%]+)['"`]/g,
};

// Texts to ignore (technical, not user-facing)
const ignorePatterns = [
    /^[0-9]+$/,  // Just numbers
    /^[a-z_]+$/i,  // Variable names
    /^https?:/,  // URLs
    /^\w+\.\w+$/,  // file.ext
    /^[A-Z_]+$/,  // CONSTANTS
    /^#[0-9a-f]+$/i,  // Hex colors
    /^var\(--/,  // CSS variables
    /^\d+px|rem|em|%/,  // CSS values
];

const foundTexts = new Set();

function shouldIgnore(text) {
    text = text.trim();
    if (text.length < 2) return true;
    if (text.length > 200) return true;  // Too long, probably not UI text

    for (const pattern of ignorePatterns) {
        if (pattern.test(text)) return true;
    }

    return false;
}

function extractFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const texts = [];

    // Extract based on file type
    if (filePath.endsWith('.html')) {
        // HTML text content
        let match;
        while ((match = patterns.htmlText.exec(content)) !== null) {
            const text = match[1].trim();
            if (!shouldIgnore(text)) {
                texts.push(text);
            }
        }

        // Placeholders
        while ((match = patterns.htmlPlaceholder.exec(content)) !== null) {
            const text = match[1].trim();
            if (!shouldIgnore(text)) {
                texts.push(text);
            }
        }
    } else if (filePath.endsWith('.js')) {
        // JS string literals
        let match;
        while ((match = patterns.jsStringLiteral.exec(content)) !== null) {
            const text = match[1].trim();
            if (!shouldIgnore(text) && (containsCyrillic(text) || containsMultipleWords(text))) {
                texts.push(text);
            }
        }
    }

    return texts;
}

function containsCyrillic(text) {
    return /[А-Яа-яЁё]/.test(text);
}

function containsMultipleWords(text) {
    return text.split(/\s+/).length >= 2;
}

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules, etc.
            if (file === 'node_modules' || file === '.git') continue;
            scanDirectory(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            console.log(`Scanning: ${path.relative(PUBLIC_DIR, filePath)}`);
            const texts = extractFromFile(filePath);
            texts.forEach(text => foundTexts.add(text));
        }
    }
}

function generateTranslationKeys(texts) {
    const translations = {};

    texts.forEach(text => {
        // Generate a key from the text
        // Simple approach: use first few words
        const words = text.split(/\s+/).slice(0, 3);
        let key = words.join('_')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        // Make key unique
        let finalKey = key;
        let counter = 1;
        while (translations[finalKey]) {
            finalKey = `${key}_${counter}`;
            counter++;
        }

        translations[finalKey] = {
            source: text,
            en: containsCyrillic(text) ? null : text,  // English text as-is
            ru: containsCyrillic(text) ? text : null,  // Russian text as-is
            de: null,
            es: null,
            fr: null,
            it: null,
        };
    });

    return translations;
}

// Main execution
console.log('🔍 Extracting translatable texts from application...\n');

scanDirectory(PUBLIC_DIR);

console.log(`\n✅ Found ${foundTexts.size} unique translatable texts\n`);

// Generate translation structure
const translations = generateTranslationKeys(Array.from(foundTexts));

// Create output directory
const translationsDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(translationsDir)) {
    fs.mkdirSync(translationsDir, { recursive: true });
}

// Save to file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translations, null, 2), 'utf-8');

console.log(`📝 Saved translations to: ${OUTPUT_FILE}`);
console.log(`\n📊 Summary:`);
console.log(`   Total texts: ${Object.keys(translations).length}`);
console.log(`   Russian texts: ${Object.values(translations).filter(t => t.ru).length}`);
console.log(`   English texts: ${Object.values(translations).filter(t => t.en).length}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Review translations/source-texts.json`);
console.log(`   2. Run auto-translate script to fill missing languages`);
console.log(`   3. Update language-manager.js to use these translations`);
