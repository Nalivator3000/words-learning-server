// Check what API returns for de-es language pair

async function check() {
  console.log('🔍 Проверка API для de-es...\n');

  const url = 'https://lexybooster.com/api/word-sets?languagePair=de-es';
  console.log('URL:', url);

  const response = await fetch(url);
  const sets = await response.json();

  console.log('\nВсего наборов:', sets.length);
  console.log('\nПервые 10 наборов:');

  sets.slice(0, 10).forEach((set, i) => {
    console.log(`${i+1}. [${set.id}] ${set.title}`);
    console.log(`   source_language: ${set.source_language}`);
    console.log(`   level: ${set.level}, theme: ${set.theme}`);
  });

  // Проверяем какие языки присутствуют
  const languages = new Set(sets.map(s => s.source_language));
  console.log('\n📊 Языки в результатах:');
  languages.forEach(lang => {
    const count = sets.filter(s => s.source_language === lang).length;
    console.log(`  ${lang}: ${count} наборов`);
  });
}

check().catch(err => console.error('Error:', err));
