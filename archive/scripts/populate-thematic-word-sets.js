/**
 * Populate Thematic Word Sets
 * Phase 3.2: Create topic-based word collections (15+ themes)
 *
 * This script creates official word sets organized by practical themes
 * like Travel, Business, Food, Health, Technology, etc.
 */

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'words_learning',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

// Thematic Word Sets Definitions
const THEMATIC_SETS = {
    'travel': {
        name: 'Travel & Tourism',
        description: 'Essential vocabulary for traveling, booking hotels, asking for directions, and exploring new places.',
        icon: '✈️'
    },
    'business': {
        name: 'Business & Work',
        description: 'Professional vocabulary for workplace communication, meetings, emails, and career development.',
        icon: '💼'
    },
    'food': {
        name: 'Food & Cooking',
        description: 'Culinary vocabulary for ordering food, cooking, recipes, restaurants, and dining experiences.',
        icon: '🍽️'
    },
    'health': {
        name: 'Health & Medicine',
        description: 'Medical vocabulary for doctor visits, symptoms, medications, and health-related conversations.',
        icon: '🏥'
    },
    'technology': {
        name: 'Technology & Internet',
        description: 'Digital age vocabulary for computers, smartphones, social media, and online communication.',
        icon: '💻'
    },
    'education': {
        name: 'Education & School',
        description: 'Academic vocabulary for studying, exams, university life, and educational discussions.',
        icon: '🎓'
    },
    'sports': {
        name: 'Sports & Fitness',
        description: 'Athletic vocabulary for exercise, games, competitions, and fitness activities.',
        icon: '⚽'
    },
    'family': {
        name: 'Family & Relationships',
        description: 'Social vocabulary for family members, friendships, romantic relationships, and personal connections.',
        icon: '👨‍👩‍👧‍👦'
    },
    'nature': {
        name: 'Weather & Nature',
        description: 'Environmental vocabulary for weather conditions, seasons, plants, animals, and natural phenomena.',
        icon: '🌳'
    },
    'shopping': {
        name: 'Shopping & Money',
        description: 'Consumer vocabulary for shopping, prices, payments, banking, and financial matters.',
        icon: '🛍️'
    },
    'arts': {
        name: 'Arts & Culture',
        description: 'Creative vocabulary for music, painting, theater, literature, and cultural activities.',
        icon: '🎨'
    },
    'transportation': {
        name: 'Transportation',
        description: 'Mobility vocabulary for cars, trains, buses, bicycles, and all forms of getting around.',
        icon: '🚗'
    },
    'home': {
        name: 'Home & Living',
        description: 'Domestic vocabulary for furniture, appliances, household chores, and daily home life.',
        icon: '🏠'
    },
    'emotions': {
        name: 'Emotions & Feelings',
        description: 'Psychological vocabulary for expressing emotions, moods, mental states, and inner experiences.',
        icon: '😊'
    },
    'time': {
        name: 'Time & Calendar',
        description: 'Temporal vocabulary for dates, times, schedules, seasons, and time-related expressions.',
        icon: '🕐'
    }
};

