# International Payment Orchestration Platform (ATLAS.PAY)

[![Build & Tests](https://img.shields.io/badge/Tests-18%2F18%20Passing-brightgreen?style=flat-square)](#tests)
[![Node](https://img.shields.io/badge/Node.js-v20%2B-blue?style=flat-square&logo=node.js)](#technology-stack)
[![Python](https://img.shields.io/badge/Python-3.11%2B%20%7C%20FastAPI-blue?style=flat-square&logo=python)](#technology-stack)
[![React](https://img.shields.io/badge/React-18%20%7C%20Vite%20%7C%20Tailwind-61DAFB?style=flat-square&logo=react)](#technology-stack)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-336791?style=flat-square&logo=postgresql)](#database-setup)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#)

An enterprise-grade, multi-rail **International Payment Orchestration Platform** that unifies global and domestic payment rails into a single integration. Built with **Node.js + Express**, a dedicated **Python + FastAPI Intelligence Microservice** for ML risk scoring and dynamic route optimization, and a modern **React + Vite + Tailwind CSS** dark/light UI.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (React + Vite + Tailwind CSS)"]
        UI["Modern Responsive UI\n(Dark/Light Theme)"]
        Landing["FinTech Landing Page"]
        Dash["Merchant Analytics"]
        Checkout["Unified International Checkout"]
        RulesUI["Routing Rules Manager"]
        FraudUI["AI Fraud Center"]
        LedgerUI["Transaction Ledger"]
    end

    subgraph Backend ["Node.js + Express Orchestration Core (Port 5001)"]
        Server["Express API Server"]
        AuthMiddleware["JWT Authentication & RBAC"]
        CurrencyEng["Dynamic FX Engine\n(20+ Currencies + Spread)"]
        CompatEng["Corridor Compatibility &\nSanctions (OFAC)"]
        RouterService["Rule-Based Routing Engine"]
        RecoveryEng["Cascading Recovery Engine\n(Soft Decline Failover)"]
        DBBridge["Dual-Engine Data Layer\n(PostgreSQL / Supabase + Embedded)"]
    end

    subgraph Intelligence ["Python + FastAPI Microservice (Port 8000)"]
        FastAPIApp["FastAPI Server"]
        FraudEngine["AI Fraud Risk Scoring\n(Velocity, Geo-mismatch, Anomaly)"]
        RoutingOptimizer["Multi-Factor Route Scoring\n(Cost, Latency, Success Rate)"]
        RecoveryAnalyzer["Decline Taxonomy Analyzer\n(Soft vs. Hard Declines)"]
    end

    subgraph Rails ["Connected Payment Rails"]
        Stripe["Stripe Global\n(Cards, Apple/Google Pay)"]
        Adyen["Adyen Enterprise\n(SEPA Direct Debit, iDEAL)"]
        PayPal["PayPal Sandbox\n(REST API + Simulation)"]
        UPI["Razorpay / UPI India\n(Instant Dynamic QR & VPA)"]
        DLocal["dLocal Emerging Corridors\n(Brazil Pix, Oxxo)"]
    end

    UI -->|REST / JSON| Server
    Server --> AuthMiddleware
    Server --> CurrencyEng
    Server --> CompatEng
    Server --> RouterService
    Server --> RecoveryEng
    Server --> DBBridge

    RouterService <-->|HTTP / Fast Timeout| FastAPIApp
    RecoveryEng <-->|HTTP / Fast Timeout| FastAPIApp
    Server <-->|HTTP / Risk Scoring| FastAPIApp

    FastAPIApp --> FraudEngine
    FastAPIApp --> RoutingOptimizer
    FastAPIApp --> RecoveryAnalyzer

    RouterService --> Stripe
    RouterService --> Adyen
    RouterService --> PayPal
    RouterService --> UPI
    RouterService --> DLocal

    RecoveryEng -.->|Automatic Failover Cascade| Adyen
    RecoveryEng -.->|Automatic Failover Cascade| Stripe
    RecoveryEng -.->|Automatic Failover Cascade| PayPal
```

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **1. Professional FinTech Landing Page** | Hero section with live animated corridor calculator, interactive ROI savings calculator, architecture pillars, and unified rail matrix. |
| **2. Login & Registration** | Secure JWT authentication with bcrypt password hashing, merchant role management, and 1-click **Instant Evaluator Demo Login**. |
| **3. Customer Dashboard with Analytics** | Gross volume, conversion rate (%), smart routing cost savings ($), fraud blocked rate, volume velocity chart, and live provider health monitoring. |
| **4. International Payment Checkout** | Dynamic country selector (15+ countries), real-time FX pricing, automated 3-D Secure (PSD2) challenges, and India UPI QR / VPA simulation. |
| **5. Payment Compatibility Engine** | Regulatory checks for EU PSD2 Strong Customer Authentication, India RBI tokenization, Brazil Pix CPF compliance, and FATF/OFAC sanctions blacklist blocks. |
| **6. Currency Conversion Engine** | Live rates for 20+ currencies base USD, configurable merchant markup spread (0.5%–15%), and fee transparency breakdown. |
| **7. Intelligent Payment Routing** | Rule-based routing engine evaluating cost, latency, success rates, and currency affinity with merchant-customizable priority rules. |
| **8. Real-Time Fraud Detection** | Python microservice scoring risk (0–100) based on transaction velocity bursts, IP geolocation vs. billing mismatches, burner emails, and amount anomalies. |
| **9. Failed Payment Recovery** | Decline categorization into soft vs. hard declines; automatically executes zero-friction instant failover cascades to secondary gateways. |
| **10. Transaction Ledger & Audit Trail** | Paginated searchable table with multi-factor filters (status, currency, provider), one-click CSV/JSON exports, and detailed step-by-step routing timeline modal. |
| **11. Provider Comparison Matrix** | Side-by-side benchmark comparing Stripe, Adyen, PayPal, Razorpay UPI, and dLocal across fees, cross-border markups, latencies, and uptime SLAs. |
| **12. Responsive Dark/Light UI** | Built with Tailwind CSS, smooth color transitions, persistent `localStorage` theme state, and mobile responsive drawer navigation. |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Backend API**: Node.js, Express, Helmet, CORS, jsonwebtoken, bcryptjs
- **Database**: PostgreSQL / Supabase compatible (with automatic resilient embedded fallback for zero-dependency local testing)
- **Intelligence Microservice**: Python 3.11+, FastAPI, Uvicorn, Pydantic
- **Payment Providers**:
  - PayPal Sandbox (Live REST API integration when credentials are configured; otherwise high-fidelity sandbox simulator)
  - Stripe Global Simulator (with 3-D Secure challenge test cards and decline codes)
  - Adyen European & Global Simulator (SEPA Direct Debit & iDEAL)
  - Razorpay / UPI India Simulator (Dynamic QR and VPA validation)
  - dLocal Emerging Corridors Simulator (Brazil Pix and Latin America rails)

---

## ⚡ Quickstart Guide

### Prerequisites

- **Node.js**: v18+ (tested on Node v20/v26)
- **npm**: v9+
- **Python**: 3.10+ (with `pip`)

### 1. Clone & Setup Workspace

```bash
cd international-payment-orchestration
cp .env.example .env
npm run setup
```

### 2. Seed Database

```bash
npm run seed
```

This seeds:
- Default demo merchant: `merchant@example.com` / `Password123!`
- Active routing rules for India UPI, European SEPA, and Global Cards
- 5 configured payment provider profiles
- 10 realistic past cross-border transactions with audit traces

### 3. Run Development Servers

Open 3 terminal tabs or run services:

```bash
# Tab 1: Python FastAPI Intelligence Microservice (Port 8000)
npm run dev:python

# Tab 2: Node.js Express Orchestration Backend (Port 5001)
npm run dev:backend

# Tab 3: React + Vite Frontend (Port 5173)
npm run dev:frontend
```

Now open **http://localhost:5173** in your browser!

---

## 🧪 Testing

The platform includes full test suites covering both the Python Intelligence Microservice and the Node.js Express Backend.

```bash
# Run all tests (Python + Node.js)
npm test

# Or run separately:
npm run test:python    # 9 unit tests for fraud, routing, and recovery
npm run test:backend   # 9 integration tests for endpoints, checkout, and cascading
```

---

## 💳 Test Payment Credentials

When using the **Live Checkout Page**, you can use these test values to observe orchestration and cascading recovery in real time:

| Test Card / Input | Scenario | Expected Behavior |
|---|---|---|
| `4242 4242 4242 4242` | Clean Global Card | Frictionless instant settlement via primary gateway. |
| `4000 0000 0000 3000` | 3DS SCA Trigger | Prompts interactive OTP modal to simulate bank authentication. |
| `4000 0000 0000 0003` | Network Timeout | **Triggers automated cascading recovery** to secondary gateway! |
| `4000 0000 0000 0002` | Insufficient Funds | Soft decline; queued for scheduled smart retry. |
| `4000 0000 0000 0005` | Stolen Card | Hard decline; flagged by risk engine and terminated. |
| `vikram@okhdfcbank` | UPI (India INR) | Routes directly to Razorpay UPI with 0.5% capped fee. |
| `North Korea (KP)` | Sanctioned Country | Blocked immediately under OFAC/FATF sanctions compliance. |

---

## 🌐 Environment Variables

See `.env.example` for the complete template:

```env
# Node.js Backend Server
PORT=5001
JWT_SECRET=super-secret-jwt-key-replace-in-production-min-32-chars-long
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL / Supabase)
# Leave blank to use the embedded fallback database automatically
DATABASE_URL=

# Python Intelligence Microservice
PYTHON_SERVICE_URL=http://localhost:8000
INTELLIGENCE_SERVICE_TIMEOUT_MS=3000

# PayPal Sandbox (Optional)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:5001/api
```

---

## 🗄️ Database Setup (PostgreSQL / Supabase)

To connect to a managed PostgreSQL database or Supabase project:

1. Obtain your connection URI: `postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB_NAME]`
2. Add it to `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
   ```
3. Run `npm run seed` to automatically execute `schema.sql` and seed initial records.
4. If no `DATABASE_URL` is provided, ATLAS.PAY runs with an embedded persistent local store (`backend/src/db/local_store.json`), allowing instant evaluation without requiring external infrastructure.

---

## 🔒 Security Best Practices

- **Never Exposes Secrets**: Sensitive credentials and card details are sanitized before logging.
- **Zero Raw PAN Storage**: Complies with PCI-DSS guidelines by storing only gateway reference IDs and card brand/last4.
- **Strict Network Timeouts**: Microservice calls include abort signals to prevent thread starvation during downstream gateway outages.
- **Sanction Screening**: Automated pre-routing checks against FATF / OFAC trade restriction lists.

---

## 📄 License

MIT License. Developed for enterprise international payment orchestration.
