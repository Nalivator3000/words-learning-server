const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:uPGJKLcZLFGTZeRbnzPOVTlzWRObbnKO@mainline.proxy.rlwy.net:54625/railway'
});

// Dictionary of German → Russian translations for common words
const GERMAN_TO_RUSSIAN = {
    // Pronouns
    "ich": "я",
    "du": "ты",
    "er": "он",
    "sie": "они", // or "она" depending on context
    "es": "оно",
    "wir": "мы",
    "ihr": "вы (мн.ч.)",
    "Sie": "Вы (вежл.)",

    // Greetings
    "Hallo": "Привет",
    "Guten Morgen": "Доброе утро",
    "Guten Tag": "Добрый день",
    "Guten Abend": "Добрый вечер",
    "Gute Nacht": "Спокойной ночи",
    "Tschüss": "Пока",
    "Auf Wiedersehen": "До свидания",
    "Bis bald": "До скорого",

    // Politeness
    "Danke": "Спасибо",
    "danke": "спасибо",
    "Bitte": "Пожалуйста",
    "bitte": "пожалуйста",
    "Entschuldigung": "Извините",

    // Yes/No
    "ja": "да",
    "nein": "нет",
    "Ja": "Да",
    "Nein": "Нет",

    // Question words
    "wie": "как",
    "was": "что",
    "wo": "где",
    "wer": "кто",
    "wann": "когда",
    "warum": "почему",
    "welche(r/s)": "который",
    "welcher": "который",
    "welche": "которая",
    "welches": "которое",

    // Common nouns
    "das Glas": "стакан",
    "das Wechselgeld": "сдача",
    "der Stock": "этаж",
    "die Klimaanlage": "кондиционер",
    "die Abteilung": "отдел",
    "das Fach": "предмет",
    "die Ausstellung": "выставка",
    "das Zelt": "палатка",
    "der Verein": "клуб",
    "die Verspätung": "опоздание",
    "das Salz": "соль",
    "die Wut": "гнев",

    // Common verbs
    "wandern": "ходить в поход",
    "aufwachen": "просыпаться",
    "einstellen": "нанимать",
    "nachschlagen": "искать (в словаре)",
    "reisen": "путешествовать",
    "zahlen": "платить",
    "sich beschweren": "жаловаться",

    // Adjectives
    "wütend": "злой",
    "erstaunt": "удивленный",
    "global": "глобальный",

    // More nouns
    "der Stolz": "гордость",
    "der Hass": "ненависть",
    "die Geduld": "терпение",
    "die Beziehung": "отношения",
    "die Beförderung": "повышение",
    "die Gerechtigkeit": "справедливость",
    "die Tatsache": "факт",

    // More verbs
    "vertrauen": "доверять",
    "zustimmen": "соглашаться",
    "widersprechen": "противоречить",
    "feststellen": "определять",
    "annehmen": "принимать",
    "sich unterhalten": "беседовать",
    "hinweisen auf": "указывать на",
    "hervorheben": "выделять",
    "unterbrechen": "прерывать",
    "fortfahren": "продолжать",
    "erledigen": "выполнять",
    "organisieren": "организовывать",
    "leiten": "руководить",
    "wegwerfen": "выбрасывать",
    "vergleichen": "сравнивать",
};

async function translateEnglishToRussian() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        TRANSLATING ENGLISH TO RUSSIAN IN DATABASE            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        const data = JSON.parse(fs.readFileSync('english-to-russian-translations.json', 'utf8'));
        console.log(`Loaded ${data.length} words to translate\n`);

        let translatedCount = 0;
        let skippedCount = 0;
        const updates = [];

        // First pass: use dictionary
        for (const item of data) {
            if (GERMAN_TO_RUSSIAN[item.german]) {
                item.russian = GERMAN_TO_RUSSIAN[item.german];
                updates.push(item);
                translatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`✅ Translated ${translatedCount} words using dictionary`);
        console.log(`⏭️  Skipped ${skippedCount} words (not in dictionary)\n`);

        if (updates.length === 0) {
            console.log('No translations to update');
            return;
        }

        console.log(`Updating ${updates.length} translations in database...\n`);

        let updated = 0;
        for (const item of updates) {
            const query = `
                UPDATE target_translations_russian
                SET translation = $1
                WHERE id = $2
            `;

            await pool.query(query, [item.russian, item.translation_id]);
            updated++;

            if (updated % 10 === 0) {
                console.log(`Progress: ${updated}/${updates.length} updated`);
            }
        }

        console.log(`\n✅ Successfully updated ${updated} translations!\n`);

        // Show sample
        console.log('Sample updates:');
        updates.slice(0, 10).forEach((item, i) => {
            console.log(`${i + 1}. "${item.german}" → EN: "${item.english}" → RU: "${item.russian}"`);
        });

        // Save remaining words that need manual translation
        const remaining = data.filter(item => !item.russian);
        fs.writeFileSync('remaining-to-translate.json', JSON.stringify(remaining, null, 2));
        console.log(`\n📝 Saved ${remaining.length} remaining words to remaining-to-translate.json`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }

    await pool.end();
}

translateEnglishToRussian().catch(console.error);
