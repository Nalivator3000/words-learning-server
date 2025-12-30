/**
 * A/B Test - Google Tag Manager Integration
 *
 * Клиентский скрипт для отправки событий в GTM
 * в зависимости от группы пользователя
 */

(function() {
  'use strict';

  // Хранилище для информации о группе пользователя
  let userExperimentGroup = null;

  /**
   * Определяет группу пользователя по UUID
   * @param {string} uuid - UUID пользователя
   * @returns {'A' | 'B'}
   */
  function getUserGroup(uuid) {
    if (!uuid) return 'A';

    const lastChar = uuid.toLowerCase().slice(-1);

    // Группа A: 0-7
    if (/[0-7]/.test(lastChar)) {
      return 'A';
    }

    // Группа B: 8-9, a-f
    if (/[89a-f]/.test(lastChar)) {
      return 'B';
    }

    return 'A';
  }

  /**
   * Инициализирует GTM tracking для A/B теста
   * @param {string} userId - UUID пользователя
   */
  function initABTest(userId) {
    if (!userId) {
      console.warn('[AB Test] No user ID provided');
      return;
    }

    userExperimentGroup = getUserGroup(userId);

    // Сохраняем группу в localStorage для персистентности
    localStorage.setItem('experimentGroup', userExperimentGroup);

    console.log(`[AB Test] User assigned to group: ${userExperimentGroup}`);

    // Отправляем начальное событие о назначении группы
    pushGTMEvent('user_group_assigned', {
      userId: userId,
      userIdLastChar: userId.slice(-1)
    });
  }

  /**
   * Отправляет событие в GTM с учетом группы пользователя
   * @param {string} eventName - Название события
   * @param {object} eventData - Дополнительные данные события
   */
  function pushGTMEvent(eventName, eventData = {}) {
    if (!window.dataLayer) {
      console.warn('[AB Test] GTM dataLayer not found');
      return;
    }

    // Если группа не определена, пытаемся взять из localStorage
    if (!userExperimentGroup) {
      userExperimentGroup = localStorage.getItem('experimentGroup') || 'A';
    }

    const gtmEvent = {
      event: `${eventName}_group_${userExperimentGroup}`,
      experimentGroup: userExperimentGroup,
      experimentName: 'ab_test_2025',
      timestamp: new Date().toISOString(),
      ...eventData
    };

    console.log('[AB Test] Pushing GTM event:', gtmEvent);
    window.dataLayer.push(gtmEvent);
  }

  /**
   * Трекинг событий для каждой группы
   */
  const ABTestEvents = {
    // Регистрация пользователя
    userRegistered: (data) => pushGTMEvent('user_registered', data),

    // Вход пользователя
    userLogin: (data) => pushGTMEvent('user_login', data),

    // Начало изучения слова
    wordStudyStarted: (data) => pushGTMEvent('word_study_started', data),

    // Слово выучено
    wordLearned: (data) => pushGTMEvent('word_learned', data),

    // Начало упражнения
    exerciseStarted: (data) => pushGTMEvent('exercise_started', data),

    // Упражнение завершено
    exerciseCompleted: (data) => pushGTMEvent('exercise_completed', data),

    // Просмотр статистики
    statsViewed: (data) => pushGTMEvent('stats_viewed', data),

    // Добавление слова в избранное
    wordFavorited: (data) => pushGTMEvent('word_favorited', data),

    // Прослушивание произношения
    audioPlayed: (data) => pushGTMEvent('audio_played', data),

    // Смена темы
    themeChanged: (data) => pushGTMEvent('theme_changed', data),

    // Просмотр коллекции
    collectionViewed: (data) => pushGTMEvent('collection_viewed', data),

    // Пользовательское событие
    custom: (eventName, data) => pushGTMEvent(eventName, data)
  };

  /**
   * Получает текущую группу пользователя
   * @returns {string|null}
   */
  function getExperimentGroup() {
    return userExperimentGroup || localStorage.getItem('experimentGroup');
  }

  /**
   * Проверяет, находится ли пользователь в определенной группе
   * @param {string} group - 'A' или 'B'
   * @returns {boolean}
   */
  function isInGroup(group) {
    const currentGroup = getExperimentGroup();
    return currentGroup === group;
  }

  // Экспортируем API
  window.ABTest = {
    init: initABTest,
    track: ABTestEvents,
    getGroup: getExperimentGroup,
    isInGroup: isInGroup,
    pushEvent: pushGTMEvent
  };

  // Автоматическая инициализация при загрузке страницы
  document.addEventListener('DOMContentLoaded', function() {
    // Пытаемся получить userId из глобального объекта или API
    const userId = window.currentUser?.user_id || localStorage.getItem('userId');

    if (userId) {
      initABTest(userId);
    }
  });

  console.log('[AB Test] GTM integration loaded');
})();
