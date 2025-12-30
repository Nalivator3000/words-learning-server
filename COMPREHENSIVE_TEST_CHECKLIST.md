# Comprehensive Testing Checklist - Language Learning App

## Overview

This checklist covers testing for **all 39 language pairs** across **all possible combinations** of settings, word sets, and user interactions.

**Password for all test users:** `test123`

---

## Quick Test Matrix

### Language Pair Categories

#### High Priority Pairs (4) - Complete Testing Required
- `test_de_en` - German → English (17 sets, 10 themes)
- `test_de_ru` - German → Russian (17 sets, 10 themes)
- `test_en_ru` - English → Russian (6 sets, level-only)
- `test_en_de` - English → German (6 sets, level-only)

#### Medium Priority Pairs (16) - Core Features Testing
German source: `test_de_es`, `test_de_fr`, `test_de_it`, `test_de_pt`
English source: `test_en_es`, `test_en_fr`, `test_en_it`, `test_en_pt`
Other sources: `test_es_en`, `test_es_de`, `test_fr_en`, `test_fr_de`, `test_it_en`, `test_it_de`, `test_pt_en`, `test_pt_de`
Hindi source: `test_hi_en`, `test_hi_de`

#### Low Priority Pairs (17) - Smoke Testing
Arabic: `test_ar_en`, `test_ar_de`, `test_de_ar`, `test_en_ar`
Chinese: `test_zh_en`, `test_zh_de`, `test_de_zh`, `test_en_zh`
Japanese: `test_de_ja`, `test_en_ja`
Turkish: `test_de_tr`, `test_en_tr`
Other: `test_es_fr`, `test_es_pt`, `test_fr_es`

#### Missing Word Sets (2) - Should Show Empty State
- `test_ru_en` - Russian → English (NO SETS)
- `test_ru_de` - Russian → German (NO SETS)

---

## 1. Authentication & User Profile Testing

### For EACH language pair (39 total):

- [ ] **Login Success**
  - [ ] Username: `test_[lang1]_[lang2]`
  - [ ] Password: `test123`
  - [ ] Login succeeds
  - [ ] Redirects to dashboard/home

- [ ] **Language Pair Display**
  - [ ] Correct language pair shown in UI
  - [ ] "From" language displays correctly
  - [ ] "To" language displays correctly
  - [ ] Language names in correct script (e.g., Devanagari for Hindi)

- [ ] **Session Persistence**
  - [ ] Refresh page - stay logged in
  - [ ] Navigate to different pages - stay logged in
  - [ ] Correct language pair persists across pages

- [ ] **Logout**
  - [ ] Logout button works
  - [ ] Redirects to login page
  - [ ] Cannot access protected pages after logout

---

## 2. Word Sets Display Testing

### For Language Pairs WITH Word Sets (37 pairs):

#### 2.1 Word Sets List View

- [ ] **General Display**
  - [ ] All word sets visible
  - [ ] Correct count of word sets matches expected:
    - [ ] German source: 17 sets (6 levels + 10 themes + 1 beginner)
    - [ ] Hindi source: 16 sets (6 levels + 10 themes)
    - [ ] English source: 6 sets (6 levels)
    - [ ] Spanish source: 6 sets (6 levels)
    - [ ] French source: 6 sets (6 levels)
    - [ ] Italian source: 6 sets (6 levels)
    - [ ] Portuguese source: 6 sets (6 levels)
    - [ ] Arabic source: 6 sets (6 levels)
    - [ ] Chinese source: 6 sets (6 levels)

- [ ] **Word Set Card/Tile Display**
  - [ ] Title shows correctly
  - [ ] Description visible and readable
  - [ ] Word count displays
  - [ ] Level indicator (if applicable)
  - [ ] Theme indicator (if applicable)
  - [ ] Visual hierarchy clear

#### 2.2 Level-based Sets (All pairs with sets)

Test each level individually:

- [ ] **A1 Level**
  - [ ] Set displays in list
  - [ ] Title: "[Language] A1"
  - [ ] Word count matches database
  - [ ] Can click/tap to open
  - [ ] Description mentions "Beginner" or "A1"

- [ ] **A2 Level**
  - [ ] Set displays in list
  - [ ] Title: "[Language] A2"
  - [ ] Word count matches database
  - [ ] Can click/tap to open
  - [ ] Description mentions "Elementary" or "A2"