// Sample thematic vocabulary for de-en (German-English)
const THEMATIC_WORDS = {
    'travel': [
        { word: 'Flughafen', translation: 'airport', example: 'Ich bin am Flughafen.', exampleTranslation: 'I am at the airport.' },
        { word: 'Hotel', translation: 'hotel', example: 'Das Hotel ist sehr schön.', exampleTranslation: 'The hotel is very nice.' },
        { word: 'Ticket', translation: 'ticket', example: 'Ich brauche ein Ticket.', exampleTranslation: 'I need a ticket.' },
        { word: 'Koffer', translation: 'suitcase', example: 'Mein Koffer ist schwer.', exampleTranslation: 'My suitcase is heavy.' },
        { word: 'Pass', translation: 'passport', example: 'Wo ist mein Pass?', exampleTranslation: 'Where is my passport?' },
        { word: 'Sehenswürdigkeit', translation: 'tourist attraction', example: 'Welche Sehenswürdigkeiten gibt es hier?', exampleTranslation: 'What tourist attractions are here?' },
        { word: 'Stadtplan', translation: 'city map', example: 'Haben Sie einen Stadtplan?', exampleTranslation: 'Do you have a city map?' },
        { word: 'Unterkunft', translation: 'accommodation', example: 'Ich suche eine Unterkunft.', exampleTranslation: 'I\'m looking for accommodation.' },
    ],
    'business': [
        { word: 'Besprechung', translation: 'meeting', example: 'Die Besprechung beginnt um 9 Uhr.', exampleTranslation: 'The meeting starts at 9 o\'clock.' },
        { word: 'Vertrag', translation: 'contract', example: 'Bitte unterschreiben Sie den Vertrag.', exampleTranslation: 'Please sign the contract.' },
        { word: 'Kunde', translation: 'customer/client', example: 'Der Kunde ist sehr zufrieden.', exampleTranslation: 'The customer is very satisfied.' },
        { word: 'Gehalt', translation: 'salary', example: 'Mein Gehalt ist gut.', exampleTranslation: 'My salary is good.' },
        { word: 'Büro', translation: 'office', example: 'Ich arbeite im Büro.', exampleTranslation: 'I work in the office.' },
        { word: 'Projekt', translation: 'project', example: 'Das Projekt ist fast fertig.', exampleTranslation: 'The project is almost finished.' },
        { word: 'Termin', translation: 'appointment', example: 'Ich habe einen Termin um 14 Uhr.', exampleTranslation: 'I have an appointment at 2 PM.' },
        { word: 'Bewerbung', translation: 'application', example: 'Meine Bewerbung wurde akzeptiert.', exampleTranslation: 'My application was accepted.' },
    ],
    'food': [
        { word: 'Speisekarte', translation: 'menu', example: 'Kann ich die Speisekarte haben?', exampleTranslation: 'Can I have the menu?' },
        { word: 'Rechnung', translation: 'bill/check', example: 'Die Rechnung, bitte!', exampleTranslation: 'The bill, please!' },
        { word: 'Rezept', translation: 'recipe', example: 'Das ist ein gutes Rezept.', exampleTranslation: 'That is a good recipe.' },
        { word: 'Kellner', translation: 'waiter', example: 'Der Kellner kommt gleich.', exampleTranslation: 'The waiter is coming soon.' },
        { word: 'Trinkgeld', translation: 'tip', example: 'Ich gebe 10% Trinkgeld.', exampleTranslation: 'I give a 10% tip.' },
        { word: 'Nachtisch', translation: 'dessert', example: 'Möchten Sie einen Nachtisch?', exampleTranslation: 'Would you like a dessert?' },
        { word: 'Getränk', translation: 'drink/beverage', example: 'Was für Getränke haben Sie?', exampleTranslation: 'What drinks do you have?' },
        { word: 'Vorspeise', translation: 'appetizer', example: 'Als Vorspeise nehme ich Suppe.', exampleTranslation: 'For an appetizer, I\'ll have soup.' },
    ],
    'health': [
        { word: 'Arzt', translation: 'doctor', example: 'Ich muss zum Arzt gehen.', exampleTranslation: 'I have to go to the doctor.' },
        { word: 'Schmerz', translation: 'pain', example: 'Ich habe starke Schmerzen.', exampleTranslation: 'I have severe pain.' },
        { word: 'Medikament', translation: 'medication', example: 'Ich nehme ein Medikament.', exampleTranslation: 'I\'m taking medication.' },
        { word: 'Apotheke', translation: 'pharmacy', example: 'Wo ist die nächste Apotheke?', exampleTranslation: 'Where is the nearest pharmacy?' },
        { word: 'Krankenhaus', translation: 'hospital', example: 'Er ist im Krankenhaus.', exampleTranslation: 'He is in the hospital.' },
        { word: 'Symptom', translation: 'symptom', example: 'Was sind die Symptome?', exampleTranslation: 'What are the symptoms?' },
        { word: 'Rezept', translation: 'prescription', example: 'Der Arzt hat mir ein Rezept gegeben.', exampleTranslation: 'The doctor gave me a prescription.' },
        { word: 'Termin', translation: 'appointment', example: 'Ich brauche einen Termin.', exampleTranslation: 'I need an appointment.' },
    ],
    'technology': [
        { word: 'Computer', translation: 'computer', example: 'Mein Computer ist neu.', exampleTranslation: 'My computer is new.' },
        { word: 'Handy', translation: 'mobile phone', example: 'Mein Handy funktioniert nicht.', exampleTranslation: 'My mobile phone doesn\'t work.' },
        { word: 'Internet', translation: 'internet', example: 'Haben Sie Internet?', exampleTranslation: 'Do you have internet?' },
        { word: 'E-Mail', translation: 'email', example: 'Ich schicke Ihnen eine E-Mail.', exampleTranslation: 'I\'ll send you an email.' },
        { word: 'Passwort', translation: 'password', example: 'Ich habe mein Passwort vergessen.', exampleTranslation: 'I forgot my password.' },
        { word: 'Bildschirm', translation: 'screen', example: 'Der Bildschirm ist kaputt.', exampleTranslation: 'The screen is broken.' },
        { word: 'Tastatur', translation: 'keyboard', example: 'Die Tastatur ist schmutzig.', exampleTranslation: 'The keyboard is dirty.' },
        { word: 'Datei', translation: 'file', example: 'Wo ist die Datei?', exampleTranslation: 'Where is the file?' },
    ],
    'education': [
        { word: 'Universität', translation: 'university', example: 'Ich studiere an der Universität.', exampleTranslation: 'I study at the university.' },
        { word: 'Prüfung', translation: 'exam', example: 'Ich habe morgen eine Prüfung.', exampleTranslation: 'I have an exam tomorrow.' },
        { word: 'Vorlesung', translation: 'lecture', example: 'Die Vorlesung war interessant.', exampleTranslation: 'The lecture was interesting.' },
        { word: 'Hausaufgabe', translation: 'homework', example: 'Ich muss meine Hausaufgaben machen.', exampleTranslation: 'I have to do my homework.' },
        { word: 'Bibliothek', translation: 'library', example: 'Ich lerne in der Bibliothek.', exampleTranslation: 'I study in the library.' },
        { word: 'Semester', translation: 'semester', example: 'Das Semester endet im Juli.', exampleTranslation: 'The semester ends in July.' },
        { word: 'Zeugnis', translation: 'certificate/report card', example: 'Mein Zeugnis ist sehr gut.', exampleTranslation: 'My report card is very good.' },
        { word: 'Stipendium', translation: 'scholarship', example: 'Ich habe ein Stipendium bekommen.', exampleTranslation: 'I got a scholarship.' },
    ],
    'sports': [
        { word: 'Training', translation: 'training/practice', example: 'Ich gehe zum Training.', exampleTranslation: 'I\'m going to practice.' },
        { word: 'Mannschaft', translation: 'team', example: 'Unsere Mannschaft hat gewonnen.', exampleTranslation: 'Our team won.' },
        { word: 'Wettkampf', translation: 'competition', example: 'Der Wettkampf ist morgen.', exampleTranslation: 'The competition is tomorrow.' },
        { word: 'Fitness', translation: 'fitness', example: 'Ich gehe ins Fitnessstudio.', exampleTranslation: 'I go to the gym.' },
        { word: 'Sieg', translation: 'victory', example: 'Das war ein großer Sieg!', exampleTranslation: 'That was a big victory!' },
        { word: 'Niederlage', translation: 'defeat', example: 'Die Niederlage war hart.', exampleTranslation: 'The defeat was hard.' },
        { word: 'Tor', translation: 'goal', example: 'Er hat ein Tor geschossen.', exampleTranslation: 'He scored a goal.' },
        { word: 'Spiel', translation: 'game/match', example: 'Das Spiel beginnt um 15 Uhr.', exampleTranslation: 'The game starts at 3 PM.' },
    ],
    'family': [
        { word: 'Eltern', translation: 'parents', example: 'Meine Eltern sind nett.', exampleTranslation: 'My parents are nice.' },
        { word: 'Geschwister', translation: 'siblings', example: 'Ich habe zwei Geschwister.', exampleTranslation: 'I have two siblings.' },
        { word: 'Verwandte', translation: 'relatives', example: 'Meine Verwandten kommen zu Besuch.', exampleTranslation: 'My relatives are coming to visit.' },
        { word: 'Hochzeit', translation: 'wedding', example: 'Die Hochzeit ist im Juni.', exampleTranslation: 'The wedding is in June.' },
        { word: 'Geburtstag', translation: 'birthday', example: 'Heute ist mein Geburtstag.', exampleTranslation: 'Today is my birthday.' },
        { word: 'Beziehung', translation: 'relationship', example: 'Wir haben eine gute Beziehung.', exampleTranslation: 'We have a good relationship.' },
        { word: 'Kindheit', translation: 'childhood', example: 'Meine Kindheit war schön.', exampleTranslation: 'My childhood was nice.' },
        { word: 'Generation', translation: 'generation', example: 'Drei Generationen leben zusammen.', exampleTranslation: 'Three generations live together.' },
    ],
    'nature': [
        { word: 'Regen', translation: 'rain', example: 'Es regnet heute.', exampleTranslation: 'It\'s raining today.' },
        { word: 'Sonne', translation: 'sun', example: 'Die Sonne scheint.', exampleTranslation: 'The sun is shining.' },
        { word: 'Schnee', translation: 'snow', example: 'Im Winter gibt es viel Schnee.', exampleTranslation: 'There is a lot of snow in winter.' },
        { word: 'Wind', translation: 'wind', example: 'Der Wind ist stark.', exampleTranslation: 'The wind is strong.' },
        { word: 'Temperatur', translation: 'temperature', example: 'Die Temperatur ist 20 Grad.', exampleTranslation: 'The temperature is 20 degrees.' },
        { word: 'Jahreszeit', translation: 'season', example: 'Welche Jahreszeit magst du?', exampleTranslation: 'Which season do you like?' },
        { word: 'Wald', translation: 'forest', example: 'Wir gehen im Wald spazieren.', exampleTranslation: 'We go for a walk in the forest.' },
        { word: 'Berg', translation: 'mountain', example: 'Der Berg ist sehr hoch.', exampleTranslation: 'The mountain is very high.' },
    ],
    'shopping': [
        { word: 'Preis', translation: 'price', example: 'Was ist der Preis?', exampleTranslation: 'What is the price?' },
        { word: 'Rabatt', translation: 'discount', example: 'Gibt es einen Rabatt?', exampleTranslation: 'Is there a discount?' },
        { word: 'Kasse', translation: 'checkout/register', example: 'Wo ist die Kasse?', exampleTranslation: 'Where is the checkout?' },
        { word: 'Quittung', translation: 'receipt', example: 'Kann ich eine Quittung haben?', exampleTranslation: 'Can I have a receipt?' },
        { word: 'Bargeld', translation: 'cash', example: 'Ich bezahle mit Bargeld.', exampleTranslation: 'I pay with cash.' },
        { word: 'Kreditkarte', translation: 'credit card', example: 'Akzeptieren Sie Kreditkarten?', exampleTranslation: 'Do you accept credit cards?' },
        { word: 'Größe', translation: 'size', example: 'Welche Größe haben Sie?', exampleTranslation: 'What size do you have?' },
        { word: 'Umtausch', translation: 'exchange', example: 'Kann ich das umtauschen?', exampleTranslation: 'Can I exchange this?' },
    ],
    'arts': [
        { word: 'Ausstellung', translation: 'exhibition', example: 'Die Ausstellung ist sehr interessant.', exampleTranslation: 'The exhibition is very interesting.' },
        { word: 'Gemälde', translation: 'painting', example: 'Das Gemälde ist wunderschön.', exampleTranslation: 'The painting is beautiful.' },
        { word: 'Konzert', translation: 'concert', example: 'Ich gehe heute Abend zu einem Konzert.', exampleTranslation: 'I\'m going to a concert tonight.' },
        { word: 'Theater', translation: 'theater', example: 'Das Stück im Theater war toll.', exampleTranslation: 'The play at the theater was great.' },
        { word: 'Musiker', translation: 'musician', example: 'Er ist ein talentierter Musiker.', exampleTranslation: 'He is a talented musician.' },
        { word: 'Künstler', translation: 'artist', example: 'Sie ist eine bekannte Künstlerin.', exampleTranslation: 'She is a well-known artist.' },
        { word: 'Roman', translation: 'novel', example: 'Ich lese gerade einen Roman.', exampleTranslation: 'I\'m reading a novel right now.' },
        { word: 'Skulptur', translation: 'sculpture', example: 'Die Skulptur steht im Park.', exampleTranslation: 'The sculpture is in the park.' },
    ],
    'transportation': [
        { word: 'Bahnhof', translation: 'train station', example: 'Der Bahnhof ist in der Nähe.', exampleTranslation: 'The train station is nearby.' },
        { word: 'Fahrplan', translation: 'schedule/timetable', example: 'Wo ist der Fahrplan?', exampleTranslation: 'Where is the schedule?' },
        { word: 'Fahrkarte', translation: 'ticket', example: 'Ich brauche eine Fahrkarte.', exampleTranslation: 'I need a ticket.' },
        { word: 'Haltestelle', translation: 'bus stop', example: 'Wo ist die nächste Haltestelle?', exampleTranslation: 'Where is the next bus stop?' },
        { word: 'Parkplatz', translation: 'parking lot', example: 'Ich suche einen Parkplatz.', exampleTranslation: 'I\'m looking for a parking lot.' },
        { word: 'Tankstelle', translation: 'gas station', example: 'Die Tankstelle ist dort drüben.', exampleTranslation: 'The gas station is over there.' },
        { word: 'Führerschein', translation: 'driver\'s license', example: 'Ich habe meinen Führerschein dabei.', exampleTranslation: 'I have my driver\'s license with me.' },
        { word: 'Verkehr', translation: 'traffic', example: 'Der Verkehr ist heute schlimm.', exampleTranslation: 'The traffic is bad today.' },
    ],
    'home': [
        { word: 'Möbel', translation: 'furniture', example: 'Wir kaufen neue Möbel.', exampleTranslation: 'We\'re buying new furniture.' },
        { word: 'Küche', translation: 'kitchen', example: 'Die Küche ist sehr modern.', exampleTranslation: 'The kitchen is very modern.' },
        { word: 'Schlafzimmer', translation: 'bedroom', example: 'Mein Schlafzimmer ist groß.', exampleTranslation: 'My bedroom is big.' },
        { word: 'Badezimmer', translation: 'bathroom', example: 'Das Badezimmer muss renoviert werden.', exampleTranslation: 'The bathroom needs to be renovated.' },
        { word: 'Wohnzimmer', translation: 'living room', example: 'Wir sitzen im Wohnzimmer.', exampleTranslation: 'We\'re sitting in the living room.' },
        { word: 'Miete', translation: 'rent', example: 'Die Miete ist zu hoch.', exampleTranslation: 'The rent is too high.' },
        { word: 'Hausarbeit', translation: 'housework', example: 'Ich muss Hausarbeit machen.', exampleTranslation: 'I have to do housework.' },
        { word: 'Nachbar', translation: 'neighbor', example: 'Meine Nachbarn sind freundlich.', exampleTranslation: 'My neighbors are friendly.' },
    ],
    'emotions': [
        { word: 'glücklich', translation: 'happy', example: 'Ich bin sehr glücklich.', exampleTranslation: 'I am very happy.' },
        { word: 'traurig', translation: 'sad', example: 'Sie sieht traurig aus.', exampleTranslation: 'She looks sad.' },
        { word: 'wütend', translation: 'angry', example: 'Er ist wütend auf mich.', exampleTranslation: 'He is angry at me.' },
        { word: 'aufgeregt', translation: 'excited', example: 'Ich bin so aufgeregt!', exampleTranslation: 'I\'m so excited!' },
        { word: 'nervös', translation: 'nervous', example: 'Ich bin vor der Prüfung nervös.', exampleTranslation: 'I\'m nervous before the exam.' },
        { word: 'entspannt', translation: 'relaxed', example: 'Ich fühle mich entspannt.', exampleTranslation: 'I feel relaxed.' },
        { word: 'ängstlich', translation: 'anxious/fearful', example: 'Sie ist ängstlich in der Dunkelheit.', exampleTranslation: 'She is anxious in the dark.' },
        { word: 'hoffnungsvoll', translation: 'hopeful', example: 'Wir sind hoffnungsvoll für die Zukunft.', exampleTranslation: 'We are hopeful for the future.' },
    ],
    'time': [
        { word: 'Uhr', translation: 'clock/o\'clock', example: 'Es ist 3 Uhr.', exampleTranslation: 'It is 3 o\'clock.' },
        { word: 'Minute', translation: 'minute', example: 'Ich komme in 5 Minuten.', exampleTranslation: 'I\'m coming in 5 minutes.' },
        { word: 'Stunde', translation: 'hour', example: 'Das dauert eine Stunde.', exampleTranslation: 'That takes an hour.' },
        { word: 'Woche', translation: 'week', example: 'Nächste Woche bin ich im Urlaub.', exampleTranslation: 'Next week I\'m on vacation.' },
        { word: 'Monat', translation: 'month', example: 'Dieser Monat war sehr stressig.', exampleTranslation: 'This month was very stressful.' },
        { word: 'Jahr', translation: 'year', example: 'Das war ein gutes Jahr.', exampleTranslation: 'That was a good year.' },
        { word: 'Termin', translation: 'appointment/deadline', example: 'Der Termin ist am Montag.', exampleTranslation: 'The appointment is on Monday.' },
        { word: 'Verspätung', translation: 'delay', example: 'Der Zug hat Verspätung.', exampleTranslation: 'The train is delayed.' },
    ]
};

