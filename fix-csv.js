const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const inputFile = 'C:\\Users\\Nalivator3000\\Downloads\\words_studying_2025-10-09.csv';
const outputFile = 'C:\\Users\\Nalivator3000\\Downloads\\words_studying_2025-10-09_fixed.csv';

const rows = [];

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        // Swap "Пример" and "Перевод" columns
        const temp = row['Пример'];
        row['Пример'] = row['Перевод'];
        row['Перевод'] = temp;
        rows.push(row);
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
                console.log('✅ Fixed CSV saved to:', outputFile);
                console.log(`Swapped columns for ${rows.length} words`);
            });
    });