- [ ] **B1 Level**
  - [ ] Set displays in list
  - [ ] Title: "[Language] B1"
  - [ ] Word count matches database
  - [ ] Can click/tap to open
  - [ ] Description mentions "Intermediate" or "B1"

- [ ] **B2 Level**
  - [ ] Set displays in list
  - [ ] Title: "[Language] B2"
  - [ ] Word count matches database
  - [ ] Can click/tap to open
  - [ ] Description mentions "Upper Intermediate" or "B2"

- [ ] **C1 Level**
  - [ ] Set displays in list
  - [ ] Title: "[Language] C1"
  - [ ] Word count matches database
  - [ ] Can click/tap to open
  - [ ] Description mentions "Advanced" or "C1"

- [ ] **C2 Level**
  - [ ] Set displays in list
  - [ ] Title: "[Language] C2"
  - [ ] Word count matches database
  - [ ] Can click/tap to open
  - [ ] Description mentions "Proficiency" or "C2"

- [ ] **Beginner Level** (German only)
  - [ ] Set displays in list
  - [ ] Title: "German beginner"
  - [ ] Word count matches database
  - [ ] Can click/tap to open

#### 2.3 Thematic Sets (German & Hindi only)

Test for `test_de_*` and `test_hi_*` users:

- [ ] **Communication Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Communication"
  - [ ] Word count visible
  - [ ] Description mentions communication/media
  - [ ] Can open set

- [ ] **Culture Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Culture"
  - [ ] Word count visible
  - [ ] Description mentions culture/arts
  - [ ] Can open set

- [ ] **Economics Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Economics"
  - [ ] Word count visible
  - [ ] Description mentions economy/business
  - [ ] Can open set

- [ ] **Education Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Education"
  - [ ] Word count visible
  - [ ] Description mentions education/learning
  - [ ] Can open set

- [ ] **General Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - General"
  - [ ] Word count visible
  - [ ] Description mentions everyday vocabulary
  - [ ] Can open set

- [ ] **Law Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Law"
  - [ ] Word count visible
  - [ ] Description mentions law/justice
  - [ ] Can open set

- [ ] **Philosophy Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Philosophy"
  - [ ] Word count visible
  - [ ] Description mentions philosophy/ethics
  - [ ] Can open set

- [ ] **Politics Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Politics"
  - [ ] Word count visible
  - [ ] Description mentions politics/government
  - [ ] Can open set

- [ ] **Science Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Science"
  - [ ] Word count visible
  - [ ] Description mentions science/technology
  - [ ] Can open set

- [ ] **Work Theme**
  - [ ] Displays in list
  - [ ] Title: "[Language] - Work"
  - [ ] Word count visible
  - [ ] Description mentions work/employment
  - [ ] Can open set

### For Language Pairs WITHOUT Word Sets (2 pairs):

Test for `test_ru_en` and `test_ru_de`:

- [ ] **Empty State Display**
  - [ ] Message shows "No word sets available"
  - [ ] Helpful message/illustration
  - [ ] No broken UI elements
  - [ ] No error messages in console

---

## 3. Filtering & Sorting Testing

### 3.1 Level Filtering (All pairs with sets)

- [ ] **Filter by A1**
  - [ ] Shows only A1 set
  - [ ] Other levels hidden
  - [ ] Themes hidden (if theme filter not applied)
  - [ ] Count updates correctly

- [ ] **Filter by A2**
  - [ ] Shows only A2 set
  - [ ] Other levels hidden
  - [ ] Count updates correctly

- [ ] **Filter by B1**
  - [ ] Shows only B1 set
  - [ ] Other levels hidden
  - [ ] Count updates correctly

- [ ] **Filter by B2**
  - [ ] Shows only B2 set
  - [ ] Other levels hidden
  - [ ] Count updates correctly

- [ ] **Filter by C1**
  - [ ] Shows only C1 set
  - [ ] Other levels hidden
  - [ ] Count updates correctly

- [ ] **Filter by C2**
  - [ ] Shows only C2 set
  - [ ] Other levels hidden
  - [ ] Count updates correctly

- [ ] **Clear Level Filter**
  - [ ] All sets visible again
  - [ ] "All levels" or similar indicator
  - [ ] Count resets

### 3.2 Theme Filtering (German & Hindi only)

- [ ] **Filter by Communication**
  - [ ] Shows only Communication theme set
  - [ ] Other themes hidden
  - [ ] Levels hidden (if level filter not applied)

- [ ] **Filter by Culture**
  - [ ] Shows only Culture theme set

- [ ] **Filter by Economics**
  - [ ] Shows only Economics theme set

