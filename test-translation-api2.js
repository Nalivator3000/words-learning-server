// Test different ways to import the library
async function testImport() {
    console.log('\n🧪 Testing different import methods...\n');

    // Method 1: Direct require
    try {
        const translate1 = require('@vitalets/google-translate-api');
        console.log('Method 1 - require() returned:', typeof translate1, Object.keys(translate1));
    } catch (err) {
        console.log('Method 1 failed:', err.message);
    }

    // Method 2: Named import
    try {
        const { translate } = require('@vitalets/google-translate-api');
        console.log('Method 2 - { translate } returned:', typeof translate);
    } catch (err) {
        console.log('Method 2 failed:', err.message);
    }

    // Method 3: Default export
    try {
        const lib = require('@vitalets/google-translate-api');
        const translate3 = lib.default;
        console.log('Method 3 - .default returned:', typeof translate3);
    } catch (err) {
        console.log('Method 3 failed:', err.message);
    }

    // Method 4: Try to use it
    try {
        const translate = require('@vitalets/google-translate-api');
        console.log('\nTrying to translate "apple" to German...');
        const result = await translate('apple', { from: 'en', to: 'de' });
        console.log('✅ Success:', result);
    } catch (err) {
        console.log('❌ Failed:', err.message);
    }
}

testImport();
