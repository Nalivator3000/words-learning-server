/**
 * A/B Testing Middleware
 *
 * Добавляет информацию о группе эксперимента в ответы API
 */

/**
 * Определяет группу пользователя по последнему символу UUID
 * @param {string} uuid - UUID пользователя
 * @returns {'A' | 'B'} - Группа пользователя
 */
function getUserGroup(uuid) {
  if (!uuid) return 'A';

  const lastChar = uuid.toLowerCase().slice(-1);

  // Группа A: 0-7 (50% пользователей)
  if (/[0-7]/.test(lastChar)) {
    return 'A';
  }

  // Группа B: 8-9, a-f (50% пользователей)
  if (/[89a-f]/.test(lastChar)) {
    return 'B';
  }

  return 'A';
}

/**
 * Middleware для добавления информации о группе эксперимента
 */
function abTestMiddleware(req, res, next) {
  // Добавляем группу пользователя в объект req для использования в роутах
  if (req.user && req.user.user_id) {
    req.experimentGroup = getUserGroup(req.user.user_id);
  }

  // Перехватываем res.json для добавления информации о группе в ответы
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    // Добавляем информацию о группе только если есть авторизованный пользователь
    if (req.user && req.user.user_id) {
      const enhancedData = {
        ...data,
        experimentGroup: req.experimentGroup,
        experimentName: 'ab_test_2025'
      };
      return originalJson(enhancedData);
    }

    return originalJson(data);
  };

  next();
}

/**
 * Создает GTM event конфигурацию для фронтенда
 * @param {string} eventName - Название события
 * @param {string} group - Группа пользователя
 * @param {object} data - Дополнительные данные
 */
function createGTMEventConfig(eventName, group, data = {}) {
  return {
    event: `${eventName}_group_${group}`,
    experimentGroup: group,
    experimentName: 'ab_test_2025',
    timestamp: new Date().toISOString(),
    ...data
  };
}

module.exports = {
  abTestMiddleware,
  getUserGroup,
  createGTMEventConfig
};
