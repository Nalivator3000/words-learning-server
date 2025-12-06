#!/usr/bin/env node

/**
 * Script 1: Extract unique user IDs from CSV file
 *
 * Usage: node 1-extract-unique-users.js <input-csv-file> [output-file]
 *
 * Example:
 *   node 1-extract-unique-users.js pixels-data.csv unique-users.txt
 *   node 1-extract-unique-users.js pixels-data.csv
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

function extractUniqueUsers(inputFile, outputFile) {
  console.log(`Reading file: ${inputFile}`);

  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.error('Error: Empty file');
    process.exit(1);
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const userIdIndex = headers.indexOf('EXTERNAL_USER_ID');

  if (userIdIndex === -1) {
    console.error('Error: EXTERNAL_USER_ID column not found');
    console.error('Available columns:', headers.join(', '));
    process.exit(1);
  }

  console.log(`Found EXTERNAL_USER_ID at column ${userIdIndex}`);

  // Extract unique user IDs
  const uniqueUsers = new Set();
  let processedLines = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const userId = values[userIdIndex];

    if (userId && userId.trim()) {
      uniqueUsers.add(userId.trim());
      processedLines++;
    }
  }

  console.log(`Processed ${processedLines} transactions`);
  console.log(`Found ${uniqueUsers.size} unique users`);

  // Convert to array and sort
  const userArray = Array.from(uniqueUsers).sort();

  // Write to output file
  if (outputFile) {
    fs.writeFileSync(outputFile, userArray.join('\n') + '\n', 'utf-8');
    console.log(`Unique user IDs saved to: ${outputFile}`);
  } else {
    console.log('\nUnique user IDs:');
    userArray.forEach(id => console.log(id));
  }

  // Statistics
  console.log('\n=== Statistics ===');
  console.log(`Total transactions: ${processedLines}`);
  console.log(`Unique users: ${uniqueUsers.size}`);
  console.log(`Average transactions per user: ${(processedLines / uniqueUsers.size).toFixed(2)}`);
}

// Main
if (process.argv.length < 3) {
  console.error('Usage: node 1-extract-unique-users.js <input-csv-file> [output-file]');
  console.error('\nExample:');
  console.error('  node 1-extract-unique-users.js pixels-data.csv unique-users.txt');
  console.error('  node 1-extract-unique-users.js pixels-data.csv');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

try {
  extractUniqueUsers(inputFile, outputFile);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
