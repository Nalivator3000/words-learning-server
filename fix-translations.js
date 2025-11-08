const fs = require('fs');

// Translation dictionary for common Russian phrases
const translationDict = {
  // Quiz related
  'Вопрос': { en: 'Question', de: 'Frage', es: 'Pregunta', fr: 'Question', it: 'Domanda' },
  'из': { en: 'of', de: 'von', es: 'de', fr: 'sur', it: 'di' },
  'Слово': { en: 'Word', de: 'Wort', es: 'Palabra', fr: 'Mot', it: 'Parola' },
  'Составьте слово': { en: 'Build the word', de: 'Bauen Sie das Wort', es: 'Construya la palabra', fr: 'Construisez le mot', it: 'Costruisci la parola' },
  'Очистить': { en: 'Clear', de: 'Löschen', es: 'Limpiar', fr: 'Effacer', it: 'Cancella' },
  'Ответить': { en: 'Submit', de: 'Absenden', es: 'Enviar', fr: 'Soumettre', it: 'Invia' },
  'Показать ответ': { en: 'Show Answer', de: 'Antwort zeigen', es: 'Mostrar respuesta', fr: 'Afficher la réponse', it: 'Mostra risposta' },

  // Numbers and time
  'дней': { en: 'days', de: 'Tage', es: 'días', fr: 'jours', it: 'giorni' },
  'день': { en: 'day', de: 'Tag', es: 'día', fr: 'jour', it: 'giorno' },

  // Stats
  'Слова': { en: 'Words', de: 'Wörter', es: 'Palabras', fr: 'Mots', it: 'Parole' },
  'Слов выучено': { en: 'Words learned', de: 'Gelernte Wörter', es: 'Palabras aprendidas', fr: 'Mots appris', it: 'Parole imparate' },
  'Процент успешности': { en: 'Success rate', de: 'Erfolgsquote', es: 'Tasa de éxito', fr: 'Taux de réussite', it: 'Tasso di successo' },
  'Отработать это слово': { en: 'Practice this word', de: 'Dieses Wort üben', es: 'Practicar esta palabra', fr: 'Pratiquer ce mot', it: 'Esercita questa parola' },

  // Messages
  'Поздравляем!': { en: 'Congratulations!', de: 'Glückwunsch!', es: '¡Felicidades!', fr: 'Félicitations!', it: 'Congratulazioni!' },
  'Вы достигли цели беглости': { en: 'You have reached fluency goal', de: 'Sie haben Ihr Flüssigkeitsziel erreicht', es: 'Has alcanzado tu objetivo de fluidez', fr: 'Vous avez atteint votre objectif de fluidité', it: 'Hai raggiunto l\'obiettivo di fluidità' },
  'Продолжайте практиковаться': { en: 'Keep practicing', de: 'Üben Sie weiter', es: 'Sigue practicando', fr: 'Continuez à pratiquer', it: 'Continua a esercitarti' },
  'Отличный темп!': { en: 'Excellent pace!', de: 'Ausgezeichnetes Tempo!', es: '¡Excelente ritmo!', fr: 'Excellent rythme!', it: 'Ritmo eccellente!' },
  'Хороший темп обучения!': { en: 'Good learning pace!', de: 'Gutes Lerntempo!', es: '¡Buen ritmo de aprendizaje!', fr: 'Bon rythme d\'apprentissage!', it: 'Buon ritmo di apprendimento!' },
  'Функция будет добавлена': { en: 'Feature will be added', de: 'Funktion wird hinzugefügt', es: 'La función se agregará', fr: 'La fonctionnalité sera ajoutée', it: 'La funzione verrà aggiunta' },

  // XP and achievements
  'XP заработано': { en: 'XP earned', de: 'XP verdient', es: 'XP ganado', fr: 'XP gagné', it: 'XP guadagnato' },
  'заработано': { en: 'earned', de: 'verdient', es: 'ganado', fr: 'gagné', it: 'guadagnato' }
};

// Load source-texts.json
const data = JSON.parse(fs.readFileSync('translations/source-texts.json', 'utf8'));

let fixedCount = 0;
const cyrillicRegex = /[а-яёА-ЯЁ]/;

for (const [key, translations] of Object.entries(data)) {
  // Check each language for Cyrillic
  for (const lang of ['en', 'de', 'es', 'fr', 'it']) {
    const text = translations[lang];
    if (!text || !cyrillicRegex.test(text)) continue;

    // Pattern 1: "Вопрос X (из|of|von|de|sur|di) Y"
    const questionPattern = /Вопрос\s+(\d+)\s+(из|of|von|de|sur|di)\s+(\d+)/;
    if (questionPattern.test(text)) {
      const match = text.match(questionPattern);
      if (lang === 'en') translations.en = `Question ${match[1]} of ${match[3]}`;
      if (lang === 'de') translations.de = `Frage ${match[1]} von ${match[3]}`;
      if (lang === 'es') translations.es = `Pregunta ${match[1]} de ${match[3]}`;
      if (lang === 'fr') translations.fr = `Question ${match[1]} sur ${match[3]}`;
      if (lang === 'it') translations.it = `Domanda ${match[1]} di ${match[3]}`;
      fixedCount++;
      continue;
    }

    // Pattern 2: Dictionary replacements
    let newText = text;
    for (const [ruPhrase, transDict] of Object.entries(translationDict)) {
      if (newText.includes(ruPhrase)) {
        newText = newText.replace(new RegExp(ruPhrase, 'g'), transDict[lang]);
      }
    }

    if (newText !== text) {
      translations[lang] = newText;
      fixedCount++;
    }
  }
}

// Save updated file
fs.writeFileSync('translations/source-texts.json', JSON.stringify(data, null, 2));

console.log(`✅ Fixed ${fixedCount} translations`);
console.log('📝 Updated translations/source-texts.json');
console.log('\n💡 Regenerate UI element lists with:');
console.log('   node generate-translation-lists.js');
