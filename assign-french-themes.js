const fs = require('fs');
const path = require('path');

// Read the French words
const wordsFile = path.join(__dirname, 'french-words-remaining.txt');
const words = fs.readFileSync(wordsFile, 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Processing ${words.length} French words...`);

// Approved themes only
const APPROVED_THEMES = [
  'family', 'food', 'travel', 'home', 'health', 'work',
  'education', 'nature', 'weather', 'communication', 'culture',
  'emotions', 'sports', 'technology', 'time', 'numbers',
  'colors', 'clothing', 'shopping'
];

// Theme assignment based on semantic patterns and word meanings
function assignTheme(word) {
  const w = word.toLowerCase();

  // Numbers theme
  if (/^(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|mille|million|milliard|premier|deuxième|troisième|zéro|chiffre|numéro|nombre|dizaine|centaine|douzaine)$/.test(w)) {
    return 'numbers';
  }
  if (/millions?|milliards?|centaines?|milliers?|dizaines?/.test(w)) return 'numbers';

  // Time theme
  if (/^(aujourd'hui|hier|demain|maintenant|moment|instant|temps|heure|minute|seconde|jour|journée|semaine|mois|année|an|années|ans|siècle|matin|midi|après-midi|soir|soirée|nuit|date|calendrier|horloge|montre|durée|période|époque|fois|toujours|jamais|souvent|parfois|rarement|tôt|tard)$/.test(w)) {
    return 'time';
  }
  if (/heures?|minutes?|secondes?|jours?|journées?|semaines?|années?|siècles?|matins?|soirs?/.test(w)) return 'time';

  // Colors theme
  if (/^(rouge|bleu|bleue|vert|verte|jaune|noir|noire|blanc|blanche|gris|grise|rose|orange|violet|violette|marron|beige|couleur|coloré)$/.test(w)) {
    return 'colors';
  }

  // Family theme
  if (/^(famille|père|mère|papa|maman|parent|enfant|fils|fille|frère|soeur|grand-père|grand-mère|grands-parents|oncle|tante|cousin|cousine|neveu|nièce|mari|femme|époux|épouse|bébé|adulte|personne|gens|homme|hommes|femmes|garçon|fille|enfants|parents)$/.test(w)) {
    return 'family';
  }
  if (/personnes?|gens|enfants?|parents?|familles?/.test(w)) return 'family';

  // Food theme
  if (/^(pain|beurre|fromage|lait|viande|poisson|poulet|boeuf|porc|oeuf|légume|fruit|pomme|tomate|carotte|salade|soupe|eau|vin|café|thé|sucre|sel|poivre|farine|riz|pâtes|nourriture|repas|déjeuner|dîner|petit-déjeuner|cuisine|manger|boire|restaurant|café|bar|menu|plat|dessert|boisson)$/.test(w)) {
    return 'food';
  }
  if (/restaurants?|cafés?|repas|cuisine|plats?|légumes?|fruits?|boissons?|déjeuner|dîner/.test(w)) return 'food';

  // Home theme
  if (/^(maison|appartement|chambre|cuisine|salle|salon|pièce|porte|fenêtre|mur|toit|sol|plafond|escalier|balcon|jardin|garage|meuble|table|chaise|lit|canapé|armoire|placard|étagère|lampe|lumière|clé|serrure|habiter|loyer|propriétaire|locataire)$/.test(w)) {
    return 'home';
  }
  if (/maisons?|appartements?|chambres?|pièces?|portes?|fenêtres?|meubles?|jardins?/.test(w)) return 'home';

  // Clothing theme
  if (/^(vêtement|habit|robe|pantalon|chemise|pull|veste|manteau|jupe|short|chaussure|botte|sandales|chaussette|chapeau|casquette|écharpe|gant|cravate|ceinture|poche|bouton|tissu|porter|habiller)$/.test(w)) {
    return 'clothing';
  }
  if (/vêtements?|habits?|chaussures?|pantalons?|chemises?|robes?/.test(w)) return 'clothing';

  // Health theme
  if (/^(santé|médecin|docteur|hôpital|clinique|malade|maladie|douleur|mal|souffrir|soigner|guérir|médicament|remède|pilule|comprimé|ordonnance|traitement|opération|chirurgie|infirmier|infirmière|patient|symptôme|fièvre|toux|rhume|grippe|cancer|coeur|sang|peau|corps|tête|bras|jambe|main|pied|oeil|oreille|nez|bouche|dent|dentiste)$/.test(w)) {
    return 'health';
  }
  if (/médecins?|hôpitaux|maladies?|patients?|traitements?|médicaments?|santé/.test(w)) return 'health';

  // Work theme
  if (/^(travail|travailler|emploi|métier|profession|carrière|bureau|entreprise|société|compagnie|patron|chef|employé|collègue|salaire|payer|argent|affaire|business|commerce|vendre|acheter|client|marché|prix|coût|bénéfice|profit|perte|gains?|revenus?|budget|économie|industrie|secteur|production|producteur|fabrication|usine|atelier|ouvrier)$/.test(w)) {
    return 'work';
  }
  if (/travail|emplois?|entreprises?|sociétés?|salaires?|bénéfices?|secteurs?|productions?|industries?|commerces?|marchés?|clients?|affaires?|bureaux/.test(w)) return 'work';

  // Education theme
  if (/^(école|lycée|collège|université|faculté|cours|leçon|classe|élève|étudiant|professeur|enseignant|maître|apprendre|étudier|enseigner|éducation|formation|examen|test|note|diplôme|degré|matière|sujet|mathématiques|sciences|histoire|géographie|langue|littérature|devoirs|exercice|livre|cahier|crayon|stylo|papier|texte|lire|écrire|alphabet|lettre|mot)$/.test(w)) {
    return 'education';
  }
  if (/écoles?|universités?|cours|classes?|élèves?|étudiants?|professeurs?|examens?|livres?|textes?|lettres?|mots?/.test(w)) return 'education';

  // Nature theme
  if (/^(nature|arbre|forêt|bois|fleur|plante|herbe|feuille|branche|racine|jardin|parc|montagne|colline|vallée|rivière|fleuve|lac|mer|océan|plage|île|terre|sol|pierre|roche|sable|animal|oiseau|chien|chat|cheval|vache|mouton|poule|poisson|insecte|environnement|écologie)$/.test(w)) {
    return 'nature';
  }
  if (/arbres?|forêts?|fleurs?|plantes?|montagnes?|rivières?|mers?|océans?|animaux|oiseaux|parcs?/.test(w)) return 'nature';

  // Weather theme
  if (/^(temps|météo|climat|saison|printemps|été|automne|hiver|soleil|pluie|neige|vent|nuage|orage|tempête|brouillard|température|chaud|froid|frais|humide|sec|pleuvoir|neiger|geler)$/.test(w)) {
    return 'weather';
  }
  if (/saisons?|températures?|climats?/.test(w)) return 'weather';

  // Travel theme
  if (/^(voyage|voyager|tourisme|touriste|vacances|vacance|visite|visiter|partir|arriver|aller|venir|retour|route|chemin|rue|avenue|boulevard|place|ville|pays|région|province|carte|plan|direction|gauche|droite|nord|sud|est|ouest|transport|voiture|auto|bus|train|avion|bateau|métro|taxi|vélo|ticket|billet|gare|aéroport|port|station|hôtel|auberge)$/.test(w)) {
    return 'travel';
  }
  if (/voyages?|touristes?|vacances|villes?|pays|régions?|transports?|voitures?|trains?|avions?|hôtels?|gares?|aéroports?/.test(w)) return 'travel';

  // Communication theme
  if (/^(communication|parler|dire|mot|phrase|langue|langage|voix|parole|conversation|dialogue|discussion|discours|question|réponse|répondre|demander|expliquer|raconter|téléphone|appel|appeler|message|lettre|email|courrier|poste|envoyer|recevoir|internet|site|web|page|information|nouvelles|journal|média|presse|radio|télévision|télé|film|vidéo|photo|image)$/.test(w)) {
    return 'communication';
  }
  if (/communications?|téléphones?|messages?|lettres?|informations?|journaux|médias?|films?|sites?|pages?/.test(w)) return 'communication';

  // Technology theme
  if (/^(technologie|ordinateur|computer|pc|clavier|souris|écran|moniteur|logiciel|programme|application|app|système|réseau|serveur|données|data|fichier|dossier|sauvegarder|télécharger|installer|digital|numérique|électronique|machine|appareil|device|smartphone|mobile|tablette|wifi)$/.test(w)) {
    return 'technology';
  }
  if (/ordinateurs?|logiciels?|programmes?|applications?|systèmes?|réseaux|serveurs?|données|fichiers?/.test(w)) return 'technology';

  // Sports theme
  if (/^(sport|sportif|jouer|jeu|joueur|match|équipe|club|stade|terrain|ballon|balle|football|basket|tennis|golf|natation|nager|courir|course|marcher|marche|gagner|perdre|victoire|défaite|champion|championnat|compétition|olympique)$/.test(w)) {
    return 'sports';
  }
  if (/sports?|matchs?|équipes?|joueurs?|clubs?|compétitions?|championnats?/.test(w)) return 'sports';

  // Emotions theme
  if (/^(sentiment|émotion|amour|aimer|haine|haïr|joie|joyeux|tristesse|triste|peur|avoir peur|colère|en colère|calme|stress|stressé|heureux|malheureux|content|mécontent|satisfait|insatisfait|inquiet|inquiétude|espoir|espérer|désespoir|désespérer|plaisir|déplaisir|rire|pleurer|sourire|crier)$/.test(w)) {
    return 'emotions';
  }
  if (/sentiments?|émotions?|amours?|joies?|tristesses?|peurs?|colères?/.test(w)) return 'emotions';

  // Culture theme
  if (/^(culture|culturel|art|artiste|peinture|sculpture|musique|musicien|chant|chanter|chanson|danse|danser|théâtre|cinéma|musée|exposition|concert|spectacle|festival|fête|célébration|tradition|traditionnel|coutume|religion|religieux|église|temple|histoire|historique|patrimoine|monument)$/.test(w)) {
    return 'culture';
  }
  if (/cultures?|arts?|artistes?|musiques?|danses?|théâtres?|musées?|concerts?|fêtes?|traditions?|religions?/.test(w)) return 'culture';

  // Shopping theme
  if (/^(magasin|boutique|shop|centre commercial|supermarché|marché|achats?|achat|acheter|vendre|vente|vendeur|vendeuse|client|cliente|prix|coûter|payer|argent|monnaie|euro|dollar|carte|crédit|caisse|ticket|reçu|promotion|soldes|rabais|réduction|gratuit|cher|bon marché|produit|article|marchandise|panier|sac|cadeau)$/.test(w)) {
    return 'shopping';
  }
  if (/magasins?|boutiques?|marchés?|achats?|ventes?|produits?|articles?|prix|clients?/.test(w)) return 'shopping';

  // Default fallback logic based on word patterns

  // Financial/business terms -> work
  if (/actions?|banques?|taux|francs?|bef|usd|fb|bénéfices?|hausses?|baisses?|résultats?|risques?|titres?|valeurs?|croissances?|rapports?|bases?|termes?|cas|effets?/.test(w)) {
    return 'work';
  }

  // Location/geography -> travel
  if (/belgique|france|etats-unis|pays|villes?|régions?/.test(w)) {
    return 'travel';
  }

  // Pronouns, articles, prepositions, conjunctions -> communication (language structure)
  if (/^(que|qui|quoi|où|quand|comment|pourquoi|le|la|les|un|une|des|du|de|à|au|aux|dans|sur|sous|avec|sans|pour|par|en|et|ou|mais|donc|or|ni|car|si|comme|ainsi|également|aussi|encore|puis|alors|cependant|pourtant|toutefois|néanmoins|ce|cet|cette|ces|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs|je|tu|il|elle|on|nous|vous|ils|elles|me|te|se|moi|toi|lui|eux)$/.test(w)) {
    return 'communication';
  }

  // Common verbs -> communication
  if (/^(être|est|sont|était|été|avoir|a|ont|avait|eu|faire|fait|font|faisait|aller|va|vont|allait|venir|vient|viennent|venait|dire|dit|disent|disait|pouvoir|peut|peuvent|pouvait|pu|devoir|doit|doivent|devait|dû|vouloir|veut|veulent|voulait|savoir|sait|savent|savait|su|voir|voit|voient|voyait|vu|prendre|prend|prennent|prenait|pris|donner|donne|donnent|donnait|donné|trouver|trouve|trouvent|trouvait|trouvé|passer|passe|passent|passait|passé|mettre|met|mettent|mettait|mis|tenir|tient|tiennent|tenait|tenu|sembler|semble|semblent|semblait|semblé|devenir|devient|deviennent|devenait|devenu|rester|reste|restent|restait|resté|permettre|permet|permettent|permettait|permis|paraître|paraît|paraissent|paraissait|paru|croire|croit|croient|croyait|cru|porter|porte|portent|portait|porté|laisser|laisse|laissent|laissait|laissé|falloir|faut|fallait|fallu|agir|agit|agissent|agissait|agi|sera|seront|serait|seraient|aura|auront|aurait|auraient|fera|feront|ferait|feraient|pourra|pourront|pourrait|pourraient|devra|devront|devrait|devraient|s'agit|s'est|n'est|n'a|l'on|qu'un|qu'elle|qu'|c'est|cela|chez)$/.test(w)) {
    return 'communication';
  }

  // Adverbs and modifiers -> communication
  if (/^(bien|mal|très|trop|assez|peu|plus|moins|aussi|autant|beaucoup|tant|si|tellement|comment|combien|pourquoi|peut-être|sans doute|certainement|probablement|évidemment|naturellement|heureusement|malheureusement|d'abord|ensuite|enfin|puis|alors|donc|pourtant|cependant|toutefois|néanmoins|ainsi|également|aussi|encore|déjà|jamais|toujours|souvent|parfois|rarement|quelquefois|longtemps|bientôt|tard|tôt|vite|lentement|rapidement|soudain|tout à coup|tout|toute|tous|toutes|chaque|plusieurs|quelques|certains|certaines|autres|même|tel|telle|tels|telles)$/.test(w)) {
    return 'communication';
  }

  // Abstract concepts -> culture
  if (/qualité|possibilité|nécessité|liberté|égalité|justice|vérité|réalité|idée|pensée|esprit|âme|vie|mort|existence|monde|société|communauté|groupe|organisation|développement|changement|progrès|évolution|situation|condition|état|forme|manière|façon|sorte|type|genre|espèce|nature|caractère|propriété|qualité/.test(w)) {
    return 'culture';
  }

  // Legal/government terms -> work
  if (/loi|règle|droit|justice|tribunal|juge|avocat|contrat|accord|traité|gouvernement|ministre|président|politique|élection|vote|parti|administration|service public|commission|conseil|comité|directive|règlement/.test(w)) {
    return 'work';
  }

  // Science/research -> education
  if (/science|scientifique|recherche|étude|analyse|expérience|théorie|hypothèse|méthode|résultat|conclusion|preuve|démonstration|observation|mesure|données|statistique|chimie|physique|biologie|mathématique/.test(w)) {
    return 'education';
  }

  // Default fallback
  return 'communication';
}

// Process all words
const results = words.map(word => ({
  word: word,
  theme: assignTheme(word)
}));

// Verify no "general" theme was used
const generalCount = results.filter(r => r.theme === 'general').length;
if (generalCount > 0) {
  console.error(`ERROR: Found ${generalCount} words with 'general' theme!`);
  process.exit(1);
}

// Verify all themes are approved
const invalidThemes = results.filter(r => !APPROVED_THEMES.includes(r.theme));
if (invalidThemes.length > 0) {
  console.error(`ERROR: Found ${invalidThemes.length} words with invalid themes!`);
  console.error('Invalid themes:', [...new Set(invalidThemes.map(r => r.theme))]);
  process.exit(1);
}

// Write output
const outputFile = path.join(__dirname, 'themes-french-remaining.json');
fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');

// Statistics
const themeStats = {};
results.forEach(r => {
  themeStats[r.theme] = (themeStats[r.theme] || 0) + 1;
});

console.log(`\n✓ Successfully processed ${results.length} words`);
console.log('\nTheme distribution:');
Object.entries(themeStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([theme, count]) => {
    console.log(`  ${theme}: ${count} words (${((count/results.length)*100).toFixed(1)}%)`);
  });

console.log(`\n✓ Output written to: ${outputFile}`);
