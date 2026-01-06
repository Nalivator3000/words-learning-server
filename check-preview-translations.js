// Check what translations are shown in preview for de-es pair

async function checkPreview() {
  console.log('🔍 Проверка preview для German → Spanish (de-es)\n');

  // Get a German word set
  const setsResponse = await fetch('https://lexybooster.com/api/word-sets?languagePair=de-es');
  const sets = await setsResponse.json();
  const firstSet = sets[0];

  console.log(`Первый набор: ${firstSet.title} (ID: ${firstSet.id})`);
  console.log(`source_language: ${firstSet.source_language}\n`);

  // Get preview with language pair info
  const previewUrl = `https://lexybooster.com/api/word-sets/${firstSet.id}/preview?limit=5&languagePair=de-es&native_lang=es`;
  console.log(`Preview URL: ${previewUrl}\n`);

  const previewResponse = await fetch(previewUrl);
  const preview = await previewResponse.json();

  console.log('📋 Preview слова:');
  if (preview.preview) {
    preview.preview.forEach((word, i) => {
      console.log(`\n${i+1}. ${word.word} (${word.word_lang || 'no lang'})`);
      console.log(`   Перевод: ${word.translation || word.translation_text || 'нет перевода'}`);
      console.log(`   Язык перевода: ${word.translation_lang || 'не указан'}`);
    });
  } else {
    console.log('Preview недоступен');
    console.log('Полный ответ:', JSON.stringify(preview, null, 2));
  }

  console.log('\n\n❓ ПРОВЕРКА:');
  console.log('Ожидается:');
  console.log('  - Немецкие слова: abfahren, acht, achtzehn, alle, alles');
  console.log('  - Переводы на ИСПАНСКОМ: partir/salir, ocho, dieciocho, todo, todo');
  console.log('\nЕсли переводы на английском (to depart, eight, eighteen, all, everything) - это БАГ!');
}

checkPreview().catch(err => console.error('Error:', err));
