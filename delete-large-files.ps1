# Delete large unnecessary files
Write-Host "=== Deleting Large Files ===" -ForegroundColor Cyan
Write-Host ""

$filesToDelete = @(
    # Archives and ZIP files
    "C:\Users\Nalivator3000\Downloads\Crorebet\4. Registered-20251120T071718Z-1-002.zip",
    "C:\Users\Nalivator3000\Downloads\Crorebet\5. Players-20251120T071723Z-1-013.zip",
    "C:\Users\Nalivator3000\Downloads\Kombine\OnlyWin.zip",
    "C:\Users\Nalivator3000\Downloads\Kombine\All_deposits_Ubidex_1.04-31.07.csv.gz",
    "C:\Users\Nalivator3000\.gologin\browser\orbita-browser-latest.zip",

    # Database
    "C:\Users\Nalivator3000\Cursor\ubidex_analysis\ubidex_analysis\data\events.db",

    # Old Puppeteer browsers
    "C:\Users\Nalivator3000\.gologin\browser\orbita-browser-138\138.0.7204.50\chrome.dll",
    "C:\Users\Nalivator3000\.cache\puppeteer\chrome\win64-141.0.7390.122\chrome-win64\chrome.dll",
    "C:\Users\Nalivator3000\.cache\puppeteer\chrome\win64-131.0.6778.204\chrome-win64\chrome.dll",
    "C:\Users\Nalivator3000\.cache\puppeteer\chrome-headless-shell\win64-141.0.7390.122\chrome-headless-shell-win64\chrome-headless-shell.exe",
    "C:\Users\Nalivator3000\.cache\puppeteer\chrome-headless-shell\win64-131.0.6778.204\chrome-headless-shell-win64\chrome-headless-shell.exe",

    # Old Claude installers
    "C:\Users\Nalivator3000\.claude\downloads\claude-1.0.93-win32-x64.exe",
    "C:\Users\Nalivator3000\.claude\downloads\claude-1.0.92-win32-x64.exe",

    # Android virtual device
    "C:\Users\Nalivator3000\.android\avd\Medium_Phone.avd\sdcard.img"
)

$totalFreed = 0
$deletedCount = 0
$notFoundCount = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        try {
            $size = (Get-Item $file).Length
            $sizeMB = [math]::Round($size / 1MB, 2)

            Write-Host "Deleting: $file" -ForegroundColor Yellow
            Write-Host "  Size: $sizeMB MB" -ForegroundColor Gray

            Remove-Item -Path $file -Force -ErrorAction Stop

            $totalFreed += $size
            $deletedCount++

            Write-Host "  [DELETED]" -ForegroundColor Green
        } catch {
            Write-Host "  [ERROR: $_]" -ForegroundColor Red
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor DarkGray
        $notFoundCount++
    }
    Write-Host ""
}

Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Files deleted: $deletedCount" -ForegroundColor Green
Write-Host "Files not found: $notFoundCount" -ForegroundColor Yellow
Write-Host "Total space freed: $([math]::Round($totalFreed / 1GB, 2)) GB ($([math]::Round($totalFreed / 1MB, 2)) MB)" -ForegroundColor Green
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
