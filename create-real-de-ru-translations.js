require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Basic German→Russian translations (starter set)
const basicTranslations = {
  // Greetings & Basic Phrases
  'Hallo': ['привет', 'здравствуйте'],
  'Danke': ['спасибо'],
  'Bitte': ['пожалуйста'],
  'Ja': ['да'],
  'Nein': ['нет'],
  'Guten Morgen': ['доброе утро'],
  'Guten Tag': ['добрый день'],
  'Guten Abend': ['добрый вечер'],
  'Gute Nacht': ['спокойной ночи'],
  'Auf Wiedersehen': ['до свидания'],
  'Tschüss': ['пока'],
  'Entschuldigung': ['извините', 'простите'],
  'Bitte schön': ['пожалуйста'],
  'Danke schön': ['большое спасибо'],
  'Wie geht es dir?': ['как дела?'],
  'Gut': ['хорошо'],
  'Schlecht': ['плохо'],
  'So so': ['так себе'],

  // Common Words
  'der Mann': ['мужчина', 'человек'],
  'die Frau': ['женщина'],
  'das Kind': ['ребёнок'],
  'der Junge': ['мальчик'],
  'das Mädchen': ['девочка'],
  'die Mutter': ['мать', 'мама'],
  'der Vater': ['отец', 'папа'],
  'die Schwester': ['сестра'],
  'der Bruder': ['брат'],
  'die Familie': ['семья'],
  'der Freund': ['друг', 'приятель'],
  'die Freundin': ['подруга'],

  // Numbers
  'eins': ['один'],
  'zwei': ['два'],
  'drei': ['три'],
  'vier': ['четыре'],
  'fünf': ['пять'],
  'sechs': ['шесть'],
  'sieben': ['семь'],
  'acht': ['восемь'],
  'neun': ['девять'],
  'zehn': ['десять'],

  // Common Nouns
  'das Haus': ['дом'],
  'die Wohnung': ['квартира'],
  'das Auto': ['машина', 'автомобиль'],
  'der Tisch': ['стол'],
  'der Stuhl': ['стул'],
  'das Bett': ['кровать'],
  'das Fenster': ['окно'],
  'die Tür': ['дверь'],
  'das Buch': ['книга'],
  'der Stift': ['ручка', 'карандаш'],
  'das Wasser': ['вода'],
  'das Brot': ['хлеб'],
  'der Käse': ['сыр'],
  'die Milch': ['молоко'],
  'der Kaffee': ['кофе'],
  'der Tee': ['чай'],
  'der Apfel': ['яблоко'],
  'die Banane': ['банан'],
  'die Orange': ['апельсин'],

  // Common Verbs
  'sein': ['быть'],
  'haben': ['иметь'],
  'machen': ['делать'],
  'gehen': ['идти', 'ходить'],
  'kommen': ['приходить', 'приезжать'],
  'essen': ['есть', 'кушать'],
  'trinken': ['пить'],
  'schlafen': ['спать'],
  'arbeiten': ['работать'],
  'lernen': ['учиться', 'учить'],
  'sprechen': ['говорить'],
  'verstehen': ['понимать'],
  'sehen': ['видеть'],
  'hören': ['слышать'],
  'lesen': ['читать'],
  'schreiben': ['писать'],
  'spielen': ['играть'],
  'kaufen': ['покупать'],
  'verkaufen': ['продавать'],

  // Common Adjectives
  'gut': ['хороший', 'хорошо'],
  'schlecht': ['плохой', 'плохо'],
  'groß': ['большой'],
  'klein': ['маленький'],
  'neu': ['новый'],
  'alt': ['старый'],
  'jung': ['молодой'],
  'schön': ['красивый', 'красиво'],
  'hässlich': ['уродливый'],
  'schnell': ['быстрый', 'быстро'],
  'langsam': ['медленный', 'медленно'],
  'warm': ['тёплый'],
  'kalt': ['холодный'],
  'heiß': ['горячий', 'жаркий'],
  'interessant': ['интересный'],
  'langweilig': ['скучный'],
  'wichtig': ['важный'],
  'leicht': ['лёгкий'],
  'schwer': ['тяжёлый', 'трудный'],

  // Time & Date
  'der Tag': ['день'],
  'die Nacht': ['ночь'],
  'der Morgen': ['утро'],
  'der Abend': ['вечер'],
  'die Woche': ['неделя'],
  'der Monat': ['месяц'],
  'das Jahr': ['год'],
  'heute': ['сегодня'],
  'morgen': ['завтра'],
  'gestern': ['вчера'],
  'jetzt': ['сейчас'],
  'immer': ['всегда'],
  'nie': ['никогда'],
  'manchmal': ['иногда'],

  // Colors
  'rot': ['красный'],
  'blau': ['синий', 'голубой'],
  'grün': ['зелёный'],
  'gelb': ['жёлтый'],
  'schwarz': ['чёрный'],
  'weiß': ['белый'],
  'grau': ['серый'],
  'braun': ['коричневый'],
  'orange': ['оранжевый'],
  'rosa': ['розовый'],
  'lila': ['фиолетовый']
};

async function createRealTranslations() {
  const client = await pool.connect();

  try {
    console.log('=== CREATING REAL GERMAN→RUSSIAN TRANSLATIONS ===\n');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const [germanWord, russianTranslations] of Object.entries(basicTranslations)) {
      // Find the German word ID
      const germanResult = await client.query(`
        SELECT id FROM source_words_german
        WHERE LOWER(TRIM(word)) = LOWER(TRIM($1))
        LIMIT 1
      `, [germanWord]);

      if (germanResult.rows.length === 0) {
        console.log(`⚠️  German word not found: ${germanWord}`);
        skippedCount++;
        continue;
      }

      const germanId = germanResult.rows[0].id;

      // Insert all Russian translations
      for (const russianTranslation of russianTranslations) {
        try {
          await client.query(`
            INSERT INTO target_translations_russian_from_de (source_word_id, translation)
            VALUES ($1, $2)
            ON CONFLICT (source_word_id, translation) DO NOTHING
          `, [germanId, russianTranslation]);
          insertedCount++;
        } catch (err) {
          console.log(`Error inserting ${germanWord} → ${russianTranslation}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Inserted ${insertedCount} translations`);
    console.log(`⚠️  Skipped ${skippedCount} words not found in database\n`);

    // Verify
    const countResult = await client.query(`
      SELECT COUNT(*) as count FROM target_translations_russian_from_de
    `);
    console.log(`Total translations in database: ${countResult.rows[0].count}\n`);

    // Show examples
    const examples = await client.query(`
      SELECT
        sw.word as german,
        sw.level,
        t.translation as russian
      FROM target_translations_russian_from_de t
      JOIN source_words_german sw ON t.source_word_id = sw.id
      ORDER BY sw.word
      LIMIT 30
    `);

    console.log('=== SAMPLE TRANSLATIONS ===');
    console.table(examples.rows);

    console.log('\n✅ Basic German→Russian translations created!');
    console.log('\nNext step: You may want to add more translations using translation API or manual input.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createRealTranslations();
