# 👤 Account Setup Instructions

## 🚀 Quick Account Initialization

To create the Nalivator3000 account with pre-loaded vocabulary:

### Option 1: Auto-Initialization (Easiest)
1. Visit: `https://your-app-url.railway.app/?init=true`
2. Wait for the initialization to complete
3. Account will be created automatically with 37 German words

### Option 2: Manual Console Setup
1. Open browser Developer Console (F12)
2. Run: `initializeAccount()`
3. Wait for completion message

### Option 3: Step-by-Step Manual
1. Register normally with:
   - **Name**: Nalivator3000
   - **Email**: nalivator3000@gmail.com
   - **Password**: 1
2. Open console and run: `importWordList()`

## 📊 Account Details

**User Credentials:**
- Name: Nalivator3000
- Email: nalivator3000@gmail.com
- Password: 1

**Vocabulary Included:**
- 37 German-Russian word pairs
- Categories: Basic, Family, Daily Activities, Time/Weather, Numbers/Colors, Transportation, Technology
- Examples: "Hallo" → "Привет", "Familie" → "Семья", etc.

**Language Pair:**
- From: German
- To: Russian
- Interface: Russian

## 🎮 Features Available

Once setup is complete, the account will have:
- ✅ Full vocabulary imported and ready for learning
- ✅ All learning modes available (Multiple Choice, Typing, Word Building, Survival Mode)
- ✅ Spaced repetition system activated
- ✅ Statistics and progress tracking
- ✅ Export/Import capabilities

## 🔧 Troubleshooting

**If initialization fails:**
1. Open browser console (F12)
2. Check for error messages
3. Try manual steps:
   ```javascript
   // Clear any existing data
   localStorage.clear();
   
   // Run initialization
   await initializeAccount();
   ```

**If account already exists:**
- Just login with the credentials above
- To reimport words: run `importWordList()` in console

---

**Note**: The initialization script is included in the app and will automatically create the account with all vocabulary when requested.