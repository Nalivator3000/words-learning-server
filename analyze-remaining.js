const fs = require('fs');
const remaining = JSON.parse(fs.readFileSync('still-remaining.json', 'utf8'));

console.log(`Total remaining: ${remaining.length} words\n`);

// Show sample
console.log('Sample (first 50 words):\n');
remaining.slice(0, 50).forEach((item, i) => {
    console.log(`${i + 1}. ${item.german} = ${item.english}`);
});

// Export first 200 for quick batch
const batch200 = remaining.slice(0, 200);
fs.writeFileSync('batch-200.json', JSON.stringify(batch200, null, 2));
console.log(`\n\nSaved first 200 words to batch-200.json`);
