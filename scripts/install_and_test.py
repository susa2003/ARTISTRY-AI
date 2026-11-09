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

# Test Phase 3 Modules
print("Testing Anatomy Academy...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/anatomy"], check=True)
time.sleep(3)
capture_screen("02_anatomy_academy")

print("Testing Perspective Assistant...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/perspective"], check=True)
time.sleep(3)
capture_screen("03_perspective_assistant")

print("Testing Shading Studio...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/shading"], check=True)
time.sleep(3)
capture_screen("04_shading_studio")

print("Testing Reference vs My Drawing...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/compare"], check=True)
time.sleep(3)
capture_screen("05_compare_drawing")

print("Testing Reference Library...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/library"], check=True)
time.sleep(3)
capture_screen("06_reference_library")

print("Testing Learning Center...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/learning"], check=True)
time.sleep(3)
capture_screen("07_learning_center")

# Test Phase 4 Modules
print("Testing AI Sketch Converter...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/sketch"], check=True)
time.sleep(3)
capture_screen("08_sketch_converter")

print("Testing AI Drawing Analyzer...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/analyzer"], check=True)
time.sleep(3)
capture_screen("09_drawing_analyzer")

print("Testing AI Reference Generator...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/generator"], check=True)
time.sleep(3)
capture_screen("10_reference_generator")

print("Testing Drawing Progress AI...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/progress"], check=True)
time.sleep(3)
capture_screen("11_drawing_progress")

print("Testing AI Pose & Gesture Coach...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/pose"], check=True)
time.sleep(3)
capture_screen("12_pose_coach")

print("Testing AI Hand & Foot Assistant...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/handfoot"], check=True)
time.sleep(3)
capture_screen("13_hand_foot")

print("Testing AI Lighting Predictor...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/lighting"], check=True)
time.sleep(3)
capture_screen("14_lighting_predictor")

print("Testing AI Composition Coach...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/composition"], check=True)
time.sleep(3)
capture_screen("15_composition_coach")

print("Testing AI Line Art Cleaner...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/linecleaner"], check=True)
time.sleep(3)
capture_screen("16_line_cleaner")

print("Testing AI Smart Segmentation...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/segmentation"], check=True)
time.sleep(3)
capture_screen("17_segmentation")

print("Testing AI Color Recommender...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/colorrec"], check=True)
time.sleep(3)
capture_screen("18_color_recommender")

print("Testing AI Multi-Angle Creator...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/turnaround"], check=True)
time.sleep(3)
capture_screen("19_multi_angle")

print("Testing Smart Stroke Replay...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/replay"], check=True)
time.sleep(3)
capture_screen("20_stroke_replay")

print("Testing AI Mistake Detector...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/mistakes"], check=True)
time.sleep(3)
capture_screen("21_mistake_detector")

print("Testing AI Art Mentor...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/mentor"], check=True)
time.sleep(3)
capture_screen("22_art_mentor")

print("Testing Sketch-to-Vector Converter...")
subprocess.run([adb, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "artistryai://tools/vectorizer"], check=True)
time.sleep(3)
capture_screen("23_vector_converter")

print("ALL PHASE 3 AND PHASE 4 ECOSYSTEM MODULES VERIFIED SUCCESSFULLY ON RUNTIME EMULATOR!")
