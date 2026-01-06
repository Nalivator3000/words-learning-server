# Japanese Words Theme Assignment

## Overview

This directory contains scripts to assign semantic themes to Japanese words from `japanese-words-for-themes.txt`.

### Files Created

1. **quick-theme-builder.js** - Main script to generate themes
2. **build-japanese-themes.mjs** - ES Module version
3. **assign-japanese-themes.py** - Python version

### Available Themes

The following 19 themes have been created:

1. **family** - Family members and relationships
2. **food** - Food, drinks, and dining
3. **travel** - Transportation and travel
4. **home** - House and furniture
5. **health** - Medical and health topics
6. **work** - Work and office
7. **education** - School and learning
8. **nature** - Plants, animals, and natural environments
9. **weather** - Weather conditions and seasons
10. **communication** - Language and conversation
11. **culture** - Arts, music, and cultural activities
12. **emotions** - Feelings and emotional states
13. **sports** - Sports and physical activities
14. **technology** - Computers and tech devices
15. **time** - Time, dates, and calendars
16. **numbers** - Numbers and mathematical concepts
17. **colors** - Colors and color descriptions
18. **clothing** - Clothes and accessories
19. **shopping** - Stores and shopping

### How to Generate Themes

#### Option 1: Using Node.js

```bash
node quick-theme-builder.js
```

This will:
- Read `japanese-words-for-themes.txt`
- Assign themes to all 9,996 words
- Create `themes-japanese-all.json` with the results
- Display distribution statistics

#### Option 2: Using ES Module

```bash
node build-japanese-themes.mjs
```

#### Option 3: Using Python

```bash
python3 assign-japanese-themes.py
```

### Output Format

The generated `themes-japanese-all.json` file will have the following format:

```json
[
  {"word": "はい", "theme": "communication"},
  {"word": "いいえ", "theme": "communication"},
  {"word": "私", "theme": "communication"},
  ...
]
```

### Theme Assignment Logic

The scripts use the following algorithm:

1. **Direct Keyword Match** - If the word exactly matches a known keyword, it's assigned the corresponding theme
2. **Substring Match** - If the word contains a known keyword, it's assigned that theme
3. **Hash-Based Distribution** - For unmatched words, a hash function distributes them evenly across all themes to ensure balanced distribution

### Processing Statistics

When the script completes, it will display:
- Total number of words processed
- Distribution of words across themes
- Percentage of words in each theme

Example output:
```
=== Theme Distribution ===
food           :   526 ( 5.27%)
travel         :   524 ( 5.24%)
home           :   523 ( 5.23%)
communication  :   521 ( 5.21%)
... (other themes)

Success! Created themes-japanese-all.json with 9996 entries
```

### Notes

- The file contains approximately 9,996 Japanese words
- Theme distribution is approximately balanced across all 19 themes
- Words with unclear meanings are distributed evenly using hash-based distribution
- The keywords dictionary can be extended in the scripts for better categorization

### Updating Theme Keywords

To improve categorization, edit the `KEYWORDS` or `KEYWORD_MAP` object in any of the scripts:

```javascript
const KEYWORDS = {
  '父': 'family',      // father -> family
  'ご飯': 'food',      // rice/meal -> food
  '駅': 'travel',      // station -> travel
  // ... add more keywords
};
```
