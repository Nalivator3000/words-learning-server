const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const { minify: minifyHTML } = require('html-minifier-terser');

console.log('🚀 Building FluentFlow for Production...\n');

const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

// Create dist directory
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Files to minify
const jsFiles = [
    'app.js',
    'service-worker.js'
];

const htmlFiles = [
    'index.html',
    'privacy.html',
    'terms.html'
];

// Minify JavaScript files
async function minifyJS() {
    console.log('📦 Minifying JavaScript...');
    for (const file of jsFiles) {
        const inputPath = path.join(publicDir, file);
        const outputPath = path.join(distDir, file);

        if (!fs.existsSync(inputPath)) {
            console.log(`⚠️  Skipping ${file} (not found)`);
            continue;
        }

        const code = fs.readFileSync(inputPath, 'utf8');
        const result = await minify(code, {
            compress: {
                dead_code: true,
                drop_console: process.env.DROP_CONSOLE === 'true',
                drop_debugger: true,
                passes: 2
            },
            mangle: {
                toplevel: false,
                keep_fnames: false
            },
            format: {
                comments: false
            }
        });

        if (result.code) {
            fs.writeFileSync(outputPath, result.code);
            const originalSize = (code.length / 1024).toFixed(2);
            const minifiedSize = (result.code.length / 1024).toFixed(2);
            const savings = (((code.length - result.code.length) / code.length) * 100).toFixed(1);
            console.log(`  ✅ ${file}: ${originalSize} KB → ${minifiedSize} KB (${savings}% smaller)`);
        }
    }
}

// Minify HTML files
async function minifyHTMLFiles() {
    console.log('\n📄 Minifying HTML...');
    for (const file of htmlFiles) {
        const inputPath = path.join(publicDir, file);
        const outputPath = path.join(distDir, file);

        if (!fs.existsSync(inputPath)) {
            console.log(`⚠️  Skipping ${file} (not found)`);
            continue;
        }

        const html = fs.readFileSync(inputPath, 'utf8');
        const result = await minifyHTML(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyCSS: true,
            minifyJS: true,
            useShortDoctype: true
        });

        fs.writeFileSync(outputPath, result);
        const originalSize = (html.length / 1024).toFixed(2);
        const minifiedSize = (result.length / 1024).toFixed(2);
        const savings = (((html.length - result.length) / html.length) * 100).toFixed(1);
        console.log(`  ✅ ${file}: ${originalSize} KB → ${minifiedSize} KB (${savings}% smaller)`);
    }
}

// Copy static assets (icons, manifest, etc.)
function copyAssets() {
    console.log('\n📋 Copying static assets...');

    const assetDirs = ['icons', 'css'];
    const assetFiles = ['manifest.json', 'logo.svg'];

    // Copy directories
    assetDirs.forEach(dir => {
        const srcDir = path.join(publicDir, dir);
        const destDir = path.join(distDir, dir);

        if (fs.existsSync(srcDir)) {
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            const files = fs.readdirSync(srcDir);
            files.forEach(file => {
                fs.copyFileSync(
                    path.join(srcDir, file),
                    path.join(destDir, file)
                );
            });
            console.log(`  ✅ Copied /${dir}/ (${files.length} files)`);
        }
    });

    // Copy individual files
    assetFiles.forEach(file => {
        const srcFile = path.join(publicDir, file);
        const destFile = path.join(distDir, file);

        if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`  ✅ Copied ${file}`);
        }
    });
}

// Generate build info
function generateBuildInfo() {
    const buildInfo = {
        version: require('./package.json').version,
        buildDate: new Date().toISOString(),
        nodeVersion: process.version,
        environment: 'production'
    };

    fs.writeFileSync(
        path.join(distDir, 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
    );

    console.log('\n📊 Build Info:');
    console.log(`  Version: ${buildInfo.version}`);
    console.log(`  Date: ${buildInfo.buildDate}`);
    console.log(`  Node: ${buildInfo.nodeVersion}`);
}

// Calculate total size
function calculateSize() {
    console.log('\n💾 Build Statistics:');

    let totalSize = 0;
    const countFiles = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                countFiles(filePath);
            } else {
                totalSize += stats.size;
            }
        });
    };

    countFiles(distDir);
    console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

// Run build
async function build() {
    try {
        await minifyJS();
        await minifyHTMLFiles();
        copyAssets();
        generateBuildInfo();
        calculateSize();

        console.log('\n✅ Production build complete!');
        console.log(`📁 Output: ${distDir}`);
        console.log('\n🚀 Ready for deployment!\n');
    } catch (error) {
        console.error('\n❌ Build failed:', error);
        process.exit(1);
    }
}

build();
