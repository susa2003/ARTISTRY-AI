$ErrorActionPreference = "Stop"

$jar = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\jar.exe"
$apksigner = "D:\Android\Sdk\build-tools\36.0.0\apksigner.bat"
$zipalign = "D:\Android\Sdk\build-tools\36.0.0\zipalign.exe"
$adb = "D:\Android\Sdk\platform-tools\adb.exe"

$baseApk = "android/app/build/outputs/apk/debug/app-debug.apk"
$tempUnsigned = "android/app/build/outputs/apk/debug/app-temp-unsigned.apk"
$tempAligned = "android/app/build/outputs/apk/debug/app-temp-aligned.apk"
$finalApk = "android/app/build/outputs/apk/debug/app-artistry-offline.apk"
$keystore = "android/app/debug.keystore"

Write-Host "Copying base APK..."
Copy-Item $baseApk $tempUnsigned -Force

Write-Host "Injecting bundle into assets..."
Push-Location android/app/src/main
& $jar uf "../../../../$tempUnsigned" assets/index.android.bundle
Pop-Location

if (Test-Path $tempAligned) { Remove-Item $tempAligned -Force }

Write-Host "Zipaligning APK..."
& $zipalign -p -f 4 $tempUnsigned $tempAligned

Write-Host "Signing APK with debug key..."
cmd.exe /c "`"$apksigner`" sign --ks `"$keystore`" --ks-pass pass:android --ks-key-alias androiddebugkey --out `"$finalApk`" `"$tempAligned`""

Write-Host "Installing to emulator..."
& $adb install -r $finalApk

Write-Host "Launching ARTISTRY AI..."
& $adb shell am start -n ai.artistry.studio/.MainActivity

Write-Host "Deploy completed successfully!"
