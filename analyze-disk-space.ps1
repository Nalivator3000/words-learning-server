# Disk Space Analyzer for Windows
# Finds largest files and folders on drive C:

Write-Host "=== Disk Space Analyzer ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Warning: Not running as Administrator. Some folders may be inaccessible." -ForegroundColor Yellow
    Write-Host ""
}

# Get disk info
$disk = Get-PSDrive C
Write-Host "Drive C: Information:" -ForegroundColor Green
Write-Host "  Total Size: $([math]::Round($disk.Used / 1GB + $disk.Free / 1GB, 2)) GB"
Write-Host "  Used Space: $([math]::Round($disk.Used / 1GB, 2)) GB"
Write-Host "  Free Space: $([math]::Round($disk.Free / 1GB, 2)) GB"
Write-Host ""

# Function to get folder size
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

# Analyze top-level folders in C:\
Write-Host "Analyzing top-level folders in C:\... (this may take a few minutes)" -ForegroundColor Yellow
Write-Host ""

$folders = Get-ChildItem -Path "C:\" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Scanning: $($_.Name)" -ForegroundColor Gray
    $size = Get-FolderSize $_.FullName
    [PSCustomObject]@{
        Name = $_.Name
        Path = $_.FullName
        SizeGB = [math]::Round($size / 1GB, 2)
        SizeMB = [math]::Round($size / 1MB, 2)
    }
} | Sort-Object SizeGB -Descending

Write-Host ""
Write-Host "=== TOP 15 LARGEST FOLDERS IN C:\ ===" -ForegroundColor Cyan
$folders | Select-Object -First 15 | Format-Table -AutoSize

# Find largest files in C:\Users
Write-Host ""
Write-Host "=== TOP 20 LARGEST FILES IN C:\Users ===" -ForegroundColor Cyan
Write-Host "Scanning files... (this may take a while)" -ForegroundColor Yellow
Write-Host ""

try {
    $largeFiles = Get-ChildItem -Path "C:\Users" -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -gt 100MB } |
        Sort-Object Length -Descending |
        Select-Object -First 20 |
        ForEach-Object {
            [PSCustomObject]@{
                Name = $_.Name
                SizeGB = [math]::Round($_.Length / 1GB, 2)
                SizeMB = [math]::Round($_.Length / 1MB, 2)
                Path = $_.FullName
                LastModified = $_.LastWriteTime
            }
        }

    $largeFiles | Format-Table Name, SizeGB, SizeMB, LastModified -AutoSize
    Write-Host ""
    Write-Host "Full paths of large files:" -ForegroundColor Gray
    $largeFiles | ForEach-Object { Write-Host "  $($_.Path)" -ForegroundColor DarkGray }
} catch {
    Write-Host "Error scanning files: $_" -ForegroundColor Red
}

# Common folders to check
Write-Host ""
Write-Host "=== COMMON SPACE CONSUMERS ===" -ForegroundColor Cyan

$commonPaths = @(
    "C:\Windows\Temp",
    "C:\Windows\SoftwareDistribution\Download",
    "C:\ProgramData\Microsoft\Windows\WER",
    "$env:USERPROFILE\AppData\Local\Temp",
    "$env:USERPROFILE\Downloads",
    "$env:USERPROFILE\AppData\Local\Microsoft\Windows\INetCache"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        $size = Get-FolderSize $path
        $sizeGB = [math]::Round($size / 1GB, 2)
        $sizeMB = [math]::Round($size / 1MB, 2)

        if ($sizeGB -gt 0.1) {
            Write-Host "$path : $sizeGB GB" -ForegroundColor Yellow
        } else {
            Write-Host "$path : $sizeMB MB" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host "1. Run Disk Cleanup: cleanmgr.exe /d C:"
Write-Host "2. Clear temporary files manually from folders listed above"
Write-Host "3. Uninstall unused programs via Settings > Apps"
Write-Host "4. Check large files in Downloads and Desktop folders"
Write-Host "5. Use Storage Sense: Settings > System > Storage"
Write-Host ""
Write-Host "Analysis complete!" -ForegroundColor Green
