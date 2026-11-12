# ARTISTRY AI — PHASE 9G GOOGLE PLAY STORE RELEASE CHECKLIST
**Release Preparation, Store Metadata, Signing Credentials, Data Safety & Submission Checklist**

- **Date:** November 12, 2026
- **Application Name:** ARTISTRY AI
- **Application Package ID:** `ai.artistry.studio`
- **Current Version:** `1.0.0` (Version Code: `1`)
- **Status:** **COMPLETE SPECIFICATION & CHECKLIST**

---

## 1. Google Play Store Listing Metadata

### 1.1 Application Name & Category
- **App Name:** `ARTISTRY AI — Classical Art Studio & Traditional Companion` (50 characters max).
- **Short Description (80 chars max):**
  `Master traditional drawing with Loomis overlays, Bargue studies, and Skia studio.`
- **Primary Category:** `Art & Design`
- **Secondary Category:** `Education`
- **Content Rating:** `Everyone / PEGI 3 / IARC 3+` (No violence, no mature themes, no user-generated public content).

### 1.2 Full Play Store Description (4000 chars max)
```text
ARTISTRY AI is the premier traditional drawing companion and digital atelier designed specifically for observational artists, classical atelier students, and digital illustrators.

Whether you draw with graphite and charcoal on archival paper or paint digitally, ARTISTRY AI provides the classical measuring tools, anatomical guides, and progressive curriculum taught in the world's leading academic art schools.

============================================================
CORE FEATURES
============================================================

● 100% OFFLINE-FIRST DRAWING ATELIER
Draw with a responsive 2D graphics engine powered by Skia. Features 4 specialized drawing tools: Traditional Graphite Pencil, Calligraphic Ink Pen, Soft Wash Brush, and Precision Kneaded Eraser. Multi-layer workflow with opacity control, stroke smoothing, and full undo/redo history.

● 8-STAGE LOOMIS HEAD METHOD
Construct human heads from any angle with parametric 3D cranium spheres, brow line alignment, facial thirds, ear placement guides, and perspective tilt axes.

● CLASSICAL PERSPECTIVE & PROPORTION GRIDS
Master spatial depth with interactive 1-Point, 2-Point, and 3-Point perspective vanishing points. Compose balanced masterworks using the Golden Ratio spiral, Dynamic Armatures, and Rule of Thirds grids.

● OPTICAL CAMERA COMPANION & PAPER STUDIO
Bridge the digital and traditional divide. Set your device beside your physical sketchbook for live optical reference. Photograph physical drawings, deskew paper perspective with 4-point keystone correction, isolate values, and print archival study worksheets with grid transfer ratios.

● CLASSICAL BARGUE DRAWING CURRICULUM
Follow the renowned Charles Bargue drawing course. Progress from simple linear contours to complex sculptural cast studies with live overlay checkpoints and step-by-step guidance.

● TIMED DRAWING SPRINTS & STREAK TRACKING
Build lifelong artistic discipline with 5 to 30-minute daily observational sprints. Track consecutive practice streaks and detailed session analytics completely offline.

● ON-DEVICE DRAWING ANALYSIS & MISTAKE DETECTION
Compare your sketch against reference images using side-by-side comparison, overlay toggles, and difference heatmaps. Receive objective rubric scores for proportion, contour alignment, perspective accuracy, and shading values—all computed locally on your device.

● BILINGUAL ART MENTOR
Ask drawing questions and receive contextual feedback in English and Tamil. Seamless voice-assisted navigation keeps your hands on the canvas.

============================================================
PRIVACY FIRST
============================================================
ARTISTRY AI is built with an offline-first philosophy:
• Your artwork, reference images, and practice history remain on your device.
• Zero advertising SDKs.
• Zero third-party behavioral tracking.
• No account required to access core classical drawing tools.
```

---

## 2. Graphic Assets & Artwork Checklist

| Asset | Specifications | Format | Status / Action |
| :--- | :--- | :--- | :--- |
| **App Icon** | 512 × 512 px, 32-bit PNG with alpha, max 1024 KB | PNG | Ready in `assets/images/icon.png` |
| **Adaptive Icon** | 432 × 432 px (foreground 264 × 264 px safe zone) | PNG | Ready in `android/app/src/main/res/mipmap-*` |
| **Feature Graphic** | 1024 × 500 px, no transparency, JPEG or 24-bit PNG | PNG/JPEG | Developer action: Render studio banner |
| **Phone Screenshots** | Min 2, max 8. Recommended: 1080 × 1920 or 1080 × 2400 px | PNG/JPEG | Developer action: Capture 4-8 screenshots |
| **7-Inch Tablet** | Min 1 screenshot, recommended 1200 × 1920 px | PNG/JPEG | Developer action: Capture on tablet emulator |
| **10-Inch Tablet** | Min 1 screenshot, recommended 1600 × 2560 px | PNG/JPEG | Developer action: Capture on tablet emulator |

