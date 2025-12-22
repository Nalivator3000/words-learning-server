const collections = [
  {
    name: "C1: Academic and Intellectual Discourse",
    description: "Advanced vocabulary for scholarly discussion, philosophical concepts, and intellectual debate",
    level: "C1",
    words: [
      {
        word: "die Abstraktion",
        translation: "абстракция",
        example: "Die Abstraktion komplexer Sachverhalte erfordert ein hohes Maß an intellektueller Reife."
      },
      {
        word: "die Ambivalenz",
        translation: "амбивалентность, двойственность",
        example: "Die Ambivalenz seiner Gefühle gegenüber dem Projekt erschwerte die Entscheidungsfindung erheblich."
      },
      {
        word: "die Prämisse",
        translation: "предпосылка, посылка",
        example: "Ausgehend von der Prämisse, dass alle Menschen gleich sind, entwickelte er seine Theorie der Gerechtigkeit."
      },
      {
        word: "das Paradigma",
        translation: "парадигма, образец",
        example: "Der Wechsel des wissenschaftlichen Paradigmas revolutionierte das Verständnis der Quantenphysik."
      },
      {
        word: "die Dichotomie",
        translation: "дихотомия, двойственное деление",
        example: "Die Dichotomie zwischen Theorie und Praxis ist in den Geisteswissenschaften besonders ausgeprägt."
      },
      {
        word: "die Kontroverse",
        translation: "полемика, спор",
        example: "Die Kontroverse um die Gentechnik spaltet die wissenschaftliche Gemeinschaft seit Jahrzehnten."
      },
      {
        word: "die Stringenz",
        translation: "строгость, последовательность",
        example: "Die Stringenz seiner Argumentation überzeugte selbst die härtesten Kritiker."
      },
      {
        word: "die Kohärenz",
        translation: "согласованность, связность",
        example: "Die Kohärenz des theoretischen Rahmens ist entscheidend für die Glaubwürdigkeit der Studie."
      },
      {
        word: "die Implikation",
        translation: "импликация, подразумеваемое значение",
        example: "Die politischen Implikationen dieser Entscheidung werden erst in Jahren vollständig sichtbar sein."
      },
      {
        word: "die Extrapolation",
        translation: "экстраполяция",
        example: "Die Extrapolation der aktuellen Trends lässt beunruhigende Entwicklungen für die Zukunft erwarten."
      },
      {
        word: "postulieren",
        translation: "постулировать, утверждать",
        example: "Der Philosoph postulierte, dass Bewusstsein eine emergente Eigenschaft komplexer Systeme sei."
      },
      {
        word: "deduzieren",
        translation: "выводить, дедуцировать",
        example: "Aus den vorliegenden Daten lässt sich deduzieren, dass die Hypothese nicht haltbar ist."
      },
      {
        word: "konstatieren",
        translation: "констатировать, устанавливать",
        example: "Man muss konstatieren, dass die bisherigen Maßnahmen nicht den gewünschten Erfolg gebracht haben."
      },
      {
        word: "subsumieren",
        translation: "подводить под общее понятие",
        example: "Diese Phänomene lassen sich unter dem Begriff der sozialen Anomie subsumieren."
      },
      {
        word: "perpetuieren",
        translation: "увековечивать, сохранять",
        example: "Solche Stereotypen perpetuieren die Ungleichheit in der Gesellschaft."
      },
      {
        word: "die Kausalität",
        translation: "причинность, каузальность",
        example: "Die Kausalität zwischen Rauchen und Lungenkrebs ist wissenschaftlich zweifelsfrei nachgewiesen."
      },
      {
        word: "die Reziprozität",
        translation: "взаимность, реципрокность",
        example: "Das Prinzip der Reziprozität ist fundamental für das Funktionieren sozialer Beziehungen."
      },
      {
        word: "die Disparität",
        translation: "несоответствие, диспропорция",
        example: "Die Disparität zwischen Arm und Reich wächst in den meisten Industrieländern stetig."
      },
      {
        word: "die Konnotation",
        translation: "коннотация, дополнительное значение",
        example: "Dieses Wort hat eine negative Konnotation, die im politischen Diskurs problematisch sein kann."
      },
      {
        word: "die Epistemologie",
        translation: "эпистемология, теория познания",
        example: "Die Epistemologie befasst sich mit den Grundlagen, Voraussetzungen und Grenzen menschlicher Erkenntnis."
      },
      {
        word: "die Hermeneutik",
        translation: "герменевтика, искусство толкования",
        example: "Die Hermeneutik spielt eine zentrale Rolle beim Verständnis historischer Texte."
      },
      {
        word: "die Dialektik",
        translation: "диалектика",
        example: "Die Dialektik von These, Antithese und Synthese prägt das Hegelsche Denken."
      },
      {
        word: "das Axiom",
        translation: "аксиома, основополагающее утверждение",
        example: "In der Mathematik bilden Axiome die Grundlage, auf der alle weiteren Sätze aufbauen."
      },
      {
        word: "die Analogie",
        translation: "аналогия, подобие",
        example: "Die Analogie zwischen biologischer Evolution und kultureller Entwicklung ist durchaus aufschlussreich."
      },
      {
        word: "die Antithese",
        translation: "антитеза, противопоставление",
        example: "Seine Argumentation bildete die perfekte Antithese zu den herrschenden Lehrmeinungen."
      },
      {
        word: "die Synthese",
        translation: "синтез, соединение",
        example: "Die Synthese unterschiedlicher theoretischer Ansätze führte zu einem neuen Verständnis des Problems."
      },
      {
        word: "die Maxime",
        translation: "максима, основное правило",
        example: "Seine Maxime war es, stets nach objektiver Wahrheit zu streben, unabhängig von persönlichen Interessen."
      },
      {
        word: "exorbitant",
        translation: "чрезмерный, непомерный",
        example: "Die exorbitanten Kosten des Projekts überstiegen alle ursprünglichen Kalkulationen bei Weitem."
      },
      {
        word: "intrinsisch",
        translation: "внутренний, присущий",
        example: "Die intrinsische Motivation ist für den langfristigen Lernerfolg entscheidender als externe Anreize."
      },
      {
        word: "extrinsisch",
        translation: "внешний, привнесенный извне",
        example: "Extrinsische Faktoren wie finanzielle Belohnungen können die Leistung kurzfristig steigern."
      },
      {
        word: "ambigue",
        translation: "двусмысленный, неоднозначный",
        example: "Seine ambigue Formulierung ließ bewusst mehrere Interpretationen zu."
      },
      {
        word: "kongruent",
        translation: "конгруэнтный, соответствующий",
        example: "Die empirischen Befunde sind mit der theoretischen Vorhersage vollkommen kongruent."
      },
      {
        word: "tangential",
        translation: "касательный, второстепенный",
        example: "Diese Bemerkung ist nur tangential mit dem Hauptthema der Diskussion verbunden."
      },
      {
        word: "paradigmatisch",
        translation: "парадигматический, образцовый",
        example: "Dieser Fall ist paradigmatisch für die Probleme des gesamten Systems."
      },
      {
        word: "apodiktisch",
        translation: "аподиктический, безусловно достоверный",
        example: "Seine apodiktische Aussage ließ keinen Raum für Zweifel oder Diskussion."
      },
      {
        word: "ubiquitär",
        translation: "вездесущий, повсеместный",
        example: "Die ubiquitäre Präsenz digitaler Technologien verändert alle Lebensbereiche fundamental."
      },
      {
        word: "das Kompendium",
        translation: "компендиум, сборник",
        example: "Dieses Kompendium vereint alle wesentlichen Erkenntnisse der letzten Jahrzehnte."
      },
      {
        word: "die Quintessenz",
        translation: "квинтэссенция, суть",
        example: "Die Quintessenz seiner jahrelangen Forschung lässt sich in einem einzigen Satz zusammenfassen."
      },
      {
        word: "die Allegorie",
        translation: "аллегория, иносказание",
        example: "Die Allegorie der Höhle ist eine der bekanntesten philosophischen Metaphern Platons."
      },
      {
        word: "die Metaphysik",
        translation: "метафизика",
        example: "Die Metaphysik beschäftigt sich mit Fragen, die über die physische Realität hinausgehen."
      },
      {
        word: "die Ontologie",
        translation: "онтология, учение о бытии",
        example: "Die Ontologie untersucht die grundlegenden Kategorien und Strukturen der Wirklichkeit."
      },
      {
        word: "die Teleologie",
        translation: "телеология, учение о целесообразности",
        example: "Die Teleologie fragt nach dem Zweck und Ziel natürlicher Prozesse und menschlichen Handelns."
      },
      {
        word: "der Relativismus",
        translation: "релятивизм",
        example: "Der moralische Relativismus behauptet, dass es keine absoluten ethischen Wahrheiten gibt."
      },
      {
        word: "der Empirismus",
        translation: "эмпиризм",
        example: "Der Empirismus betont die Rolle der Sinneserfahrung als Quelle der Erkenntnis."
      },
      {
        word: "der Rationalismus",
        translation: "рационализм",
        example: "Der Rationalismus sieht in der Vernunft die primäre Quelle menschlicher Erkenntnis."
      },
      {
        word: "die Phänomenologie",
        translation: "феноменология",
        example: "Die Phänomenologie beschreibt die Strukturen des bewussten Erlebens aus der Erste-Person-Perspektive."
      },
      {
        word: "die Genealogie",
        translation: "генеалогия, происхождение",
        example: "Foucault entwickelte eine Genealogie der modernen Machtstrukturen."
      },
      {
        word: "die Chronologie",
        translation: "хронология",
        example: "Die Chronologie der Ereignisse lässt sich anhand der Quellen genau rekonstruieren."
      },
      {
        word: "die Taxonomie",
        translation: "таксономия, классификация",
        example: "Die Taxonomie der Lebewesen wird ständig aufgrund neuer genetischer Erkenntnisse überarbeitet."
      },
      {
        word: "die Morphologie",
        translation: "морфология",
        example: "Die Morphologie untersucht die Struktur und Form von Organismen oder sprachlichen Einheiten."
      },
      {
        word: "prononciert",
        translation: "подчеркнутый, резко выраженный",
        example: "Er vertrat eine prononciert kritische Position gegenüber den gängigen Theorien."
      },
      {
        word: "dezidiert",
        translation: "решительный, определенный",
        example: "Sie äußerte sich dezidiert gegen die vorgeschlagenen Änderungen."
      },
      {
        word: "inhärent",
        translation: "присущий, неотъемлемый",
        example: "Die Ungewissheit ist dem wissenschaftlichen Prozess inhärent."
      },
      {
        word: "manifest",
        translation: "явный, очевидный",
        example: "Die Auswirkungen der Klimakrise werden manifest in den zunehmenden Extremwetterereignissen."
      },
      {
        word: "latent",
        translation: "скрытый, латентный",
        example: "Latente Konflikte in der Organisation können plötzlich offen ausbrechen."
      },
      {
        word: "prekär",
        translation: "ненадежный, шаткий",
        example: "Die prekäre Lage der Beschäftigten in der Gig-Economy erfordert politische Maßnahmen."
      },
      {
        word: "rudimentär",
        translation: "рудиментарный, зачаточный",
        example: "Seine Kenntnisse der Materie waren nur rudimentär vorhanden."
      },
      {
        word: "obsolet",
        translation: "устаревший, отживший",
        example: "Diese Technologie ist mittlerweile völlig obsolet geworden."
      },
      {
        word: "plausibel",
        translation: "правдоподобный, убедительный",
        example: "Die Erklärung erscheint auf den ersten Blick durchaus plausibel."
      },
      {
        word: "stringent",
        translation: "строгий, последовательный",
        example: "Die stringente Logik seiner Beweisführung ließ keine Lücken."
      },
      {
        word: "kontingent",
        translation: "случайный, условный",
        example: "Historische Ereignisse sind oft kontingent und hätten auch anders verlaufen können."
      },
      {
        word: "arbiträr",
        translation: "произвольный, случайный",
        example: "Die Entscheidung erschien arbiträr und nicht nachvollziehbar begründet."
      },
      {
        word: "heterogen",
        translation: "гетерогенный, разнородный",
        example: "Die Gruppe war äußerst heterogen zusammengesetzt, was die Zusammenarbeit erschwerte."
      },
      {
        word: "homogen",
        translation: "гомогенный, однородный",
        example: "Eine zu homogene Teamzusammensetzung kann Innovationen behindern."
      },
      {
        word: "diffus",
        translation: "расплывчатый, диффузный",
        example: "Seine Ausführungen blieben diffus und ließen eine klare Aussage vermissen."
      },
      {
        word: "elaboriert",
        translation: "детально разработанный, изощренный",
        example: "Sie präsentierte eine elaborierte Theorie, die alle bekannten Phänomene erklären konnte."
      },
      {
        word: "profund",
        translation: "глубокий, основательный",
        example: "Seine profunden Kenntnisse der Materie beeindruckten alle Anwesenden."
      },
      {
        word: "die Rezeption",
        translation: "рецепция, восприятие",
        example: "Die Rezeption des Werks in verschiedenen Kulturen fiel sehr unterschiedlich aus."
      },
      {
        word: "die Exegese",
        translation: "экзегеза, толкование",
        example: "Die Exegese religiöser Texte erfordert umfassende philologische und historische Kenntnisse."
      },
      {
        word: "die Interpolation",
        translation: "интерполяция, вставка",
        example: "Wissenschaftler vermuten, dass dieser Abschnitt eine spätere Interpolation darstellt."
      },
      {
        word: "die Approximation",
        translation: "приближение, аппроксимация",
        example: "Diese Formel liefert eine gute Approximation der komplexen Realität."
      },
      {
        word: "die Kompilation",
        translation: "компиляция, составление",
        example: "Das Werk ist im Wesentlichen eine Kompilation bereits bekannter Theorien."
      },
      {
        word: "die Rekonstruktion",
        translation: "реконструкция, восстановление",
        example: "Die Rekonstruktion der historischen Ereignisse stützt sich auf fragmentarische Quellen."
      },
      {
        word: "die Exemplifikation",
        translation: "иллюстрация примерами",
        example: "Die Exemplifikation abstrakter Konzepte erleichtert das Verständnis erheblich."
      },
      {
        word: "die Spezifikation",
        translation: "спецификация, детализация",
        example: "Die Spezifikation der Anforderungen erfolgte in enger Abstimmung mit allen Beteiligten."
      },
      {
        word: "die Modifikation",
        translation: "модификация, изменение",
        example: "Die Modifikation des ursprünglichen Plans erwies sich als notwendig."
      },
      {
        word: "die Konsolidierung",
        translation: "консолидация, укрепление",
        example: "Die Konsolidierung der Forschungsergebnisse führte zu einem kohärenten Gesamtbild."
      },
      {
        word: "die Akkumulation",
        translation: "накопление, аккумуляция",
        example: "Die Akkumulation empirischer Daten ermöglichte schließlich belastbare Schlussfolgerungen."
      },
      {
        word: "die Delegation",
        translation: "делегирование, делегация",
        example: "Die Delegation von Verantwortung ist ein wesentlicher Bestandteil effektiver Führung."
      },
      {
        word: "die Konzeption",
        translation: "концепция, замысел",
        example: "Die Konzeption des Projekts war innovativ, scheiterte aber an der Umsetzung."
      },
      {
        word: "die Explikation",
        translation: "экспликация, разъяснение",
        example: "Die Explikation komplexer Zusammenhänge erfordert didaktisches Geschick."
      },
      {
        word: "die Akzentuierung",
        translation: "акцентирование, подчеркивание",
        example: "Die Akzentuierung bestimmter Aspekte kann die Wahrnehmung erheblich beeinflussen."
      },
      {
        word: "die Polarisierung",
        translation: "поляризация",
        example: "Die zunehmende Polarisierung der Gesellschaft bereitet vielen Soziologen Sorge."
      },
      {
        word: "die Fragmentierung",
        translation: "фрагментация, раздробление",
        example: "Die Fragmentierung des Diskurses erschwert die Konsensfindung."
      },
      {
        word: "die Komplexität",
        translation: "сложность",
        example: "Die Komplexität moderner Gesellschaften übersteigt die Fassungskraft einzelner Individuen."
      },
      {
        word: "die Interdependenz",
        translation: "взаимозависимость",
        example: "Die Interdependenz globaler Wirtschaftssysteme wurde in der Finanzkrise offenbar."
      },
      {
        word: "die Konfiguration",
        translation: "конфигурация, устройство",
        example: "Die Konfiguration der Faktoren bestimmt das Ergebnis entscheidend."
      },
      {
        word: "diskrepant",
        translation: "расходящийся, несоответствующий",
        example: "Die diskrepanten Aussagen der Zeugen erschwerten die Wahrheitsfindung."
      },
      {
        word: "korrelieren",
        translation: "коррелировать, соотноситься",
        example: "Die Variablen korrelieren stark miteinander, was auf einen kausalen Zusammenhang hindeutet."
      },
      {
        word: "divergieren",
        translation: "расходиться, дивергировать",
        example: "Die Meinungen der Experten divergieren in diesem Punkt erheblich."
      },
      {
        word: "konvergieren",
        translation: "сходиться, конвергировать",
        example: "Die verschiedenen Ansätze konvergieren allmählich zu einer gemeinsamen Theorie."
      },
      {
        word: "akkumulieren",
        translation: "накапливать, аккумулировать",
        example: "Im Laufe der Jahre akkumulierte er ein beeindruckendes Wissen auf diesem Gebiet."
      }
    ]
  },
  {
    name: "C1: Professional and Technical Terminology",
    description: "Specialized vocabulary for professional contexts, business, law, medicine, and technology",
    level: "C1",
    words: [
      {
        word: "die Volatilität",
        translation: "волатильность, изменчивость",
        example: "Die Volatilität der Finanzmärkte hat in den letzten Jahren deutlich zugenommen."
      },
      {
        word: "die Liquidität",
        translation: "ликвидность, платежеспособность",
        example: "Die Liquidität des Unternehmens ist trotz der Krise gesichert."
      },
      {
        word: "die Diversifikation",
        translation: "диверсификация",
        example: "Die Diversifikation des Portfolios minimiert das Investitionsrisiko erheblich."
      },
      {
        word: "die Konsolidierung",
        translation: "консолидация, укрепление",
        example: "Die Konsolidierung des Marktes führte zu einer Verringerung der Wettbewerber."
      },
      {
        word: "die Synergie",
        translation: "синергия",
        example: "Die Fusion der beiden Unternehmen soll Synergien in Höhe von 50 Millionen Euro freisetzen."
      },
      {
        word: "die Compliance",
        translation: "соответствие нормам, комплаенс",
        example: "Die Compliance-Abteilung überwacht die Einhaltung aller gesetzlichen Vorschriften."
      },
      {
        word: "die Due Diligence",
        translation: "должная осмотрительность, проверка",
        example: "Die Due Diligence vor der Übernahme deckte erhebliche Risiken auf."
      },
      {
        word: "die Amortisation",
        translation: "амортизация, окупаемость",
        example: "Die Amortisation der Investition wird voraussichtlich fünf Jahre dauern."
      },
      {
        word: "die Prognose",
        translation: "прогноз",
        example: "Die Prognose für das Wirtschaftswachstum wurde aufgrund aktueller Daten nach unten korrigiert."
      },
      {
        word: "die Rezession",
        translation: "рецессия, спад",
        example: "Die Rezession traf vor allem die exportorientierten Branchen hart."
      },
      {
        word: "die Inflation",
        translation: "инфляция",
        example: "Die Inflation erreichte einen Höchststand, den man seit Jahrzehnten nicht mehr gesehen hatte."
      },
      {
        word: "die Deflation",
        translation: "дефляция",
        example: "Eine anhaltende Deflation kann die Wirtschaft in eine gefährliche Abwärtsspirale führen."
      },
      {
        word: "das Moratorium",
        translation: "мораторий",
        example: "Die Regierung verhängte ein Moratorium für neue Bauvorhaben in dem Gebiet."
      },
      {
        word: "die Subvention",
        translation: "субсидия, дотация",
        example: "Die Subventionen für erneuerbare Energien werden schrittweise abgebaut."
      },
      {
        word: "die Restriktion",
        translation: "ограничение, рестрикция",
        example: "Die Restriktionen im internationalen Handel belasten die Wirtschaft erheblich."
      },
      {
        word: "die Liberalisierung",
        translation: "либерализация",
        example: "Die Liberalisierung des Telekommunikationsmarktes führte zu einem intensiven Wettbewerb."
      },
      {
        word: "die Deregulierung",
        translation: "дерегулирование",
        example: "Die Deregulierung des Finanzsektors wird von Kritikern als Ursache der Krise gesehen."
      },
      {
        word: "die Prokura",
        translation: "прокура, торговая доверенность",
        example: "Er erhielt Prokura und konnte fortan im Namen des Unternehmens rechtsverbindlich handeln."
      },
      {
        word: "das Insolvenzverfahren",
        translation: "процедура банкротства",
        example: "Das Insolvenzverfahren wurde eröffnet, nachdem alle Sanierungsversuche gescheitert waren."
      },
      {
        word: "die Haftung",
        translation: "ответственность, обязательство",
        example: "Die persönliche Haftung der Gesellschafter ist bei dieser Rechtsform unbeschränkt."
      },
      {
        word: "die Kaution",
        translation: "залог, поручительство",
        example: "Die Kaution in Höhe von drei Monatsmieten wurde auf einem Sperrkonto hinterlegt."
      },
      {
        word: "die Veräußerung",
        translation: "отчуждение, продажа",
        example: "Die Veräußerung von Vermögenswerten diente der Schuldentilgung."
      },
      {
        word: "die Anfechtung",
        translation: "оспаривание, обжалование",
        example: "Die Anfechtung des Testaments wurde vom Gericht abgewiesen."
      },
      {
        word: "die Verjährung",
        translation: "давность, истечение срока давности",
        example: "Die Verjährung der Ansprüche tritt nach drei Jahren ein."
      },
      {
        word: "die Bürgschaft",
        translation: "поручительство",
        example: "Die Bank verlangte eine Bürgschaft für die Gewährung des Kredits."
      },
      {
        word: "die Hypothek",
        translation: "ипотека",
        example: "Die Hypothek auf das Grundstück sichert den Baukredit ab."
      },
      {
        word: "die Treuhand",
        translation: "доверительное управление",
        example: "Die Treuhand verwaltete das Vermögen im Interesse der Begünstigten."
      },
      {
        word: "das Mandat",
        translation: "мандат, поручение",
        example: "Der Anwalt übernahm das Mandat zur rechtlichen Vertretung des Unternehmens."
      },
      {
        word: "die Vollmacht",
        translation: "доверенность, полномочие",
        example: "Die Vollmacht ermächtigt ihn, in allen finanziellen Angelegenheiten zu entscheiden."
      },
      {
        word: "die Anweisung",
        translation: "инструкция, распоряжение",
        example: "Die Anweisung des Gerichts war eindeutig und musste umgehend befolgt werden."
      },
      {
        word: "das Patent",
        translation: "патент",
        example: "Das Patent schützt die Innovation für die nächsten zwanzig Jahre."
      },
      {
        word: "die Lizenz",
        translation: "лицензия",
        example: "Die Lizenz berechtigt zur gewerblichen Nutzung der Software."
      },
      {
        word: "das Urheberrecht",
        translation: "авторское право",
        example: "Das Urheberrecht schützt die kreative Leistung des Autors."
      },
      {
        word: "die Jurisdiktion",
        translation: "юрисдикция",
        example: "Der Fall fällt unter die Jurisdiktion des Bundesgerichtshofs."
      },
      {
        word: "die Indikation",
        translation: "показание (медицинское)",
        example: "Die Indikation für einen chirurgischen Eingriff ist in diesem Fall eindeutig."
      },
      {
        word: "die Kontraindikation",
        translation: "противопоказание",
        example: "Eine Schwangerschaft stellt eine absolute Kontraindikation für dieses Medikament dar."
      },
      {
        word: "die Diagnose",
        translation: "диагноз",
        example: "Die Diagnose wurde durch bildgebende Verfahren bestätigt."
      },
      {
        word: "die Prognose",
        translation: "прогноз (медицинский)",
        example: "Die Prognose für den Patienten ist bei frühzeitiger Behandlung günstig."
      },
      {
        word: "die Symptomatik",
        translation: "симптоматика",
        example: "Die Symptomatik deutet auf eine chronische Erkrankung hin."
      },
      {
        word: "die Ätiologie",
        translation: "этиология, причина болезни",
        example: "Die Ätiologie der Erkrankung ist noch nicht vollständig geklärt."
      },
      {
        word: "die Pathogenese",
        translation: "патогенез, механизм развития болезни",
        example: "Die Pathogenese der Alzheimer-Krankheit ist Gegenstand intensiver Forschung."
      },
      {
        word: "die Prophylaxe",
        translation: "профилактика",
        example: "Die Prophylaxe kardiovaskulärer Erkrankungen sollte früh beginnen."
      },
      {
        word: "die Therapie",
        translation: "терапия, лечение",
        example: "Die Therapie muss individuell auf den Patienten abgestimmt werden."
      },
      {
        word: "die Rehabilitation",
        translation: "реабилитация",
        example: "Die Rehabilitation nach dem Schlaganfall dauerte mehrere Monate."
      },
      {
        word: "die Anamnese",
        translation: "анамнез",
        example: "Eine gründliche Anamnese ist die Grundlage jeder sorgfältigen Diagnose."
      },
      {
        word: "die Palpation",
        translation: "пальпация, ощупывание",
        example: "Die Palpation des Abdomens ergab keinen pathologischen Befund."
      },
      {
        word: "die Auskultation",
        translation: "аускультация, выслушивание",
        example: "Bei der Auskultation der Lunge waren keine Rasselgeräusche zu hören."
      },
      {
        word: "die Injektion",
        translation: "инъекция, укол",
        example: "Die Injektion des Medikaments erfolgt intramuskulär."
      },
      {
        word: "die Infusion",
        translation: "инфузия, капельница",
        example: "Die Infusion versorgt den Patienten mit Flüssigkeit und Nährstoffen."
      },
      {
        word: "das Antibiotikum",
        translation: "антибиотик",
        example: "Das Antibiotikum zeigte eine gute Wirksamkeit gegen den Erreger."
      },
      {
        word: "die Resistenz",
        translation: "резистентность, устойчивость",
        example: "Die zunehmende Resistenz gegen Antibiotika ist ein globales Problem."
      },
      {
        word: "die Immunsuppression",
        translation: "иммуносупрессия",
        example: "Die Immunsuppression ist notwendig, um die Abstoßung des Transplantats zu verhindern."
      },
      {
        word: "die Transplantation",
        translation: "трансплантация, пересадка",
        example: "Die Transplantation der Niere verlief komplikationslos."
      },
      {
        word: "die Kompatibilität",
        translation: "совместимость",
        example: "Die Kompatibilität der Blutgruppen muss vor der Transfusion überprüft werden."
      },
      {
        word: "die Koagulation",
        translation: "коагуляция, свертывание",
        example: "Die Koagulation des Blutes ist ein komplexer physiologischer Prozess."
      },
      {
        word: "die Hämorrhagie",
        translation: "геморрагия, кровоизлияние",
        example: "Die Hämorrhagie konnte durch operative Maßnahmen gestoppt werden."
      },
      {
        word: "die Sepsis",
        translation: "сепсис, заражение крови",
        example: "Eine Sepsis ist ein lebensbedrohlicher Zustand, der sofortiger Behandlung bedarf."
      },
      {
        word: "die Nekrose",
        translation: "некроз, омертвение тканей",
        example: "Die Nekrose des Gewebes machte eine Amputation unvermeidlich."
      },
      {
        word: "die Fibrose",
        translation: "фиброз, разрастание соединительной ткани",
        example: "Die Leberfibrose ist eine Folge chronischer Entzündungen."
      },
      {
        word: "die Atrophie",
        translation: "атрофия, истощение",
        example: "Die Muskelatrophie tritt bei längerer Immobilität auf."
      },
      {
        word: "die Hypertrophie",
        translation: "гипертрофия, увеличение",
        example: "Die Hypertrophie des Herzmuskels kann verschiedene Ursachen haben."
      },
      {
        word: "die Metastase",
        translation: "метастаз",
        example: "Die Metastasen hatten sich bereits in mehreren Organen gebildet."
      },
      {
        word: "das Karzinom",
        translation: "карцинома, рак",
        example: "Das Karzinom wurde in einem frühen Stadium entdeckt."
      },
      {
        word: "das Melanom",
        translation: "меланома",
        example: "Das Melanom ist die gefährlichste Form von Hautkrebs."
      },
      {
        word: "die Chemotherapie",
        translation: "химиотерапия",
        example: "Die Chemotherapie führte zu einer deutlichen Verkleinerung des Tumors."
      },
      {
        word: "die Radiotherapie",
        translation: "лучевая терапия",
        example: "Die Radiotherapie ergänzte die operative Behandlung."
      },
      {
        word: "die Biopsie",
        translation: "биопсия",
        example: "Die Biopsie ergab einen gutartigen Befund."
      },
      {
        word: "die Sonographie",
        translation: "сонография, УЗИ",
        example: "Die Sonographie zeigte keine Auffälligkeiten im Bauchraum."
      },
      {
        word: "die Tomographie",
        translation: "томография",
        example: "Die Computertomographie lieferte detaillierte Schnittbilder des betroffenen Bereichs."
      },
      {
        word: "die Endoskopie",
        translation: "эндоскопия",
        example: "Die Endoskopie ermöglichte eine direkte Betrachtung der Magenschleimhaut."
      },
      {
        word: "die Laparoskopie",
        translation: "лапароскопия",
        example: "Die Laparoskopie ist ein minimal-invasives Verfahren."
      },
      {
        word: "das Analgetikum",
        translation: "анальгетик, обезболивающее",
        example: "Das Analgetikum linderte die postoperativen Schmerzen effektiv."
      },
      {
        word: "das Sedativum",
        translation: "седативное средство, успокоительное",
        example: "Das Sedativum half dem Patienten, sich vor dem Eingriff zu entspannen."
      },
      {
        word: "die Anästhesie",
        translation: "анестезия, обезболивание",
        example: "Die Anästhesie wurde als Vollnarkose durchgeführt."
      },
      {
        word: "die Intubation",
        translation: "интубация",
        example: "Die Intubation sicherte die Atemwege während der Operation."
      },
      {
        word: "die Reanimation",
        translation: "реанимация",
        example: "Die Reanimation erfolgte nach den aktuellen Leitlinien."
      },
      {
        word: "die Defibrillation",
        translation: "дефибрилляция",
        example: "Die Defibrillation stellte den normalen Herzrhythmus wieder her."
      },
      {
        word: "die Perfusion",
        translation: "перфузия, кровоснабжение",
        example: "Die Perfusion des Gewebes war durch die Durchblutungsstörung beeinträchtigt."
      },
      {
        word: "die Ischämie",
        translation: "ишемия, недостаточное кровоснабжение",
        example: "Die Ischämie führte zu schweren Gewebeschäden."
      },
      {
        word: "der Infarkt",
        translation: "инфаркт",
        example: "Der Herzinfarkt wurde dank schneller Behandlung überlebt."
      },
      {
        word: "die Embolie",
        translation: "эмболия, закупорка сосуда",
        example: "Die Lungenembolie ist ein lebensbedrohlicher Zustand."
      },
      {
        word: "die Thrombose",
        translation: "тромбоз",
        example: "Die Thrombose entstand durch längere Immobilität."
      },
      {
        word: "die Stenose",
        translation: "стеноз, сужение",
        example: "Die Stenose der Aortenklappe erforderte einen chirurgischen Eingriff."
      },
      {
        word: "die Insuffizienz",
        translation: "недостаточность",
        example: "Die Herzinsuffizienz verschlechterte sich trotz Therapie."
      },
      {
        word: "das Ödem",
        translation: "отек",
        example: "Das Ödem der unteren Extremitäten deutete auf eine Herzschwäche hin."
      },
      {
        word: "die Hyperglykämie",
        translation: "гипергликемия, повышенный сахар в крови",
        example: "Die Hyperglykämie musste durch Insulin reguliert werden."
      },
      {
        word: "die Hypoglykämie",
        translation: "гипогликемия, пониженный сахар в крови",
        example: "Die Hypoglykämie führte zu Bewusstseinsstörungen."
      },
      {
        word: "die Hypertonie",
        translation: "гипертония, повышенное давление",
        example: "Die arterielle Hypertonie ist ein Risikofaktor für Herzinfarkt und Schlaganfall."
      },
      {
        word: "die Hypotonie",
        translation: "гипотония, пониженное давление",
        example: "Die Hypotonie verursachte Schwindel und Schwäche."
      },
      {
        word: "die Arrhythmie",
        translation: "аритмия, нарушение ритма",
        example: "Die Herzarrhythmie wurde mit Medikamenten kontrolliert."
      },
      {
        word: "die Tachykardie",
        translation: "тахикардия, учащенное сердцебиение",
        example: "Die Tachykardie trat bei körperlicher Belastung auf."
      },
      {
        word: "die Bradykardie",
        translation: "брадикардия, замедленное сердцебиение",
        example: "Die Bradykardie erforderte die Implantation eines Herzschrittmachers."
      }
    ]
  },
  {
    name: "C1: Cultural, Social and Political Discourse",
    description: "Advanced vocabulary for discussing culture, society, politics, and contemporary issues",
    level: "C1",
    words: [
      {
        word: "die Hegemonie",
        translation: "гегемония, господство",
        example: "Die kulturelle Hegemonie des Westens wird zunehmend in Frage gestellt."
      },
      {
        word: "die Emanzipation",
        translation: "эмансипация, освобождение",
        example: "Die Emanzipation der Frau ist ein fortlaufender gesellschaftlicher Prozess."
      },
      {
        word: "die Marginalisierung",
        translation: "маргинализация, вытеснение на обочину",
        example: "Die Marginalisierung bestimmter Bevölkerungsgruppen ist ein ernstes soziales Problem."
      },
      {
        word: "die Integration",
        translation: "интеграция",
        example: "Die Integration von Migranten erfordert Anstrengungen von beiden Seiten."
      },
      {
        word: "die Segregation",
        translation: "сегрегация, разделение",
        example: "Die räumliche Segregation nach Einkommen nimmt in vielen Städten zu."
      },
      {
        word: "die Diskriminierung",
        translation: "дискриминация",
        example: "Die Diskriminierung aufgrund der Herkunft ist gesetzlich verboten."
      },
      {
        word: "die Inklusion",
        translation: "инклюзия, включение",
        example: "Die Inklusion von Menschen mit Behinderungen in das Bildungssystem ist ein wichtiges Ziel."
      },
      {
        word: "die Exklusion",
        translation: "эксклюзия, исключение",
        example: "Die soziale Exklusion führt oft zu weiterer Benachteiligung."
      },
      {
        word: "die Assimilation",
        translation: "ассимиляция",
        example: "Die erzwungene Assimilation indigener Völker ist ein dunkles Kapitel der Geschichte."
      },
      {
        word: "die Pluralisierung",
        translation: "плюрализация, увеличение многообразия",
        example: "Die Pluralisierung der Lebensformen ist charakteristisch für moderne Gesellschaften."
      },
      {
        word: "die Säkularisierung",
        translation: "секуляризация",
        example: "Die Säkularisierung der westlichen Gesellschaften schreitet kontinuierlich voran."
      },
      {
        word: "die Globalisierung",
        translation: "глобализация",
        example: "Die Globalisierung hat sowohl Gewinner als auch Verlierer hervorgebracht."
      },
      {
        word: "die Urbanisierung",
        translation: "урбанизация",
        example: "Die rapide Urbanisierung stellt die Infrastruktur vor große Herausforderungen."
      },
      {
        word: "die Gentrifizierung",
        translation: "джентрификация",
        example: "Die Gentrifizierung verdrängt einkommensschwache Bewohner aus innerstädtischen Vierteln."
      },
      {
        word: "die Migration",
        translation: "миграция",
        example: "Die Migration ist ein globales Phänomen mit vielfältigen Ursachen."
      },
      {
        word: "die Radikalisierung",
        translation: "радикализация",
        example: "Die Radikalisierung junger Menschen ist eine Herausforderung für die Sicherheitsbehörden."
      },
      {
        word: "die Polarisierung",
        translation: "поляризация",
        example: "Die politische Polarisierung erschwert konstruktive Debatten."
      },
      {
        word: "die Politisierung",
        translation: "политизация",
        example: "Die Politisierung privater Lebensbereiche nimmt zu."
      },
      {
        word: "die Indoktrination",
        translation: "индоктринация, внушение",
        example: "Die Indoktrination der Bevölkerung ist ein Merkmal totalitärer Systeme."
      },
      {
        word: "die Propaganda",
        translation: "пропаганда",
        example: "Die Propaganda des Regimes durchdrang alle Bereiche des öffentlichen Lebens."
      },
      {
        word: "die Zensur",
        translation: "цензура",
        example: "Die Zensur der Presse ist ein Angriff auf die Meinungsfreiheit."
      },
      {
        word: "die Dissidenz",
        translation: "диссидентство",
        example: "Die Dissidenz wurde in der Sowjetunion mit harten Strafen verfolgt."
      },
      {
        word: "die Repression",
        translation: "репрессия, подавление",
        example: "Die Repression gegen Andersdenkende verschärfte sich zunehmend."
      },
      {
        word: "die Autonomie",
        translation: "автономия, самостоятельность",
        example: "Die Autonomie der Universitäten ist durch Sparmaßnahmen bedroht."
      },
      {
        word: "die Souveränität",
        translation: "суверенитет",
        example: "Die Souveränität der Nationalstaaten wird durch supranationale Organisationen eingeschränkt."
      },
      {
        word: "die Legitimität",
        translation: "легитимность",
        example: "Die Legitimität der Regierung wird von der Opposition in Frage gestellt."
      },
      {
        word: "die Autorität",
        translation: "авторитет, власть",
        example: "Die Autorität traditioneller Institutionen erodiert zusehends."
      },
      {
        word: "die Hierarchie",
        translation: "иерархия",
        example: "Die Hierarchie in modernen Organisationen wird zunehmend flacher."
      },
      {
        word: "die Bürokratie",
        translation: "бюрократия",
        example: "Die Bürokratie behindert oft innovative Lösungsansätze."
      },
      {
        word: "die Meritokratie",
        translation: "меритократия, власть достойных",
        example: "Eine echte Meritokratie würde Chancengleichheit unabhängig von der Herkunft garantieren."
      },
      {
        word: "die Plutokratie",
        translation: "плутократия, власть богатых",
        example: "Kritiker warnen vor einer Entwicklung zur Plutokratie in westlichen Demokratien."
      },
      {
        word: "die Oligarchie",
        translation: "олигархия, власть немногих",
        example: "Die Oligarchie kontrolliert große Teile der Wirtschaft des Landes."
      },
      {
        word: "die Aristokratie",
        translation: "аристократия",
        example: "Die Aristokratie verlor nach der Revolution ihre politische Macht."
      },
      {
        word: "die Demokratisierung",
        translation: "демократизация",
        example: "Die Demokratisierung der arabischen Länder verlief unterschiedlich."
      },
      {
        word: "die Partizipation",
        translation: "участие, партиципация",
        example: "Die politische Partizipation der Bürger nimmt verschiedene Formen an."
      },
      {
        word: "das Referendum",
        translation: "референдум",
        example: "Das Referendum über den EU-Austritt spaltete das Land."
      },
      {
        word: "das Plebiszit",
        translation: "плебисцит, народное голосование",
        example: "Das Plebiszit sollte die Legitimität der Entscheidung stärken."
      },
      {
        word: "die Koalition",
        translation: "коалиция",
        example: "Die Koalition zerbrach an unüberbrückbaren Differenzen."
      },
      {
        word: "die Opposition",
        translation: "оппозиция",
        example: "Die Opposition kritisierte den Gesetzentwurf scharf."
      },
      {
        word: "die Fraktion",
        translation: "фракция",
        example: "Die Fraktion stimmte geschlossen gegen den Antrag."
      },
      {
        word: "die Legislatur",
        translation: "законодательный орган, легислатура",
        example: "Die Legislaturperiode dauert in Deutschland vier Jahre."
      },
      {
        word: "die Exekutive",
        translation: "исполнительная власть",
        example: "Die Exekutive ist für die Umsetzung der Gesetze verantwortlich."
      },
      {
        word: "die Judikative",
        translation: "судебная власть",
        example: "Die Unabhängigkeit der Judikative ist ein Grundpfeiler des Rechtsstaats."
      },
      {
        word: "die Gewaltenteilung",
        translation: "разделение властей",
        example: "Die Gewaltenteilung verhindert die Konzentration von Macht."
      },
      {
        word: "das Veto",
        translation: "вето",
        example: "Der Präsident legte sein Veto gegen das Gesetz ein."
      },
      {
        word: "das Moratorium",
        translation: "мораторий, отсрочка",
        example: "Ein Moratorium für die Todesstrafe wurde ausgerufen."
      },
      {
        word: "die Sanktion",
        translation: "санкция",
        example: "Die internationalen Sanktionen trafen vor allem die Zivilbevölkerung."
      },
      {
        word: "das Embargo",
        translation: "эмбарго, запрет",
        example: "Das Waffenembargo wurde vom UN-Sicherheitsrat verhängt."
      },
      {
        word: "die Intervention",
        translation: "интервенция, вмешательство",
        example: "Die militärische Intervention wurde kontrovers diskutiert."
      },
      {
        word: "die Eskalation",
        translation: "эскалация, обострение",
        example: "Die Eskalation des Konflikts konnte in letzter Minute verhindert werden."
      },
      {
        word: "die Deeskalation",
        translation: "деэскалация, снижение напряженности",
        example: "Diplomatische Bemühungen zur Deeskalation zeigten erste Erfolge."
      },
      {
        word: "die Diplomatie",
        translation: "дипломатия",
        example: "Die Diplomatie bevorzugt Verhandlungen gegenüber militärischen Optionen."
      },
      {
        word: "die Allianz",
        translation: "альянс, союз",
        example: "Die Allianz der NATO-Staaten basiert auf gegenseitiger Verteidigung."
      },
      {
        word: "der Pakt",
        translation: "пакт, договор",
        example: "Der Warschauer Pakt löste sich 1991 auf."
      },
      {
        word: "das Abkommen",
        translation: "соглашение",
        example: "Das Klimaabkommen von Paris setzt ambitionierte Ziele."
      },
      {
        word: "der Vertrag",
        translation: "договор, контракт",
        example: "Der Vertrag von Maastricht begründete die Europäische Union."
      },
      {
        word: "die Ratifizierung",
        translation: "ратификация",
        example: "Die Ratifizierung des Vertrags steht noch aus."
      },
      {
        word: "die Konvention",
        translation: "конвенция, соглашение",
        example: "Die Genfer Konventionen regeln humanitäres Völkerrecht."
      },
      {
        word: "das Protokoll",
        translation: "протокол",
        example: "Das Kyoto-Protokoll war ein Meilenstein im Klimaschutz."
      },
      {
        word: "die Resolution",
        translation: "резолюция",
        example: "Die UN-Resolution verurteilte die Aggression scharf."
      },
      {
        word: "die Deklaration",
        translation: "декларация",
        example: "Die Allgemeine Erklärung der Menschenrechte wurde 1948 verabschiedet."
      },
      {
        word: "die Amnestie",
        translation: "амнистия",
        example: "Die Amnestie für politische Gefangene war Teil des Friedensabkommens."
      },
      {
        word: "die Immunität",
        translation: "иммунитет, неприкосновенность",
        example: "Die diplomatische Immunität schützt vor Strafverfolgung."
      },
      {
        word: "die Extradition",
        translation: "экстрадиция, выдача",
        example: "Die Extradition des Verdächtigen wurde von dem Land abgelehnt."
      },
      {
        word: "das Asyl",
        translation: "убежище, асиль",
        example: "Er beantragte politisches Asyl in Deutschland."
      },
      {
        word: "die Abschiebung",
        translation: "депортация, высылка",
        example: "Die Abschiebung wurde aufgrund humanitärer Gründe ausgesetzt."
      },
      {
        word: "die Ausweisung",
        translation: "высылка, экспульсия",
        example: "Die Ausweisung der Diplomaten verschärfte die Krise."
      },
      {
        word: "die Staatsbürgerschaft",
        translation: "гражданство",
        example: "Die doppelte Staatsbürgerschaft ist in einigen Ländern nicht erlaubt."
      },
      {
        word: "die Einbürgerung",
        translation: "натурализация, получение гражданства",
        example: "Die Einbürgerung setzt ausreichende Deutschkenntnisse voraus."
      },
      {
        word: "die Aberkennung",
        translation: "лишение, отмена",
        example: "Die Aberkennung der Staatsbürgerschaft ist nur in Ausnahmefällen möglich."
      },
      {
        word: "die Rente",
        translation: "пенсия",
        example: "Das Renteneintrittsalter wurde schrittweise erhöht."
      },
      {
        word: "die Altersarmut",
        translation: "бедность в старости",
        example: "Die Altersarmut ist ein wachsendes Problem in Deutschland."
      },
      {
        word: "die Infrastruktur",
        translation: "инфраструктура",
        example: "Die marode Infrastruktur bedarf dringend umfassender Investitionen."
      },
      {
        word: "die Nachhaltigkeit",
        translation: "устойчивость, экологичность",
        example: "Die Nachhaltigkeit steht im Zentrum der neuen Wirtschaftsstrategie."
      },
      {
        word: "die Ressource",
        translation: "ресурс",
        example: "Die natürlichen Ressourcen des Planeten sind begrenzt."
      },
      {
        word: "die Knappheit",
        translation: "нехватка, дефицит",
        example: "Die Knappheit an Trinkwasser wird zu einem globalen Problem."
      },
      {
        word: "die Biodiversität",
        translation: "биоразнообразие",
        example: "Die Biodiversität nimmt weltweit dramatisch ab."
      },
      {
        word: "das Ökosystem",
        translation: "экосистема",
        example: "Das Ökosystem des Regenwaldes ist hochkomplex und fragil."
      },
      {
        word: "die Emission",
        translation: "выброс, эмиссия",
        example: "Die CO2-Emissionen müssen drastisch reduziert werden."
      },
      {
        word: "die Dekarbonisierung",
        translation: "декарбонизация",
        example: "Die Dekarbonisierung der Wirtschaft ist eine Herkulesaufgabe."
      },
      {
        word: "die Energiewende",
        translation: "энергетический переход",
        example: "Die Energiewende erfordert massive Investitionen in erneuerbare Energien."
      }
    ]
  },
  {
    name: "C1: Advanced Expressions and Nuanced Language",
    description: "Sophisticated expressions, idioms, and nuanced vocabulary for complex communication",
    level: "C1",
    words: [
      {
        word: "unabdingbar",
        translation: "обязательный, непременный",
        example: "Eine gründliche Vorbereitung ist für den Erfolg des Projekts unabdingbar."
      },
      {
        word: "unumgänglich",
        translation: "неизбежный, необходимый",
        example: "Eine Diskussion über diese kontroverse Frage ist unumgänglich geworden."
      },
      {
        word: "unverzichtbar",
        translation: "незаменимый, необходимый",
        example: "Seine Expertise ist für das Team unverzichtbar."
      },
      {
        word: "unabkömmlich",
        translation: "незаменимый, необходимый (о человеке)",
        example: "Er war in dieser kritischen Phase unabkömmlich und konnte nicht freigestellt werden."
      },
      {
        word: "unerlässlich",
        translation: "необходимый, обязательный",
        example: "Regelmäßige Fortbildungen sind in diesem Bereich unerlässlich."
      },
      {
        word: "zwingend",
        translation: "обязательный, принудительный",
        example: "Die Schlussfolgerung ergibt sich zwingend aus den Prämissen."
      },
      {
        word: "gebieterisch",
        translation: "повелительный, властный",
        example: "Die Notwendigkeit zum Handeln war gebieterisch."
      },
      {
        word: "imperativ",
        translation: "императивный, обязательный",
        example: "Der Schutz der Menschenrechte ist ein imperativer Grundsatz."
      },
      {
        word: "fakultativ",
        translation: "факультативный, необязательный",
        example: "Die Teilnahme an diesem Kurs ist fakultativ."
      },
      {
        word: "obligatorisch",
        translation: "обязательный",
        example: "Die Teilnahme an der Schulung ist obligatorisch für alle Mitarbeiter."
      },
      {
        word: "konstitutiv",
        translation: "конститутивный, основополагающий",
        example: "Die Meinungsfreiheit ist konstitutiv für eine demokratische Gesellschaft."
      },
      {
        word: "quintessentiell",
        translation: "квинтэссенциальный, сущностный",
        example: "Diese Eigenschaft ist quintessentiell für den Erfolg in diesem Beruf."
      },
      {
        word: "substantiell",
        translation: "существенный, значительный",
        example: "Die Änderungen waren substantiell und nicht nur kosmetischer Natur."
      },
      {
        word: "marginal",
        translation: "маргинальный, незначительный",
        example: "Der Effekt dieser Maßnahme war nur marginal."
      },
      {
        word: "signifikant",
        translation: "значительный, существенный",
        example: "Die Studie zeigte einen signifikanten Unterschied zwischen den Gruppen."
      },
      {
        word: "evident",
        translation: "очевидный, явный",
        example: "Es ist evident, dass diese Strategie nicht funktioniert."
      },
      {
        word: "offenkundig",
        translation: "явный, очевидный",
        example: "Seine Absichten waren offenkundig unehrlich."
      },
      {
        word: "eklatant",
        translation: "вопиющий, явный",
        example: "Das war ein eklatanter Verstoß gegen die Regeln."
      },
      {
        word: "flagrant",
        translation: "вопиющий, возмутительный",
        example: "Diese flagrante Ungerechtigkeit kann nicht hingenommen werden."
      },
      {
        word: "subtil",
        translation: "тонкий, неуловимый",
        example: "Die Kritik war subtil, aber dennoch deutlich spürbar."
      },
      {
        word: "dezent",
        translation: "сдержанный, деликатный",
        example: "Er äußerte seine Bedenken in dezenter Form."
      },
      {
        word: "explizit",
        translation: "явный, эксплицитный",
        example: "Sie machte ihre Ablehnung explizit deutlich."
      },
      {
        word: "implizit",
        translation: "неявный, имплицитный",
        example: "Seine Zustimmung war implizit in seiner Reaktion enthalten."
      },
      {
        word: "inhärent",
        translation: "присущий, свойственный",
        example: "Diese Risiken sind dem System inhärent."
      },
      {
        word: "immanent",
        translation: "имманентный, присущий",
        example: "Diese Widersprüche sind der Theorie immanent."
      },
      {
        word: "transzendent",
        translation: "трансцендентный, запредельный",
        example: "Die Frage nach dem Sinn des Lebens berührt transzendente Bereiche."
      },
      {
        word: "ephemer",
        translation: "эфемерный, мимолетный",
        example: "Der Ruhm erwies sich als ephemer und verging schnell."
      },
      {
        word: "flüchtig",
        translation: "мимолетный, летучий",
        example: "Die Erinnerung daran war nur noch flüchtig vorhanden."
      },
      {
        word: "perpetuell",
        translation: "вечный, непрерывный",
        example: "Der perpetuelle Wandel ist charakteristisch für moderne Gesellschaften."
      },
      {
        word: "immerwährend",
        translation: "вечный, постоянный",
        example: "Der immerwährende Kreislauf von Werden und Vergehen prägt die Natur."
      },
      {
        word: "unaufhörlich",
        translation: "непрерывный, неустанный",
        example: "Der unaufhörliche Lärm machte konzentriertes Arbeiten unmöglich."
      },
      {
        word: "inzessant",
        translation: "непрерывный, беспрестанный",
        example: "Das inzessante Gerede ging allen auf die Nerven."
      },
      {
        word: "intermittierend",
        translation: "прерывистый, периодический",
        example: "Die intermittierenden Schmerzen traten in unregelmäßigen Abständen auf."
      },
      {
        word: "sporadisch",
        translation: "спорадический, нерегулярный",
        example: "Die Kontakte waren nur noch sporadisch vorhanden."
      },
      {
        word: "punktuell",
        translation: "точечный, выборочный",
        example: "Die Maßnahmen waren nur punktuell wirksam."
      },
      {
        word: "flächendeckend",
        translation: "повсеместный, всеохватывающий",
        example: "Eine flächendeckende Versorgung mit schnellem Internet ist noch nicht erreicht."
      },
      {
        word: "umfassend",
        translation: "всесторонний, всеобъемлющий",
        example: "Eine umfassende Reform des Systems ist notwendig."
      },
      {
        word: "exhaustiv",
        translation: "исчерпывающий, полный",
        example: "Die Liste ist exhaustiv und lässt keine Fragen offen."
      },
      {
        word: "erschöpfend",
        translation: "исчерпывающий",
        example: "Das Thema wurde erschöpfend behandelt."
      },
      {
        word: "fragmentarisch",
        translation: "фрагментарный, отрывочный",
        example: "Die Informationen waren nur fragmentarisch vorhanden."
      },
      {
        word: "lückenhaft",
        translation: "неполный, с пробелами",
        example: "Seine Kenntnisse waren lückenhaft und unzureichend."
      },
      {
        word: "ansatzweise",
        translation: "в зачаточном виде, отчасти",
        example: "Das Problem wurde nur ansatzweise erkannt."
      },
      {
        word: "tendenziell",
        translation: "в тенденции, склонный",
        example: "Die Entwicklung ist tendenziell positiv zu bewerten."
      },
      {
        word: "grundsätzlich",
        translation: "принципиально, в принципе",
        example: "Grundsätzlich bin ich mit dem Vorschlag einverstanden."
      },
      {
        word: "kategorisch",
        translation: "категорический, решительный",
        example: "Sie lehnte das Angebot kategorisch ab."
      },
      {
        word: "vehement",
        translation: "горячий, страстный",
        example: "Er widersprach vehement dieser Darstellung."
      },
      {
        word: "nachdrücklich",
        translation: "настойчивый, решительный",
        example: "Sie forderte nachdrücklich eine Klärung der Situation."
      },
      {
        word: "unzweideutig",
        translation: "недвусмысленный, однозначный",
        example: "Die Antwort war unzweideutig ablehnend."
      },
      {
        word: "eindeutig",
        translation: "однозначный, ясный",
        example: "Die Beweise waren eindeutig und ließen keinen Zweifel."
      },
      {
        word: "mehrdeutig",
        translation: "многозначный, неоднозначный",
        example: "Die Aussage war bewusst mehrdeutig formuliert."
      },
      {
        word: "vage",
        translation: "смутный, неопределенный",
        example: "Seine Angaben blieben vage und wenig konkret."
      },
      {
        word: "präzise",
        translation: "точный, четкий",
        example: "Die Anweisungen müssen präzise formuliert werden."
      },
      {
        word: "akkurat",
        translation: "точный, аккуратный",
        example: "Die Messungen waren akkurat durchgeführt worden."
      },
      {
        word: "penibel",
        translation: "педантичный, скрупулезный",
        example: "Er arbeitete penibel und ließ keine Details außer Acht."
      },
      {
        word: "akribisch",
        translation: "тщательный, дотошный",
        example: "Die akribische Recherche brachte neue Erkenntnisse."
      },
      {
        word: "minutiös",
        translation: "детальный, скрупулезный",
        example: "Die minutiöse Planung zahlte sich aus."
      },
      {
        word: "oberflächlich",
        translation: "поверхностный",
        example: "Eine oberflächliche Betrachtung reicht nicht aus."
      },
      {
        word: "seicht",
        translation: "мелкий, поверхностный",
        example: "Die Diskussion blieb seicht und belanglos."
      },
      {
        word: "fundiert",
        translation: "обоснованный, солидный",
        example: "Die Kritik war fundiert und nachvollziehbar."
      },
      {
        word: "substantiiert",
        translation: "обоснованный, аргументированный",
        example: "Die Anschuldigungen müssen substantiiert werden."
      },
      {
        word: "haltlos",
        translation: "необоснованный, беспочвенный",
        example: "Die Vorwürfe erwiesen sich als haltlos."
      },
      {
        word: "unbegründet",
        translation: "необоснованный",
        example: "Die Ängste waren völlig unbegründet."
      },
      {
        word: "fadenscheinig",
        translation: "неубедительный, притянутый за уши",
        example: "Die Ausreden klangen fadenscheinig."
      },
      {
        word: "vorgeschoben",
        translation: "надуманный, мнимый",
        example: "Der vorgeschobene Grund täuschte niemanden."
      },
      {
        word: "vorgetäuscht",
        translation: "притворный, поддельный",
        example: "Das Interesse war nur vorgetäuscht."
      },
      {
        word: "authentisch",
        translation: "подлинный, аутентичный",
        example: "Sein Verhalten wirkte authentisch und ehrlich."
      },
      {
        word: "genuin",
        translation: "настоящий, истинный",
        example: "Es handelte sich um ein genuines Interesse an der Sache."
      }
    ]
  }
];

console.log('C1 Expansion Collections:');
collections.forEach((col, i) => {
  console.log(`${i + 1}. ${col.name}: ${col.words.length} words`);
});
const totalWords = collections.reduce((sum, col) => sum + col.words.length, 0);
console.log(`\nTotal C1 expansion words: ${totalWords}`);

module.exports = { collections };
