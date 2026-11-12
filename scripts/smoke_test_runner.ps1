$adb = "D:\Android\Sdk\platform-tools\adb.exe"

Write-Host "--- 1. Get PID of ai.artistry.studio ---"
& $adb wait-for-device
$procLine = & $adb shell "ps -A" | Select-String "ai.artistry.studio"
Write-Host "Process Line: $procLine"

$pidMatch = [regex]::Match($procLine, '\s+(\d+)\s+')
if ($pidMatch.Success) {
    $appPid = $pidMatch.Groups[1].Value.Trim()
    Write-Host "Target PID: $appPid"
    
    Write-Host "`n--- 2. App Logcat (All tags for PID $appPid) ---"
    $logs = & $adb logcat --pid=$appPid -d
    Write-Host "Total log lines: $($logs.Count)"
    Write-Host "First 30 log lines:"
    $logs | Select-Object -First 30 | ForEach-Object { Write-Host $_ }
    Write-Host "`nLast 40 log lines:"
    $logs | Select-Object -Last 40 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "Could not find PID for ai.artistry.studio"
}


