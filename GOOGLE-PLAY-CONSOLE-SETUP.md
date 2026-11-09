# ARTISTRY AI — GOOGLE PLAY CONSOLE & IN-APP BILLING SETUP GUIDE
**Target App:** ARTISTRY AI (`ai.artistry.studio`)  
**Backend:** Node.js v24 + Express + TypeScript ES2022  
**API Specification:** Google Play Developer API v3 (`androidpublisher`)  

---

## 1. Overview & Architecture

ARTISTRY AI strictly implements **server-authoritative purchase verification**. The Android client NEVER directly modifies subscriptions or unlocks entitlements.
1. The Android client completes the purchase flow through the native Google Play Billing library.
2. Google Play returns a signed `purchaseToken`, `orderId`, and `productId`.
3. The client submits `{ packageName, productId, purchaseToken, orderId }` to `POST /api/v1/billing/verify-purchase`.
4. The backend independently audits the token with Google's servers (`androidpublisher.purchases.subscriptionsv2.get`).
5. Upon cryptographic confirmation and duplicate-check validation, the backend updates the user's tier to `pro` or `premium` and allocates monthly AI credits.

---

## 2. Google Play Console Product Configuration

In the [Google Play Console](https://play.google.com/console):
1. Navigate to **Monetize with Play** $\rightarrow$ **Products** $\rightarrow$ **Subscriptions**.
2. Create the following four subscription base plans:

| Product ID | Subscription Tier | Billing Period | Suggested USD | Suggested INR |
| :--- | :---: | :---: | :---: | :---: |
| `artistry_pro_monthly` | Pro Illustrator | 1 Month | \$9.99 | ₹499 |
| `artistry_pro_yearly` | Pro Illustrator | 1 Year | \$95.88 | ₹4,790 |
| `artistry_premium_monthly` | Studio Master | 1 Month | \$19.99 | ₹999 |
| `artistry_premium_yearly` | Studio Master | 1 Year | \$191.88 | ₹9,590 |

3. Enable **Grace Period**: 3 days for monthly and 7 days for yearly subscriptions.
4. Set **Account Hold**: Enabled (recommended 30 days).

---

## 3. Google Cloud Service Account Setup

To enable server-side verification:
1. Open [Google Cloud Console](https://console.cloud.google.com/) for the linked project.
2. Enable the **Google Play Android Developer API** (`androidpublisher.googleapis.com`).
3. Navigate to **IAM & Admin** $\rightarrow$ **Service Accounts**.
4. Click **Create Service Account**:
   - Name: `artistry-play-billing-verifier`
   - Description: `Server-side subscription purchase token verification for ARTISTRY AI`
5. Click **Create and Continue**, then grant role: **Service Account User**.
6. On the created service account, select **Keys** $\rightarrow$ **Add Key** $\rightarrow$ **Create new key** $\rightarrow$ **JSON**. Download the JSON key file.
7. Open [Google Play Console](https://play.google.com/console) $\rightarrow$ **API access**.
8. Find the service account in the list and click **Grant Access**:
   - In Permissions, select **Financial permissions**:
     - *View financial data, orders, and cancellation survey responses*
     - *Manage orders and subscriptions*
   - Click **Save**.

---

## 4. Backend Environment Configuration

Add the service account credentials to [`backend/.env`](file:///d:/antigravity/artist%20ai%20app/backend/.env):

```env
# Google Play Android Developer API Credentials
GOOGLE_PLAY_PACKAGE_NAME=ai.artistry.studio
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=artistry-play-billing-verifier@your-project.iam.gserviceaccount.com
GOOGLE_PLAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

*(Alternatively, place the downloaded JSON file in `backend/keys/google-play-service-account.json` and set `GOOGLE_PLAY_KEY_FILE=./keys/google-play-service-account.json`).*

---

## 5. License Testing & Sandbox Verification

1. In Google Play Console $\rightarrow$ **Setup** $\rightarrow$ **License Testing**, add tester email addresses.
2. Select **License test response**: `RESPOND_NORMALLY`.
3. In tests or sandbox development:
   - Pass test tokens matching `test_purchase_token_*` to exercise the complete backend verification and entitlement activation flow without incurring charges.
   - Duplicate tokens are automatically rejected with HTTP 409 `DUPLICATE_PURCHASE_TOKEN`.
   - Package name mismatches are rejected with HTTP 400 `PACKAGE_MISMATCH`.
