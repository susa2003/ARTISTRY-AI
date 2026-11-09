# ARTISTRY AI — Security, Privacy & Compliance Architecture

---

## 1. Zero-Implicit-Upload Privacy Guarantee

The paramount architectural principle of ARTISTRY AI is **strict local user privacy**:
1. **No Auto-Uploads:** Selecting a photo from the Android gallery, camera, or document picker copies the file strictly to private, sandbox app storage (`references/`). It is **never** uploaded automatically.
2. **Explicit User Intent Only:** A remote network request is initiated only when the user explicitly taps an action that requests cloud processing.
3. **No Training on User Data:** User artwork and uploaded references are never retained for model fine-tuning or AI training.
4. **Temporary Retention & Auto-Purge:** References uploaded to `POST /api/v1/storage/upload` are assigned an automated 24-hour expiration TTL in MongoDB and deleted from disk during automated storage maintenance runs (`POST /api/v1/storage/cleanup`).

---

## 2. API Security Architecture

- **CORS:** Configurable whitelist via `CORS_ORIGIN` environment variable.
- **Helmet:** Sets secure HTTP response headers (`Content-Security-Policy`, `X-DNS-Prefetch-Control`, `X-Frame-Options`, `X-XSS-Protection`).
- **Rate Limiting:**
  - Standard API rate limiter: 300 requests per 15 minutes per IP.
  - Heavy AI processing limiter: 30 heavy AI requests per minute per IP.
- **Request Size Limiting:** Express body parser and Multer limit payload sizes strictly to 25 MB to prevent buffer exhaustion and denial-of-service attacks.
- **MIME Type Whitelist:** Storage upload strictly validates MIME headers and extensions against `image/jpeg`, `image/png`, `image/webp`, and `image/svg+xml`. Executable extensions (`.exe`, `.sh`, `.apk`, `.php`) are rejected immediately with HTTP 400.
- **Secret Redaction:** Structured loggers sanitize all logs, automatically replacing `authorization`, `password`, `apiKey`, `token`, and `jwt` fields with `[REDACTED]`.
- **Zero Secrets in Client Code:** API keys (Gemini, OpenAI, Anthropic) reside strictly in server-side environment variables and are never bundled into the client React Native bundle.
