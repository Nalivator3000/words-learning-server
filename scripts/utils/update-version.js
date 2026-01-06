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
        const pkg = require(path.join(__dirname, '..', '..', 'package.json'));
        return pkg.version || '5.0';
    } catch (error) {
        console.error('Error reading package.json:', error.message);
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

// Get full commit message (first line only)
function getCommitMessage() {
    try {
        const message = execSync('git log -1 --pretty=%s').toString().trim();
        // Limit to 80 characters for the comment
        return message.length > 80 ? message.substring(0, 77) + '...' : message;
    } catch (error) {
        console.error('Error getting commit message:', error.message);
        return 'Unknown commit';
    }
}

// Update version in index.html
function updateIndexHtml() {
    const indexPath = path.join(__dirname, '..', '..', 'public', 'index.html');

    if (!fs.existsSync(indexPath)) {
        console.error('index.html not found at:', indexPath);
        return false;
    }

    const commitHash = getCommitHash();
    const version = getVersion();
    const newVersion = `v${version}`;
    const commitMsg = getCommitMessage();

    let content = fs.readFileSync(indexPath, 'utf8');

    // Update meta comment (simple version format)
    content = content.replace(
        /<!-- Version: v[\d.]+(?:-[\w-]+-[a-f0-9]+)? -->/,
        `<!-- Version: ${newVersion} -->`
    );

    // Update or add commit hash comment (only in HTML head section, not in JavaScript)
    // Match the pattern at the start of a line with optional whitespace
    if (content.includes('<!-- CommitHash:')) {
        content = content.replace(
            /^(\s*)<!-- CommitHash: .*? -->/m,
            `$1<!-- CommitHash: ${commitHash} -->`
        );
    } else {
        // Add commit hash comment after version comment
        content = content.replace(
            /^(\s*)<!-- Version: v[\d.]+ -->/m,
            `$1<!-- Version: ${newVersion} -->\n$1<!-- CommitHash: ${commitHash} -->`
        );
    }

    // Update or add commit message comment (only in HTML head section, not in JavaScript)
    if (content.includes('<!-- Commit:')) {
        content = content.replace(
            /^(\s*)<!-- Commit: .*? -->/m,
            `$1<!-- Commit: ${commitMsg} -->`
        );
    } else {
        // Add commit comment after commit hash comment
        content = content.replace(
            /^(\s*)<!-- CommitHash: .*? -->/m,
            `$1<!-- CommitHash: ${commitHash} -->\n$1<!-- Commit: ${commitMsg} -->`
        );
    }

    fs.writeFileSync(indexPath, content, 'utf8');
    console.log(`✅ Version updated to: ${newVersion} (commit: ${commitHash})`);
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

module.exports = { updateIndexHtml, getCommitHash, getVersion, getFeatureName, getCommitMessage };