- [ ] **Filter by Education**
  - [ ] Shows only Education theme set

- [ ] **Filter by General**
  - [ ] Shows only General theme set

- [ ] **Filter by Law**
  - [ ] Shows only Law theme set

- [ ] **Filter by Philosophy**
  - [ ] Shows only Philosophy theme set

- [ ] **Filter by Politics**
  - [ ] Shows only Politics theme set

- [ ] **Filter by Science**
  - [ ] Shows only Science theme set

- [ ] **Filter by Work**
  - [ ] Shows only Work theme set

- [ ] **Clear Theme Filter**
  - [ ] All sets visible again
  - [ ] Count resets

### 3.3 Combined Filtering (German & Hindi only)

- [ ] **Level + Theme Combined**
  - [ ] Select A1 level + Communication theme
  - [ ] Shows both A1 AND Communication sets
  - [ ] Other sets hidden
  - [ ] Can clear each filter independently
  - [ ] Can clear all filters at once

### 3.4 Sorting

- [ ] **Sort by Name (A-Z)**
  - [ ] Sets sorted alphabetically
  - [ ] A1-A2-B1-B2-C1-C2 order preserved

- [ ] **Sort by Name (Z-A)**
  - [ ] Sets sorted reverse alphabetically

- [ ] **Sort by Word Count (Low-High)**
  - [ ] Smallest sets first
  - [ ] Largest sets last
  - [ ] Count displayed correctly

- [ ] **Sort by Word Count (High-Low)**
  - [ ] Largest sets first
  - [ ] Smallest sets last

- [ ] **Sort by Level**
  - [ ] A1 → A2 → B1 → B2 → C1 → C2 order
  - [ ] Themes grouped separately or at end

- [ ] **Sort by Theme**
  - [ ] Themes in alphabetical order
  - [ ] Levels grouped separately or at end

### 3.5 Search/Text Filter

- [ ] **Search by Set Name**
  - [ ] Type "A1" → shows A1 set
  - [ ] Type "Communication" → shows Communication theme
  - [ ] Type "General" → shows General theme
  - [ ] Case-insensitive search
  - [ ] Partial matches work

- [ ] **Search by Description**
  - [ ] Type "beginner" → shows A1 and beginner sets
  - [ ] Type "culture" → shows Culture theme
  - [ ] Results update as typing

- [ ] **Clear Search**
  - [ ] Clear button removes filter
  - [ ] All sets visible again

---

## 4. Word Set Detail View Testing

### For EACH word set in EACH language pair:

#### 4.1 Opening Word Set

- [ ] **Click/Tap to Open**
  - [ ] Set opens in modal/new page
  - [ ] Loading indicator shows (if applicable)
  - [ ] Content loads successfully
  - [ ] No console errors

#### 4.2 Word Set Header

- [ ] **Title Display**
  - [ ] Set title visible and correct
  - [ ] Level badge/indicator (if applicable)
  - [ ] Theme badge/indicator (if applicable)

- [ ] **Meta Information**
  - [ ] Total word count displayed
  - [ ] Description visible
  - [ ] Source language shown
  - [ ] Target language shown

- [ ] **Actions**
  - [ ] "Import All" button visible
  - [ ] "Preview" option (if available)
  - [ ] Close/Back button works

#### 4.3 Words List in Set

- [ ] **Word Display**
  - [ ] All words visible (or paginated)
  - [ ] Source language word shown correctly
  - [ ] Target language translation shown correctly
  - [ ] Script renders correctly (Devanagari, Arabic, Chinese, etc.)
  - [ ] Font size readable

- [ ] **Word Formatting**
  - [ ] Proper spacing
  - [ ] No overlapping text
  - [ ] RTL languages (Arabic) display right-to-left
  - [ ] Special characters render correctly

- [ ] **Pagination/Scrolling**
  - [ ] If paginated: page controls work
  - [ ] If infinite scroll: loads more on scroll
  - [ ] Current page indicator visible
  - [ ] Can navigate to specific page

- [ ] **Individual Word Actions**
  - [ ] Can select individual words
  - [ ] Checkbox/toggle for each word
  - [ ] Select all option works
  - [ ] Deselect all option works

#### 4.4 Import Functionality

- [ ] **Import All Words**
  - [ ] Click "Import All" button
  - [ ] Confirmation dialog appears (if applicable)
  - [ ] Confirm import
  - [ ] Progress indicator shows
  - [ ] Success message displays
  - [ ] Count of imported words shown
  - [ ] Count of skipped words shown (if duplicates)

