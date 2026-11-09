import os
import subprocess
import sys
import zipfile

os.environ["JAVA_HOME"] = r"D:\Android\jdk-17"
os.environ["PATH"] = r"D:\Android\jdk-17\bin;" + os.environ["PATH"]

base_apk = "android/app/build/outputs/apk/debug/app-debug.apk"
temp_unsigned = "android/app/build/outputs/apk/debug/app-temp-unsigned.apk"
temp_aligned = "android/app/build/outputs/apk/debug/app-temp-aligned.apk"
final_apk = "android/app/build/outputs/apk/debug/app-artistry-offline.apk"
bundle_path = "android/app/src/main/assets/index.android.bundle"
keystore = "android/app/debug.keystore"
zipalign = r"D:\Android\Sdk\build-tools\36.0.0\zipalign.exe"
apksigner = r"D:\Android\Sdk\build-tools\36.0.0\apksigner.bat"
adb = r"D:\Android\Sdk\platform-tools\adb.exe"

print("Writing updated bundle into temp APK...")
with zipfile.ZipFile(base_apk, "r") as zin:
    with zipfile.ZipFile(temp_unsigned, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "assets/index.android.bundle":
                continue
            zout.writestr(item, zin.read(item.filename))
        zout.write(bundle_path, "assets/index.android.bundle")

if os.path.exists(temp_aligned):
    os.remove(temp_aligned)

print("Zipaligning APK...")
subprocess.run([zipalign, "-p", "-f", "4", temp_unsigned, temp_aligned], check=True)

print("Signing APK...")
subprocess.run([
    apksigner, "sign",
    "--ks", keystore,
    "--ks-pass", "pass:android",
    "--ks-key-alias", "androiddebugkey",
    "--out", final_apk,
    temp_aligned
], shell=True, check=True)

print("Installing to emulator...")
subprocess.run([adb, "install", "-r", final_apk], check=True)

print("Launching ARTISTRY AI...")
subprocess.run([adb, "shell", "am", "start", "-n", "ai.artistry.studio/.MainActivity"], check=True)

print("SUCCESS: App deployed and launched!")
