@echo off
echo ================================================================================
echo HINDI VOCABULARY REBUILD
echo ================================================================================
echo.
echo This script will:
echo   1. Delete all synthetic/test data from source_words_hindi
echo   2. Generate ~10,000 real Hindi words
echo   3. Assign themes to all words
echo   4. Create thematic word sets
echo.
echo ================================================================================
echo.
echo Checking current status...
echo.

node check-hindi-status.js

echo.
echo ================================================================================
echo.
set /p CONFIRM="Do you want to proceed with rebuild? (Y/N): "

if /i "%CONFIRM%"=="Y" (
    echo.
    echo Starting rebuild process...
    echo.
    node rebuild-hindi-vocabulary-complete.js
    echo.
    echo ================================================================================
    echo Rebuild complete! Checking final status...
    echo ================================================================================
    echo.
    node check-hindi-status.js
) else (
    echo.
    echo Rebuild cancelled.
)

echo.
pause
