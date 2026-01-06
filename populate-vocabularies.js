/**
 * Populate vocabulary databases with real words for incomplete languages
 * Usage: node populate-vocabularies.js <language>
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway"
});

const language = process.argv[2];

if (!language) {
  console.error('❌ Please specify a language: italian, portuguese, turkish, arabic, russian, ukrainian');
  process.exit(1);
}

// Basic vocabulary sets organized by theme and level for each language
const VOCABULARIES = {
  italian: {
    A1: {
      greetings: ['ciao', 'buongiorno', 'buonasera', 'buonanotte', 'arrivederci', 'salve', 'piacere', 'benvenuto'],
      basics: ['sì', 'no', 'per favore', 'grazie', 'prego', 'scusa', 'mi dispiace', 'va bene', 'bene', 'male'],
      pronouns: ['io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'questo', 'quello', 'chi', 'cosa', 'dove', 'quando', 'come', 'perché'],
      verbs: ['essere', 'avere', 'fare', 'andare', 'venire', 'dire', 'vedere', 'sapere', 'volere', 'potere', 'dovere', 'dare', 'stare', 'prendere', 'parlare', 'mangiare', 'bere', 'dormire', 'lavorare', 'studiare'],
      family: ['famiglia', 'padre', 'madre', 'figlio', 'figlia', 'fratello', 'sorella', 'nonno', 'nonna', 'zio', 'zia', 'marito', 'moglie'],
      numbers: ['uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'cento', 'mille'],
      time: ['oggi', 'domani', 'ieri', 'ora', 'giorno', 'settimana', 'mese', 'anno', 'mattina', 'sera', 'notte'],
      colors: ['rosso', 'blu', 'verde', 'giallo', 'nero', 'bianco', 'arancione', 'rosa', 'grigio', 'marrone'],
      food: ['pane', 'acqua', 'caffè', 'tè', 'latte', 'carne', 'pesce', 'frutta', 'verdura', 'pasta', 'pizza', 'formaggio'],
      body: ['testa', 'occhio', 'naso', 'bocca', 'mano', 'piede', 'corpo', 'braccio', 'gamba'],
      home: ['casa', 'stanza', 'cucina', 'bagno', 'letto', 'tavolo', 'sedia', 'porta', 'finestra']
    },
    A2: {
      verbs: ['capire', 'rispondere', 'chiedere', 'pensare', 'credere', 'sentire', 'guardare', 'ascoltare', 'leggere', 'scrivere', 'chiamare', 'aiutare', 'cercare', 'trovare', 'perdere', 'aprire', 'chiudere', 'aspettare', 'partire', 'arrivare'],
      adjectives: ['grande', 'piccolo', 'bello', 'brutto', 'buono', 'cattivo', 'nuovo', 'vecchio', 'giovane', 'alto', 'basso', 'lungo', 'corto', 'caldo', 'freddo', 'facile', 'difficile', 'importante', 'interessante'],
      places: ['città', 'paese', 'strada', 'piazza', 'negozio', 'mercato', 'scuola', 'università', 'ospedale', 'chiesa', 'museo', 'teatro', 'cinema', 'ristorante', 'bar', 'hotel', 'stazione', 'aeroporto'],
      travel: ['viaggio', 'treno', 'autobus', 'macchina', 'aereo', 'bicicletta', 'biglietto', 'valigia'],
      work: ['lavoro', 'ufficio', 'soldi', 'prezzo', 'euro'],
      weather: ['tempo', 'sole', 'pioggia', 'vento', 'neve', 'caldo', 'freddo']
    },
    B1: {
      verbs: ['cominciare', 'finire', 'continuare', 'decidere', 'scegliere', 'provare', 'riuscire', 'diventare', 'succedere', 'accadere', 'sembrare', 'ricordare', 'dimenticare', 'spiegare', 'raccontare', 'descrivere', 'consigliare', 'suggerire', 'permettere', 'vietare'],
      abstract: ['vita', 'morte', 'amore', 'odio', 'felicità', 'tristezza', 'paura', 'speranza', 'problema', 'soluzione', 'ragione', 'scopo', 'idea', 'opinione', 'fatto', 'verità', 'bugia'],
      society: ['gente', 'persona', 'uomo', 'donna', 'bambino', 'ragazzo', 'ragazza', 'amico', 'vicino', 'conoscente'],
      nature: ['natura', 'animale', 'cane', 'gatto', 'uccello', 'albero', 'fiore', 'mare', 'montagna', 'fiume', 'lago']
    },
    B2: {
      advanced: ['argomento', 'questione', 'situazione', 'condizione', 'conseguenza', 'risultato', 'cambiamento', 'sviluppo', 'crescita', 'progresso', 'miglioramento', 'peggioramento', 'vantaggio', 'svantaggio', 'possibilità', 'opportunità', 'rischio', 'pericolo'],
      academic: ['ricerca', 'studio', 'analisi', 'teoria', 'pratica', 'metodo', 'sistema', 'processo', 'procedura']
    },
    C1: {
      sophisticated: ['ambito', 'contesto', 'aspetto', 'elemento', 'fattore', 'criterio', 'parametro', 'modalità', 'strategia', 'approccio', 'prospettiva', 'dimensione', 'portata', 'entità', 'misura'],
      abstract_advanced: ['essenza', 'sostanza', 'apparenza', 'realtà', 'complessità', 'semplicità', 'coerenza', 'contraddizione']
    },
    C2: {
      very_advanced: ['peculiarità', 'specificità', 'connotazione', 'implicazione', 'ramificazione', 'sfumatura', 'sottigliezza', 'paradosso', 'dicotomia', 'paradigma', 'postulato', 'assioma']
    }
  },

  portuguese: {
    A1: {
      greetings: ['olá', 'bom dia', 'boa tarde', 'boa noite', 'tchau', 'adeus', 'bem-vindo', 'prazer'],
      basics: ['sim', 'não', 'por favor', 'obrigado', 'obrigada', 'de nada', 'desculpe', 'com licença', 'tudo bem', 'bom', 'mau'],
      pronouns: ['eu', 'tu', 'você', 'ele', 'ela', 'nós', 'vós', 'vocês', 'eles', 'elas', 'este', 'esse', 'aquele', 'quem', 'que', 'onde', 'quando', 'como', 'por que'],
      verbs: ['ser', 'estar', 'ter', 'haver', 'fazer', 'ir', 'vir', 'dar', 'ver', 'saber', 'querer', 'poder', 'dever', 'dizer', 'falar', 'comer', 'beber', 'dormir', 'trabalhar', 'estudar'],
      family: ['família', 'pai', 'mãe', 'filho', 'filha', 'irmão', 'irmã', 'avô', 'avó', 'tio', 'tia', 'marido', 'esposa'],
      numbers: ['um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'cem', 'mil'],
      time: ['hoje', 'amanhã', 'ontem', 'agora', 'dia', 'semana', 'mês', 'ano', 'manhã', 'tarde', 'noite'],
      colors: ['vermelho', 'azul', 'verde', 'amarelo', 'preto', 'branco', 'laranja', 'rosa', 'cinza', 'marrom'],
      food: ['pão', 'água', 'café', 'chá', 'leite', 'carne', 'peixe', 'fruta', 'legume', 'arroz', 'feijão', 'queijo'],
      body: ['cabeça', 'olho', 'nariz', 'boca', 'mão', 'pé', 'corpo', 'braço', 'perna'],
      home: ['casa', 'quarto', 'cozinha', 'banheiro', 'cama', 'mesa', 'cadeira', 'porta', 'janela']
    },
    A2: {
      verbs: ['entender', 'compreender', 'responder', 'perguntar', 'pensar', 'acreditar', 'sentir', 'olhar', 'ouvir', 'ler', 'escrever', 'chamar', 'ajudar', 'procurar', 'encontrar', 'perder', 'abrir', 'fechar', 'esperar', 'partir', 'chegar'],
      adjectives: ['grande', 'pequeno', 'bonito', 'feio', 'bom', 'mau', 'novo', 'velho', 'jovem', 'alto', 'baixo', 'comprido', 'curto', 'quente', 'frio', 'fácil', 'difícil', 'importante', 'interessante'],
      places: ['cidade', 'país', 'rua', 'praça', 'loja', 'mercado', 'escola', 'universidade', 'hospital', 'igreja', 'museu', 'teatro', 'cinema', 'restaurante', 'café', 'hotel', 'estação', 'aeroporto']
    },
    B1: {
      verbs: ['começar', 'acabar', 'continuar', 'decidir', 'escolher', 'tentar', 'conseguir', 'tornar-se', 'acontecer', 'parecer', 'lembrar', 'esquecer', 'explicar', 'contar', 'descrever', 'aconselhar', 'sugerir', 'permitir', 'proibir']
    }
  },

  turkish: {
    A1: {
      greetings: ['merhaba', 'günaydın', 'iyi akşamlar', 'iyi geceler', 'hoşça kal', 'güle güle', 'hoş geldiniz', 'memnun oldum'],
      basics: ['evet', 'hayır', 'lütfen', 'teşekkür ederim', 'rica ederim', 'özür dilerim', 'pardon', 'tamam', 'iyi', 'kötü'],
      pronouns: ['ben', 'sen', 'o', 'biz', 'siz', 'onlar', 'bu', 'şu', 'o', 'kim', 'ne', 'nerede', 'ne zaman', 'nasıl', 'neden'],
      verbs: ['olmak', 'etmek', 'yapmak', 'gitmek', 'gelmek', 'demek', 'görmek', 'bilmek', 'istemek', 'vermek', 'almak', 'konuşmak', 'yemek', 'içmek', 'uyumak', 'çalışmak', 'okumak'],
      family: ['aile', 'baba', 'anne', 'oğul', 'kız', 'kardeş', 'dede', 'nine', 'amca', 'teyze', 'koca', 'karı'],
      numbers: ['bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'yüz', 'bin'],
      time: ['bugün', 'yarın', 'dün', 'şimdi', 'gün', 'hafta', 'ay', 'yıl', 'sabah', 'akşam', 'gece'],
      food: ['ekmek', 'su', 'kahve', 'çay', 'süt', 'et', 'balık', 'meyve', 'sebze', 'pilav', 'peynir']
    }
  },

  arabic: {
    A1: {
      greetings: ['مرحبا', 'صباح الخير', 'مساء الخير', 'تصبح على خير', 'مع السلامة', 'أهلا وسهلا'],
      basics: ['نعم', 'لا', 'من فضلك', 'شكرا', 'عفوا', 'آسف', 'حسنا', 'جيد', 'سيئ'],
      pronouns: ['أنا', 'أنت', 'أنتِ', 'هو', 'هي', 'نحن', 'أنتم', 'هم', 'هذا', 'ذلك', 'من', 'ما', 'أين', 'متى', 'كيف', 'لماذا'],
      verbs: ['كان', 'يكون', 'ملك', 'يملك', 'فعل', 'يفعل', 'ذهب', 'يذهب', 'جاء', 'يجيء', 'قال', 'يقول', 'رأى', 'يرى', 'عرف', 'يعرف', 'أراد', 'يريد'],
      family: ['عائلة', 'أب', 'أم', 'ابن', 'ابنة', 'أخ', 'أخت', 'جد', 'جدة', 'عم', 'خال', 'زوج', 'زوجة'],
      numbers: ['واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'],
      time: ['اليوم', 'غدا', 'أمس', 'الآن', 'يوم', 'أسبوع', 'شهر', 'سنة', 'صباح', 'مساء', 'ليل']
    }
  },

  russian: {
    A1: {
      greetings: ['здравствуйте', 'привет', 'доброе утро', 'добрый день', 'добрый вечер', 'спокойной ночи', 'до свидания', 'пока'],
      basics: ['да', 'нет', 'пожалуйста', 'спасибо', 'извините', 'простите', 'хорошо', 'плохо'],
      pronouns: ['я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они', 'это', 'тот', 'кто', 'что', 'где', 'когда', 'как', 'почему'],
      verbs: ['быть', 'иметь', 'делать', 'идти', 'ходить', 'ехать', 'приходить', 'приезжать', 'говорить', 'сказать', 'видеть', 'знать', 'хотеть', 'мочь', 'должен', 'давать', 'брать', 'есть', 'пить', 'спать', 'работать', 'учиться'],
      family: ['семья', 'отец', 'мать', 'сын', 'дочь', 'брат', 'сестра', 'дедушка', 'бабушка', 'дядя', 'тётя', 'муж', 'жена'],
      numbers: ['один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'сто', 'тысяча'],
      time: ['сегодня', 'завтра', 'вчера', 'сейчас', 'день', 'неделя', 'месяц', 'год', 'утро', 'вечер', 'ночь'],
      colors: ['красный', 'синий', 'зелёный', 'жёлтый', 'чёрный', 'белый', 'оранжевый', 'розовый', 'серый', 'коричневый'],
      food: ['хлеб', 'вода', 'кофе', 'чай', 'молоко', 'мясо', 'рыба', 'фрукт', 'овощ', 'картофель', 'сыр'],
      body: ['голова', 'глаз', 'нос', 'рот', 'рука', 'нога', 'тело', 'палец'],
      home: ['дом', 'комната', 'кухня', 'ванная', 'кровать', 'стол', 'стул', 'дверь', 'окно']
    },
    A2: {
      verbs: ['понимать', 'отвечать', 'спрашивать', 'думать', 'верить', 'чувствовать', 'смотреть', 'слушать', 'читать', 'писать', 'звонить', 'помогать', 'искать', 'находить', 'терять', 'открывать', 'закрывать', 'ждать', 'уходить', 'приходить'],
      adjectives: ['большой', 'маленький', 'красивый', 'некрасивый', 'хороший', 'плохой', 'новый', 'старый', 'молодой', 'высокий', 'низкий', 'длинный', 'короткий', 'горячий', 'холодный', 'лёгкий', 'трудный', 'важный', 'интересный'],
      places: ['город', 'деревня', 'улица', 'площадь', 'магазин', 'рынок', 'школа', 'университет', 'больница', 'церковь', 'музей', 'театр', 'кино', 'ресторан', 'кафе', 'гостиница', 'станция', 'аэропорт']
    },
    B1: {
      verbs: ['начинать', 'начать', 'кончать', 'кончить', 'продолжать', 'решать', 'решить', 'выбирать', 'выбрать', 'пытаться', 'попытаться', 'удаваться', 'удаться', 'становиться', 'стать', 'случаться', 'случиться', 'казаться', 'показаться', 'помнить', 'вспоминать', 'забывать', 'объяснять', 'рассказывать', 'описывать', 'советовать', 'предлагать', 'разрешать', 'запрещать']
    }
  },

  ukrainian: {
    A1: {
      greetings: ['добрий день', 'привіт', 'доброго ранку', 'добрий вечір', 'на добраніч', 'до побачення', 'бувай'],
      basics: ['так', 'ні', 'будь ласка', 'дякую', 'вибачте', 'добре', 'погано'],
      pronouns: ['я', 'ти', 'він', 'вона', 'воно', 'ми', 'ви', 'вони', 'це', 'той', 'хто', 'що', 'де', 'коли', 'як', 'чому'],
      verbs: ['бути', 'мати', 'робити', 'йти', 'ходити', 'їхати', 'приходити', 'приїжджати', 'говорити', 'сказати', 'бачити', 'знати', 'хотіти', 'могти', 'мусити', 'давати', 'брати', 'їсти', 'пити', 'спати', 'працювати', 'вчитися'],
      family: ["сім'я", 'батько', 'мати', 'син', 'дочка', 'брат', 'сестра', 'дідусь', 'бабуся', 'дядько', 'тітка', 'чоловік', 'дружина'],
      numbers: ['один', 'два', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять", 'десять', 'сто', 'тисяча'],
      time: ['сьогодні', 'завтра', 'вчора', 'зараз', 'день', 'тиждень', 'місяць', 'рік', 'ранок', 'вечір', 'ніч'],
      food: ['хліб', 'вода', 'кава', 'чай', 'молоко', "м'ясо", 'риба', 'фрукт', 'овоч', 'картопля', 'сир'],
      home: ['дім', 'кімната', 'кухня', 'ванна', 'ліжко', 'стіл', 'стілець', 'двері', 'вікно']
    }
  }
};

async function populateVocabulary() {
  try {
    const vocab = VOCABULARIES[language];
    if (!vocab) {
      console.error(`❌ No vocabulary defined for ${language}`);
      process.exit(1);
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`📚 ЗАПОЛНЕНИЕ СЛОВАРЯ: ${language.toUpperCase()}`);
    console.log('═'.repeat(80) + '\n');

    let totalAdded = 0;
    let totalUpdated = 0;

    for (const [level, categories] of Object.entries(vocab)) {
      console.log(`\n📖 Уровень ${level}:`);

      for (const [category, words] of Object.entries(categories)) {
        let categoryAdded = 0;
        let categoryUpdated = 0;

        for (const word of words) {
          // Check if word already exists (real word, not placeholder)
          const existing = await pool.query(`
            SELECT id FROM source_words_${language}
            WHERE word = $1
          `, [word]);

          if (existing.rows.length > 0) {
            // Word already exists, skip
            continue;
          }

          // Find a placeholder to replace
          const placeholder = await pool.query(`
            SELECT id FROM source_words_${language}
            WHERE word LIKE '%_word_%' AND level = $1
            LIMIT 1
          `, [level]);

          if (placeholder.rows.length > 0) {
            // Replace placeholder with real word
            await pool.query(`
              UPDATE source_words_${language}
              SET word = $1
              WHERE id = $2
            `, [word, placeholder.rows[0].id]);
            categoryUpdated++;
            totalUpdated++;
          } else {
            // No placeholders left, insert new word
            await pool.query(`
              INSERT INTO source_words_${language} (word, level, theme)
              VALUES ($1, $2, 'general')
            `, [word, level]);
            categoryAdded++;
            totalAdded++;
          }
        }

        if (categoryAdded > 0 || categoryUpdated > 0) {
          console.log(`   ${category}: ${categoryUpdated} заменено, ${categoryAdded} добавлено`);
        }
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`✅ Итого: ${totalUpdated} слов заменено, ${totalAdded} новых слов добавлено`);
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

populateVocabulary();
