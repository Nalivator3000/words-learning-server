#!/usr/bin/env node

/**
 * add-language.js - Automated Language Addition Tool
 *
 * This script automatically adds a new language to the application by:
 * 1. Reading the existing translations from source-texts.json
 * 2. Using AI (Claude API) to translate all strings to the new language
 * 3. Updating source-texts.json with the new translations
 * 4. Updating i18n.js to support the new language
 *
 * Usage:
 *   node add-language.js <language_code> <language_name>
 *
 * Example:
 *   node add-language.js ja Japanese
 *   node add-language.js es Spanish
 *   node add-language.js fr French
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const TRANSLATIONS_PATH = path.join(__dirname, 'public', 'translations', 'source-texts.json');
const I18N_PATH = path.join(__dirname, 'public', 'i18n.js');

// Language names in their native form
const LANGUAGE_NAMES = {
    'en': 'English',
    'ru': 'Русский',
    'de': 'Deutsch',
    'es': 'Español',
    'fr': 'Français',
    'it': 'Italiano',
    'ja': '日本語',
    'zh': '中文',
    'ko': '한국어',
    'pt': 'Português',
    'pl': 'Polski',
    'tr': 'Türkçe',
    'ar': 'العربية',
    'hi': 'हिन्दी'
};

class LanguageAdder {
    constructor(languageCode, languageName) {
        this.languageCode = languageCode.toLowerCase();
        this.languageName = languageName;
        this.translations = {};
        this.apiKey = process.env.ANTHROPIC_API_KEY;
    }

    /**
     * Main execution function
     */
    async run() {
        console.log(`\n🌍 Adding new language: ${this.languageName} (${this.languageCode})\n`);

        try {
            // Step 1: Load existing translations
            console.log('📖 Step 1: Loading existing translations...');
            this.loadTranslations();
            console.log(`   ✅ Loaded ${Object.keys(this.translations).length} translation keys\n`);

            // Step 2: Check if language already exists
            const firstKey = Object.keys(this.translations)[0];
            if (this.translations[firstKey][this.languageCode]) {
                console.log(`⚠️  Language '${this.languageCode}' already exists in translations!`);
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                const answer = await new Promise(resolve => {
                    readline.question('Do you want to overwrite it? (yes/no): ', resolve);
                });
                readline.close();

                if (answer.toLowerCase() !== 'yes') {
                    console.log('❌ Aborted.');
                    process.exit(0);
                }
            }

            // Step 3: Translate all strings
            console.log('🤖 Step 2: Translating all strings using AI...');
            console.log('   This may take a minute...\n');
            await this.translateAll();
            console.log('   ✅ All strings translated\n');

            // Step 4: Save translations
            console.log('💾 Step 3: Saving translations...');
            this.saveTranslations();
            console.log('   ✅ Translations saved\n');

            // Step 5: Update i18n.js
            console.log('🔧 Step 4: Updating i18n.js...');
            this.updateI18nFile();
            console.log('   ✅ i18n.js updated\n');

            console.log('✨ Language addition complete!\n');
            console.log(`Next steps:`);
            console.log(`1. Restart your application`);
            console.log(`2. The new language will be available in the language selector`);
            console.log(`3. Test the translations and make manual adjustments if needed\n`);

        } catch (error) {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        }
    }

    /**
     * Load existing translations from source-texts.json
     */
    loadTranslations() {
        if (!fs.existsSync(TRANSLATIONS_PATH)) {
            throw new Error(`Translations file not found: ${TRANSLATIONS_PATH}`);
        }

        const data = fs.readFileSync(TRANSLATIONS_PATH, 'utf8');
        this.translations = JSON.parse(data);
    }

    /**
     * Translate all strings to the new language using Claude API
     */
    async translateAll() {
        // Prepare all strings for batch translation
        const stringsToTranslate = {};

        for (const [key, translations] of Object.entries(this.translations)) {
            // Use English as source if available, otherwise use first available language
            const sourceText = translations.en || translations[Object.keys(translations)[0]];
            stringsToTranslate[key] = sourceText;
        }

        // Check if API key is available
        if (!this.apiKey) {
            console.log('\n⚠️  ANTHROPIC_API_KEY not found in environment variables.');
            console.log('   Using manual translation mode...\n');

            // Manual translation fallback
            for (const [key, sourceText] of Object.entries(stringsToTranslate)) {
                this.translations[key][this.languageCode] = `[${this.languageCode.toUpperCase()}] ${sourceText}`;
            }

            console.log(`\n⚠️  Translations are marked with [${this.languageCode.toUpperCase()}] prefix.`);
            console.log('   Please manually translate them in source-texts.json\n');
            return;
        }

        // Batch translate using Claude API
        const prompt = this.buildTranslationPrompt(stringsToTranslate);
        const translatedData = await this.callClaudeAPI(prompt);

        // Parse and apply translations
        try {
            const translations = JSON.parse(translatedData);

            for (const [key, translatedText] of Object.entries(translations)) {
                if (this.translations[key]) {
                    this.translations[key][this.languageCode] = translatedText;
                }
            }
        } catch (error) {
            console.error('   ⚠️  Failed to parse AI response, using fallback...');
            // Fallback: use placeholder translations
            for (const [key, sourceText] of Object.entries(stringsToTranslate)) {
                this.translations[key][this.languageCode] = `[${this.languageCode.toUpperCase()}] ${sourceText}`;
            }
        }
    }

    /**
     * Build translation prompt for Claude API
     */
    buildTranslationPrompt(strings) {
        return `You are a professional translator. Translate the following UI strings from English to ${this.languageName} (language code: ${this.languageCode}).

IMPORTANT INSTRUCTIONS:
1. Maintain the same tone and style as the original
2. Keep placeholders like {name}, {count} exactly as they are
3. For UI elements, use standard terminology (e.g., "Login", "Register", "Settings")
4. Keep HTML tags if present
5. Return ONLY a valid JSON object with keys mapped to translations
6. Do not add any explanations or comments

Strings to translate (JSON format):
${JSON.stringify(strings, null, 2)}

Return ONLY the JSON object with translations:`;
    }

    /**
     * Call Claude API for translation
     */
    async callClaudeAPI(prompt) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 8000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const options = {
                hostname: 'api.anthropic.com',
                port: 443,
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(responseData);

                        if (response.error) {
                            reject(new Error(response.error.message));
                            return;
                        }

                        if (response.content && response.content[0] && response.content[0].text) {
                            resolve(response.content[0].text);
                        } else {
                            reject(new Error('Invalid API response format'));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse API response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`API request failed: ${error.message}`));
            });

            req.write(data);
            req.end();
        });
    }

    /**
     * Save translations back to source-texts.json
     */
    saveTranslations() {
        const jsonData = JSON.stringify(this.translations, null, 2);
        fs.writeFileSync(TRANSLATIONS_PATH, jsonData, 'utf8');
    }

    /**
     * Update i18n.js to include the new language
     */
    updateI18nFile() {
        let content = fs.readFileSync(I18N_PATH, 'utf8');

        // Update supported languages array
        const languagesRegex = /if \(!(\[['"][a-z,'" ]+['"]\]\.includes\(lang\))\)/;
        const match = content.match(languagesRegex);

        if (match) {
            const currentLangs = match[1];

            // Extract language codes
            const langCodes = currentLangs.match(/'([a-z]+)'/g).map(l => l.replace(/'/g, ''));

            // Add new language if not present
            if (!langCodes.includes(this.languageCode)) {
                langCodes.push(this.languageCode);
                langCodes.sort();

                const newLangsArray = `['${langCodes.join("', '")}'].includes(lang)`;
                content = content.replace(languagesRegex, `if (!${newLangsArray})`);
            }
        }

        // Also update the initial language detection
        const detectionRegex = /} else if \((\[['"][a-z,'" ]+['"]\]\.includes\(langCode\))\)/;
        const detectionMatch = content.match(detectionRegex);

        if (detectionMatch) {
            const currentLangs = detectionMatch[1];
            const langCodes = currentLangs.match(/'([a-z]+)'/g).map(l => l.replace(/'/g, ''));

            if (!langCodes.includes(this.languageCode)) {
                langCodes.push(this.languageCode);
                langCodes.sort();

                const newLangsArray = `['${langCodes.join("', '")}'].includes(langCode)`;
                content = content.replace(detectionRegex, `} else if (${newLangsArray})`);
            }
        }

        fs.writeFileSync(I18N_PATH, content, 'utf8');
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('\n❌ Usage: node add-language.js <language_code> <language_name>');
        console.log('\nExamples:');
        console.log('  node add-language.js ja Japanese');
        console.log('  node add-language.js es Spanish');
        console.log('  node add-language.js fr French');
        console.log('  node add-language.js zh Chinese');
        console.log('  node add-language.js ko Korean\n');
        process.exit(1);
    }

    const [languageCode, ...languageNameParts] = args;
    const languageName = languageNameParts.join(' ');

    const adder = new LanguageAdder(languageCode, languageName);
    adder.run();
}

module.exports = LanguageAdder;
