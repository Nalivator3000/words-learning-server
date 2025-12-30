const data = require('./translation-progress-report.json');

console.log('PHASE 3 DETAILED STATUS:\n');

const phase3 = data.pairs.filter(p => p.phase === 3);
const completed = phase3.filter(p => p.percent === 100);
const inProgress = phase3.filter(p => p.percent > 0 && p.percent < 100);
const pending = phase3.filter(p => p.percent === 0);

console.log('✅ Completed (' + completed.length + '):');
completed.forEach(p => console.log('   ' + p.pair + ': ' + p.translated + '/' + p.total));

console.log('\n⏳ In Progress (' + inProgress.length + '):');
inProgress.forEach(p => console.log('   ' + p.pair + ': ' + p.translated + '/' + p.total + ' (' + p.percent + '%)'));

console.log('\n⬜ Pending (' + pending.length + '):');
pending.slice(0, 5).forEach(p => console.log('   ' + p.pair + ': 0/' + p.total));
if (pending.length > 5) {
    console.log('   ... and ' + (pending.length - 5) + ' more');
}

console.log('\nPhase 4 (Russian) status:');
const phase4 = data.pairs.filter(p => p.phase === 4);
console.log('   NaN% issue detected - source_words_russian table seems to be empty or missing');
console.log('   Total pairs: ' + phase4.length);
