#!/usr/bin/env node
/**
 * LexyBooster API MCP Server
 * Provides access to all LexyBooster API endpoints for AI agents
 *
 * This MCP server exposes:
 * - Test accounts and credentials
 * - All API endpoints (auth, word-sets, gamification, analytics)
 * - Helper functions for testing and data retrieval
 */

const https = require('https');
const http = require('http');
const logger = require('./logger');

// Configuration
const BASE_URL = process.env.LEXYBOOSTER_BASE_URL || 'https://lexybooster.com';
const RATE_LIMIT_DELAY = 1000; // ms between requests

// Test accounts configuration
const TEST_ACCOUNTS = {
  HIGH_PRIORITY: [
    { email: 'test.de.en@lexibooster.test', password: 'test123', from: 'de', to: 'en', userId: 50 },
    { email: 'test.de.ru@lexibooster.test', password: 'test123', from: 'de', to: 'ru', userId: 51 },
    { email: 'test.en.ru@lexibooster.test', password: 'test123', from: 'en', to: 'ru', userId: 60 },
    { email: 'test.en.de@lexibooster.test', password: 'test123', from: 'en', to: 'de', userId: 61 },
  ],
  MEDIUM_PRIORITY: [
    { email: 'test.de.es@lexibooster.test', password: 'test123', from: 'de', to: 'es', userId: 52 },
    { email: 'test.de.fr@lexibooster.test', password: 'test123', from: 'de', to: 'fr', userId: 53 },
    { email: 'test.en.es@lexibooster.test', password: 'test123', from: 'en', to: 'es', userId: 62 },
    { email: 'test.hi.en@lexibooster.test', password: 'test123', from: 'hi', to: 'en', userId: 87 },
    { email: 'test.hi.de@lexibooster.test', password: 'test123', from: 'hi', to: 'de', userId: 88 },
  ],
  LOW_PRIORITY: [
    { email: 'test.ar.en@lexibooster.test', password: 'test123', from: 'ar', to: 'en', userId: 81, rtl: true },
    { email: 'test.zh.en@lexibooster.test', password: 'test123', from: 'zh', to: 'en', userId: 83 },
  ],
  EMPTY: [
    { email: 'test.ru.en@lexibooster.test', password: 'test123', from: 'ru', to: 'en', userId: 85 },
    { email: 'test.ru.de@lexibooster.test', password: 'test123', from: 'ru', to: 'de', userId: 86 },
  ]
};

// API Endpoints catalog
const API_ENDPOINTS = {
  AUTH: {
    login: { method: 'POST', path: '/api/auth/login', public: true },
    register: { method: 'POST', path: '/api/auth/register', public: true },
    logout: { method: 'POST', path: '/api/auth/logout', requiresAuth: true },
    user: { method: 'GET', path: '/api/auth/user', requiresAuth: true },
    googleAuth: { method: 'GET', path: '/auth/google', public: true },
  },
  WORD_SETS: {
    list: { method: 'GET', path: '/api/word-sets', public: true },
    get: { method: 'GET', path: '/api/word-sets/:setId', public: true },
    create: { method: 'POST', path: '/api/word-sets', requiresAuth: true },
    import: { method: 'POST', path: '/api/word-sets/:setId/import', requiresAuth: true },
    preview: { method: 'GET', path: '/api/word-sets/:setId/preview', public: true },
    batchPreview: { method: 'POST', path: '/api/word-sets/previews/batch', public: true },
    delete: { method: 'DELETE', path: '/api/word-sets/:setId', requiresAuth: true },
  },
  GAMIFICATION: {
    leaderboardGlobal: { method: 'GET', path: '/api/gamification/leaderboard/global', public: true },
    leaderboardWeekly: { method: 'GET', path: '/api/gamification/leaderboard/weekly', public: true },
    achievements: { method: 'GET', path: '/api/gamification/achievements', public: true },
    stats: { method: 'GET', path: '/api/gamification/stats/:userId', requiresAuth: true },
    xpLog: { method: 'GET', path: '/api/gamification/xp-log/:userId', requiresAuth: true },
    activity: { method: 'GET', path: '/api/gamification/activity/:userId', requiresAuth: true },
    userAchievements: { method: 'GET', path: '/api/gamification/achievements/:userId', requiresAuth: true },
    dailyGoals: { method: 'GET', path: '/api/gamification/daily-goals/:userId', requiresAuth: true },
  },
  ANALYTICS: {
    progress: { method: 'GET', path: '/api/analytics/progress/:userId', requiresAuth: true },
    exerciseStats: { method: 'GET', path: '/api/analytics/exercise-stats/:userId', requiresAuth: true },
    difficultWords: { method: 'GET', path: '/api/analytics/difficult-words/:userId', requiresAuth: true },
    studyTime: { method: 'GET', path: '/api/analytics/study-time/:userId', requiresAuth: true },
  },
  LANGUAGE_PAIRS: {
    list: { method: 'GET', path: '/api/users/:userId/language-pairs', requiresAuth: true },
    create: { method: 'POST', path: '/api/users/:userId/language-pairs', requiresAuth: true },
    activate: { method: 'PUT', path: '/api/users/:userId/language-pairs/:pairId/activate', requiresAuth: true },
    wordCount: { method: 'GET', path: '/api/users/:userId/language-pairs/:pairId/word-count', requiresAuth: true },
    delete: { method: 'DELETE', path: '/api/users/:userId/language-pairs/:pairId', requiresAuth: true },
  },
  COLLECTIONS: {
    globalList: { method: 'GET', path: '/api/global-collections', public: true },
    globalGet: { method: 'GET', path: '/api/global-collections/:collectionId', public: true },
    globalImport: { method: 'POST', path: '/api/global-collections/:collectionId/import', requiresAuth: true },
    universalList: { method: 'GET', path: '/api/universal-collections', public: true },
    universalGet: { method: 'GET', path: '/api/universal-collections/:collectionId', public: true },
    universalImport: { method: 'POST', path: '/api/universal-collections/:collectionId/import', requiresAuth: true },
  }
};

