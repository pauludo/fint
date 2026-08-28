# FinTrack AI — Autonomous Personal Wealth & Finance Intelligence

A full-featured personal finance tracker web application built with **React 18**, **Tailwind CSS**, **Recharts**, **Node.js/Express**, **SQLite/PostgreSQL database**, and a built-in **Anthropic Claude AI** financial assistant.

---

## 🌟 Key Features

### 1. Accounts & Multi-Currency Ledger
- **Multiple Accounts**: Checking, High-Yield Savings, Credit Cards, Cash Wallets, Investments.
- **Transactions Management**: Add, edit, delete, search, sort, and filter by date, category, account, and type (income/expense).
- **Bulk Operations**: Bulk delete and bulk-recategorize multiple transactions in one click.
- **Bank Statement CSV Import**: Drag & drop statement importer with auto-matching category engine and duplicate protection.
- **CSV & PDF Statement Export**: Export filtered transactions or print executive summary statements.
- **Multi-Currency Converter**: Live toggle between USD ($), EUR (€), GBP (£), CAD (CA$), NGN (₦), and JPY (¥).

### 2. Category Budgets & Rollover Protections
- **Monthly Category Limits**: Visual status indicators (Safe <70%, Warning 70-99%, Over limit >100%).
- **Unused Budget Rollover**: Automatically carry unspent balances forward to next month.
- **AI 3-Month Budget Generator**: Analyzes 3 months of actual spending to suggest realistic, editable category limits.

### 3. Dashboard Overview & Analytics
- **Live Net Worth Tracker**: Assets vs. Liabilities breakdown with monthly delta.
- **Interactive Cash Flow Comparison**: 6-month Income vs. Expense bar and area charts via Recharts.
- **Spending by Category Donut**: Donut visualizer with percentage breakdowns.
- **Upcoming Bills**: Renewal alerts for services renewing within 7–14 days.

### 4. Recurring Transactions & Subscriptions
- **Subscription Tracker**: Tracks billing cycles, renewal dates, monthly burn rate, and annual forecast.
- **Auto-Detect Recurring Engine**: Scans past 90 days of transactions for repeating merchant charges.

### 5. Goals & Debt Payoff Tracker
- **Savings Milestones**: Target deadlines, progress bars, and confetti celebration on completion.
- **Debt Payoff Engine**: Simulates Snowball vs. Avalanche strategies with interest savings and payoff timeline estimates.

### 6. "Ask Your Finances" AI Assistant (Claude Integration)
- **Natural-Language Financial Q&A**: Answers questions grounded directly in user's real transactions, accounts, and budgets.
  - *"How much did I spend on food last month compared to the month before?"*
  - *"What's my biggest unnecessary expense this year?"*
  - *"Am I on track to hit my emergency fund goal by December?"*
- **Weekly Proactive Insights**: Automatically surfaces anomaly spikes, subscription burn, and budget alerts on the dashboard.
- **Actionable AI Proposals**: Returns structured suggestion cards (e.g. *Apply $350 Dining Budget*, *Deposit to Emergency Fund*) with 1-click user approval before saving to the database.
- **Smart Fallback Engine**: Works out-of-the-box with or without an Anthropic API key.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 1. Installation
Install root, server, and client dependencies:
```bash
npm run install:all
```

### 2. Configure Environment (Optional)
In `server/.env`:
```env
PORT=5000
JWT_SECRET=fintrack_super_secret_jwt_key_2026_finance
ANTHROPIC_API_KEY=your_optional_claude_api_key_here
```

### 3. Run Development Servers
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🔑 Demo Account Credentials

Use the **1-Click Instant Demo Login** button on the sign-in screen, or use:
- **Email**: `demo@fintrack.ai`
- **Password**: `password123`

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, SQLite (`sqlite3` / `better-sqlite3`), JWT, Multer, CSV Parser
- **AI**: Anthropic Claude SDK (`@anthropic-ai/sdk`) + Local Financial Intelligence Engine
