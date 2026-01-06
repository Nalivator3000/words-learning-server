const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

// Sample translations for testing - expand this
const MANUAL_TRANSLATIONS = {
    // Add more translations here manually, or use this as a base
    // Format: "german": "russian"
};

async function batchTranslate() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           BATCH TRANSLATE GERMAN → RUSSIAN                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        const remaining = JSON.parse(fs.readFileSync('remaining-to-translate.json', 'utf8'));
        console.log(`Total remaining: ${remaining.length} words\n`);

        // Split into batches of 50 words for easier processing
        const BATCH_SIZE = 50;
        const batches = [];

        for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
            batches.push(remaining.slice(i, i + BATCH_SIZE));
        }

        console.log(`Split into ${batches.length} batches of ${BATCH_SIZE} words each\n`);

        // Save each batch to a separate file for manual translation
        batches.forEach((batch, index) => {
            const filename = `batch-${String(index + 1).padStart(3, '0')}.txt`;
            const content = batch.map(item =>
                `${item.german}\t${item.english}\t`
            ).join('\n');

            fs.writeFileSync(filename, content);
        });

        console.log(`✅ Created ${batches.length} batch files (batch-001.txt to batch-${String(batches.length).padStart(3, '0')}.txt)`);
        console.log('\nFormat: GERMAN\\tENGLISH\\tRUSSIAN (add Russian translation in 3rd column)\n');

        // Create a simple prompt file to help with translation
        const promptTemplate = `Translate the following German words to Russian.
Provide only the Russian translation, maintaining the same format (one per line).

Examples:
das Haus → дом
die Katze → кошка
gut → хороший

Words to translate:
`;

        fs.writeFileSync('translation-prompt.txt', promptTemplate);
        console.log('✅ Created translation-prompt.txt with instructions\n');

        console.log('📋 Next steps:');
        console.log('1. Open each batch-XXX.txt file');
        console.log('2. Add Russian translations in the 3rd column (tab-separated)');
        console.log('3. Save the file');
        console.log('4. Run apply-batch-translations.js to update database');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await pool.end();
}

batchTranslate().catch(console.error);
