#!/usr/bin/env node
/**
 * Import B2 collections directly to database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Import web source collections
const { b2WebSourceCollections } = require('./create-b2-from-web-sources');
const { b2ExpandedCollections } = require('./create-b2-expanded');
const { b2Batch2Collections } = require('./create-b2-batch2');
const { b2Batch3Collections } = require('./create-b2-batch3');

// B2 Collections (original sample collections)
const b2Collections = {
    "B2: Abstract Concepts": [
        { german: "die Gesellschaft", translation: "общество", example: "Die Gesellschaft hat sich stark verändert.", notes: "f." },
        { german: "die Verantwortung", translation: "ответственность", example: "Wir tragen Verantwortung für die Zukunft.", notes: "f." },
        { german: "die Herausforderung", translation: "вызов, проблема", example: "Das ist eine große Herausforderung.", notes: "f." },
        { german: "die Entwicklung", translation: "развитие", example: "Die technische Entwicklung schreitet voran.", notes: "f." },
        { german: "der Fortschritt", translation: "прогресс", example: "Der wissenschaftliche Fortschritt ist beeindruckend.", notes: "m." },
        { german: "der Einfluss", translation: "влияние", example: "Der Einfluss der Medien ist groß.", notes: "m." },
        { german: "die Entscheidung", translation: "решение", example: "Das war eine schwierige Entscheidung.", notes: "f." },
        { german: "die Voraussetzung", translation: "предпосылка, условие", example: "Eine gute Ausbildung ist Voraussetzung für diesen Job.", notes: "f." },
        { german: "die Unterstützung", translation: "поддержка", example: "Ich danke Ihnen für Ihre Unterstützung.", notes: "f." },
        { german: "das Verhalten", translation: "поведение", example: "Sein Verhalten ist unakzeptabel.", notes: "n." },
        { german: "die Fähigkeit", translation: "способность", example: "Er hat die Fähigkeit, andere zu motivieren.", notes: "f." },
        { german: "die Lösung", translation: "решение (проблемы)", example: "Wir müssen eine Lösung finden.", notes: "f." },
        { german: "das Ergebnis", translation: "результат", example: "Das Ergebnis war überraschend.", notes: "n." },
        { german: "die Konsequenz", translation: "последствие", example: "Jede Handlung hat Konsequenzen.", notes: "f." },
        { german: "die Maßnahme", translation: "мера, мероприятие", example: "Die Regierung ergreift neue Maßnahmen.", notes: "f." }
    ],

    "B2: Work & Career": [
        { german: "das Vorstellungsgespräch", translation: "собеседование", example: "Ich habe morgen ein Vorstellungsgespräch.", notes: "n." },
        { german: "die Bewerbung", translation: "заявка, резюме", example: "Ich schicke meine Bewerbung per E-Mail.", notes: "f." },
        { german: "das Arbeitsverhältnis", translation: "трудовые отношения", example: "Sein Arbeitsverhältnis wurde gekündigt.", notes: "n." },
        { german: "die Arbeitsbedingungen", translation: "условия труда", example: "Die Arbeitsbedingungen sind sehr gut.", notes: "f. pl." },
        { german: "die Weiterbildung", translation: "повышение квалификации", example: "Die Firma bietet kostenlose Weiterbildung an.", notes: "f." },
        { german: "die Fortbildung", translation: "профессиональное обучение", example: "Er besucht eine Fortbildung in Marketing.", notes: "f." },
        { german: "der Lebenslauf", translation: "резюме, биография", example: "Bitte senden Sie uns Ihren Lebenslauf.", notes: "m." },
        { german: "der Vertrag", translation: "договор, контракт", example: "Ich habe den Vertrag unterschrieben.", notes: "m." },
        { german: "kündigen", translation: "увольнять(ся)", example: "Er hat seinen Job gekündigt.", notes: "verb" },
        { german: "einstellen", translation: "принимать на работу", example: "Die Firma stellt neue Mitarbeiter ein.", notes: "verb" },
        { german: "geeignet sein", translation: "подходить", example: "Sie ist für diese Position gut geeignet.", notes: "expression" },
        { german: "das Fachgebiet", translation: "специальность, область", example: "IT ist mein Fachgebiet.", notes: "n." },
        { german: "die Qualifikation", translation: "квалификация", example: "Er hat die nötigen Qualifikationen.", notes: "f." },
        { german: "die Berufserfahrung", translation: "опыт работы", example: "Sie hat 5 Jahre Berufserfahrung.", notes: "f." },
        { german: "das Gehalt", translation: "зарплата", example: "Das Gehalt wird pünktlich überwiesen.", notes: "n." }
    ],

    "B2: Society & Media": [
        { german: "die Umwelt", translation: "окружающая среда", example: "Wir müssen die Umwelt schützen.", notes: "f." },
        { german: "der Klimawandel", translation: "изменение климата", example: "Der Klimawandel ist eine globale Bedrohung.", notes: "m." },
        { german: "die Meinungsfreiheit", translation: "свобода слова", example: "Meinungsfreiheit ist ein Grundrecht.", notes: "f." },
        { german: "die Gleichberechtigung", translation: "равноправие", example: "Gleichberechtigung von Mann und Frau ist wichtig.", notes: "f." },
        { german: "die Integration", translation: "интеграция", example: "Die Integration von Migranten ist eine Herausforderung.", notes: "f." },
        { german: "die Migration", translation: "миграция", example: "Migration ist ein globales Phänomen.", notes: "f." },
        { german: "die Nachrichten", translation: "новости", example: "Ich schaue jeden Abend die Nachrichten.", notes: "f. pl." },
        { german: "die Werbung", translation: "реклама", example: "Die Werbung beeinflusst unser Kaufverhalten.", notes: "f." },
        { german: "die Schlagzeile", translation: "заголовок", example: "Diese Schlagzeile ist reißerisch.", notes: "f." },
        { german: "die Quelle", translation: "источник", example: "Nennen Sie bitte Ihre Quellen.", notes: "f." },
        { german: "veröffentlichen", translation: "публиковать", example: "Der Artikel wird morgen veröffentlicht.", notes: "verb" },
        { german: "berichten über", translation: "сообщать о", example: "Die Medien berichten über den Vorfall.", notes: "verb" },
        { german: "beeinflussen", translation: "влиять", example: "Werbung beeinflusst unsere Entscheidungen.", notes: "verb" },
        { german: "die Demokratie", translation: "демократия", example: "Deutschland ist eine Demokratie.", notes: "f." },
        { german: "die Politik", translation: "политика", example: "Er interessiert sich für Politik.", notes: "f." }
    ],

    "B2: Health & Psychology": [
        { german: "die Gesundheit", translation: "здоровье", example: "Gesundheit ist das wichtigste Gut.", notes: "f." },
        { german: "das Wohlbefinden", translation: "благополучие", example: "Sport steigert das körperliche Wohlbefinden.", notes: "n." },
        { german: "die Ernährung", translation: "питание", example: "Gesunde Ernährung ist wichtig.", notes: "f." },
        { german: "der Schlafmangel", translation: "недостаток сна", example: "Schlafmangel beeinträchtigt die Konzentration.", notes: "m." },
        { german: "die Sucht", translation: "зависимость", example: "Rauchen kann zur Sucht werden.", notes: "f." },
        { german: "das Selbstbewusstsein", translation: "уверенность в себе", example: "Sie hat ein starkes Selbstbewusstsein.", notes: "n." },
        { german: "die Depression", translation: "депрессия", example: "Depression ist eine ernste Krankheit.", notes: "f." },
        { german: "die Behandlung", translation: "лечение", example: "Die Behandlung dauert mehrere Wochen.", notes: "f." },
        { german: "der Arztbesuch", translation: "визит к врачу", example: "Ein Arztbesuch ist notwendig.", notes: "m." },
        { german: "die Überweisung", translation: "направление (к врачу)", example: "Der Hausarzt gab mir eine Überweisung.", notes: "f." },
        { german: "die Vorsorge", translation: "профилактика", example: "Vorsorge ist besser als Nachsorge.", notes: "f." },
        { german: "die Krankenversicherung", translation: "медицинская страховка", example: "Jeder braucht eine Krankenversicherung.", notes: "f." },
        { german: "der Stress", translation: "стресс", example: "Zu viel Stress ist ungesund.", notes: "m." },
        { german: "die Entspannung", translation: "расслабление", example: "Yoga dient der Entspannung.", notes: "f." },
        { german: "die Therapie", translation: "терапия", example: "Er macht eine Therapie.", notes: "f." }
    ]
};

async function importCollections() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting B2 collections import...\n');

        // Get demo user and German-Russian language pair
        const userResult = await client.query(
            "SELECT id FROM users WHERE email = 'demo@fluentflow.app' LIMIT 1"
        );

        if (userResult.rows.length === 0) {
            throw new Error('Demo user not found');
        }

        const userId = userResult.rows[0].id;

        let totalImported = 0;
        let totalSkipped = 0;

        // Merge all collections
        const allCollections = { ...b2Collections, ...b2WebSourceCollections, ...b2ExpandedCollections, ...b2Batch2Collections, ...b2Batch3Collections };

        for (const [collectionName, words] of Object.entries(allCollections)) {
            console.log(`\n📦 Processing: ${collectionName}`);

            // Check if collection exists
            let collResult = await client.query(
                `SELECT id FROM global_word_collections
                 WHERE name = $1 AND from_lang = $2 AND to_lang = $3`,
                [collectionName, 'de', 'ru']
            );

            let collectionId;

            if (collResult.rows.length > 0) {
                collectionId = collResult.rows[0].id;
                console.log(`   📌 Collection exists (ID: ${collectionId})`);
            } else {
                // Create collection
                collResult = await client.query(
                    `INSERT INTO global_word_collections
                     (name, from_lang, to_lang, description, difficulty_level, word_count, is_public)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id`,
                    [collectionName, 'de', 'ru', `B2 level vocabulary: ${collectionName}`, 'B2', words.length, true]
                );
                collectionId = collResult.rows[0].id;
                console.log(`   ✨ Collection created (ID: ${collectionId})`);
            }

            // Import words
            let imported = 0;
            let skipped = 0;

            for (const word of words) {
                try {
                    // Check if word already exists
                    const existingWord = await client.query(
                        `SELECT id FROM global_collection_words
                         WHERE collection_id = $1 AND word = $2`,
                        [collectionId, word.german]
                    );

                    if (existingWord.rows.length > 0) {
                        skipped++;
                        continue;
                    }

                    // Insert new word
                    await client.query(
                        `INSERT INTO global_collection_words
                         (collection_id, word, translation, example, exampleTranslation)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [
                            collectionId,
                            word.german,
                            word.translation,
                            word.example,
                            word.notes // Notes go into exampleTranslation field
                        ]
                    );
                    imported++;
                } catch (err) {
                    console.error(`   ⚠️  Error importing "${word.german}":`, err.message);
                    skipped++;
                }
            }

            console.log(`   ✅ Imported: ${imported} words`);
            if (skipped > 0) {
                console.log(`   ⚠️  Skipped: ${skipped} words (duplicates or errors)`);
            }

            totalImported += imported;
            totalSkipped += skipped;
        }

        console.log(`\n📊 Summary:`);
        console.log(`   - Total imported: ${totalImported} words`);
        console.log(`   - Total skipped: ${totalSkipped} words`);
        console.log(`   - Collections created: ${Object.keys(b2Collections).length}`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

importCollections();