async function populateThematicWordSets() {
    const client = await db.connect();

    try {
        console.log('🚀 Starting thematic word sets population...\n');

        await client.query('BEGIN');

        // Language pair: de-en (German-English)
        const languagePair = 'de-en';

        for (const [themeKey, config] of Object.entries(THEMATIC_SETS)) {
            console.log(`${config.icon} Creating word set: ${config.name}...`);

            // Create thematic word set
            const setResult = await client.query(`
                INSERT INTO word_sets (name, description, language_pair, theme, is_official)
                VALUES ($1, $2, $3, $4, true)
                RETURNING id
            `, [config.name, config.description, languagePair, themeKey]);

            const setId = setResult.rows[0].id;
            console.log(`   ✓ Created word set ID: ${setId}`);

            // Add words for this theme
            const words = THEMATIC_WORDS[themeKey] || [];
            let addedCount = 0;

            for (let i = 0; i < words.length; i++) {
                const wordData = words[i];

                // Check if word already exists (from CEFR sets or other sources)
                let wordResult = await client.query(
                    'SELECT id FROM words WHERE word = $1 AND language_pair_id IS NULL LIMIT 1',
                    [wordData.word]
                );

                let wordId;
                if (wordResult.rows.length > 0) {
                    wordId = wordResult.rows[0].id;
                } else {
                    // Create word as template (no user_id, no language_pair_id)
                    const newWordResult = await client.query(`
                        INSERT INTO words (word, translation, example, exampleTranslation, user_id, language_pair_id, source)
                        VALUES ($1, $2, $3, $4, NULL, NULL, $5)
                        RETURNING id
                    `, [
                        wordData.word,
                        wordData.translation,
                        wordData.example || '',
                        wordData.exampleTranslation || '',
                        `theme_${themeKey}`
                    ]);
                    wordId = newWordResult.rows[0].id;
                }

                // Add to word set
                await client.query(`
                    INSERT INTO word_set_items (word_set_id, word_id, order_index)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (word_set_id, word_id) DO NOTHING
                `, [setId, wordId, i]);

                addedCount++;
            }

            // Update word count
            await client.query(
                'UPDATE word_sets SET word_count = $1 WHERE id = $2',
                [addedCount, setId]
            );

            console.log(`   ✓ Added ${addedCount} words to ${config.name}\n`);
        }

        await client.query('COMMIT');

        console.log('✅ Thematic word sets population complete!\n');
        console.log('📊 Summary:');
        console.log(`   Language Pair: ${languagePair}`);
        console.log(`   Themes Created: ${Object.keys(THEMATIC_SETS).length}`);
        console.log(`   Total Sample Words: ${Object.values(THEMATIC_WORDS).flat().length}`);
        console.log('\n💡 Themes:');
        Object.values(THEMATIC_SETS).forEach(theme => {
            console.log(`   ${theme.icon} ${theme.name}`);
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error populating thematic word sets:', error);
        throw error;
    } finally {
        client.release();
        await db.end();
    }
}

// Run the script
populateThematicWordSets()
    .then(() => {
        console.log('\n🎉 Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
