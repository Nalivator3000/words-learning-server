# 🎓 Advanced Language Learning App v2.0

Modern, feature-rich language learning application with multi-user support, spaced repetition, and gamification.

## 🌟 Features

### 🎮 **Survival Mode**
- Fast-paced game mode with 5-second countdown timer
- 3-lives system with immersive dark theme
- Arrow key navigation for instant responses
- Real-time scoring and accuracy tracking

### 👥 **Multi-User System**
- Secure authentication (login/password + Google OAuth demo)
- Individual progress tracking per user
- Language pair management with interface localization

### 📈 **Advanced Learning System**
- Fixed spaced repetition algorithm (7-day and 30-day intervals)
- Multiple quiz modes: Multiple choice, Typing, Word building
- Smart progress tracking: studying → review_7 → review_30 → learned

### 🌐 **Multi-Language Support**
- **Interface languages**: Russian, English, German
- **Learning pairs**: German-Russian, English-Russian, Spanish-Russian, French-Russian, Italian-Russian
- Automatic TTS with language detection
- Smart audio buttons only for foreign language text

### ⌨️ **Enhanced Controls**
- Keyboard shortcuts: 1-4 keys for quick option selection
- Arrow keys for navigation without Enter confirmation
- Comprehensive keyboard navigation throughout the app

### 🎨 **Modern UI/UX**
- Responsive design for desktop and mobile
- Dark themes with glass morphism effects
- Smooth animations and transitions
- Touch-optimized controls

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start server
npm start

# Open browser at http://localhost:3000
```

### Railway Deployment
1. Fork this repository
2. Connect to Railway
3. Deploy with default settings
4. Environment automatically configured

## 📁 Project Structure

```
words-learning-unified/
├── server.js              # Node.js server
├── package.json           # Dependencies
├── railway.json           # Railway config
├── public/                # Client-side files
│   ├── index.html         # Main app
│   ├── app.js             # Core application logic
│   ├── database.js        # IndexedDB management
│   ├── user-manager.js    # User authentication
│   ├── language-manager.js # Localization system
│   ├── survival-mode.js   # Game mode
│   ├── style.css          # Styling
│   └── test-words.csv     # Sample vocabulary
└── README.md
```

## 🎯 Learning Modes

1. **Multiple Choice**: Select correct translation from 4 options
2. **Reverse Multiple Choice**: Translate from native to foreign language  
3. **Typing**: Type the correct translation
4. **Word Building**: Construct words from letter tiles
5. **Survival Mode**: Fast-paced 2-choice questions with timer
6. **Complex Mode**: Mixed question types for advanced learners

## 🔧 Configuration

- **Lesson Size**: 5-50 words per session (configurable per user)
- **Language Pairs**: Create custom learning combinations
- **Audio Settings**: Automatic language detection and voice selection
- **UI Language**: Switch between Russian, English, German

## 💾 Data Management

- **Import**: CSV files and Google Sheets integration
- **Export**: Progress data in CSV/JSON formats
- **Sync**: Cloud synchronization with server
- **Backup**: Automatic local storage with IndexedDB

## 🎨 Themes

- **Light Theme**: Clean, minimalist design
- **Dark Theme**: Eye-friendly for extended study sessions
- **Survival Theme**: Immersive dark gaming environment

## 📊 Statistics

- Word counts by status (studying, review, learned)
- Accuracy percentages and progress tracking
- Time-based review scheduling
- User-specific analytics per language pair

## 🔐 Security

- Client-side password hashing
- Session management
- User data isolation
- Secure local storage

## 🌍 Supported Languages

**Interface**: Russian (ru), English (en), German (de)
**Learning**: German, English, Spanish, French, Italian, Russian

## 📱 Mobile Support

- Fully responsive design
- Touch-optimized controls  
- Portrait and landscape modes
- Progressive Web App ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use and modify

## 🎯 Roadmap

- [ ] Progressive Web App (PWA) support
- [ ] Voice recognition for pronunciation
- [ ] Social features and leaderboards
- [ ] Advanced analytics dashboard
- [ ] Offline mode support
- [ ] Custom theme creator

---

**Current Version**: 2.0.0  
**Compatibility**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+  
**Size**: ~200KB (uncompressed)

🤖 *Generated with [Claude Code](https://claude.ai/code)*