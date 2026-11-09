# ARTISTRY AI — native Android studio

ARTISTRY AI is a local-first React Native Android drawing application. Expo Router provides native navigation; React Native Skia renders the drawing surface; Zustand holds the active editor state; SQLite stores projects and references. NativeWind is configured for styling.

The previous Vite/Capacitor application is preserved under [`legacy-web-first/`](./legacy-web-first/) along with its source, documentation, generated Android project, assets and dependency tree. See [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) for the pre-migration inventory, feature mapping and phase plan.

## Workflows

- **Draw directly:** open a blank canvas without selecting or uploading a photo. Brush, pencil, eraser, layers, undo, redo, color, zoom and pan work locally. Projects auto-save to SQLite and can be exported as PNG or JPG through Android's share sheet.
- **Use a reference:** pick one image from Android's photo picker, camera, or document picker. JPG/JPEG/PNG/WEBP are accepted. ARTISTRY AI keeps an app-owned original and a separate working copy; transforms never overwrite the source image.
- **Image companions:** all eight tools work from the selected local reference and create local previews. A remote AI request is available only when `EXPO_PUBLIC_AI_API_URL` is configured and the user taps the AI action.

## Development

```powershell
npm install
npx expo install --check
npm run typecheck
npx expo prebuild --platform android
npx expo run:android
```

Android drawing, project storage and local image processing do not depend on network access after the app is installed.

## Release artifacts

After configuring a release key using local Gradle signing properties, generate the Android packages with:

```powershell
npx expo prebuild --platform android
npm run build:apk
npm run build:aab
```

The expected outputs are `android/app/build/outputs/apk/release/app-release.apk` and `android/app/build/outputs/bundle/release/app-release.aab`. Store signing credentials outside source control. An APK/AAB should only be called production-ready once the release AAB is signed and the APK has been installed and exercised on Android.

## Local image privacy

- Gallery access uses Android's system photo picker; the app does not request broad media-library access.
- Camera permission is requested only when the camera screen is opened.
- Document selection uses Android's system document picker.
- Image selection does not initiate network requests. The optional connected AI action sends only the selected working copy after the user's tap.
- Imported images and drawing projects are stored in the app's private local storage/SQLite database and are not modified in the original gallery or document location.
