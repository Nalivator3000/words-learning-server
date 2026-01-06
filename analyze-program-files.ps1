# Analyze Program Files (x86) to find biggest folders
Write-Host "=== Analyzing Program Files (x86) ===" -ForegroundColor Cyan
Write-Host "This will show the largest programs/folders..." -ForegroundColor Yellow
Write-Host ""

function Get-FolderSize {
    param([string]$Path)
    try {
        $size = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue |
                 Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        return $size
    } catch {
        return 0
    }
}

$programFiles = "C:\Program Files (x86)"
$folders = Get-ChildItem -Path $programFiles -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Scanning: $($_.Name)" -ForegroundColor Gray
    $size = Get-FolderSize $_.FullName
    [PSCustomObject]@{
        Name = $_.Name
        FullPath = $_.FullName
        SizeGB = [math]::Round($size / 1GB, 2)
        SizeMB = [math]::Round($size / 1MB, 2)
    }
} | Sort-Object SizeGB -Descending

Write-Host ""
Write-Host "=== TOP 30 LARGEST FOLDERS ===" -ForegroundColor Green
$folders | Select-Object -First 30 | Format-Table Name, SizeGB, SizeMB -AutoSize

Write-Host ""
Write-Host "=== FULL PATHS ===" -ForegroundColor Cyan
$folders | Select-Object -First 30 | ForEach-Object {
    Write-Host "$($_.FullPath) - $($_.SizeGB) GB" -ForegroundColor Yellow
}
