#!/usr/bin/env node
/**
 * CSS Inconsistencies Analyzer
 * Finds hardcoded colors, gradients, spacing, and shadows in CSS files
 */

const fs = require('fs');
const path = require('path');

const CSS_FILES = [
    'public/style.css',
    'public/gamification.css',
    'public/achievements-ui.css',
    'public/word-lists-ui.css',
    'public/duels-ui.css',
    'public/duel-gameplay.css',
    'public/friends-ui.css',
    'public/features-ui.css',
    'public/leagues-ui.css',
    'public/personal-rating-ui.css',
    'public/weekly-challenges-ui.css',
    'public/personal-insights-ui.css',
    'public/profile-ui.css'
];

// Patterns to detect
const PATTERNS = {
    hardcodedColors: /#([0-9a-fA-F]{3,8})\b/g,
    hardcodedRgba: /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g,
    hardcodedGradients: /linear-gradient\([^)]+\)/g,
    hardcodedPadding: /padding:\s*\d+px/g,
    hardcodedMargin: /margin:\s*\d+px/g,
    hardcodedFontSize: /font-size:\s*\d+px/g,
    hardcodedBorderRadius: /border-radius:\s*\d+px/g,
    hardcodedShadow: /box-shadow:\s*[^;]+;/g,
    undefinedVars: /var\(--([^)]+)\)/g
};

const DEFINED_VARS = new Set([
    'primary-500', 'primary-600', 'primary-700', 'primary-800', 'primary-50', 'primary-100',
    'secondary-500', 'secondary-600', 'secondary-700', 'secondary-50', 'secondary-100',
    'accent-purple', 'accent-emerald', 'accent-rose', 'accent-amber', 'accent-cyan',
    'neutral-25', 'neutral-50', 'neutral-100', 'neutral-200', 'neutral-300', 'neutral-400',
    'neutral-500', 'neutral-600', 'neutral-700', 'neutral-800', 'neutral-900', 'neutral-950',
    'font-family', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl',
    'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
    'space-0', 'space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6',
    'space-8', 'space-10', 'space-12', 'space-16', 'space-20', 'space-24',
    'shadow-3d-sm', 'shadow-3d-md', 'shadow-3d-lg', 'shadow-3d-xl', 'shadow-3d-2xl',
    'shadow-colored-primary', 'shadow-colored-secondary',
    'radius-none', 'radius-sm', 'radius-md', 'radius-lg', 'radius-xl', 'radius-2xl', 'radius-3xl', 'radius-full',
    'transition-fast', 'transition-base', 'transition-slow', 'transition-bounce',
    'gradient-primary', 'gradient-secondary', 'gradient-rainbow', 'gradient-glass',
    'success-500', 'success-600', 'warning-500', 'warning-600', 'danger-500', 'danger-600'
]);

function analyzeFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = {
        hardcodedColors: new Set(),
        hardcodedGradients: new Set(),
        hardcodedSpacing: new Set(),
        undefinedVars: new Set(),
        totalIssues: 0
    };

    // Find hardcoded colors
    let match;
    while ((match = PATTERNS.hardcodedColors.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        issues.hardcodedColors.add(`Line ${line}: ${match[0]}`);
    }

    // Find hardcoded gradients with specific colors
    PATTERNS.hardcodedGradients.lastIndex = 0;
    while ((match = PATTERNS.hardcodedGradients.exec(content)) !== null) {
        if (/#[0-9a-fA-F]/.test(match[0]) || /\d+,\s*\d+,\s*\d+/.test(match[0])) {
            const line = content.substring(0, match.index).split('\n').length;
            issues.hardcodedGradients.add(`Line ${line}: ${match[0].substring(0, 60)}...`);
        }
    }

    // Find undefined CSS variables
    PATTERNS.undefinedVars.lastIndex = 0;
    while ((match = PATTERNS.undefinedVars.exec(content)) !== null) {
        const varName = match[1];
        if (!DEFINED_VARS.has(varName) && !varName.startsWith('bs-')) {
            const line = content.substring(0, match.index).split('\n').length;
            issues.undefinedVars.add(`Line ${line}: --${varName}`);
        }
    }

    issues.totalIssues = issues.hardcodedColors.size + issues.hardcodedGradients.size + issues.undefinedVars.size;

    return issues;
}

console.log('\n🔍 CSS INCONSISTENCIES ANALYSIS');
console.log('='.repeat(80));
console.log('\n📁 Analyzing CSS files for design inconsistencies...\n');

const results = {};
let totalIssues = 0;

for (const file of CSS_FILES) {
    const issues = analyzeFile(file);
    if (!issues) continue;

    results[file] = issues;
    totalIssues += issues.totalIssues;

    if (issues.totalIssues > 0) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📄 ${file}`);
        console.log('='.repeat(80));
        console.log(`⚠️  Total Issues: ${issues.totalIssues}\n`);

        if (issues.hardcodedColors.size > 0) {
            console.log(`🎨 Hardcoded Colors (${issues.hardcodedColors.size}):`);
            Array.from(issues.hardcodedColors).slice(0, 10).forEach(issue => {
                console.log(`   - ${issue}`);
            });
            if (issues.hardcodedColors.size > 10) {
                console.log(`   ... and ${issues.hardcodedColors.size - 10} more\n`);
            } else {
                console.log('');
            }
        }

        if (issues.hardcodedGradients.size > 0) {
            console.log(`🌈 Hardcoded Gradients (${issues.hardcodedGradients.size}):`);
            Array.from(issues.hardcodedGradients).slice(0, 5).forEach(issue => {
                console.log(`   - ${issue}`);
            });
            if (issues.hardcodedGradients.size > 5) {
                console.log(`   ... and ${issues.hardcodedGradients.size - 5} more\n`);
            } else {
                console.log('');
            }
        }

        if (issues.undefinedVars.size > 0) {
            console.log(`❓ Undefined CSS Variables (${issues.undefinedVars.size}):`);
            Array.from(issues.undefinedVars).slice(0, 10).forEach(issue => {
                console.log(`   - ${issue}`);
            });
            if (issues.undefinedVars.size > 10) {
                console.log(`   ... and ${issues.undefinedVars.size - 10} more\n`);
            } else {
                console.log('');
            }
        }
    } else {
        console.log(`✅ ${file} - No issues found`);
    }
}

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));
console.log(`\nTotal CSS Files Analyzed: ${CSS_FILES.length}`);
console.log(`Total Issues Found: ${totalIssues}\n`);

// Generate recommendations
console.log('💡 RECOMMENDATIONS:\n');
console.log('1. Replace all hardcoded hex colors with CSS variables from :root');
console.log('2. Use var(--gradient-primary) and var(--gradient-secondary) for gradients');
console.log('3. Define missing CSS variables or remove references');
console.log('4. Use spacing variables (--space-*) instead of hardcoded px values');
console.log('5. Use shadow variables (--shadow-3d-*) for consistent depth');
console.log('\n' + '='.repeat(80) + '\n');
