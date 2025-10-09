const fs = require('fs');
const csv = require('csv-parser');

const inputFile = 'C:\\Users\\Nalivator3000\\Downloads\\words_studying_2025-10-09_smart_fixed.csv';

const words = [];
const duplicates = [];

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        const word = row['Слово'];
        if (words.includes(word)) {
            duplicates.push(word);
        } else {
            words.push(word);
        }
    })
    .on('end', () => {
        console.log('📊 Total words:', words.length + duplicates.length);
        console.log('✅ Unique words:', words.length);
        console.log('🔄 Duplicates:', duplicates.length);

        if (duplicates.length > 0) {
            console.log('\nDuplicate words:');
            duplicates.forEach((word, index) => {
                console.log(`  ${index + 1}. ${word}`);
            });
        } else {
            console.log('\n✨ No duplicates found!');
        }
    });
