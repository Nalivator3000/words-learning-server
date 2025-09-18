# Claude Code Project Configuration

## Project Overview
**Words Learning App (Memprizator)** - Advanced language learning application with multiple study modes, survival challenges, and responsive mobile design.

## Common Commands

### Testing & Development
```bash
# Start server
npm run dev

# Start legacy server  
npm run start-legacy

# Run telegram bot
npm run bot
```

### Built-in Testing Commands (Browser Console)
```javascript
// Responsive Design Testing
quickResponsiveTest()           // Test popular devices
mobileResponsiveTest()          // Test mobile devices only
runResponsiveTest()             // Full test all devices
showResponsiveReport()          // Display test results

// UI Testing
runUITest()                     // Automated UI testing
getBuildTestReport()            // Get test report
quickHealthCheck()              // Quick system check

// Build Testing  
runBuildTest()                  // Full build validation
```

### URL Parameters for Automated Testing
- `?buildtest=true` - Automatic build testing on page load
- `?autotest=true` - Automatic UI testing on page load
- `?responsive=true` - Automatic responsive testing

## Project Structure
```
├── index.html              # Main application entry
├── style.css              # Main stylesheet with mobile optimizations
├── app.js                 # Main application logic
├── server-postgres.js     # PostgreSQL server (primary)
├── server-full.js         # Legacy server with local DB
├── responsive-tester.js   # Built-in responsive testing
├── auto-ui-tester.js      # Automated UI testing
├── build-tester.js        # Build validation testing
└── survival-mode.js       # Survival mode implementation
```

## Mobile Optimizations
- **Breakpoints**: 768px (tablet), 375px (small mobile)
- **Touch targets**: Minimum 44px for accessibility
- **Removed elements**: Build info, user email on mobile
- **Touch improvements**: Active states, no hover on touch devices
- **Full-screen exercise mode** for mobile learning

## Key Features
1. **Multiple Study Modes**: Multiple choice, word building, typing, survival mode
2. **Responsive Design**: Optimized for mobile, tablet, desktop
3. **Built-in Testing**: Comprehensive testing suite for UI and responsive design
4. **Image Support**: Automatic image fetching for vocabulary
5. **Progress Tracking**: Spaced repetition algorithm
6. **Emergency Login**: root/root for quick access

## Development Notes
- Uses PostgreSQL for production, IndexedDB for local development
- Mobile-first responsive design approach  
- Comprehensive testing suite built-in
- Touch-optimized interface for mobile learning

## Recent Changes
- ✅ Optimized mobile design - removed unnecessary elements
- ✅ Improved touch interface with proper active states  
- ✅ Added extra small screen support (iPhone SE)
- ✅ Enhanced mobile exercise interfaces
- ✅ Integrated comprehensive testing suite