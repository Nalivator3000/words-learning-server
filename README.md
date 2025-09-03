# 🎓 Advanced Language Learning App

A powerful web application for learning foreign languages through interactive quizzes, spaced repetition, and gamification.

## ✨ Features

### 🔐 User Management
- **Multi-user support** with login/password and Google authentication
- **Language pair management** - create and switch between different language combinations
- **User-specific progress** tracking and statistics

### 🎮 Learning Modes
- **Multiple Choice** - Choose correct translation from options
- **Reverse Multiple Choice** - Translate from foreign to native language
- **Word Building** - Construct words from letter tiles
- **Typing Mode** - Type translations manually
- **Survival Mode** ⚡ - Fast-paced game with 5-second timer and 3-life system
- **Complex Mode** - Mix of all question types

### 🧠 Smart Learning System
- **Spaced Repetition** with 7-day and 30-day review intervals
- **Intelligent word progression** - studying → 7-day review → 30-day review → learned
- **Progress tracking** with correct/incorrect counters
- **Adaptive difficulty** based on performance

### 🌍 Multi-language Support
- **Interface localization** - Russian, English, German support
- **Language-aware audio** with automatic voice selection
- **Smart language detection** for proper audio playback
- **Customizable language pairs** (German-Russian, English-Russian, etc.)

### ⚡ Enhanced UX
- **Keyboard shortcuts** - 1-4 keys for quick answers, arrow keys for navigation
- **Audio pronunciation** with intelligent language detection
- **Responsive design** optimized for desktop and mobile
- **Dark theme survival mode** with stunning animations
- **Real-time statistics** and progress visualization

### 📊 Data Management
- **CSV import/export** with comprehensive data fields
- **Google Sheets integration** for easy vocabulary management
- **Cloud synchronization** with online server
- **Multi-format export** (CSV, JSON) with detailed statistics

## 🚀 Quick Start

### Option 1: Local Usage
1. Download all files to a folder
2. Open `index.html` in a modern web browser
3. Register/login and start learning!

### Option 2: Deploy to Web Server
1. Upload all files to your web hosting
2. Access via your domain
3. Enjoy full functionality with cloud sync

## 📁 File Structure

```
├── index.html              # Main application page
├── app.js                  # Core application logic
├── database.js             # IndexedDB storage management
├── user-manager.js         # User authentication & management
├── language-manager.js     # Localization & language detection
├── survival-mode.js        # Survival game mode logic
├── quiz.js                 # Quiz generation & management
├── style.css              # Modern CSS styles & animations
├── test-words.csv         # Sample vocabulary for testing
└── quick-test.js          # Development testing utilities
```

## 🎯 Survival Mode

Experience the thrilling **Survival Mode**:
- ⏱️ **5 seconds per question** with animated countdown
- ❤️ **3 lives system** - game over after 3 mistakes
- 🎯 **Fast-paced gameplay** - choose between 2 options
- ⌨️ **Lightning controls** - arrow keys for instant answers
- 🏆 **Score tracking** with accuracy percentage

### Controls:
- `←` `→` or `↑` `↓` - Select and confirm answer instantly
- `1` `2` - Quick answer selection
- `Enter` or `Space` - Confirm highlighted choice

## 📝 CSV Import Format

```csv
Слово,Пример,Перевод,Перевод примера
"das Haus","Ich wohne in einem großen Haus","дом","Я живу в большом доме"
"der Hund","Der Hund ist sehr freundlich","собака","Собака очень дружелюбная"
```

## 🌐 Language Pairs

Currently supported combinations:
- 🇩🇪 German ↔ 🇷🇺 Russian
- 🇺🇸 English ↔ 🇷🇺 Russian
- 🇪🇸 Spanish ↔ 🇷🇺 Russian
- 🇫🇷 French ↔ 🇷🇺 Russian
- 🇮🇹 Italian ↔ 🇷🇺 Russian

*Easy to extend for any language pair!*

## 🔧 Advanced Features

- **User Data Separation** - Each language pair maintains separate vocabulary
- **Progress Analytics** - Detailed statistics per user and language pair
- **Cloud Sync** - Backup and restore across devices
- **Smart Audio** - Automatic language detection for TTS
- **Keyboard Optimization** - Full keyboard navigation support

## 💻 Browser Compatibility

- ✅ Chrome 90+ (recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔗 API Integration

Sync with online version: `https://words-learning-server-production.up.railway.app`

## 📱 Mobile Friendly

Fully responsive design optimized for:
- 📱 Smartphones (iOS/Android)
- 📟 Tablets
- 💻 Desktop computers

## 🎨 Technologies

- **Frontend**: Vanilla JavaScript ES6+, CSS3 Grid/Flexbox
- **Storage**: IndexedDB with advanced querying
- **Audio**: Web Speech API with multi-language support
- **Authentication**: Local storage + Google OAuth ready
- **Animations**: CSS3 transitions and keyframe animations

---

**Start your language learning journey today!** 🚀