/**
 * migrate-js-i18n.js
 * Migrate JavaScript hardcoded Russian strings to i18n.t() calls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JS_FILES = [
    path.join(__dirname, '../public/app.js'),
    path.join(__dirname, '../public/gamification.js'),
    path.join(__dirname, '../public/analytics.js')
];

console.log('🔄 Migrating JS files to i18n.t()...\n');

let totalChanges = 0;

JS_FILES.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${path.basename(filePath)} (not found)`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let changes = 0;

    const replacements = [
        { from: "'Ошибка инициализации приложения'", to: "i18n.t('app_init_error')", key: 'app_init_error' },
        { from: "'Пожалуйста, заполните все поля'", to: "i18n.t('fill_all_fields')", key: 'fill_all_fields' },
        { from: "'Пароли не совпадают'", to: "i18n.t('passwords_not_match')", key: 'passwords_not_match' },
        { from: "'Пароль должен быть не mенее 6 сиmволов'", to: "i18n.t('password_min_length')", key: 'password_min_length' },
        { from: "'Не изучалось'", to: "i18n.t('not_studied')", key: 'not_studied' },
        { from: "'Шаблон CSV скачан'", to: "i18n.t('csv_template_downloaded')", key: 'csv_template_downloaded' },
        { from: "'Озвучить'", to: "i18n.t('play_audio')", key: 'play_audio' },
        { from: "'Правильный ответ:'", to: "i18n.t('correct_answer')", key: 'correct_answer' },
        { from: "'Привет! Это тест текущих настроек.'", to: "i18n.t('voice_test_sample')", key: 'voice_test_sample' },
        { from: "'Привет, это тестовое сообщение'", to: "i18n.t('test_message')", key: 'test_message' },
        { from: "'Привет! Это приmер русского голоса для изучения иностранных слов.'", to: "i18n.t('russian_voice_sample')", key: 'russian_voice_sample' }
    ];

    replacements.forEach(({from, to}) => {
        const before = content;
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        if (content !== before) changes++;
    });

    if (changes > 0) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ ${path.basename(filePath)}: ${changes} changes`);
        totalChanges += changes;
    }
});

console.log(`\n📊 Total: ${totalChanges} strings migrated to i18n.t()`);
