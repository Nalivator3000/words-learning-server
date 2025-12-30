# Word Collections Documentation

## Overview

German vocabulary is organized into thematic collections based on CEFR levels (A1-C2). Instead of large monolithic sets, words are grouped into manageable themed collections of 10-50 words each.

## Collection Statistics

### Total Collections: 146

| Level | Collections | Total Words | Themes |
|-------|------------|-------------|--------|
| A1 | 21 | ~674 | Food, People, Time, House, Weather, Essential Vocabulary |
| A2 | 18 | ~720 | Health, Food, Communication, Work, Education, Travel |
| B1 | 19 | ~502 | Work, Social Relations, Money, Media, Culture, Sports |
| B2 | 28 | ~1177 | Communication, Work, Politics, Health, Science, Culture |
| C1 | 18 | ~1903 | Education, Culture, Work, Politics, Economics, Medicine |
| C2 | 31 | ~3075 | Science, Education, Culture, Politics, Law, Philosophy |
| Thematic | 10 | ~5000 | Cross-level thematic collections |

## Level Breakdown

### A1 - Beginner (21 collections)

**Essential Vocabulary (10 collections)**
- German A1: Essential Vocabulary 1-10 (30-50 words each)
- Core vocabulary needed for basic communication

**Themed Collections (11 collections)**
- Food and Drinks (29 words)
- People & Relationships (22 words)
- Days, Months, Time (19 words)
- House and Furniture (17 words)
- Numbers, Time & Basic Concepts (17 words)
- Everyday Life & Basic Activities (16 words)
- Food & Drinks (16 words)
- Weather and Seasons (15 words)
- Question Words (11 words)
- Places & Directions (11 words)

### A2 - Elementary (18 collections)

**Essential Vocabulary (6 collections)**
- German A2: Essential Vocabulary 1-6 (25-50 words each)

**Themed Collections (12 collections)**
- Health (53 words)
- Food (51 words)
- Communication (49 words)
- Work (49 words)
- Education (46 words)
- Travel (42 words)
- Past Experiences and Future Plans (42 words)
- Shopping and Services (29 words)
- Descriptions of People and Places (27 words)
- Daily Routines and Habits (22 words)
- Hobbies and Leisure (15 words)
- Work and Study (15 words)

### B1 - Intermediate (19 collections)

**Essential Vocabulary (5 collections)**
- German B1: Essential Vocabulary 1-5 (17-50 words each)

**Themed Collections (14 collections)**
- Work (40 words)
- Soziale Beziehungen / Social Relations (32 words)
- Arbeit und Beruf / Work and Career (28 words)
- Money and Finance (23 words)
- Medien und Technologie / Media and Technology (20 words)
- Reisen und Geografie / Travel and Geography (19 words)
- Culture and Arts (17 words)
- Gesundheit und Lebensstil / Health and Lifestyle (16 words)
- Bildung und Entwicklung / Education and Development (16 words)
- Sports and Hobbies (15 words)
- Emotions and Personality (14 words)
- Housing and Living Situations (12 words)
- Shopping and Consumer Behavior (11 words)
- Food and Dining (10 words)

### B2 - Upper Intermediate (28 collections)

**Essential Vocabulary (3 collections)**
- German B2: Essential Vocabulary 1-3 (16-50 words each)

**Themed Collections (25 collections)**
- Communication (173 words)
- Work (164 words)
- Politics (129 words)
- Health (115 words)
- Science (95 words)
- Culture (47 words)
- Abstract Concepts & Complex Ideas (24 words)
- Complex Emotions & Psychological States (24 words)
- Advanced Literary & Artistic Vocabulary (23 words)
- Law (21 words)
- Advanced Academic & Professional Concepts (20 words)
- Philosophy (20 words)
- Advanced Abstract Concepts & Philosophy (20 words)
- Food (19 words)
- Society, Culture & Human Relations (19 words)
- Environment, Climate & Sustainability (16 words)
- Business & Professional Communication (16 words)
- Science, Technology & Innovation (14 words)
- Travel (14 words)
- Economics (14 words)
- Health, Psychology & Personal Development (13 words)
- Environment (13 words)
- Advanced Communication & Rhetoric (11 words)
- Education, Culture & Media (10 words)
- Psychology (10 words)

### C1 - Advanced (18 collections)

