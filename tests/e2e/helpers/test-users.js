/**
 * Test Users Configuration
 * All test users have password: test123
 */

const TEST_PASSWORD = 'test123';

/**
 * Language pair configurations
 */
const LANGUAGE_PAIRS = {
  // High Priority - Full testing
  HIGH_PRIORITY: [
    { username: 'test_de_en', from: 'de', to: 'en', fromName: 'German', toName: 'English', wordSets: 17, hasThemes: true },
    { username: 'test_de_ru', from: 'de', to: 'ru', fromName: 'German', toName: 'Russian', wordSets: 17, hasThemes: true },
    { username: 'test_en_ru', from: 'en', to: 'ru', fromName: 'English', toName: 'Russian', wordSets: 6, hasThemes: false },
    { username: 'test_en_de', from: 'en', to: 'de', fromName: 'English', toName: 'German', wordSets: 6, hasThemes: false },
  ],

  // Medium Priority - Core features
  MEDIUM_PRIORITY: [
    { username: 'test_de_es', from: 'de', to: 'es', fromName: 'German', toName: 'Spanish', wordSets: 17, hasThemes: true },
    { username: 'test_de_fr', from: 'de', to: 'fr', fromName: 'German', toName: 'French', wordSets: 17, hasThemes: true },
    { username: 'test_en_es', from: 'en', to: 'es', fromName: 'English', toName: 'Spanish', wordSets: 6, hasThemes: false },
    { username: 'test_hi_en', from: 'hi', to: 'en', fromName: 'Hindi', toName: 'English', wordSets: 16, hasThemes: true },
    { username: 'test_hi_de', from: 'hi', to: 'de', fromName: 'Hindi', toName: 'German', wordSets: 16, hasThemes: true },
  ],

  // Low Priority - Smoke testing
  LOW_PRIORITY: [
    { username: 'test_ar_en', from: 'ar', to: 'en', fromName: 'Arabic', toName: 'English', wordSets: 6, hasThemes: false, rtl: true },
    { username: 'test_zh_en', from: 'zh', to: 'en', fromName: 'Chinese', toName: 'English', wordSets: 6, hasThemes: false },
    { username: 'test_ja_en', from: 'ja', to: 'en', fromName: 'Japanese', toName: 'English', wordSets: 6, hasThemes: false },
  ],

  // No word sets - Empty state testing
  EMPTY_SETS: [
    { username: 'test_ru_en', from: 'ru', to: 'en', fromName: 'Russian', toName: 'English', wordSets: 0, hasThemes: false },
    { username: 'test_ru_de', from: 'ru', to: 'de', fromName: 'Russian', toName: 'German', wordSets: 0, hasThemes: false },
  ],
};

/**
 * Expected word set structures
 */
const WORD_SET_EXPECTATIONS = {
  GERMAN: {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'beginner'],
    themes: ['communication', 'culture', 'economics', 'education', 'general', 'law', 'philosophy', 'politics', 'science', 'work'],
    totalSets: 17,
    levelCounts: {
      A1: 1000,
      A2: 1000,
      B1: 1500,
      B2: 2000,
      C1: 2499,
      C2: 2000,
      beginner: 1399,
    },
  },

  HINDI: {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    themes: ['communication', 'culture', 'economics', 'education', 'general', 'law', 'philosophy', 'politics', 'science', 'work'],
    totalSets: 16,
    levelCounts: {
      A1: 1000,
      A2: 1000,
      B1: 1500,
      B2: 2000,
      C1: 2499,
      C2: 2000,
    },
    themeCounts: {
      communication: 99,
      culture: 999,
      economics: 599,
      education: 1499,
      general: 2999,
      law: 499,
      philosophy: 299,
      politics: 999,
      science: 1199,
      work: 799,
    },
  },

  ENGLISH: {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    themes: [],
    totalSets: 6,
  },

  OTHER: {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    themes: [],
    totalSets: 6,
  },
};

/**
 * Get all test users
 */
function getAllTestUsers() {
  return [
    ...LANGUAGE_PAIRS.HIGH_PRIORITY,
    ...LANGUAGE_PAIRS.MEDIUM_PRIORITY,
    ...LANGUAGE_PAIRS.LOW_PRIORITY,
    ...LANGUAGE_PAIRS.EMPTY_SETS,
  ];
}

/**
 * Get test users by priority
 */
function getTestUsersByPriority(priority) {
  const priorityMap = {
    high: LANGUAGE_PAIRS.HIGH_PRIORITY,
    medium: LANGUAGE_PAIRS.MEDIUM_PRIORITY,
    low: LANGUAGE_PAIRS.LOW_PRIORITY,
    empty: LANGUAGE_PAIRS.EMPTY_SETS,
  };

  return priorityMap[priority.toLowerCase()] || [];
}

/**
 * Get expected word sets for a language
 */
function getExpectedWordSets(languageCode) {
  const langMap = {
    de: WORD_SET_EXPECTATIONS.GERMAN,
    hi: WORD_SET_EXPECTATIONS.HINDI,
    en: WORD_SET_EXPECTATIONS.ENGLISH,
  };

  return langMap[languageCode] || WORD_SET_EXPECTATIONS.OTHER;
}

/**
 * Get test user by username
 */
function getTestUser(username) {
  const allUsers = getAllTestUsers();
  return allUsers.find(user => user.username === username);
}

/**
 * Get users with themes
 */
function getUsersWithThemes() {
  return getAllTestUsers().filter(user => user.hasThemes);
}

/**
 * Get users without word sets
 */
function getUsersWithoutWordSets() {
  return LANGUAGE_PAIRS.EMPTY_SETS;
}

/**
 * Get RTL language users
 */
function getRTLUsers() {
  return getAllTestUsers().filter(user => user.rtl);
}

module.exports = {
  TEST_PASSWORD,
  LANGUAGE_PAIRS,
  WORD_SET_EXPECTATIONS,
  getAllTestUsers,
  getTestUsersByPriority,
  getExpectedWordSets,
  getTestUser,
  getUsersWithThemes,
  getUsersWithoutWordSets,
  getRTLUsers,
};
