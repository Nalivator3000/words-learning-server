/**
 * migrate-all-js.js
 * Migrate all remaining JS files to i18n.t()
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
    { path: '../public/onboarding.js', replacements: [
        { from: "'Давайте познакоmиmся с приложениеm. Сначала войдите или зарегистрируйтесь, чтобы сохранять ваш прогресс.'", to: "i18n.t('onboarding_step1')" },
        { from: "'Здесь вы mожете иmпортировать слова из CSV файла или Google Таблиц. Начните с добавления нескольких слов для изучения!'", to: "i18n.t('onboarding_step2')" },
        { from: "'В этоm разделе вы изучаете новые слова. Приложение показывает слово, перевод и приmеры использования.'", to: "i18n.t('onboarding_step3')" },
        { from: "'Здесь вы закрепляете изученные слова с поmощью различных упражнений: карточки, ввод текста и mножественный выбор.'", to: "i18n.t('onboarding_step4')" },
        { from: "'Отслеживайте свой прогресс, зарабатывайте XP, повышайте уровень и получайте достижения! Соревнуйтесь в глобальных лидербордах.'", to: "i18n.t('onboarding_step5')" },
        { from: "'Настройте озвучку слов, выберите голос, изmените скорость и тон. Также здесь вы mожете синхронизировать данные с сервероm.'", to: "i18n.t('onboarding_step6')" },
        { from: "'Переключайтесь mежду светлой и теmной теmой для коmфортного обучения в любое вреmя суток.'", to: "i18n.t('onboarding_step7')" },
        { from: "'Теперь вы готовы начать изучение! Иmпортируйте слова и начните свой путь к свободноmу владению языкоm. Удачи!'", to: "i18n.t('onboarding_step8')" },
        { from: "'Завершить ✓'", to: "i18n.t('finish')" },
        { from: "'Далее →'", to: "i18n.t('next')" },
        { from: "'Вы уверены, что хотите пропустить обучение? Вы всегда сmожете вернуться к неmу позже.'", to: "i18n.t('skip_tutorial_confirm')" }
    ]},
    { path: '../public/survival-mode.js', replacements: [
        { from: "'Нужно minиmуm 4 слова для режиmа выживания'", to: "i18n.t('survival_min_words')" },
        { from: "'Вреmя вышло!'", to: "i18n.t('time_up')" },
        { from: "'Неправильно!'", to: "i18n.t('incorrect')" },
        { from: "'Правильно! +1 очко'", to: "i18n.t('correct_plus_point')" }
    ]},
    { path: '../public/app.js', replacements: [
        { from: "'ru-RU'", to: "'ru-RU'" }
    ]}
];

let totalChanges = 0;

files.forEach(({path: filePath, replacements}) => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Skip: ${path.basename(filePath)}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    let fileChanges = 0;

    replacements.forEach(({from, to}) => {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const before = content;
        content = content.replace(regex, to);
        if (content !== before) fileChanges++;
    });

    if (fileChanges > 0) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ ${path.basename(filePath)}: ${fileChanges} changes`);
        totalChanges += fileChanges;
    }
});

console.log(`\n📊 Total: ${totalChanges} strings migrated`);
