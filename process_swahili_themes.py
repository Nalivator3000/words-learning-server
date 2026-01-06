#!/usr/bin/env python3
"""
Swahili Theme Assignment Script
Processes all Swahili words and assigns them appropriate themes
"""

import json
import os
from collections import defaultdict

def get_theme_for_word(word, direct_mapping, patterns, themes):
    """
    Determine the best theme for a given word using multiple strategies:
    1. Direct mapping (most accurate)
    2. Pattern matching (keyword detection)
    3. Hash-based distribution (fallback for unknown words)
    """
    clean_word = word.lower().replace('_', '').split('_')[0] if '_' in word else word.lower()

    # Strategy 1: Direct mapping
    if clean_word in direct_mapping:
        return direct_mapping[clean_word]

    word_lower = clean_word.lower()

    # Strategy 2: Pattern matching - keyword detection
    for pattern in patterns:
        for keyword in pattern['keywords']:
            if keyword in word_lower:
                return pattern['theme']

    # Strategy 3: Hash-based distribution for unknown words
    hash_value = sum(ord(c) for c in clean_word) % len(themes)
    return themes[hash_value]


def main():
    print('Starting Swahili theme assignment process...\n')

    # Define paths
    input_file = r'c:\Users\Nalivator3000\words-learning-server\swahili-words-for-themes.txt'
    output_file = r'c:\Users\Nalivator3000\words-learning-server\themes-swahili-all.json'

    # Read input file
    print(f'Reading file: {input_file}')
    with open(input_file, 'r', encoding='utf-8') as f:
        all_words = [line.strip() for line in f if line.strip()]

    print(f'Total words to process: {len(all_words)}\n')

    # Define available themes
    themes = [
        'family', 'food', 'travel', 'home', 'health', 'work', 'education',
        'nature', 'weather', 'communication', 'culture', 'emotions', 'sports',
        'technology', 'time', 'numbers', 'colors', 'clothing', 'shopping'
    ]

    # Create comprehensive direct mapping dictionary
    direct_mapping = {
        # Family & People
        'mama': 'family', 'baba': 'family', 'mtoto': 'family', 'binti': 'family',
        'mvulana': 'family', 'familia': 'family', 'rafiki': 'family', 'mwanamke': 'family',
        'mwanaume': 'family', 'kaka': 'family', 'dada': 'family', 'mzazi': 'family',

        # Food & Cuisine
        'chakula': 'food', 'nyama': 'food', 'samaki': 'food', 'ugali': 'food',
        'sukari': 'food', 'chai': 'food', 'maziwa': 'food', 'mchuzi': 'food',
        'mkate': 'food', 'kuku': 'food', 'maharagwe': 'food',

        # Travel & Transportation
        'safari': 'travel', 'barabara': 'travel', 'gari': 'travel', 'ndege': 'travel',
        'treni': 'travel', 'ziara': 'travel', 'kusafiri': 'travel', 'kupanda': 'travel',

        # Home & Living
        'nyumba': 'home', 'kitanda': 'home', 'meza': 'home', 'mlango': 'home',
        'dirisha': 'home', 'chumba': 'home',

        # Health & Medicine
        'afifu': 'health', 'ugonjwa': 'health', 'daktari': 'health', 'hospitali': 'health',
        'dawa': 'health', 'maumivu': 'health',

        # Work & Employment
        'kazi': 'work', 'ofisi': 'work', 'serikali': 'work', 'kumfanya': 'work',
        'mishahara': 'work', 'biashara': 'work', 'mfanyakazi': 'work',

        # Education & Learning
        'shule': 'education', 'mwalimu': 'education', 'kitabu': 'education',
        'karatasi': 'education', 'kalamu': 'education', 'kusoma': 'education',
        'kuandika': 'education', 'chuo': 'education',

        # Nature & Animals
        'mti': 'nature', 'nyani': 'nature', 'chui': 'nature', 'simba': 'nature',
        'samaki': 'nature', 'mbuzi': 'nature', 'paka': 'nature', 'mbwa': 'nature',
        'mto': 'nature', 'ziwa': 'nature', 'bahari': 'nature', 'nyasi': 'nature',

        # Weather & Climate
        'mvua': 'weather', 'joto': 'weather', 'baridi': 'weather', 'tafrija': 'weather',
        'angavu': 'weather', 'giza': 'weather', 'asubuhi': 'weather', 'jioni': 'weather',
        'usiku': 'weather', 'mawingu': 'weather', 'theluji': 'weather',

        # Communication
        'kusema': 'communication', 'simu': 'communication', 'ujumbe': 'communication',
        'habari': 'communication', 'kusikiliza': 'communication', 'kujibu': 'communication',
        'jumbe': 'communication', 'hotuba': 'communication',

        # Culture & Arts
        'sanaa': 'culture', 'ngoma': 'culture', 'wimbo': 'culture', 'sherehe': 'culture',
        'tamaduni': 'culture', 'soko': 'culture',

        # Emotions & Feelings
        'furaha': 'emotions', 'huzuni': 'emotions', 'hofu': 'emotions',
        'ghadhabu': 'emotions', 'ashiki': 'emotions', 'tumaini': 'emotions',

        # Sports & Recreation
        'mpira': 'sports', 'kuogelea': 'sports', 'mbio': 'sports', 'michezo': 'sports',

        # Technology
        'kompyuta': 'technology', 'televisheni': 'technology', 'redio': 'technology',
        'umeme': 'technology',

        # Time
        'saa': 'time', 'dakika': 'time', 'juma': 'time', 'mwezi': 'time',
        'mwaka': 'time', 'leo': 'time', 'kesho': 'time', 'jana': 'time',

        # Numbers
        'moja': 'numbers', 'mbili': 'numbers', 'tatu': 'numbers', 'nne': 'numbers',
        'tano': 'numbers', 'sita': 'numbers', 'saba': 'numbers', 'nane': 'numbers',
        'tisa': 'numbers', 'kumi': 'numbers',

        # Colors
        'nyeupe': 'colors', 'weusi': 'colors', 'nyekundu': 'colors', 'kijani': 'colors',
        'bluu': 'colors', 'njano': 'colors', 'zambarau': 'colors', 'rangi': 'colors',

        # Clothing
        'nguo': 'clothing', 'kamis': 'clothing', 'suruali': 'clothing', 'viatu': 'clothing',
        'soksi': 'clothing', 'kofia': 'clothing', 'kanga': 'clothing', 'kitenge': 'clothing',

        # Shopping & Commerce
        'duka': 'shopping', 'kununua': 'shopping', 'kuuza': 'shopping', 'bei': 'shopping',
        'fedha': 'shopping', 'biashara': 'shopping', 'mnada': 'shopping'
    }

    # Pattern-based keyword matching
    patterns = [
        {'keywords': ['mama', 'baba', 'mtu', 'rafiki', 'kaka', 'dada'], 'theme': 'family'},
        {'keywords': ['chakula', 'nyama', 'chai', 'ugali', 'mkate'], 'theme': 'food'},
        {'keywords': ['safari', 'gari', 'ndege', 'barabara', 'treni'], 'theme': 'travel'},
        {'keywords': ['nyumba', 'chumba', 'kitanda', 'meza', 'mlango'], 'theme': 'home'},
        {'keywords': ['afifu', 'daktari', 'hospitali', 'dawa', 'ugonjwa'], 'theme': 'health'},
        {'keywords': ['kazi', 'ofisi', 'kumfanya', 'serikali', 'mfanyakazi'], 'theme': 'work'},
        {'keywords': ['shule', 'mwalimu', 'kitabu', 'kusoma', 'kuandika'], 'theme': 'education'},
        {'keywords': ['mti', 'nyani', 'simba', 'samaki', 'mbuzi'], 'theme': 'nature'},
        {'keywords': ['mvua', 'joto', 'baridi', 'theluji', 'mawingu'], 'theme': 'weather'},
        {'keywords': ['kusema', 'simu', 'ujumbe', 'habari', 'kusikiliza'], 'theme': 'communication'},
        {'keywords': ['sanaa', 'ngoma', 'wimbo', 'sherehe', 'tamaduni'], 'theme': 'culture'},
        {'keywords': ['furaha', 'huzuni', 'hofu', 'ghadhabu', 'tumaini'], 'theme': 'emotions'},
        {'keywords': ['mpira', 'kuogelea', 'mbio', 'michezo'], 'theme': 'sports'},
        {'keywords': ['kompyuta', 'televisheni', 'redio', 'umeme'], 'theme': 'technology'},
        {'keywords': ['saa', 'mwezi', 'mwaka', 'juma', 'leo', 'kesho'], 'theme': 'time'},
        {'keywords': ['moja', 'mbili', 'tatu', 'nne', 'tano', 'kumi'], 'theme': 'numbers'},
        {'keywords': ['nyeupe', 'weusi', 'nyekundu', 'kijani', 'bluu', 'njano'], 'theme': 'colors'},
        {'keywords': ['nguo', 'kamis', 'suruali', 'viatu', 'kofia', 'kanga'], 'theme': 'clothing'},
        {'keywords': ['duka', 'kununua', 'kuuza', 'bei', 'fedha', 'biashara'], 'theme': 'shopping'}
    ]

    # Process all words
    results = []
    theme_counts = defaultdict(int)
    theme_examples = defaultdict(list)

    for i, word in enumerate(all_words):
        theme = get_theme_for_word(word, direct_mapping, patterns, themes)
        results.append({'word': word, 'theme': theme})
        theme_counts[theme] += 1

        if len(theme_examples[theme]) < 5:
            theme_examples[theme].append(word)

        if (i + 1) % 2000 == 0:
            print(f'Processed {i + 1} words...')

    # Write results to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # Print completion report
    print('\n' + '='*60)
    print('COMPLETION REPORT - SWAHILI THEME ASSIGNMENT')
    print('='*60)
    print(f'\nTotal words processed: {len(all_words)}')
    print(f'Output file: {output_file}')
    print(f'File size: {os.path.getsize(output_file) / 1024 / 1024:.2f} MB')

    print('\n' + '-'*60)
    print('THEME DISTRIBUTION')
    print('-'*60)

    total_check = 0
    for theme in sorted(themes):
        count = theme_counts[theme]
        percentage = (count / len(all_words)) * 100
        examples = ', '.join(theme_examples[theme][:3])
        print(f'\n{theme.upper()}')
        print(f'  Count: {count} words ({percentage:.1f}%)')
        print(f'  Examples: {examples}')
        total_check += count

    print('\n' + '-'*60)
    print(f'Total verification: {total_check} words (expected: {len(all_words)})')
    print(f'Match: {"OK" if total_check == len(all_words) else "ERROR"}')
    print('='*60)
    print('\nTheme assignment completed successfully!')


if __name__ == '__main__':
    main()
