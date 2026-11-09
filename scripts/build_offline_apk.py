import os
import subprocess
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

print("[1/4] Bundling JS via expo export:embed...")
subprocess.run([
    "npx.cmd", "expo", "export:embed",
    "--platform", "android",
    "--dev", "false",
    "--entry-file", "node_modules/expo-router/entry.js",
    "--bundle-output", bundle_path,
    "--assets-dest", "android/app/src/main/res"
], check=True)

print("[2/4] Packaging bundle into APK...")
with zipfile.ZipFile(base_apk, "r") as zin:
    with zipfile.ZipFile(temp_unsigned, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "assets/index.android.bundle":
                continue
            zout.writestr(item, zin.read(item.filename))
        zout.write(bundle_path, "assets/index.android.bundle")

if os.path.exists(temp_aligned):
    os.remove(temp_aligned)

print("[3/4] Zipaligning APK...")
subprocess.run([zipalign, "-p", "-f", "4", temp_unsigned, temp_aligned], check=True)

print("[4/4] Signing APK...")
subprocess.run([
    apksigner, "sign",
    "--ks", keystore,
    "--ks-pass", "pass:android",
    "--ks-key-alias", "androiddebugkey",
    "--out", final_apk,
    temp_aligned
], shell=True, check=True)

print(f"SUCCESS: Fresh APK created at {final_apk} ({os.path.getsize(final_apk) / 1024 / 1024:.2f} MB)")
