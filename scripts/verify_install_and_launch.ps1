$adb = "D:\Android\Sdk\platform-tools\adb.exe"
$apk = "D:\antigravity\artist ai app\android\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "=== 1. WAITING FOR ADB DEVICE ==="
& $adb wait-for-device
& $adb devices

Write-Host "=== 2. WAITING FOR BOOT COMPLETION ==="
$boot = ""
$attempts = 0
while ($boot -ne "1" -and $attempts -lt 60) {
    Start-Sleep -Seconds 2
    $boot = (& $adb shell getprop sys.boot_completed 2>&1).Trim()
    Write-Host "Boot status: $boot (attempt $attempts)"
    $attempts++
}

Write-Host "=== 3. VERIFYING DEVICE ABI ==="
$abi = (& $adb shell getprop ro.product.cpu.abi).Trim()
Write-Host "Target Device ABI: $abi"

Write-Host "=== 4. INSTALLING APK ==="
& $adb install -r -d $apk

Write-Host "=== 5. CHECKING INSTALLED PACKAGE ==="
& $adb shell pm list packages | Select-String "ai.artistry"

Write-Host "=== 6. CLEARING LOGCAT & LAUNCHING APP ==="
& $adb logcat -c
$launchResult = & $adb shell am start -n ai.artistry.studio/.MainActivity 2>&1
Write-Host "Launch result: $launchResult"

Write-Host "=== 7. WAITING FOR INITIALIZATION (8s) ==="
Start-Sleep -Seconds 8

Write-Host "=== 8. CHECKING PROCESS & RESUMED ACTIVITY ==="
& $adb shell "ps -A | grep ai.artistry"
& $adb shell dumpsys activity activities | Select-String "mResumedActivity"

Write-Host "=== 9. LOGCAT CRASH & SOLDR CHECK ==="
& $adb logcat -d -s AndroidRuntime:E ReactNative:V SoLoader:V
