#!/usr/bin/env node

/**
 * Build AAB Script for LexyBooster v5.1.0
 *
 * This script automates the AAB build process using Bubblewrap CLI
 *
 * Prerequisites:
 * - Bubblewrap CLI installed: npm install -g @bubblewrap/cli
 * - Java JDK installed
 * - Existing keystore file (optional, will be created if not found)
 *
 * Usage:
 *   node scripts/build-aab.js [keystore-path] [keystore-password]
 *
 * Examples:
 *   node scripts/build-aab.js
 *   node scripts/build-aab.js ./lexybooster-release-key.jks mypassword
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    if (options.ignoreError) {
      return null;
    }
    throw error;
  }
}

function checkPrerequisites() {
  log('\n📋 Checking prerequisites...', 'blue');

  // Check Bubblewrap
  try {
    exec('bubblewrap --version', { silent: true });
    log('✅ Bubblewrap CLI installed', 'green');
  } catch (error) {
    log('❌ Bubblewrap CLI not found!', 'red');
    log('   Install with: npm install -g @bubblewrap/cli', 'yellow');
    process.exit(1);
  }

  // Check Java
  try {
    const javaVersion = exec('java -version', { silent: true });
    log('✅ Java JDK installed', 'green');
  } catch (error) {
    log('❌ Java JDK not found!', 'red');
    log('   Download from: https://adoptium.net/', 'yellow');
    process.exit(1);
  }
}

function checkKeystoreExists(keystorePath) {
  if (!keystorePath) {
    return false;
  }
  return fs.existsSync(keystorePath);
}

function getKeystoreInfo() {
  const args = process.argv.slice(2);

  // Default keystore path
  let keystorePath = path.join(__dirname, '..', 'lexybooster-release-key.jks');
  let keystorePassword = null;

  // Check command line arguments
  if (args.length >= 1) {
    keystorePath = path.resolve(args[0]);
  }

  if (args.length >= 2) {
    keystorePassword = args[1];
  }

  return { keystorePath, keystorePassword };
}

function updateTwaManifestWithKeystore(keystorePath) {
  log('\n🔧 Updating twa-manifest.json with keystore path...', 'blue');

  const manifestPath = path.join(__dirname, '..', 'twa-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  manifest.signingKey = {
    path: path.relative(path.join(__dirname, '..'), keystorePath),
    alias: 'lexybooster'
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log('✅ twa-manifest.json updated', 'green');
}

function buildAAB(keystorePassword) {
  log('\n🏗️  Building AAB file...', 'blue');
  log('   This may take 5-10 minutes on first build...', 'cyan');

  try {
    // Build command
    let buildCommand = 'bubblewrap build';

    if (keystorePassword) {
      // Set keystore password as environment variable
      process.env.BUBBLEWRAP_KEYSTORE_PASSWORD = keystorePassword;
    }

    exec(buildCommand);

    log('\n✅ AAB build successful!', 'green');
    return true;
  } catch (error) {
    log('\n❌ AAB build failed!', 'red');
    log(error.message, 'red');
    return false;
  }
}

function displayResults() {
  log('\n📦 Build Results:', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  // Check for AAB file
  const aabPath = path.join(__dirname, '..', 'app-release.aab');
  if (fs.existsSync(aabPath)) {
    const stats = fs.statSync(aabPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`✅ AAB file: app-release.aab (${sizeMB} MB)`, 'green');
  } else {
    log('❌ AAB file not found', 'red');
  }

  // Check for APK file
  const apkPath = path.join(__dirname, '..', 'app-release-signed.apk');
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`✅ APK file: app-release-signed.apk (${sizeMB} MB)`, 'green');
  }

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
}

function displayNextSteps() {
  log('\n🎯 Next Steps:', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('1. Test AAB locally:', 'yellow');
  log('   adb install app-release.aab', 'cyan');
  log('');
  log('2. Upload to Google Play Console:', 'yellow');
  log('   - Go to https://play.google.com/console/', 'cyan');
  log('   - Select LexyBooster app', 'cyan');
  log('   - Production → Create new release', 'cyan');
  log('   - Upload app-release.aab', 'cyan');
  log('   - Copy release notes from PLAY_STORE_RELEASE_NOTES_5.1.0.md', 'cyan');
  log('');
  log('3. Submit for review', 'yellow');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
}

function main() {
  log('\n╔═══════════════════════════════════════╗', 'cyan');
  log('║  📱 LexyBooster AAB Builder v5.1.0   ║', 'cyan');
  log('╚═══════════════════════════════════════╝', 'cyan');

  // Step 1: Check prerequisites
  checkPrerequisites();

  // Step 2: Get keystore info
  const { keystorePath, keystorePassword } = getKeystoreInfo();

  log('\n🔑 Keystore Configuration:', 'blue');
  log(`   Path: ${keystorePath}`, 'cyan');

  if (checkKeystoreExists(keystorePath)) {
    log('   ✅ Keystore found', 'green');

    // Update twa-manifest.json with keystore path
    updateTwaManifestWithKeystore(keystorePath);
  } else {
    log('   ⚠️  Keystore not found', 'yellow');
    log('   Bubblewrap will generate a new keystore', 'yellow');
    log('   ⚠️  IMPORTANT: Save the generated keystore and password!', 'red');
  }

  // Step 3: Build AAB
  const success = buildAAB(keystorePassword);

  if (success) {
    // Step 4: Display results
    displayResults();

    // Step 5: Display next steps
    displayNextSteps();

    log('\n✅ Build process completed successfully! 🎉', 'green');
    process.exit(0);
  } else {
    log('\n❌ Build process failed!', 'red');
    log('   Check the error messages above for details.', 'yellow');
    log('   See TWA_BUILD_GUIDE.md for troubleshooting.', 'yellow');
    process.exit(1);
  }
}

// Run main function
main();
