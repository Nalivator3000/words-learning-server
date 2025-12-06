#!/usr/bin/env node

/**
 * Script 3: Find users without transactions before a specific date
 *
 * Usage: node 3-find-users-without-early-transactions.js <input-csv-file> <cutoff-date> [output-file]
 *
 * Example:
 *   node 3-find-users-without-early-transactions.js pixels-data.csv "2025-11-19 13:15:00" users-after-date.txt
 *   node 3-find-users-without-early-transactions.js pixels-data.csv "2025-11-19" users-after-date.txt
 *
 * This script finds users whose FIRST transaction is on or after the cutoff date
 */

const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseDate(dateStr) {
  // Format: "2025-11-19 13:11:23 +0000 UTC"
  // or: "2025-11-19"
  const cleanDate = dateStr.trim().split(' +')[0]; // Remove timezone
  return new Date(cleanDate);
}

function findUsersWithoutEarlyTransactions(inputFile, cutoffDateStr, outputFile) {
  console.log(`Reading CSV file: ${inputFile}`);
  console.log(`Cutoff date: ${cutoffDateStr}`);

  const cutoffDate = parseDate(cutoffDateStr);

  if (isNaN(cutoffDate.getTime())) {
    console.error('Error: Invalid date format');
    console.error('Expected format: "2025-11-19 13:15:00" or "2025-11-19"');
    process.exit(1);
  }

  console.log(`Parsed cutoff date: ${cutoffDate.toISOString()}`);

  // Read CSV
  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.error('Error: Empty CSV file');
    process.exit(1);
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const userIdIndex = headers.indexOf('EXTERNAL_USER_ID');
  const eventTsIndex = headers.indexOf('EVENT_TS');

  if (userIdIndex === -1) {
    console.error('Error: EXTERNAL_USER_ID column not found');
    process.exit(1);
  }

  if (eventTsIndex === -1) {
    console.error('Error: EVENT_TS column not found');
    process.exit(1);
  }

  console.log(`Found EXTERNAL_USER_ID at column ${userIdIndex}`);
  console.log(`Found EVENT_TS at column ${eventTsIndex}`);

  // Track earliest transaction per user
  const userEarliestTransaction = new Map(); // userId -> {date, amount, transaction}

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);
    const userId = values[userIdIndex]?.trim();
    const eventTs = values[eventTsIndex]?.trim();

    if (!userId || !eventTs) continue;

    const transactionDate = parseDate(eventTs);

    if (isNaN(transactionDate.getTime())) {
      console.warn(`Warning: Invalid date at line ${i + 1}: ${eventTs}`);
      continue;
    }

    // Track earliest transaction for this user
    if (!userEarliestTransaction.has(userId)) {
      userEarliestTransaction.set(userId, {
        date: transactionDate,
        timestamp: eventTs,
        line: line
      });
    } else {
      const existing = userEarliestTransaction.get(userId);
      if (transactionDate < existing.date) {
        userEarliestTransaction.set(userId, {
          date: transactionDate,
          timestamp: eventTs,
          line: line
        });
      }
    }
  }

  console.log(`\nProcessed ${lines.length - 1} transactions`);
  console.log(`Found ${userEarliestTransaction.size} unique users`);

  // Find users without transactions before cutoff date
  const usersWithoutEarlyTransactions = [];
  const usersWithEarlyTransactions = [];

  for (const [userId, data] of userEarliestTransaction.entries()) {
    if (data.date >= cutoffDate) {
      usersWithoutEarlyTransactions.push({
        userId,
        firstTransactionDate: data.date,
        firstTransactionTimestamp: data.timestamp
      });
    } else {
      usersWithEarlyTransactions.push(userId);
    }
  }

  // Sort by first transaction date
  usersWithoutEarlyTransactions.sort((a, b) => a.firstTransactionDate - b.firstTransactionDate);

  console.log(`\n=== Results ===`);
  console.log(`Users WITHOUT transactions before ${cutoffDateStr}: ${usersWithoutEarlyTransactions.length}`);
  console.log(`Users WITH transactions before ${cutoffDateStr}: ${usersWithEarlyTransactions.length}`);

  // Write output
  if (outputFile) {
    const outputLines = usersWithoutEarlyTransactions.map(user =>
      `${user.userId}\t${user.firstTransactionTimestamp}`
    );
    fs.writeFileSync(outputFile, outputLines.join('\n') + '\n', 'utf-8');
    console.log(`\nUser IDs saved to: ${outputFile}`);
    console.log('Format: USER_ID<tab>FIRST_TRANSACTION_DATE');
  } else {
    console.log('\n=== Users Without Early Transactions ===');
    usersWithoutEarlyTransactions.slice(0, 50).forEach(user => {
      console.log(`${user.userId}\t${user.firstTransactionTimestamp}`);
    });
    if (usersWithoutEarlyTransactions.length > 50) {
      console.log(`\n... and ${usersWithoutEarlyTransactions.length - 50} more`);
    }
  }

  // Statistics
  console.log('\n=== Statistics ===');
  console.log(`Total unique users: ${userEarliestTransaction.size}`);
  console.log(`Users with first transaction BEFORE cutoff: ${usersWithEarlyTransactions.length} (${((usersWithEarlyTransactions.length / userEarliestTransaction.size) * 100).toFixed(1)}%)`);
  console.log(`Users with first transaction ON/AFTER cutoff: ${usersWithoutEarlyTransactions.length} (${((usersWithoutEarlyTransactions.length / userEarliestTransaction.size) * 100).toFixed(1)}%)`);

  if (usersWithoutEarlyTransactions.length > 0) {
    const firstUser = usersWithoutEarlyTransactions[0];
    const lastUser = usersWithoutEarlyTransactions[usersWithoutEarlyTransactions.length - 1];
    console.log(`\nEarliest first transaction in results: ${firstUser.firstTransactionTimestamp}`);
    console.log(`Latest first transaction in results: ${lastUser.firstTransactionTimestamp}`);
  }
}

// Main
if (process.argv.length < 4) {
  console.error('Usage: node 3-find-users-without-early-transactions.js <input-csv-file> <cutoff-date> [output-file]');
  console.error('\nExample:');
  console.error('  node 3-find-users-without-early-transactions.js pixels-data.csv "2025-11-19 13:15:00" users-after-date.txt');
  console.error('  node 3-find-users-without-early-transactions.js pixels-data.csv "2025-11-19" users-after-date.txt');
  console.error('\nThis finds users whose FIRST transaction is on or after the cutoff date');
  process.exit(1);
}

const inputFile = process.argv[2];
const cutoffDate = process.argv[3];
const outputFile = process.argv[4];

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

try {
  findUsersWithoutEarlyTransactions(inputFile, cutoffDate, outputFile);
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
