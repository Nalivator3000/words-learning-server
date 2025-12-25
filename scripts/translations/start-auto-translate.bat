@echo off
REM Auto Translation Starter for Windows
REM This script runs the translation cron job in the background

echo.
echo ================================================================================
echo    AUTO TRANSLATION MATRIX BUILDER
echo ================================================================================
echo.
echo This will start an automatic translation job that runs every 6 hours.
echo.
echo Options:
echo   1. Run in foreground (you'll see all output)
echo   2. Run in background (silent, logs to file)
echo   3. Cancel
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Starting in FOREGROUND mode...
    echo Press Ctrl+C to stop
    echo.
    node auto-translate-cron.js 6
) else if "%choice%"=="2" (
    echo.
    echo Starting in BACKGROUND mode...
    echo Logs will be saved to: auto-translate.log
    echo.
    start /b cmd /c "node auto-translate-cron.js 6 >> auto-translate.log 2>&1"
    echo.
    echo ✅ Background process started!
    echo.
    echo To stop the process:
    echo   1. Open Task Manager
    echo   2. Find "Node.js" process running "auto-translate-cron.js"
    echo   3. End the process
    echo.
    echo Or use: taskkill /F /IM node.exe /FI "WINDOWTITLE eq auto-translate-cron"
    echo.
) else (
    echo.
    echo Cancelled.
    echo.
)

pause
