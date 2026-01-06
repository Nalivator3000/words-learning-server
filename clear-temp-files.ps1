# Clear temporary files
Write-Host "=== Clearing Temporary Files ===" -ForegroundColor Cyan
Write-Host ""

$tempPath = "$env:USERPROFILE\AppData\Local\Temp"
Write-Host "Calculating current size..." -ForegroundColor Yellow
$beforeSize = (Get-ChildItem -Path $tempPath -Recurse -File -ErrorAction SilentlyContinue |
               Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum

Write-Host "Size before: $([math]::Round($beforeSize / 1GB, 2)) GB" -ForegroundColor White
Write-Host ""

Write-Host "Deleting files..." -ForegroundColor Yellow
Remove-Item -Path "$tempPath\*" -Recurse -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "Calculating freed space..." -ForegroundColor Yellow
$afterSize = (Get-ChildItem -Path $tempPath -Recurse -File -ErrorAction SilentlyContinue |
              Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum

$freed = $beforeSize - $afterSize

Write-Host ""
Write-Host "=== RESULT ===" -ForegroundColor Green
Write-Host "Freed: $([math]::Round($freed / 1GB, 2)) GB" -ForegroundColor Green
Write-Host "Remaining in Temp: $([math]::Round($afterSize / 1GB, 2)) GB" -ForegroundColor Yellow
