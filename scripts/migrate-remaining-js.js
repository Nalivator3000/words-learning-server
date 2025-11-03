import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration mappings
const migrations = [
  {
    file: '../public/quiz.js',
    replacements: [
      {
        old: "throw new Error('No words для изучения');",
        new: "throw new Error(i18n.t('no_words_to_study'));"
      },
      {
        old: 'throw new Error(`Ошибка при загрузке Google Таблиц: ${error.message}`);',
        new: 'throw new Error(`${i18n.t(\'google_sheets_error\')}: ${error.message}`);'
      }
    ]
  },
  {
    file: '../public/user-manager.js',
    replacements: [
      {
        old: "alert('Google login не реализован. Используйте обычный вход или регистрацию.');",
        new: "alert(i18n.t('google_login_not_implemented'));"
      }
    ]
  },
  {
    file: '../public/theme.js',
    replacements: [
      {
        old: '<span class="install-text">Установить приложение</span>',
        new: '<span class="install-text">${i18n.t(\'install_app\')}</span>'
      }
    ]
  }
];

let totalReplacements = 0;

migrations.forEach(({ file, replacements }) => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileReplacements = 0;

  replacements.forEach(({ old, new: newText }) => {
    const count = (content.match(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    content = content.replace(old, newText);
    if (count > 0) {
      fileReplacements += count;
      totalReplacements += count;
    }
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ ${path.basename(file)}: ${fileReplacements} replacements`);
});

console.log(`\n✅ Total: ${totalReplacements} strings migrated`);
