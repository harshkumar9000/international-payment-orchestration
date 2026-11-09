# ATLAS.PAY — International Payment Orchestration Platform

> **"Smarter Payments. Borderless Possibilities."**

[![Test Suite](https://img.shields.io/badge/Tests-32%2F32%20Passing-brightgreen?style=flat-square)](#testing--verification)
[![Python Tests](https://img.shields.io/badge/Python%20Intelligence-20%2F20%20Pass-teal?style=flat-square&logo=python)](#testing--verification)
[![Node Tests](https://img.shields.io/badge/Node%20Backend-12%2F12%20Pass-blue?style=flat-square&logo=node.js)](#testing--verification)
[![Frontend](https://img.shields.io/badge/React%2018%20%7C%20Vite%20%7C%20Tailwind-Passing-61DAFB?style=flat-square&logo=react)](#technology-stack)
[![Design](https://img.shields.io/badge/Design-Atlas%20FinTech%20%2F%20Navy%20%26%20Teal-14B8A6?style=flat-square)](#uiux-redesign--design-system)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase%20%2B%20Zero--Config%20JSON-336791?style=flat-square&logo=postgresql)](#dual-engine-data-layer)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#)

ATLAS.PAY is an enterprise-grade, multi-rail **International Payment Orchestration Platform** that bridges the domestic-to-global payment divide. It unifies international gateways (**Stripe, Adyen, PayPal, Razorpay, dLocal**), unlocks cross-border Indian rails (**RuPay Global BINs and NIPL Bilateral UPI corridors**), enforces **Under-18 student financial guardrails with parent consent**, and eliminates false client chargebacks using **autonomous agentic refunds with idempotency protection**.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph UI ["Frontend Experience (React 18 + Vite + Tailwind CSS + Recharts)"]
        Landing["Landing Page\n(Brand & ROI Calculator)"]
        Sidebar["Collapsible Sidebar\n(13 Dashboard Pages)"]
        RoleSwitcher["Perspective Switcher\n(Merchant | Student | Guardian)"]
        DashView["Overview Dashboard & Analytics"]
        CheckoutView["Live Multi-Rail Checkout"]
        CompatView["Domestic & Global Rails Inspector"]
        StudentView["Under-18 Student Hub"]
        GuardianView["Parent / Guardian Approval Portal"]
        RefundView["Agentic Refund & Recovery Center"]
    end

    subgraph CoreBackend ["Node.js + Express Orchestration Core (Port 5001)"]
        Server["Express API Server"]
        AuthRBAC["JWT Auth & Role-Based Access"]
        DomesticService["Domestic Card & TCS Service"]
        StudentService["Student & Guardian Service"]
        AgenticRefundService["Agentic Refund Engine\n(Idempotency & Gateway Sync)"]
        RouterEngine["Rule-Based Routing & Cascading"]
        CurrencyEngine["20+ Currency FX Engine & Spread"]
        DBLayer["Dual-Engine Data Layer\n(Supabase / PostgreSQL + JSON Fallback)"]
    end

    subgraph IntelligenceService ["Python + FastAPI Intelligence Service (Port 8000)"]
        FastAPI["FastAPI High-Speed Service"]
        DomesticCardPy["RuPay Global BIN & UPI Corridors"]
        StudentEnginePy["Minor Age Verification & MCC Policy"]
        AgenticRefundPy["Autonomous Provider State Auditor"]
        FraudPy["AI Fraud Scoring (Geo, Anomaly, Velocity)"]
        SmartRoutingPy["Route Optimization & Least-Cost Routing"]
    end

    subgraph GatewayRails ["Payment Gateways & Real/Simulated Rails"]
        PayPalReal["PayPal Sandbox REST API v2\n(Real Credentials)"]
        StripeSim["Stripe Global (Simulated)"]
        AdyenSim["Adyen EU SEPA / iDEAL (Simulated)"]
        RazorpaySim["Razorpay & UPI Bilateral Link (Simulated)"]
        DLocalSim["dLocal LATAM / Pix (Simulated)"]
    end

    UI --> CoreBackend
    CoreBackend <--> IntelligenceService
    CoreBackend --> GatewayRails
```

---

## 📖 Plain-English Glossary: How It Works

For college students, parents, small business owners, and judges without a technical background, here is what these common terms mean in ATLAS.PAY:

| Technical Term | Everyday Explanation |
| :--- | :--- |
| **Payment Orchestration** | A system that coordinates multiple payment providers (like Stripe, PayPal, and Adyen) and automatically picks the best one for each transaction. |
| **Payment Provider** | A company or financial service that processes payments between customers and businesses. |
| **Smart Routing** | An automated decision engine that chooses the most cost-effective and reliable payment provider for each payment based on currency, country, and card type. |
| **Currency Conversion (FX)** | Converting money from one currency to another (for example, US Dollars to Indian Rupees). |
| **Conversion Spread / Markup** | A small percentage (e.g. 1.25%) added to market exchange rates to protect businesses from currency fluctuations. |
| **3D Secure (3DS)** | An extra security step required by banks (such as an SMS code or banking app approval) to verify the cardholder. |
| **Card BIN (Bank Identification Number)** | The first 6 digits of a card that identify which bank and card network issued it (for example, identifying international RuPay Global vs. domestic-only cards). |
| **TCS (Tax Collected at Source)** | An Indian government tax collected on foreign money transfers under the RBI Liberalised Remittance Scheme (5% for education, 20% for general purchases above ₹7 Lakh). |
| **Merchant Category Code (MCC)** | A 4-digit code identifying what a business sells, used by ATLAS.PAY to ensure students only spend on approved educational merchants. |
| **Idempotency Protection** | A safety safeguard ensuring that if a network glitch causes a refund or payment to be sent twice, it is only processed once. |
| **Webhooks** | Real-time automated notifications sent to your server as soon as an event happens (like a successful payment or refund). |
| **Fraud Score (0 to 100)** | A security score assessing the risk of a payment. Lower is safer (under 30 is normal; over 80 is blocked as suspicious). |

---

## 🚀 Key Features Breakdown (In Plain English)

### 1. Domestic Card & UPI Integration for International Payments
Indian shoppers and businesses frequently face declined payments when using domestic instruments for overseas purchases. ATLAS.PAY provides:
- **RuPay Global BIN Compatibility**: Distinguishes between RuPay Global cards co-badged with Discover/JCB/Diners Club (BINs `6521xx`, `6522xx`) and domestic-only PMJDY cards (BINs `6070xx`, `6071xx`).
- **NIPL Bilateral UPI International Corridors**: Verifies authorized merchant QR and fast-payment corridors across Singapore (PayNow), UAE (NeoPay / Mashreq), France (Lyra Network / Galeries Lafayette / Eiffel Tower), Mauritius (MauCAS), Nepal, and Bhutan.
- **Explicit Ineligibility Guardrails**: Ineligible cards or unsupported corridors (such as UPI to the United States) are surfaced immediately with clean explanations and auto-suggested alternatives (Visa, Mastercard, Amex, PayPal).
- **RBI LRS & TCS Tax Engine**: Automatically calculates Tax Collected at Source (TCS) under the Reserve Bank of India Liberalised Remittance Scheme ($250,000 USD cap):
  - Education tuition: 5% above ₹7 Lakh INR (or 0.5% with education loan)
  - Medical remittance: 5% above ₹7 Lakh INR
  - General foreign ecommerce / leisure: 20% TCS with itemized GST (18% on service fees).

### 2. Under-18 and Student Payment Support
A purpose-built financial empowerment module for students studying abroad or enrolling in international courses:
- **Minor DOB & Age Verification**: Detects minor status (e.g. 17-year-old student) and links the account to a verified parent or legal guardian.
- **Guardian Approval Workflow**: Any high-value international transaction or transaction above the auto-approval threshold ($50 USD) triggers a real-time consent request in the Parent/Guardian portal.
- **Velocity & Spending Caps**: Configurable Daily ($100), Weekly ($250), and Monthly ($500) spending allowances with live progress gauges.
- **Merchant Category Whitelisting (MCC)**: Permitted categories include verified education (`Coursera`, `edX`, `Harvard CS50`, `Duolingo Super`, certifications, academic libraries). Strictly blocks prohibited categories (gambling, cryptocurrency, alcohol, and adult content).

### 3. Agentic Refund & Payment Recovery
Autonomous AI agent that resolves stuck, pending, or orphaned transactions:
- **Provider Ground-Truth Verification**: Never refunds solely based on client-side errors. The agent queries the payment provider's ledger directly to determine whether the transaction was actually `CAPTURED` versus `FAILED_NO_DEBIT`.
- **SHA-256 Idempotency Protection**: Every refund action generates a deterministic idempotency key (`idem_<sha256>`), preventing duplicate payouts even under concurrent webhook retries.
- **Tier-2 Compliance Escalation**: Autonomous auto-refund executes instantly for low/medium value stuck charges; charges exceeding **$500 USD** are automatically routed to a Human Compliance Review Queue.
- **Comprehensive Audit Trail**: Records complete JSON rationale, timestamp, provider transaction IDs, and agent confidence scores.

---

## 🎨 UI/UX Redesign & Design System

Visual aesthetics inspired by modern AI FinTech dashboards:

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Deep Navy** | `#111827` | Primary Dark Background, Card Contrast, Sidebar |
| **Teal** | `#14B8A6` | Primary Action, Highlights, Gradients, Brand Accents |
| **Mint** | `#D1FAE5` | Success Indicators, Badges, Positive Trends |
| **Amber** | `#F59E0B` | Warning Alerts, TCS Highlights, Recovery Queue |
| **Background** | `#F8FAFC` | Light Mode Slate Background |
| **White** | `#FFFFFF` | Card Surfaces, High-Contrast Typography |

### The 13 Dashboard Pages (Simplified & Accessible):
1. **Dashboard Overview** (`/dashboard`): Real-time snapshot of business volume, 96.4% payment success rate, automatic refund counter, provider health, and fee savings.
2. **Payment Checkout** (`/checkout`): Guided 6-step international checkout supporting RuPay Global, UPI QR codes, student education discounts, and failover recovery.
3. **Indian Cards & UPI Checker** (`/compatibility`): Instant tool to test whether an Indian RuPay card or UPI account works internationally, with transparent TCS tax breakdown.
4. **Choose Best Payment Provider (Smart Routing)** (`/routing`): Intelligent rule builder and interactive payment simulator that automatically chooses the lowest-fee provider.
5. **Student Payments (Under-18)** (`/student`): Safe portal for students to pay for international courses, view monthly spending limits, and request parent approval.
6. **Parent Approval Portal** (`/guardian`): Real-time guardian portal to review and approve child purchases with 1 click, set spending limits, and approve merchants.
7. **Automatic Refund Assistant** (`/agentic-refund`): AI assistant that detects interrupted payments, checks the provider's ledger directly, and safely refunds customers.
8. **Suspicious Payment Shield (Fraud Check)** (`/fraud`): AI security system that analyzes payment risk (0-100) and blocks stolen cards and scams before they process.
9. **Currency Conversion & Exchange Rates** (`/currency`): Live market conversion rates across 20+ currencies, customer price preview, and conversion fee settings.
10. **Business Reports & Performance** (`/analytics`): Clear charts showing payment volume by currency, provider speeds, and total money saved on processing fees.
11. **Payment Providers** (`/providers`): Side-by-side comparison of fees, speeds, and country strengths, with 1-click toggles to enable or pause providers.
12. **Payment History** (`/transactions`): Filterable record of all completed, recovered, and blocked payments with step-by-step audit timelines.
13. **Platform Settings & Controls** (`/settings`): Business profile settings, smart routing priorities, secure API keys, and test notification dispatchers.

---

## 🔌 Real vs. Simulated Integrations

To ensure transparency and compliance with financial guidelines:

| Provider / Rail | Mode | Integration Details |
| :--- | :--- | :--- |
| **PayPal** | **Real Sandbox / Simulated** | Real PayPal Sandbox REST API v2 client implemented. When `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are provided in `.env`, real sandbox orders are created and captured. Otherwise, seamlessly falls back to high-fidelity simulation. |
| **Stripe** | **Simulated** | Simulates card tokenization, 3DS challenges, webhooks, soft decline responses (`network_timeout`, `insufficient_funds`), and refund API. |
| **Adyen** | **Simulated** | Simulates European SEPA, iDEAL, local acquiring routing, and cross-border settlement. |
| **Razorpay / UPI** | **Simulated** | Simulates Indian UPI QR code issuance, VPA validation, and NIPL bilateral corridor links. |
| **dLocal** | **Simulated** | Simulates LATAM local payment methods including Brazil Pix and local card acquiring. |
| **Foreign Exchange Rates** | **Real Benchmark** | 20+ real currency market benchmark rates (USD, EUR, GBP, INR, JPY, CAD, AUD, BRL, SGD, AED, etc.) with configurable merchant spread. |
| **Python Intelligence** | **Live Microservice** | Real FastAPI service running risk scoring, rule optimization, RuPay BIN classification, and agentic decision models. |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Recharts, Lucide React, Axios.
- **Backend Core**: Node.js v20+, Express, REST APIs, JSON Web Tokens (JWT), Node Test Runner.
- **Intelligence Microservice**: Python 3.11+, FastAPI, Uvicorn, Pydantic, Python Unittest.
- **Database Layer**: PostgreSQL / Supabase ready via `pg`. Includes an automated zero-config persistent JSON database (`backend/src/db/local_store.json`) that works out of the box with zero external dependencies.

---

## 🚦 Getting Started & Exact Commands

### Prerequisites
- **Node.js** v18+ (tested on v20 and v26)
- **Python** 3.9+ (tested on 3.11/3.13)
- **npm** v9+

### 1. Installation
Clone the repository and install dependencies for all services:
```bash
# 1. Root dependencies (concurrently runner)
npm install

# 2. Backend dependencies
npm --prefix backend install

# 3. Frontend dependencies
npm --prefix frontend install

# 4. Python dependencies (optional virtualenv or direct)
pip3 install -r intelligence_service/requirements.txt
```

### 2. Environment Configuration
Copy the template configuration:
```bash
cp .env.example .env
cp .env.example backend/.env
```

### 3. Seed Database
Seed initial merchants, providers, routing rules, student accounts, guardian approvals, and stuck orphaned transactions:
```bash
npm run seed
```

### 4. Run the Full Stack
Launch all three services simultaneously (Node.js backend, Python FastAPI intelligence service, and React frontend) with a single command:

```bash
npm run dev
```

Or execute the provided launcher script:
```bash
chmod +x run.sh
./run.sh
```

### Service Endpoints:
- **Frontend Application**: `http://localhost:5173`
- **Node.js Backend API**: `http://localhost:5001/api`
- **Backend Health Check**: `http://localhost:5001/api/health`
- **Python FastAPI Service**: `http://localhost:8000/docs` (Interactive Swagger Docs)

---

## 🧪 Testing & Verification

Run the complete test suite (both Python Intelligence engine and Node.js Backend integration tests):

```bash
npm test
```

### Individual Test Commands:
```bash
# Run Python intelligence microservice tests (20 unit tests)
npm run test:python

# Run Node.js backend integration tests (12 API tests)
npm run test:backend

# Test frontend production build
npm --prefix frontend run build
```

**Results:**
- Python Intelligence Suite: **20/20 passed** (Fraud, Routing, Recovery, Domestic Card, Agentic Refund, Student Engine)
- Node.js API Suite: **12/12 passed** (Health, Auth, Currency, Compatibility, Checkout, Recovery Cascade, Domestic Card, Agentic Refund, Student/Guardian)
- Frontend Build: **100% clean production bundle** via Vite.

---

## 📚 Complete REST API Reference

### Authentication & Merchant
- `POST /api/auth/register` — Register a new merchant profile.
- `POST /api/auth/login` — Authenticate and receive JWT.
- `POST /api/auth/demo-login` — Instant single-click demo authentication.
- `GET /api/auth/me` — Retrieve authenticated merchant profile.

### Domestic Card & UPI Rails (Feature 1)
- `POST /api/domestic-card/check-eligibility` — Check RuPay Global vs PMJDY eligibility, NIPL bilateral UPI support, and TCS breakdown.
- `GET /api/domestic-card/supported-rails` — List active NIPL bilateral corridors (Singapore, UAE, France, Mauritius) and co-branded networks.
- `POST /api/domestic-card/tcs-calculator` — Calculate RBI LRS TCS withholding based on remittance purpose (Education 5% vs General 20%).

### Under-18 & Student Payments (Feature 2)
- `GET /api/student/profile?student_id={id}` — Fetch student profile, minor indicator, spending limits, and guardian info.
- `POST /api/student/verify-intent` — Submit educational payment intent with minor DOB and MCC validation.
- `GET /api/guardian/pending-approvals?guardian_id={id}` — Fetch pending approvals for guardian.
- `POST /api/guardian/approve/:id` — Guardian authorizes transaction; dispatches to payment rail.
- `POST /api/guardian/reject/:id` — Guardian rejects transaction with compliance reason.
- `PUT /api/student/limits` — Update student daily, weekly, and monthly limits.

### Agentic Refund & Recovery (Feature 3)
- `GET /api/agentic-refund/history` — Retrieve past automated refund records and audit status.
- `POST /api/agentic-refund/analyze/:transaction_id` — Autonomous agent queries gateway ledger and generates decision with idempotency key.
- `POST /api/agentic-refund/execute/:transaction_id` — Issue verified refund to provider API with duplicate protection.
- `GET /api/agentic-refund/approvals-queue` — View transactions >$500 USD awaiting human compliance review.
- `POST /api/agentic-refund/approve-manual/:id` — Approve or reject high-value refund in compliance queue.

### Checkout & Orchestration
- `POST /api/checkout/initiate` — Initiate payment, run fraud check, verify student intent, select optimal provider.
- `POST /api/checkout/process` — Process debit, handle 3DS, cascade on soft decline, or route to guardian approval.
- `GET /api/transactions` — Search and filter transaction ledger.
- `GET /api/transactions/:id` — View full transaction details.
- `POST /api/routing/simulate` — Test route selection without executing financial charge.
- `GET /api/providers/benchmark` — Provider comparison matrix.
- `GET /api/analytics/metrics` — Aggregate gross volume, success rate, and smart routing savings.
- `GET /api/analytics/volume-chart` — Daily volume and transaction count timeline.
- `GET /api/currency/rates` — Live currency exchange rates.
- `POST /api/currency/convert` — Currency conversion with transparent spread breakdown.

---

## 📁 Repository Structure & Modified Files

```
international-payment-orchestration/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── db.js                     # Dual-engine DB (PostgreSQL + JSON fallback)
│   │   │   ├── schema.sql                # Complete SQL schema with new tables
│   │   │   └── seed.js                   # Seed data generator
│   │   ├── routes/
│   │   │   ├── agenticRefund.routes.js   # [NEW] Agentic refund & compliance endpoints
│   │   │   ├── analytics.routes.js       # Merchant analytics & provider health
│   │   │   ├── auth.routes.js            # JWT login, register, demo login
│   │   │   ├── checkout.routes.js        # [UPGRADED] RuPay & student aware checkout
│   │   │   ├── compatibility.routes.js   # Corridor compatibility & OFAC sanctions
│   │   │   ├── currency.routes.js        # FX rates & currency converter
│   │   │   ├── domesticCard.routes.js    # [NEW] Domestic card & UPI NIPL routes
│   │   │   ├── fraud.routes.js           # AI fraud evaluation & attack presets
│   │   │   ├── guardian.routes.js        # [NEW] Parent / Guardian approval routes
│   │   │   ├── providers.routes.js       # Provider benchmark matrix
│   │   │   ├── recovery.routes.js        # Cascading recovery engine routes
│   │   │   ├── routing.routes.js         # Routing rule builder & simulator
│   │   │   ├── student.routes.js         # [NEW] Under-18 student payment routes
│   │   │   ├── transactions.routes.js    # Ledger list, detail, export
│   │   │   └── webhooks.routes.js        # [NEW] Incoming webhook listener
│   │   ├── services/
│   │   │   ├── agenticRefund.service.js  # [NEW] Idempotent refund orchestrator
│   │   │   ├── domesticCard.service.js   # [NEW] RuPay BIN & TCS calculator
│   │   │   ├── pythonBridge.service.js   # [UPGRADED] Python bridge with transparent JS fallbacks
│   │   │   ├── studentPayment.service.js # [NEW] Student intent & limit validator
│   │   │   └── paymentProviders/         # Stripe, Adyen, PayPal, Razorpay, dLocal
│   │   └── server.js                     # Express server mounting all routes
│   └── tests/
│       └── api.test.js                   # 12 Node.js integration tests
├── intelligence_service/
│   ├── agentic_refund_engine.py          # [NEW] Provider ground-truth auditor & idempotency generator
│   ├── domestic_card_engine.py           # [NEW] RuPay Global BIN & UPI corridor engine
│   ├── student_payment_engine.py         # [NEW] Minor age verification & MCC compliance
│   ├── fraud_engine.py                   # Rule-based ML fraud scoring
│   ├── routing_optimizer.py              # Dynamic cost & SLA route selector
│   ├── recovery_engine.py                # Soft decline cascade classifier
│   ├── main.py                           # FastAPI application & metadata routes
│   ├── requirements.txt                  # Python dependencies
│   └── test_intelligence.py              # 20 Python unit tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardHeader.jsx       # [NEW] Breadcrumbs, role pills, quick checkout
│   │   │   ├── Footer.jsx                # [UPGRADED] Atlas FinTech footer
│   │   │   ├── Navbar.jsx                # [UPGRADED] Atlas top navigation bar
│   │   │   └── Sidebar.jsx               # [NEW] Collapsible sidebar across 13 pages
│   │   ├── pages/
│   │   │   ├── AgenticRefundPage.jsx     # [NEW] Feature 3: Agentic Refund Center
│   │   │   ├── AnalyticsPage.jsx         # [NEW] Page 10: Recharts Merchant Analytics
│   │   │   ├── CheckoutPage.jsx          # [UPGRADED] Page 2: RuPay, UPI, Student Checkout
│   │   │   ├── CurrencyEnginePage.jsx    # Page 9: FX & Markup Engine
│   │   │   ├── DashboardPage.jsx         # [UPGRADED] Page 1: AI Overview Dashboard
│   │   │   ├── FraudDashboardPage.jsx    # Page 8: AI Fraud Shield
│   │   │   ├── LandingPage.jsx           # [UPGRADED] FinTech Landing & ROI Calculator
│   │   │   ├── LoginPage.jsx             # Merchant Sign-In
│   │   │   ├── ParentApprovalPage.jsx    # [NEW] Feature 2: Guardian Portal
│   │   │   ├── PaymentCompatibilityPage.jsx # [NEW] Feature 1: Domestic Card & UPI Rails
│   │   │   ├── ProvidersPage.jsx         # Page 11: Multi-Gateway Benchmarks
│   │   │   ├── RegisterPage.jsx          # Merchant Registration
│   │   │   ├── RoutingRulesPage.jsx      # Page 4: Smart Routing Rules
│   │   │   ├── SettingsPage.jsx          # [NEW] Page 13: Platform Settings & Webhooks
│   │   │   ├── StudentPaymentsPage.jsx   # [NEW] Feature 2: Under-18 Student Hub
│   │   │   └── TransactionsPage.jsx      # Page 12: Transaction Ledger
│   │   ├── services/
│   │   │   └── api.js                    # [UPGRADED] Unified Axios client with all API namespaces
│   │   ├── App.jsx                       # [UPGRADED] Dynamic dashboard shell & routing
│   │   ├── index.css                     # [UPGRADED] Atlas palette styles & shadows
│   │   └── tailwind.config.js            # [UPGRADED] Deep Navy, Teal, Mint, Amber tokens
│   └── package.json                      # Added recharts dependency
├── .env.example                          # [UPGRADED] Full configuration template
├── package.json                          # Unified npm run dev and test scripts
├── run.sh                                # Executable service launcher
└── README.md                             # Comprehensive project documentation
```

---

## 🔒 Security & Compliance Standards

- **Zero Cardholder Storage**: Raw primary account numbers (PAN) and CVV codes are never stored on disk or written to database tables.
- **Idempotency Guarantee**: All automated refunds use a deterministic SHA-256 hash preventing duplicate debits/credits during network retries.
- **Sanctions & OFAC Screening**: Built-in blocking of sanctioned jurisdictions and high-risk financial corridors.
- **RBI LRS & Section 206C(1G) Compliance**: Strict accounting of Tax Collected at Source (TCS) on foreign outward remittances with appropriate rate differentiation.
- **Under-18 Safety Mandate**: Minor consent and category isolation strictly prevents non-educational expenditure for users under 18 years of age.

---

## 📜 License
MIT License. Developed for hackathons and enterprise payment architecture demonstrations.
