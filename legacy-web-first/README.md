# ARTISTRY AI

A local-first Android and web drawing studio. It supports two independent ways to begin: select a photo for drawing assistance, or open a blank canvas and draw without uploading an image.

## Run the web app

```sh
npm install
npm run dev
```

Create a production web build with `npm run build`.

## Android app

The repository includes a Capacitor Android project. Open it in Android Studio with `npm run android:open`, or sync the latest web assets and native plugins with:

```sh
npm run android:sync
```

Android Studio and an Android SDK are required to build or install the native app. The app bundles its drawing interface, so blank-canvas drawing, local projects, image preparation and local previews work without a network connection after installation.

## Local images and privacy

- **Photo gallery:** Android uses the system photo picker through `@capawesome/capacitor-file-picker`. It grants access to the image the user chooses; the app does not request broad photo-library access.
- **Files:** The Android document picker accepts JPG/JPEG, PNG and WEBP. It relies on the system picker instead of requesting general storage access.
- **Camera:** The camera is opened only after the user taps the camera action. A cancelled or unavailable camera leaves the app ready to use the other import options.
- **Preparation:** Image preview, rotate, crop and resize operate on an app-owned working copy. The original selected file is never modified.
- **Caching:** The original, working copy and projects are stored locally in IndexedDB. They are not uploaded in the background.
- **Export:** Web downloads a new PNG/JPG file. Android opens the system share/save sheet with a new exported copy.

The app accepts `.jpg`, `.jpeg`, `.png` and `.webp` images up to 60 MB. The 60 MB limit protects the mobile app from very large images; images can be resized in the preparation panel.

## Drawing studio

Blank projects open directly in ARTISTRY AI, with a brush, pencil, eraser, color picker, adjustable brush size, multiple layers, undo/redo, zoom, pan, autosave, project rename and PNG/JPG export. Canvas edits and project storage are local and do not depend on AI services.

## Image drawing companions

All eight tools accept the selected local working image. Local previews are generated on-device for Loomis construction, step planning, sketch conversion, tracing, smart grid, value analysis, shading and color palette sampling.

An AI service is optional and is not included in this repository. To connect one, set `VITE_AI_API_URL` in the app's build environment to a service that accepts multipart form data fields `image` and `tool`. The app only sends the selected working copy when the user presses **Analyze with AI**. The endpoint should return JSON with optional `message`, `tips` (string array) and `resultUrl` fields. Without this setting, local previews and the drawing studio remain available.

## Native capabilities

Capacitor 8 targets Android. Image gallery/file picking, camera capture, and the export share sheet use native plugins; on the web they fall back to browser file inputs and downloads.
