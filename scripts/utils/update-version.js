#!/usr/bin/env node

/**
 * Automatic Version Updater
 * Updates version in index.html with current git commit hash
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Get current git commit hash
function getCommitHash() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (error) {
        console.error('Error getting commit hash:', error.message);
        return 'dev';
    }
}

// Get version from package.json or generate
function getVersion() {
    try {
        const pkg = require('./package.json');
        return pkg.version || '5.0';
    } catch {
        return '5.0';
    }
}

// Get feature name from latest commit message
function getFeatureName() {
    try {
        const message = execSync('git log -1 --pretty=%B').toString().trim();
        const firstLine = message.split('\n')[0];

        // Extract emoji and short description
        const match = firstLine.match(/^(🔐|📌|🚀|✨|🐛|🔧|🎨|♻️|⚡|🗄️|📝)\s*(.+?):/);
        if (match) {
            const emojiMap = {
                '🔐': 'AUTH',
                '📌': 'VERSION',
                '🚀': 'DEPLOY',
                '✨': 'FEATURE',
                '🐛': 'FIX',
                '🔧': 'CONFIG',
                '🎨': 'UI',
                '♻️': 'REFACTOR',
                '⚡': 'PERF',
                '🗄️': 'DB',
                '📝': 'DOCS'
            };
            return emojiMap[match[1]] || 'UPDATE';
        }

        return 'UPDATE';
    } catch {
        return 'UPDATE';
    }
}

// Update version in index.html
function updateIndexHtml() {
    const indexPath = path.join(__dirname, 'public', 'index.html');

    if (!fs.existsSync(indexPath)) {
        console.error('index.html not found!');
        return false;
    }

    const commitHash = getCommitHash();
    const version = getVersion();
    const feature = getFeatureName();
    const newVersion = `v${version}-${feature}-${commitHash}`;

    let content = fs.readFileSync(indexPath, 'utf8');

    // Update meta comment
    content = content.replace(
        /<!-- Version: v[\d.]+-[\w-]+-[a-f0-9]+ -->/,
        `<!-- Version: ${newVersion} -->`
    );

    // Update footer version
    content = content.replace(
        /(<!-- Version Info -->[\s\S]*?<footer[^>]*>)\s*v[\d.]+-[\w-]+-[a-f0-9]+/,
        `$1\n            ${newVersion}`
    );

    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`✅ Version updated to: ${newVersion}`);
    return true;
}

// Main execution
if (require.main === module) {
    console.log('🔄 Updating version...');

    if (updateIndexHtml()) {
        console.log('✨ Version update complete!');
        process.exit(0);
    } else {
        console.error('❌ Version update failed!');
        process.exit(1);
    }
}

module.exports = { updateIndexHtml, getCommitHash, getVersion, getFeatureName };
