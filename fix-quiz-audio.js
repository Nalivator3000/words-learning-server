const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'quiz.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the problematic code
const oldCode = `            // Play the audio after a short delay to let the user see the feedback first
            setTimeout(() => {
                window.app.audioManager.speak(wordToSpeak, langCode);
                console.log(\`🔊 Auto-playing: "\${wordToSpeak}" (\${langCode || 'auto-detect'})\`);
            }, 300);`;

const newCode = `            // Play the audio after a short delay to let the user see the feedback first
            setTimeout(() => {
                // Only play if wordToSpeak is valid
                if (wordToSpeak && typeof wordToSpeak === 'string' && wordToSpeak.trim()) {
                    window.app.audioManager.speak(wordToSpeak, langCode);
                    console.log(\`🔊 Auto-playing: "\${wordToSpeak}" (\${langCode || 'auto-detect'})\`);
                } else {
                    console.warn(\`⚠️ Skipping audio playback - invalid word:\`, wordToSpeak);
                    console.warn(\`Question data:\`, {word: question.word, correctAnswer: question.correctAnswer, type: question.type});
                }
            }, 300);`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully fixed quiz.js audio validation!');
} else {
    console.log('⚠️ Pattern not found. File may already be fixed or has different formatting.');
    console.log('Searching for alternative pattern...');

    // Try to find just the setTimeout block
    const pattern = /setTimeout\(\(\) => \{\s+window\.app\.audioManager\.speak\(wordToSpeak, langCode\);/;
    if (pattern.test(content)) {
        console.log('✅ Found alternative pattern - attempting fix...');
        content = content.replace(
            pattern,
            `setTimeout(() => {\n                // Only play if wordToSpeak is valid\n                if (wordToSpeak && typeof wordToSpeak === 'string' && wordToSpeak.trim()) {\n                    window.app.audioManager.speak(wordToSpeak, langCode);`
        );

        // Also need to close the if statement
        content = content.replace(
            /(\s+console\.log\(`🔊 Auto-playing: "\$\{wordToSpeak\}".*?\`\);)\s+\}, 300\);/,
            `$1\n                } else {\n                    console.warn(\`⚠️ Skipping audio playback - invalid word:\`, wordToSpeak);\n                    console.warn(\`Question data:\`, {word: question.word, correctAnswer: question.correctAnswer, type: question.type});\n                }\n            }, 300);`
        );

        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Applied alternative fix!');
    } else {
        console.log('❌ Could not find pattern to fix.');
    }
}
