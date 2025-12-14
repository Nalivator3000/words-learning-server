/**
 * fix-html-i18n.js
 * Fix typos and add data-i18n attributes to all hardcoded Russian text
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_FILE = path.join(__dirname, '../public/index.html');

console.log('🔧 Fixing HTML typos and adding data-i18n...\n');

let html = fs.readFileSync(HTML_FILE, 'utf-8');
let changes = 0;

// Fix typos and add data-i18n in one go
const replacements = [
    // Fix typos + add data-i18n
    { from: '>Иmпорт<', to: ' data-i18n="import">Импорт<', desc: 'Import button' },
    { from: 'class="stat-label">Счёт:', to: 'class="stat-label" data-i18n="score">Счёт:', desc: 'Score label' },
    { from: 'class="stat-label">Ошибки:', to: 'class="stat-label" data-i18n="errors">Ошибки:', desc: 'Errors label' },
    { from: 'class="stat-label">Вреmя:', to: 'class="stat-label" data-i18n="time">Время:', desc: 'Time label (fixed typo)' },
    { from: '"survival-choice">Слово 1<', to: '"survival-choice" data-i18n="word_1">Слово 1<', desc: 'Word 1' },
    { from: '>Выберите режиm изучения:<', to: ' data-i18n="selectMode">Выберите режим изучения:<', desc: 'Select mode (fixed typo)' },
    { from: '>Режиm выживания<', to: ' data-i18n="survivalMode">Режим выживания<', desc: 'Survival mode (fixed typo)' },
    { from: '>Коmплексный режиm<', to: ' data-i18n="complexMode">Комплексный режим<', desc: 'Complex mode (fixed typos)' },
    { from: '>Управление:<', to: ' data-i18n="controls">Управление:<', desc: 'Controls label' },
    { from: 'для mгновенного ответа,', to: 'для мгновенного ответа,', desc: 'For instant answer (fixed typo)' },
    { from: '>Пробел<', to: ' data-i18n="space">Пробел<', desc: 'Space key' },
    { from: '(рекоmендуется)', to: '(рекомендуется)', desc: 'Recommended (fixed typo)' },
    { from: 'title="Прослушать приmер"', to: 'title="Прослушать пример" data-i18n-title="listen_example"', desc: 'Listen example (fixed typo)' },
    { from: '>Неmецкий (de-DE)<', to: ' data-i18n="german_de">Немецкий (de-DE)<', desc: 'German (fixed typo)' },
    { from: 'наилучшего голоса на вашеm устройстве.', to: 'наилучшего голоса на вашем устройстве.', desc: 'Best voice (fixed typo)' },
    { from: '>⚙️ Параmетры озвучки<', to: ' data-i18n="voice_parameters">⚙️ Параметры озвучки<', desc: 'Voice params (fixed typo)' },
    { from: 'для запоmинания<', to: 'для запоминания<', desc: 'For memorization (fixed typo)' },
    { from: '>Норmальный<', to: ' data-i18n="normal">Нормальный<', desc: 'Normal (fixed typo)' },
    { from: '>Гроmкость:', to: ' data-i18n="volume">Громкость:', desc: 'Volume (fixed typo)' },
    { from: 'с текущиmи настройкаmи<', to: ' data-i18n="test_current_settings">с текущими настройками<', desc: 'Test with current settings (fixed typos)' },
    { from: '>👋 Обучение<', to: ' data-i18n="training_intro">👋 Обучение<', desc: 'Training intro' },
    { from: 'функцияm приложения', to: 'функциям приложения', desc: 'App functions (fixed typo)' },
    { from: 'value="ru">Русский (Russian)<', to: 'value="ru" data-i18n="russian">Русский (Russian)<', desc: 'Russian language option' },
    { from: 'value="auto">Авто (рекомендуется)<', to: 'value="auto" data-i18n="auto_recommended">Авто (рекомендуется)<', desc: 'Auto recommended' },
    { from: 'Медленнее = лучше для запоминания', to: 'Slower = better for memorization', desc: 'Slower better for memory' },
    { from: 'Повторите интерактивный тур', to: 'Repeat interactive tour', desc: 'Repeat tour' },
    { from: '>🎯 Начать тур заново<', to: ' data-i18n="start_tour_again">🎯 Начать тур заново<', desc: 'Start tour again' },
    { from: '\'Доступно обновление приложения. Обновить сейчас?\'', to: 'i18n.t(\'app_update_available\')', desc: 'App update prompt in JS' }
];

replacements.forEach(({from, to, desc}) => {
    const before = html;
    html = html.replace(from, to);
    if (html !== before) {
        console.log(`✅ ${desc}`);
        changes++;
    }
});

// Save
fs.writeFileSync(HTML_FILE, html, 'utf-8');

console.log(`\n📊 Total changes: ${changes}`);
console.log(`✅ HTML fixed and data-i18n added!`);
