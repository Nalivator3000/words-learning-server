/**
 * Logger module for MCP server
 * Logs all agent activity to AGENT_LOGS.md
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'AGENT_LOGS.md');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_LOG_ENTRIES = 10000;

// In-memory stats
const stats = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  toolStats: {},
  endpointStats: {},
  errorStats: {},
  startTime: new Date().toISOString()
};

/**
 * Log an API call or tool invocation
 */
function log(entry) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...entry
  };

  // Update stats
  updateStats(logEntry);

  // Write to log file (async, non-blocking)
  writeLogEntry(logEntry);
}

/**
 * Update in-memory statistics
 */
function updateStats(entry) {
  stats.totalCalls++;

  // Tool stats
  if (entry.tool) {
    if (!stats.toolStats[entry.tool]) {
      stats.toolStats[entry.tool] = {
        calls: 0,
        success: 0,
        errors: 0,
        totalDuration: 0
      };
    }
    stats.toolStats[entry.tool].calls++;
    if (entry.error) {
      stats.toolStats[entry.tool].errors++;
      stats.failedCalls++;
    } else {
      stats.toolStats[entry.tool].success++;
      stats.successfulCalls++;
    }
    if (entry.duration) {
      stats.toolStats[entry.tool].totalDuration += entry.duration;
    }
  }

  // Endpoint stats (if it's an API call)
  if (entry.arguments && entry.arguments.path) {
    const endpoint = entry.arguments.path;
    if (!stats.endpointStats[endpoint]) {
      stats.endpointStats[endpoint] = {
        calls: 0,
        methods: {},
        avgStatus: 0,
        statusCodes: {}
      };
    }
    stats.endpointStats[endpoint].calls++;

    const method = entry.arguments.method || 'GET';
    stats.endpointStats[endpoint].methods[method] =
      (stats.endpointStats[endpoint].methods[method] || 0) + 1;

    if (entry.result && entry.result.status) {
      const status = entry.result.status;
      stats.endpointStats[endpoint].statusCodes[status] =
        (stats.endpointStats[endpoint].statusCodes[status] || 0) + 1;
    }
  }

  // Error stats
  if (entry.error) {
    const errorType = entry.error.substring(0, 50); // First 50 chars
    if (!stats.errorStats[errorType]) {
      stats.errorStats[errorType] = {
        count: 0,
        lastOccurrence: null
      };
    }
    stats.errorStats[errorType].count++;
    stats.errorStats[errorType].lastOccurrence = entry.timestamp;
  }
}

/**
 * Write log entry to file
 */
function writeLogEntry(entry) {
  try {
    // Check if we need to rotate log file
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        rotateLogFile();
      }
    }

    // Format log entry
    const logLine = `\n### ${entry.timestamp}\n\n` +
      '```json\n' +
      JSON.stringify(entry, null, 2) +
      '\n```\n';

    // Append to log file
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (error) {
    console.error('Failed to write log:', error.message);
  }
}

/**
 * Rotate log file when it gets too large
 */
function rotateLogFile() {
  try {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const archiveFile = path.join(
      __dirname,
      `AGENT_LOGS.archive.${timestamp}.md`
    );

    // Move current log to archive
    fs.renameSync(LOG_FILE, archiveFile);

    // Create new log file with header
    const header = `# 📋 Agent Activity Logs - LexyBooster API MCP Server

[New log file created after rotation]

**Created:** ${new Date().toISOString()}
**Previous logs:** AGENT_LOGS.archive.${timestamp}.md

---

## 🔍 Recent Logs

`;
    fs.writeFileSync(LOG_FILE, header);

    console.log(`Log file rotated: ${archiveFile}`);
  } catch (error) {
    console.error('Failed to rotate log file:', error.message);
  }
}

/**
 * Get current statistics
 */
function getStats() {
  // Calculate averages
  const toolStatsWithAvg = {};
  for (const [tool, data] of Object.entries(stats.toolStats)) {
    toolStatsWithAvg[tool] = {
      ...data,
      avgDuration: data.calls > 0 ? Math.round(data.totalDuration / data.calls) : 0,
      successRate: data.calls > 0 ? Math.round((data.success / data.calls) * 100) : 0
    };
  }

  return {
    summary: {
      totalCalls: stats.totalCalls,
      successfulCalls: stats.successfulCalls,
      failedCalls: stats.failedCalls,
      successRate: stats.totalCalls > 0
        ? Math.round((stats.successfulCalls / stats.totalCalls) * 100)
        : 0,
      uptime: calculateUptime(stats.startTime)
    },
    tools: toolStatsWithAvg,
    endpoints: stats.endpointStats,
    errors: stats.errorStats
  };
}

/**
 * Calculate uptime
 */
function calculateUptime(startTime) {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

/**
 * Update statistics table in log file
 */
function updateStatsInLogFile() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;

    const currentStats = getStats();
    const content = fs.readFileSync(LOG_FILE, 'utf8');

    // Find the statistics section
    const statsTableRegex = /### Самые популярные инструменты[\s\S]*?(?=\n###|\n---|\n\n##|$)/;

    // Build new stats table
    const statsTable = buildStatsTable(currentStats);

    // Replace or append stats
    let newContent;
    if (statsTableRegex.test(content)) {
      newContent = content.replace(statsTableRegex, statsTable);
    } else {
      // Append stats at the end
      newContent = content + '\n\n' + statsTable;
    }

    fs.writeFileSync(LOG_FILE, newContent);
  } catch (error) {
    console.error('Failed to update stats:', error.message);
  }
}

/**
 * Build statistics markdown table
 */
function buildStatsTable(stats) {
  let table = '### Самые популярные инструменты\n\n';
  table += '| Инструмент | Вызовов | Успешно | Ошибок | Среднее время (мс) |\n';
  table += '|-----------|---------|---------|--------|-------------------|\n';

  for (const [tool, data] of Object.entries(stats.tools)) {
    table += `| \`${tool}\` | ${data.calls} | ${data.success} | ${data.errors} | ${data.avgDuration} |\n`;
  }

  table += '\n### Самые используемые эндпоинты\n\n';
  table += '| Эндпоинт | Вызовов | Метод | Статусы |\n';
  table += '|----------|---------|-------|----------|\n';

  for (const [endpoint, data] of Object.entries(stats.endpoints)) {
    const methods = Object.keys(data.methods).join(', ');
    const statusCodes = Object.entries(data.statusCodes)
      .map(([code, count]) => `${code}:${count}`)
      .join(', ');
    table += `| \`${endpoint}\` | ${data.calls} | ${methods} | ${statusCodes} |\n`;
  }

  if (Object.keys(stats.errors).length > 0) {
    table += '\n### Ошибки и проблемы\n\n';
    table += '| Ошибка | Количество | Последнее появление |\n';
    table += '|--------|-----------|--------------------|\n';

    for (const [error, data] of Object.entries(stats.errors)) {
      table += `| ${error} | ${data.count} | ${data.lastOccurrence} |\n`;
    }
  }

  table += `\n**Последнее обновление:** ${new Date().toISOString()}\n`;
  table += `**Всего записей:** ${stats.summary.totalCalls}\n`;
  table += `**Success rate:** ${stats.summary.successRate}%\n`;
  table += `**Uptime:** ${stats.summary.uptime}\n`;

  return table;
}

// Update stats in log file periodically (every 10 calls)
let callCounter = 0;
const originalLog = log;
module.exports.log = function(...args) {
  originalLog(...args);
  callCounter++;
  if (callCounter % 10 === 0) {
    updateStatsInLogFile();
  }
};

module.exports = {
  log,
  getStats,
  updateStatsInLogFile
};
