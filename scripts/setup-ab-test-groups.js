/**
 * A/B Test User Groups Script
 *
 * Распределяет пользователей на две группы на основе последнего символа их UUID:
 * - Группа A (контрольная): UUID заканчивается на 0-7
 * - Группа B (экспериментальная): UUID заканчивается на 8-9, a-f
 *
 * Отправляет разные события в Google Tag Manager для каждой группы
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Определяет группу пользователя по последнему символу UUID
 * @param {string} uuid - UUID пользователя
 * @returns {'A' | 'B'} - Группа пользователя
 */
function getUserGroup(uuid) {
  const lastChar = uuid.toLowerCase().slice(-1);

  // Группа A: 0-7
  if (/[0-7]/.test(lastChar)) {
    return 'A';
  }

  // Группа B: 8-9, a-f
  if (/[89a-f]/.test(lastChar)) {
    return 'B';
  }

  // На всякий случай (не должно происходить с валидным UUID)
  return 'A';
}

/**
 * Создает GTM event для группы
 * @param {string} eventName - Название события
 * @param {string} group - Группа пользователя ('A' или 'B')
 * @param {object} additionalData - Дополнительные данные для события
 * @returns {object} - GTM event object
 */
function createGTMEvent(eventName, group, additionalData = {}) {
  return {
    event: `${eventName}_group_${group}`,
    experimentGroup: group,
    experimentName: 'ab_test_2025',
    ...additionalData
  };
}

/**
 * Функция для отправки события в GTM (на клиенте)
 * Это пример кода, который нужно использовать на фронтенде
 */
function pushToGTM(eventData) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(eventData);
  }
}

/**
 * Анализирует распределение пользователей по группам
 */
async function analyzeUserDistribution() {
  const client = await pool.connect();

  try {
    console.log('📊 Анализ распределения пользователей по группам...\n');

    const result = await client.query(`
      SELECT
        user_id,
        username,
        email,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    const users = result.rows;
    const groupA = [];
    const groupB = [];

    users.forEach(user => {
      const group = getUserGroup(user.user_id);
      if (group === 'A') {
        groupA.push(user);
      } else {
        groupB.push(user);
      }
    });

    console.log(`Всего пользователей: ${users.length}`);
    console.log(`Группа A (0-7): ${groupA.length} (${(groupA.length / users.length * 100).toFixed(1)}%)`);
    console.log(`Группа B (8-9,a-f): ${groupB.length} (${(groupB.length / users.length * 100).toFixed(1)}%)`);
    console.log('\n📋 Примеры пользователей:');

    console.log('\nГруппа A (первые 5):');
    groupA.slice(0, 5).forEach(user => {
      console.log(`  ${user.user_id.slice(-1)} - ${user.username || user.email}`);
    });

    console.log('\nГруппа B (первые 5):');
    groupB.slice(0, 5).forEach(user => {
      console.log(`  ${user.user_id.slice(-1)} - ${user.username || user.email}`);
    });

    return { groupA, groupB, total: users.length };

  } finally {
    client.release();
  }
}

/**
 * Генерирует SQL для добавления колонки experiment_group в таблицу users (опционально)
 */
function generateMigrationSQL() {
  return `
-- Добавить колонку для хранения группы эксперимента (опционально)
ALTER TABLE users ADD COLUMN IF NOT EXISTS experiment_group VARCHAR(1);

-- Создать индекс для быстрого поиска по группам
CREATE INDEX IF NOT EXISTS idx_users_experiment_group ON users(experiment_group);

-- Обновить группы для существующих пользователей
UPDATE users
SET experiment_group = CASE
  WHEN LOWER(SUBSTRING(user_id FROM LENGTH(user_id) FOR 1)) ~ '[0-7]' THEN 'A'
  WHEN LOWER(SUBSTRING(user_id FROM LENGTH(user_id) FOR 1)) ~ '[89a-f]' THEN 'B'
  ELSE 'A'
END
WHERE experiment_group IS NULL;
`;
}

// Запуск анализа
if (require.main === module) {
  analyzeUserDistribution()
    .then(({ groupA, groupB, total }) => {
      console.log('\n✅ Анализ завершен');
      console.log('\n📄 SQL миграция (опционально):');
      console.log(generateMigrationSQL());
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Ошибка:', err);
      process.exit(1);
    });
}

module.exports = {
  getUserGroup,
  createGTMEvent,
  pushToGTM,
  analyzeUserDistribution
};
