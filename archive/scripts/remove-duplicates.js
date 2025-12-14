const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const inputFile = 'C:\\Users\\Nalivator3000\\Downloads\\words_studying_2025-10-09_smart_fixed.csv';
const outputFile = 'C:\\Users\\Nalivator3000\\Downloads\\words_studying_2025-10-09_final.csv';

const rows = [];
const seenWords = new Set();
const duplicatesRemoved = [];

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        const word = row['Слово'];

        if (seenWords.has(word)) {
            duplicatesRemoved.push(word);
            console.log(`🗑️  Removed duplicate: ${word}`);
        } else {
            seenWords.add(word);
            rows.push(row);
        }
    })
    .on('end', () => {
        const csvWriter = createObjectCsvWriter({
            path: outputFile,
            header: [
                { id: 'Слово', title: 'Слово' },
                { id: 'Пример', title: 'Пример' },
                { id: 'Перевод', title: 'Перевод' },
                { id: 'Перевод примера', title: 'Перевод примера' },
                { id: 'Статус', title: 'Статус' },
                { id: 'Правильных ответов', title: 'Правильных ответов' },
                { id: 'Неправильных ответов', title: 'Неправильных ответов' },
                { id: 'Дата добавления', title: 'Дата добавления' },
                { id: 'Последнее изучение', title: 'Последнее изучение' }
            ]
        });

        csvWriter.writeRecords(rows)
            .then(() => {
                console.log('\n✅ Final CSV saved to:', outputFile);
                console.log(`📊 Unique words: ${rows.length}`);
                console.log(`🗑️  Duplicates removed: ${duplicatesRemoved.length}`);
            });
    });
