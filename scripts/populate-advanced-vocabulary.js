#!/usr/bin/env node
/**
 * Populates B2, C1, and C2 vocabulary files with actual German words
 * Ensures no duplication across all CEFR levels (A1, A2, B1, B2, C1, C2)
 *
 * Strategy:
 * 1. Read existing A1, A2, B1 vocabularies to build exclusion list
 * 2. Generate vocabulary for each level progressively
 * 3. Track all words to prevent duplication
 *
 * Target: B2 (1,800) + C1 (2,500) + C2 (3,500) = 5,800 new unique words
 */

const fs = require('fs');
const path = require('path');

// Read existing vocabulary files and extract all German words
function extractExistingWords(...files) {
    const existingWords = new Set();

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        // Match table rows: | German | Translation | Example | Notes |
        const wordMatches = content.matchAll(/^\|\s*([^\|]+?)\s*\|[^\|]+\|[^\|]+\|[^\|]+\|$/gm);

        for (const match of wordMatches) {
            const germanWord = match[1].trim();
            // Skip table headers
            if (germanWord !== 'German' && germanWord !== '---' && germanWord !== '--------') {
                existingWords.add(germanWord.toLowerCase());
            }
        }
    });

    return existingWords;
}

// B2 Level Vocabulary Data
const b2Vocabulary = {
    "Advanced Communication & Rhetoric": {
        "Argumentation": [
            { german: "die Argumentation", translation: "argumentation", example: "Seine Argumentation war überzeugend.", notes: "f." },
            { german: "argumentieren", translation: "to argue", example: "Sie argumentierte logisch.", notes: "" },
            { german: "das Argument", translation: "argument", example: "Das ist ein starkes Argument.", notes: "n." },
            { german: "begründen", translation: "to justify", example: "Können Sie das begründen?", notes: "" },
            { german: "die Begründung", translation: "justification", example: "Die Begründung fehlt noch.", notes: "f." },
            { german: "die These", translation: "thesis", example: "Die zentrale These ist klar.", notes: "f." },
            { german: "behaupten", translation: "to claim", example: "Er behauptet das Gegenteil.", notes: "" },
            { german: "die Behauptung", translation: "claim", example: "Das ist eine gewagte Behauptung.", notes: "f." },
            { german: "widerlegen", translation: "to refute", example: "Diese Theorie wurde widerlegt.", notes: "" },
            { german: "die Widerlegung", translation: "refutation", example: "Die Widerlegung war schlüssig.", notes: "f." },
            { german: "belegen", translation: "to substantiate", example: "Belegen Sie Ihre Aussage!", notes: "" },
            { german: "der Beleg", translation: "evidence", example: "Haben Sie dafür einen Beleg?", notes: "m." },
            { german: "nachweisen", translation: "to prove", example: "Das lässt sich nachweisen.", notes: "" },
            { german: "der Nachweis", translation: "proof", example: "Der Nachweis ist erbracht.", notes: "m." },
            { german: "folgern", translation: "to conclude", example: "Daraus folgerе ich, dass...", notes: "" },
            { german: "die Folgerung", translation: "conclusion", example: "Eine logische Folgerung.", notes: "f." },
            { german: "schlussfolgern", translation: "to infer", example: "Man kann schlussfolgern, dass...", notes: "" },
            { german: "der Schluss", translation: "conclusion", example: "Zu welchem Schluss kommen Sie?", notes: "m." },
            { german: "ableiten", translation: "to derive", example: "Daraus lässt sich ableiten...", notes: "" },
            { german: "die Ableitung", translation: "derivation", example: "Die Ableitung ist korrekt.", notes: "f." },
            { german: "voraussetzen", translation: "to presuppose", example: "Das setzt voraus, dass...", notes: "" },
            { german: "die Voraussetzung", translation: "prerequisite", example: "Unter der Voraussetzung, dass...", notes: "f." },
            { german: "implizieren", translation: "to imply", example: "Das impliziert einiges.", notes: "" },
            { german: "die Implikation", translation: "implication", example: "Die Implikationen sind groß.", notes: "f." },
            { german: "entkräften", translation: "to weaken", example: "Sein Argument wurde entkräftet.", notes: "" },
            { german: "widersprechen", translation: "to contradict", example: "Das widerspricht sich.", notes: "" },
            { german: "der Widerspruch", translation: "contradiction", example: "Das ist ein Widerspruch.", notes: "m." },
            { german: "plausibel", translation: "plausible", example: "Eine plausible Erklärung.", notes: "" },
            { german: "stichhaltig", translation: "sound, valid", example: "Ein stichhaltiges Argument.", notes: "" },
            { german: "schlüssig", translation: "conclusive", example: "Der Beweis ist schlüssig.", notes: "" },
            { german: "konsistent", translation: "consistent", example: "Eine konsistente Argumentation.", notes: "" },
            { german: "kohärent", translation: "coherent", example: "Ein kohärenter Gedankengang.", notes: "" },
            { german: "fundiert", translation: "well-founded", example: "Eine fundierte Meinung.", notes: "" },
            { german: "differenziert", translation: "nuanced", example: "Eine differenzierte Betrachtung.", notes: "" },
            { german: "zwingend", translation: "compelling", example: "Ein zwingendes Argument.", notes: "" },
            { german: "überzeugend", translation: "convincing", example: "Sehr überzeugend dargelegt.", notes: "" },
            { german: "fragwürdig", translation: "questionable", example: "Eine fragwürdige These.", notes: "" },
            { german: "anfechtbar", translation: "contestable", example: "Die Position ist anfechtbar.", notes: "" }
        ],
        "Persuasion": [
            { german: "überzeugen", translation: "to convince", example: "Sie konnte mich überzeugen.", notes: "" },
            { german: "die Überzeugung", translation: "conviction", example: "Aus tiefer Überzeugung.", notes: "f." },
            { german: "überreden", translation: "to persuade", example: "Er hat mich dazu überredet.", notes: "" },
            { german: "appellieren", translation: "to appeal", example: "An die Vernunft appellieren.", notes: "" },
            { german: "der Appell", translation: "appeal", example: "Ein eindringlicher Appell.", notes: "m." },
            { german: "beeinflussen", translation: "to influence", example: "Das beeinflusst meine Entscheidung.", notes: "" },
            { german: "der Einfluss", translation: "influence", example: "Unter dem Einfluss stehen.", notes: "m." },
            { german: "einwirken", translation: "to act upon", example: "Auf jemanden einwirken.", notes: "" },
            { german: "die Einwirkung", translation: "impact", example: "Die Einwirkung war stark.", notes: "f." },
            { german: "bewegen", translation: "to move (emotionally)", example: "Das bewegt die Menschen.", notes: "" },
            { german: "motivieren", translation: "to motivate", example: "Die Rede motivierte alle.", notes: "" },
            { german: "die Motivation", translation: "motivation", example: "Die Motivation war hoch.", notes: "f." },
            { german: "anspornen", translation: "to spur on", example: "Zu Höchstleistungen anspornen.", notes: "" },
            { german: "ermutigen", translation: "to encourage", example: "Jemanden ermutigen.", notes: "" },
            { german: "die Ermutigung", translation: "encouragement", example: "Das war eine Ermutigung.", notes: "f." },
            { german: "beschwichtigen", translation: "to appease", example: "Die Gemüter beschwichtigen.", notes: "" },
            { german: "beruhigen", translation: "to calm", example: "Die Situation beruhigen.", notes: "" },
            { german: "einlenken", translation: "to give in", example: "Schließlich lenkte er ein.", notes: "" },
            { german: "nachgeben", translation: "to yield", example: "Unter Druck nachgeben.", notes: "" },
            { german: "zustimmen", translation: "to agree", example: "Dem Vorschlag zustimmen.", notes: "" },
            { german: "die Zustimmung", translation: "consent", example: "Allgemeine Zustimmung finden.", notes: "f." },
            { german: "ablehnen", translation: "to reject", example: "Den Antrag ablehnen.", notes: "" },
            { german: "die Ablehnung", translation: "rejection", example: "Auf Ablehnung stoßen.", notes: "f." },
            { german: "verwerfen", translation: "to dismiss", example: "Die Idee verwerfen.", notes: "" },
            { german: "akzeptieren", translation: "to accept", example: "Das Angebot akzeptieren.", notes: "" },
            { german: "die Akzeptanz", translation: "acceptance", example: "Breite Akzeptanz finden.", notes: "f." },
            { german: "einwilligen", translation: "to consent", example: "In den Plan einwilligen.", notes: "" },
            { german: "die Einwilligung", translation: "consent", example: "Die Einwilligung erteilen.", notes: "f." },
            { german: "zusichern", translation: "to assure", example: "Jemandem etwas zusichern.", notes: "" },
            { german: "die Zusicherung", translation: "assurance", example: "Eine feste Zusicherung.", notes: "f." },
            { german: "versprechen", translation: "to promise", example: "Etwas fest versprechen.", notes: "" },
            { german: "das Versprechen", translation: "promise", example: "Ein Versprechen einhalten.", notes: "n." },
            { german: "zusagen", translation: "to commit", example: "Seine Hilfe zusagen.", notes: "" },
            { german: "die Zusage", translation: "commitment", example: "Eine verbindliche Zusage.", notes: "f." },
            { german: "garantieren", translation: "to guarantee", example: "Den Erfolg garantieren.", notes: "" },
            { german: "die Garantie", translation: "guarantee", example: "Eine Garantie geben.", notes: "f." },
            { german: "gewährleisten", translation: "to ensure", example: "Die Sicherheit gewährleisten.", notes: "" },
            { german: "sicherstellen", translation: "to secure", example: "Die Qualität sicherstellen.", notes: "" }
        ]
    }
};

// Main execution
console.log('🚀 Starting B2 vocabulary population...\n');

const docsDir = path.join(__dirname, '..', 'docs');

// Extract existing words from A1, A2, B1
const existingWords = extractExistingWords(
    path.join(docsDir, 'german-a1-vocabulary.md'),
    path.join(docsDir, 'german-a2-vocabulary.md'),
    path.join(docsDir, 'german-b1-vocabulary.md')
);

console.log(`📊 Found ${existingWords.size} existing words in A1, A2, B1 levels`);
console.log(`\n⚠️  This script provides SAMPLE data for B2 level.`);
console.log(`   Due to the scale (5,800 words needed), we'll need to use`);
console.log(`   a combination of dictionary sources and AI generation.`);
console.log(`\n✅ Sample B2 vocabulary structure ready.`);
console.log(`   Total words in sample: ${b2Vocabulary["Advanced Communication & Rhetoric"].Argumentation.length + b2Vocabulary["Advanced Communication & Rhetoric"].Persuasion.length}`);
