# Testing Checklist for New Features

## Daily Challenges UI Testing

### Desktop Testing
- [ ] Navigate to Daily Challenges section via nav button
- [ ] Verify challenges load correctly from API
- [ ] Check challenge cards display:
  - [ ] Title and description
  - [ ] Difficulty badge (Easy/Medium/Hard) with correct colors
  - [ ] Progress bar shows correct percentage
  - [ ] Current progress vs target value
  - [ ] Reward display (coins and XP)
- [ ] Test claiming reward:
  - [ ] "Claim Reward" button appears when challenge completed
  - [ ] Click claim button
  - [ ] Verify success toast appears
  - [ ] Check gamification header updates with new coins/XP
  - [ ] Verify button changes to "Completed!" badge
- [ ] Check challenges stats section updates correctly
- [ ] Verify dark mode styling works correctly

### Mobile Testing
- [ ] All challenge cards are responsive and readable
- [ ] Touch targets are large enough
- [ ] No horizontal scrolling
- [ ] Cards stack properly in single column
- [ ] Claim buttons are easily tappable

### API Integration
- [ ] `/api/challenges/daily/:userId` returns valid data
- [ ] `/api/challenges/claim-reward/:challengeId` works correctly
- [ ] Error handling displays appropriate messages
- [ ] Loading spinner shows during data fetch

### Translation
- [ ] All text uses i18n keys
- [ ] English translations display correctly
- [ ] Russian translations display correctly
- [ ] No keys showing as [key_name]

---

## Streak Freeze UI Testing

### Desktop Testing
- [ ] Navigate to Streak Freeze section
- [ ] Check "Active Freezes" section:
  - [ ] Shows all active freezes with correct data
  - [ ] Displays freeze duration (days)
  - [ ] Shows expiration date
  - [ ] Shows days remaining
  - [ ] Status badge shows "Active"
- [ ] Test "Use Freeze" functionality:
  - [ ] Button enabled when freezes available
  - [ ] Button disabled when no freezes available
  - [ ] Status text updates correctly
  - [ ] Click "Use Freeze" button
  - [ ] Verify confirmation and success message
  - [ ] Check active freezes list updates
- [ ] Test "Claim Free Freeze":
  - [ ] Button shows correct availability status
  - [ ] Click to claim free weekly freeze
  - [ ] Verify success message
  - [ ] Check freeze is added to active list
- [ ] Check "Usage History" section:
  - [ ] Shows last 10 freeze uses
  - [ ] Displays usage date
  - [ ] Shows usage type icon (🤖 auto or 👤 manual)
  - [ ] Shows freeze duration
- [ ] Verify dark mode styling

### Mobile Testing
- [ ] Freeze cards display properly
- [ ] All sections are readable without scroll issues
- [ ] Buttons are easily tappable
- [ ] History items stack correctly

### API Integration
- [ ] `/api/streak-freeze/:userId` returns active freezes
- [ ] `/api/streak-freeze/use` POST request works
- [ ] `/api/streak-freeze/:userId/claim-free` POST works
- [ ] `/api/streak-freeze/:userId/history` returns history
- [ ] Error messages display correctly

### Translation
- [ ] All freeze-related text is translated
- [ ] Date formatting is correct for locale
- [ ] No missing translation keys

---

## Bug Reports UI Testing

### Desktop Testing
- [ ] Navigate to Bug Reports section
- [ ] Check form displays correctly:
  - [ ] Title input field
  - [ ] Description textarea
  - [ ] Severity dropdown (Low/Medium/High/Critical)
  - [ ] Steps to reproduce textarea
  - [ ] Character counter (2000 max)
- [ ] Test form validation:
  - [ ] Required fields validation
  - [ ] Character counter updates on typing
  - [ ] Character counter prevents exceeding limit
- [ ] Submit bug report:
  - [ ] Fill in all required fields
  - [ ] Select severity
  - [ ] Click "Send Report"
  - [ ] Verify success toast
  - [ ] Check form resets after submission
  - [ ] Character counter resets to 2000
- [ ] Check "My Reports" section:
  - [ ] Recent reports load correctly
  - [ ] Report cards show:
    - [ ] Title
    - [ ] Status badge (New/In Progress/Resolved/Closed)
    - [ ] Submission date
    - [ ] Severity level
  - [ ] Status colors match correctly
  - [ ] Border color matches status
- [ ] Test "Clear Form" button
- [ ] Verify dark mode styling

### Mobile Testing
- [ ] Form fields are properly sized
- [ ] Textarea is large enough for typing
- [ ] Dropdown works on mobile
- [ ] Submit button is easily tappable
- [ ] Report cards stack properly
- [ ] No horizontal scrolling

### API Integration
- [ ] `/api/bugs/report` POST request works
- [ ] `/api/bugs/user/:userId` returns user's reports
- [ ] User agent and URL captured automatically
- [ ] Error handling works correctly
- [ ] Loading states display properly

### Translation
- [ ] All form labels translated
- [ ] Placeholder text translated
- [ ] Severity options translated
- [ ] Status badges translated
- [ ] Error messages translated

---

## General Cross-Feature Testing

### Navigation
- [ ] All nav buttons work correctly
- [ ] Active section highlighted properly
- [ ] Can switch between new sections smoothly
- [ ] Can return to other sections (Home, Study, etc.)

### Authentication
- [ ] Features require login
- [ ] Appropriate error shown if not logged in
- [ ] User ID passed correctly to all API calls

### Responsive Design
- [ ] All features work on mobile (375px width)
- [ ] All features work on tablet (768px width)
- [ ] All features work on desktop (1024px+ width)
- [ ] No content overflow
- [ ] Touch targets meet minimum 44x44px

### Dark Mode
- [ ] All new UI elements have dark mode styles
- [ ] Text is readable in dark mode
- [ ] Contrast ratios are sufficient
- [ ] Theme toggle works for all new sections

### Performance
- [ ] API calls don't block UI
- [ ] Loading states prevent double-clicks
- [ ] Data fetches complete in reasonable time
- [ ] No console errors

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if possible)
- [ ] Mobile browsers (Chrome Mobile, Safari iOS)

---

## Known Issues to Verify Fixed

1. ✅ XP popup notifications disabled during exercises
2. ✅ Translation keys no longer showing as [key_name]
3. ✅ App title changed to "LexyBooster"
4. ✅ Navigation buttons no longer show duplicate text
5. ✅ Keyboard doesn't auto-open in word building exercise
6. ✅ Next button visible without scrolling after answer

---

## Testing Priority

### High Priority (Must Test First)
1. Daily Challenges - claim reward flow
2. Streak Freeze - use freeze functionality
3. Bug Reports - submit report flow
4. Mobile responsiveness for all features

### Medium Priority
1. Dark mode for all new UI
2. Translation coverage
3. Error handling scenarios

### Low Priority
1. History displays
2. Stats displays
3. Edge cases

---

## Production URLs to Test

- **Deployed App:** https://words-learning-server-production.up.railway.app
- **Test User:** Create fresh test account for clean testing
- **Branch:** develop (deployed)

---

## Automated Testing (Future)

Consider adding automated tests for:
- API endpoint integration tests
- UI component unit tests
- E2E tests for critical flows (claim reward, use freeze, submit bug)
