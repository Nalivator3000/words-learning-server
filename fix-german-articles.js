const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Словарь артиклей для общих существительных A1-A2 уровней
const ARTICLE_MAP = {
  // Weather and Seasons
  'Wetter': 'das',
  'Sonne': 'die',
  'Regen': 'der',
  'Wind': 'der',
  'Schnee': 'der',
  'Wolke': 'die',
  'Frühling': 'der',
  'Sommer': 'der',
  'Herbst': 'der',
  'Winter': 'der',
  'Blitz': 'der',
  'Donner': 'der',
  'Gewitter': 'das',
  'Eis': 'das',
  'Nebel': 'der',

  // House and Furniture
  'Haus': 'das',
  'Wohnung': 'die',
  'Zimmer': 'das',
  'Küche': 'die',
  'Schlafzimmer': 'das',
  'Badezimmer': 'das',
  'Wohnzimmer': 'das',
  'Tür': 'die',
  'Fenster': 'das',
  'Bett': 'das',
  'Tisch': 'der',
  'Stuhl': 'der',
  'Sofa': 'das',
  'Schrank': 'der',
  'Lampe': 'die',
  'Spiegel': 'der',
  'Teppich': 'der',

  // Common Objects
  'Buch': 'das',
  'Stift': 'der',
  'Papier': 'das',
  'Tasche': 'die',
  'Rucksack': 'der',
  'Brille': 'die',
  'Uhr': 'die',
  'Handy': 'das',
  'Schlüssel': 'der',

  // Food and Drinks
  'Kaffee': 'der',
  'Tee': 'der',
  'Milch': 'die',
  'Saft': 'der',
  'Bier': 'das',
  'Wein': 'der',
  'Brot': 'das',
  'Butter': 'die',
  'Käse': 'der',
  'Fleisch': 'das',
  'Fisch': 'der',
  'Huhn': 'das',
  'Apfel': 'der',
  'Banane': 'die',
  'Orange': 'die',
  'Erdbeere': 'die',
  'Salat': 'der',
  'Suppe': 'die',
  'Zucker': 'der',
  'Salz': 'das',
  'Pfeffer': 'der',
  'Öl': 'das',
  'Ei': 'das',
  'Schokolade': 'die',
  'Nachtisch': 'der',
  'Pizza': 'die',
  'Pasta': 'die',
  'Hamburger': 'der',
  'Restaurant': 'das',

  // Sports
  'Tennis': 'das',

  // Common nouns
  'Mann': 'der',
  'Frau': 'die',
  'Kind': 'das',
  'Mutter': 'die',
  'Vater': 'der',
  'Bruder': 'der',
  'Schwester': 'die',
  'Familie': 'die',
  'Freund': 'der',
  'Freundin': 'die',
  'Lehrer': 'der',
  'Lehrerin': 'die',
  'Schule': 'die',
  'Universität': 'die',
  'Arbeit': 'die',
  'Auto': 'das',
  'Bus': 'der',
  'Zug': 'der',
  'Flugzeug': 'das',
  'Fahrrad': 'das',
  'Stadt': 'die',
  'Land': 'das',
  'Park': 'der',
  'Supermarkt': 'der',
  'Bank': 'die',
  'Post': 'die',
  'Krankenhaus': 'das',
  'Apotheke': 'die',
  'Bahnhof': 'der',
  'Flughafen': 'der',
  'Hotel': 'das',
  'Geld': 'das',
  'Euro': 'der',
  'Telefon': 'das',
  'Computer': 'der',
  'Internet': 'das',
  'Email': 'die',
  'Brief': 'der',
  'Paket': 'das',
  'Foto': 'das',
  'Musik': 'die',
  'Film': 'der',
  'Bild': 'das',
  'Zeitung': 'die',
  'Fernsehen': 'das',
  'Radio': 'das',
  'Name': 'der',
  'Nummer': 'die',
  'Adresse': 'die',
  'Straße': 'die',
  'Platz': 'der',
  'Ecke': 'die',
  'Problem': 'das',
  'Frage': 'die',
  'Antwort': 'die',
  'Idee': 'die',
  'Zeit': 'die',
  'Stunde': 'die',
  'Minute': 'die',
  'Sekunde': 'die',
  'Tag': 'der',
  'Woche': 'die',
  'Monat': 'der',
  'Jahr': 'das',
  'Leben': 'das',
  'Welt': 'die',
  'Sprache': 'die',
  'Wort': 'das',
  'Satz': 'der',
  'Text': 'der',
  'Farbe': 'die',
  'Größe': 'die',
  'Preis': 'der',
  'Geschenk': 'das',
  'Party': 'die',
  'Geburtstag': 'der',
  'Urlaub': 'der',
  'Reise': 'die',
  'Meer': 'das',
  'Berg': 'der',
  'Fluss': 'der',
  'See': 'der',
  'Baum': 'der',
  'Blume': 'die',
  'Tier': 'das',
  'Hund': 'der',
  'Katze': 'die',
  'Vogel': 'der',
  'Pferd': 'das',
  'Kuh': 'die',
  'Schwein': 'das',
  'Kleidung': 'die',
  'Hemd': 'das',
  'Hose': 'die',
  'Rock': 'der',
  'Kleid': 'das',
  'Jacke': 'die',
  'Mantel': 'der',
  'Schuh': 'der',
  'Socke': 'die',
  'Hut': 'der',
  'Mütze': 'die',
  'Körper': 'der',
  'Kopf': 'der',
  'Auge': 'das',
  'Nase': 'die',
  'Mund': 'der',
  'Ohr': 'das',
  'Hand': 'die',
  'Fuß': 'der',
  'Arm': 'der',
  'Bein': 'das',
  'Finger': 'der',
  'Haar': 'das',
  'Zahn': 'der',
  'Herz': 'das',
  'Arzt': 'der',
  'Ärztin': 'die',
  'Krankheit': 'die',
  'Medikament': 'das',
  'Schmerz': 'der',
  'Termin': 'der',
  'Sport': 'der',
  'Spiel': 'das',
  'Ball': 'der',
  'Team': 'das',
  'Hobby': 'das',
  'Buch': 'das',
  'Geschichte': 'die',
  'Roman': 'der',
  'Gedicht': 'das',
  'Kunst': 'die',
  'Theater': 'das',
  'Kino': 'das',
  'Konzert': 'das',
  'Ticket': 'das',
  'Eintritt': 'der',
  'Platz': 'der',
  'Reihe': 'die',
  'Vorstellung': 'die',
  'Wasser': 'das',
  'Essen': 'das',
  'Trinken': 'das',
  'Morgen': 'der',
  'Hilfe': 'die',
};

