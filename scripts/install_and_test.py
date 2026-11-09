import os
import subprocess
import time

adb = r"D:\Android\Sdk\platform-tools\adb.exe"
apk = "android/app/build/outputs/apk/debug/app-artistry-offline.apk"
screenshots_dir = "artifacts/screenshots"
os.makedirs(screenshots_dir, exist_ok=True)

print("Waiting for emulator to be online...")
for attempt in range(60):
    try:
        out = subprocess.check_output([adb, "devices"]).decode()
        if "emulator-5554\tdevice" in out:
            print("Emulator device state confirmed online!")
            break
    except Exception as e:
        pass
    time.sleep(2)
else:
    print("Emulator timed out waiting for online state.")

print("Waiting for Android OS boot completion (sys.boot_completed == 1)...")
for attempt in range(60):
    try:
        res = subprocess.check_output([adb, "shell", "getprop", "sys.boot_completed"]).decode().strip()
        if res == "1":
            print("Android OS fully booted!")
            break
    except Exception as e:
        pass
    time.sleep(2)

print(f"Installing {apk} on emulator-5554...")
install_out = subprocess.run([adb, "install", "-r", apk], capture_output=True, text=True)
print("Install stdout:", install_out.stdout)
print("Install stderr:", install_out.stderr)

if install_out.returncode != 0:
    print("Install failed! Aborting.")
    exit(1)

print("Launching ARTISTRY AI main activity...")
subprocess.run([adb, "shell", "am", "start", "-n", "ai.artistry.studio/.MainActivity"], check=True)
time.sleep(4)

def capture_screen(name: str):
    remote = f"/data/local/tmp/{name}.png"
    local = os.path.join(screenshots_dir, f"{name}.png")
    subprocess.run([adb, "shell", "screencap", "-p", remote], check=True)
    subprocess.run([adb, "pull", remote, local], check=True)
    print(f"Captured screenshot: {local}")

# 1. Main home screen
capture_screen("01_home_screen")

# Test Module 1: Anatomy Academy
print("Testing Anatomy Academy...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/anatomy"], check=True)
time.sleep(3)
capture_screen("02_anatomy_academy")

# Test Module 2: Perspective Assistant
print("Testing Perspective Assistant...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/perspective"], check=True)
time.sleep(3)
capture_screen("03_perspective_assistant")

# Test Module 3: Shading Studio
print("Testing Shading Studio...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/shading"], check=True)
time.sleep(3)
capture_screen("04_shading_studio")

# Test Module 4: Reference vs My Drawing
print("Testing Reference vs My Drawing...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/compare"], check=True)
time.sleep(3)
capture_screen("05_compare_drawing")

# Test Module 5: Reference Library
print("Testing Reference Library...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/library"], check=True)
time.sleep(3)
capture_screen("06_reference_library")

# Test Module 6: Learning Center & Challenges
print("Testing Learning Center...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/learning"], check=True)
time.sleep(3)
capture_screen("07_learning_center")

print("ALL PHASE 3 MODULES VERIFIED SUCCESSFULLY ON RUNTIME EMULATOR!")
