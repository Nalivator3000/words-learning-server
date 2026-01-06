/**
 * Universal script to add themes and create thematic word sets for any language
 * Usage: node create-thematic-sets-universal.js <language>
 * Example: node create-thematic-sets-universal.js english
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

// Universal theme keywords (работает для романских языков и английского)
const THEME_KEYWORDS = {
  // Basic themes - keywords that work across many languages
  'family': {
    english: ['family', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'uncle', 'aunt', 'cousin', 'husband', 'wife', 'parent', 'child', 'baby', 'relative'],
    french: ['famille', 'père', 'mère', 'fils', 'fille', 'frère', 'sœur', 'grand-père', 'grand-mère', 'oncle', 'tante', 'cousin', 'mari', 'femme', 'papa', 'maman', 'bébé', 'enfant', 'parent'],
    italian: ['famiglia', 'padre', 'madre', 'figlio', 'figlia', 'fratello', 'sorella', 'nonno', 'nonna', 'zio', 'zia', 'cugino', 'marito', 'moglie', 'papà', 'mamma', 'bambino', 'genitore'],
    portuguese: ['família', 'pai', 'mãe', 'filho', 'filha', 'irmão', 'irmã', 'avô', 'avó', 'tio', 'tia', 'primo', 'marido', 'esposa', 'papai', 'mamãe', 'bebê', 'criança', 'parente']
  },

  'food': {
    english: ['food', 'eat', 'drink', 'water', 'coffee', 'tea', 'milk', 'bread', 'meat', 'chicken', 'fish', 'rice', 'fruit', 'vegetable', 'apple', 'orange', 'banana', 'tomato', 'beer', 'wine', 'restaurant', 'menu', 'breakfast', 'lunch', 'dinner', 'kitchen', 'cook', 'recipe', 'delicious', 'hungry', 'thirsty'],
    french: ['nourriture', 'manger', 'boire', 'eau', 'café', 'thé', 'lait', 'pain', 'viande', 'poulet', 'poisson', 'riz', 'fruit', 'légume', 'pomme', 'orange', 'banane', 'tomate', 'bière', 'vin', 'restaurant', 'menu', 'petit-déjeuner', 'déjeuner', 'dîner', 'cuisine', 'cuisiner', 'recette', 'délicieux', 'faim', 'soif'],
    italian: ['cibo', 'mangiare', 'bere', 'acqua', 'caffè', 'tè', 'latte', 'pane', 'carne', 'pollo', 'pesce', 'riso', 'frutta', 'verdura', 'mela', 'arancia', 'banana', 'pomodoro', 'birra', 'vino', 'ristorante', 'menu', 'colazione', 'pranzo', 'cena', 'cucina', 'cucinare', 'ricetta', 'delizioso', 'fame', 'sete'],
    portuguese: ['comida', 'comer', 'beber', 'água', 'café', 'chá', 'leite', 'pão', 'carne', 'frango', 'peixe', 'arroz', 'fruta', 'vegetal', 'maçã', 'laranja', 'banana', 'tomate', 'cerveja', 'vinho', 'restaurante', 'menu', 'café da manhã', 'almoço', 'jantar', 'cozinha', 'cozinhar', 'receita', 'delicioso', 'fome', 'sede']
  },

  'travel': {
    english: ['travel', 'trip', 'plane', 'train', 'bus', 'taxi', 'car', 'bicycle', 'station', 'airport', 'hotel', 'ticket', 'luggage', 'passport', 'visa', 'tourist', 'guide', 'map', 'street', 'avenue'],
    french: ['voyage', 'voyager', 'avion', 'train', 'bus', 'taxi', 'voiture', 'vélo', 'gare', 'aéroport', 'hôtel', 'billet', 'bagage', 'passeport', 'visa', 'touriste', 'guide', 'carte', 'rue', 'avenue'],
    italian: ['viaggio', 'viaggiare', 'aereo', 'treno', 'autobus', 'taxi', 'auto', 'bicicletta', 'stazione', 'aeroporto', 'albergo', 'biglietto', 'bagaglio', 'passaporto', 'visto', 'turista', 'guida', 'mappa', 'strada', 'viale'],
    portuguese: ['viagem', 'viajar', 'avião', 'trem', 'ônibus', 'táxi', 'carro', 'bicicleta', 'estação', 'aeroporto', 'hotel', 'bilhete', 'bagagem', 'passaporte', 'visto', 'turista', 'guia', 'mapa', 'rua', 'avenida']
  },

  'work': {
    english: ['work', 'job', 'employee', 'employer', 'office', 'company', 'business', 'boss', 'colleague', 'salary', 'money', 'pay', 'contract', 'meeting', 'project', 'client', 'product', 'service', 'sale', 'profession', 'career'],
    french: ['travail', 'emploi', 'employé', 'employeur', 'bureau', 'entreprise', 'affaire', 'patron', 'collègue', 'salaire', 'argent', 'payer', 'contrat', 'réunion', 'projet', 'client', 'produit', 'service', 'vente', 'profession', 'carrière'],
    italian: ['lavoro', 'impiego', 'impiegato', 'datore', 'ufficio', 'azienda', 'affari', 'capo', 'collega', 'stipendio', 'denaro', 'pagare', 'contratto', 'riunione', 'progetto', 'cliente', 'prodotto', 'servizio', 'vendita', 'professione', 'carriera'],
    portuguese: ['trabalho', 'emprego', 'empregado', 'empregador', 'escritório', 'empresa', 'negócio', 'chefe', 'colega', 'salário', 'dinheiro', 'pagar', 'contrato', 'reunião', 'projeto', 'cliente', 'produto', 'serviço', 'venda', 'profissão', 'carreira']
  },

  'education': {
    english: ['school', 'college', 'university', 'teacher', 'student', 'class', 'course', 'exam', 'test', 'grade', 'book', 'notebook', 'pencil', 'pen', 'study', 'learn', 'teach', 'reading', 'writing', 'mathematics', 'history', 'science', 'language'],
    french: ['école', 'collège', 'université', 'professeur', 'étudiant', 'classe', 'cours', 'examen', 'test', 'note', 'livre', 'cahier', 'crayon', 'stylo', 'étudier', 'apprendre', 'enseigner', 'lecture', 'écriture', 'mathématiques', 'histoire', 'science', 'langue'],
    italian: ['scuola', 'collegio', 'università', 'professore', 'studente', 'classe', 'corso', 'esame', 'test', 'voto', 'libro', 'quaderno', 'matita', 'penna', 'studiare', 'imparare', 'insegnare', 'lettura', 'scrittura', 'matematica', 'storia', 'scienza', 'lingua'],
    portuguese: ['escola', 'colégio', 'universidade', 'professor', 'estudante', 'classe', 'curso', 'exame', 'teste', 'nota', 'livro', 'caderno', 'lápis', 'caneta', 'estudar', 'aprender', 'ensinar', 'leitura', 'escrita', 'matemática', 'história', 'ciência', 'língua']
  },

  'health': {
    english: ['health', 'healthy', 'sick', 'illness', 'pain', 'doctor', 'hospital', 'medicine', 'pill', 'treatment', 'patient', 'symptom', 'fever', 'cough', 'cold', 'flu', 'head', 'stomach', 'heart', 'blood', 'bone', 'muscle', 'skin', 'body', 'arm', 'leg', 'hand', 'foot', 'eye', 'ear', 'nose', 'mouth', 'tooth'],
    french: ['santé', 'sain', 'malade', 'maladie', 'douleur', 'médecin', 'hôpital', 'médicament', 'pilule', 'traitement', 'patient', 'symptôme', 'fièvre', 'toux', 'rhume', 'grippe', 'tête', 'estomac', 'cœur', 'sang', 'os', 'muscle', 'peau', 'corps', 'bras', 'jambe', 'main', 'pied', 'œil', 'oreille', 'nez', 'bouche', 'dent'],
    italian: ['salute', 'sano', 'malato', 'malattia', 'dolore', 'medico', 'ospedale', 'medicina', 'pillola', 'trattamento', 'paziente', 'sintomo', 'febbre', 'tosse', 'raffreddore', 'influenza', 'testa', 'stomaco', 'cuore', 'sangue', 'osso', 'muscolo', 'pelle', 'corpo', 'braccio', 'gamba', 'mano', 'piede', 'occhio', 'orecchio', 'naso', 'bocca', 'dente'],
    portuguese: ['saúde', 'saudável', 'doente', 'doença', 'dor', 'médico', 'hospital', 'remédio', 'pílula', 'tratamento', 'paciente', 'sintoma', 'febre', 'tosse', 'resfriado', 'gripe', 'cabeça', 'estômago', 'coração', 'sangue', 'osso', 'músculo', 'pele', 'corpo', 'braço', 'perna', 'mão', 'pé', 'olho', 'orelha', 'nariz', 'boca', 'dente']
  },

  'home': {
    english: ['house', 'home', 'apartment', 'room', 'bedroom', 'living', 'kitchen', 'bathroom', 'garden', 'door', 'window', 'wall', 'ceiling', 'floor', 'table', 'chair', 'bed', 'sofa', 'wardrobe', 'lamp', 'mirror', 'carpet', 'curtain', 'furniture', 'key'],
    french: ['maison', 'appartement', 'pièce', 'chambre', 'salon', 'cuisine', 'salle de bain', 'jardin', 'porte', 'fenêtre', 'mur', 'plafond', 'sol', 'table', 'chaise', 'lit', 'canapé', 'armoire', 'lampe', 'miroir', 'tapis', 'rideau', 'meuble', 'clé'],
    italian: ['casa', 'appartamento', 'stanza', 'camera', 'soggiorno', 'cucina', 'bagno', 'giardino', 'porta', 'finestra', 'muro', 'soffitto', 'pavimento', 'tavolo', 'sedia', 'letto', 'divano', 'armadio', 'lampada', 'specchio', 'tappeto', 'tenda', 'mobile', 'chiave'],
    portuguese: ['casa', 'apartamento', 'quarto', 'sala', 'cozinha', 'banheiro', 'jardim', 'porta', 'janela', 'parede', 'teto', 'chão', 'mesa', 'cadeira', 'cama', 'sofá', 'guarda-roupa', 'lâmpada', 'espelho', 'tapete', 'cortina', 'móvel', 'chave']
  },

  'nature': {
    english: ['nature', 'animal', 'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'tree', 'flower', 'plant', 'rose', 'forest', 'mountain', 'hill', 'valley', 'river', 'lake', 'sea', 'ocean', 'beach', 'island', 'desert', 'field', 'sky', 'sun', 'moon', 'star', 'earth', 'stone', 'sand'],
    french: ['nature', 'animal', 'chien', 'chat', 'oiseau', 'poisson', 'cheval', 'vache', 'arbre', 'fleur', 'plante', 'rose', 'forêt', 'montagne', 'colline', 'vallée', 'rivière', 'lac', 'mer', 'océan', 'plage', 'île', 'désert', 'champ', 'ciel', 'soleil', 'lune', 'étoile', 'terre', 'pierre', 'sable'],
    italian: ['natura', 'animale', 'cane', 'gatto', 'uccello', 'pesce', 'cavallo', 'mucca', 'albero', 'fiore', 'pianta', 'rosa', 'foresta', 'montagna', 'collina', 'valle', 'fiume', 'lago', 'mare', 'oceano', 'spiaggia', 'isola', 'deserto', 'campo', 'cielo', 'sole', 'luna', 'stella', 'terra', 'pietra', 'sabbia'],
    portuguese: ['natureza', 'animal', 'cachorro', 'gato', 'pássaro', 'peixe', 'cavalo', 'vaca', 'árvore', 'flor', 'planta', 'rosa', 'floresta', 'montanha', 'colina', 'vale', 'rio', 'lago', 'mar', 'oceano', 'praia', 'ilha', 'deserto', 'campo', 'céu', 'sol', 'lua', 'estrela', 'terra', 'pedra', 'areia']
  },

  'weather': {
    english: ['weather', 'climate', 'sun', 'rain', 'cloud', 'wind', 'snow', 'storm', 'thunder', 'lightning', 'fog', 'cold', 'hot', 'temperature', 'degree', 'season', 'spring', 'summer', 'autumn', 'winter'],
    french: ['temps', 'climat', 'soleil', 'pluie', 'nuage', 'vent', 'neige', 'tempête', 'tonnerre', 'éclair', 'brouillard', 'froid', 'chaud', 'température', 'degré', 'saison', 'printemps', 'été', 'automne', 'hiver'],
    italian: ['tempo', 'clima', 'sole', 'pioggia', 'nuvola', 'vento', 'neve', 'tempesta', 'tuono', 'fulmine', 'nebbia', 'freddo', 'caldo', 'temperatura', 'grado', 'stagione', 'primavera', 'estate', 'autunno', 'inverno'],
    portuguese: ['tempo', 'clima', 'sol', 'chuva', 'nuvem', 'vento', 'neve', 'tempestade', 'trovão', 'relâmpago', 'neblina', 'frio', 'quente', 'temperatura', 'grau', 'estação', 'primavera', 'verão', 'outono', 'inverno']
  },

  'communication': {
    english: ['speak', 'talk', 'say', 'tell', 'explain', 'ask', 'answer', 'listen', 'hear', 'see', 'look', 'watch', 'read', 'write', 'phone', 'call', 'message', 'text', 'email', 'letter', 'internet', 'computer', 'keyboard', 'mouse', 'screen'],
    french: ['parler', 'dire', 'raconter', 'expliquer', 'demander', 'répondre', 'écouter', 'entendre', 'voir', 'regarder', 'lire', 'écrire', 'téléphone', 'appeler', 'message', 'texte', 'email', 'lettre', 'internet', 'ordinateur', 'clavier', 'souris', 'écran'],
    italian: ['parlare', 'dire', 'raccontare', 'spiegare', 'chiedere', 'rispondere', 'ascoltare', 'sentire', 'vedere', 'guardare', 'leggere', 'scrivere', 'telefono', 'chiamare', 'messaggio', 'testo', 'email', 'lettera', 'internet', 'computer', 'tastiera', 'mouse', 'schermo'],
    portuguese: ['falar', 'dizer', 'contar', 'explicar', 'perguntar', 'responder', 'escutar', 'ouvir', 'ver', 'olhar', 'ler', 'escrever', 'telefone', 'ligar', 'mensagem', 'texto', 'email', 'carta', 'internet', 'computador', 'teclado', 'mouse', 'tela']
  },

  'culture': {
    english: ['culture', 'art', 'music', 'sing', 'song', 'dance', 'play', 'instrument', 'piano', 'guitar', 'paint', 'draw', 'museum', 'gallery', 'theater', 'cinema', 'movie', 'film', 'actor', 'actress', 'director', 'show', 'concert', 'festival'],
    french: ['culture', 'art', 'musique', 'chanter', 'chanson', 'danser', 'danse', 'jouer', 'instrument', 'piano', 'guitare', 'peindre', 'dessiner', 'musée', 'galerie', 'théâtre', 'cinéma', 'film', 'acteur', 'actrice', 'réalisateur', 'spectacle', 'concert', 'festival'],
    italian: ['cultura', 'arte', 'musica', 'cantare', 'canzone', 'ballare', 'ballo', 'suonare', 'strumento', 'pianoforte', 'chitarra', 'dipingere', 'disegnare', 'museo', 'galleria', 'teatro', 'cinema', 'film', 'attore', 'attrice', 'regista', 'spettacolo', 'concerto', 'festival'],
    portuguese: ['cultura', 'arte', 'música', 'cantar', 'canção', 'dançar', 'dança', 'tocar', 'instrumento', 'piano', 'violão', 'pintar', 'desenhar', 'museu', 'galeria', 'teatro', 'cinema', 'filme', 'ator', 'atriz', 'diretor', 'show', 'concerto', 'festival']
  },

  'sports': {
    english: ['sport', 'football', 'soccer', 'basketball', 'tennis', 'volleyball', 'swim', 'run', 'race', 'cycling', 'bicycle', 'play', 'player', 'team', 'game', 'match', 'win', 'lose', 'goal', 'ball', 'field', 'stadium', 'gym', 'train', 'training'],
    french: ['sport', 'football', 'basket', 'tennis', 'volley', 'nager', 'courir', 'course', 'cyclisme', 'vélo', 'jouer', 'joueur', 'équipe', 'jeu', 'match', 'gagner', 'perdre', 'but', 'ballon', 'terrain', 'stade', 'gymnase', 'entraîner', 'entraînement'],
    italian: ['sport', 'calcio', 'basket', 'tennis', 'pallavolo', 'nuotare', 'correre', 'corsa', 'ciclismo', 'bicicletta', 'giocare', 'giocatore', 'squadra', 'gioco', 'partita', 'vincere', 'perdere', 'goal', 'palla', 'campo', 'stadio', 'palestra', 'allenare', 'allenamento'],
    portuguese: ['esporte', 'futebol', 'basquete', 'tênis', 'vôlei', 'nadar', 'correr', 'corrida', 'ciclismo', 'bicicleta', 'jogar', 'jogador', 'time', 'jogo', 'partida', 'ganhar', 'perder', 'gol', 'bola', 'campo', 'estádio', 'academia', 'treinar', 'treinamento']
  },

  'emotions': {
    english: ['emotion', 'feel', 'feeling', 'happy', 'happiness', 'sad', 'sadness', 'angry', 'anger', 'fear', 'afraid', 'worried', 'worry', 'nervous', 'calm', 'surprise', 'love', 'hate', 'hope', 'despair'],
    french: ['émotion', 'sentir', 'sentiment', 'heureux', 'bonheur', 'triste', 'tristesse', 'en colère', 'colère', 'peur', 'avoir peur', 'inquiet', 'inquiétude', 'nerveux', 'calme', 'surprise', 'amour', 'haine', 'espoir', 'désespoir'],
    italian: ['emozione', 'sentire', 'sentimento', 'felice', 'felicità', 'triste', 'tristezza', 'arrabbiato', 'rabbia', 'paura', 'aver paura', 'preoccupato', 'preoccupazione', 'nervoso', 'calmo', 'sorpresa', 'amore', 'odio', 'speranza', 'disperazione'],
    portuguese: ['emoção', 'sentir', 'sentimento', 'feliz', 'felicidade', 'triste', 'tristeza', 'zangado', 'raiva', 'medo', 'ter medo', 'preocupado', 'preocupação', 'nervoso', 'calmo', 'surpresa', 'amor', 'ódio', 'esperança', 'desespero']
  },

  'politics': {
    english: ['politics', 'political', 'government', 'president', 'minister', 'parliament', 'law', 'legal', 'illegal', 'right', 'election', 'elect', 'vote', 'party', 'democracy', 'dictatorship', 'freedom', 'equality', 'justice', 'citizen', 'constitution'],
    french: ['politique', 'gouvernement', 'président', 'ministre', 'parlement', 'loi', 'légal', 'illégal', 'droit', 'élection', 'élire', 'voter', 'vote', 'parti', 'démocratie', 'dictature', 'liberté', 'égalité', 'justice', 'citoyen', 'constitution'],
    italian: ['politica', 'governo', 'presidente', 'ministro', 'parlamento', 'legge', 'legale', 'illegale', 'diritto', 'elezione', 'eleggere', 'votare', 'voto', 'partito', 'democrazia', 'dittatura', 'libertà', 'uguaglianza', 'giustizia', 'cittadino', 'costituzione'],
    portuguese: ['política', 'governo', 'presidente', 'ministro', 'parlamento', 'lei', 'legal', 'ilegal', 'direito', 'eleição', 'eleger', 'votar', 'voto', 'partido', 'democracia', 'ditadura', 'liberdade', 'igualdade', 'justiça', 'cidadão', 'constituição']
  }
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CHUNK_SIZE = 50;
const MIN_THEME_SIZE = 10;

const LEVEL_DESCRIPTIONS = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficiency'
};

async function processLanguage(language) {
  const tableName = `source_words_${language}`;
  const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🌍 Processing ${langDisplay.toUpperCase()}`);
  console.log('═'.repeat(80) + '\n');

  try {
    // Step 1: Add themes to words
    console.log('📝 Step 1: Adding themes to words...\n');

    let totalThemed = 0;

    for (const [theme, langKeywords] of Object.entries(THEME_KEYWORDS)) {
      const keywords = langKeywords[language];
      if (!keywords || keywords.length === 0) {
        console.log(`   ⏭️  Skipping ${theme} (no keywords for ${language})`);
        continue;
      }

      const likeConditions = keywords.map((_, i) => `LOWER(word) LIKE $${i + 1}`).join(' OR ');

      const result = await pool.query(`
        UPDATE ${tableName}
        SET theme = $${keywords.length + 1}
        WHERE theme IS NULL
        AND (${likeConditions})
      `, [...keywords.map(k => `%${k.toLowerCase()}%`), theme]);

      if (result.rowCount > 0) {
        console.log(`   ✅ ${theme}: ${result.rowCount} words`);
        totalThemed += result.rowCount;
      }
    }

    // Set remaining words to 'general'
    const generalResult = await pool.query(`
      UPDATE ${tableName}
      SET theme = 'general'
      WHERE theme IS NULL
    `);

    console.log(`\n   📦 general: ${generalResult.rowCount} words`);
    console.log(`   ✨ Total themed: ${totalThemed} words\n`);

    // Step 2: Delete old word sets
    console.log('🗑️  Step 2: Removing old word sets...\n');

    const deleteResult = await pool.query(`
      DELETE FROM word_sets
      WHERE source_language = $1
    `, [language]);

    console.log(`   Deleted: ${deleteResult.rowCount} old sets\n`);

    // Step 3: Create new thematic sets
    console.log('📚 Step 3: Creating new thematic word sets...\n');

    let totalCreated = 0;

    for (const level of LEVELS) {
      console.log(`   📈 Level ${level}:`);

      const themesQuery = await pool.query(`
        SELECT theme, COUNT(*) as count
        FROM ${tableName}
        WHERE level = $1 AND theme IS NOT NULL
        GROUP BY theme
        ORDER BY count DESC
      `, [level]);

      for (const themeRow of themesQuery.rows) {
        const theme = themeRow.theme;
        const count = parseInt(themeRow.count);

        if (count < MIN_THEME_SIZE && theme !== 'general') {
          continue;
        }

        if (theme === 'general') {
          const chunks = Math.ceil(count / CHUNK_SIZE);
          for (let i = 0; i < chunks; i++) {
            const actualCount = Math.min(CHUNK_SIZE, count - (i * CHUNK_SIZE));
            const title = `${langDisplay} ${level}: Essential Vocabulary ${i + 1}`;
            const description = `${LEVEL_DESCRIPTIONS[level]} level essential vocabulary - Part ${i + 1}`;

            await pool.query(`
              INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
              VALUES ($1, $2, $3, $4, 'general', $5, true)
            `, [language, title, description, level, actualCount]);

            totalCreated++;
          }
        } else {
          const title = `${langDisplay} ${level}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
          const description = `${LEVEL_DESCRIPTIONS[level]} level vocabulary: ${theme}`;

          await pool.query(`
            INSERT INTO word_sets (source_language, title, description, level, theme, word_count, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, true)
          `, [language, title, description, level, theme, count]);

          totalCreated++;
        }
      }
    }

    console.log(`\n✅ Created ${totalCreated} word sets for ${langDisplay}!\n`);

  } catch (error) {
    console.error(`❌ Error processing ${langDisplay}:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const language = process.argv[2];

  if (!language) {
    console.error('❌ Please specify a language!');
    console.error('Usage: node create-thematic-sets-universal.js <language>');
    console.error('Example: node create-thematic-sets-universal.js english');
    process.exit(1);
  }

  try {
    await processLanguage(language);
    console.log('═'.repeat(80));
    console.log('🎉 Done!');
    console.log('═'.repeat(80) + '\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main();
