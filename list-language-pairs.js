/**
 * List all possible language pairs in the system
 */

const languages = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
  'russian', 'chinese', 'arabic', 'turkish', 'ukrainian', 'polish',
  'romanian', 'serbian', 'korean', 'hindi', 'japanese', 'swahili'
];

const langMap = {
  english: 'English',
  spanish: 'Spanish',
  french: 'French',
  german: 'German',
  italian: 'Italian',
  portuguese: 'Portuguese',
  russian: 'Russian',
  chinese: 'Chinese',
  arabic: 'Arabic',
  turkish: 'Turkish',
  ukrainian: 'Ukrainian',
  polish: 'Polish',
  romanian: 'Romanian',
  serbian: 'Serbian',
  korean: 'Korean',
  hindi: 'Hindi',
  japanese: 'Japanese',
  swahili: 'Swahili'
};

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║          ВСЕ ВОЗМОЖНЫЕ ЯЗЫКОВЫЕ ПАРЫ                          ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const pairs = [];
for (let i = 0; i < languages.length; i++) {
  for (let j = i + 1; j < languages.length; j++) {
    pairs.push({
      lang1: languages[i],
      lang2: languages[j],
      name1: langMap[languages[i]],
      name2: langMap[languages[j]]
    });
  }
}

console.log(`📊 Всего языков: ${languages.length}`);
console.log(`🔗 Всего пар: ${pairs.length}\n`);

console.log('═'.repeat(65));
console.log('\nВсе языковые пары:\n');

let count = 0;
for (let i = 0; i < languages.length; i++) {
  for (let j = i + 1; j < languages.length; j++) {
    count++;
    const lang1 = langMap[languages[i]];
    const lang2 = langMap[languages[j]];
    console.log(`${count.toString().padStart(3)}. ${lang1.padEnd(12)} ↔ ${lang2}`);
  }
}

console.log('\n' + '═'.repeat(65));
console.log('\n📋 Список для копирования (формат: lang1-lang2):\n');

const pairStrings = [];
for (let i = 0; i < languages.length; i++) {
  for (let j = i + 1; j < languages.length; j++) {
    pairStrings.push(`${languages[i]}-${languages[j]}`);
  }
}

// Group by 5 for better readability
for (let i = 0; i < pairStrings.length; i += 5) {
  const group = pairStrings.slice(i, i + 5);
  console.log(group.join(', '));
}

console.log('\n' + '═'.repeat(65));
console.log('\n🌍 Группировка по первому языку:\n');

for (let i = 0; i < languages.length; i++) {
  const lang1 = langMap[languages[i]];
  const pairsWithLang = [];

  for (let j = i + 1; j < languages.length; j++) {
    pairsWithLang.push(langMap[languages[j]]);
  }

  if (pairsWithLang.length > 0) {
    console.log(`\n${lang1} ↔ (${pairsWithLang.length} пар):`);
    console.log(`   ${pairsWithLang.join(', ')}`);
  }
}

console.log('\n');