- [ ] **Import Selected Words**
  - [ ] Select 5 random words
  - [ ] Click "Import Selected"
  - [ ] Only selected words imported
  - [ ] Count matches selection

- [ ] **Import with Duplicates**
  - [ ] Import a set completely
  - [ ] Try importing same set again
  - [ ] All words skipped (0 imported)
  - [ ] Message: "X words skipped (already in vocabulary)"
  - [ ] No duplicate words in user vocabulary

- [ ] **Partial Import with Duplicates**
  - [ ] Import 10 words from a set
  - [ ] Import entire set
  - [ ] Only 10 new words imported (others skipped)
  - [ ] Correct count displayed

- [ ] **Cancel Import**
  - [ ] Start import
  - [ ] Click cancel (if applicable)
  - [ ] Import stops
  - [ ] Partial import handled correctly

---

## 5. User Vocabulary Testing

### 5.1 Viewing User Vocabulary

- [ ] **Vocabulary Page Access**
  - [ ] Navigate to "My Vocabulary" / "My Words"
  - [ ] Page loads successfully
  - [ ] Words display

- [ ] **Word Count**
  - [ ] Total word count displayed
  - [ ] Count updates after import
  - [ ] Count accurate

- [ ] **Word List Display**
  - [ ] Source language word shown
  - [ ] Target language translation shown
  - [ ] Script renders correctly
  - [ ] Words sorted logically (alphabetical, date added, etc.)

### 5.2 Filtering User Vocabulary

- [ ] **Filter by Level**
  - [ ] Can filter to show only A1 words
  - [ ] Can filter to show only A2 words
  - [ ] ... (all levels)
  - [ ] Filter updates count

- [ ] **Filter by Theme** (if implemented)
  - [ ] Can filter by theme
  - [ ] Shows words from that theme only

- [ ] **Search Words**
  - [ ] Search in source language
  - [ ] Search in target language
  - [ ] Case-insensitive
  - [ ] Partial matches work

### 5.3 Word Management

- [ ] **Delete Individual Word**
  - [ ] Click delete on a word
  - [ ] Confirmation dialog (if applicable)
  - [ ] Word removed from vocabulary
  - [ ] Count decrements
  - [ ] Can re-import same word later

- [ ] **Delete Multiple Words**
  - [ ] Select multiple words
  - [ ] Bulk delete option
  - [ ] All selected words removed
  - [ ] Count updates correctly

- [ ] **Edit Word** (if applicable)
  - [ ] Can edit translation
  - [ ] Can add notes
  - [ ] Changes save
  - [ ] Changes persist

---

## 6. Script & Internationalization Testing

### 6.1 Latin Scripts (English, German, French, Spanish, Italian, Portuguese)

- [ ] **Display**
  - [ ] All characters render correctly
  - [ ] Accents display: é, ñ, ö, ü, à, ç, etc.
  - [ ] No character encoding issues
  - [ ] Font appropriate and readable

- [ ] **Input/Search**
  - [ ] Can type accented characters
  - [ ] Search works with accents
  - [ ] Case-insensitive with accents

### 6.2 Cyrillic Script (Russian)

- [ ] **Display**
  - [ ] Cyrillic characters render: а, б, в, г, д, е, ё, ж, з, и, й, к, л, м, н, о, п, р, с, т, у, ф, х, ц, ч, ш, щ, ъ, ы, ь, э, ю, я
  - [ ] Font appropriate for Cyrillic
  - [ ] No mojibake (garbled text)

- [ ] **UI Interface**
  - [ ] Russian UI elements display correctly (if UI is in Russian)
  - [ ] Button text readable
  - [ ] Menu items clear

### 6.3 Arabic Script (Arabic)

- [ ] **Display**
  - [ ] Arabic characters render correctly
  - [ ] Text displays RIGHT-TO-LEFT
  - [ ] Letter forms connect properly (initial, medial, final, isolated)
  - [ ] Diacritics display (if used)

- [ ] **UI Layout**
  - [ ] RTL layout applied
  - [ ] Buttons/controls mirrored appropriately
  - [ ] Alignment correct (text-align: right)
  - [ ] No overlap with LTR elements

### 6.4 Devanagari Script (Hindi)

