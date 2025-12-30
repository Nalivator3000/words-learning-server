# Comprehensive UI Testing Plan

## Test Execution Order

### Phase 1: Authentication & Registration (Tests 1-6)
1. ✅ Экран логина
2. ✅ Экран регистрации
3. ⏳ Регистрация нового пользователя
4. ⏳ Регистрация через Google
5. ⏳ Логин с email/password
6. ⏳ Логин через Google

### Phase 2: Navigation & UI (Test 7)
7. ⏳ Все пункты меню со скролом
   - Home
   - Import
   - Study
   - Review
   - Stats
   - Settings
   - Profile
   - Achievements
   - (Scroll to bottom on each page)
   - Take screenshots
   - Document UI inconsistencies

### Phase 3: Quiz Testing (Test 8)
8. ⏳ Тестирование всех квизов
   - Multiple choice
   - Fill in the blank
   - Listening
   - Speaking
   - Writing
   - Review quiz

### Phase 4: Word Management (Tests 9-10)
9. ⏳ Редактирование словарей через Статистику
   - Add word
   - Edit word
   - Delete word
   - Mark as mastered
   - Reset progress

10. ⏳ Подробное тестирование наборов слов
    - View all sets
    - Filter by level
    - Filter by theme
    - Add set to study
    - Remove set
    - Import custom set

### Phase 5: Localization (Test 11)
11. ⏳ Тестирование всех языков интерфейса
    - English
    - Russian
    - German
    - Spanish
    - French
    - Chinese
    - Portuguese
    - Italian
    - Arabic
    - Turkish

## Test Tools Created

- `tests/ui/automated-test-suite.js` - Automated Puppeteer tests
- `tests/ui/screenshot-generator.js` - Screenshot capture tool
- `tests/ui/ui-consistency-checker.js` - Design consistency validator

## Test Data

- Test user credentials: test@lexybooster.com / Test123!
- Google OAuth test account: (will use real account for testing)

## Expected Duration

- Phase 1: ~30 minutes
- Phase 2: ~45 minutes
- Phase 3: ~30 minutes
- Phase 4: ~30 minutes
- Phase 5: ~45 minutes

**Total:** ~3 hours of comprehensive testing

## Success Criteria

✅ All auth flows work correctly
✅ No UI inconsistencies or overlaps
✅ All quizzes function properly
✅ Word management features work
✅ All language translations display correctly
✅ No console errors
✅ All screenshots captured for documentation
