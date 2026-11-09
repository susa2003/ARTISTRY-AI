# ARTISTRY AI native Android migration plan

This plan and feature mapping were reported before the existing application was changed. The former web app, Capacitor Android project, source assets, and package metadata are retained under `legacy-web-first/` as a reference during the migration.

## Existing implementation inventory

- **Framework:** React 19, TypeScript, Vite, HTML/CSS, and HTML Canvas, packaged for Android through Capacitor 8. The Android entry point was Capacitor `BridgeActivity`, so the app rendered the website in a WebView.
- **Image assistance:** Eight tools—AI Loomis, Step-by-Step Drawing Guide, Sketch Converter, Tracing Studio, Smart Grid, Drawing Analyzer, Shading Assistant, and Color Studio. The local previews and image measurements ran in a browser canvas. An optional `VITE_AI_API_URL` accepted a multipart `image` and `tool` only after the user tapped the AI action.
- **Image intake:** Gallery, camera, and document import; JPG/JPEG/PNG/WEBP; preview; crop, rotate and resize; IndexedDB image cache; edited working copies distinct from the imported original.
- **Drawing:** HTML Canvas brush, pencil and eraser; layers; undo/redo; zoom/pan; IndexedDB autosave and project list; PNG/JPG download.
- **Reusable material:** Existing feature definitions, preview formulas, explanatory copy, explicit-upload contract, image safety behavior, project/image storage model, styles, and app artwork are retained in `legacy-web-first/` for porting and comparison.

## Feature mapping

| Existing or requested capability | Native implementation target | Storage / privacy behavior |
| --- | --- | --- |
| Home and eight drawing companions | Expo Router native routes and React Native responsive screens | All eight tools accept an app-cached local reference. |
| Gallery image selection | `expo-image-picker` Android system picker | Only the selected item is copied to app storage; no automatic upload. |
| Camera capture | `expo-camera` route with action-scoped permission | Capture is copied into app storage; source is never overwritten. |
| File/document image selection | `expo-document-picker` Android document picker | JPG/JPEG/PNG/WEBP are accepted and copied to app storage. |
| Reference preview and edit | Native image preview plus `expo-image-manipulator` | Rotate, crop, resize make new working-copy files. Original remains unchanged. |
| AI Loomis, sketch, tracing, shading, grid | React Native Skia native image and drawing layers | Deterministic preview remains on-device. |
| Step guide, analyzer, color palette | TypeScript feature algorithms on the selected local image | Results remain local. Optional remote analysis requires an explicit action. |
| Direct blank-canvas drawing | Skia editor route, no reference required | Works offline. |
| Brushes, pencil, eraser, layers, history, zoom/pan | Skia drawing surface with Gesture Handler and serializable stroke model | Project state auto-saves to SQLite. |
| Project list, reopen, rename, delete | Expo SQLite project repository and app-owned files | Local-first; no account or network requirement. |
| PNG/JPG export | Skia snapshot encoding and Android share sheet | Export is initiated by the user. |

## Phased implementation

1. **Native foundation:** Expo SDK 58, React Native 0.88, TypeScript, Expo Router, NativeWind, Android app identity and native navigation. Remove the browser-first app from the active entry path while retaining it in the archive.
2. **Local data model:** Zustand editor/reference state, SQLite project persistence, and an app-private image cache. Serialize strokes/layers as versioned JSON and preserve project metadata in SQLite.
3. **Native image intake:** Native gallery, camera and document pickers with action-specific permissions, preview, rotate/crop/resize on a working copy, and no implicit upload.
4. **Drawing engine:** React Native Skia canvas, Gesture Handler drawing/zoom/pan, brush/pencil/eraser, layer visibility and creation, undo/redo, autosave, reopen and image export.
5. **Image companions:** Port every feature and its existing local formulas/copy; wire all tools to the same local image source. Keep optional remote AI separate and explicit.
6. **Verification and release:** Type-check, run Expo/native configuration checks, build a release APK and production AAB, install and exercise the APK on Android, then record the artifact paths and observed test results. Do not mark the migration complete if Android artifacts cannot be produced and tested.

## Completion checks

- Android application starts through native React Native views and Expo Router; no Capacitor or WebView is used as the application shell.
- Blank drawing works without selecting or uploading an image and while offline.
- Image pickers accept JPG/JPEG/PNG/WEBP; image-based tools can consume the selected local working copy.
- Camera permission is requested only when camera capture is chosen; other image selection uses Android system pickers.
- Editing creates app-owned working files and leaves source images unchanged.
- Strokes, layers and project metadata survive app restart; undo/redo and layer visibility work.
- PNG and JPG exports can be handed to Android's share/save destinations.
- Release APK is installed and tested; production AAB is generated and signed with a release key.
