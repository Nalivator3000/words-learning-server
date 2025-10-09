const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const inputFile = 'C:\\Users\\Nalivator3000\\Downloads\\words_studying_2025-10-09.csv';
const outputFile = 'C:\\Users\\Nalivator3000\\Downloads\\words_studying_2025-10-09_smart_fixed.csv';

const rows = [];

// Function to detect if text is likely German (has German-specific patterns)
function looksLikeGerman(text) {
    if (!text) return false;
    // German characteristics: umlauts, capital nouns, common German words
    const germanPatterns = /[äöüßÄÖÜ]|(?:ich|du|er|sie|es|wir|ihr|Sie|der|die|das|den|dem|ein|eine|einen|und|oder|aber|wenn|dass|nicht|auch|nur|sehr|kann|muss|hat|ist|sind|wird|werden)\b/i;
    const hasGermanChars = germanPatterns.test(text);

    // Also check if it starts with capital letter (German nouns)
    const words = text.split(' ');
    const hasCapitalNouns = words.filter(w => w.length > 3 && w[0] === w[0].toUpperCase()).length > 1;

    return hasGermanChars || hasCapitalNouns;
}

// Function to detect if text is likely Russian
function looksLikeRussian(text) {
    if (!text) return false;
    return /[а-яА-ЯёЁ]/.test(text);
}

fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
        const col1 = row['Слово'] || '';
        const col2 = row['Пример'] || '';
        const col3 = row['Перевод'] || '';

        let word, example, translation;

        // Column 1 is always the German word
        word = col1;

        // Detect which of col2/col3 is German (example) and which is Russian (translation)
        const col2IsGerman = looksLikeGerman(col2);
        const col2IsRussian = looksLikeRussian(col2);
        const col3IsGerman = looksLikeGerman(col3);
        const col3IsRussian = looksLikeRussian(col3);

        if (col2IsGerman && col3IsRussian) {
            // Format: word, example (German), translation (Russian) - CORRECT
            example = col2;
            translation = col3;
        } else if (col2IsRussian && col3IsGerman) {
            // Format: word, translation (Russian), example (German) - SWAP NEEDED
            translation = col2;
            example = col3;
            console.log(`🔄 Swapped row: ${word}`);
        } else {
            // Can't determine, keep as is
            example = col2;
            translation = col3;
            console.log(`⚠️  Uncertain row: ${word} | col2: ${col2.substring(0, 30)} | col3: ${col3.substring(0, 30)}`);
        }

        rows.push({
            'Слово': word,
            'Пример': example,
            'Перевод': translation,
            'Перевод примера': row['Перевод примера'] || '',
            'Статус': row['Статус'] || '',
            'Правильных ответов': row['Правильных ответов'] || '',
            'Неправильных ответов': row['Неправильных ответов'] || '',
            'Дата добавления': row['Дата добавления'] || '',
            'Последнее изучение': row['Последнее изучение'] || ''
        });
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
                console.log('✅ Smart-fixed CSV saved to:', outputFile);
                console.log(`Processed ${rows.length} words`);
            });
    });