/**
 * Make HTTP/HTTPS request
 */
function request(method, path, data = null, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = BASE_URL.startsWith('https');
    const protocol = isHttps ? https : http;
    const url = new URL(path, BASE_URL);

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const requestOptions = {
      method,
      headers,
      timeout: options.timeout || 15000
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.headers,
            raw: body
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: body,
            headers: res.headers,
            raw: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * MCP Server Tools
 */
const tools = {
  // Get test accounts
  get_test_accounts: {
    description: 'Get all test accounts organized by priority. Returns email, password, language pair, and user ID for each account.',
    inputSchema: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          enum: ['all', 'high', 'medium', 'low', 'empty'],
          description: 'Filter by priority level. Use "all" to get all accounts.'
        }
      }
    },
    handler: async (args) => {
      const startTime = Date.now();
      try {
        const priority = args.priority || 'all';

        let result;
        if (priority === 'all') {
          result = TEST_ACCOUNTS;
        } else {
          const priorityMap = {
            high: TEST_ACCOUNTS.HIGH_PRIORITY,
            medium: TEST_ACCOUNTS.MEDIUM_PRIORITY,
            low: TEST_ACCOUNTS.LOW_PRIORITY,
            empty: TEST_ACCOUNTS.EMPTY
          };
          result = priorityMap[priority.toLowerCase()] || [];
        }

        // Log successful call
        logger.log({
          tool: 'get_test_accounts',
          arguments: args,
          result: { count: Array.isArray(result) ? result.length : Object.keys(result).length },
          duration: Date.now() - startTime,
          error: null
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        // Log error
        logger.log({
          tool: 'get_test_accounts',
          arguments: args,
          result: null,
          duration: Date.now() - startTime,
          error: error.message
        });
        throw error;
      }
    }
  },

  // List available API endpoints
  list_api_endpoints: {
    description: 'List all available API endpoints with their methods, paths, and authentication requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'auth', 'word_sets', 'gamification', 'analytics', 'language_pairs', 'collections'],
          description: 'Filter endpoints by category'
        }
      }
    },
    handler: async (args) => {
      const category = args.category || 'all';

      if (category === 'all') {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(API_ENDPOINTS, null, 2)
          }]
        };
      }

      const categoryMap = {
        auth: API_ENDPOINTS.AUTH,
        word_sets: API_ENDPOINTS.WORD_SETS,
        gamification: API_ENDPOINTS.GAMIFICATION,
        analytics: API_ENDPOINTS.ANALYTICS,
        language_pairs: API_ENDPOINTS.LANGUAGE_PAIRS,
        collections: API_ENDPOINTS.COLLECTIONS
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(categoryMap[category] || {}, null, 2)
        }]
      };
    }
  },

  // Call any API endpoint
  api_call: {
    description: 'Make a request to any LexyBooster API endpoint. Supports GET, POST, PUT, DELETE methods.',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'HTTP method'
        },
        path: {
          type: 'string',
          description: 'API path (e.g., /api/word-sets or /api/gamification/leaderboard/global)'
        },
        data: {
          type: 'object',
          description: 'Request body for POST/PUT requests'
        },
        headers: {
          type: 'object',
          description: 'Additional headers (e.g., Authorization)'
        }
      },
      required: ['method', 'path']
    },
    handler: async (args) => {
      const startTime = Date.now();
      try {
        const result = await request(
          args.method,
          args.path,
          args.data || null,
          { headers: args.headers || {} }
        );

        // Rate limiting
        await sleep(RATE_LIMIT_DELAY);

        const duration = Date.now() - startTime;

        // Log successful call
        logger.log({
          tool: 'api_call',
          arguments: args,
          result: {
            status: result.status,
            bodySize: result.raw ? result.raw.length : 0
          },
          duration,
          error: null
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: result.status,
              headers: result.headers,
              body: result.body
            }, null, 2)
          }]
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log error
        logger.log({
          tool: 'api_call',
          arguments: args,
          result: null,
          duration,
          error: error.message
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: error.message,
              stack: error.stack
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  // Login with test account
  login: {
    description: 'Login with a test account and get session token. Returns user data and authentication status.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Test account email (e.g., test.de.en@lexibooster.test)'
        },
        password: {
          type: 'string',
          description: 'Account password (default: test123)'
        }
      },
      required: ['email']
    },
    handler: async (args) => {
      try {
        const password = args.password || 'test123';
        const result = await request('POST', '/api/auth/login', {
          email: args.email,
          password: password
        });

        await sleep(RATE_LIMIT_DELAY);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: result.status,
              success: result.status === 200,
              user: result.body.user || null,
              message: result.body.message || null
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  // Get word sets
  get_word_sets: {
    description: 'Get word sets for a user. Can filter by language pair.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'User ID (from test accounts)'
        },
        fromLang: {
          type: 'string',
          description: 'Source language code (e.g., de, en)'
        },
        toLang: {
          type: 'string',
          description: 'Target language code (e.g., en, ru)'
        }
      }
    },
    handler: async (args) => {
      try {
        let path = '/api/word-sets';
        const params = [];

        if (args.userId) params.push(`userId=${args.userId}`);
        if (args.fromLang) params.push(`fromLang=${args.fromLang}`);
        if (args.toLang) params.push(`toLang=${args.toLang}`);

        if (params.length > 0) {
          path += '?' + params.join('&');
        }

        const result = await request('GET', path);
        await sleep(RATE_LIMIT_DELAY);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: Array.isArray(result.body) ? result.body.length : 0,
              wordSets: result.body
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: error.message }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  // Get leaderboard
  get_leaderboard: {
    description: 'Get global or weekly leaderboard data.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['global', 'weekly'],
          description: 'Leaderboard type'
        }
      },
      required: ['type']
    },
    handler: async (args) => {
      try {
        const path = `/api/gamification/leaderboard/${args.type}`;
        const result = await request('GET', path);
        await sleep(RATE_LIMIT_DELAY);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              type: args.type,
              count: Array.isArray(result.body) ? result.body.length : 0,
              leaderboard: result.body
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: error.message }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  // Get user stats
  get_user_stats: {
    description: 'Get comprehensive statistics for a user (gamification, progress, analytics).',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'User ID'
        },
        category: {
          type: 'string',
          enum: ['all', 'gamification', 'progress', 'exercise', 'difficult'],
          description: 'Type of stats to retrieve'
        }
      },
      required: ['userId']
    },
    handler: async (args) => {
      try {
        const category = args.category || 'all';
        const results = {};

        if (category === 'all' || category === 'gamification') {
          const stats = await request('GET', `/api/gamification/stats/${args.userId}`);
          results.gamification = stats.body;
          await sleep(RATE_LIMIT_DELAY);
        }

        if (category === 'all' || category === 'progress') {
          const progress = await request('GET', `/api/analytics/progress/${args.userId}`);
          results.progress = progress.body;
          await sleep(RATE_LIMIT_DELAY);
        }

        if (category === 'all' || category === 'exercise') {
          const exercise = await request('GET', `/api/analytics/exercise-stats/${args.userId}`);
          results.exercise = exercise.body;
          await sleep(RATE_LIMIT_DELAY);
        }

        if (category === 'all' || category === 'difficult') {
          const difficult = await request('GET', `/api/analytics/difficult-words/${args.userId}`);
          results.difficult = difficult.body;
          await sleep(RATE_LIMIT_DELAY);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: error.message }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
};

/**
 * MCP Server Implementation
 */
async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  // Send initialize response
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'lexybooster-api',
        version: '1.0.0'
      },
      capabilities: {
        tools: {}
      }
    }
  }) + '\n');

  // Handle requests
  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);

      // List tools
      if (request.method === 'tools/list') {
        const toolsList = Object.entries(tools).map(([name, config]) => ({
          name,
          description: config.description,
          inputSchema: config.inputSchema
        }));

        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: { tools: toolsList }
        }) + '\n');
        return;
      }

      // Call tool
      if (request.method === 'tools/call') {
        const toolName = request.params.name;
        const tool = tools[toolName];

        if (!tool) {
          process.stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Tool not found: ${toolName}`
            }
          }) + '\n');
          return;
        }

        const result = await tool.handler(request.params.arguments || {});

        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result
        }) + '\n');
      }
    } catch (error) {
      process.stderr.write(`Error: ${error.message}\n`);
    }
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { tools, request, TEST_ACCOUNTS, API_ENDPOINTS };
