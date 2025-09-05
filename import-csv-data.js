// Script to import CSV data for root user
// Parses the German vocabulary CSV and adds words to database

async function importGermanVocabForRoot() {
    console.log('🇩🇪 Importing German vocabulary for root user...');
    
    const csvData = `auffallen,"Mir ist aufgefallen, dass er heute sehr müde aussieht.","Замечать, бросаться в глаза","Я заметил, что сегодня он выглядит очень уставшим."
feststehen,"Es steht fest, dass wir uns am Freitag treffen.","Быть решённым, быть установленным","Решено, что мы встретимся в пятницу."
besitzen,Unsere Nachbarn besitzen einen großen Hund.,"Владеть, обладать",Наши соседи владеют большой собакой.
beitragen,Dieses Buch trägt zur Forschung bei.,"Вносить вклад, способствовать",Эта книга вносит вклад в исследование.
eintragen,Du musst dich in die Liste eintragen.,"Вносить, вписывать",Ты должен вписаться в список.
entstehen,Wie ist dieses Problem entstanden?,"Возникать, появляться",Как возникла эта проблема?
erziehen,Man muss die Kinder zu Respekt erziehen.,Воспитывать,Нужно воспитывать в детях уважение.
einblenden,Der Nachrichtensprecher wird gleich eine Grafik einblenden.,"Вставлять (на экран), включать",Диктор новостей сейчас покажет график.
einreiben,Reib die Salbe auf die betroffene Stelle ein.,Втирать,Вотри мазь в поражённое место.
betreten,Der Hund darf das Haus nicht betreten.,"Входить, ступать",Собаке нельзя входить в дом.
ausladen,"Kannst du mir helfen, die Einkäufe auszuladen?","Выгружать, разгружать",Ты можешь помочь мне разгрузить покупки?
aushalten,"Er musste aushalten, dass man über ihn lachte.","Выдерживать, терпеть","Ему пришлось терпеть, что над ним смеялись."
brennen,Die Kerze brennt bis zum Ende.,Гореть,Свеча горит до конца.
festhalten,"Ich halte mich am Geländer fest, damit ich nicht falle.","Удерживать, держаться","Я держусь за перила, чтобы не упасть."
beweisen,"Er hat bewiesen, dass er ein guter Koch ist.",Доказывать,"Он доказал, что он хороший повар."
die Leistung,Wir sind mit der Leistung des Motors sehr zufrieden.,"Мощность, производительность",Мы очень довольны мощностью двигателя.
sich verlaufen,Wir haben uns im Wald verlaufen.,Заблудиться,Мы заблудились в лесу.
aufhalten,Ein Schneesturm hielt den Verkehr auf.,Задерживать,Снежная буря задержала движение.
begraben,Sie haben den Hund im Garten begraben.,"Закапывать, хоронить",Они похоронили собаку в саду.
erfinden,Kinder erfinden gerne Geschichten.,Изобретать,Дети любят придумывать истории.
ablaufen,Der Pass ist abgelaufen.,"Истекать (о сроке), протекать",Срок действия паспорта истёк.
verschwinden,Mein Schlüssel ist spurlos verschwunden.,Исчезать,Мой ключ бесследно исчез.
betreffen,Die neue Regelung betrifft alle Mitarbeiter.,"Касаться, относиться",Новое правило касается всех сотрудников.
genießen,Ich sitze im Garten und genieße die Ruhe.,Наслаждаться,Я сижу в саду и наслаждаюсь тишиной.
einstellen,Die Fabrik wird die Produktion einstellen.,"Прекращать, настраивать",Фабрика прекратит производство.
anfangen,Der Film fängt in fünf Minuten an.,Начинать(ся),Фильм начинается через пять минут.
ansprechen,Ich werde ihn morgen darauf ansprechen.,"Заговаривать, обращаться",Я поговорю с ним об этом завтра.
besprechen,Wir müssen das Thema im Meeting besprechen.,Обсуждать,Мы должны обсудить эту тему на совещании.
die Gefahren,Man muss sich vor den Gefahren des Internets schützen.,Опасности,Нужно защищаться от опасностей интернета.
anhalten,"Die Regierung hat angehalten, sparsam mit Wasser umzugehen.","Призывать, останавливать(ся)",Правительство призвало экономно расходовать воду.
aufschieben,Er hat die Bezahlung der Rechnung immer wieder aufgeschoben.,Откладывать,Он снова и снова откладывал оплату счета.
aufschließen,Hast du den Schrank aufgeschlossen?,Открывать (ключом),Ты открыл шкаф?
aufschlagen,"Ich habe mein Knie aufgeschlagen, als ich gestürzt bin.","Открывать (книгу), расшибать","Я разбил колено, когда упал."
ausfallen,Der Zug ist wegen eines technischen Defekts ausgefallen.,"Отменяться, выпадать",Поезд был отменён из-за технической неисправности.
sich beziehen,Mein Brief bezieht sich auf unser letztes Gespräch.,"Относиться, ссылаться",Моё письмо относится к нашему последнему разговору.
die Beziehung,Die Beziehung zwischen den Ländern hat sich verbessert.,"Отношение, связь",Отношения между странами улучшились.
biegen,"Das Schild sagt, dass wir hier rechts biegen müssen.","Поворачивать, сгибать","Табличка гласит, что мы должны здесь повернуть направо."
ansteigen,Die Temperatur wird morgen stark ansteigen.,"Повышаться, расти",Завтра температура сильно поднимется.
erhalten,Er erhält ein hohes Gehalt für seine Arbeit.,Получать,Он получает высокую зарплату за свою работу.
(sich) ergeben,Aus der Rechnung ergab sich ein Fehler.,"Вытекать, следовать (из чего-то)",Из счёта следовала ошибка.
begreifen,"Er konnte nicht begreifen, wie die Magie funktionierte.","Понимать, осознавать","Он не мог понять, как работает магия."
begreifen,"Es ist schwer, dieses Konzept zu begreifen.",Понимать,Это понятие сложно понять.
eintreffen,Die Gäste werden gegen 18 Uhr eintreffen.,Прибывать,Гости прибудут около 18:00.
sich ausdenken,Ich denke mir eine neue Geschichte aus.,Придумывать,Я придумываю новую историю.
aufrufen,Die App ruft ständig meine Standortdaten auf.,"Вызывать, обращаться",Приложение постоянно запрашивает данные о моём местоположении.
befehlen,"Der General befahl den Soldaten, vorzurücken.",Приказывать,Генерал приказал солдатам наступать.
anwenden,Man sollte diese Salbe zweimal täglich anwenden.,Применять,Эту мазь следует применять дважды в день.
empfangen,Sie hat die Gäste herzlich empfangen.,"Принимать, встречать",Она радушно встретила гостей.
annehmen,"Wir nehmen an, dass das Projekt erfolgreich sein wird.","Принимать, предполагать","Мы предполагаем, что проект будет успешным."
einfallen,Mir ist nichts mehr dazu eingefallen.,Приходить на ум,Мне больше ничего не пришло в голову по этому поводу.
geschehen,Es ist ein Unglück geschehen.,"Происходить, случаться",Произошло несчастье.
verzeihen,"Bitte verzeih mir, ich wollte das nicht.",Прощать,"Пожалуйста, прости меня, я не хотел этого."
erschrecken,"Ich erschrecke, wenn jemand hinter mir steht.","Пугаться, испугаться","Я пугаюсь, когда кто-то стоит сзади."
beschließen,Die Regierung hat ein neues Gesetz beschlossen.,"Принимать решение, постановлять",Правительство приняло новый закон.
entscheiden,Er musste sich zwischen zwei Jobs entscheiden.,"Решать, принимать решение",Ему пришлось выбирать между двумя работами.
die Entscheidung,Das war eine falsche Entscheidung.,Решение,Это было неправильное решение.
bindenden,Eine mündliche Zusage ist nicht bindend.,"Обязательный, обязывающий",Устное обещание не является обязательным.
aufgeben,Wir haben unsere Bestellung im Restaurant aufgegeben.,"Отказываться, сдаваться, заказывать",Мы сделали заказ в ресторане.
das Ereignis,Die Hochzeit war ein sehr schönes Ereignis.,Событие,Свадьба была очень красивым событием.
die Vereinbarung,Wir haben eine mündliche Vereinbarung getroffen.,"Соглашение, договоренность",Мы достигли устной договоренности.
schaffen,Er schaffte die Prüfung ohne große Mühe.,"Создавать, справляться",Он сдал экзамен без особых усилий.
betragen,Die Kosten betragen 100 Euro.,Составлять,Стоимость составляет 100 евро.
behalten,Du kannst das Buch behalten.,"Сохранять, оставлять у себя",Ты можешь оставить книгу себе.
ertrinken,Die kleine Katze wäre fast im Bach ertrunken.,Тонуть,Маленький котёнок чуть не утонул в ручье.
ziehen,Er zog die Tür hinter sich zu.,Тянуть,Он закрыл дверь за собой.
gelingen,"Es ist ihm gelungen, das schwierige Problem zu lösen.",Удаваться,Ему удалось решить сложную проблему.
das Vergnügen,"Es ist ein Vergnügen, mit dir zu arbeiten.",Удовольствие,Работать с тобой — одно удовольствие.
erfahre,"Er erfuhr, dass sein Freund verreist ist.","Узнавать, получать сведения","Он узнал, что его друг уехал."
empfinden,"Ich empfinde große Freude, wenn ich Musik höre.","Ощущать, чувствовать","Я испытываю большую радость, когда слушаю музыку."
nachgeben,Er konnte dem Druck nicht länger nachgeben.,"уступать, поддаваться",Он больше не мог поддаваться давлению.
mitschreiben,Bitte schreiben Sie alles Wichtige mit.,записывать (следом),"Пожалуйста, запишите всё важное."
heranbilden,Er will sich als Ingenieur heranbilden.,"формировать, обучать",Он хочет обучиться на инженера.
messen,Wir müssen die Länge des Raumes messen.,измерять,Мы должны измерить длину комнаты.
greifen,Sie griff nach seiner Hand.,"хватать, браться за что-то",Она схватила его за руку.
gießen,Könntest du bitte die Blumen gießen?,"поливать, лить","Ты мог бы, пожалуйста, полить цветы?"
sich gleichen,Die beiden Brüder gleichen sich sehr.,быть похожим,Оба брата очень похожи друг на друга.
hervorheben,Er wollte die Bedeutung dieses Punktes hervorheben.,"выделять, подчеркивать",Он хотел подчеркнуть важность этого пункта.
herunterkommen,Das Haus ist ganz heruntergekommen.,"спускаться, приходить в упадок",Дом совсем пришёл в упадок.
hinuntersehen,Er sah aus dem Fenster hinunter.,смотреть вниз,Он смотрел вниз из окна.
halten,Kannst du mal kurz meine Tasche halten?,"держать, останавливать",Можешь подержать мою сумку?
fortfahren,Bitte fahren Sie mit Ihrer Arbeit fort.,продолжать,"Пожалуйста, продолжайте свою работу."
lügen,Er hat mich angelogen.,"лгать, обманывать",Он обманул меня.
herunterladen,Ich muss die Software herunterladen.,"скачивать, загружать",Мне нужно скачать это программное обеспечение.
genießen,Wir sollten das Leben in vollen Zügen genießen.,наслаждаться,Нам следует наслаждаться жизнью в полной мере.
festhalten,"Halt dich gut fest, sonst fällst du!","держаться, удерживать","Держись крепко, иначе упадёшь!"
leihen,Kannst du mir dein Fahrrad leihen?,одалживать (у кого-то),Можешь одолжить мне свой велосипед?
missfallen,Die Idee missfällt mir.,"не нравиться, вызывать неудовольствие",Эта идея мне не нравится.
nachgehen,Ich muss der Sache auf den Grund nachgehen.,"следовать, расследовать",Мне нужно разобраться в этом деле до конца.
hinbekommen,"Ich hoffe, ich kann das noch hinbekommen.","справиться, получить","Надеюсь, я смогу это ещё сделать."
freihalten,Bitte halten Sie den Parkplatz frei.,держать свободным,"Пожалуйста, держите парковку свободной."
fressen,Die Katze frisst ihr Futter.,жрать (о животных),Кошка ест свой корм.
heben,Er konnte den schweren Stein nicht heben.,поднимать,Он не мог поднять тяжёлый камень.
herausfinden,"Ich muss herausfinden, wer das war.","выяснять, узнавать","Мне нужно выяснить, кто это был."
klingen,Das klingt gut!,звучать,Звучит хорошо!
misslingen,Der Versuch ist leider misslungen.,не удаваться,"Попытка, к сожалению, не удалась."
hinfallen,Er ist auf dem Eis hingefallen.,падать,Он упал на льду.
gestehen,Er musste seine Schuld gestehen.,признаваться,Он должен был признать свою вину.
hereinkommen,Bitte kommen Sie herein!,входить,"Пожалуйста, входите!"
hochgehen,Die Preise sind stark hochgegangen.,"подниматься, взрываться",Цены сильно поднялись.
mitgeben,Ich habe ihm etwas Geld für die Reise mitgegeben.,давать с собой,Я дал ему немного денег на дорогу.
fliehen,Der Dieb konnte fliehen.,"убегать, бежать",Вор смог убежать.
hinweisen,Er wies auf einen Fehler in der Rechnung hin.,указывать,Он указал на ошибку в счёте.
hinbekommen,Ich werde es schon hinbekommen.,"справиться, получить",Я с этим справлюсь.
hinfallen,Er ist auf der Straße hingefallen.,падать,Он упал на улице.
hervorheben,Der Architekt wollte die historische Bedeutung des Gebäudes hervorheben.,"выделять, подчеркивать",Архитектор хотел подчеркнуть историческое значение здания.
hineinrufen,Er rief in den Wald hinein.,"кричать внутрь, окликать",Он крикнул в лес.
geschehen,Was ist geschehen?,"происходить, случаться",Что случилось?
gelten,Das Gesetz gilt für alle Bürger.,"действовать, быть действительным",Закон действует для всех граждан.
hereinbitten,Sie bat ihn herein.,просить войти,Она попросила его войти.
hinbekommen,"Ich hoffe, ich kann das noch hinbekommen.","справиться, получить","Надеюсь, я ещё смогу это сделать."
hinkommen,Wie komme ich am besten zum Bahnhof hin?,добираться,Как мне лучше всего добраться до вокзала?
hereinbitten,Sie bat ihn herein.,просить войти,Она попросила его войти.
hineingehen,Er ging ins Haus hinein.,входить внутрь,Он вошёл в дом.
hängen,Das Bild hängt an der Wand.,висеть,Картина висит на стене.
hinausgehen,Gehen Sie hinaus und genießen Sie die Sonne!,выходить наружу,Выходите на улицу и наслаждайтесь солнцем!
klingen,Seine Stimme klang müde.,звучать,Его голос звучал устало.
mitsprechen,Jeder sollte bei der Diskussion mitsprechen dürfen.,участвовать в разговоре,Каждый должен иметь право высказаться в дискуссии.
leien,Er hat mir sein Buch geliehen.,одалживать (кому-то),Он одолжил мне свою книгу.`;

    try {
        // Parse CSV data
        const words = parseCSV(csvData);
        console.log(`📚 Parsed ${words.length} words from CSV`);
        
        // Ensure user manager and database are available
        if (!window.userManager || !window.database) {
            throw new Error('User manager or database not available');
        }
        
        // Set up root user if not already logged in
        setupRootUser();
        
        // Import words to database
        const result = await window.database.addWords(words);
        
        console.log(`✅ Successfully imported ${words.length} German words!`);
        console.log('🎉 Words are now available for studying in all modes');
        
        // Update UI if available
        if (window.router) {
            window.router.navigateTo('/');
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error importing vocabulary:', error);
        alert(`Ошибка импорта: ${error.message}`);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const words = [];
    
    for (const line of lines) {
        try {
            // Split by comma, but handle quoted strings
            const parts = parseCSVLine(line);
            
            if (parts.length >= 4) {
                const word = {
                    word: parts[0].trim(),
                    example: parts[1].trim(), 
                    translation: parts[2].trim(),
                    exampleTranslation: parts[3].trim()
                };
                
                words.push(word);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to parse line: ${line}`, error);
        }
    }
    
    return words;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current); // Add the last field
    
    // Clean up quotes from results
    return result.map(field => field.replace(/^"/, '').replace(/"$/, ''));
}

function setupRootUser() {
    // Ensure root user is set up
    if (!window.userManager.currentUser) {
        window.userManager.currentUser = {
            id: 'root-user',
            name: 'root', 
            email: 'root',
            languagePairs: [{
                id: 'german-russian',
                name: 'German-Russian',
                fromLanguage: 'German',
                toLanguage: 'Russian'
            }]
        };
        
        window.userManager.currentLanguagePair = window.userManager.currentUser.languagePairs[0];
        console.log('✅ Root user configured for import');
    }
}

// Check how many words are in database
async function checkWordCount() {
    if (!window.database) {
        console.log('❌ Database not available');
        return;
    }
    
    try {
        const studyingWords = await window.database.getWordsByStatus('studying');
        const reviewWords = await window.database.getWordsByStatus('review');
        const learnedWords = await window.database.getWordsByStatus('learned');
        
        const total = studyingWords.length + reviewWords.length + learnedWords.length;
        
        console.log(`📊 Words in database:`);
        console.log(`   📚 Studying: ${studyingWords.length}`);
        console.log(`   🔄 Review: ${reviewWords.length}`);
        console.log(`   ✅ Learned: ${learnedWords.length}`);
        console.log(`   📈 Total: ${total}`);
        
        return { studying: studyingWords.length, review: reviewWords.length, learned: learnedWords.length, total };
    } catch (error) {
        console.error('❌ Error checking word count:', error);
    }
}

// Clear all words from database
async function clearAllWords() {
    if (!window.database) {
        console.log('❌ Database not available');
        return;
    }
    
    const confirmed = confirm('⚠️ Удалить ВСЕ слова из базы данных? Это действие нельзя отменить!');
    if (!confirmed) return;
    
    try {
        const transaction = window.database.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');
        
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        console.log('🗑️ All words cleared from database');
        
        // Update UI if router is available
        if (window.router) {
            window.router.navigateTo('/');
        }
        
    } catch (error) {
        console.error('❌ Error clearing words:', error);
    }
}

// Export functions for console use
window.importGermanVocab = importGermanVocabForRoot;
window.checkWordCount = checkWordCount;
window.clearAllWords = clearAllWords;

console.log('📥 German vocabulary importer loaded.');
console.log('💡 Available functions:');
console.log('   importGermanVocab() - Import 118 German words');
console.log('   checkWordCount() - Check current word count');
console.log('   clearAllWords() - Clear all words from database');