@echo off
echo ============================================
echo Swahili Translation Setup and Execution
echo ============================================
echo.

echo [1/3] Installing required dependency...
echo.
call npm install @vitalets/google-translate-api --save
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependency
    pause
    exit /b 1
)
echo.

echo [2/3] Dependency installed successfully!
echo.

echo [3/3] Starting Swahili translation...
echo This will translate ~10,515 German words to Swahili
echo Estimated time: 9-12 hours
echo.
echo Press Ctrl+C to cancel, or
pause

node scripts/translate-all-to-swahili.js

echo.
echo ============================================
echo Translation process completed!
echo Check the output above for results.
echo ============================================
pause
