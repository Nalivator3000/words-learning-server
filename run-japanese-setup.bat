@echo off
echo ================================================================================
echo JAPANESE VOCABULARY COMPLETE SETUP
echo ================================================================================
echo.
echo This script will set up complete Japanese vocabulary with:
echo - Clean up synthetic data
echo - Generate ~10,000 real Japanese words
echo - Assign themes to all words
echo - Create thematic word sets
echo.
echo Estimated time: 45-90 minutes
echo.
echo ================================================================================
echo.

REM Check if API key is set
if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: ANTHROPIC_API_KEY environment variable is not set!
    echo.
    echo Please set it first:
    echo   For this session only:
    echo     set ANTHROPIC_API_KEY=your-api-key-here
    echo.
    echo   Then run this script again.
    echo.
    pause
    exit /b 1
)

echo API Key: %ANTHROPIC_API_KEY:~0,20%...
echo.
echo Press any key to start setup, or Ctrl+C to cancel...
pause > nul

echo.
echo Starting complete setup...
echo.

node setup-japanese-complete.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! Japanese vocabulary setup is complete.
    echo ================================================================================
    echo.
    echo You can now check the status with:
    echo   node check-japanese-status.js
    echo.
) else (
    echo.
    echo ================================================================================
    echo ERROR: Setup failed with error code %ERRORLEVEL%
    echo ================================================================================
    echo.
    echo Please check the error messages above and try again.
    echo.
)

pause
