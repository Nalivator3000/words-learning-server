const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA and Android
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 FluentFlow Icon Generator');
console.log('================================\n');

// Function to create a FluentFlow icon programmatically
async function createBaseIcon() {
    const size = 1024; // Create high-res base, we'll resize later
    const canvas = sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    });

    // Create SVG with FluentFlow branding
    const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="letter" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:1" />
                </linearGradient>
            </defs>

            <!-- Background with rounded corners -->
            <rect width="${size}" height="${size}" rx="${size * 0.215}" fill="url(#bg)"/>

            <!-- Letter F for FluentFlow -->
            <g transform="translate(${size/2}, ${size/2})">
                <!-- Vertical bar -->
                <rect x="${-size * 0.156}" y="${-size * 0.3125}" width="${size * 0.117}" height="${size * 0.625}" rx="${size * 0.0195}" fill="url(#letter)"/>

                <!-- Top horizontal bar -->
                <rect x="${-size * 0.156}" y="${-size * 0.3125}" width="${size * 0.352}" height="${size * 0.117}" rx="${size * 0.0195}" fill="url(#letter)"/>

                <!-- Middle horizontal bar -->
                <rect x="${-size * 0.156}" y="${-size * 0.0586}" width="${size * 0.273}" height="${size * 0.107}" rx="${size * 0.0195}" fill="url(#letter)"/>

                <!-- Decorative wave accent -->
                <path d="M ${size * 0.156} ${-size * 0.195} Q ${size * 0.234} ${-size * 0.156} ${size * 0.273} ${-size * 0.117} T ${size * 0.352} ${-size * 0.039}"
                      stroke="#fbbf24" stroke-width="${size * 0.0156}" fill="none"
                      stroke-linecap="round" opacity="0.8"/>
                <circle cx="${size * 0.352}" cy="${-size * 0.039}" r="${size * 0.0117}" fill="#fbbf24" opacity="0.8"/>
            </g>

            <!-- Subtle shadow -->
            <ellipse cx="${size/2}" cy="${size * 0.9375}" rx="${size * 0.352}" ry="${size * 0.039}" fill="#000000" opacity="0.1"/>
        </svg>
    `;

    return Buffer.from(svg);
}

// Generate icons
async function generateIcons() {
    try {
        console.log('Creating base icon...');
        const baseIcon = await createBaseIcon();

        // Generate standard icons
        for (const size of sizes) {
            const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

            await sharp(baseIcon)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated: icon-${size}x${size}.png`);
        }

        // Generate maskable icon (512x512 with safe zone)
        const maskableSize = 512;
        const safeZone = Math.round(maskableSize * 0.1); // 10% padding = 20% safe zone
        const innerSize = maskableSize - (safeZone * 2);

        console.log('\nGenerating maskable icon (with safe zone)...');

        // Create background
        const background = await sharp({
            create: {
                width: maskableSize,
                height: maskableSize,
                channels: 4,
                background: { r: 99, g: 102, b: 241, alpha: 1 } // #6366f1
            }
        }).png().toBuffer();

        // Resize base icon to fit in safe zone
        const resizedIcon = await sharp(baseIcon)
            .resize(innerSize, innerSize, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        // Composite icon onto background
        await sharp(background)
            .composite([{
                input: resizedIcon,
                top: safeZone,
                left: safeZone
            }])
            .png()
            .toFile(path.join(outputDir, `icon-${maskableSize}x${maskableSize}-maskable.png`));

        console.log(`✅ Generated: icon-${maskableSize}x${maskableSize}-maskable.png (maskable)`);

        console.log('\n================================');
        console.log('✨ All icons generated successfully!');
        console.log(`📁 Location: ${outputDir}`);
        console.log(`📊 Total: ${sizes.length + 1} icons`);
        console.log('\n🚀 Ready for PWA and Android TWA!');

    } catch (error) {
        console.error('❌ Error generating icons:', error);
        process.exit(1);
    }
}

// Run the generator
generateIcons();