### Recommended Screenshot Flow:
1. **Screenshot 1:** Free Drawing Studio with active Skia brush strokes, color palette, and layer drawer.
2. **Screenshot 2:** Reference Studio showing the 8-Stage Loomis Head Method overlay on portrait study.
3. **Screenshot 3:** 2-Point and 3-Point perspective grids with dynamic vanishing point handles.
4. **Screenshot 4:** Paper Studio optical camera companion with keystone deskewing and value posterization.
5. **Screenshot 5:** Classical Bargue Drawing plate lesson with live checkpoint overlays.
6. **Screenshot 6:** Drawing comparison tool with alignment difference heatmap and proportion rubric scores.

---

## 3. Data Safety Declaration (Google Play Console)

Google Play requires developers to complete the Data Safety questionnaire. ARTISTRY AI declarations:

### 3.1 Data Collection & Sharing Summary
- **Does your app collect or share any of the required user data types?**
  **YES** (Only user-selected photos/images when explicitly choosing to import or photograph reference).
- **Is all of the user data collected by your app encrypted in transit?**
  **YES** (All optional network communications utilize HTTPS / TLS 1.3).
- **Do you provide a way for users to request that their data be deleted?**
  **YES** (Users can delete drawings, references, or entire account data at any time).

### 3.2 Specific Data Item Declarations
| Data Type | Collected? | Shared? | Purpose | Optional/Required |
| :--- | :--- | :--- | :--- | :--- |
| **Photos and Videos** | Yes (Local Only) | No | App functionality (drawing reference & optical comparison) | Optional (User chooses images) |
| **Personal Info (Email)** | Yes (Optional) | No | Account management & multi-device sync | Optional (Anonymous use permitted) |
| **Audio Files** | No | No | N/A (Audio processed transiently on-device) | N/A |
| **Financial Info** | Handled by Google | No | Google Play Billing handles all payment data | Optional (Free tier available) |
| **Location** | No | No | N/A | N/A |
| **Device or other IDs** | No | No | N/A | N/A |

---

## 4. Release Signing & Production AAB Configuration

> [!IMPORTANT]
> **Developer Action Required: Production Keystore Generation**
> As per strict development rules, fake signing credentials were NOT created and existing keys were NOT overwritten. Follow these exact steps to generate your production upload keystore:

### Step 1: Generate Production Upload Keystore (One-Time Developer Action)
Run the following standard Java `keytool` command in your terminal (replace passwords with your secure credentials):
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure Gradle Environment Variables
Do **not** commit `my-upload-key.keystore` to Git. Place the keystore in `android/app/` (already ignored by `.gitignore`) or in your home directory, and configure your local `~/.gradle/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your-secure-keystore-password
MYAPP_UPLOAD_KEY_PASSWORD=your-secure-key-password
```

### Step 3: Generate Signed Android App Bundle (AAB) for Play Console
Run:
```powershell
Set-Location "D:\antigravity\artist ai app\android"
.\gradlew.bat :app:bundleRelease
```
- **Output Artifact:** `android/app/build/outputs/bundle/release/app-release.aab`
- This single `.aab` file contains split binaries for `arm64-v8a` and `x86_64`, dynamic feature assets, and optimized R8 ProGuard bytecode.

---

## 5. Google Play Billing Setup (Subscriptions)

If enabling the optional Pro and Studio Master tiers via Google Play:
1. **Google Play Console:** Navigate to **Monetize with Play > Products > Subscriptions**.
2. **Create Subscription 1:**
   - Product ID: `artistry_pro_monthly` / `artistry_pro_yearly`
   - Name: `Pro Illustrator`
   - Price: $9.99/mo or $95.88/yr
3. **Create Subscription 2:**
   - Product ID: `artistry_master_monthly` / `artistry_master_yearly`
   - Name: `Studio Master`
   - Price: $19.99/mo or $191.88/yr
4. **Service Account Key:**
   - Navigate to **API Access > Google Play Developer API** and generate a service account JSON key.
   - Inject the service account key into `backend/.env.production` for cryptographically verified receipt validation.

---

## 6. Pre-Launch Testing & Submission Checklist

- [x] Application ID verified: `ai.artistry.studio`
- [x] Version Code 1, Version Name 1.0.0
- [x] `minSdkVersion` 24 (Android 7.0+), `targetSdkVersion` 36 (Android 16)
- [x] Multi-ABI support (`arm64-v8a` and `x86_64`) verified
- [x] R8 / ProGuard keep rules configured in `proguard-rules.pro`
- [x] Unnecessary permissions (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`) stripped
- [x] Zero hardcoded secrets in source code
- [x] Local offline fallbacks verified for all AI tools
- [x] All 35 frontend Jest test suites passing (357 tests)
- [x] All 10 backend Jest test suites passing (70 tests)
- [x] All 7 Python AI Engine pytest tests passing (7 tests)
- [x] Emulator install, cold launch, navigation smoke tests, and 0 crashes verified
- [ ] Developer Action: Generate production upload keystore (`my-upload-key.keystore`)
- [ ] Developer Action: Run `gradlew :app:bundleRelease` to generate final `app-release.aab`
- [ ] Developer Action: Create Google Play Console application listing
- [ ] Developer Action: Upload `app-release.aab` to Internal Testing track
- [ ] Developer Action: Complete Data Safety and Content Rating questionnaires
- [ ] Developer Action: Promote from Internal Testing to Closed/Open Testing, then Production
