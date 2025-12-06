# Typing Exercise UX Improvements

## Overview
Enhanced the user experience for typing exercises with auto-focus and keyboard navigation improvements.

## Changes Made

### 1. Auto-Focus on Desktop
- **Feature**: Input field automatically focuses when typing question appears (desktop only)
- **Implementation**: Detects touch devices and skips auto-focus on mobile to prevent unwanted keyboard popup
- **Files Modified**:
  - [public/app.js:1181-1187](public/app.js#L1181-L1187) - Study typing
  - [public/app.js:1286-1290](public/app.js#L1286-L1290) - Review typing

```javascript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (!isTouchDevice) {
    setTimeout(() => input.focus(), 0);
}
```

### 2. Persistent Focus After Answer
- **Feature**: Cursor stays in the input field after submitting an answer
- **Implementation**: Changed from `disabled` to `readOnly` attribute
- **Benefit**: Allows Enter key to work for navigation while preventing editing
- **Files Modified**:
  - [public/app.js:1395](public/app.js#L1395) - `handleTypingAnswer`
  - [public/app.js:1490](public/app.js#L1490) - `handleReviewTypingAnswer`
  - [public/app.js:2175](public/app.js#L2175) - `showAnswer`
  - [public/app.js:2222](public/app.js#L2222) - `showReviewAnswer`

### 3. Enhanced Enter Key Behavior

#### First Enter Press (Field is editable):
- **If field has text**: Submit answer
- **If field is empty**: Show correct answer (equivalent to "Show Answer" button)

#### Second Enter Press (After answer submitted):
- **If not last question**: Go to next question
- **If last question**: Finish quiz/review

**Implementation**: [public/app.js:1935-1959](public/app.js#L1935-L1959)

```javascript
handleEnterPress(inputEl) {
    // If field is readonly, it means answer was already submitted
    if (inputEl.readOnly) {
        if (!document.getElementById('nextBtn').classList.contains('hidden')) {
            this.nextQuestion();
        } else if (!document.getElementById('finishStudyBtn').classList.contains('hidden')) {
            this.finishQuiz();
        }
        return;
    }

    // Field is editable - first Enter press
    if (inputEl.dataset.enterPressed === 'false') {
        inputEl.dataset.enterPressed = 'true';

        if (!inputEl.value.trim()) {
            this.showAnswer(inputEl);
        } else {
            this.handleTypingAnswer(inputEl.value, inputEl);
        }
    }
}
```

### 4. CSS Improvements
- **Feature**: Styled readonly input fields to indicate they're not editable but keep focus visible
- **Files Modified**: [public/style.css:1687-1695](public/style.css#L1687-L1695)

```css
.text-input[readonly] {
    cursor: default;
}

.text-input[readonly]:focus {
    outline: none;
    box-shadow: none;
}
```

## User Flow Examples

### Example 1: Correct Answer with Keyboard Only
1. Question appears → **Cursor auto-focuses** (desktop)
2. User types answer
3. Press **Enter** → Answer submitted, feedback shown
4. Press **Enter** again → Next question appears
5. Repeat until quiz ends
6. Press **Enter** on last question → Quiz finishes

### Example 2: Show Answer Flow
1. Question appears → **Cursor auto-focuses** (desktop)
2. User doesn't know answer
3. Press **Enter** on empty field → Correct answer shown
4. Press **Enter** again → Next question appears

### Example 3: Mobile Experience
1. Question appears → **No auto-focus** (prevents keyboard popup)
2. User taps input field → Keyboard appears
3. User types answer and taps "Submit" button
4. User taps "Next" button or presses Enter

## Benefits

1. **Faster Workflow**: Power users can complete exercises using only keyboard
2. **No Distraction**: Cursor stays in field, no need to reach for mouse/touch
3. **Mobile-Friendly**: Auto-focus disabled on touch devices to prevent annoyance
4. **Intuitive**: Empty Enter = show answer, natural expectation
5. **Consistent**: Works the same for both Study and Review modes

## Technical Notes

### Why `readOnly` instead of `disabled`?
- `disabled` prevents all interaction including focus and keyboard events
- `readOnly` prevents editing but allows focus and keyboard events (Enter key)
- This lets us keep the input focused for Enter navigation while preventing text changes

### Touch Device Detection
```javascript
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```
- Checks for both touch event support and touch points
- Works across all major browsers and devices
- Conservative approach: better to skip auto-focus than annoy mobile users

## Testing Checklist

- [x] Desktop: Auto-focus works on typing questions
- [x] Mobile: Auto-focus disabled, no unwanted keyboard popup
- [x] Enter on filled field submits answer
- [x] Enter on empty field shows answer
- [x] Second Enter goes to next question
- [x] Last question Enter finishes quiz
- [x] Cursor stays visible after answer
- [x] Works in both Study and Review modes
- [x] CSS styling correct for readonly fields
