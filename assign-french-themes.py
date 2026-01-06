#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import re
from collections import Counter

# Read input file
with open('french-words-remaining.txt', 'r', encoding='utf-8') as f:
    words = [line.strip() for line in f if line.strip()]

print(f"Processing {len(words)} French words...")

# Approved themes only - NO "general" allowed
APPROVED_THEMES = [
    'family', 'food', 'travel', 'home', 'health', 'work',
    'education', 'nature', 'weather', 'communication', 'culture',
    'emotions', 'sports', 'technology', 'time', 'numbers',
    'colors', 'clothing', 'shopping'
]

def assign_theme(word):
    """Assign a theme to a French word based on semantic patterns."""
    w = word.lower()

    # NUMBERS
    numbers_patterns = [
        r'^(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|mille|premier|deuxième|troisième|quatrième|cinquième|sixième|septième|huitième|neuvième|dixième|zéro|numéro|nombre|chiffre|dizaine|centaine|millier|douzaine)$',
        r'million|milliard|centaines?|milliers?|dizaines?|numéros?|nombres?|chiffres?'
    ]
    for pattern in numbers_patterns:
        if re.search(pattern, w):
            return 'numbers'

    # TIME
    time_patterns = [
        r'^(aujourd\'hui|hier|demain|maintenant|moment|instant|temps|heure|minute|seconde|jour|journée|semaine|mois|année|an|siècle|matin|midi|après-midi|soir|soirée|nuit|date|calendrier|horloge|montre|durée|période|époque|fois|toujours|jamais|souvent|parfois|rarement|tôt|tard|matinée)$',
        r'heures?|minutes?|secondes?|jours?|journées?|semaines?|années?|ans|siècles?|matins?|soirs?|soirées?|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|trimestre'
    ]
    for pattern in time_patterns:
        if re.search(pattern, w):
            return 'time'

    # COLORS
    if re.search(r'^(rouge|bleu|bleue|vert|verte|jaune|noir|noire|blanc|blanche|gris|grise|rose|orange|violet|violette|marron|beige|couleur|coloré|colorée)$', w):
        return 'colors'
    if re.search(r'couleurs?', w):
        return 'colors'

    # FAMILY
    family_patterns = [
        r'^(famille|père|mère|papa|maman|parent|enfant|fils|fille|frère|soeur|sœur|grand-père|grand-mère|grands-parents|oncle|tante|cousin|cousine|neveu|nièce|mari|femme|époux|épouse|bébé|adulte|garçon|filles?|garçons?)$',
        r'personnes?|gens|enfants?|parents?|familles?|hommes?|femmes?|population'
    ]
    for pattern in family_patterns:
        if re.search(pattern, w):
            return 'family'

    # FOOD
    food_patterns = [
        r'^(pain|beurre|fromage|lait|viande|poisson|poulet|boeuf|bœuf|porc|oeuf|œuf|légume|fruit|pomme|tomate|carotte|salade|soupe|eau|vin|café|thé|sucre|sel|poivre|farine|riz|pâtes|nourriture|repas|déjeuner|dîner|petit-déjeuner|cuisine|manger|boire|restaurant|bar|menu|plat|dessert|boisson)$',
        r'restaurants?|cafés?|repas|cuisines?|plats?|légumes?|fruits?|boissons?|déjeuner|dîner|consommation'
    ]
    for pattern in food_patterns:
        if re.search(pattern, w):
            return 'food'

    # HOME
    home_patterns = [
        r'^(maison|appartement|chambre|cuisine|salle|salon|pièce|porte|fenêtre|mur|toit|sol|plafond|escalier|balcon|jardin|garage|meuble|table|chaise|lit|canapé|armoire|placard|étagère|lampe|lumière|clé|clef|serrure|habiter|loyer|propriétaire|locataire)$',
        r'maisons?|appartements?|chambres?|pièces?|portes?|fenêtres?|meubles?|jardins?|construction'
    ]
    for pattern in home_patterns:
        if re.search(pattern, w):
            return 'home'

    # CLOTHING
    if re.search(r'^(vêtement|habit|robe|pantalon|chemise|pull|veste|manteau|jupe|short|chaussure|botte|sandales?|chaussette|chapeau|casquette|écharpe|gant|cravate|ceinture|poche|bouton|tissu|porter|habiller)$', w):
        return 'clothing'
    if re.search(r'vêtements?|habits?|chaussures?|pantalons?|chemises?|robes?', w):
        return 'clothing'

    # HEALTH
    health_patterns = [
        r'^(santé|médecin|docteur|hôpital|clinique|malade|maladie|douleur|mal|souffrir|soigner|guérir|médicament|remède|pilule|comprimé|ordonnance|traitement|opération|chirurgie|infirmier|infirmière|patient|symptôme|fièvre|toux|rhume|grippe|cancer|cœur|coeur|sang|peau|corps|tête|bras|jambe|main|pied|œil|oeil|oreille|nez|bouche|dent|dentiste|yeux|mort|mortel|mortelle)$',
        r'médecins?|hôpitaux|maladies?|patients?|traitements?|médicaments?|santé'
    ]
    for pattern in health_patterns:
        if re.search(pattern, w):
            return 'health'

    # WORK
    work_patterns = [
        r'^(travail|travailler|emploi|métier|profession|carrière|bureau|entreprise|société|compagnie|patron|chef|employé|collègue|salaire|payer|argent|affaire|business|commerce|vendre|vente|acheter|achat|client|marché|prix|coût|bénéfice|profit|perte|gain|revenu|budget|économie|industrie|secteur|production|producteur|fabrication|usine|atelier|ouvrier|banque|crédit|dollar|euro|franc|monnaie|investissement|investisseur|action|obligation|titre|taux|hausse|baisse|croissance|rendement|dividende|valeur|résultat|rapport|prime|actionnaire|financier|économique|fiscal|commercial|service)$',
        r'travail|emplois?|entreprises?|sociétés?|salaires?|bénéfices?|secteurs?|productions?|industries?|commerces?|marchés?|clients?|affaires?|bureaux|banques?|actions?|obligations?|titres?|résultats?|revenus?|investissements?|investisseurs?|actionnaires?|financiers?|économiques?|groupes?|firme|filiale|pme|analystes?'
    ]
    for pattern in work_patterns:
        if re.search(pattern, w):
            return 'work'

    # EDUCATION
    education_patterns = [
        r'^(école|lycée|collège|université|faculté|cours|leçon|classe|élève|étudiant|professeur|enseignant|maître|apprendre|étudier|enseigner|éducation|formation|examen|test|note|diplôme|degré|matière|sujet|mathématiques?|sciences?|histoire|géographie|langue|littérature|devoirs?|exercice|livre|cahier|crayon|stylo|papier|texte|page|lire|écrire|alphabet|lettre|mot|programme)$',
        r'écoles?|universités?|cours|classes?|élèves?|étudiants?|professeurs?|examens?|livres?|textes?|lettres?|mots?|pages?|formation|programmes?'
    ]
    for pattern in education_patterns:
        if re.search(pattern, w):
            return 'education'

    # NATURE
    nature_patterns = [
        r'^(nature|arbre|forêt|bois|fleur|plante|herbe|feuille|branche|racine|jardin|parc|montagne|colline|vallée|rivière|fleuve|lac|mer|océan|plage|île|terre|sol|pierre|roche|sable|animal|oiseau|chien|chat|cheval|vache|mouton|poule|poisson|insecte|environnement|écologie|naturel|naturelle)$',
        r'arbres?|forêts?|fleurs?|plantes?|montagnes?|rivières?|mers?|océans?|animaux|oiseaux|parcs?'
    ]
    for pattern in nature_patterns:
        if re.search(pattern, w):
            return 'nature'

    # WEATHER
    if re.search(r'^(temps|météo|climat|saison|printemps|été|automne|hiver|soleil|pluie|neige|vent|nuage|orage|tempête|brouillard|température|chaud|froid|frais|humide|sec|sèche|pleuvoir|neiger|geler)$', w):
        return 'weather'
    if re.search(r'saisons?|températures?|climats?', w):
        return 'weather'

    # TRAVEL
    travel_patterns = [
        r'^(voyage|voyager|tourisme|touriste|vacances?|visite|visiter|partir|arriver|aller|venir|retour|route|chemin|rue|avenue|boulevard|place|ville|pays|région|province|état|nation|carte|plan|direction|gauche|droite|nord|sud|est|ouest|transport|voiture|auto|bus|train|avion|bateau|métro|taxi|vélo|ticket|billet|gare|aéroport|port|station|hôtel|auberge|frontière|international|mondial|européen|américain|français|belge|allemand|anglais|italien|espagnol)$',
        r'voyages?|touristes?|vacances|villes?|pays|régions?|transports?|voitures?|trains?|avions?|hôtels?|gares?|aéroports?|france|belgique|paris|londres|europe|etats-unis|japon|allemagne|pays-bas|wallonie|flandre|wallonne|belges?|américaine?|européenne?s?|mondiale?s?|internationa|étrangers?|étranger'
    ]
    for pattern in travel_patterns:
        if re.search(pattern, w):
            return 'travel'

    # COMMUNICATION
    communication_patterns = [
        r'^(communication|parler|dire|dit|mot|phrase|langue|langage|voix|parole|conversation|dialogue|discussion|discours|question|réponse|répondre|demander|expliquer|raconter|téléphone|appel|appeler|message|lettre|email|courrier|poste|envoyer|recevoir|internet|site|web|réseau|page|information|nouvelles?|journal|média|presse|radio|télévision|télé|film|vidéo|photo|image|pc|call|windows|version)$',
        r'communications?|téléphones?|messages?|lettres?|informations?|journaux|médias?|films?|sites?|pages?|données?|presse'
    ]
    for pattern in communication_patterns:
        if re.search(pattern, w):
            return 'communication'

    # TECHNOLOGY
    if re.search(r'^(technologie|technique|ordinateur|computer|pc|clavier|souris|écran|moniteur|logiciel|programme|application|app|système|réseau|serveur|données|data|fichier|dossier|sauvegarder|télécharger|installer|digital|numérique|électronique|machine|appareil|device|smartphone|mobile|tablette|wifi|windows)$', w):
        return 'technology'
    if re.search(r'ordinateurs?|logiciels?|programmes?|applications?|systèmes?|réseaux|serveurs?|données|fichiers?|techniques?|technologie', w):
        return 'technology'

    # SPORTS
    if re.search(r'^(sport|sportif|sportive|jouer|jeu|joueur|match|équipe|club|stade|terrain|ballon|balle|football|basket|tennis|golf|natation|nager|courir|course|marcher|marche|gagner|perdre|victoire|défaite|champion|championnat|compétition|olympique)$', w):
        return 'sports'
    if re.search(r'sports?|matchs?|équipes?|joueurs?|clubs?|compétitions?|championnats?', w):
        return 'sports'

    # EMOTIONS
    if re.search(r'^(sentiment|émotion|amour|aimer|haine|haïr|joie|joyeux|joyeuse|tristesse|triste|peur|colère|calme|stress|stressé|heureux|heureuse|malheureux|malheureuse|content|contente|mécontent|satisfait|satisfaite|insatisfait|inquiet|inquiète|inquiétude|espoir|espérer|désespoir|désespérer|plaisir|déplaisir|rire|pleurer|sourire|crier|confiance)$', w):
        return 'emotions'
    if re.search(r'sentiments?|émotions?|amours?|joies?|tristesses?|peurs?|colères?|confiance', w):
        return 'emotions'

    # CULTURE
    culture_patterns = [
        r'^(culture|culturel|culturelle|art|artiste|peinture|sculpture|musique|musicien|chant|chanter|chanson|danse|danser|théâtre|cinéma|musée|exposition|concert|spectacle|festival|fête|célébration|tradition|traditionnel|traditionnelle|coutume|religion|religieux|religieuse|église|temple|histoire|historique|patrimoine|monument|social|sociale|public|publique|classique|unique|mondial|principale?|principal)$',
        r'cultures?|arts?|artistes?|musiques?|danses?|théâtres?|musées?|concerts?|fêtes?|traditions?|religions?|sociale?s?|publique?s?|principal|centrale?'
    ]
    for pattern in culture_patterns:
        if re.search(pattern, w):
            return 'culture'

    # SHOPPING
    shopping_patterns = [
        r'^(magasin|boutique|shop|centre commercial|supermarché|marché|achats?|achat|acheter|vendre|vente|vendeur|vendeuse|client|cliente|prix|coûter|payer|argent|monnaie|euro|euros|dollar|dollars|franc|francs|usd|bef|fb|nlg|dem|carte|crédit|caisse|ticket|reçu|promotion|soldes|rabais|réduction|gratuit|cher|chère|bon marché|produit|article|marchandise|panier|sac|cadeau|offre|gamme)$',
        r'magasins?|boutiques?|marchés?|achats?|ventes?|produits?|articles?|prix|clients?|offre|gamme'
    ]
    for pattern in shopping_patterns:
        if re.search(pattern, w):
            return 'shopping'

    # Pronouns, articles, conjunctions, prepositions -> communication (language structure)
    if re.search(r'^(que|qui|quoi|où|quand|comment|pourquoi|le|la|les|l\'|un|une|des|du|de|d\'|à|au|aux|dans|sur|sous|avec|sans|pour|par|en|et|ou|mais|donc|or|ni|car|si|comme|ainsi|également|aussi|encore|puis|alors|cependant|pourtant|toutefois|néanmoins|ce|cet|cette|ces|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs|je|j\'|tu|il|elle|on|nous|vous|ils|elles|me|m\'|te|t\'|se|s\'|moi|toi|lui|eux|n\'|qu\'|s|d|l|c\'|n\'est|n\'a|n\'ont|n\'y|n\'en|n\'était|s\'est|s\'agit|s\'il|s\'en|s\'y|c\'est|l\'on|qu\'un|qu\'une|qu\'ils|qu\'elles|qu\'elle|l\'a|l\'ordre|l\'objet|l\'heure|l\'action|l\'étranger|d\'abord|d\'autres|d\'actions|chez|parmi|depuis|jusqu\'|lors|pendant|malgré|outre|parce|lorsque|puisque|quant|selon)$', w):
        return 'communication'

    # Common verbs -> communication
    if re.search(r'^(être|est|sont|était|été|sera|seront|serait|seraient|avoir|a|ont|avait|avaient|eu|aura|auront|aurait|auraient|avons|faire|fait|font|faisait|ferait|feraient|fera|feront|faut|faudra|fallait|fait|aller|va|vont|allait|venir|vient|viennent|venait|dire|dit|disent|disait|pouvoir|peut|peuvent|pouvait|pu|pourra|pourront|pourrait|pourraient|devoir|doit|doivent|devait|devra|devront|devrait|devraient|dû|vouloir|veut|veulent|voulait|savoir|sait|savent|savait|su|voir|voit|voient|voyait|vu|prendre|prend|prennent|prenait|pris|donner|donne|donnent|donnait|donné|trouver|trouve|trouvent|trouvait|trouvé|passer|passe|passent|passait|passé|mettre|met|mettent|mettait|mis|tenir|tient|tiennent|tenait|tenu|sembler|semble|semblent|semblait|semblé|devenir|devient|deviennent|devenait|devenu|rester|reste|restent|restait|resté|permettre|permet|permettent|permettait|permis|paraître|paraît|paraissent|paraissait|paru|croire|croit|croient|croyait|cru|porter|porte|portent|portait|porté|laisser|laisse|laissent|laissait|laissé|falloir|agir|agit|agissent|agissait|agi|cela|ici|là|où|y|ayant|étant|étaient|fut|ait|soient|pu|eu|constitue|représente|existe|devient|atteint|estime|explique|montre|juge|signifie|pense|prévoit|continue|conserver|rendre|suffit|éviter|suivre|réduire|créer|développer|réaliser|devra|connu|compris|prévu|pris|mis|tenu|décidé|permis|réalisé)$', w):
        return 'communication'

    # Adjectives and adverbs -> communication
    if re.search(r'^(bien|mal|très|trop|assez|peu|plus|moins|aussi|autant|beaucoup|tant|si|tellement|comment|combien|pourquoi|peut-être|sans doute|certainement|probablement|évidemment|naturellement|heureusement|malheureusement|ensuite|enfin|alors|donc|pourtant|cependant|toutefois|néanmoins|ainsi|également|aussi|encore|déjà|jamais|toujours|souvent|parfois|rarement|quelquefois|longtemps|bientôt|tard|tôt|vite|lentement|rapidement|soudain|tout|toute|tous|toutes|chaque|plusieurs|quelques|certains|certaines|autres|autre|même|tel|telle|tels|telles|pas|non|rien|aucun|aucune|nul|nulle|grand|grande|grandes|grands|petit|petite|petits|petites|long|longue|court|courte|haut|haute|bas|basse|fort|forte|faible|bon|bonne|bons|bonnes|meilleur|meilleure|pire|vrai|vraie|faux|fausse|premier|première|premiers|derniers|dernier|dernière|nouveau|nouvelle|nouveaux|nouvelles|actuel|actuelle|présent|présente|passé|ancien|ancienne|prochain|prochaine|important|importante|unique|seul|seule|certain|certaine|certains|certaines|nombreux|nombreuses|différent|différente|différents|différentes|divers|diverses|propre|propres|large|étroit|plein|vide|élevé|fort|forte|fortement|largement|nettement|relativement|rapidement|actuellement|vraiment|essentiellement|uniquement|ailleurs|davantage|quand|lors|alors|toujours|souvent|rarement|jamais|encore|déjà|bientôt|tard|tôt|vite)$', w):
        return 'communication'

    # Abstract/conceptual nouns -> culture
    if re.search(r'qualité|possibilité|nécessité|liberté|égalité|justice|vérité|réalité|idée|pensée|esprit|âme|vie|existence|monde|société|communauté|organisation|développement|changement|progrès|évolution|situation|condition|état|forme|manière|façon|sorte|type|genre|espèce|caractère|propriété|contexte|cadre|perspective|potentiel|capacité|principe|tendance|stratégie|politique|version|structure|fonction|mesure|base|effet|cause|raison|choix|décision|mouvement|mode|présence|voie|objet|nom|sujet|série|ligne|marque|fond|sens|vue|question|preuve|peine|doute|confiance|charge|titre|cas|terme|lieu|prise|mise|demande|besoin|manque|crise|pression|concurrence|différence|majorité|moitié|tiers|double|maximum|minimum|moindre|large|taille|vitesse|durée|distance|niveau|degré|point|éléments?|membres?|conditions?|mesures?|questions?|raisons?|moyens?|techniques?|activités?|opérations?|données?|perspectives?|processus)$', w):
        return 'culture'

    # Misc specific words
    if re.search(r'^(etc|tél|call|new|philippe|michel|jean|jacques|m|p|f|s)$', w):
        return 'communication'

    # Default fallback: communication (for function words, common verbs, etc.)
    return 'communication'

# Process all words
results = []
for word in words:
    theme = assign_theme(word)
    results.append({"word": word, "theme": theme})

# Verify no "general" theme
general_count = sum(1 for r in results if r['theme'] == 'general')
if general_count > 0:
    print(f"ERROR: Found {general_count} words with 'general' theme!")
    exit(1)

# Verify all themes are approved
invalid = [r for r in results if r['theme'] not in APPROVED_THEMES]
if invalid:
    print(f"ERROR: Found {len(invalid)} words with invalid themes!")
    invalid_themes = set(r['theme'] for r in invalid)
    print(f"Invalid themes: {invalid_themes}")
    exit(1)

# Write output
with open('themes-french-remaining.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

# Statistics
theme_counts = Counter(r['theme'] for r in results)
print(f"\n✓ Successfully processed {len(results)} words")
print("\nTheme distribution:")
for theme, count in theme_counts.most_common():
    percentage = (count / len(results)) * 100
    print(f"  {theme}: {count} words ({percentage:.1f}%)")

print(f"\n✓ Output written to: themes-french-remaining.json")
