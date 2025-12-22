const collections = [
  {
    name: "B1: Finanzielle Angelegenheiten",
    description: "Financial matters, banking, money and economic vocabulary for B1 level",
    level: "B1",
    words: [
      { word: "das Geld", translation: "деньги", example: "Ich habe nicht genug Geld für das Auto." },
      { word: "der Euro", translation: "евро", example: "Das Ticket kostet 15 Euro." },
      { word: "bezahlen", translation: "платить", example: "Ich bezahle die Rechnung mit Kreditkarte." },
      { word: "die Bezahlung", translation: "оплата", example: "Die Bezahlung ist schnell erfolgt." },
      { word: "der Preis", translation: "цена", example: "Der Preis ist viel zu hoch." },
      { word: "kosten", translation: "стоить", example: "Das Buch kostet 25 Euro." },
      { word: "teuer", translation: "дорогой", example: "Diese Jacke ist zu teuer." },
      { word: "günstig", translation: "дешевый, выгодный", example: "Im Supermarkt sind die Preise günstiger." },
      { word: "die Bank", translation: "банк", example: "Ich muss zur Bank gehen." },
      { word: "das Bankkonto", translation: "банковский счет", example: "Ich habe ein Bankkonto bei der Deutschen Bank." },
      { word: "der Kontakt", translation: "контакт, конверт", example: "Mein Kontakt ist bei der Bank aktuell." },
      { word: "die Kreditkarte", translation: "кредитная карта", example: "Ich bezahle mit meiner Kreditkarte." },
      { word: "der Kredit", translation: "кредит", example: "Ich brauche einen Kredit für das Haus." },
      { word: "das Darlehen", translation: "займ, кредит", example: "Das Darlehen wird nach 10 Jahren abbezahlt." },
      { word: "sparen", translation: "экономить, накапливать", example: "Ich spare Geld für einen Urlaub." },
      { word: "das Sparbuch", translation: "сберегательная книжка", example: "Mein Sparbuch zeigt den aktuellen Saldo." },
      { word: "der Zins", translation: "процент, проценты", example: "Der Zins auf das Sparbuch ist niedrig." },
      { word: "die Schulden", translation: "долги", example: "Er hat viele Schulden." },
      { word: "schulden", translation: "быть должным", example: "Ich schulde dir 20 Euro." },
      { word: "das Gehalt", translation: "зарплата, оклад", example: "Mein Gehalt ist monatlich." },
      { word: "die Einnahmen", translation: "доходы", example: "Seine Einnahmen sind gestiegen." },
      { word: "die Ausgaben", translation: "расходы", example: "Meine Ausgaben sind zu hoch." },
      { word: "das Budget", translation: "бюджет", example: "Wir müssen unser Budget planen." },
      { word: "das Einkommen", translation: "доход, заработок", example: "Sein Einkommen reicht nicht aus." },
      { word: "verdienen", translation: "зарабатывать", example: "Ich verdiene gut bei diesem Job." },
      { word: "der Reichtum", translation: "богатство, состояние", example: "Er hat einen großen Reichtum." },
      { word: "reich", translation: "богатый, состоятельный", example: "Sie ist eine reiche Geschäftsfrau." },
      { word: "arm", translation: "бедный", example: "Die arme Familie braucht Hilfe." },
      { word: "die Armut", translation: "бедность, нищета", example: "Armut ist ein großes Problem." },
      { word: "das Bargeld", translation: "наличные деньги", example: "Ich zahle lieber mit Bargeld." },
      { word: "der Geldschein", translation: "банкнота, бумажные деньги", example: "Der Geldschein ist beschädigt." },
      { word: "die Münze", translation: "монета", example: "Ich habe nur Münzen im Portemonnaie." },
      { word: "das Portemonnaie", translation: "кошелек, портмоне", example: "Mein Portemonnaie ist leer." },
      { word: "die Börse", translation: "биржа, фондовый рынок", example: "An der Börse steigen die Kurse." },
      { word: "die Aktie", translation: "акция", example: "Ich habe Aktien von diesem Unternehmen." },
      { word: "die Versicherung", translation: "страховка, страхование", example: "Meine Versicherung deckt alle Schäden." },
      { word: "versichern", translation: "страховать", example: "Ich versichere mein Auto." },
      { word: "die Rechnung", translation: "счет, квитанция", example: "Hier ist die Rechnung für das Essen." },
      { word: "die Quittung", translation: "квитанция, чек", example: "Geben Sie mir bitte eine Quittung." },
      { word: "das Angebot", translation: "предложение", example: "Das Angebot ist sehr attraktiv." },
      { word: "der Rabatt", translation: "скидка, скидка", example: "Es gibt einen Rabatt von 20%." },
      { word: "das Geschenk", translation: "подарок, дар", example: "Das ist ein schönes Geschenk." },
      { word: "kaufen", translation: "покупать", example: "Ich kaufe ein neues Kleid." },
      { word: "verkaufen", translation: "продавать", example: "Er verkauft sein altes Auto." },
      { word: "das Geschäft", translation: "магазин, бизнес", example: "Das Geschäft ist geschlossen." }
    ]
  }
];

console.log('B1 Final Collections:');
collections.forEach((col, i) => {
  console.log(`${i + 1}. ${col.name}: ${col.words.length} words`);
});
const totalWords = collections.reduce((sum, col) => sum + col.words.length, 0);
console.log(`\nTotal B1 Final words: ${totalWords}`);

module.exports = { collections };
