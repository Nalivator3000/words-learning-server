#!/usr/bin/env node

/**
 * Agent Context Verification Script
 * Run this to get a comprehensive overview of the project state
 * Usage: node scripts/check-agent-context.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤖 AGENT CONTEXT VERIFICATION\n');
console.log('=' .repeat(60));

// Helper to run shell commands safely
function runCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    }).trim();
  } catch (error) {
    return options.fallback || `Error: ${error.message}`;
  }
}

// 1. Git Status
console.log('\n📦 GIT STATUS');
console.log('-'.repeat(60));
console.log('Current branch:', runCommand('git branch --show-current'));
console.log('Working directory status:');
runCommand('git status --short');

// 2. Recent Commits
console.log('\n📜 RECENT COMMITS (last 5)');
console.log('-'.repeat(60));
runCommand('git log -5 --oneline --decorate');

// 3. Project Version
console.log('\n🔢 PROJECT VERSION');
console.log('-'.repeat(60));
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`Version: ${packageJson.version}`);
  console.log(`Name: ${packageJson.name}`);
  console.log(`Description: ${packageJson.description}`);
} catch (error) {
  console.log('Error reading package.json:', error.message);
}

// 4. Environment Check
console.log('\n🌍 ENVIRONMENT');
console.log('-'.repeat(60));
console.log('Node version:', runCommand('node --version'));
console.log('npm version:', runCommand('npm --version'));
console.log('Working directory:', process.cwd());

// 5. Database Connection (Railway)
console.log('\n🗄️  DATABASE');
console.log('-'.repeat(60));
const hasRailwayCLI = runCommand('where railway', { silent: true, fallback: null });
if (hasRailwayCLI) {
  console.log('✅ Railway CLI detected');
  console.log('Check Railway status: railway status');
} else {
  console.log('⚠️  Railway CLI not found (install: npm i -g @railway/cli)');
}
console.log('Production DB: mainline.proxy.rlwy.net:54625');

// 6. Critical Files Check
console.log('\n📁 CRITICAL FILES');
console.log('-'.repeat(60));
const criticalFiles = [
  '.clinerules',
  'AGENT_CONTEXT.md',
  'server-postgresql.js',
  'package.json',
  '.env',
  'TEST_ACCOUNTS_READY.md',
  '.claude/settings.json'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const icon = exists ? '✅' : '❌';
  console.log(`${icon} ${file}`);
});

// 7. Recent Changes Summary
console.log('\n🔄 RECENT CHANGES');
console.log('-'.repeat(60));
const recentFiles = runCommand('git diff --name-only HEAD~3..HEAD', { silent: true });
if (recentFiles) {
  console.log('Files changed in last 3 commits:');
  console.log(recentFiles);
} else {
  console.log('No recent changes detected');
}

// 8. Branch Protection Status
console.log('\n🛡️  BRANCH PROTECTION');
console.log('-'.repeat(60));
const currentBranch = runCommand('git branch --show-current', { silent: true });
if (currentBranch === 'main') {
  console.log('⛔ WARNING: You are on MAIN branch!');
  console.log('   Switch to develop: git checkout develop');
} else if (currentBranch === 'develop') {
  console.log('✅ Correct branch: develop');
} else {
  console.log(`ℹ️  Current branch: ${currentBranch}`);
  console.log('   Recommended: develop');
}

// 9. Test Accounts Status
console.log('\n👥 TEST ACCOUNTS');
console.log('-'.repeat(60));
if (fs.existsSync('TEST_ACCOUNTS_READY.md')) {
  console.log('✅ Test accounts file found');
  console.log('   Read: cat TEST_ACCOUNTS_READY.md');
} else {
  console.log('⚠️  Test accounts file not found');
}

// 10. Deployment Info
console.log('\n🚀 DEPLOYMENT');
console.log('-'.repeat(60));
console.log('Production URL: https://lexybooster.com/');
console.log('Railway URL: https://words-learning-server-production.up.railway.app');
console.log('Auto-deploy branch: develop');
console.log('Deployment time: ~30 seconds');

// 11. Quick Commands Reference
console.log('\n⚡ QUICK COMMANDS');
console.log('-'.repeat(60));
console.log('Test (smoke):    npm run test:e2e:production:smoke');
console.log('Test (critical): npm run test:e2e:production');
console.log('Version bump:    npm run version:patch');
console.log('Translations:    npm run translate:status');
console.log('Push to develop: git push origin develop');

// 12. Critical Rules Reminder
console.log('\n⛔ CRITICAL RULES');
console.log('-'.repeat(60));
console.log('1. NEVER push to main (only develop)');
console.log('2. NEVER test locally (only Railway production)');
console.log('3. NEVER commit sensitive data (.env, keys)');
console.log('4. ALWAYS use Read/Edit/Write tools (not bash cat/sed)');
console.log('5. ALWAYS verify branch before pushing');

console.log('\n' + '='.repeat(60));
console.log('✅ Context verification complete!');
console.log('📚 Full details: .clinerules & AGENT_CONTEXT.md\n');
