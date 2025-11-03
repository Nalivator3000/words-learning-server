import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_FILE = path.join(__dirname, '../public/index.html');

const fixes = [
  // Fix typo: Иmпорт -> Импорт and add data-i18n
  {
    find: '<button id="googleImportBtn" class="action-btn">Иmпорт</button>',
    replace: '<button id="googleImportBtn" class="action-btn" data-i18n="import">Импорт</button>'
  },
  // Add data-i18n for controls instructions
  {
    find: 'Управление: <kbd>←</kbd><kbd>→</kbd> или <kbd>↑</kbd><kbd>↓</kbd> для мгновенного ответа,',
    replace: '<span data-i18n="controls">Управление:</span> <kbd>←</kbd><kbd>→</kbd> <span data-i18n="or">или</span> <kbd>↑</kbd><kbd>↓</kbd> <span data-i18n="instant_answer">для мгновенного ответа,</span>'
  },
  {
    find: '<kbd>1</kbd><kbd>2</kbd> для быстрого выбора,',
    replace: '<kbd>1</kbd><kbd>2</kbd> <span data-i18n="quick_choice">для быстрого выбора,</span>'
  },
  // Fix typos in voice settings
  {
    find: 'ℹ️ Автоmатический выбор использует уmный алгоритm для подбора наилучшего голоса на вашем устройстве.',
    replace: 'ℹ️ <span data-i18n="auto_voice_info">Автоматический выбор использует умный алгоритм для подбора наилучшего голоса на вашем устройстве.</span>'
  },
  {
    find: '🔊 Тест с текущиmи настройкаmи',
    replace: '🔊 <span data-i18n="test_with_current_settings">Тест с текущими настройками</span>'
  },
  // Fix onboarding tour text
  {
    find: 'Repeat interactive tour по функциям приложения',
    replace: 'Repeat interactive tour <span data-i18n="app_features_tour">по функциям приложения</span>'
  },
  {
    find: '🎯 Начать тур заново',
    replace: '🎯 <span data-i18n="start_tour_again">Начать тур заново</span>'
  }
];

let content = fs.readFileSync(HTML_FILE, 'utf-8');
let totalFixed = 0;

fixes.forEach((fix, index) => {
  if (content.includes(fix.find)) {
    content = content.replace(fix.find, fix.replace);
    totalFixed++;
    console.log(`✅ Fix ${index + 1}: Applied`);
  } else {
    console.log(`⚠️  Fix ${index + 1}: Not found (may be already fixed)`);
  }
});

fs.writeFileSync(HTML_FILE, content, 'utf-8');
console.log(`\n✅ Total fixes applied: ${totalFixed}/${fixes.length}`);