- [ ] **Display**
  - [ ] Devanagari characters render: क, ख, ग, घ, च, छ, ज, झ, etc.
  - [ ] Vowel diacritics display correctly: का, कि, की, कु, कू, के, कै, को, कौ
  - [ ] Conjunct consonants render: क्ष, त्र, ज्ञ, श्र
  - [ ] No broken/missing glyphs

- [ ] **Font**
  - [ ] Font supports all Devanagari glyphs
  - [ ] Font size appropriate
  - [ ] Line height adequate for diacritics

### 6.5 Chinese Characters (Simplified Chinese)

- [ ] **Display**
  - [ ] Chinese characters render correctly
  - [ ] No missing glyphs (□ boxes)
  - [ ] Font appropriate (明體, 宋體, or appropriate sans-serif)
  - [ ] Character spacing adequate

- [ ] **Pinyin** (if displayed)
  - [ ] Pinyin tone marks display: ā, á, ǎ, à
  - [ ] Pinyin readable

### 6.6 Japanese Script (Hiragana, Katakana, Kanji)

- [ ] **Display**
  - [ ] Hiragana renders: あ, い, う, え, お, か, き, く, け, こ...
  - [ ] Katakana renders: ア, イ, ウ, エ, オ, カ, キ, ク, ケ, コ...
  - [ ] Kanji renders correctly
  - [ ] No missing glyphs

- [ ] **Furigana** (if displayed)
  - [ ] Ruby text displays above kanji
  - [ ] Font size appropriate for furigana

### 6.7 Turkish

- [ ] **Display**
  - [ ] Special Turkish characters render: ı, ğ, ü, ş, ö, ç, İ, Ğ, Ü, Ş, Ö, Ç
  - [ ] Case conversion correct (i ↔ İ, I ↔ ı)

---

## 7. Responsive Design Testing

### 7.1 Desktop (1920x1080)

- [ ] **Layout**
  - [ ] Word sets display in grid (2-4 columns)
  - [ ] All elements visible without scrolling (header area)
  - [ ] Sidebar/navigation accessible
  - [ ] No horizontal scroll

- [ ] **Interactions**
  - [ ] Hover effects work
  - [ ] Click interactions responsive
  - [ ] Tooltips display correctly

### 7.2 Laptop (1366x768)

- [ ] **Layout**
  - [ ] Word sets grid adjusts (2-3 columns)
  - [ ] Content readable
  - [ ] No overflow issues

### 7.3 Tablet (768x1024)

- [ ] **Layout**
  - [ ] Word sets in 2 columns or list view
  - [ ] Touch targets large enough (min 44x44px)
  - [ ] Navigation accessible (hamburger menu if needed)

- [ ] **Interactions**
  - [ ] Tap to select works
  - [ ] Swipe gestures work (if implemented)
  - [ ] No accidental clicks

### 7.4 Mobile (375x667 - iPhone SE)

- [ ] **Layout**
  - [ ] Word sets in single column list
  - [ ] All content readable without zoom
  - [ ] Buttons/inputs large enough for fingers
  - [ ] No horizontal scroll

- [ ] **Navigation**
  - [ ] Mobile menu works
  - [ ] Can access all features
  - [ ] Back button works

- [ ] **Performance**
  - [ ] Page loads quickly
  - [ ] Smooth scrolling
  - [ ] No lag during interactions

### 7.5 Mobile Landscape

- [ ] **Layout**
  - [ ] Adapts to landscape orientation
  - [ ] Content still readable
  - [ ] Navigation accessible

---

## 8. Performance Testing

### 8.1 Load Times

- [ ] **Initial Page Load**
  - [ ] Login page loads < 2 seconds
  - [ ] Dashboard loads < 3 seconds
  - [ ] Word sets page loads < 3 seconds

- [ ] **Word Set Detail Load**
  - [ ] Small set (< 100 words) loads < 1 second
  - [ ] Medium set (100-1000 words) loads < 2 seconds
  - [ ] Large set (1000-3000 words) loads < 3 seconds

### 8.2 Interaction Performance

- [ ] **Filtering**
  - [ ] Filter results appear instantly (< 100ms)
  - [ ] No lag when typing in search
  - [ ] Multiple filters apply smoothly

- [ ] **Sorting**
  - [ ] Sort completes instantly
  - [ ] No visible delay
  - [ ] UI remains responsive

- [ ] **Import**
  - [ ] Small sets (< 100 words) import < 2 seconds
  - [ ] Large sets (2000+ words) show progress
  - [ ] UI doesn't freeze during import

### 8.3 Memory & Resources