// Слова, которые НЕ должны иметь артикль (не существительные или имена собственные)
const NO_ARTICLE = [
  // Days of week - используются БЕЗ артикля в большинстве контекстов
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',

  // Months - используются БЕЗ артикля
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',

  // Question words - не существительные
  'Wer', 'Was', 'Wo', 'Wohin', 'Woher', 'Wann', 'Warum', 'Wie', 'Welcher', 'Welche', 'Welches',

  // Pronouns
  'Sie',

  // Interjections and expressions
  'Hallo', 'Danke', 'Bitte', 'Ja', 'Nein', 'Entschuldigung', 'Hilfe', 'Heute', 'Morgen',

  // Adjectives/Adverbs when used alone
  'Gut', 'Schlecht',
];

async function fixGermanArticles() {
  try {
    console.log('🔍 Finding German words without articles...\n');

    // Get all single capitalized words without articles
    const wordsResult = await pool.query(`
      SELECT id, word, level, theme
      FROM source_words_german
      WHERE word ~ '^[A-ZÄÖÜ][a-zäöüß]+$'
        AND word NOT LIKE 'der %'
        AND word NOT LIKE 'die %'
        AND word NOT LIKE 'das %'
      ORDER BY id
    `);

    console.log(`Found ${wordsResult.rows.length} capitalized words without articles\n`);

    let fixed = 0;
    let skipped = 0;
    let notFound = 0;

    const updates = [];

    for (const row of wordsResult.rows) {
      const word = row.word;

      // Skip words that shouldn't have articles
      if (NO_ARTICLE.includes(word)) {
        console.log(`⏭️  Skipping: ${word} (no article needed)`);
        skipped++;
        continue;
      }

      // Find article for this word
      const article = ARTICLE_MAP[word];

      if (article) {
        const newWord = `${article} ${word}`;
        updates.push({ id: row.id, oldWord: word, newWord, level: row.level, theme: row.theme });
        console.log(`✅ ${word} → ${newWord}`);
        fixed++;
      } else {
        console.log(`❓ No article found for: ${word} (level: ${row.level}, theme: ${row.theme})`);
        notFound++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Skipped (no article needed): ${skipped}`);
    console.log(`   Not found in dictionary: ${notFound}`);
    console.log(`\n🔄 Applying updates to database...`);

    // Apply updates in transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let deleted = 0;
      let updated = 0;

      for (const update of updates) {
        // Check if word with article already exists
        const existingResult = await client.query(
          'SELECT id FROM source_words_german WHERE word = $1 AND level = $2',
          [update.newWord, update.level]
        );

        if (existingResult.rows.length > 0) {
          // Delete the duplicate (word without article)
          await client.query(
            'DELETE FROM source_words_german WHERE id = $1',
            [update.id]
          );
          console.log(`🗑️  Deleted duplicate: ${update.oldWord} (${update.newWord} already exists)`);
          deleted++;
        } else {
          // Update the word to include article
          await client.query(
            'UPDATE source_words_german SET word = $1 WHERE id = $2',
            [update.newWord, update.id]
          );
          updated++;
        }
      }

      await client.query('COMMIT');
      console.log(`\n✅ Successfully processed ${updates.length} words!`);
      console.log(`   Updated: ${updated}`);
      console.log(`   Deleted (duplicates): ${deleted}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    if (notFound > 0) {
      console.log(`\n⚠️  There are ${notFound} words without articles in the dictionary.`);
      console.log(`   Please add them manually or update the ARTICLE_MAP.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixGermanArticles();
