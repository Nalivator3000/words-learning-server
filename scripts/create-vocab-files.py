#!/usr/bin/env python3
"""Create German vocabulary files for B2, C1, and C2 levels."""

import os

# B2 vocabulary content (1000 words)
B2_CONTENT = """# German B2 Level Vocabulary (~1000 words)

## 1. Advanced Relationships & Social Dynamics (70 words)

### Interpersonal Relationships
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Beziehung | relationship | Beziehung pflegen | f |
| die Freundschaft | friendship | Freundschaft schätzen | f |
| die Partnerschaft | partnership | Partnerschaft eingehen | f |
| die Ehe | marriage | Ehe führen | f |
| der Ehebruch | adultery | Ehebruch begehen | m |
| die Untreue | infidelity | Untreue verzeihen | f |
| die Treue | loyalty/fidelity | Treue schwören | f |
| treu | faithful/loyal | Treu bleiben | adj |
| untreu | unfaithful | Untreu werden | adj |
| vertrauen | to trust | Jemandem vertrauen | verb |
| das Vertrauen | trust | Vertrauen aufbauen | n |
| misstrauen | to distrust | Jemandem misstrauen | verb |
| das Misstrauen | distrust | Misstrauen hegen | n |
| sich verstehen | to get along | Gut verstehen | reflexive |
| das Verständnis | understanding | Verständnis zeigen | n |
| verständnisvoll | understanding | Verständnisvolle Person | adj |
| der Streit | argument/dispute | Streit haben | m |
| streiten | to argue | Sich streiten | verb |
| der Konflikt | conflict | Konflikt lösen | m |
| die Auseinandersetzung | confrontation | Auseinandersetzung haben | f |
| sich versöhnen | to reconcile | Sich wieder versöhnen | reflexive |
| die Versöhnung | reconciliation | Versöhnung anstreben | f |
| verzeihen | to forgive | Fehler verzeihen | verb |
| die Verzeihung | forgiveness | Um Verzeihung bitten | f |
| sich entschuldigen | to apologize | Sich entschuldigen für | reflexive |
| die Entschuldigung | apology | Entschuldigung annehmen | f |
| die Rücksicht | consideration | Rücksicht nehmen auf | f |
| rücksichtsvoll | considerate | Rücksichtsvolle Haltung | adj |
| rücksichtslos | inconsiderate | Rücksichtsloses Verhalten | adj |
| respektieren | to respect | Meinung respektieren | verb |
| der Respekt | respect | Respekt zollen | m |
| respektvoll | respectful | Respektvoller Umgang | adj |
| respektlos | disrespectful | Respektloses Benehmen | adj |
| die Achtung | respect/esteem | Achtung verdienen | f |
| achten | to respect | Jemanden achten | verb |
| schätzen | to appreciate/value | Freundschaft schätzen | verb |
| die Wertschätzung | appreciation | Wertschätzung zeigen | f |
| anerkennen | to recognize/acknowledge | Leistung anerkennen | separable |
| die Anerkennung | recognition | Anerkennung erhalten | f |
| unterstützen | to support | Freund unterstützen | verb |
| die Unterstützung | support | Unterstützung brauchen | f |
| helfen | to help | Jemandem helfen | verb |
| die Hilfe | help | Hilfe anbieten | f |
| hilfreich | helpful | Hilfreicher Rat | adj |
| hilflos | helpless | Hilflos sein | adj |
| die Solidarität | solidarity | Solidarität zeigen | f |
| solidarisch | solidary | Solidarisch sein | adj |
| die Zuneigung | affection | Zuneigung empfinden | f |
| zugeneigt | affectionate | Zugeneigt sein | adj |
| die Zuwendung | affection/attention | Zuwendung geben | f |
| die Distanz | distance | Distanz wahren | f |
| distanziert | distant | Distanziert bleiben | adj |
| sich distanzieren | to distance oneself | Sich distanzieren von | reflexive |
| die Nähe | closeness | Nähe suchen | f |
| nah | close | Nah sein | adj |
| eng | close/tight | Enge Freundschaft | adj |
| intim | intimate | Intime Beziehung | adj |
| die Intimität | intimacy | Intimität zulassen | f |
| oberflächlich | superficial | Oberflächliche Beziehung | adj |
| die Oberflächlichkeit | superficiality | Oberflächlichkeit ablehnen | f |
| tiefgründig | profound | Tiefgründiges Gespräch | adj |
| die Tiefe | depth | Tiefe der Beziehung | f |
| ehrlich | honest | Ehrlich sein | adj |
| die Ehrlichkeit | honesty | Ehrlichkeit schätzen | f |
| aufrichtig | sincere | Aufrichtige Entschuldigung | adj |
| die Aufrichtigkeit | sincerity | Aufrichtigkeit zeigen | f |
| verlässlich | reliable | Verlässlicher Freund | adj |
| die Verlässlichkeit | reliability | Verlässlichkeit beweisen | f |
| beständig | constant/steady | Beständige Freundschaft | adj |
| die Beständigkeit | constancy | Beständigkeit wahren | f |
| flüchtig | fleeting/superficial | Flüchtige Bekanntschaft | adj |

---

## 2. Professional Development & Career (75 words)

### Career Planning
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Laufbahn | career | Berufliche Laufbahn | f |
| die Karriere | career | Karriere machen | f |
| der Werdegang | career path | Beruflicher Werdegang | m |
| der Aufstieg | advancement/rise | Beruflicher Aufstieg | m |
| aufsteigen | to advance | Karriereleiter aufsteigen | separable |
| der Abstieg | decline/descent | Sozialer Abstieg | m |
| absteigen | to descend | Abstieg verhindern | separable |
| die Beförderung | promotion | Beförderung erhalten | f |
| befördert werden | to be promoted | Befördert werden wollen | passive |
| befördern | to promote | Mitarbeiter befördern | verb |
| degradieren | to demote | Jemanden degradieren | verb |
| die Degradierung | demotion | Degradierung befürchten | f |
| die Versetzung | transfer | Versetzung beantragen | f |
| versetzen | to transfer | Jemanden versetzen | verb |
| der Stellenwechsel | job change | Stellenwechsel erwägen | m |
| wechseln | to change | Job wechseln | verb |
| sich verändern | to change (oneself) | Beruflich verändern | reflexive |
| die Veränderung | change | Berufliche Veränderung | f |
| sich umorientieren | to reorient | Beruflich umorientieren | reflexive |
| die Umorientierung | reorientation | Berufliche Umorientierung | f |
| sich weiterbilden | to continue education | Sich weiterbilden müssen | reflexive |
| die Weiterbildung | further training | Weiterbildung machen | f |
| die Fortbildung | advanced training | Fortbildung besuchen | f |
| schulen | to train | Mitarbeiter schulen | verb |
| die Schulung | training | Schulung durchführen | f |
| das Seminar | seminar | Seminar besuchen | n |
| der Workshop | workshop | Workshop leiten | m |
| das Coaching | coaching | Coaching in Anspruch nehmen | n |
| coachen | to coach | Jemanden coachen | verb |
| der Coach | coach | Coach engagieren | m |
| mentorieren | to mentor | Nachwuchs mentorieren | verb |
| das Mentoring | mentoring | Mentoring-Programm | n |
| der Mentor | mentor | Mentor finden | m |

### Workplace Dynamics
| German | Translation | Example |
|--------|-------------|---------|
| die Zusammenarbeit | collaboration | Zusammenarbeit fördern |
| zusammenarbeiten | to collaborate | Mit Kollegen zusammenarbeiten |
| kooperieren | to cooperate | Eng kooperieren |
| die Kooperation | cooperation | Kooperation anstreben |
| das Team | team | Im Team arbeiten |
| der Teamgeist | team spirit | Teamgeist fördern |
| die Teamarbeit | teamwork | Teamarbeit stärken |
| teamfähig | able to work in a team | Teamfähig sein |
| die Teamfähigkeit | teamwork ability | Teamfähigkeit beweisen |
| die Führung | leadership | Führung übernehmen |
| führen | to lead | Team führen |
| die Führungskraft | executive/manager | Führungskraft werden |
| der Vorgesetzte | superior | Vorgesetzter entscheidet |
| der Untergebene | subordinate | Untergebener folgt |
| delegieren | to delegate | Aufgaben delegieren |
| die Delegation | delegation | Delegation wichtig |
| die Verantwortung | responsibility | Verantwortung übernehmen |
| verantwortlich | responsible | Verantwortlich sein für |
| verantwortungsbewusst | responsible | Verantwortungsbewusst handeln |
| die Kompetenz | competence | Kompetenz aufbauen |
| kompetent | competent | Kompetent sein |
| die Qualifikation | qualification | Qualifikationen erwerben |
| qualifiziert | qualified | Qualifiziert sein |
| sich qualifizieren | to qualify | Sich qualifizieren für |
| die Eignung | suitability | Eignung prüfen |
| geeignet | suitable | Geeignet sein für |
| ungeeignet | unsuitable | Ungeeignet sein |
| die Erfahrung | experience | Erfahrung sammeln |
| erfahren | experienced | Erfahren sein |
| unerfahren | inexperienced | Unerfahren sein |
| die Routine | routine | Routine entwickeln |
| routiniert | experienced/skilled | Routiniert arbeiten |
| die Fachkenntnisse | expertise | Fachkenntnisse haben |
| das Fachwissen | specialist knowledge | Fachwissen aneignen |
| der Experte | expert | Experte auf Gebiet |
| die Expertise | expertise | Expertise einbringen |
| spezialisiert | specialized | Spezialisiert sein auf |
| die Spezialisierung | specialization | Spezialisierung wählen |
| vielseitig | versatile | Vielseitig sein |
| die Vielseitigkeit | versatility | Vielseitigkeit zeigen |

### Employment Conditions
| German | Translation | Example |
|--------|-------------|---------|
| die Festanstellung | permanent position | Festanstellung suchen |
| festangestellt | permanently employed | Festangestellt sein |
| befristet | temporary | Befristeter Vertrag |
| unbefristet | permanent | Unbefristete Stelle |
| die Probezeit | probation period | Probezeit bestehen |
| die Kündigung | termination | Kündigung aussprechen |
| kündigen | to quit/terminate | Vertrag kündigen |
| gekündigt werden | to be fired | Gekündigt werden |
| fristlos | without notice | Fristlos kündigen |
| die Kündigungsfrist | notice period | Kündigungsfrist beachten |
| entlassen | to dismiss | Mitarbeiter entlassen |
| die Entlassung | dismissal | Entlassung drohen |
| die Abfindung | severance pay | Abfindung erhalten |
| das Arbeitszeugnis | job reference | Arbeitszeugnis ausstellen |
| die Vergütung | remuneration | Vergütung verhandeln |
| das Einkommen | income | Einkommen steigern |
| der Verdienst | earnings | Verdienst erhöhen |

---

## 3. Economics & Business (70 words)

### Economic Terms
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Wirtschaft | economy | Wirtschaft wächst | f |
| wirtschaftlich | economic | Wirtschaftliche Lage | adj |
| die Ökonomie | economy | Ökonomie studieren | f |
| ökonomisch | economic | Ökonomisch handeln | adj |
| das Wachstum | growth | Wirtschaftswachstum | n |
| wachsen | to grow | Wirtschaft wächst | verb |
| die Rezession | recession | Rezession befürchten | f |
| die Krise | crisis | Wirtschaftskrise | f |
| die Konjunktur | economic cycle | Konjunktur beleben | f |
| der Aufschwung | upswing | Aufschwung erleben | m |
| der Abschwung | downturn | Abschwung verhindern | m |
| die Inflation | inflation | Inflation steigt | f |
| die Deflation | deflation | Deflation droht | f |
| das Bruttoinlandsprodukt | GDP | BIP steigt | n |
| die Arbeitslosigkeit | unemployment | Arbeitslosigkeit sinkt | f |
| die Beschäftigung | employment | Beschäftigung steigt | f |
| der Markt | market | Markt analysieren | m |
| die Nachfrage | demand | Nachfrage steigt | f |
| das Angebot | supply | Angebot erhöhen | n |
| der Wettbewerb | competition | Wettbewerb intensiv | m |
| konkurrieren | to compete | Mit Firmen konkurrieren | verb |
| die Konkurrenz | competition | Konkurrenz beobachten | f |
| der Konkurrent | competitor | Konkurrent überholen | m |
| das Monopol | monopoly | Monopol haben | n |
| der Gewinn | profit | Gewinn erzielen | m |
| der Verlust | loss | Verlust erleiden | m |
| der Umsatz | turnover/revenue | Umsatz steigern | m |
| der Ertrag | yield/profit | Ertrag maximieren | m |
| rentabel | profitable | Rentabel sein | adj |
| die Rentabilität | profitability | Rentabilität prüfen | f |
| lukrativ | lucrative | Lukrativ sein | adj |
| defizitär | in deficit | Defizitäre Bilanz | adj |
| das Defizit | deficit | Defizit abbauen | n |
| der Überschuss | surplus | Überschuss erzielen | m |

### Business Operations
| German | Translation | Example |
|--------|-------------|---------|
| das Unternehmen | company | Unternehmen gründen |
| gründen | to found | Firma gründen |
| die Gründung | founding | Unternehmensgründung |
| der Gründer | founder | Gründer des Startups |
| leiten | to manage/lead | Firma leiten |
| die Leitung | management | Unter Leitung von |
| die Führung | management/leadership | Führung übernehmen |
| verwalten | to administer | Betrieb verwalten |
| die Verwaltung | administration | Verwaltung reorganisieren |
| organisieren | to organize | Prozesse organisieren |
| die Organisation | organization | Organisation verbessern |
| planen | to plan | Strategie planen |
| die Planung | planning | Strategische Planung |
| entwickeln | to develop | Konzept entwickeln |
| die Entwicklung | development | Entwicklung vorantreiben |
| produzieren | to produce | Waren produzieren |
| die Produktion | production | Produktion steigern |
| herstellen | to manufacture | Güter herstellen |
| die Herstellung | manufacturing | Herstellung optimieren |
| vertreiben | to distribute/sell | Produkte vertreiben |
| der Vertrieb | distribution/sales | Vertrieb aufbauen |
| verkaufen | to sell | Waren verkaufen |
| der Verkauf | sale | Verkauf ankurbeln |
| der Absatz | sales | Absatz fördern |
| exportieren | to export | Ins Ausland exportieren |
| der Export | export | Export steigern |
| importieren | to import | Rohstoffe importieren |
| der Import | import | Import reduzieren |
| investieren | to invest | Geld investieren |
| die Investition | investment | Investition tätigen |
| der Investor | investor | Investor finden |
| finanzieren | to finance | Projekt finanzieren |
| die Finanzierung | financing | Finanzierung sichern |
| das Kapital | capital | Kapital aufbringen |
| das Budget | budget | Budget planen |
| die Ausgabe | expenditure | Ausgaben reduzieren |
| die Einnahme | revenue | Einnahmen steigern |
| die Bilanz | balance sheet | Bilanz erstellen |
| bilanzieren | to balance | Bücher bilanzieren |
| der Jahresabschluss | annual statement | Jahresabschluss veröffentlichen |

### Marketing & Sales
| German | Translation | Example |
|--------|-------------|---------|
| das Marketing | marketing | Marketing betreiben |
| die Werbung | advertising | Werbung schalten |
| werben | to advertise | Für Produkt werben |
| die Kampagne | campaign | Kampagne starten |
| die Marke | brand | Marke aufbauen |
| die Markenbildung | branding | Markenbildung betreiben |
| die Zielgruppe | target group | Zielgruppe definieren |
| der Kunde | customer | Kunden gewinnen |
| die Kundschaft | clientele | Kundschaft erweitern |
| der Verbraucher | consumer | Verbraucher ansprechen |
| die Nachfrage | demand | Nachfrage wecken |
| bedienen | to serve | Kunden bedienen |

---

## 4. Science & Technology (75 words)

### Scientific Research
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Wissenschaft | science | Wissenschaft studieren | f |
| wissenschaftlich | scientific | Wissenschaftliche Methode | adj |
| der Wissenschaftler | scientist | Wissenschaftler forscht | m |
| forschen | to research | An Projekt forschen | verb |
| die Forschung | research | Forschung betreiben | f |
| der Forscher | researcher | Forscher entdeckt | m |
| erforschen | to research/explore | Phänomen erforschen | verb |
| untersuchen | to examine/investigate | Daten untersuchen | verb |
| die Untersuchung | examination/study | Untersuchung durchführen | f |
| analysieren | to analyze | Ergebnisse analysieren | verb |
| die Analyse | analysis | Analyse vornehmen | f |
| experimentieren | to experiment | Im Labor experimentieren | verb |
| das Experiment | experiment | Experiment durchführen | n |
| das Labor | laboratory | Im Labor arbeiten | n |
| die Hypothese | hypothesis | Hypothese aufstellen | f |
| die Theorie | theory | Theorie entwickeln | f |
| theoretisch | theoretical | Theoretischer Ansatz | adj |
| praktisch | practical | Praktische Anwendung | adj |
| empirisch | empirical | Empirische Daten | adj |
| die Empirie | empirical research | Empirie betreiben | f |
| beweisen | to prove | These beweisen | verb |
| der Beweis | proof | Beweis erbringen | m |
| nachweisen | to demonstrate | Wirkung nachweisen | separable |
| der Nachweis | proof/evidence | Nachweis führen | m |
| belegen | to prove/document | Behauptung belegen | verb |
| widerlegen | to disprove | Theorie widerlegen | verb |
| die Widerlegung | disproof/refutation | Widerlegung vorlegen | f |
| entdecken | to discover | Phänomen entdecken | verb |
| die Entdeckung | discovery | Entdeckung machen | f |
| erfinden | to invent | Gerät erfinden | verb |
| die Erfindung | invention | Erfindung patentieren | f |
| entwickeln | to develop | Technologie entwickeln | verb |
| die Entwicklung | development | Entwicklung fördern | f |
| verbessern | to improve | Verfahren verbessern | verb |
| die Verbesserung | improvement | Verbesserung erzielen | f |
| optimieren | to optimize | Prozess optimieren | verb |
| die Optimierung | optimization | Optimierung vornehmen | f |

### Technology
| German | Translation | Example |
|--------|-------------|---------|
| die Technologie | technology | Neue Technologie |
| technisch | technical | Technischer Fortschritt |
| die Technik | technology/technique | Moderne Technik |
| digital | digital | Digitale Welt |
| digitalisieren | to digitize | Prozesse digitalisieren |
| die Digitalisierung | digitalization | Digitalisierung vorantreiben |
| die Automatisierung | automation | Automatisierung steigern |
| automatisieren | to automate | Abläufe automatisieren |
| automatisch | automatic | Automatischer Prozess |
| die Künstliche Intelligenz | artificial intelligence | KI entwickeln |
| die Robotik | robotics | Robotik erforschen |
| der Roboter | robot | Roboter einsetzen |
| die Software | software | Software entwickeln |
| die Hardware | hardware | Hardware upgraden |
| das Programm | program | Programm schreiben |
| programmieren | to program | Software programmieren |
| der Programmierer | programmer | Programmierer einstellen |
| die Programmierung | programming | Programmierung lernen |
| der Algorithmus | algorithm | Algorithmus entwickeln |
| die Daten | data | Daten verarbeiten |
| die Datenbank | database | Datenbank anlegen |
| speichern | to save/store | Daten speichern |
| der Speicher | storage/memory | Speicher erweitern |
| verarbeiten | to process | Informationen verarbeiten |
| die Verarbeitung | processing | Datenverarbeitung |
| das Netzwerk | network | Netzwerk aufbauen |
| vernetzen | to network | Systeme vernetzen |
| die Vernetzung | networking | Vernetzung fördern |
| die Cloud | cloud | In der Cloud speichern |
| der Server | server | Server einrichten |
| die Schnittstelle | interface | Schnittstelle definieren |
| kompatibel | compatible | Kompatibel sein |
| die Kompatibilität | compatibility | Kompatibilität prüfen |
| aktualisieren | to update | Software aktualisieren |
| die Aktualisierung | update | Aktualisierung durchführen |
| das Update | update | Update installieren |
| upgraden | to upgrade | System upgraden |
| das Upgrade | upgrade | Upgrade vornehmen |
| installieren | to install | Programm installieren |
| die Installation | installation | Installation durchführen |
| konfigurieren | to configure | System konfigurieren |
| die Konfiguration | configuration | Konfiguration ändern |

### Innovation
| German | Translation | Example |
|--------|-------------|---------|
| die Innovation | innovation | Innovation fördern |
| innovativ | innovative | Innovative Lösung |
| erneuern | to renew/innovate | Technik erneuern |
| die Erneuerung | renewal | Erneuerung vorantreiben |
| revolutionieren | to revolutionize | Branche revolutionieren |
| die Revolution | revolution | Technologische Revolution |
| bahnbrechend | groundbreaking | Bahnbrechende Erfindung |
| wegweisend | pioneering | Wegweisende Technologie |
| fortschrittlich | progressive | Fortschrittliche Methode |
| der Fortschritt | progress | Technischer Fortschritt |

---

## 5. Politics & Society (70 words)

### Political Systems
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Demokratie | democracy | Demokratie verteidigen | f |
| demokratisch | democratic | Demokratisches System | adj |
| die Republik | republic | Bundesrepublik Deutschland | f |
| republikanisch | republican | Republikanische Ordnung | adj |
| die Monarchie | monarchy | Konstitutionelle Monarchie | f |
| die Diktatur | dictatorship | Diktatur ablehnen | f |
| diktatorisch | dictatorial | Diktatorisches Regime | adj |
| der Diktator | dictator | Diktator stürzen | m |
| totalitär | totalitarian | Totalitäres System | adj |
| autoritär | authoritarian | Autoritärer Staat | adj |
| die Autokratie | autocracy | Autokratie kritisieren | f |
| der Staat | state | Souveräner Staat | m |
| staatlich | state/governmental | Staatliche Institution | adj |
| die Nation | nation | Nation bilden | f |
| national | national | Nationale Interessen | adj |
| der Nationalstaat | nation-state | Nationalstaat gründen | m |
| die Souveränität | sovereignty | Souveränität wahren | f |
| souverän | sovereign | Souveräner Staat | adj |
| die Verfassung | constitution | Verfassung achten | f |
| verfassungsgemäß | constitutional | Verfassungsgemäß handeln | adj |
| verfassungswidrig | unconstitutional | Verfassungswidriges Gesetz | adj |
| das Grundgesetz | basic law/constitution | Grundgesetz schützen | n |
| die Gewaltenteilung | separation of powers | Gewaltenteilung wahren | f |
| die Legislative | legislature | Legislative beschließt | f |
| die Exekutive | executive | Exekutive handelt | f |
| die Judikative | judiciary | Judikative urteilt | f |

### Government & Administration
| German | Translation | Example |
|--------|-------------|---------|
| die Regierung | government | Regierung bilden |
| regieren | to govern | Land regieren |
| die Regierungszeit | term of government | Regierungszeit endet |
| der Regierungschef | head of government | Regierungschef wählen |
| die Koalition | coalition | Koalition bilden |
| die Opposition | opposition | Opposition kritisiert |
| das Parlament | parliament | Parlament tagt |
| parlamentarisch | parliamentary | Parlamentarisches System |
| der Abgeordnete | representative/MP | Abgeordneter stimmt ab |
| die Fraktion | parliamentary group | Fraktion berät |
| die Sitzung | session | Sitzung einberufen |
| tagen | to meet/sit | Parlament tagt |
| abstimmen | to vote | Über Gesetz abstimmen |
| die Abstimmung | vote | Abstimmung durchführen |
| beschließen | to decide/resolve | Gesetz beschließen |
| der Beschluss | resolution/decision | Beschluss fassen |
| verabschieden | to pass/adopt | Gesetz verabschieden |
| ratifizieren | to ratify | Vertrag ratifizieren |
| die Ratifizierung | ratification | Ratifizierung erfolgen |
| das Veto | veto | Veto einlegen |
| die Mehrheit | majority | Mehrheit haben |
| die Minderheit | minority | Minderheit schützen |
| die Stimme | vote | Stimme abgeben |
| wählen | to vote/elect | Partei wählen |
| die Wahl | election | Wahl durchführen |
| der Wahlkampf | election campaign | Wahlkampf führen |
| die Wahlbeteiligung | voter turnout | Wahlbeteiligung steigt |
| der Wahlkreis | constituency | Wahlkreis vertreten |
| kandidieren | to run for office | Für Amt kandidieren |
| der Kandidat | candidate | Kandidat nominieren |

### Laws & Justice
| German | Translation | Example |
|--------|-------------|---------|
| das Gesetz | law | Gesetz erlassen |
| gesetzlich | legal/statutory | Gesetzliche Regelung |
| die Gesetzgebung | legislation | Gesetzgebung ändern |
| rechtlich | legal | Rechtliche Lage |
| das Recht | law/right | Recht haben |
| die Rechtsordnung | legal system | Rechtsordnung achten |
| der Rechtsstaat | constitutional state | Rechtsstaat wahren |
| rechtsstaatlich | based on rule of law | Rechtsstaatliche Prinzipien |
| rechtmäßig | lawful | Rechtmäßiges Handeln |
| unrechtmäßig | unlawful | Unrechtmäßige Tat |
| legal | legal | Legal handeln |
| illegal | illegal | Illegale Aktivität |
| legitim | legitimate | Legitime Forderung |
| illegitim | illegitimate | Illegitimes Vorgehen |
| die Gerechtigkeit | justice | Gerechtigkeit fordern |
| gerecht | just/fair | Gerechte Strafe |
| ungerecht | unjust | Ungerechtes Urteil |
| die Ungerechtigkeit | injustice | Ungerechtigkeit bekämpfen |
| fair | fair | Faires Verfahren |
| unfair | unfair | Unfaire Behandlung |

---

## 6. Environment & Sustainability (65 words)

### Environmental Issues
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Umwelt | environment | Umwelt schützen | f |
| umweltfreundlich | environmentally friendly | Umweltfreundlich leben | adj |
| umweltschädlich | harmful to environment | Umweltschädliche Stoffe | adj |
| die Umweltverschmutzung | environmental pollution | Umweltverschmutzung bekämpfen | f |
| verschmutzen | to pollute | Gewässer verschmutzen | verb |
| die Verschmutzung | pollution | Verschmutzung reduzieren | f |
| die Luftverschmutzung | air pollution | Luftverschmutzung messen | f |
| die Wasserverschmutzung | water pollution | Wasserverschmutzung stoppen | f |
| die Bodenverschmutzung | soil pollution | Bodenverschmutzung sanieren | f |
| verseuchen | to contaminate | Boden verseuchen | verb |
| die Verseuchung | contamination | Verseuchung beseitigen | f |
| vergiften | to poison | Umwelt vergiften | verb |
| die Vergiftung | poisoning | Vergiftung vermeiden | f |
| giftig | toxic | Giftige Substanzen | adj |
| das Gift | poison/toxin | Gift entsorgen | n |
| der Schadstoff | pollutant | Schadstoffe ausstoßen | m |
| schädlich | harmful | Schädliche Emissionen | adj |
| belasten | to burden/pollute | Umwelt belasten | verb |
| die Belastung | burden/pollution | Umweltbelastung | f |
| der Ausstoß | emission | CO2-Ausstoß | m |
| ausstoßen | to emit | Abgase ausstoßen | separable |
| die Emission | emission | Emissionen reduzieren | f |
| emittieren | to emit | Schadstoffe emittieren | verb |
| der Treibhauseffekt | greenhouse effect | Treibhauseffekt verstärken | m |
| das Treibhausgas | greenhouse gas | Treibhausgase verringern | n |

### Climate & Ecology
| German | Translation | Example |
|--------|-------------|---------|
| das Klima | climate | Klima wandelt sich |
| klimatisch | climatic | Klimatische Veränderungen |
| der Klimawandel | climate change | Klimawandel bekämpfen |
| die Klimaerwärmung | global warming | Klimaerwärmung stoppen |
| die Erderwärmung | global warming | Erderwärmung begrenzen |
| die Klimakrise | climate crisis | Klimakrise angehen |
| klimaneutral | climate neutral | Klimaneutral werden |
| die Klimaneutralität | climate neutrality | Klimaneutralität erreichen |
| der Klimaschutz | climate protection | Klimaschutz betreiben |
| die Ökologie | ecology | Ökologie studieren |
| ökologisch | ecological | Ökologischer Fußabdruck |
| das Ökosystem | ecosystem | Ökosystem schützen |
| die Biodiversität | biodiversity | Biodiversität erhalten |
| die Artenvielfalt | biodiversity | Artenvielfalt bewahren |
| das Artensterben | species extinction | Artensterben verhindern |
| aussterben | to become extinct | Tiere sterben aus |
| vom Aussterben bedroht | endangered | Bedrohte Arten |
| schützen | to protect | Natur schützen |
| der Schutz | protection | Artenschutz |
| erhalten | to preserve | Umwelt erhalten |
| die Erhaltung | preservation | Erhaltung der Natur |
| bewahren | to conserve | Ressourcen bewahren |
| die Bewahrung | conservation | Bewahrung fördern |

### Sustainability
| German | Translation | Example |
|--------|-------------|---------|
| nachhaltig | sustainable | Nachhaltige Entwicklung |
| die Nachhaltigkeit | sustainability | Nachhaltigkeit fördern |
| erneuerbar | renewable | Erneuerbare Energien |
| die Erneuerung | renewal | Erneuerung anstreben |
| regenerativ | regenerative | Regenerative Energien |
| die Ressource | resource | Ressourcen schonen |
| knapp | scarce | Knappe Ressourcen |
| die Knappheit | scarcity | Wasserknappheit |
| erschöpfen | to deplete | Ressourcen erschöpfen |
| die Erschöpfung | depletion | Erschöpfung verhindern |
| verschwenden | to waste | Energie verschwenden |
| die Verschwendung | waste | Verschwendung vermeiden |
| sparen | to save | Strom sparen |
| die Ersparnis | savings | Ersparnisse erzielen |
| sparsam | economical | Sparsam umgehen |
| effizient | efficient | Effiziente Nutzung |
| die Effizienz | efficiency | Effizienz steigern |
| verschwenderisch | wasteful | Verschwenderischer Umgang |
| recyceln | to recycle | Müll recyceln |
| das Recycling | recycling | Recycling fördern |
| wiederverwerten | to recycle | Material wiederverwerten |
| die Wiederverwertung | recycling | Wiederverwertung ausbauen |
| entsorgen | to dispose of | Müll entsorgen |
| die Entsorgung | disposal | Entsorgung regeln |

---

## 7. Education & Academic Discourse (65 words)

### Academic Communication
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Argumentation | argumentation | Argumentation aufbauen | f |
| argumentieren | to argue | Logisch argumentieren | verb |
| das Argument | argument | Argument vorbringen | n |
| begründen | to justify | These begründen | verb |
| die Begründung | justification | Begründung liefern | f |
| belegen | to prove/substantiate | Behauptung belegen | verb |
| der Beleg | evidence/proof | Belege anführen | m |
| nachweisen | to demonstrate | Wirkung nachweisen | separable |
| der Nachweis | proof/evidence | Nachweis erbringen | m |
| beweisen | to prove | These beweisen | verb |
| der Beweis | proof | Beweis vorlegen | m |
| widerlegen | to disprove | Argument widerlegen | verb |
| die Widerlegung | refutation | Widerlegung formulieren | f |
| entkräften | to refute | These entkräften | verb |
| die Entkräftung | refutation | Entkräftung gelingen | f |
| erörtern | to discuss | Thema erörtern | verb |
| die Erörterung | discussion | Erörterung schreiben | f |
| diskutieren | to discuss | Problem diskutieren | verb |
| die Diskussion | discussion | Diskussion führen | f |
| debattieren | to debate | Kontrovers debattieren | verb |
| die Debatte | debate | Debatte anregen | f |
| analysieren | to analyze | Text analysieren | verb |
| die Analyse | analysis | Analyse durchführen | f |
| interpretieren | to interpret | Werk interpretieren | verb |
| die Interpretation | interpretation | Interpretation vortragen | f |
| deuten | to interpret | Zeichen deuten | verb |
| die Deutung | interpretation | Deutung geben | f |
| erläutern | to explain | Sachverhalt erläutern | verb |
| die Erläuterung | explanation | Erläuterung geben | f |
| darlegen | to explain/expound | Standpunkt darlegen | separable |
| die Darlegung | exposition | Darlegung folgen | f |
| ausführen | to explain/execute | Gedanken ausführen | separable |
| die Ausführung | explanation/execution | Ausführung verstehen | f |

### Critical Thinking
| German | Translation | Example |
|--------|-------------|---------|
| kritisch | critical | Kritisch hinterfragen |
| die Kritik | criticism | Kritik üben |
| kritisieren | to criticize | Vorgehen kritisieren |
| beurteilen | to judge | Sachverhalt beurteilen |
| die Beurteilung | assessment | Beurteilung abgeben |
| bewerten | to evaluate | Leistung bewerten |
| die Bewertung | evaluation | Bewertung vornehmen |
| einschätzen | to assess | Situation einschätzen |
| die Einschätzung | assessment | Einschätzung teilen |
| reflektieren | to reflect | Über Erfahrung reflektieren |
| die Reflexion | reflection | Reflexion anstellen |
| hinterfragen | to question | Kritisch hinterfragen |
| anzweifeln | to doubt | Aussage anzweifeln |
| der Zweifel | doubt | Zweifel hegen |
| zweifelhaft | doubtful | Zweifelhafte Quelle |
| fragwürdig | questionable | Fragwürdige Methode |
| umstritten | controversial | Umstrittene These |
| kontrovers | controversial | Kontroverse Diskussion |
| die Kontroverse | controversy | Kontroverse auslösen |
| differenzieren | to differentiate | Positionen differenzieren |
| die Differenzierung | differentiation | Differenzierung vornehmen |
| unterscheiden | to distinguish | Konzepte unterscheiden |
| die Unterscheidung | distinction | Unterscheidung treffen |
| abgrenzen | to delineate | Begriff abgrenzen |
| die Abgrenzung | demarcation | Abgrenzung vornehmen |

### Research Methods
| German | Translation | Example |
|--------|-------------|---------|
| die Methode | method | Methode anwenden |
| methodisch | methodical | Methodisches Vorgehen |
| die Methodologie | methodology | Methodologie entwickeln |
| systematisch | systematic | Systematisch vorgehen |
| empirisch | empirical | Empirische Forschung |
| theoretisch | theoretical | Theoretischer Rahmen |
| qualitativ | qualitative | Qualitative Studie |
| quantitativ | quantitative | Quantitative Analyse |
| erheben | to collect (data) | Daten erheben |
| die Erhebung | survey/collection | Datenerhebung |
| erfassen | to record | Informationen erfassen |
| die Erfassung | recording | Datenerfassung |
| auswerten | to evaluate | Ergebnisse auswerten |
| die Auswertung | evaluation | Auswertung vornehmen |

---

## 8. Media & Digital Culture (60 words)

### Media Landscape
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Medien | media | Medien konsumieren | pl |
| medial | media | Mediale Berichterstattung | adj |
| das Medium | medium | Massenmedium | n |
| die Massenmedien | mass media | Massenmedien kritisieren | pl |
| die Presse | press | Presse informieren | f |
| die Pressefreiheit | freedom of press | Pressefreiheit wahren | f |
| publizieren | to publish | Artikel publizieren | verb |
| die Publikation | publication | Publikation veröffentlichen | f |
| veröffentlichen | to publish | Bericht veröffentlichen | verb |
| die Veröffentlichung | publication | Veröffentlichung planen | f |
| erscheinen | to appear/be published | Buch erscheint | verb |
| herausgeben | to publish/edit | Zeitung herausgeben | separable |
| der Herausgeber | publisher/editor | Herausgeber kontaktieren | m |
| redigieren | to edit | Text redigieren | verb |
| die Redaktion | editorial office | Redaktion leiten | f |
| der Redakteur | editor | Redakteur schreibt | m |
| der Journalist | journalist | Journalist recherchiert | m |
| der Reporter | reporter | Reporter berichtet | m |
| berichten | to report | Live berichten | verb |
| der Bericht | report | Bericht lesen | m |
| die Berichterstattung | reporting/coverage | Berichterstattung kritisieren | f |
| recherchieren | to research | Gründlich recherchieren | verb |
| die Recherche | research | Recherche betreiben | f |
| die Quelle | source | Quelle angeben | f |
| zitieren | to quote | Autor zitieren | verb |
| das Zitat | quote | Zitat einfügen | n |

### Digital Communication
| German | Translation | Example |
|--------|-------------|---------|
| digital | digital | Digitale Medien |
| die Digitalisierung | digitalization | Digitalisierung vorantreiben |
| digitalisieren | to digitize | Inhalte digitalisieren |
| online | online | Online verfügbar |
| offline | offline | Offline arbeiten |
| das Internet | internet | Im Internet surfen |
| die Website | website | Website besuchen |
| die Webseite | web page | Webseite gestalten |
| der Blog | blog | Blog schreiben |
| bloggen | to blog | Regelmäßig bloggen |
| der Blogger | blogger | Blogger werden |
| posten | to post | Beitrag posten |
| der Post | post | Post verfassen |
| der Beitrag | post/contribution | Beitrag teilen |
| teilen | to share | Inhalte teilen |
| liken | to like | Post liken |
| der Like | like | Likes bekommen |
| kommentieren | to comment | Artikel kommentieren |
| der Kommentar | comment | Kommentar schreiben |
| abonnieren | to subscribe | Kanal abonnieren |
| das Abonnement | subscription | Abonnement abschließen |
| der Abonnent | subscriber | Abonnenten gewinnen |
| folgen | to follow | Account folgen |
| der Follower | follower | Follower haben |
| verlinken | to link | Seite verlinken |
| der Link | link | Link teilen |
| der Hyperlink | hyperlink | Hyperlink einfügen |
| vernetzen | to network | Sich vernetzen |
| die Vernetzung | networking | Vernetzung fördern |
| das Netzwerk | network | Soziales Netzwerk |

### Information & Communication
| German | Translation | Example |
|--------|-------------|---------|
| die Information | information | Information beschaffen |
| informieren | to inform | Sich informieren |
| die Nachricht | news/message | Nachricht lesen |
| mitteilen | to inform/communicate | Neuigkeiten mitteilen |
| die Mitteilung | message/announcement | Mitteilung machen |
| kommunizieren | to communicate | Miteinander kommunizieren |
| die Kommunikation | communication | Kommunikation verbessern |
| der Austausch | exchange | Austausch fördern |
| austauschen | to exchange | Sich austauschen |
| übermitteln | to transmit | Daten übermitteln |
| die Übermittlung | transmission | Übermittlung erfolgt |

---

## 9. Culture & Arts (60 words)

### Cultural Expression
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Kultur | culture | Kultur fördern | f |
| kulturell | cultural | Kulturelle Vielfalt | adj |
| die Kunst | art | Kunst schaffen | f |
| künstlerisch | artistic | Künstlerische Tätigkeit | adj |
| der Künstler | artist | Künstler ausstellen | m |
| kreativ | creative | Kreativ sein | adj |
| die Kreativität | creativity | Kreativität entfalten | f |
| schaffen | to create | Kunstwerk schaffen | verb |
| gestalten | to design/create | Projekt gestalten | verb |
| die Gestaltung | design/creation | Gestaltung übernehmen | f |
| entwerfen | to design | Konzept entwerfen | verb |
| der Entwurf | design/draft | Entwurf vorstellen | m |
| darstellen | to portray/represent | Figur darstellen | verb |
| die Darstellung | portrayal/representation | Darstellung interpretieren | f |
| ausdrücken | to express | Gefühle ausdrücken | separable |
| der Ausdruck | expression | Ausdruck finden | m |
| vermitteln | to convey | Botschaft vermitteln | verb |
| interpretieren | to interpret | Werk interpretieren | verb |
| die Interpretation | interpretation | Interpretation geben | f |
| würdigen | to appreciate | Leistung würdigen | verb |
| die Würdigung | appreciation | Würdigung erfahren | f |

### Visual Arts
| German | Translation | Example |
|--------|-------------|---------|
| die Malerei | painting | Malerei studieren |
| malen | to paint | Bild malen |
| der Maler | painter | Maler arbeitet |
| das Gemälde | painting | Gemälde betrachten |
| das Bild | picture | Bild aufhängen |
| die Zeichnung | drawing | Zeichnung anfertigen |
| zeichnen | to draw | Porträt zeichnen |
| die Grafik | graphic | Grafik erstellen |
| grafisch | graphic | Grafische Darstellung |
| die Skulptur | sculpture | Skulptur schaffen |
| die Plastik | sculpture | Plastik formen |
| die Statue | statue | Statue aufstellen |
| bildhauern | to sculpt | In Stein bildhauern |
| der Bildhauer | sculptor | Bildhauer meißelt |
| die Fotografie | photography | Fotografie lernen |
| fotografieren | to photograph | Landschaft fotografieren |
| der Fotograf | photographer | Fotograf arbeitet |
| das Foto | photo | Foto machen |
| die Illustration | illustration | Illustration zeichnen |
| illustrieren | to illustrate | Buch illustrieren |

### Performing Arts
| German | Translation | Example |
|--------|-------------|---------|
| das Theater | theater | Theater spielen |
| theatralisch | theatrical | Theatralische Inszenierung |
| die Bühne | stage | Auf der Bühne |
| die Inszenierung | production/staging | Inszenierung entwickeln |
| inszenieren | to stage | Stück inszenieren |
| aufführen | to perform | Stück aufführen |
| die Aufführung | performance | Aufführung besuchen |
| die Vorstellung | show/performance | Vorstellung ansehen |
| spielen | to play/act | Rolle spielen |
| der Schauspieler | actor | Schauspieler spielt |
| schauspielern | to act | Gut schauspielern |
| die Schauspielerei | acting | Schauspielerei lernen |
| die Rolle | role | Rolle übernehmen |
| der Regisseur | director | Regisseur inszeniert |
| die Regie | direction | Regie führen |
| die Musik | music | Musik komponieren |
| musikalisch | musical | Musikalische Ausbildung |
| der Musiker | musician | Musiker spielt |
| musizieren | to make music | Gemeinsam musizieren |
| komponieren | to compose | Symphonie komponieren |
| der Komponist | composer | Komponist schreibt |
| die Komposition | composition | Komposition aufführen |
| dirigieren | to conduct | Orchester dirigieren |
| der Dirigent | conductor | Dirigent leitet |

---

## 10. Philosophy & Abstract Concepts (60 words)

### Philosophical Concepts
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Philosophie | philosophy | Philosophie studieren | f |
| philosophisch | philosophical | Philosophische Frage | adj |
| der Philosoph | philosopher | Philosoph denkt | m |
| philosophieren | to philosophize | Über Leben philosophieren | verb |
| die Erkenntnis | knowledge/insight | Erkenntnisse gewinnen | f |
| erkennen | to recognize | Wahrheit erkennen | verb |
| die Wahrheit | truth | Wahrheit suchen | f |
| wahr | true | Wahre Aussage | adj |
| unwahr | untrue | Unwahre Behauptung | adj |
| die Wirklichkeit | reality | Wirklichkeit erfassen | f |
| wirklich | real | Wirkliches Geschehen | adj |
| die Realität | reality | Realität anerkennen | f |
| real | real | Reale Welt | adj |
| die Existenz | existence | Existenz beweisen | f |
| existieren | to exist | Wirklich existieren | verb |
| das Sein | being/existence | Sein und Schein | n |
| sein | to be | Sein oder Nichtsein | verb |
| das Dasein | existence/being there | Dasein hinterfragen | n |
| die Vernunft | reason | Vernunft gebrauchen | f |
| vernünftig | reasonable | Vernünftig handeln | adj |
| unvernünftig | unreasonable | Unvernünftige Entscheidung | adj |
| rational | rational | Rational denken | adj |
| irrational | irrational | Irrationale Angst | adj |
| die Rationalität | rationality | Rationalität zeigen | f |
| die Logik | logic | Logik anwenden | f |
| logisch | logical | Logischer Schluss | adj |
| unlogisch | illogical | Unlogische Argumentation | adj |
| der Verstand | intellect/mind | Verstand benutzen | m |
| verständig | sensible | Verständige Person | adj |

### Abstract Thinking
| German | Translation | Example |
|--------|-------------|---------|
| abstrakt | abstract | Abstraktes Denken |
| die Abstraktion | abstraction | Abstraktion vornehmen |
| abstrahieren | to abstract | Vom Konkreten abstrahieren |
| konkret | concrete | Konkretes Beispiel |
| allgemein | general | Allgemeine Regel |
| die Allgemeinheit | generality | Allgemeinheit formulieren |
| verallgemeinern | to generalize | Erkenntnis verallgemeinern |
| die Verallgemeinerung | generalization | Verallgemeinerung machen |
| speziell | specific | Spezieller Fall |
| spezifisch | specific | Spezifische Eigenschaft |
| die Besonderheit | particularity | Besonderheit beachten |
| allgemeingültig | universally valid | Allgemeingültige Regel |
| der Begriff | concept | Begriff definieren |
| begrifflich | conceptual | Begriffliche Klärung |
| die Kategorie | category | Kategorie zuordnen |
| kategorisieren | to categorize | Phänomene kategorisieren |
| die Klassifizierung | classification | Klassifizierung vornehmen |
| klassifizieren | to classify | Arten klassifizieren |
| das Prinzip | principle | Prinzip befolgen |
| prinzipiell | in principle | Prinzipiell möglich |
| grundsätzlich | fundamental/in principle | Grundsätzlich einverstanden |
| wesentlich | essential | Wesentlicher Punkt |
| das Wesen | essence/nature | Wesen erfassen |
| die Essenz | essence | Essenz herausarbeiten |
| elementar | elementary | Elementare Frage |
| fundamental | fundamental | Fundamentale Bedeutung |

### Values & Ethics
| German | Translation | Example |
|--------|-------------|---------|
| der Wert | value | Werte vermitteln |
| werten | to value/judge | Handlung werten |
| die Wertung | evaluation | Wertung abgeben |
| wertvoll | valuable | Wertvoller Beitrag |
| wertlos | worthless | Wertlose Aussage |
| die Moral | morality | Moral beachten |
| moralisch | moral | Moralisches Handeln |
| unmoralisch | immoral | Unmoralisches Verhalten |
| die Ethik | ethics | Ethik studieren |
| ethisch | ethical | Ethische Frage |
| unethisch | unethical | Unethisches Vorgehen |
| das Gewissen | conscience | Gewissen folgen |
| gewissenhaft | conscientious | Gewissenhaft arbeiten |
| gewissenlos | unscrupulous | Gewissenloser Mensch |

---

## 11. Psychology & Human Behavior (65 words)

### Mental States & Processes
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Psychologie | psychology | Psychologie studieren | f |
| psychologisch | psychological | Psychologische Studie | adj |
| der Psychologe | psychologist | Psychologe behandelt | m |
| psychisch | mental/psychological | Psychische Gesundheit | adj |
| mental | mental | Mentale Stärke | adj |
| die Psyche | psyche | Psyche beeinflussen | f |
| seelisch | mental/emotional | Seelische Belastung | adj |
| die Seele | soul/psyche | Seele verstehen | f |
| geistig | mental/intellectual | Geistige Fähigkeiten | adj |
| der Geist | mind/spirit | Geist schärfen | m |
| das Bewusstsein | consciousness | Bewusstsein entwickeln | n |
| bewusst | conscious | Bewusst handeln | adj |
| unbewusst | unconscious | Unbewusste Prozesse | adj |
| das Unterbewusstsein | subconscious | Unterbewusstsein erforschen | n |
| unterbewusst | subconscious | Unterbewusste Motive | adj |
| die Wahrnehmung | perception | Wahrnehmung beeinflussen | f |
| wahrnehmen | to perceive | Signale wahrnehmen | separable |
| die Aufmerksamkeit | attention | Aufmerksamkeit schenken | f |
| aufmerksam | attentive | Aufmerksam zuhören | adj |
| unaufmerksam | inattentive | Unaufmerksam sein | adj |
| die Konzentration | concentration | Konzentration fördern | f |
| konzentrieren | to concentrate | Sich konzentrieren auf | verb |
| konzentriert | concentrated | Konzentriert arbeiten | adj |
| abgelenkt | distracted | Abgelenkt sein | adj |
| die Ablenkung | distraction | Ablenkung vermeiden | f |

### Emotions & Feelings
| German | Translation | Example |
|--------|-------------|---------|
| die Emotion | emotion | Emotionen zeigen |
| emotional | emotional | Emotionale Reaktion |
| gefühlsmäßig | emotional | Gefühlsmäßige Bindung |
| empfinden | to feel | Freude empfinden |
| die Empfindung | sensation/feeling | Empfindung haben |
| empfindsam | sensitive | Empfindsame Seele |
| empfindlich | sensitive | Empfindlich reagieren |
| die Empfindlichkeit | sensitivity | Empfindlichkeit zeigen |
| die Stimmung | mood | Gute Stimmung |
| die Laune | mood | Launen haben |
| launisch | moody | Launisch sein |
| das Temperament | temperament | Temperament haben |
| temperamentvoll | temperamental | Temperamentvoller Mensch |
| die Leidenschaft | passion | Leidenschaft entwickeln |
| leidenschaftlich | passionate | Leidenschaftlich lieben |
| leidenschaftslos | passionless | Leidenschaftsloses Leben |
| die Begeisterung | enthusiasm | Begeisterung zeigen |
| begeistert | enthusiastic | Begeistert sein |
| begeistern | to inspire/enthuse | Jemanden begeistern |
| die Freude | joy | Freude empfinden |
| freudig | joyful | Freudige Nachricht |
| erfreut | pleased | Erfreut sein |
| die Euphorie | euphoria | Euphorie erleben |
| euphorisch | euphoric | Euphorisch sein |

### Personality & Character
| German | Translation | Example |
|--------|-------------|---------|
| die Persönlichkeit | personality | Persönlichkeit entwickeln |
| persönlich | personal | Persönliche Eigenschaft |
| der Charakter | character | Starker Charakter |
| charakteristisch | characteristic | Charakteristische Züge |
| die Eigenschaft | quality/trait | Positive Eigenschaften |
| das Merkmal | feature/characteristic | Typische Merkmale |
| das Temperament | temperament | Temperament zeigen |
| die Veranlagung | disposition | Veranlagung haben |
| die Neigung | tendency/inclination | Neigung zu |
| neigen | to tend | Dazu neigen |
| geneigt | inclined | Geneigt sein |
| die Begabung | talent | Begabung haben |
| begabt | talented | Begabt sein |
| unbegabt | untalented | Unbegabt sein |
| das Talent | talent | Talent entwickeln |
| talentiert | talented | Talentierte Person |
| die Fähigkeit | ability | Fähigkeiten zeigen |
| fähig | capable | Fähig sein |
| unfähig | incapable | Unfähig sein |
| die Kompetenz | competence | Kompetenz besitzen |
| kompetent | competent | Kompetent handeln |
| inkompetent | incompetent | Inkompetent sein |

### Behavior & Conduct
| German | Translation | Example |
|--------|-------------|---------|
| das Verhalten | behavior | Verhalten beobachten |
| verhalten | to behave | Sich gut verhalten |
| sich benehmen | to behave | Sich benehmen müssen |
| das Benehmen | behavior/manners | Gutes Benehmen |
| sich betragen | to behave | Sich ordentlich betragen |
| das Betragen | conduct | Schlechtes Betragen |
| handeln | to act | Verantwortungsvoll handeln |
| die Handlung | action | Handlung bereuen |
| die Handlungsweise | manner of acting | Handlungsweise ändern |
| die Tat | deed/action | Gute Tat |
| agieren | to act | Professionell agieren |
| reagieren | to react | Schnell reagieren |
| die Reaktion | reaction | Reaktion zeigen |

---

## 12. Law & Justice (60 words)

### Legal System
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| das Recht | law/right | Recht studieren | n |
| rechtlich | legal | Rechtliche Schritte | adj |
| die Rechtsprechung | jurisdiction | Rechtsprechung ändern | f |
| das Gericht | court | Vor Gericht stehen | n |
| gerichtlich | judicial | Gerichtliche Entscheidung | adj |
| der Richter | judge | Richter urteilt | m |
| richten | to judge | Über Fall richten | verb |
| der Staatsanwalt | prosecutor | Staatsanwalt klagt an | m |
| der Anwalt | lawyer | Anwalt beauftragen | m |
| der Rechtsanwalt | lawyer/attorney | Rechtsanwalt konsultieren | m |
| verteidigen | to defend | Angeklagten verteidigen | verb |
| der Verteidiger | defense attorney | Verteidiger plädiert | m |
| die Verteidigung | defense | Verteidigung übernehmen | f |
| anklagen | to charge/accuse | Jemanden anklagen | verb |
| die Anklage | charge/accusation | Anklage erheben | f |
| der Angeklagte | defendant | Angeklagter schweigt | m |
| der Kläger | plaintiff | Kläger fordert | m |
| klagen | to sue | Auf Schadenersatz klagen | verb |
| die Klage | lawsuit | Klage einreichen | f |
| verklagen | to sue | Jemanden verklagen | verb |
| der Prozess | trial | Prozess führen | m |
| prozessieren | to litigate | Gegen jemanden prozessieren | verb |
| das Verfahren | proceedings | Verfahren einleiten | n |
| verhandeln | to negotiate/try | Fall verhandeln | verb |
| die Verhandlung | negotiation/trial | Verhandlung führen | f |

### Legal Decisions
| German | Translation | Example |
|--------|-------------|---------|
| urteilen | to judge | Über Fall urteilen |
| das Urteil | judgment/verdict | Urteil sprechen |
| verurteilen | to convict | Täter verurteilen |
| die Verurteilung | conviction | Verurteilung erfolgt |
| freisprechen | to acquit | Angeklagten freisprechen |
| der Freispruch | acquittal | Freispruch erhalten |
| schuldig | guilty | Schuldig sprechen |
| die Schuld | guilt | Schuld feststellen |
| unschuldig | innocent | Unschuldig sein |
| die Unschuld | innocence | Unschuld beweisen |
| die Strafe | punishment | Strafe verhängen |
| bestrafen | to punish | Täter bestrafen |
| die Bestrafung | punishment | Bestrafung droht |
| die Geldstrafe | fine | Geldstrafe zahlen |
| die Freiheitsstrafe | prison sentence | Freiheitsstrafe bekommen |
| das Gefängnis | prison | Ins Gefängnis kommen |
| die Haft | detention/custody | In Haft nehmen |
| verhaften | to arrest | Verdächtigen verhaften |
| die Verhaftung | arrest | Verhaftung vornehmen |
| festnehmen | to arrest | Täter festnehmen |
| die Festnahme | arrest | Festnahme erfolgt |
| inhaftieren | to imprison | Jemanden inhaftieren |

### Crimes & Offenses
| German | Translation | Example |
|--------|-------------|---------|
| das Verbrechen | crime | Verbrechen begehen |
| der Verbrecher | criminal | Verbrecher fassen |
| verbrecherisch | criminal | Verbrecherische Tat |
| die Straftat | criminal offense | Straftat verüben |
| der Täter | perpetrator | Täter ermitteln |
| der Verdächtige | suspect | Verdächtigen verhören |
| verdächtigen | to suspect | Jemanden verdächtigen |
| der Verdacht | suspicion | Verdacht haben |
| verdächtig | suspicious | Verdächtiges Verhalten |
| begehen | to commit | Tat begehen |
| verüben | to commit | Anschlag verüben |
| das Opfer | victim | Opfer schützen |
| der Zeuge | witness | Zeuge aussagen |
| zeugen | to testify | Vor Gericht zeugen |
| aussagen | to testify | Als Zeuge aussagen |
| die Aussage | testimony/statement | Aussage machen |
| gestehen | to confess | Tat gestehen |
| das Geständnis | confession | Geständnis ablegen |
| leugnen | to deny | Schuld leugnen |
| die Leugnung | denial | Leugnung aufrechterhalten |

---

## 13. Medicine & Health Sciences (55 words)

### Medical Conditions
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Diagnose | diagnosis | Diagnose stellen | f |
| diagnostizieren | to diagnose | Krankheit diagnostizieren | verb |
| die Erkrankung | disease | Schwere Erkrankung | f |
| erkranken | to fall ill | An Grippe erkranken | verb |
| leiden | to suffer | An Krankheit leiden | verb |
| das Leiden | suffering/ailment | Leiden lindern | n |
| chronisch | chronic | Chronische Krankheit | adj |
| akut | acute | Akute Beschwerden | adj |
| ansteckend | contagious | Ansteckende Krankheit | adj |
| übertragbar | transmissible | Übertragbare Infektion | adj |
| sich anstecken | to catch (disease) | Sich anstecken bei | reflexive |
| die Ansteckung | infection | Ansteckung vermeiden | f |
| infizieren | to infect | Patienten infizieren | verb |
| die Infektion | infection | Infektion bekämpfen | f |
| der Virus | virus | Virus bekämpfen | m |
| viral | viral | Virale Infektion | adj |
| die Bakterie | bacterium | Bakterien abtöten | f |
| bakteriell | bacterial | Bakterielle Infektion | adj |
| die Entzündung | inflammation | Entzündung behandeln | f |
| entzündet | inflamed | Entzündete Wunde | adj |
| entzünden | to inflame | Sich entzünden | verb |

### Treatment & Care
| German | Translation | Example |
|--------|-------------|---------|
| behandeln | to treat | Patient behandeln |
| die Behandlung | treatment | Behandlung beginnen |
| therapieren | to treat | Krankheit therapieren |
| die Therapie | therapy | Therapie machen |
| heilen | to heal/cure | Krankheit heilen |
| die Heilung | healing/cure | Heilung fördern |
| kurieren | to cure | Patient kurieren |
| die Kur | cure/treatment | Kur machen |
| lindern | to alleviate | Schmerzen lindern |
| die Linderung | alleviation/relief | Linderung verschaffen |
| verschreiben | to prescribe | Medikament verschreiben |
| das Rezept | prescription | Rezept ausstellen |
| verabreichen | to administer | Medizin verabreichen |
| einnehmen | to take (medicine) | Tabletten einnehmen |
| die Einnahme | intake | Einnahme regulieren |
| dosieren | to dose | Medikament dosieren |
| die Dosierung | dosage | Dosierung beachten |
| die Nebenwirkung | side effect | Nebenwirkungen haben |
| die Wirkung | effect | Wirkung entfalten |
| wirken | to work/take effect | Medikament wirkt |
| wirksam | effective | Wirksame Behandlung |
| unwirksam | ineffective | Unwirksame Therapie |
| operieren | to operate | Patient operieren |
| die Operation | operation | Operation durchführen |
| der Eingriff | procedure/intervention | Chirurgischer Eingriff |
| die Notaufnahme | emergency room | In Notaufnahme |
| die Intensivstation | intensive care | Auf Intensivstation |
| stationär | inpatient | Stationäre Behandlung |
| ambulant | outpatient | Ambulante Versorgung |

### Prevention & Recovery
| German | Translation | Example |
|--------|-------------|---------|
| vorbeugen | to prevent | Krankheit vorbeugen |
| die Vorbeugung | prevention | Vorbeugung wichtig |
| vorbeugend | preventive | Vorbeugende Maßnahme |
| präventiv | preventive | Präventive Medizin |
| die Prävention | prevention | Prävention betreiben |
| impfen | to vaccinate | Gegen Grippe impfen |
| die Impfung | vaccination | Impfung auffrischen |
| immunisieren | to immunize | Bevölkerung immunisieren |
| die Immunisierung | immunization | Immunisierung durchführen |
| das Immunsystem | immune system | Immunsystem stärken |
| immun | immune | Immun sein gegen |
| die Immunität | immunity | Immunität erwerben |
| sich erholen | to recover | Von Krankheit erholen |
| die Erholung | recovery | Erholung brauchen |
| genesen | to recover | Vollständig genesen |
| die Genesung | recovery | Gute Genesung |
| rehabilitieren | to rehabilitate | Patienten rehabilitieren |
| die Rehabilitation | rehabilitation | Rehabilitation machen |
| die Reha | rehab | Zur Reha gehen |

---

## 14. History & Society (50 words)

### Historical Periods
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| die Geschichte | history | Geschichte studieren | f |
| geschichtlich | historical | Geschichtliche Entwicklung | adj |
| historisch | historic | Historisches Ereignis | adj |
| die Vergangenheit | past | Vergangenheit verstehen | f |
| vergangen | past | Vergangene Zeiten | adj |
| die Gegenwart | present | Gegenwart leben | f |
| gegenwärtig | current/present | Gegenwärtige Lage | adj |
| die Zukunft | future | Zukunft gestalten | f |
| zukünftig | future | Zukünftige Generationen | adj |
| die Epoche | epoch | Historische Epoche | f |
| das Zeitalter | age/era | Zeitalter der Aufklärung | n |
| die Ära | era | Neue Ära | f |
| das Jahrhundert | century | 19. Jahrhundert | n |
| das Jahrtausend | millennium | Neues Jahrtausend | n |
| das Altertum | antiquity | Altertum erforschen | n |
| antik | ancient | Antike Kultur | adj |
| das Mittelalter | Middle Ages | Im Mittelalter | n |
| mittelalterlich | medieval | Mittelalterliche Stadt | adj |
| die Neuzeit | modern age | Neuzeit beginnt | f |
| neuzeitlich | modern | Neuzeitliche Entwicklung | adj |
| die Moderne | modern era | Moderne gestalten | f |
| modern | modern | Moderne Gesellschaft | adj |

### Historical Events
| German | Translation | Example |
|--------|-------------|---------|
| das Ereignis | event | Historisches Ereignis |
| sich ereignen | to occur | Sich ereignen |
| geschehen | to happen | Was geschehen ist |
| stattfinden | to take place | Ereignis findet statt |
| die Revolution | revolution | Revolution ausbrechen |
| revolutionär | revolutionary | Revolutionäre Idee |
| revolutionieren | to revolutionize | Gesellschaft revolutionieren |
| der Krieg | war | Krieg führen |
| kriegerisch | warlike | Kriegerische Auseinandersetzung |
| der Frieden | peace | Frieden schließen |
| friedlich | peaceful | Friedliche Lösung |
| der Konflikt | conflict | Konflikt lösen |
| die Auseinandersetzung | conflict | Militärische Auseinandersetzung |
| kämpfen | to fight | Für Freiheit kämpfen |
| der Kampf | fight/struggle | Kampf führen |
| erobern | to conquer | Land erobern |
| die Eroberung | conquest | Eroberung vollziehen |
| besetzen | to occupy | Gebiet besetzen |
| die Besetzung | occupation | Besetzung beenden |
| befreien | to liberate | Land befreien |
| die Befreiung | liberation | Befreiung feiern |
| der Sieg | victory | Sieg erringen |
| siegen | to win/triumph | Über Gegner siegen |
| die Niederlage | defeat | Niederlage erleiden |

### Social Development
| German | Translation | Example |
|--------|-------------|---------|
| die Gesellschaft | society | Gesellschaft verändern |
| gesellschaftlich | social | Gesellschaftlicher Wandel |
| sozial | social | Soziale Gerechtigkeit |
| die Zivilisation | civilization | Zivilisation entwickeln |
| zivilisiert | civilized | Zivilisierte Gesellschaft |
| die Kultur | culture | Kultur pflegen |
| kulturell | cultural | Kulturelle Identität |
| die Tradition | tradition | Tradition bewahren |
| traditionell | traditional | Traditionelle Werte |
| die Entwicklung | development | Gesellschaftliche Entwicklung |
| entwickeln | to develop | Sich entwickeln |
| der Fortschritt | progress | Sozialer Fortschritt |
| fortschrittlich | progressive | Fortschrittliche Ideen |

---

## 15. Sports & Physical Activities (45 words)

### Sports & Competition
| German | Translation | Example | Notes |
|--------|-------------|---------|-------|
| der Sport | sport | Sport treiben | m |
| sportlich | athletic | Sportliche Person | adj |
| der Sportler | athlete | Sportler trainiert | m |
| die Sportart | type of sport | Sportart wählen | f |
| der Wettkampf | competition | Wettkampf austragen | m |
| wettkampfmäßig | competitive | Wettkampfmäßig trainieren | adj |
| das Turnier | tournament | Turnier gewinnen | n |
| die Meisterschaft | championship | Meisterschaft holen | f |
| der Meister | champion | Meister werden | m |
| der Wettbewerb | competition | Wettbewerb teilnehmen | m |
| konkurrieren | to compete | Mit anderen konkurrieren | verb |
| die Konkurrenz | competition | Konkurrenz überholen | f |
| der Konkurrent | competitor | Konkurrenten schlagen | m |
| antreten | to compete | Gegen jemanden antreten | separable |
| teilnehmen | to participate | An Wettkampf teilnehmen | separable |
| die Teilnahme | participation | Teilnahme sichern | f |
| der Teilnehmer | participant | Teilnehmer melden | m |
| gewinnen | to win | Wettkampf gewinnen | verb |
| der Gewinn | win | Gewinn erzielen | m |
| der Sieg | victory | Sieg erringen | m |
| siegen | to win | Über Gegner siegen | verb |
| verlieren | to lose | Spiel verlieren | verb |
| der Verlust | loss | Verlust hinnehmen | m |
| die Niederlage | defeat | Niederlage erleiden | f |

### Training & Performance
| German | Translation | Example |
|--------|-------------|---------|
| trainieren | to train | Täglich trainieren |
| das Training | training | Training absolvieren |
| der Trainer | coach | Trainer anleiten |
| die Fitness | fitness | Fitness verbessern |
| fit | fit | Fit bleiben |
| die Kondition | condition/fitness | Kondition aufbauen |
| die Ausdauer | endurance | Ausdauer steigern |
| ausdauernd | enduring | Ausdauernder Läufer |
| die Kraft | strength | Kraft entwickeln |
| kräftig | strong | Kräftiger Athlet |
| die Leistung | performance | Leistung steigern |
| leistungsfähig | efficient/capable | Leistungsfähiger Sportler |
| die Technik | technique | Technik verbessern |
| technisch | technical | Technische Fähigkeiten |
| die Form | form/shape | In Form sein |
| die Bestzeit | personal best | Bestzeit laufen |
| der Rekord | record | Rekord aufstellen |
| die Höchstleistung | peak performance | Höchstleistung erbringen |
| sich verbessern | to improve | Leistung verbessern |
| die Verbesserung | improvement | Verbesserung erzielen |
| sich steigern | to improve | Sich steigern können |
| die Steigerung | increase/improvement | Leistungssteigerung |

### Team Sports
| German | Translation | Example |
|--------|-------------|---------|
| die Mannschaft | team | Mannschaft bilden |
| das Team | team | Im Team spielen |
| der Teamgeist | team spirit | Teamgeist zeigen |
| die Zusammenarbeit | cooperation | Zusammenarbeit fördern |
| zusammenspielen | to play together | Gut zusammenspielen |
| der Mitspieler | teammate | Mitspieler unterstützen |
| der Gegner | opponent | Gegen Gegner spielen |
| der Gegenspieler | opponent | Gegenspieler überwinden |
| die Taktik | tactics | Taktik entwickeln |
| taktisch | tactical | Taktisches Vorgehen |
| die Strategie | strategy | Strategie planen |
| strategisch | strategic | Strategisches Denken |

---

## Total: B2 = ~1000 words
"""

# Create the file
docs_dir = r"c:\Users\Nalivator3000\words-learning-server\docs"
b2_file = os.path.join(docs_dir, "german-b2-vocabulary.md")

with open(b2_file, 'w', encoding='utf-8') as f:
    f.write(B2_CONTENT)

print(f"Created B2 vocabulary file: {b2_file}")