- [ ] **Memory Usage**
  - [ ] No memory leaks after repeated navigation
  - [ ] Browser tab uses reasonable RAM (< 500MB)

- [ ] **Network**
  - [ ] API calls optimized (no redundant requests)
  - [ ] Data cached appropriately
  - [ ] Works on slow connection (3G simulation)

---

## 9. Edge Cases & Error Handling

### 9.1 Empty States

- [ ] **No Word Sets** (`test_ru_en`, `test_ru_de`)
  - [ ] Friendly empty state message
  - [ ] Suggestion to check back later / contact support
  - [ ] No broken UI

- [ ] **Empty User Vocabulary**
  - [ ] Message: "No words in vocabulary yet"
  - [ ] Call-to-action to import words
  - [ ] UI not broken

### 9.2 Very Large Sets

- [ ] **German General Theme (2,999 words)**
  - [ ] Set opens without crashing
  - [ ] Pagination or virtual scrolling works
  - [ ] Performance acceptable
  - [ ] Import completes successfully

### 9.3 Network Issues

- [ ] **Slow Connection**
  - [ ] Loading indicators show
  - [ ] Timeouts handled gracefully
  - [ ] User notified of slow connection

- [ ] **Offline**
  - [ ] Error message displayed
  - [ ] Option to retry
  - [ ] No crash

- [ ] **Connection Lost During Import**
  - [ ] Import fails gracefully
  - [ ] Partial import handled correctly
  - [ ] User can retry

### 9.4 API Errors

- [ ] **500 Server Error**
  - [ ] User-friendly error message
  - [ ] Option to retry
  - [ ] Error logged for debugging

- [ ] **401 Unauthorized**
  - [ ] Redirects to login
  - [ ] Session restored after re-login

- [ ] **404 Not Found**
  - [ ] Appropriate message
  - [ ] Navigation back to safe page

### 9.5 Data Validation

- [ ] **Invalid Language Pair**
  - [ ] Cannot access non-existent pair
  - [ ] Redirects to valid state

- [ ] **Malformed Data**
  - [ ] App doesn't crash
  - [ ] Error message shown
  - [ ] User can continue using app

---

## 10. Browser Compatibility Testing

### 10.1 Desktop Browsers

- [ ] **Chrome (Latest)**
  - [ ] All features work
  - [ ] UI renders correctly
  - [ ] No console errors

- [ ] **Firefox (Latest)**
  - [ ] All features work
  - [ ] UI renders correctly
  - [ ] No console errors

- [ ] **Safari (Latest - macOS)**
  - [ ] All features work
  - [ ] UI renders correctly
  - [ ] No console errors

- [ ] **Edge (Latest)**
  - [ ] All features work
  - [ ] UI renders correctly
  - [ ] No console errors

### 10.2 Mobile Browsers

- [ ] **Chrome Mobile (Android)**
  - [ ] All features work
  - [ ] Touch interactions smooth
  - [ ] UI responsive

- [ ] **Safari Mobile (iOS)**
  - [ ] All features work
  - [ ] Touch interactions smooth
  - [ ] UI responsive

- [ ] **Firefox Mobile**
  - [ ] All features work
  - [ ] UI renders correctly

---

## 11. Accessibility Testing

### 11.1 Keyboard Navigation

- [ ] **Tab Navigation**
  - [ ] Can tab through all interactive elements
  - [ ] Focus indicator visible
  - [ ] Logical tab order

- [ ] **Keyboard Shortcuts**
  - [ ] Enter to select/open
  - [ ] Escape to close modals
  - [ ] Arrow keys for navigation (if applicable)

### 11.2 Screen Reader Support

- [ ] **ARIA Labels**
  - [ ] Buttons have descriptive labels
  - [ ] Form inputs have labels
  - [ ] Icons have alt text or aria-label

- [ ] **Semantic HTML**
  - [ ] Headings hierarchical (h1, h2, h3...)
  - [ ] Lists use <ul>/<ol>
  - [ ] Buttons are <button>, links are <a>

### 11.3 Visual Accessibility

- [ ] **Color Contrast**
  - [ ] Text meets WCAG AA standards (4.5:1 for normal text)
  - [ ] Interactive elements distinguishable

- [ ] **Font Size**
  - [ ] Minimum 16px for body text
  - [ ] Can zoom to 200% without breaking layout

- [ ] **Focus States**
  - [ ] Visible focus indicators
  - [ ] Not relying on color alone

---

## 12. Security Testing

