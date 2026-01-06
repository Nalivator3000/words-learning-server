/**
 * Test script to verify Hindi quiz validation fix
 * This tests that Hindi answers are properly validated and incorrect answers are rejected
 */

class QuizManager {
    checkTypingAnswerDetailed(userAnswer, correctAnswer) {
        // Detect if we're working with a non-Latin script (e.g., Hindi, Arabic, etc.)
        const isNonLatinScript = (str) => {
            // Check for common non-Latin Unicode ranges
            return /[\u0900-\u097F\u0600-\u06FF\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(str);
        };

        const correctIsNonLatin = isNonLatinScript(correctAnswer);

        // Normalize strings for comparison
        const normalize = (str, isNonLatin) => {
            let normalized = str.toLowerCase().trim();

            if (!isNonLatin) {
                // For Latin scripts (German, English, etc.): normalize umlauts and remove punctuation
                normalized = normalized
                    .replace(/[äöüß]/g, (match) => {
                        const replacements = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss' };
                        return replacements[match] || match;
                    })
                    .replace(/[^\w\s]/g, ''); // Remove punctuation
            } else {
                // For non-Latin scripts: only trim whitespace, preserve all characters
                // This ensures Hindi, Arabic, Cyrillic, etc. characters are preserved
                normalized = normalized.replace(/\s+/g, ' '); // Normalize multiple spaces to single space
            }

            return normalized;
        };

        const normalizedUser = normalize(userAnswer, correctIsNonLatin);
        const normalizedCorrect = normalize(correctAnswer, correctIsNonLatin);

        // Exact match
        if (normalizedUser === normalizedCorrect) {
            return { correct: true, partiallyCorrect: false };
        }

        // Only apply German-specific checks for Latin scripts
        if (!correctIsNonLatin) {
            // Check for German article errors
            const articleResult = this.checkGermanArticles(userAnswer.toLowerCase().trim(), correctAnswer.toLowerCase().trim());
            if (articleResult.partialMatch) {
                return { correct: false, partiallyCorrect: true };
            }

            // Check for German ei/ie swap
            if (this.checkGermanEiIeSwap(userAnswer.toLowerCase().trim(), correctAnswer.toLowerCase().trim())) {
                return { correct: false, partiallyCorrect: true };
            }

            // Allow for minor typos using Levenshtein distance
            const distance = this.levenshteinDistance(normalizedUser, normalizedCorrect);
            const maxAllowedDistance = Math.floor(normalizedCorrect.length * 0.2); // Allow 20% error

            if (distance <= maxAllowedDistance && distance <= 2) {
                return { correct: false, partiallyCorrect: true };
            }
        } else {
            // For non-Latin scripts, be more strict - only allow very minor typos
            const distance = this.levenshteinDistance(normalizedUser, normalizedCorrect);

            // For non-Latin scripts, only allow 1 character difference for shorter words
            // This prevents completely wrong answers from being accepted
            if (distance === 1 && normalizedCorrect.length >= 3) {
                return { correct: false, partiallyCorrect: true };
            }
        }

        return { correct: false, partiallyCorrect: false };
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    checkGermanArticles() {
        return { partialMatch: false };
    }

    checkGermanEiIeSwap() {
        return false;
    }
}

// Test cases
const quiz = new QuizManager();

console.log('=== Hindi Quiz Validation Tests ===\n');

// Test 1: Correct Hindi answer
const test1 = quiz.checkTypingAnswerDetailed('बाइक', 'बाइक');
console.log('Test 1 - Correct Hindi answer:');
console.log(`  User: "बाइक" | Correct: "बाइक"`);
console.log(`  Result: ${test1.correct ? '✓ CORRECT' : '✗ WRONG'}`);
console.log(`  Expected: CORRECT\n`);

// Test 2: Wrong Hindi answer (completely different word)
const test2 = quiz.checkTypingAnswerDetailed('साइकिल', 'बाइक');
console.log('Test 2 - Wrong Hindi answer (completely different):');
console.log(`  User: "साइकिल" | Correct: "बाइक"`);
console.log(`  Result: ${test2.correct || test2.partiallyCorrect ? '✗ ACCEPTED' : '✓ REJECTED'}`);
console.log(`  Expected: REJECTED\n`);

// Test 3: Random English/Russian text when Hindi is expected
const test3 = quiz.checkTypingAnswerDetailed('वывыва', 'बाइक');
console.log('Test 3 - Cyrillic text when Hindi expected:');
console.log(`  User: "вывыва" | Correct: "बाइक"`);
console.log(`  Result: ${test3.correct || test3.partiallyCorrect ? '✗ ACCEPTED' : '✓ REJECTED'}`);
console.log(`  Expected: REJECTED\n`);

// Test 4: Correct answer with extra spaces
const test4 = quiz.checkTypingAnswerDetailed('  बाइक  ', 'बाइक');
console.log('Test 4 - Correct answer with extra spaces:');
console.log(`  User: "  बाइक  " | Correct: "बाइक"`);
console.log(`  Result: ${test4.correct ? '✓ CORRECT' : '✗ WRONG'}`);
console.log(`  Expected: CORRECT\n`);

// Test 5: German word validation (should still work)
const test5 = quiz.checkTypingAnswerDetailed('das Fahrrad', 'das Fahrrad');
console.log('Test 5 - German word (Latin script) validation:');
console.log(`  User: "das Fahrrad" | Correct: "das Fahrrad"`);
console.log(`  Result: ${test5.correct ? '✓ CORRECT' : '✗ WRONG'}`);
console.log(`  Expected: CORRECT\n`);

// Test 6: German word with minor typo (should give partial credit)
const test6 = quiz.checkTypingAnswerDetailed('das Fahrrat', 'das Fahrrad');
console.log('Test 6 - German word with minor typo:');
console.log(`  User: "das Fahrrat" | Correct: "das Fahrrad"`);
console.log(`  Result: ${test6.partiallyCorrect ? '✓ PARTIAL CREDIT' : '✗ NO CREDIT'}`);
console.log(`  Expected: PARTIAL CREDIT\n`);

// Test 7: Completely wrong English when German expected
const test7 = quiz.checkTypingAnswerDetailed('bicycle', 'das Fahrrad');
console.log('Test 7 - English text when German expected:');
console.log(`  User: "bicycle" | Correct: "das Fahrrad"`);
console.log(`  Result: ${test7.correct || test7.partiallyCorrect ? '✗ ACCEPTED' : '✓ REJECTED'}`);
console.log(`  Expected: REJECTED\n`);

// Summary
console.log('=== Summary ===');
console.log('If all tests show the expected results, the fix is working correctly.');
console.log('The validation should now properly reject incorrect Hindi answers.');
