@echo off
echo Waiting for Railway deploy to complete...
timeout /t 180 /nobreak > nul

echo.
echo Testing Google Drive cache integration...
echo.

node clear-tts-cache.js https://words-learning-server-production.up.railway.app local

pause