### 12.1 Authentication

- [ ] **Session Management**
  - [ ] Cannot access other users' data
  - [ ] Session expires after timeout
  - [ ] Cannot replay old session tokens

- [ ] **Password Security**
  - [ ] Password not visible in URL
  - [ ] Password not stored in localStorage
  - [ ] HTTPS used for login (production)

### 12.2 Data Protection

- [ ] **XSS Prevention**
  - [ ] User input sanitized
  - [ ] No script injection in word translations
  - [ ] HTML entities escaped

- [ ] **CSRF Protection**
  - [ ] POST requests protected
  - [ ] Token validation works

### 12.3 API Security

- [ ] **Authorization**
  - [ ] Cannot import words to another user's vocabulary
  - [ ] Cannot access other users' word sets (if private)
  - [ ] API endpoints validate user permissions

---

## 13. Specific Language Pair Combinations Testing

### 13.1 German → All Targets (10 pairs)

Test `test_de_en`, `test_de_ru`, `test_de_es`, `test_de_fr`, `test_de_it`, `test_de_pt`, `test_de_ar`, `test_de_zh`, `test_de_ja`, `test_de_tr`

- [ ] **All 17 Word Sets Visible**
  - [ ] 6 level sets (A1-C2)
  - [ ] 1 beginner set
  - [ ] 10 thematic sets

- [ ] **Translations Accurate**
  - [ ] Spot-check 10 random words per target language
  - [ ] Translations make sense
  - [ ] No obvious errors

- [ ] **Theme Organization**
  - [ ] Can browse all 10 themes
  - [ ] Theme descriptions clear
  - [ ] Word counts reasonable

### 13.2 English → All Targets (10 pairs)

Test `test_en_ru`, `test_en_de`, `test_en_es`, `test_en_fr`, `test_en_it`, `test_en_pt`, `test_en_ar`, `test_en_zh`, `test_en_ja`, `test_en_tr`

- [ ] **6 Level Sets Only**
  - [ ] No thematic organization
  - [ ] Only A1-C2 levels
  - [ ] No "beginner" level

- [ ] **Translations Accurate**
  - [ ] Spot-check translations for each target

### 13.3 Hindi → Targets (2 pairs)

Test `test_hi_en`, `test_hi_de`

- [ ] **16 Word Sets Visible**
  - [ ] 6 level sets (A1-C2)
  - [ ] 10 thematic sets
  - [ ] No "beginner" level

- [ ] **Devanagari Script**
  - [ ] All Hindi words render correctly
  - [ ] No broken characters
  - [ ] Font readable

- [ ] **Theme Organization**
  - [ ] All 10 themes accessible
  - [ ] Word counts match:
    - [ ] Communication: 99
    - [ ] Culture: 999
    - [ ] Economics: 599
    - [ ] Education: 1,499
    - [ ] General: 2,999
    - [ ] Law: 499
    - [ ] Philosophy: 299
    - [ ] Politics: 999
    - [ ] Science: 1,199
    - [ ] Work: 799

### 13.4 Other Source Languages → Targets

Test remaining pairs with 6 level sets each:

Spanish: `test_es_en`, `test_es_de`, `test_es_fr`, `test_es_pt`
French: `test_fr_en`, `test_fr_de`, `test_fr_es`
Italian: `test_it_en`, `test_it_de`
Portuguese: `test_pt_en`, `test_pt_de`
Arabic: `test_ar_en`, `test_ar_de`
Chinese: `test_zh_en`, `test_zh_de`

- [ ] **6 Level Sets Only**
- [ ] **Correct Word Counts**
- [ ] **Script Rendering** (Arabic RTL, Chinese characters)
- [ ] **Translations Accurate**

### 13.5 Russian → Targets (EMPTY SETS)

Test `test_ru_en`, `test_ru_de`

- [ ] **Empty State**
  - [ ] No word sets available
  - [ ] Friendly message displayed
  - [ ] UI not broken
  - [ ] No error in console

---

## 14. Full User Journey Testing

### Journey 1: New User - German Learner (test_de_en)

- [ ] Login with `test_de_en` / `test123`
- [ ] See 17 word sets
- [ ] Filter to show only A1 level
- [ ] Open A1 word set (1,000 words)
- [ ] Import all 1,000 words
- [ ] Verify 1,000 words in vocabulary
- [ ] Go to "Communication" theme
- [ ] Import Communication theme (222 words)
- [ ] Verify some words skipped (already imported from A1)
- [ ] Total vocabulary increases correctly
- [ ] Search vocabulary for specific word
- [ ] Delete one word
- [ ] Re-import same word from set
- [ ] Logout

