/**
 * Generate iOS App Icons from source icon
 *
 * This script generates all required iOS icon sizes from icon-512x512.png
 * Run on Mac after setting up Capacitor: npm run generate:ios-icons
 *
 * Required: sharp (already in devDependencies)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// iOS App Icon sizes (as per Apple Human Interface Guidelines)
const IOS_ICON_SIZES = [
  // iPhone Notification (iOS 7-17)
  { size: 20, scale: 2, name: 'AppIcon-20x20@2x.png' },
  { size: 20, scale: 3, name: 'AppIcon-20x20@3x.png' },

  // iPhone Settings (iOS 7-17)
  { size: 29, scale: 2, name: 'AppIcon-29x29@2x.png' },
  { size: 29, scale: 3, name: 'AppIcon-29x29@3x.png' },

  // iPhone Spotlight (iOS 7-17)
  { size: 40, scale: 2, name: 'AppIcon-40x40@2x.png' },
  { size: 40, scale: 3, name: 'AppIcon-40x40@3x.png' },

  // iPhone App (iOS 7-17)
  { size: 60, scale: 2, name: 'AppIcon-60x60@2x.png' },
  { size: 60, scale: 3, name: 'AppIcon-60x60@3x.png' },

  // iPad Notifications (iOS 7-17)
  { size: 20, scale: 1, name: 'AppIcon-20x20@1x.png' },
  { size: 20, scale: 2, name: 'AppIcon-20x20@2x~ipad.png' },

  // iPad Settings (iOS 7-17)
  { size: 29, scale: 1, name: 'AppIcon-29x29@1x.png' },
  { size: 29, scale: 2, name: 'AppIcon-29x29@2x~ipad.png' },

  // iPad Spotlight (iOS 7-17)
  { size: 40, scale: 1, name: 'AppIcon-40x40@1x.png' },
  { size: 40, scale: 2, name: 'AppIcon-40x40@2x~ipad.png' },

  // iPad App (iOS 7-17)
  { size: 76, scale: 1, name: 'AppIcon-76x76@1x.png' },
  { size: 76, scale: 2, name: 'AppIcon-76x76@2x.png' },

  // iPad Pro App (iOS 9-17)
  { size: 83.5, scale: 2, name: 'AppIcon-83.5x83.5@2x.png' },

  // App Store (iOS)
  { size: 1024, scale: 1, name: 'AppIcon-1024x1024@1x.png' }
];

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'ios-icons');
const SOURCE_ICON = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png');

async function generateIosIcons() {
  console.log('Generating iOS App Icons...\n');

  // Check source icon exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('Source icon not found:', SOURCE_ICON);
    console.error('Please ensure public/icons/icon-512x512.png exists');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate each icon size
  for (const icon of IOS_ICON_SIZES) {
    const pixelSize = Math.round(icon.size * icon.scale);
    const outputPath = path.join(OUTPUT_DIR, icon.name);

    try {
      await sharp(SOURCE_ICON)
        .resize(pixelSize, pixelSize, {
          fit: 'cover',
          kernel: sharp.kernel.lanczos3
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);

      console.log(`  ${icon.name} (${pixelSize}x${pixelSize}px)`);
    } catch (error) {
      console.error(`  Failed to generate ${icon.name}:`, error.message);
    }
  }

  console.log(`\nGenerated ${IOS_ICON_SIZES.length} icons in: ${OUTPUT_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Open ios/App/App.xcodeproj in Xcode');
  console.log('2. Navigate to Assets.xcassets > AppIcon');
  console.log('3. Drag and drop the generated icons to appropriate slots');
  console.log('   OR use the Contents.json method (see below)\n');

  // Generate Contents.json for Xcode Asset Catalog
  await generateContentsJson();
}

async function generateContentsJson() {
  const contents = {
    images: [
      { size: '20x20', idiom: 'iphone', scale: '2x', filename: 'AppIcon-20x20@2x.png' },
      { size: '20x20', idiom: 'iphone', scale: '3x', filename: 'AppIcon-20x20@3x.png' },
      { size: '29x29', idiom: 'iphone', scale: '2x', filename: 'AppIcon-29x29@2x.png' },
      { size: '29x29', idiom: 'iphone', scale: '3x', filename: 'AppIcon-29x29@3x.png' },
      { size: '40x40', idiom: 'iphone', scale: '2x', filename: 'AppIcon-40x40@2x.png' },
      { size: '40x40', idiom: 'iphone', scale: '3x', filename: 'AppIcon-40x40@3x.png' },
      { size: '60x60', idiom: 'iphone', scale: '2x', filename: 'AppIcon-60x60@2x.png' },
      { size: '60x60', idiom: 'iphone', scale: '3x', filename: 'AppIcon-60x60@3x.png' },
      { size: '20x20', idiom: 'ipad', scale: '1x', filename: 'AppIcon-20x20@1x.png' },
      { size: '20x20', idiom: 'ipad', scale: '2x', filename: 'AppIcon-20x20@2x~ipad.png' },
      { size: '29x29', idiom: 'ipad', scale: '1x', filename: 'AppIcon-29x29@1x.png' },
      { size: '29x29', idiom: 'ipad', scale: '2x', filename: 'AppIcon-29x29@2x~ipad.png' },
      { size: '40x40', idiom: 'ipad', scale: '1x', filename: 'AppIcon-40x40@1x.png' },
      { size: '40x40', idiom: 'ipad', scale: '2x', filename: 'AppIcon-40x40@2x~ipad.png' },
      { size: '76x76', idiom: 'ipad', scale: '1x', filename: 'AppIcon-76x76@1x.png' },
      { size: '76x76', idiom: 'ipad', scale: '2x', filename: 'AppIcon-76x76@2x.png' },
      { size: '83.5x83.5', idiom: 'ipad', scale: '2x', filename: 'AppIcon-83.5x83.5@2x.png' },
      { size: '1024x1024', idiom: 'ios-marketing', scale: '1x', filename: 'AppIcon-1024x1024@1x.png' }
    ],
    info: {
      version: 1,
      author: 'xcode'
    }
  };

  const contentsPath = path.join(OUTPUT_DIR, 'Contents.json');
  fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2));
  console.log('Generated Contents.json for Xcode Asset Catalog');
  console.log('\nTo use: Copy entire ios-icons folder contents to:');
  console.log('ios/App/App/Assets.xcassets/AppIcon.appiconset/\n');
}

// Run
generateIosIcons().catch(console.error);
