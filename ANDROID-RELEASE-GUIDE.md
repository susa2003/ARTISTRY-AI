# ARTISTRY AI — Android Release & Publishing Guide

**Application ID**: `ai.artistry.studio`  
**Current Release Version**: `1.0.0` (VersionCode `1`)  
**Build Tooling**: React Native 0.88 + Expo SDK 58 + Gradle 9.4.1 + JDK 17 (Target SDK 36, Min SDK 24)

---

## 1. Release Architecture & Artifacts

ARTISTRY AI produces two distribution artifacts:

1. **Android App Bundle (`app-release.aab`)**:
   - Location: `android/app/build/outputs/bundle/release/app-release.aab`
   - Purpose: Mandatory format for Google Play Store publication. Google Play's dynamic delivery system uses this bundle to generate split APKs optimized for each user's device screen density, CPU architecture, and language.
2. **Release APK (`app-release.apk`)**:
   - Location: `android/app/build/outputs/apk/release/app-release.apk`
   - Purpose: Direct sideloading, offline QA testing on physical Android devices, and non-Play store distribution.

---

## 2. Release Keystore Generation & Management

### A. Generating a Production Upload Keystore
If you need to generate a new production upload keystore for Google Play:
```bash
keytool -genkeypair -v -keystore android/app/release-upload.keystore \
  -alias artistry-upload-key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_SECURE_STORE_PASSWORD \
  -keypass YOUR_SECURE_KEY_PASSWORD \
  -dname "CN=Artistry AI, OU=Mobile Studio, O=Artistry AI, L=San Francisco, ST=California, C=US"
```

> **IMPORTANT SECURITY RULES**:
> 1. Store your upload keystore and passwords in a secure password vault (e.g. 1Password, Bitwarden, or AWS Secrets Manager).
> 2. Once enrolled in **Google Play App Signing**, Google signs your end-user APKs with Google's Play App Signing Key. Your upload key is only used to authenticate your bundle uploads to the Google Play Console.
> 3. If you lose your upload key, you can request a reset through the Google Play Developer Support console.

### B. Configuring Release Signing Credentials
Set the following properties in `android/gradle.properties` (or as CI/CD environment variables):
```properties
MYAPP_UPLOAD_STORE_FILE=release-upload.keystore
MYAPP_UPLOAD_KEY_ALIAS=artistry-upload-key
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_SECURE_STORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_SECURE_KEY_PASSWORD
```

Or pass them directly via environment variables:
```bash
export MYAPP_UPLOAD_STORE_FILE=release-upload.keystore
export MYAPP_UPLOAD_KEY_ALIAS=artistry-upload-key
export MYAPP_UPLOAD_STORE_PASSWORD=YOUR_SECURE_STORE_PASSWORD
export MYAPP_UPLOAD_KEY_PASSWORD=YOUR_SECURE_KEY_PASSWORD
```

---

## 3. Building the Release Artifacts

### A. Prerequisites
- **JDK 17**: Ensure JDK 17 is configured. (In this repository, `android/gradle.properties` explicitly configures `org.gradle.java.home=D:\Android\jdk-17`).
- **Android SDK**: `sdk.dir` set in `android/local.properties` (Platform SDK 35/36 installed).
- **Node.js**: v20+ or v22+.

### B. Clean Build Environment
```bash
cd android
./gradlew clean
```

### C. Build the Android App Bundle (AAB) for Google Play
```bash
cd android
./gradlew :app:bundleRelease
```
Output:
`android/app/build/outputs/bundle/release/app-release.aab`

### D. Build Universal / Architecture Release APK
```bash
cd android
./gradlew :app:assembleRelease
```
Output:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 4. Local Verification & Physical Device Testing

### A. Testing on Connected Physical Device via ADB
Connect an Android device with Developer Options & USB Debugging enabled:
```bash
# Verify device connection
adb devices

# Install release APK
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Launch the app
adb shell am start -n ai.artistry.studio/.MainActivity
```

### B. Extracting APKs from AAB with `bundletool`
To test the exact bundle behavior as Google Play will deliver it:
```bash
bundletool build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks --mode=universal \
  --ks=android/app/release-upload.keystore \
  --ks-pass=pass:YOUR_PASSWORD \
  --ks-key-alias=artistry-upload-key \
  --key-pass=pass:YOUR_PASSWORD

bundletool install-apks --apks=app.apks
```

---

## 5. Google Play Console Submission Step-by-Step

### Step 1: Create Application
1. Log in to the [Google Play Console](https://play.google.com/console).
2. Click **Create app**.
3. Name: **ARTISTRY AI: Draw & Learn**.
4. Default language: **English (United States) - en-US**.
5. App or game: **App**. Free or paid: **Free** (with in-app purchases).
6. Accept Declarations and click **Create app**.

### Step 2: Set Up Store Presence & Privacy
1. Go to **Grow $\rightarrow$ Store presence $\rightarrow$ Main store listing**.
2. Paste Title, Short Description, and Full Description from `GOOGLE-PLAY-STORE-CHECKLIST.md`.
3. Upload App Icon ($512\times 512$ PNG) and Feature Graphic ($1024\times 500$ PNG).
4. Upload phone screenshots ($1080\times 2400$) and 7-inch/10-inch tablet screenshots.
5. In **Policy and programs $\rightarrow$ App content**:
   - Privacy Policy URL: `https://artistry.ai/privacy`
   - Ads: Select "No, my app does not contain ads".
   - App Access: Provide test account credentials or select "All functionality is available without restrictions" (since drawing and academy are 100% offline and free).
   - Content Rating: Complete questionnaire (select "Utility, Productivity, Communication, or Other").
   - Target Audience: Select 13–15, 16–17, 18 and over.
   - Data Safety: Fill out according to Section 2 of `GOOGLE-PLAY-STORE-CHECKLIST.md`.

### Step 3: Configure In-App Products & Subscriptions
1. Go to **Monetize $\rightarrow$ Products $\rightarrow$ Subscriptions**:
   - Create subscription `artistry_pro_monthly` (\$9.99/mo).
   - Create subscription `artistry_pro_yearly` (\$79.99/yr).
2. Go to **Monetize $\rightarrow$ Products $\rightarrow$ In-app products**:
   - `artistry_credits_100` (\$1.99)
   - `artistry_credits_500` (\$7.99)
   - `artistry_credits_1200` (\$14.99)

### Step 4: Release Management & Rollout
1. Go to **Release $\rightarrow$ Testing $\rightarrow$ Internal testing**.
2. Click **Create new release**.
3. Upload `app-release.aab`.
4. Release name: `1.0.0 (1)`.
5. Release notes: Copy from `RELEASE-NOTES.md`.
6. Click **Save** and **Review release**.
7. Roll out to Internal Testers $\rightarrow$ advance to Closed Testing $\rightarrow$ Open Testing $\rightarrow$ Production.
