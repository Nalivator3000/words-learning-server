#!/usr/bin/env node
/**
 * Extract CSS styles for specific elements
 */

const puppeteer = require('puppeteer');

async function main() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://lexybooster.com', { waitUntil: 'networkidle0' });

    // Extract CSS for auth buttons
    const styles = await page.evaluate(() => {
        const result = {};

        // Get auth tabs
        const authTabs = document.querySelector('.auth-tabs');
        if (authTabs) {
            const computed = window.getComputedStyle(authTabs);
            result.authTabs = {
                display: computed.display,
                flexDirection: computed.flexDirection,
                gap: computed.gap,
                margin: computed.margin,
                padding: computed.padding
            };
        }

        // Get auth tab buttons
        const authTab = document.querySelector('.auth-tab');
        if (authTab) {
            const computed = window.getComputedStyle(authTab);
            result.authTab = {
                padding: computed.padding,
                margin: computed.margin,
                width: computed.width,
                height: computed.height,
                background: computed.background,
                border: computed.border,
                borderRadius: computed.borderRadius
            };
        }

        // Get auth divider
        const authDivider = document.querySelector('.auth-divider');
        if (authDivider) {
            const computed = window.getComputedStyle(authDivider);
            result.authDivider = {
                margin: computed.margin,
                padding: computed.padding,
                textAlign: computed.textAlign,
                color: computed.color,
                height: computed.height
            };
        }

        // Get auth buttons
        const authBtn = document.querySelector('.auth-btn');
        if (authBtn) {
            const computed = window.getComputedStyle(authBtn);
            result.authBtn = {
                padding: computed.padding,
                margin: computed.margin,
                width: computed.width,
                height: computed.height,
                background: computed.background,
                border: computed.border,
                borderRadius: computed.borderRadius
            };
        }

        // Get google button
        const googleBtn = document.querySelector('.google-btn');
        if (googleBtn) {
            const computed = window.getComputedStyle(googleBtn);
            result.googleBtn = {
                padding: computed.padding,
                margin: computed.margin,
                width: computed.width,
                background: computed.background
            };
        }

        return result;
    });

    console.log('\n🎨 Extracted CSS Styles:\n');
    console.log(JSON.stringify(styles, null, 2));

    await browser.close();
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
