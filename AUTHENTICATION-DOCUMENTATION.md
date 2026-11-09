# ARTISTRY AI — AUTHENTICATION & IDENTITY ARCHITECTURE
**Document Version:** 1.0.0 (Phase 6)  
**Security Standard:** NIST SP 800-63B / OWASP Mobile Security Verification Standard (MASVS)  
**Package:** `ai.artistry.studio`  
**Backend:** Node.js v24 + Express + TypeScript ES2022  

---

## 1. Overview & Architecture

ARTISTRY AI implements a secure, local-first, token-based authentication and user identity system designed specifically for creative Android applications. The system guarantees that:
1. **Offline Independence:** Unauthenticated/guest users enjoy unrestricted access to the Skia canvas, 27 classical & AI drawing tools, and local SQLite project persistence without network connectivity.
2. **Short-Lived Access Tokens:** Stateless 15-minute JSON Web Tokens (JWT) signed with HMAC-SHA256 containing minimal non-sensitive identity metadata (`userId`, `email`, `role`, `subscriptionTier`).
3. **Rotating Refresh Tokens with Replay Detection:** Opaque 64-byte cryptographically random hex tokens stored hashed (SHA-256) in the database with 30-day sliding expiration. Each refresh consumes and invalidates the previous refresh token. If an already-rotated token is ever replayed, all active sessions for that user account are revoked immediately as a security precaution.
4. **Scrypt Password Hashing:** Node.js native `crypto.scrypt` with a 32-byte cryptographically secure random salt ($N=16384, r=8, p=1, keylen=64$), verified via constant-time comparison (`crypto.timingSafeEqual`).
5. **Zero Client Trust:** User roles (`user`, `artist`, `admin`), AI credit balances, and subscription tiers cannot be altered by client payloads.

---

## 2. API Endpoints Catalog

All authentication routes are mounted under `/api/v1/auth/*` and protected by rate-limiting middleware (`authLimiter`: max 20 requests per 15 minutes per IP).

| Endpoint | Method | Auth Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/v1/auth/register` | `POST` | No | Creates new account with password strength check and terms consent. Returns 201, user profile, token pair, and email verification token. |
| `/api/v1/auth/login` | `POST` | No | Validates email/password credentials and issues token pair. |
| `/api/v1/auth/google` | `POST` | No | Verifies Google OpenID Connect ID token and provisions/logs in user. |
| `/api/v1/auth/refresh` | `POST` | No | Rotates refresh token, emits new access token and new refresh token. |
| `/api/v1/auth/logout` | `POST` | No | Revokes the submitted refresh token. |
| `/api/v1/auth/logout-all` | `POST` | Yes (`Bearer`) | Invalidation of all refresh tokens across all devices for the authenticated user. |
| `/api/v1/auth/forgot-password` | `POST` | No | Generates 1-hour secure password reset token without disclosing user existence. |
| `/api/v1/auth/reset-password` | `POST` | No | Resets password using valid reset token and invalidates all existing sessions. |
| `/api/v1/auth/change-password` | `POST` | Yes (`Bearer`) | Verifies current password and updates to a new strong password. |
| `/api/v1/auth/verify-email` | `POST` | No | Validates 24-hour verification token and marks `isEmailVerified = true`. |
| `/api/v1/user/profile` | `GET` | Yes (`Bearer`) | Retrieves sanitized public user profile, subscription tier, and credit balance. |
| `/api/v1/user/profile` | `PUT` | Yes (`Bearer`) | Updates display name, language, experience mode, or drawing preferences. Disallows role/credit tampering. |

---

## 3. Password Strength Standards

Passwords must satisfy the following NIST-aligned criteria:
- Minimum length: 8 characters (12+ characters recommended).
- At least one lowercase ASCII character (`[a-z]`).
- At least one uppercase ASCII character (`[A-Z]`).
- At least one decimal digit (`[0-9]`).
- At least one special symbol (`[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]`).

The mobile client provides a real-time 4-bar strength indicator (`Very Weak`, `Weak`, `Fair`, `Strong`, `Very Strong`) with dynamic issue checklists before submission.

---

## 4. Google Sign-In & OpenID Connect

Google authentication uses server-side token validation:
1. Client acquires OpenID Connect `idToken` via standard Android Google Play Services credentials.
2. Client submits `{ idToken }` to `/api/v1/auth/google`.
3. Backend audits token authenticity via Google's tokeninfo endpoint (`https://oauth2.googleapis.com/tokeninfo?id_token=...`).
4. Extracts verified attributes: `email`, `sub`, `name`, `picture`, `email_verified`.
5. Automatic account creation defaults to `role: "user"`, 50 complimentary AI credits, and `free` subscription tier.

---

## 5. Local-First Session Persistence

- Stored in SQLite table `app_metadata` under key `auth_session`.
- Contains sanitized user profile and token pair.
- When offline, app automatically restores cached identity and drawing preferences without blocking Skia canvas rendering.
- When online, silently calls `/api/v1/auth/refresh` on app startup to acquire a fresh JWT and updated cloud balance.
- Logging out removes cached session tokens from SQLite without deleting any locally saved drawing files or projects.
