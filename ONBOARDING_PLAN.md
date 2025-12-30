# Onboarding Flow Plan

## 🎯 Goal
Create smooth onboarding experience for new users with language selection and word set import.

## 📋 Onboarding Steps

### Step 1: Welcome Screen
- **Content**: "Welcome to LexyBooster!"
- **Description**: Brief intro about the app
- **Action**: "Get Started" button

### Step 2: Interface Language Selection
- **Title**: "Choose your interface language"
- **Auto-detection**:
  - Detect browser language (`navigator.language`)
  - Detect country from IP (optional, using free API)
  - Pre-select detected language
- **Languages**: Russian, English, German, Spanish, French, etc.
- **Display**: Flag + Language name (in that language)
- **Action**: "Continue" button

### Step 3: Native Language Selection
- **Title**: "What's your native language?" / "Какой ваш родной язык?"
- **Pre-select**: Same as interface language (but can change)
- **Languages**: All 18 supported languages
- **Display**: Flag + Language name
- **Action**: "Continue" button

### Step 4: Learning Language Selection
- **Title**: "Which language do you want to learn?"
- **Filter out**: Native language (can't learn same language)
- **Languages**: Remaining 17 languages
- **Display**: Flag + Language name + "Beginner" / "Intermediate" / "Advanced" tags
- **Action**: "Continue" button

### Step 5: Word Sets Selection
- **Title**: "Choose your starting vocabulary"
- **Description**: "Select word sets to begin learning"
- **Display**:
  - List of available word sets for selected language pair
  - Show: Title, description, word count, level (A1, A2, B1, etc.)
  - Checkboxes for each set
  - "Select All" / "Deselect All" buttons
- **Example sets**:
  - ✅ "Basic Vocabulary (A1)" - 500 words
  - ✅ "Everyday Phrases (A1-A2)" - 300 words
  - ⬜ "Travel & Tourism (A2)" - 250 words
  - ⬜ "Business German (B1)" - 400 words
- **Default**: Pre-select A1 basic sets
- **Action**: "Start Learning" button

### Step 6: Success Screen
- **Content**: "You're all set!"
- **Summary**:
  - Interface language: 🇷🇺 Russian
  - Learning: 🇩🇪 German → 🇷🇺 Russian
  - Words added: 800 words from 2 sets
- **Action**: "Go to Dashboard" button

## 🎨 UI Design

### Colors & Style
- Clean, modern design
- Use flag emojis for visual appeal
- Progress indicator (1/6, 2/6, etc.) at top
- "Back" button on each step (except first)

### Responsive
- Mobile-first design
- Works on all screen sizes
- Touch-friendly buttons

## 💾 Technical Implementation

### Data Flow

1. **Step 2** → Save `ui_language` to localStorage
2. **Step 3** → Save `native_language`
3. **Step 4** → Save `learning_language`
4. **Step 5** → Call API to import selected word sets
5. **Step 6** → Redirect to dashboard

### API Endpoints Needed

```javascript
// Get available word sets for language pair
GET /api/word-sets?sourceLang=german&targetLang=russian

Response:
[
  {
    id: 1,
    title: "Basic Vocabulary (A1)",
    description: "Essential words for beginners",
    word_count: 500,
    level: "A1",
    is_public: true
  },
  ...
]

// Import word sets to user's vocabulary
POST /api/onboarding/import-word-sets
Body: {
  userId: 123,
  languagePairId: 45,
  wordSetIds: [1, 2, 3]
}

Response: {
  success: true,
  words_added: 800,
  message: "Word sets imported successfully"
}
```

### Word Sets Creation

Need to create public word sets in database:
- German A1 Basic (500 words)
- German A1 Phrases (300 words)
- German A2 Intermediate (400 words)
- etc. for all 18 languages

## 📱 Skip Onboarding

- Allow users to skip and use defaults
- Defaults:
  - UI Language: Browser language or English
  - Native: English
  - Learning: German
  - Word Sets: Basic A1 set (500 words)

## 🔄 Re-run Onboarding

- Settings → "Change Learning Language"
- Can add more word sets anytime
- Can switch language pairs

---

**Status**: Ready for implementation
**Priority**: CRITICAL (blocks new user registration)
**ETA**: ~2-3 hours implementation
