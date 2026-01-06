/**
 * Improved theme keywords for Romance languages (Italian, Portuguese, Turkish)
 * Includes verbs, infinitives, and more word forms
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];

if (!language) {
  console.error('❌ Please specify a language');
  process.exit(1);
}

const IMPROVED_KEYWORDS = {
  italian: {
    'family': ['famiglia', 'familiare', 'padre', 'madre', 'mamma', 'papà', 'figlio', 'figlia', 'fratello', 'sorella', 'nonno', 'nonna', 'nipote', 'zio', 'zia', 'cugino', 'genitore', 'bambino', 'bambina', 'marito', 'moglie', 'sposo', 'sposa', 'parente'],

    'food': ['cibo', 'mangiare', 'bere', 'bevanda', 'acqua', 'caffè', 'tè', 'latte', 'pane', 'carne', 'pollo', 'pesce', 'riso', 'pasta', 'frutta', 'verdura', 'mela', 'arancia', 'banana', 'pomodoro', 'birra', 'vino', 'ristorante', 'cameriere', 'menu', 'piatto', 'colazione', 'pranzo', 'cena', 'cucina', 'cucinare', 'cuocere', 'ricetta', 'delizioso', 'buono', 'fame', 'sete', 'insalata', 'zuppa', 'dolce', 'salato', 'mangia', 'bevi', 'bevuto'],

    'travel': ['viaggio', 'viaggiare', 'aereo', 'treno', 'autobus', 'taxi', 'macchina', 'auto', 'bicicletta', 'moto', 'stazione', 'aeroporto', 'albergo', 'biglietto', 'valigia', 'bagaglio', 'passaporto', 'visto', 'confine', 'turista', 'guida', 'mappa', 'indirizzo', 'strada', 'via', 'andare', 'partire', 'arrivare', 'partenza', 'arrivo'],

    'work': ['lavoro', 'lavorare', 'impiego', 'impiegato', 'ufficio', 'azienda', 'ditta', 'affari', 'capo', 'collega', 'stipendio', 'soldi', 'pagare', 'contratto', 'riunione', 'progetto', 'cliente', 'prodotto', 'servizio', 'vendita', 'comprare', 'professione', 'carriera', 'lavora'],

    'education': ['scuola', 'università', 'educazione', 'insegnante', 'maestro', 'professore', 'studente', 'alunno', 'classe', 'lezione', 'corso', 'esame', 'test', 'voto', 'libro', 'quaderno', 'matita', 'penna', 'studiare', 'imparare', 'insegnare', 'leggere', 'scrivere', 'matematica', 'storia', 'scienza', 'lingua', 'studia', 'impara', 'lettura', 'scrittura'],

    'health': ['salute', 'sano', 'malato', 'malattia', 'dolore', 'medico', 'dottore', 'ospedale', 'clinica', 'medicina', 'farmaco', 'cura', 'curare', 'paziente', 'sintomo', 'febbre', 'tosse', 'raffreddore', 'influenza', 'testa', 'stomaco', 'pancia', 'cuore', 'sangue', 'osso', 'muscolo', 'pelle', 'corpo', 'mano', 'piede', 'gamba', 'occhio', 'orecchio', 'naso', 'bocca', 'dente'],

    'home': ['casa', 'abitazione', 'appartamento', 'stanza', 'camera', 'soggiorno', 'cucina', 'bagno', 'giardino', 'garage', 'porta', 'finestra', 'muro', 'parete', 'soffitto', 'pavimento', 'scala', 'tavolo', 'sedia', 'letto', 'divano', 'armadio', 'scaffale', 'lampada', 'specchio', 'tappeto', 'tenda', 'mobile', 'chiave'],

    'nature': ['natura', 'animale', 'cane', 'gatto', 'uccello', 'pesce', 'cavallo', 'mucca', 'maiale', 'gallina', 'albero', 'fiore', 'pianta', 'rosa', 'erba', 'bosco', 'foresta', 'montagna', 'collina', 'valle', 'fiume', 'lago', 'mare', 'oceano', 'spiaggia', 'isola', 'deserto', 'campo', 'cielo', 'sole', 'luna', 'stella', 'terra', 'pietra', 'sabbia'],

    'weather': ['tempo', 'clima', 'sole', 'pioggia', 'nuvola', 'vento', 'neve', 'tempesta', 'tuono', 'fulmine', 'nebbia', 'freddo', 'caldo', 'temperatura', 'grado', 'stagione', 'primavera', 'estate', 'autunno', 'inverno', 'soleggiato', 'nuvoloso', 'piovoso'],

    'communication': ['parlare', 'dire', 'raccontare', 'spiegare', 'domandare', 'chiedere', 'rispondere', 'ascoltare', 'sentire', 'vedere', 'guardare', 'leggere', 'scrivere', 'telefono', 'cellulare', 'chiamare', 'messaggio', 'lettera', 'posta', 'email', 'internet', 'computer', 'tastiera', 'schermo', 'parla', 'dice', 'scrivi', 'leggi'],

    'emotions': ['emozione', 'sentimento', 'sentire', 'felice', 'felicità', 'allegro', 'triste', 'tristezza', 'arrabbiato', 'rabbia', 'paura', 'preoccupato', 'nervoso', 'calmo', 'sorpresa', 'amore', 'amare', 'odio', 'odiare', 'speranza', 'sperare'],

    'culture': ['cultura', 'arte', 'musica', 'cantare', 'canzone', 'ballare', 'ballo', 'suonare', 'strumento', 'pianoforte', 'chitarra', 'pittura', 'dipinto', 'disegnare', 'museo', 'galleria', 'teatro', 'cinema', 'film', 'attore', 'attrice', 'regista', 'spettacolo', 'concerto'],

    'sports': ['sport', 'sportivo', 'calcio', 'pallacanestro', 'tennis', 'pallavolo', 'nuoto', 'nuotare', 'correre', 'corsa', 'ciclismo', 'giocare', 'giocatore', 'squadra', 'partita', 'vincere', 'perdere', 'goal', 'palla', 'campo', 'stadio', 'palestra', 'allenamento']
  },

  portuguese: {
    'family': ['família', 'familiar', 'pai', 'mãe', 'filho', 'filha', 'irmão', 'irmã', 'avô', 'avó', 'neto', 'tio', 'tia', 'primo', 'parente', 'criança', 'marido', 'esposa', 'mulher'],

    'food': ['comida', 'comer', 'beber', 'bebida', 'água', 'café', 'chá', 'leite', 'pão', 'carne', 'frango', 'peixe', 'arroz', 'massa', 'fruta', 'vegetal', 'maçã', 'laranja', 'banana', 'tomate', 'cerveja', 'vinho', 'restaurante', 'garçom', 'cardápio', 'prato', 'café da manhã', 'almoço', 'jantar', 'cozinha', 'cozinhar', 'receita', 'delicioso', 'gostoso', 'fome', 'sede', 'salada', 'sopa', 'doce', 'salgado', 'come', 'bebe'],

    'travel': ['viagem', 'viajar', 'avião', 'trem', 'ônibus', 'táxi', 'carro', 'bicicleta', 'moto', 'estação', 'aeroporto', 'hotel', 'bilhete', 'mala', 'bagagem', 'passaporte', 'visto', 'fronteira', 'turista', 'guia', 'mapa', 'endereço', 'rua', 'avenida', 'ir', 'partir', 'chegar', 'viaja', 'partida', 'chegada'],

    'work': ['trabalho', 'trabalhar', 'emprego', 'empregado', 'escritório', 'empresa', 'negócio', 'chefe', 'colega', 'salário', 'dinheiro', 'pagar', 'contrato', 'reunião', 'projeto', 'cliente', 'produto', 'serviço', 'venda', 'compra', 'profissão', 'carreira', 'trabalha'],

    'education': ['escola', 'universidade', 'educação', 'professor', 'professora', 'estudante', 'aluno', 'classe', 'aula', 'curso', 'exame', 'teste', 'nota', 'livro', 'caderno', 'lápis', 'caneta', 'estudar', 'aprender', 'ensinar', 'ler', 'escrever', 'matemática', 'história', 'ciência', 'língua', 'estuda', 'aprende', 'leitura', 'escrita'],

    'health': ['saúde', 'saudável', 'doente', 'doença', 'dor', 'médico', 'doutor', 'hospital', 'clínica', 'medicina', 'remédio', 'tratamento', 'tratar', 'paciente', 'sintoma', 'febre', 'tosse', 'resfriado', 'gripe', 'cabeça', 'estômago', 'barriga', 'coração', 'sangue', 'osso', 'músculo', 'pele', 'corpo', 'mão', 'pé', 'perna', 'olho', 'ouvido', 'nariz', 'boca', 'dente'],

    'home': ['casa', 'lar', 'apartamento', 'quarto', 'sala', 'cozinha', 'banheiro', 'jardim', 'garagem', 'porta', 'janela', 'parede', 'teto', 'chão', 'escada', 'mesa', 'cadeira', 'cama', 'sofá', 'armário', 'prateleira', 'lâmpada', 'espelho', 'tapete', 'cortina', 'móvel', 'chave'],

    'nature': ['natureza', 'animal', 'cão', 'cachorro', 'gato', 'pássaro', 'peixe', 'cavalo', 'vaca', 'porco', 'galinha', 'árvore', 'flor', 'planta', 'rosa', 'grama', 'floresta', 'bosque', 'montanha', 'colina', 'vale', 'rio', 'lago', 'mar', 'oceano', 'praia', 'ilha', 'deserto', 'campo', 'céu', 'sol', 'lua', 'estrela', 'terra', 'pedra', 'areia'],

    'weather': ['tempo', 'clima', 'sol', 'chuva', 'nuvem', 'vento', 'neve', 'tempestade', 'trovão', 'relâmpago', 'neblina', 'frio', 'quente', 'calor', 'temperatura', 'grau', 'estação', 'primavera', 'verão', 'outono', 'inverno', 'ensolarado', 'nublado', 'chuvoso'],

    'communication': ['falar', 'dizer', 'contar', 'explicar', 'perguntar', 'responder', 'ouvir', 'escutar', 'ver', 'olhar', 'ler', 'escrever', 'telefone', 'celular', 'ligar', 'mensagem', 'carta', 'correio', 'email', 'internet', 'computador', 'teclado', 'tela', 'fala', 'diz', 'escreve', 'lê'],

    'emotions': ['emoção', 'sentimento', 'sentir', 'feliz', 'felicidade', 'alegre', 'triste', 'tristeza', 'zangado', 'raiva', 'medo', 'preocupado', 'nervoso', 'calmo', 'surpresa', 'amor', 'amar', 'ódio', 'odiar', 'esperança', 'esperar'],

    'culture': ['cultura', 'arte', 'música', 'cantar', 'canção', 'dançar', 'dança', 'tocar', 'instrumento', 'piano', 'violão', 'guitarra', 'pintura', 'quadro', 'desenhar', 'museu', 'galeria', 'teatro', 'cinema', 'filme', 'ator', 'atriz', 'diretor', 'espetáculo', 'concerto'],

    'sports': ['esporte', 'esportivo', 'futebol', 'basquete', 'tênis', 'vôlei', 'natação', 'nadar', 'correr', 'corrida', 'ciclismo', 'jogar', 'jogador', 'time', 'equipe', 'jogo', 'partida', 'ganhar', 'perder', 'gol', 'bola', 'campo', 'estádio', 'academia', 'treino']
  },

  turkish: {
    'family': ['aile', 'ailevi', 'baba', 'anne', 'oğul', 'kız', 'kardeş', 'erkek kardeş', 'kız kardeş', 'dede', 'büyükanne', 'büyükbaba', 'torun', 'amca', 'dayı', 'teyze', 'hala', 'kuzen', 'ebeveyn', 'çocuk', 'bebek', 'eş', 'koca', 'karı'],

    'food': ['yemek', 'yemek yemek', 'yeme', 'içmek', 'içme', 'su', 'kahve', 'çay', 'süt', 'ekmek', 'et', 'tavuk', 'balık', 'pirinç', 'makarna', 'meyve', 'sebze', 'elma', 'portakal', 'muz', 'domates', 'bira', 'şarap', 'restoran', 'lokanta', 'garson', 'menü', 'kahvaltı', 'öğle yemeği', 'akşam yemeği', 'mutfak', 'pişirmek', 'tarif', 'lezzetli', 'açlık', 'susuzluk', 'salata', 'çorba', 'tatlı', 'tuzlu', 'yer', 'içer', 'yedi', 'içti'],

    'travel': ['seyahat', 'gezi', 'uçak', 'tren', 'otobüs', 'taksi', 'araba', 'araç', 'bisiklet', 'motor', 'istasyon', 'havalimanı', 'otel', 'bilet', 'valiz', 'bavul', 'bagaj', 'pasaport', 'vize', 'sınır', 'turist', 'rehber', 'kılavuz', 'harita', 'adres', 'sokak', 'cadde', 'gitmek', 'gider', 'gitti', 'gidiyor'],

    'work': ['iş', 'çalışmak', 'çalışma', 'istihdam', 'işçi', 'çalışan', 'ofis', 'şirket', 'firma', 'patron', 'şef', 'meslektaş', 'arkadaş', 'maaş', 'para', 'ödemek', 'sözleşme', 'toplantı', 'proje', 'müşteri', 'ürün', 'hizmet', 'satış', 'satmak', 'almak', 'meslek', 'kariyer', 'çalışır', 'çalıştı'],

    'education': ['okul', 'üniversite', 'eğitim', 'öğretmen', 'hoca', 'öğrenci', 'talebe', 'sınıf', 'ders', 'kurs', 'sınav', 'test', 'not', 'kitap', 'defter', 'kalem', 'kurşun kalem', 'öğrenmek', 'öğren', 'okumak', 'oku', 'yazmak', 'yaz', 'matematik', 'tarih', 'bilim', 'dil', 'okur', 'yazar', 'öğrenir'],

    'health': ['sağlık', 'sağlıklı', 'hasta', 'hastalık', 'ağrı', 'acı', 'doktor', 'hekim', 'hastane', 'klinik', 'tıp', 'ilaç', 'tedavi', 'hasta', 'semptom', 'belirti', 'ateş', 'öksürük', 'nezle', 'grip', 'baş', 'kafa', 'mide', 'karın', 'kalp', 'yürek', 'kan', 'kemik', 'kas', 'cilt', 'deri', 'vücut', 'beden', 'el', 'ayak', 'bacak', 'göz', 'kulak', 'burun', 'ağız', 'diş'],

    'home': ['ev', 'yuva', 'daire', 'oda', 'yatak odası', 'oturma odası', 'salon', 'mutfak', 'banyo', 'tuvalet', 'bahçe', 'garaj', 'kapı', 'pencere', 'duvar', 'tavan', 'zemin', 'yer', 'merdiven', 'masa', 'sandalye', 'yatak', 'kanepe', 'dolap', 'raf', 'lamba', 'ayna', 'halı', 'perde', 'mobilya', 'anahtar'],

    'nature': ['doğa', 'hayvan', 'köpek', 'kedi', 'kuş', 'balık', 'at', 'inek', 'domuz', 'tavuk', 'ağaç', 'çiçek', 'bitki', 'gül', 'çimen', 'orman', 'dağ', 'tepe', 'vadi', 'nehir', 'göl', 'deniz', 'okyanus', 'plaj', 'sahil', 'ada', 'çöl', 'tarla', 'gök', 'gökyüzü', 'güneş', 'ay', 'yıldız', 'dünya', 'taş', 'kum'],

    'weather': ['hava', 'iklim', 'güneş', 'güneşli', 'yağmur', 'yağmurlu', 'bulut', 'bulutlu', 'rüzgar', 'rüzgarlı', 'kar', 'karlı', 'fırtına', 'gök gürültüsü', 'şimşek', 'sis', 'sisli', 'soğuk', 'sıcak', 'ılık', 'sıcaklık', 'ısı', 'derece', 'mevsim', 'ilkbahar', 'bahar', 'yaz', 'sonbahar', 'güz', 'kış'],

    'communication': ['konuşmak', 'konuş', 'söylemek', 'söyle', 'anlatmak', 'anlat', 'açıklamak', 'sormak', 'sor', 'cevap vermek', 'yanıtlamak', 'dinlemek', 'dinle', 'duymak', 'duy', 'görmek', 'gör', 'bakmak', 'bak', 'okumak', 'oku', 'yazmak', 'yaz', 'telefon', 'cep telefonu', 'aramak', 'ara', 'mesaj', 'mektup', 'posta', 'e-posta', 'internet', 'bilgisayar', 'klavye', 'fare', 'ekran', 'konuşur', 'söyler', 'okur', 'yazar']
  }
};

async function improveThemes() {
  try {
    if (!IMPROVED_KEYWORDS[language]) {
      console.error(`❌ No improved keywords for ${language}`);
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`🎨 УЛУЧШЕНИЕ ТЕМ для ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    const keywords = IMPROVED_KEYWORDS[language];
    let totalThemed = 0;

    // Reset to general first for words that already have themes
    await pool.query(`
      UPDATE source_words_${language}
      SET theme = 'general'
      WHERE theme != 'general'
    `);

    for (const [theme, themeKeywords] of Object.entries(keywords)) {
      const likeConditions = themeKeywords.map((_, i) => `LOWER(word) LIKE $${i + 1}`).join(' OR ');

      const result = await pool.query(`
        UPDATE source_words_${language}
        SET theme = $${themeKeywords.length + 1}
        WHERE theme = 'general'
        AND (${likeConditions})
      `, [...themeKeywords.map(k => `%${k}%`), theme]);

      if (result.rowCount > 0) {
        console.log(`   ✅ ${theme}: ${result.rowCount} words`);
        totalThemed += result.rowCount;
      }
    }

    const generalCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM source_words_${language}
      WHERE theme = 'general'
    `);

    console.log(`\n   📦 general: ${generalCount.rows[0].count} words`);
    console.log(`   ✨ Total themed: ${totalThemed} words`);

    const pct = ((totalThemed / (totalThemed + parseInt(generalCount.rows[0].count))) * 100).toFixed(1);
    console.log(`   📊 Percentage: ${pct}%\n`);

    console.log('═'.repeat(80));
    console.log('✅ Done!');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

improveThemes();
