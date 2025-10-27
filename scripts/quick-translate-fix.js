/**
 * Quick translation fix
 * Replaces common Russian texts with English in all files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map of Russian -> English translations
const translations = {
    // Import section
    'Скачайте шаблон CSV для заполнения:': 'Download CSV template:',
    'Скачать шаблон CSV': 'Download CSV Template',
    'Шаблон содержит правильные заголовки колонок и примеры для заполнения': 'Template contains correct column headers and examples',
    'Из CSV файла': 'From CSV File',
    'Загрузите CSV файл с колонками: Слово, Пример, Перевод, Перевод примера': 'Upload CSV file with columns: Word, Example, Translation, Example Translation',
    'Выбрать файл': 'Select File',
    'Из Google Таблиц': 'From Google Sheets',
    'Вставьте ссылку на публичную Google таблицу': 'Paste link to public Google spreadsheet',

    // Study section
    'На повторении': 'For Review',
    'Изучено': 'Learned',

    // Analytics section
    'Аналитика обучения': 'Learning Analytics',
    'График прогресса обучения': 'Learning Progress Chart',
    'XP заработано': 'XP Earned',
    'Слов выучено': 'Words Learned',
    'Время обучения': 'Study Time',
    'Сегодня': 'Today',
    'За неделю': 'This Week',
    'В среднем в день': 'Average per Day',
    'Всего времени': 'Total Time',
    '0ч 0м': '0h 0m',
    'Успешность по типам упражнений': 'Success Rate by Exercise Type',
    'Процент правильных ответов в разных режимах': 'Percentage of correct answers in different modes',
    'Самые сложные слова': 'Most Difficult Words',
    'Слова, в которых вы чаще всего ошибаетесь': 'Words you make mistakes in most often',
    'Прогноз беглости': 'Fluency Forecast',
    'Прогноз беглости недоступен': 'Fluency forecast unavailable',
    'Продолжайте учиться, чтобы получить прогноз!': 'Keep learning to get a forecast!',

    // Danger zone
    'Опасная зона': 'Danger Zone',
    'Сбросить весь прогресс': 'Reset All Progress',
    'ВНИМАНИЕ: Это действие переместит все слова на "изучение" и обнулит все баллы! Необратимо!': 'WARNING: This will move all words to "learning" and reset all points! Irreversible!',

    // Time periods
    'Week': 'Week',
    'Месяц': 'Month',
    'Год': 'Year',

    // Messages
    'Начните занятие сегодня! Всего 15 минут в день помогут достичь больших результатов.': 'Start studying today! Just 15 minutes a day will help you achieve great results.',
    'Нет данных о сложных словах': 'No data on difficult words',
    'Нет слов': 'No words',

    // Analytics additional
    'Слова': 'Words',
    'Процент успешности': 'Success Rate',
    'Успешность:': 'Success:',
    'Правильно:': 'Correct:',
    'Неправильно:': 'Incorrect:',
    'Всего:': 'Total:',
    'Процент успешности (%)': 'Success Rate (%)',
    ' ошибок': ' errors',
    ' попыток': ' attempts',
    '% ошибок': '% error rate',
    'Отработать это слово': 'Practice this word',
    ' мин': ' min',
    'ч ': 'h ',
    'м': 'm',
    'Fluency Forecast недоступен': 'Fluency Forecast unavailable',
    'Прогноз достижения беглости': 'Fluency Achievement Forecast',
    'Ожидаемая дата': 'Expected Date',
    'Осталось ': 'Remaining ',
    ' дней': ' days',
    'Цель достигнута!': 'Goal achieved!',
    'Текущий прогресс': 'Current Progress',
    'Уверенность модели': 'Model Confidence',
    'Текущий темп': 'Current Pace',
    ' слов/нед': ' words/week',
    'Множественный выбор': 'Multiple Choice',
    'Составление слова': 'Word Building',
    'Набор текста': 'Typing',
    'Карточки': 'Flashcards',
    'Аудирование': 'Listening',
    'Отличная работа!': 'Great work!',
    'Today вы занимались больше обычного!': 'You studied more than usual today!'
};

function replaceInFile(filePath, replacements) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;

        for (const [russian, english] of Object.entries(replacements)) {
            const regex = new RegExp(escapeRegex(russian), 'g');
            if (content.includes(russian)) {
                content = content.replace(regex, english);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        }

        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processDirectory(dirPath, replacements) {
    const files = fs.readdirSync(dirPath);
    let modifiedCount = 0;

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules, .git, etc.
            if (!['node_modules', '.git', 'store-assets', 'screenshots'].includes(file)) {
                modifiedCount += processDirectory(filePath, replacements);
            }
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            if (replaceInFile(filePath, replacements)) {
                console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
                modifiedCount++;
            }
        }
    }

    return modifiedCount;
}

console.log('🔄 Quick translation fix starting...\n');

const publicDir = path.join(__dirname, '..', 'public');
const modifiedCount = processDirectory(publicDir, translations);

console.log(`\n✅ Complete! Modified ${modifiedCount} files`);
console.log('\n💡 Next steps:');
console.log('   1. Test the application to verify translations');
console.log('   2. Commit changes');
console.log('   3. Deploy to production');
