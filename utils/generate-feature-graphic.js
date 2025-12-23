const sharp = require('sharp');
const path = require('path');

/**
 * Generate Feature Graphic for Google Play Store
 * Size: 1024x500px
 * Format: PNG or JPEG
 *
 * Design: FluentFlow branding with gradient background, logo, and tagline
 */

async function generateFeatureGraphic() {
    const width = 1024;
    const height = 500;

    // SVG for feature graphic
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#6366f1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
                </linearGradient>

                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
                </linearGradient>

                <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:1" />
                </linearGradient>
            </defs>

            <!-- Background -->
            <rect width="${width}" height="${height}" fill="url(#bg-gradient)"/>

            <!-- Logo Circle on Left -->
            <g transform="translate(180, 250)">
                <!-- Circle background -->
                <circle r="120" fill="#ffffff" opacity="0.1"/>
                <circle r="100" fill="url(#logo-gradient)"/>

                <!-- "F" Letter for FluentFlow -->
                <g transform="translate(0, 0)">
                    <!-- Vertical bar of F -->
                    <rect x="-35" y="-60" width="25" height="120" rx="5" fill="#ffffff"/>
                    <!-- Top horizontal bar -->
                    <rect x="-35" y="-60" width="70" height="25" rx="5" fill="#ffffff"/>
                    <!-- Middle horizontal bar -->
                    <rect x="-35" y="-12.5" width="55" height="22" rx="5" fill="#ffffff"/>
                </g>

                <!-- Decorative sparkle -->
                <circle cx="60" cy="-60" r="8" fill="#fbbf24" opacity="0.9"/>
                <circle cx="70" cy="-40" r="5" fill="#fbbf24" opacity="0.7"/>
            </g>

            <!-- Main Title "FluentFlow" -->
            <text x="380" y="200" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="url(#text-gradient)">
                FluentFlow
            </text>

            <!-- Tagline -->
            <text x="380" y="260" font-family="Arial, sans-serif" font-size="32" font-weight="300" fill="#e0e7ff">
                Learn Languages Smarter
            </text>

            <!-- Subtext with features -->
            <g transform="translate(380, 300)">
                <text y="0" font-family="Arial, sans-serif" font-size="20" fill="#c7d2fe">
                    ✨ Spaced Repetition • 🎮 Gamification
                </text>
                <text y="30" font-family="Arial, sans-serif" font-size="20" fill="#c7d2fe">
                    📊 Smart Analytics • 🔥 Daily Streaks
                </text>
            </g>

            <!-- Decorative elements -->
            <!-- Top right corner stars -->
            <circle cx="920" cy="80" r="6" fill="#fbbf24" opacity="0.6"/>
            <circle cx="950" cy="100" r="4" fill="#fbbf24" opacity="0.5"/>
            <circle cx="970" cy="70" r="5" fill="#fbbf24" opacity="0.7"/>

            <!-- Bottom right corner -->
            <circle cx="900" cy="430" r="5" fill="#8b5cf6" opacity="0.3"/>
            <circle cx="950" cy="450" r="7" fill="#6366f1" opacity="0.3"/>
        </svg>
    `;

    const outputPath = path.join(__dirname, 'public', 'store-assets', 'feature-graphic.png');

    // Ensure directory exists
    const fs = require('fs');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Generate PNG
    await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`✅ Feature graphic generated: ${outputPath}`);
    console.log(`   Size: ${width}x${height}px`);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);

    // Also generate JPEG version (sometimes required)
    const jpegPath = path.join(__dirname, 'public', 'store-assets', 'feature-graphic.jpg');
    await sharp(Buffer.from(svg))
        .jpeg({ quality: 90 })
        .toFile(jpegPath);

    const jpegStats = fs.statSync(jpegPath);
    console.log(`✅ Feature graphic (JPEG) generated: ${jpegPath}`);
    console.log(`   File size: ${(jpegStats.size / 1024).toFixed(2)} KB`);
}

// Run
generateFeatureGraphic().catch(console.error);
