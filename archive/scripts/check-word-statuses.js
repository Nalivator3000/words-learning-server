// Quick script to check word statuses after migration
const fetch = require('node-fetch');

async function checkStatuses() {
    try {
        const response = await fetch('http://localhost:3001/api/words?userId=5');
        const words = await response.json();

        const learning = words.filter(w =>
            w.status === 'studying' ||
            w.status === 'learning' ||
            w.status.startsWith('review_')
        );

        console.log(`Total words: ${words.length}`);
        console.log(`Learning/Review words: ${learning.length}\n`);

        console.log('Sample words (top 10 by points):');
        learning
            .sort((a, b) => (b.correctcount || 0) - (a.correctcount || 0))
            .slice(0, 10)
            .forEach(w => {
                console.log(`  ${w.word.padEnd(20)} ${(w.correctcount || 0).toString().padStart(3)} pts, status=${w.status.padEnd(12)}, cycle=${w.reviewcycle || 0}`);
            });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkStatuses();