**Essential Vocabulary (2 collections)**
- German C1: Essential Vocabulary 1-2 (43-50 words each)

**Themed Collections (16 collections)**
- Education (335 words)
- Culture (204 words)
- Work (152 words)
- Politics (132 words)
- Economics (129 words)
- Medicine (123 words)
- Science (109 words)
- Philosophy (103 words)
- Psychology (103 words)
- Sociology (99 words)
- Law (95 words)
- Environment (80 words)
- Advanced Expressions and Nuanced Language (46 words)
- Academic and Intellectual Discourse (40 words)
- Professional and Technical Terminology (32 words)
- Cultural, Social and Political Discourse (24 words)

### C2 - Mastery (31 collections)

**Essential Vocabulary (8 collections)**
- German C2: Essential Vocabulary 1-8 (23-50 words each)

**Themed Collections (23 collections)**
- Science (390 words)
- Education (375 words)
- Culture (219 words)
- Politics (203 words)
- Economics (171 words)
- Law (171 words)
- Philosophy (126 words)
- Environment (109 words)
- Cutting-Edge Technology & Innovation (92 words)
- Advanced Psychology & Human Behavior (80 words)
- Religion & Theology (79 words)
- Ethics & Moral Philosophy (79 words)
- Linguistic Theory & Communication Science (77 words)
- Musicology & Music Theory (77 words)
- Advanced Business & Management (74 words)
- Astronomy & Cosmology (69 words)
- Geography & Geopolitics (67 words)
- Film & Media Theory (64 words)
- Advanced Chemistry & Physics (62 words)
- Historical & Archaeological Terminology (56 words)
- Advanced Legal & Jurisprudence (25 words)
- Advanced Neuroscience & Cognitive Science (17 words)
- Advanced Cultural & Sociological Analysis (12 words)

## Scripts

### Creating Collections

Two scripts are available for creating thematic collections:

#### `create-a1-thematic-collections.js`
Creates 20 thematic collections specifically for A1 level.

```bash
DATABASE_URL="..." node scripts/create-a1-thematic-collections.js
```

#### `create-all-level-thematic-collections.js`
Creates thematic collections for all levels (A2, B1, B2, C1, C2).

```bash
DATABASE_URL="..." node scripts/create-all-level-thematic-collections.js
```

### Features

- **Automatic Grouping**: Words are grouped by existing `theme` field in source_words_german table
- **Chunking**: Large 'general' themes are split into 50-word chunks
- **Minimum Size**: Themes with fewer than 10 words are skipped
- **Public Collections**: All created collections are marked as public (is_public = true)

## Database Structure

### Tables

**word_sets**
- `id`: Primary key
- `source_language`: 'german'
- `title`: Display name (e.g., "German A1: Food and Drinks")
- `description`: Brief description
- `level`: CEFR level (A1, A2, B1, B2, C1, C2)
- `theme`: Theme name (e.g., "food", "work", "general")
- `word_count`: Number of words in collection
- `is_public`: Boolean flag for visibility

**source_words_german**
- Contains all German source words with `level` and `theme` fields
- Used as the source for populating collections

**word_set_items**
- Links word_sets to individual words (currently not used, words loaded on import)

## Usage in Application

### Import Flow

1. User browses available word sets in Import section
2. Collections are displayed as cards with:
   - Title
   - Level badge
   - Theme badge
   - Word count
   - Description
   - Preview of first few words (planned)
3. User clicks "Import" to add collection to their learning queue
4. Words from selected collection are added to user's vocabulary

### Display Features (Planned)

- Word preview in collection cards
- Filter by level and theme
- Search collections
- Sort by word count, popularity, etc.

## Maintenance

### Hiding Old Collections

Large monolithic collections (German A1, A2, B1, B2, C1, C2) are hidden:

```sql
UPDATE word_sets SET is_public = false WHERE id IN (1, 2, 3, 4, 6, 7);
```

### Adding New Collections

1. Add words to `source_words_german` with appropriate `level` and `theme`
2. Run collection creation script
3. New themed collections will be automatically created

## Future Improvements

- [ ] Add word preview to collection cards
- [ ] Implement collection search and filtering
- [ ] Add collection ratings and reviews
- [ ] Track collection popularity
- [ ] Add recommended collections based on user level
- [ ] Create collection learning paths
