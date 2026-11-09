# ARTISTRY AI — Known Issues & Platform Guidance

**Version**: `1.0.0` (Release Candidate)  
**Last Updated**: November 9, 2026

---

## 1. Documented Hardware & Stylus Behaviors

### S-Pen & Active Stylus Hover
- **Observation**: On certain Samsung Galaxy Note/Tab devices running One UI, hover pointer coordinates may fire before the pen touches the screen.
- **Resolution**: ARTISTRY AI's Skia drawing canvas filters out pointer events with zero pressure or touch state `CANCELLED`, ensuring hovering does not leave accidental stray marks.

### Capacitive vs. Pressure-Sensitive Stylus
- **Observation**: Inexpensive generic rubber-tip capacitive styluses do not report pressure levels to Android OS (`event.pressure` defaults to `1.0`).
- **Mitigation**: The app includes a "Velocity Simulation" algorithm in Drawing Preferences that dynamically modulates stroke thickness based on drawing speed when physical pressure data is unavailable.

---

## 2. Cloud AI Features & Offline Fallback

### Cloud AI Without Internet
- **Observation**: Triggering Cloud AI features (such as Gemini Vision Art Mentor or Cloud Diffusion Generation) while offline or in Airplane Mode.
- **Behavior**: The application seamlessly and gracefully falls back to the embedded **Local AI Fallback Engine** (`LocalFallbackProvider`). Line smoothing, proportion checks, contour extraction, and offline heuristic analysis run locally on-device without crashing or throwing unhandled exceptions.

### Missing Cloud API Keys
- **Observation**: If self-hosted backend instances do not configure `GEMINI_API_KEY`.
- **Behavior**: The Node.js API Gateway reports a graceful `403` or `503` with a localized explanation and automatically falls back to local computer vision analysis.

---

## 3. Large Image Imports on Budget Devices

### 100+ Megapixel Camera Imports
- **Observation**: Importing uncompressed $12000\times 9000$ camera captures on devices with $< 3\text{ GB}$ RAM could theoretically strain GPU texture buffers.
- **Resolution**: The `cacheSelectedImage` service automatically detects oversized images and safely downsamples working copies to $2048\text{px}$ maximum dimension via hardware-accelerated `ImageManipulator`, while keeping original image paths intact.

---

## 4. Reporting New Issues

For crashes, performance logs, or feature requests:
- Email: `support@artistry.ai`
- GitHub Issue Tracker: Private repository issue queue
- Community Discord: `https://discord.gg/artistry-ai`
