import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../translations/source-texts.json');
const data = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

// New UI keys for Bug Reports, Streak Freeze, and Daily Challenges
const newKeys = {
  // Daily Challenges
  'daily_challenges': {
    en: 'Daily Challenges',
    ru: 'Ежедневные задания'
  },
  'challenges_description': {
    en: 'Complete daily challenges and earn extra rewards! New challenges every day.',
    ru: 'Выполняй ежедневные задания и получай дополнительные награды! Каждый день новые челленджи.'
  },
  'challenges_completed_today': {
    en: 'Completed Today',
    ru: 'Выполнено сегодня'
  },
  'challenges_streak': {
    en: 'Streak Days',
    ru: 'Серия дней'
  },
  'challenges_total': {
    en: 'Total Completed',
    ru: 'Всего выполнено'
  },
  'days_short': {
    en: 'd.',
    ru: 'дн.'
  },
  'challenge_easy': {
    en: 'Easy',
    ru: 'Легко'
  },
  'challenge_medium': {
    en: 'Medium',
    ru: 'Средне'
  },
  'challenge_hard': {
    en: 'Hard',
    ru: 'Сложно'
  },
  'challenge_progress': {
    en: 'Progress',
    ru: 'Прогресс'
  },
  'challenge_reward': {
    en: 'Reward',
    ru: 'Награда'
  },
  'challenge_claim_reward': {
    en: 'Claim Reward',
    ru: 'Получить награду'
  },
  'challenge_completed': {
    en: 'Completed!',
    ru: 'Выполнено!'
  },
  'challenge_locked': {
    en: 'Locked',
    ru: 'Заблокировано'
  },

  // Streak Freeze
  'streak_freeze_title': {
    en: 'Streak Freeze',
    ru: 'Заморозка стрика'
  },
  'streak_freeze_description': {
    en: 'Protect your streak from loss! Use freeze if you can\'t study.',
    ru: 'Защити свой стрик от потери! Используй заморозку, если не можешь заниматься.'
  },
  'active_freezes': {
    en: 'Active Freezes',
    ru: 'Активные заморозки'
  },
  'use_freeze': {
    en: 'Use Freeze',
    ru: 'Использовать заморозку'
  },
  'use_freeze_description': {
    en: 'Activate freeze right now to protect today\'s streak',
    ru: 'Активируй заморозку прямо сейчас, чтобы защитить стрик на сегодня'
  },
  'use_freeze_button': {
    en: 'Use Freeze',
    ru: 'Использовать заморозку'
  },
  'free_freeze': {
    en: 'Free Freeze',
    ru: 'Бесплатная заморозка'
  },
  'free_freeze_description': {
    en: 'Get 1 free freeze every week!',
    ru: 'Получай 1 бесплатную заморозку каждую неделю!'
  },
  'claim_free_freeze': {
    en: 'Claim Free Freeze',
    ru: 'Получить бесплатную заморозку'
  },
  'freeze_history': {
    en: 'Usage History',
    ru: 'История использования'
  },
  'freeze_active': {
    en: 'Active',
    ru: 'Активна'
  },
  'freeze_days_left': {
    en: 'days left',
    ru: 'дней осталось'
  },
  'freeze_expires': {
    en: 'Expires',
    ru: 'Истекает'
  },
  'no_active_freezes': {
    en: 'No active freezes',
    ru: 'Нет активных заморозок'
  },
  'freeze_used_successfully': {
    en: 'Freeze used successfully!',
    ru: 'Заморозка успешно использована!'
  },
  'free_freeze_claimed': {
    en: 'Free freeze claimed!',
    ru: 'Бесплатная заморозка получена!'
  },
  'freeze_not_available': {
    en: 'No freezes available',
    ru: 'Нет доступных заморозок'
  },

  // Bug Reports
  'bug_reports': {
    en: 'Report a Bug',
    ru: 'Сообщить об ошибке'
  },
  'bug_reports_description': {
    en: 'Found a bug? Describe the problem and we\'ll fix it!',
    ru: 'Нашли ошибку или баг? Опишите проблему, и мы её исправим!'
  },
  'bug_title': {
    en: 'Problem Title',
    ru: 'Название проблемы'
  },
  'bug_title_placeholder': {
    en: 'Brief description of the problem',
    ru: 'Краткое описание проблемы'
  },
  'bug_description': {
    en: 'Detailed Description',
    ru: 'Подробное описание'
  },
  'bug_description_placeholder': {
    en: 'Describe what happened, how to reproduce the bug, what behavior you expected',
    ru: 'Опишите, что произошло, как воспроизвести ошибку, какое поведение ожидали'
  },
  'bug_severity': {
    en: 'Severity',
    ru: 'Критичность'
  },
  'severity_low': {
    en: 'Low (cosmetic)',
    ru: 'Низкая (косметическая)'
  },
  'severity_medium': {
    en: 'Medium (affects functionality)',
    ru: 'Средняя (влияет на работу)'
  },
  'severity_high': {
    en: 'High (blocks feature)',
    ru: 'Высокая (блокирует функцию)'
  },
  'severity_critical': {
    en: 'Critical (app crash)',
    ru: 'Критическая (краш приложения)'
  },
  'bug_steps': {
    en: 'Steps to Reproduce',
    ru: 'Шаги для воспроизведения'
  },
  'bug_steps_placeholder': {
    en: '1. Open section... 2. Click on... 3. See error...',
    ru: '1. Открыть раздел... 2. Нажать на... 3. Увидеть ошибку...'
  },
  'characters_left': {
    en: 'Characters left',
    ru: 'Осталось символов'
  },
  'send_bug_report': {
    en: 'Send Report',
    ru: 'Отправить отчёт'
  },
  'reset_form': {
    en: 'Clear Form',
    ru: 'Очистить форму'
  },
  'my_bug_reports': {
    en: 'My Reports',
    ru: 'Мои отчёты'
  },
  'bug_report_sent': {
    en: 'Bug report sent successfully!',
    ru: 'Отчёт об ошибке успешно отправлен!'
  },
  'no_bug_reports': {
    en: 'No reports yet',
    ru: 'Отчётов пока нет'
  },
  'bug_status_new': {
    en: 'New',
    ru: 'Новая'
  },
  'bug_status_in_progress': {
    en: 'In Progress',
    ru: 'В работе'
  },
  'bug_status_resolved': {
    en: 'Resolved',
    ru: 'Решена'
  },
  'bug_status_closed': {
    en: 'Closed',
    ru: 'Закрыта'
  }
};

let added = 0;

Object.entries(newKeys).forEach(([key, translations]) => {
  if (!data[key]) {
    data[key] = {
      source: translations.ru || translations.en,
      en: translations.en,
      ru: translations.ru,
      de: translations.en, // Use English as fallback for other languages
      es: translations.en,
      fr: translations.en,
      it: translations.en
    };
    added++;
    console.log(`✅ Added: ${key}`);
  } else {
    console.log(`⚠️ Skipped (exists): ${key}`);
  }
});

fs.writeFileSync(SOURCE, JSON.stringify(data, null, 2), 'utf-8');

console.log(`\n✅ Added ${added} new translation keys`);
console.log(`📊 Total keys: ${Object.keys(data).length}`);
