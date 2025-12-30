#!/usr/bin/env node
/**
 * CSS Unification Script
 * Automatically replaces hardcoded colors, gradients with CSS variables
 */

const fs = require('fs');
const path = require('path');

const CSS_FILES = [
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

// Color replacements map
const COLOR_REPLACEMENTS = {
    // Primary colors
    '#8B5CF6': 'var(--primary-500)',
    '#8b5cf6': 'var(--primary-500)',
    '#7C3AED': 'var(--primary-600)',
    '#7c3aed': 'var(--primary-600)',
    '#6D28D9': 'var(--primary-700)',
    '#6d28d9': 'var(--primary-700)',
    '#5B21B6': 'var(--primary-800)',
    '#5b21b6': 'var(--primary-800)',
    '#A78BFA': 'var(--primary-400)',
    '#a78bfa': 'var(--primary-400)',

    // Secondary colors
    '#06B6D4': 'var(--secondary-500)',
    '#06b6d4': 'var(--secondary-500)',
    '#0891B2': 'var(--secondary-600)',
    '#0891b2': 'var(--secondary-600)',
    '#0E7490': 'var(--secondary-700)',
    '#0e7490': 'var(--secondary-700)',
    '#22D3EE': 'var(--secondary-400)',
    '#22d3ee': 'var(--secondary-400)',

    // Success/Green
    '#10B981': 'var(--success-500)',
    '#10b981': 'var(--success-500)',
    '#059669': 'var(--success-600)',
    '#34D399': 'var(--accent-emerald)',
    '#34d399': 'var(--accent-emerald)',

    // Warning/Orange
    '#F59E0B': 'var(--warning-500)',
    '#f59e0b': 'var(--warning-500)',
    '#D97706': 'var(--warning-600)',
    '#d97706': 'var(--warning-600)',
    '#FBBF24': 'var(--accent-amber)',
    '#fbbf24': 'var(--accent-amber)',

    // Danger/Red
    '#EF4444': 'var(--danger-500)',
    '#ef4444': 'var(--danger-500)',
    '#DC2626': 'var(--danger-600)',
    '#dc2626': 'var(--danger-600)',

    // Special colors
    '#FFD700': 'var(--gold)',
    '#ffd700': 'var(--gold)',
    '#FFED4E': '#FFED4E', // Keep as is, used in gold gradient
    '#ffed4e': '#ffed4e',
    '#C0C0C0': 'var(--silver)',
    '#c0c0c0': 'var(--silver)',
    '#CD7F32': 'var(--bronze)',
    '#cd7f32': 'var(--bronze)',

    // Neutrals
    '#2c3e50': 'var(--neutral-800)',
    '#2C3E50': 'var(--neutral-800)',
    '#6c757d': 'var(--neutral-500)',
    '#6C757D': 'var(--neutral-500)',
    '#1f2937': 'var(--neutral-800)',
    '#1F2937': 'var(--neutral-800)',

    // Old purple gradients
    '#667eea': 'var(--primary-500)',
    '#667EEA': 'var(--primary-500)',
    '#764ba2': 'var(--primary-700)',
    '#764BA2': 'var(--primary-700)',

    // Old cyan gradients
    '#4facfe': 'var(--secondary-500)',
    '#4FACFE': 'var(--secondary-500)',
    '#00f2fe': 'var(--secondary-400)',
    '#00F2FE': 'var(--secondary-400)',

    // Indigo
    '#6366F1': 'var(--primary-500)',
    '#6366f1': 'var(--primary-500)',
};

// Gradient replacements
const GRADIENT_REPLACEMENTS = [
    {
        pattern: /linear-gradient\(135deg,\s*#667eea\s+0%,\s*#764ba2\s+100%\)/gi,
        replacement: 'var(--gradient-primary)'
    },
    {
        pattern: /linear-gradient\(90deg,\s*#667eea\s+0%,\s*#764ba2\s+100%\)/gi,
        replacement: 'var(--gradient-primary)'
    },
    {
        pattern: /linear-gradient\(135deg,\s*#10b981,\s*#059669\)/gi,
        replacement: 'var(--gradient-success)'
    },
    {
        pattern: /linear-gradient\(90deg,\s*#10b981,\s*#059669\)/gi,
        replacement: 'var(--gradient-success)'
    },
    {
        pattern: /linear-gradient\(180deg,\s*#10b981,\s*#059669\)/gi,
        replacement: 'var(--gradient-success)'
    },
    {
        pattern: /linear-gradient\(135deg,\s*#ef4444,\s*#dc2626\)/gi,
        replacement: 'var(--gradient-danger)'
    },
    {
        pattern: /linear-gradient\(135deg,\s*#f59e0b,\s*#d97706\)/gi,
        replacement: 'var(--gradient-warning)'
    },
    {
        pattern: /linear-gradient\(90deg,\s*#ffd700,\s*#ffed4e\)/gi,
        replacement: 'var(--gradient-gold)'
    },
    {
        pattern: /linear-gradient\(135deg,\s*#ffd700,\s*#ffed4e\)/gi,
        replacement: 'var(--gradient-gold)'
    },
    {
        pattern: /linear-gradient\(90deg,\s*#6366f1,\s*#8b5cf6\)/gi,
        replacement: 'var(--gradient-primary)'
    },
    {
        pattern: /linear-gradient\(135deg,\s*#6366f1,\s*#8b5cf6\)/gi,
        replacement: 'var(--gradient-primary)'
    }
];

function unifyCSS(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${filePath} - file not found`);
        return { replaced: 0, gradients: 0 };
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let colorReplacements = 0;
    let gradientReplacements = 0;

    // Replace gradients first (more specific)
    for (const { pattern, replacement } of GRADIENT_REPLACEMENTS) {
        const matches = content.match(pattern);
        if (matches) {
            content = content.replace(pattern, replacement);
            gradientReplacements += matches.length;
        }
    }

    // Replace individual colors
    for (const [oldColor, newColor] of Object.entries(COLOR_REPLACEMENTS)) {
        const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
            content = content.replace(regex, newColor);
            colorReplacements += matches.length;
        }
    }

    // Only write if changes were made
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }

    return { replaced: colorReplacements, gradients: gradientReplacements };
}

console.log('\n🎨 CSS UNIFICATION TOOL');
console.log('='.repeat(80));
console.log('\n🔧 Replacing hardcoded colors and gradients with CSS variables...\n');

let totalColors = 0;
let totalGradients = 0;
let filesModified = 0;

for (const file of CSS_FILES) {
    const stats = unifyCSS(file);

    if (stats.replaced > 0 || stats.gradients > 0) {
        filesModified++;
        console.log(`✅ ${file}`);
        console.log(`   Colors: ${stats.replaced} | Gradients: ${stats.gradients}`);
        totalColors += stats.replaced;
        totalGradients += stats.gradients;
    } else {
        console.log(`⏭️  ${file} - no changes needed`);
    }
}

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));
console.log(`\nFiles Modified: ${filesModified}/${CSS_FILES.length}`);
console.log(`Total Color Replacements: ${totalColors}`);
console.log(`Total Gradient Replacements: ${totalGradients}`);
console.log(`\n✅ CSS unification complete!\n`);
console.log('💡 Next step: Run analyze-css-inconsistencies.js to verify\n');
console.log('='.repeat(80) + '\n');
