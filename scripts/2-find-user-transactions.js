#!/usr/bin/env node

/**
 * Script 2: Find all transactions for a list of user IDs
 *
 * Usage: node 2-find-user-transactions.js <input-csv-file> <user-ids-file> [output-file]
 *
 * Example:
 *   node 2-find-user-transactions.js pixels-data.csv user-ids.txt user-transactions.csv
 *   node 2-find-user-transactions.js pixels-data.csv user-ids.txt
 *
 * user-ids-file format: one user ID per line
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

function loadUserIds(userIdsFile) {
  const content = fs.readFileSync(userIdsFile, 'utf-8');
  const userIds = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line);

  return new Set(userIds);
}

function findUserTransactions(inputFile, userIdsFile, outputFile) {
  console.log(`Reading CSV file: ${inputFile}`);
  console.log(`Reading user IDs from: ${userIdsFile}`);

  // Load user IDs to search
  const targetUserIds = loadUserIds(userIdsFile);
  console.log(`Loaded ${targetUserIds.size} user IDs to search`);

  // Read CSV
  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.error('Error: Empty CSV file');
    process.exit(1);
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const userIdIndex = headers.indexOf('EXTERNAL_USER_ID');
  const eventTsIndex = headers.indexOf('EVENT_TS');
  const depositAmountIndex = headers.indexOf('DEPOSIT_AMOUNT');
  const currencyIndex = headers.indexOf('CURRENCY');

  if (userIdIndex === -1) {
    console.error('Error: EXTERNAL_USER_ID column not found');
    process.exit(1);
  }

  console.log(`Found EXTERNAL_USER_ID at column ${userIdIndex}`);

  // Find matching transactions
  const matchingLines = [headerLine];
  const userTransactionCounts = new Map();
  let totalAmount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);
    const userId = values[userIdIndex]?.trim();

    if (userId && targetUserIds.has(userId)) {
      matchingLines.push(line);

      // Count transactions per user
      userTransactionCounts.set(userId, (userTransactionCounts.get(userId) || 0) + 1);

      // Sum deposit amounts
      const amount = parseFloat(values[depositAmountIndex]) || 0;
      totalAmount += amount;
    }
  }

  console.log(`\nFound ${matchingLines.length - 1} transactions for ${userTransactionCounts.size} users`);

  // Write output
  if (outputFile) {
    fs.writeFileSync(outputFile, matchingLines.join('\n') + '\n', 'utf-8');
    console.log(`Transactions saved to: ${outputFile}`);
  } else {
    console.log('\n=== Matching Transactions ===');
    matchingLines.forEach(line => console.log(line));
  }

  // Statistics
  console.log('\n=== Statistics ===');
  console.log(`Total users searched: ${targetUserIds.size}`);
  console.log(`Users with transactions: ${userTransactionCounts.size}`);
  console.log(`Users without transactions: ${targetUserIds.size - userTransactionCounts.size}`);
  console.log(`Total transactions: ${matchingLines.length - 1}`);
  console.log(`Total deposit amount: ${totalAmount.toFixed(2)} INR`);

  if (userTransactionCounts.size > 0) {
    console.log(`\nAverage transactions per user: ${((matchingLines.length - 1) / userTransactionCounts.size).toFixed(2)}`);
    console.log(`Average deposit per user: ${(totalAmount / userTransactionCounts.size).toFixed(2)} INR`);
  }

  // Show users without transactions
  const usersWithoutTransactions = Array.from(targetUserIds).filter(
    userId => !userTransactionCounts.has(userId)
  );

  if (usersWithoutTransactions.length > 0 && usersWithoutTransactions.length <= 20) {
    console.log('\n=== Users Without Transactions ===');
    usersWithoutTransactions.forEach(userId => console.log(userId));
  } else if (usersWithoutTransactions.length > 20) {
    console.log(`\n${usersWithoutTransactions.length} users without transactions (too many to display)`);
  }

  // Top users by transaction count
  if (userTransactionCounts.size > 0) {
    const topUsers = Array.from(userTransactionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n=== Top 10 Users by Transaction Count ===');
    topUsers.forEach(([userId, count]) => {
      console.log(`${userId}: ${count} transactions`);
    });
  }
}

// Main
if (process.argv.length < 4) {
  console.error('Usage: node 2-find-user-transactions.js <input-csv-file> <user-ids-file> [output-file]');
  console.error('\nExample:');
  console.error('  node 2-find-user-transactions.js pixels-data.csv user-ids.txt user-transactions.csv');
  console.error('  node 2-find-user-transactions.js pixels-data.csv user-ids.txt');
  console.error('\nuser-ids-file format: one user ID per line');
  process.exit(1);
}

const inputFile = process.argv[2];
const userIdsFile = process.argv[3];
const outputFile = process.argv[4];

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

if (!fs.existsSync(userIdsFile)) {
  console.error(`Error: File not found: ${userIdsFile}`);
  process.exit(1);
}

try {
  findUserTransactions(inputFile, userIdsFile, outputFile);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
