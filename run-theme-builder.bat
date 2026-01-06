@echo off
REM Theme Builder for Japanese Words
REM This script generates themes for all 9,996 Japanese words

echo Starting Japanese Theme Builder...
echo.
echo Input file: japanese-words-for-themes.txt
echo Output file: themes-japanese-all.json
echo.

REM Run the Node.js script
node quick-theme-builder.js

if %errorlevel% equ 0 (
    echo.
    echo Success! themes-japanese-all.json has been created.
    REM Verify the file
    if exist themes-japanese-all.json (
        for /F %%A in ('wc -c < themes-japanese-all.json') do (
            echo File size: %%A bytes
        )
    )
) else (
    echo.
    echo Error: Failed to create themes-japanese-all.json
    echo Please ensure Node.js is installed.
    exit /b 1
)

pause
