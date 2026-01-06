@echo off
echo ========================================
echo   Checking Railway Deployment Status
echo ========================================
echo.

echo [1/3] Checking API cache stats format...
curl -s https://words-learning-server-production.up.railway.app/api/tts/cache/stats
echo.
echo.

echo [2/3] Checking if Google Drive field exists...
curl -s https://words-learning-server-production.up.railway.app/api/tts/cache/stats | findstr "google_drive"
if %errorlevel%==0 (
    echo ✅ NEW FORMAT - Deployment successful!
) else (
    echo ⏳ OLD FORMAT - Still deploying...
)
echo.

echo [3/3] Instructions:
echo.
echo If you see OLD FORMAT:
echo   - Wait 2-3 more minutes
echo   - Run this script again: check-deployment-status.bat
echo.
echo If you see NEW FORMAT:
echo   - Deployment is complete!
echo   - Test TTS on https://lexybooster.com
echo   - Check Google Drive: https://drive.google.com/drive/folders/1Knq7vVE_l8vphiQoZxUuLQ20eUU46ICx
echo.

pause
