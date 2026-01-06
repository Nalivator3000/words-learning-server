// Test what /api/word-sets/:setId returns for de-es with different parameters

async function testViewSet() {
  const setId = 278; // German A1: Essential Vocabulary 1

  console.log('🧪 Тестирование /api/word-sets/:setId для de-es\n');

  // Test 1: Without parameters (default)
  console.log('Test 1: БЕЗ параметров');
  let url = `https://lexybooster.com/api/word-sets/${setId}`;
  console.log(`URL: ${url}`);
  let response = await fetch(url);
  let data = await response.json();
  console.log(`Первое слово: ${data.words[0].word}`);
  console.log(`Перевод: ${data.words[0].translation}`);
  console.log(`Язык перевода: ${data.words[0].translation_lang || 'не указан'}\n`);

  // Test 2: With native_lang=es
  console.log('Test 2: С параметром native_lang=es');
  url = `https://lexybooster.com/api/word-sets/${setId}?native_lang=es`;
  console.log(`URL: ${url}`);
  response = await fetch(url);
  data = await response.json();
  console.log(`Первое слово: ${data.words[0].word}`);
  console.log(`Перевод: ${data.words[0].translation}`);
  console.log(`Язык перевода: ${data.words[0].translation_lang || 'не указан'}\n`);

  // Test 3: With languagePair=de-es
  console.log('Test 3: С параметром languagePair=de-es');
  url = `https://lexybooster.com/api/word-sets/${setId}?languagePair=de-es`;
  console.log(`URL: ${url}`);
  response = await fetch(url);
  data = await response.json();
  console.log(`Первое слово: ${data.words[0].word}`);
  console.log(`Перевод: ${data.words[0].translation}`);
  console.log(`Язык перевода: ${data.words[0].translation_lang || 'не указан'}\n`);

  console.log('✅ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:');
  console.log('Test 1 (без параметров): английский перевод (по умолчанию)');
  console.log('Test 2 (native_lang=es): ИСПАНСКИЙ перевод ✅');
  console.log('Test 3 (languagePair=de-es): ИСПАНСКИЙ перевод ✅');
}

testViewSet().catch(err => console.error('Error:', err));
