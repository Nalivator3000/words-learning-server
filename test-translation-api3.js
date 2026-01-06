const { translate } = require('@vitalets/google-translate-api');

async function testTranslation() {
    console.log('\n🧪 Testing Google Translate API...\n');

    const testWords = ['apple', 'haus', 'building', 'fire'];

    for (const word of testWords) {
        try {
            console.log(`📝 Translating: "${word}" (en → de)`);
            const result = await translate(word, { from: 'en', to: 'de' });
            console.log(`✅ Result: "${result.text}"`);
            console.log(`   Detected source: ${result.from.language.iso}`);
        } catch (err) {
            console.log(`❌ Failed:`, err.message);
        }
    }
}

testTranslation();
