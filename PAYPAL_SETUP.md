# ATLAS.PAY — Official PayPal Payment Gateway Integration Guide

This guide documents the architecture, setup, testing, and production migration procedures for the official PayPal REST API v2 payment gateway integration in the **ATLAS.PAY International Payment Orchestration Platform**.

---

## 1. Architecture Overview

ATLAS.PAY implements a modern, secure, server-side orchestrated PayPal Checkout flow:

```
[ Frontend: React 18 / Vite ]
  │
  │  1. GET /api/paypal/config
  ▼
[ PayPalScriptProvider / PayPalButtons ]
  │
  │  2. createOrder() -> POST /api/paypal/create-order
  │     (Backend generates idempotency key & calls PayPal Orders API v2)
  ▼
[ PayPal Sandbox / Live Approval Popup ]
  │
  │  3. Buyer logs in & approves payment
  ▼
[ onApprove(data) ]
  │
  │  4. captureOrder() -> POST /api/paypal/capture-order
  │     (Backend calls PayPal Orders API v2 capture & verifies COMPLETED status)
  ▼
[ Animated Payment Modal ]
  │
  │  5. Confetti animation & receipt display ONLY after verified settlement
  ▼
[ PayPal Webhook Notification ]
  │
  │  6. POST /api/paypal/webhook
  │     (Backend verifies cryptographic signature & reconciles transactions)
  ▼
[ Supabase PostgreSQL / Embedded JSON ]
```

### Key Security & Architecture Highlights
- **Zero Secret Leakage:** `PAYPAL_CLIENT_SECRET` is strictly held on the backend. Only safe public configuration (`PAYPAL_CLIENT_ID`, environment, and supported currencies) is exposed to the frontend.
- **Idempotency Guarantee:** Every order creation and capture generates a unique `PayPal-Request-Id` to prevent duplicate charges even under network retries.
- **Strict Verification Gate:** The frontend animated payment modal displays success animations **only** after the backend verifies that the capture status is `COMPLETED` and seller protection is verified.
- **Webhook Cryptographic Verification:** Incoming webhooks are verified against PayPal's public keys via `/v1/notifications/verify-webhook-signature` and deduplicated in the `processed_webhooks` table.

---

## 2. Prerequisites

1. **PayPal Developer Account:** Sign up at [developer.paypal.com](https://developer.paypal.com/).
2. **Sandbox Accounts:**
   - **Business Account:** Acts as the merchant receiving international payments.
   - **Personal Account:** Acts as the overseas buyer testing checkout.

---

## 3. Obtaining Credentials

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Navigate to **Apps & Credentials**.
3. Toggle the top switch to **Sandbox**.
4. Click **Create App**:
   - **App Name:** `ATLAS.PAY Sandbox`
   - **App Type:** `Merchant`
   - **Sandbox Business Account:** Select your sandbox merchant account.
5. Copy the generated **Client ID** and **Client Secret**.

---

## 4. Environment Configuration

Add the following variables to your root `.env` file (or your hosting provider's environment settings):

```bash
# -------------------------------------------------------------
# Official PayPal Payment Gateway Configuration
# -------------------------------------------------------------
# Environment: 'sandbox' (testing) or 'live' (production)
PAYPAL_ENV=sandbox

# PayPal REST API Credentials (Backend Only - NEVER expose secret!)
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret_here

# PayPal Webhook ID (from PayPal Developer Dashboard -> Webhooks)
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id_here

# Frontend PayPal Client ID (Safe for public client-side JavaScript SDK)
VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id_here
```

---

## 5. Setting Up Webhooks

1. In the PayPal Developer Dashboard under your App, scroll to the **Webhooks** section.
2. Click **Add Webhook**.
3. **Webhook URL:**
   - **Production:** `https://your-domain.com/api/paypal/webhook`
   - **Local Testing:** Use a secure tunnel (e.g. `https://your-ngrok-subdomain.ngrok-free.app/api/paypal/webhook`).
4. Select the following event types:
   - `Payment capture completed` (`PAYMENT.CAPTURE.COMPLETED`)
   - `Payment capture denied` (`PAYMENT.CAPTURE.DENIED`)
   - `Payment capture refunded` (`PAYMENT.CAPTURE.REFUNDED`)
   - `Checkout order approved` (`CHECKOUT.ORDER.APPROVED`)
5. Save the webhook and copy the generated **Webhook ID** into `PAYPAL_WEBHOOK_ID` in your `.env`.

---

## 6. RBI / India Cross-Border Compliance Rules

ATLAS.PAY enforces Reserve Bank of India (RBI) and PayPal cross-border compliance policies out of the box:

1. **Export-Only Corridor:**
   - Indian PayPal merchant accounts support cross-border export transactions only.
   - Domestic India-to-India transactions (`customer_country: 'IN'` and `merchant_country: 'IN'`) are automatically blocked with guidance recommending domestic rails (UPI or RuPay).
2. **Foreign Settlement Currencies:**
   - Charges sent to PayPal must be in a supported international currency (`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `SGD`, etc.).
   - Domestic currency (`INR`) is rejected for PayPal orders to comply with cross-border rules.
3. **No Double Conversion:**
   - When a user enters or views an INR amount (e.g. ₹12,434), ATLAS.PAY converts it to the exact target foreign currency (e.g. $149.00 USD) before creating the PayPal Order.
   - The buyer pays exactly $149.00 USD on PayPal without double conversion spreads.

---

## 7. Testing the Integration

### Automated Test Suite
Run the automated test suite covering all 15 PayPal validation scenarios:

```bash
# Run backend test suite including PayPal regression tests
npm --prefix backend test

# Run frontend production build check
npm --prefix frontend run build
```

### Manual Sandbox Verification
1. Start the ATLAS.PAY platform locally:
   ```bash
   npm run dev:all
   ```
2. Navigate to the **Checkout** page (`http://localhost:5173/checkout`).
3. Click **Demo Data** to populate merchant details (Coursera Inc., $149.00 USD, US destination).
4. Select the **PayPal Sandbox** payment method tab.
5. Click the yellow **PayPal** button:
   - A PayPal Sandbox popup will open.
   - Log in using your Sandbox Personal Buyer credentials (from `developer.paypal.com -> Sandbox Accounts`).
   - Click **Complete Purchase**.
6. The popup will close, and the ATLAS.PAY **Animated Payment Modal** will smoothly transition to the success stage with:
   - Confetti burst
   - Real PayPal Capture ID
   - Foreign amount & converted INR equivalent
   - Seller protection status
   - Settlement confirmation

---

## 8. Migrating to Live Production

When ready to accept real payments:

1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/), switch to **Live**.
2. Create or select your Live App and copy the **Live Client ID** and **Live Secret**.
3. Create a Live Webhook pointing to your production API: `https://your-api.com/api/paypal/webhook`.
4. Update your production environment variables:
   ```bash
   PAYPAL_ENV=live
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_secret
   PAYPAL_WEBHOOK_ID=your_live_webhook_id
   VITE_PAYPAL_CLIENT_ID=your_live_client_id
   ```
5. Deploy or restart your backend and frontend services.

