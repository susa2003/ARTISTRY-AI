$adb = "D:\Android\Sdk\platform-tools\adb.exe"

& $adb wait-for-device
$procLine = & $adb shell "ps -A" | Select-String "ai.artistry.studio"
$pidMatch = [regex]::Match($procLine, '\s+(\d+)\s+')
$appPid = $pidMatch.Groups[1].Value.Trim()

Write-Host "Target PID: $appPid"
Write-Host "--- Total logs for PID $appPid ---"
$logs = & $adb logcat --pid=$appPid -d
Write-Host "Line count: $($logs.Count)"
Write-Host "Last 25 lines:"
$logs | Select-Object -Last 25 | ForEach-Object { Write-Host $_ }


