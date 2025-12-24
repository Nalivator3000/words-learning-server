// German C2 Level - Final Batch
// Highly specialized, sophisticated vocabulary across disciplines
// Total: 112 words

const collections = [
  {
    name: "C2: Advanced Legal & Jurisprudence",
    description: "Complex legal concepts, constitutional law, legal theory, comparative jurisprudence",
    level: "C2",
    words: [
      { word: "die Jurisprudenz", translation: "юриспруденция", example: "Die Jurisprudenz befasst sich mit der Theorie und Praxis des Rechts." },
      { word: "die Rechtsdogmatik", translation: "правовая догматика", example: "Die Rechtsdogmatik entwickelt systematische Kategorien zur Rechtsauslegung." },
      { word: "die Auslegungsmethode", translation: "метод толкования", example: "Die teleologische Auslegungsmethode berücksichtigt die Zwecksetzung des Gesetzes." },
      { word: "die Normativität", translation: "нормативность", example: "Die Normativität rechtlicher Normen verpflichtet zum Handeln." },
      { word: "die Normenkollision", translation: "коллизия норм", example: "Die Normenkollision entsteht durch konfligierende rechtliche Gebote." },
      { word: "die Präzedenz", translation: "прецедент", example: "Die Präzedenz bindet Gerichte an frühere Entscheidungen." },
      { word: "die Legalität", translation: "законность", example: "Die Legalität staatlichen Handelns ist verfassungsrechtlich verbürgt." },
      { word: "die Legitimität", translation: "легитимность", example: "Die Legitimität rechtlicher Ordnung beruht auf Anerkennung." },
      { word: "die Rechtsicherheit", translation: "правовая определенность", example: "Die Rechtsicherheit erfordert präzise und vorhersehbare Normen." },
      { word: "die Rechtsneutralität", translation: "правовая нейтральность", example: "Die Rechtsneutralität gegenüber weltanschaulichen Fragen ist geboten." },
      { word: "die Gerechtigkeit", translation: "справедливость", example: "Die Gerechtigkeit als regulatives Ideal prägt Rechtsdiskurse." },
      { word: "das Äquivalenzprinzip", translation: "принцип эквивалентности", example: "Das Äquivalenzprinzip verlangt Verhältnismäßigkeit von Leistung und Gegenleistung." },
      { word: "die Kompensation", translation: "компенсация", example: "Die Kompensation schadensersatz erfolgt durch Geldleistung." },
      { word: "die Restitution", translation: "возмещение", example: "Die Restitution stellt den Zustand vor Rechtsverletzung wieder her." },
      { word: "die Präventivfunktion", translation: "превентивная функция", example: "Die Präventivfunktion des Strafrechts soll zukünftige Verbrechen verhindern." },
      { word: "die Spezialprävention", translation: "специальная превенция", example: "Die Spezialprävention zielt auf Abschreckung des Täters selbst." },
      { word: "die Generalprävention", translation: "общая превенция", example: "Die Generalprävention soll die Allgemeinheit von Straftaten abhalten." },
      { word: "die Resozialisierung", translation: "ресоциализация", example: "Die Resozialisierung ist ein wesentliches Ziel des Strafvollzugs." },
      { word: "die Handlungsfähigkeit", translation: "дееспособность", example: "Die Handlungsfähigkeit ist Voraussetzung für Rechtssubjektivität." },
      { word: "die Deliktsfähigkeit", translation: "деликтоспособность", example: "Die Deliktsfähigkeit bestimmt die Haftung für Schadensersatz." },
      { word: "die Zurechnungsfähigkeit", translation: "вменяемость", example: "Die Zurechnungsfähigkeit ist Voraussetzung strafrechtlicher Verantwortung." },
      { word: "die Schuldfähigkeit", translation: "вменяемость", example: "Die Schuldfähigkeit bezeichnet die Fähigkeit, das Unrecht zu erkennen." },
      { word: "die Verschuldung", translation: "виновность", example: "Die Verschuldung im strikten Sinne erfordert Vorsatz oder Fahrlässigkeit." },
      { word: "die Kausalität", translation: "причинность", example: "Die Kausalität verbindet Handlung und Erfolg." },
      { word: "die Adäquanztheorie", translation: "теория адекватности", example: "Die Adäquanztheorie erfordert typsiche Verursachung des Erfolgs." },
      { word: "die Rechtfertigung", translation: "правомерность", example: "Die Rechtfertigung hebt das Unrecht einer prima facie rechtswidrigen Handlung auf." },
      { word: "die Entschuldigung", translation: "извинение", example: "Die Entschuldigung bewahrt Rechtswidrigkeit, eliminiert aber Schuld." },
      { word: "die Notwehr", translation: "необходимая оборона", example: "Die Notwehr ist gerechtfertigt zur Abwehr gegenwärtiger Angriffe." },
      { word: "der Notstand", translation: "крайняя необходимость", example: "Der Notstand entschuldigt ein geringeres Übel zur Vermeidung größeren Unrechts." },
      { word: "die Ultima-Ratio-Prinzip", translation: "принцип крайнего средства", example: "Das Ultima-Ratio-Prinzip beschränkt Sanktionen auf letzte Mittel." },
      { word: "die Proportionalität", translation: "пропорциональность", example: "Die Proportionalität begrenzt Strafe auf angemessenes Maß." },
      { word: "die Überzeugungstat", translation: "убежденность судьи", example: "Die Überzeugungstat gründet sich auf innere Überzeugung des Richters." },
      { word: "das Untersuchungsprinzip", translation: "принцип следствия", example: "Das Untersuchungsprinzip verpflichtet den Richter zur amtlichen Sachaufklärung." },
      { word: "das Anklageprinzip", translation: "принцип обвинения", example: "Das Anklageprinzip beschränkt richterliche Entscheidung auf vorgebrachte Anträge." },
      { word: "das Dispositionsprinzip", translation: "принцип диспозиции", example: "Das Dispositionsprinzip lässt Parteien über ihr Recht verfügen." },
      { word: "die Beweislast", translation: "бремя доказывания", example: "Die Beweislast liegt regelmäßig beim Anspruchsteller." },
      { word: "der Beweiswert", translation: "доказательственная сила", example: "Der Beweiswert eines Indizes hängt von seiner Schlüssigkeit ab." },
      { word: "die Indizien", translation: "улики", example: "Die Indizien gestatten Schlüsse auf nachzuweisende Tatsachen." },
      { word: "die Direktbeweise", translation: "прямые доказательства", example: "Die Direktbeweise betreffen unmittelbar behauptete Tatsachen." },
      { word: "die Beweismittel", translation: "средства доказывания", example: "Die Beweismittel sind Zeugen, Urkunden und Sachverständigengutachten." },
    ]
  },
  {
    name: "C2: Advanced Environmental & Sustainability Terminology",
    description: "Complex environmental law, sustainability science, ecological concepts, climate policy",
    level: "C2",
    words: [
      { word: "die Ökosystemdienstleistungen", translation: "экосистемные услуги", example: "Die Ökosystemdienstleistungen umfassen Bestäubung, Wasserfiltration und Klimaregulation." },
      { word: "die Biodiversität", translation: "биоразнообразие", example: "Die Biodiversität ist fundamental für Ökosystemstabilität." },
      { word: "die Artenvielfalt", translation: "видовое разнообразие", example: "Die Artenvielfalt in Regenwäldern ist unersetzt." },
      { word: "die Genetische Vielfalt", translation: "генетическое разнообразие", example: "Die genetische Vielfalt ermöglicht Anpassungsfähigkeit." },
      { word: "die Habitatzerstörung", translation: "разрушение местообитания", example: "Die Habitatzerstörung ist die Hauptursache von Biodiversitätsverlust." },
      { word: "die Entwaldung", translation: "обезлесение", example: "Die Entwaldung vermindert Kohlenstoffsenken erheblich." },
      { word: "die Degradation", translation: "деградация", example: "Die Degradation von Böden reduziert landwirtschaftliche Produktivität." },
      { word: "die Eutrophierung", translation: "эвтрофикация", example: "Die Eutrophierung von Gewässern führt zu Algenwuchs und Sauerstoffmangel." },
      { word: "die Versauerung", translation: "подкисление", example: "Die Versauerung der Meere gefährdet Muschelschalen und Kalkskelette." },
      { word: "die Kohlenstoffsenke", translation: "углеродный сток", example: "Die Wälder fungieren als bedeutende Kohlenstoffsenken." },
      { word: "die Treibhausgase", translation: "парниковые газы", example: "Die Treibhausgase verursachen Strahlungsantrieb in der Atmosphäre." },
      { word: "die Rückkopplungseffekte", translation: "эффекты обратной связи", example: "Die Rückkopplungseffekte amplifizieren oder dämpfen Klimaänderungen." },
      { word: "die Kipppunkte", translation: "переломные моменты", example: "Die Kipppunkte im Klimasystem könnten irreversible Veränderungen auslösen." },
      { word: "die Vulnerabilität", translation: "уязвимость", example: "Die Vulnerabilität gegenüber Klimafolgen variiert regional stark." },
      { word: "die Resilienz", translation: "устойчивость", example: "Die ökologische Resilienz ermöglicht Erholung nach Störungen." },
      { word: "die Nachhaltigkeit", translation: "устойчивость", example: "Die Nachhaltigkeit verlangt Erfüllung gegenwärtiger Bedürfnisse ohne künftige zu gefährden." },
      { word: "die Zirkularwirtschaft", translation: "круговая экономика", example: "Die Zirkularwirtschaft minimiert Abfall durch Wiederverwendung und Recycling." },
      { word: "die Bioakkumulation", translation: "биоаккумуляция", example: "Die Bioakkumulation reichert Giftstoffe in Organismen an." },
      { word: "die Biomagnifikation", translation: "биомагнификация", example: "Die Biomagnifikation konzentriert Schadstoffe entlang der Nahrungskette." },
      { word: "die Persistenz", translation: "персистентность", example: "Die Persistenz organischer Schadstoffe erschwert ihre Beseitigung." },
      { word: "die Bioavailabilität", translation: "биодоступность", example: "Die Bioavailabilität bestimmt die Aufnahme von Stoffen durch Organismen." },
    ]
  },
  {
    name: "C2: Advanced Neuroscience & Cognitive Science",
    description: "Complex neurobiological concepts, cognitive mechanisms, consciousness studies, neurotransmission",
    level: "C2",
    words: [
      { word: "die Neuroplastizität", translation: "нейропластичность", example: "Die Neuroplastizität ermöglicht Reorganisation neuronaler Strukturen." },
      { word: "die Synaptische Plastizität", translation: "синаптическая пластичность", example: "Die synaptische Plastizität bildet die Grundlage des Lernens." },
      { word: "die Langzeitpotenzierung", translation: "долгосрочная потенциация", example: "Die Langzeitpotenzierung verstärkt synaptische Transmitter dauerhaft." },
      { word: "die Langzeitdepression", translation: "долгосрочная депрессия", example: "Die Langzeitdepression schwächt synaptische Transmitter." },
      { word: "die Dendriten", translation: "дендриты", example: "Die Dendriten empfangen Signale von anderen Neuronen." },
      { word: "die Axone", translation: "аксоны", example: "Die Axone transmittieren Signale zu anderen Neuronen." },
      { word: "der Myelin", translation: "миелин", example: "Der Myelin isoliert Axone und beschleunigt Signalübertragung." },
      { word: "die Neurotransmitter", translation: "нейротрансмиттеры", example: "Die Neurotransmitter sind Botenstoffe für interneuronale Kommunikation." },
      { word: "die Rezeptoren", translation: "рецепторы", example: "Die Rezeptoren binden Neurotransmitter und generieren Signale." },
      { word: "die Ionenkanäle", translation: "ионные каналы", example: "Die Ionenkanäle regulieren Ionenfluss und Membranpotenzial." },
      { word: "die Erregungsleitung", translation: "проведение возбуждения", example: "Die Erregungsleitung erfolgt nach dem Alles-oder-Nichts-Prinzip." },
      { word: "das Aktionspotenzial", translation: "действительный потенциал", example: "Das Aktionspotenzial ist die Grundlage neuronaler Signalisierung." },
      { word: "die Repolarisierung", translation: "переполяризация", example: "Die Repolarisierung stellt das Ruhepotenzial wieder her." },
      { word: "die Wahrnehmung", translation: "восприятие", example: "Die Wahrnehmung konstruiert Realität aus Sinnesreizen." },
      { word: "die Aufmerksamkeit", translation: "внимание", example: "Die Aufmerksamkeit filtert relevante Informationen aus Sinnesfülle." },
      { word: "das Arbeitsgedächtnis", translation: "рабочая память", example: "Das Arbeitsgedächtnis hält Information für kognitive Verarbeitung bereit." },
      { word: "die Konsolidierung", translation: "консолидация", example: "Die Konsolidierung speichert kurzfristige in langfristige Erinnerungen." },
      { word: "die Abrufbarkeit", translation: "извлекаемость", example: "Die Abrufbarkeit hängt von Kontextähnlichkeit und Reizstärke ab." },
      { word: "die Interferenz", translation: "помехи", example: "Die Interferenz führt zu Erinnerungsverlust durch Konkurrenz." },
      { word: "die Emotions-Kognition-Interaktion", translation: "взаимодействие эмоций и познания", example: "Die Emotions-Kognition-Interaktion moduliert Gedächtnis und Aufmerksamkeit." },
      { word: "die Amygdala", translation: "миндалина", example: "Die Amygdala verarbeitet emotionale Bedeutung von Reizen." },
      { word: "der Hippocampus", translation: "гиппокамп", example: "Der Hippocampus ist kritisch für episodisches Gedächtnis." },
      { word: "die Exekutiven Funktionen", translation: "исполнительные функции", example: "Die exekutiven Funktionen umfassen Planung, Kontrolle und Flexibilität." },
      { word: "die Inhibitionskontrolle", translation: "контроль торможения", example: "Die Inhibitionskontrolle unterdrückt automatische Reaktionen." },
      { word: "die Kognitive Flexibilität", translation: "когнитивная гибкость", example: "Die kognitive Flexibilität ermöglicht Perspektivwechsel." },
      { word: "die Metakognition", translation: "метапознание", example: "Die Metakognition ermöglicht Überwachung eigener kognitiver Prozesse." },
      { word: "die Bewusstseinszustände", translation: "состояния сознания", example: "Die Bewusstseinszustände variieren zwischen wach und schlafend." }
    ]
  },
  {
    name: "C2: Advanced Cultural & Sociological Analysis",
    description: "Complex cultural phenomena, sociological theory, institutional analysis, cultural dynamics",
    level: "C2",
    words: [
      { word: "die Kulturelle Hegemonie", translation: "культурная гегемония", example: "Die kulturelle Hegemonie manifestiert sich in dominanten Diskursen und Praktiken." },
      { word: "die Habitus", translation: "габитус", example: "Der Habitus internalisiert strukturelle Positionen als Disposition." },
      { word: "das Kulturelle Kapital", translation: "культурный капитал", example: "Das kulturelle Kapital umfasst Bildung, Geschmack und soziale Netzwerke." },
      { word: "die Soziale Mobilität", translation: "социальная мобильность", example: "Die soziale Mobilität beschreibt Positionswechsel zwischen Schichten." },
      { word: "die Intergenerationale Transmission", translation: "межпоколенческая передача", example: "Die intergenerationale Transmission reproduziert soziale Ungleichheit." },
      { word: "die Rollenkonflikt", translation: "ролевой конфликт", example: "Der Rollenkonflikt entsteht durch konkurrierende Rollenerwartungen." },
      { word: "die Institutionalisierung", translation: "институционализация", example: "Die Institutionalisierung verstetigt Praktiken zu formalen Strukturen." },
      { word: "die Ritualisierung", translation: "ритуализация", example: "Die Ritualisierung verfestigt symbolische Bedeutungen." },
      { word: "die Sakralisierung", translation: "сакрализация", example: "Die Sakralisierung verleiht weltlichen Objekten Heiligkeitsstatus." },
      { word: "die Säkularisierung", translation: "секуляризация", example: "Die Säkularisierung trennt religiöse von politischen Institutionen." },
      { word: "die Pluralisierung", translation: "плюрализация", example: "Die Pluralisierung multipliziert Weltanschauungen und Lebensentwürfe." },
      { word: "die Individualisierung", translation: "индивидуализация", example: "Die Individualisierung betont persönliche Authentizität." },
      { word: "die Narrative Identität", translation: "нарративная идентичность", example: "Die narrative Identität konstituiert sich durch Lebensgeschichte." },
      { word: "die Authentizität", translation: "аутентичность", example: "Die Authentizität wird als Gegenpol zur Inauthentizität gesucht." },
      { word: "die Entfremdung", translation: "отчуждение", example: "Die Entfremdung markiert Entzweiung von sich und anderen." },
      { word: "die Anomie", translation: "аномия", example: "Die Anomie ist Zustand von Normlosigkeit und Orientierungsverlust." },
      { word: "die Labeling-Theorie", translation: "теория навешивания ярлыков", example: "Die Labeling-Theorie analysiert Zuschreibung von Devianzstatus." },
      { word: "die Deviance", translation: "отклонение", example: "Die Deviance ist Abweichung von normativen Standards." },
      { word: "die Stigmatisierung", translation: "стигматизация", example: "Die Stigmatisierung markiert Gruppen als unwürdig." },
      { word: "die Inklusion", translation: "инклюзия", example: "Die Inklusion integriert Marginalisierte in Gesellschaftsmitte." },
      { word: "die Exklusion", translation: "эксклюзия", example: "Die Exklusion grenzt Gruppen aus Partizipationschancen aus." },
      { word: "die Segregation", translation: "сегрегация", example: "Die Segregation trennt soziale Gruppen räumlich oder institutionell." },
      { word: "die Multikulturalismus", translation: "мультикультурализм", example: "Der Multikulturalismus würdigt verschiedene Kulturen als gleichwertig." },
      { word: "die Hybridisierung", translation: "гибридизация", example: "Die Hybridisierung verbindet kulturelle Elemente verschiedener Ursprünge." }
    ]
  }
];

console.log('C2 Final Batch Collections:');
console.log(`Total collections: ${collections.length}`);
collections.forEach((col, i) => {
  console.log(`${i + 1}. ${col.name}: ${col.words.length} words`);
});
const totalWords = collections.reduce((sum, col) => sum + col.words.length, 0);
console.log(`\nTotal new C2 words (final batch): ${totalWords}`);

module.exports = { collections };