### Journey 2: Hindi Learner (test_hi_en)

- [ ] Login with `test_hi_en` / `test123`
- [ ] See 16 word sets (6 levels + 10 themes)
- [ ] Open "General" theme (2,999 words)
- [ ] Verify Devanagari script renders
- [ ] Import all General theme words
- [ ] Verify 2,999 words imported
- [ ] Open A1 level
- [ ] Import A1 (1,000 words)
- [ ] Verify overlap: some skipped, total < 2999 + 1000
- [ ] Browse vocabulary
- [ ] Filter by theme (if possible)
- [ ] Logout

### Journey 3: Multi-level Import (test_en_de)

- [ ] Login with `test_en_de` / `test123`
- [ ] Import A1 completely
- [ ] Import A2 completely
- [ ] Import B1 completely
- [ ] Verify total words = sum of A1+A2+B1
- [ ] Try importing A1 again
- [ ] Verify 0 new words imported (all skipped)
- [ ] Logout

### Journey 4: Mobile User (test_de_es)

- [ ] Open app on mobile device (or DevTools mobile view)
- [ ] Login with `test_de_es` / `test123`
- [ ] Navigate using touch
- [ ] Open word set
- [ ] Scroll through words
- [ ] Select individual words
- [ ] Import selected words
- [ ] Verify import successful
- [ ] Check vocabulary on mobile
- [ ] Logout

### Journey 5: RTL Language (test_ar_en)

- [ ] Login with `test_ar_en` / `test123`
- [ ] Verify Arabic text displays RTL
- [ ] Open A1 word set
- [ ] Verify Arabic words align right
- [ ] English translations align left
- [ ] Import words
- [ ] Check vocabulary
- [ ] Arabic words still RTL in vocabulary
- [ ] Logout

---

## 15. Regression Testing Checklist

After any code changes, verify:

- [ ] **Login still works** for all 39 users
- [ ] **Word sets load** for users with sets
- [ ] **Empty state** works for users without sets
- [ ] **Import functionality** works (test with one user per source language)
- [ ] **Deduplication** still prevents duplicates
- [ ] **Filtering** works (level and theme)
- [ ] **Responsive design** not broken (mobile + desktop)
- [ ] **No new console errors**

---

## 16. Test Execution Tracking

### Priority Test Passes

#### Pass 1: Critical Features (Must Pass Before Release)
- [ ] Authentication works for all users
- [ ] Word sets display for users with sets
- [ ] Import basic functionality works
- [ ] Deduplication prevents duplicates
- [ ] No app-breaking bugs

#### Pass 2: Core Features
- [ ] All filtering works
- [ ] All sorting works
- [ ] Responsive design verified
- [ ] Script rendering (Arabic, Hindi, Chinese) works
- [ ] Performance acceptable

#### Pass 3: Edge Cases & Polish
- [ ] All edge cases handled
- [ ] Error states graceful
- [ ] Accessibility baseline met
- [ ] Browser compatibility verified

---

## Summary Statistics

- **Total Test Users:** 39
- **Users with Word Sets:** 37
- **Users without Word Sets:** 2
- **Unique Source Languages:** 16
- **Total Word Sets Across All Pairs:** ~230 (approximate)
- **Estimated Total Test Cases:** 2,000+
- **Estimated Full Test Duration:** 40-80 hours (with automation: 4-8 hours)

---

## Quick Test Commands

```bash
# Verify all test users exist
node scripts/verify-word-sets-coverage.js

# Check Hindi word sets specifically
node test-hindi-word-sets.js

# Create test users if needed
node scripts/create-test-users.js

# Check database word sets
psql $DATABASE_URL -c "SELECT source_language, COUNT(*) as sets, SUM(word_count) as total_words FROM word_sets GROUP BY source_language ORDER BY source_language;"
```

---

## Notes for Testers

1. **Use test accounts only** - Never test with real user accounts
2. **Document bugs** - Screenshot + steps to reproduce
3. **Test on real devices** - Not just browser DevTools
4. **Test at different times** - Server performance may vary
5. **Clear cache between tests** - Avoid cached data affecting results
6. **Use different browsers** - Don't assume all browsers behave the same

---

**Testing Prepared:** December 30, 2025
**Test Data Version:** v1.0
**Last Updated:** December 30, 2025
