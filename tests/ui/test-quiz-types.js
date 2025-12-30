#!/usr/bin/env node
/**
 * Test all quiz types
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://lexybooster.com';
const TEST_EMAIL = 'test-en-de@lexybooster.test';
const TEST_PASSWORD = 'Test123!@#';

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function login(page) {
    console.log('🔐 Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    await page.type('#loginEmail', TEST_EMAIL);
    await page.type('#loginPassword', TEST_PASSWORD);
    await page.click('#loginBtn');
    await sleep(4000);

    console.log('✅ Logged in\n');
}

async function startQuiz(page) {
    console.log('🎯 Starting quiz...');

    // Go to Study section
    const studyBtn = await page.$('#studyBtn');
    if (studyBtn) {
        await studyBtn.click();
        await sleep(2000);
    }

    // Look for Start Quiz button
    const startButtons = await page.$$('button');
    for (const btn of startButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Start') || text.includes('Quiz') || text.includes('Study') || text.includes('Begin')) {
            console.log(`   Found button: "${text}"`);
            await btn.click();
            await sleep(3000);
            break;
        }
    }
}

async function identifyQuizType(page) {
    const quizInfo = await page.evaluate(() => {
        const result = {
            type: 'unknown',
            question: '',
            options: [],
            inputs: [],
            buttons: []
        };

        // Get question text
        const questionEl = document.querySelector('.quiz-question, .question, [data-question]');
        if (questionEl) {
            result.question = questionEl.textContent.trim().substring(0, 100);
        }

        // Check for multiple choice options
        const optionEls = document.querySelectorAll('.quiz-option, .option, [data-option], .answer-option');
        if (optionEls.length > 0) {
            result.type = 'multiple-choice';
            optionEls.forEach(opt => {
                result.options.push(opt.textContent.trim());
            });
        }

        // Check for text input
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        if (inputs.length > 0) {
            result.type = result.type === 'unknown' ? 'text-input' : result.type + ' + text-input';
            inputs.forEach(inp => {
                result.inputs.push({
                    id: inp.id,
                    placeholder: inp.placeholder,
                    type: inp.type
                });
            });
        }

        // Get all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            const text = btn.textContent.trim();
            if (text.length > 0 && text.length < 30) {
                result.buttons.push(text);
            }
        });

        return result;
    });

    return quizInfo;
}

async function testQuizInteraction(page, quizNumber) {
    console.log(`\n📝 Quiz #${quizNumber}:`);

    try {
        await sleep(1000);

        const quizInfo = await identifyQuizType(page);

        console.log(`   Type: ${quizInfo.type}`);
        if (quizInfo.question) {
            console.log(`   Question: "${quizInfo.question.substring(0, 80)}..."`);
        }
        if (quizInfo.options.length > 0) {
            console.log(`   Options: ${quizInfo.options.length} choices`);
        }
        if (quizInfo.inputs.length > 0) {
            console.log(`   Inputs: ${quizInfo.inputs.length} text fields`);
        }

        // Take screenshot before answer
        const filenameBefore = `screenshots/quizzes/quiz-${quizNumber}-before.png`;
        await page.screenshot({ path: filenameBefore, fullPage: false });
        console.log(`   📸 Before: ${filenameBefore}`);

        // Try to answer the quiz
        let answered = false;

        if (quizInfo.type.includes('multiple-choice') && quizInfo.options.length > 0) {
            // Click first option
            const firstOption = await page.$('.quiz-option, .option, [data-option], .answer-option');
            if (firstOption) {
                await firstOption.click();
                await sleep(500);
                answered = true;
                console.log(`   ✅ Selected option`);
            }
        } else if (quizInfo.type.includes('text-input') && quizInfo.inputs.length > 0) {
            // Type test answer
            const input = await page.$('input[type="text"], textarea');
            if (input) {
                await input.type('test answer');
                await sleep(500);
                answered = true;
                console.log(`   ✅ Entered text answer`);
            }
        }

        // Take screenshot after answer
        if (answered) {
            const filenameAfter = `screenshots/quizzes/quiz-${quizNumber}-answered.png`;
            await page.screenshot({ path: filenameAfter, fullPage: false });
            console.log(`   📸 After: ${filenameAfter}`);
        }

        // Try to submit/continue
        const submitButtons = await page.$$('button');
        for (const btn of submitButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Check') || text.includes('Submit') || text.includes('Next') || text.includes('Continue')) {
                await btn.click();
                await sleep(2000);
                console.log(`   ✅ Submitted answer`);

                // Take screenshot of result
                const filenameResult = `screenshots/quizzes/quiz-${quizNumber}-result.png`;
                await page.screenshot({ path: filenameResult, fullPage: false });
                console.log(`   📸 Result: ${filenameResult}`);
                break;
            }
        }

        return true;

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        await page.screenshot({ path: `screenshots/quizzes/quiz-${quizNumber}-error.png` });
        return false;
    }
}

async function main() {
    console.log('\n🧠 Quiz Types Testing - LexyBooster\n');
    console.log('═'.repeat(80) + '\n');

    if (!fs.existsSync('screenshots/quizzes')) {
        fs.mkdirSync('screenshots/quizzes', { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        await login(page);
        await startQuiz(page);

        console.log('\n🎯 Testing different quiz questions...\n');

        // Test first 10 quizzes to see different types
        let successCount = 0;
        for (let i = 1; i <= 10; i++) {
            const success = await testQuizInteraction(page, i);
            if (success) successCount++;
            await sleep(2000);

            // Check if quiz ended
            const quizEnded = await page.evaluate(() => {
                return document.body.textContent.includes('Quiz Complete') ||
                       document.body.textContent.includes('Finished') ||
                       document.body.textContent.includes('Results');
            });

            if (quizEnded) {
                console.log('\n   ℹ️  Quiz session ended');
                await page.screenshot({ path: 'screenshots/quizzes/quiz-complete.png', fullPage: true });
                console.log('   📸 Final results captured');
                break;
            }
        }

        console.log('\n\n═'.repeat(80));
        console.log(`✅ Quiz Testing Complete!`);
        console.log(`   Tested: ${successCount} quiz questions`);
        console.log(`   Screenshots saved to: screenshots/quizzes/`);
        console.log('═'.repeat(80) + '\n');

        console.log('ℹ️  Browser will remain open for manual inspection.');
        console.log('   Press Ctrl+C to close.\n');

        // Keep browser open
        await new Promise(() => {});

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        await page.screenshot({ path: 'screenshots/quizzes/fatal-error.png' });
    }
}

process.on('SIGINT', () => {
    console.log('\n👋 Closing...\n');
    process.exit(0);
});

main().catch(err => {
    console.error('❌ Fatal Error:', err.message);
    process.exit(1);
});
